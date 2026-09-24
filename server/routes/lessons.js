import express from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadVideo, handleUploadError } from '../middleware/upload.js';
import { uploadVideo as uploadVideoToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import fs from 'fs/promises';

const router = express.Router();

const MAX_LESSONS_PER_COURSE = 200; // at least 30 guaranteed — raise freely

const isValidHttpUrl = (str) => {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
};

// ============================================================
// STUDENT / SHARED READ ROUTES (unchanged behavior)
// ============================================================

// @route   GET /api/lessons/module/:moduleId
// @desc    Get all lessons in a module
// @access  Private (Enrolled students + Admin)
router.get('/module/:moduleId', authenticate, async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module) {
      return res.status(404).json({ message: 'Module not found.' });
    }

    if (req.user.role !== 'ADMIN') {
      const enrollment = await prisma.enrollment.findFirst({
        where: { userId: req.user.id, courseId: module.courseId, status: 'ACTIVE' },
      });
      if (!enrollment) {
        return res.status(403).json({ message: 'You are not enrolled in this course.' });
      }
    }

    const lessons = await prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { sortOrder: 'asc' },
      include: {
        resources: { select: { id: true, title: true, fileUrl: true, fileType: true } },
        assignment: { select: { id: true, title: true, dueDays: true } },
        _count: { select: { progress: true } },
      },
    });

    const userProgress = await prisma.progress.findMany({
      where: { userId: req.user.id, lessonId: { in: lessons.map((l) => l.id) } },
    });
    const progressMap = new Map(userProgress.map((p) => [p.lessonId, p]));

    let allPreviousCompleted = true;
    const lessonsWithStatus = lessons.map((lesson, index) => {
      const progress = progressMap.get(lesson.id);
      const isCompleted = progress?.isCompleted || false;
      const isLocked = index > 0 && !allPreviousCompleted;
      if (!isCompleted) allPreviousCompleted = false;

      return {
        ...lesson,
        isCompleted,
        isLocked,
        watchedSeconds: progress?.watchedSeconds || 0,
        _count: undefined,
      };
    });

    res.json({ lessons: lessonsWithStatus });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/lessons/:id
// @desc    Get single lesson with details
// @access  Private (Enrolled students + Admin)
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: true,
            lessons: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, title: true, sortOrder: true },
            },
          },
        },
        resources: true,
        assignment: true,
      },
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    if (req.user.role !== 'ADMIN') {
      const enrollment = await prisma.enrollment.findFirst({
        where: { userId: req.user.id, courseId: lesson.module.courseId, status: 'ACTIVE' },
      });
      if (!enrollment) {
        return res.status(403).json({ message: 'Access denied.' });
      }

      const previousLessons = lesson.module.lessons.filter((l) => l.sortOrder < lesson.sortOrder);
      const previousProgress = await prisma.progress.findMany({
        where: {
          userId: req.user.id,
          lessonId: { in: previousLessons.map((l) => l.id) },
          isCompleted: true,
        },
      });
      if (previousLessons.length > 0 && previousProgress.length !== previousLessons.length) {
        return res.status(403).json({ message: 'Complete previous lessons first.' });
      }
    }

    const progress = await prisma.progress.findUnique({
      where: { userId_lessonId: { userId: req.user.id, lessonId: id } },
    });

    const currentIndex = lesson.module.lessons.findIndex((l) => l.id === id);
    const prevLesson = currentIndex > 0 ? lesson.module.lessons[currentIndex - 1] : null;
    const nextLesson =
      currentIndex < lesson.module.lessons.length - 1
        ? lesson.module.lessons[currentIndex + 1]
        : null;

    res.json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        videoType: lesson.videoType,
        duration: lesson.duration,
        description: lesson.description,
        resources: lesson.resources,
        assignment: lesson.assignment,
        moduleTitle: lesson.module.title,
        courseTitle: lesson.module.course.title,
      },
      progress: progress || { watchedSeconds: 0, isCompleted: false },
      navigation: { previous: prevLesson, next: nextLesson },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// ADMIN WRITE ROUTES — upload a video file OR paste a link
// ============================================================

// @route   POST /api/lessons
// @desc    Create new lesson (multipart: fields + optional 'video' file,
//          OR provide videoUrl field for an external link)
// @access  Private (Admin)
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  uploadVideo.single('video'), // runs first so req.file & text fields are available
  handleUploadError,
  [
    body('moduleId').isUUID().withMessage('Valid module ID required'),
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    body('description').optional().trim(),
    body('videoUrl').optional().trim(),
    body('duration').optional().isInt({ min: 0 }).withMessage('Duration must be a positive integer'),
    body('sortOrder').optional().isInt(),
    body('isPublished').optional().isBoolean(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    const cleanup = () => req.file && fs.unlink(req.file.path).catch(() => {});

    try {
      const { moduleId, title, description, videoUrl, duration, sortOrder, isPublished } = req.body;

      const module = await prisma.module.findUnique({
        where: { id: moduleId },
        select: { id: true, courseId: true },
      });
      if (!module) {
        cleanup();
        return res.status(404).json({ message: 'Module not found.' });
      }

      // Course-wide lesson cap (30+ videos fully supported)
      const lessonCount = await prisma.lesson.count({
        where: { module: { courseId: module.courseId } },
      });
      if (lessonCount >= MAX_LESSONS_PER_COURSE) {
        cleanup();
        return res.status(400).json({
          message: `Course limit reached (${MAX_LESSONS_PER_COURSE} lessons). Raise MAX_LESSONS_PER_COURSE to add more.`,
        });
      }

      // Exactly one source required: file OR link
      if (req.file && videoUrl) {
        cleanup();
        return res.status(400).json({ message: 'Provide either a video file or a link, not both.' });
      }
      if (!req.file && !videoUrl) {
        return res.status(400).json({ message: 'Provide a video file or a video link.' });
      }

      let finalVideoUrl = null;
      let videoPublicId = null;
      let videoType = 'LINK';

      if (req.file) {
        const result = await uploadVideoToCloudinary(req.file.path, {
          folder: 'course-videos',
          eager: [{ streaming_profile: 'hd', format: 'm3u8' }],
          eager_async: true,
        });
        finalVideoUrl = result.eager?.[0]?.secure_url || result.url;
        videoPublicId = result.publicId;
        videoType = 'UPLOAD';
      } else {
        if (!isValidHttpUrl(videoUrl)) {
          return res.status(400).json({ message: 'Video link must be a valid http(s) URL.' });
        }
        finalVideoUrl = videoUrl.trim();
      }

      cleanup();

      let finalSortOrder = sortOrder !== undefined ? parseInt(sortOrder) : undefined;
      if (finalSortOrder === undefined) {
        const lastLesson = await prisma.lesson.findFirst({
          where: { moduleId },
          orderBy: { sortOrder: 'desc' },
        });
        finalSortOrder = lastLesson ? lastLesson.sortOrder + 1 : 0;
      }

      const lesson = await prisma.lesson.create({
        data: {
          moduleId,
          title,
          description,
          videoUrl: finalVideoUrl,
          videoPublicId,
          videoType,
          duration: duration ? parseInt(duration) : 0,
          sortOrder: finalSortOrder,
          isPublished: isPublished === true || isPublished === 'true',
        },
      });

      res.status(201).json({ message: 'Lesson created successfully', lesson });
    } catch (error) {
      cleanup();
      next(error);
    }
  }
);

// @route   PUT /api/lessons/:id
// @desc    Update lesson. Optionally replace video with a new upload,
//          a new link, or clear it entirely (clearVideo=true)
// @access  Private (Admin)
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  uploadVideo.single('video'),
  handleUploadError,
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 3, max: 200 }),
    body('description').optional().trim(),
    body('videoUrl').optional().trim(),
    body('duration').optional().isInt({ min: 0 }),
    body('isPublished').optional().isBoolean(),
    body('releaseDate').optional().isISO8601(),
    body('clearVideo').optional().isBoolean(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    const cleanup = () => req.file && fs.unlink(req.file.path).catch(() => {});

    try {
      const { id } = req.params;
      const existing = await prisma.lesson.findUnique({ where: { id } });
      if (!existing) {
        cleanup();
        return res.status(404).json({ message: 'Lesson not found.' });
      }

      const { title, description, videoUrl, duration, isPublished, releaseDate, clearVideo } = req.body;

      const data = {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(isPublished !== undefined && {
          isPublished: isPublished === true || isPublished === 'true',
        }),
        ...(releaseDate && { releaseDate: new Date(releaseDate) }),
      };

      const removeOldCloudinaryVideo = () =>
        existing.videoPublicId &&
        deleteFromCloudinary(existing.videoPublicId, 'video').catch(() => {});

      if (req.file) {
        // Replace with a fresh upload
        const result = await uploadVideoToCloudinary(req.file.path, {
          folder: 'course-videos',
          eager: [{ streaming_profile: 'hd', format: 'm3u8' }],
          eager_async: true,
        });
        await removeOldCloudinaryVideo();
        data.videoUrl = result.eager?.[0]?.secure_url || result.url;
        data.videoPublicId = result.publicId;
        data.videoType = 'UPLOAD';
      } else if (videoUrl) {
        // Replace with an external link
        if (!isValidHttpUrl(videoUrl)) {
          cleanup();
          return res.status(400).json({ message: 'Video link must be a valid http(s) URL.' });
        }
        await removeOldCloudinaryVideo();
        data.videoUrl = videoUrl.trim();
        data.videoPublicId = null;
        data.videoType = 'LINK';
      } else if (clearVideo === true || clearVideo === 'true') {
        await removeOldCloudinaryVideo();
        data.videoUrl = null;
        data.videoPublicId = null;
        data.videoType = 'NONE';
      }

      cleanup();

      const lesson = await prisma.lesson.update({ where: { id }, data });
      res.json({ message: 'Lesson updated successfully', lesson });
    } catch (error) {
      cleanup();
      next(error);
    }
  }
);

// @route   DELETE /api/lessons/:id
// @desc    Delete lesson (removes Cloudinary video if uploaded)
// @access  Private (Admin)
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  [param('id').isUUID(), handleValidationErrors],
  async (req, res, next) => {
    try {
      const lesson = await prisma.lesson.findUnique({ where: { id: req.params.id } });
      if (!lesson) return res.status(404).json({ message: 'Lesson not found.' });

      if (lesson.videoPublicId) {
        await deleteFromCloudinary(lesson.videoPublicId, 'video').catch(() => {});
      }

      await prisma.lesson.delete({ where: { id: req.params.id } });
      res.json({ message: 'Lesson deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;