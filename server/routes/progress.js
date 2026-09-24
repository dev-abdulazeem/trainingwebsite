import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
};

// @route   POST /api/progress/track
// @desc    Track video progress
// @access  Private
router.post(
  '/track',
  authenticate,
  [
    body('lessonId').isUUID().withMessage('Valid lesson ID required'),
    body('watchedSeconds').isInt({ min: 0 }).withMessage('Watched seconds must be positive'),
    body('totalSeconds').optional().isInt({ min: 0 }),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { lessonId, watchedSeconds, totalSeconds } = req.body;
      const userId = req.user.id;

      // Verify lesson exists and user has access
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: { include: { course: true } },
        },
      });

      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found.' });
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId,
          courseId: lesson.module.courseId,
          status: 'ACTIVE',
        },
      });

      if (!enrollment && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Access denied.' });
      }

      // Calculate completion (90% watched = complete)
      const completionThreshold = totalSeconds || lesson.duration || watchedSeconds;
      const isCompleted = watchedSeconds >= completionThreshold * 0.9;

      const progress = await prisma.progress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
        update: {
          watchedSeconds,
          ...(isCompleted && { isCompleted: true, completedAt: new Date() }),
        },
        create: {
          userId,
          lessonId,
          watchedSeconds,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      });

      res.json({
        message: 'Progress updated',
        progress: {
          lessonId: progress.lessonId,
          watchedSeconds: progress.watchedSeconds,
          isCompleted: progress.isCompleted,
          completedAt: progress.completedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/progress/complete
// @desc    Mark lesson as manually complete
// @access  Private
router.post(
  '/complete',
  authenticate,
  [
    body('lessonId').isUUID().withMessage('Valid lesson ID required'),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { lessonId } = req.body;
      const userId = req.user.id;

      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: { include: { course: true } },
        },
      });

      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found.' });
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId,
          courseId: lesson.module.courseId,
          status: 'ACTIVE',
        },
      });

      if (!enrollment && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Access denied.' });
      }

      const progress = await prisma.progress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
        update: {
          isCompleted: true,
          watchedSeconds: lesson.duration || 0,
          completedAt: new Date(),
        },
        create: {
          userId,
          lessonId,
          watchedSeconds: lesson.duration || 0,
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      res.json({
        message: 'Lesson marked as complete',
        progress,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/progress/course/:courseId
// @desc    Get overall course progress
// @access  Private
router.get('/course/:courseId', authenticate, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, title: true, sortOrder: true },
            },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const allLessons = course.modules.flatMap(m => m.lessons);
    const lessonIds = allLessons.map(l => l.id);

    const progress = await prisma.progress.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
      },
    });

    const progressMap = new Map(progress.map(p => [p.lessonId, p]));

    const lessonsWithProgress = allLessons.map(lesson => ({
      ...lesson,
      progress: progressMap.get(lesson.id) || null,
    }));

    const completedCount = progress.filter(p => p.isCompleted).length;
    const percentage = allLessons.length > 0 
      ? Math.round((completedCount / allLessons.length) * 100) 
      : 0;

    res.json({
      courseId,
      totalLessons: allLessons.length,
      completedLessons: completedCount,
      percentage,
      lessons: lessonsWithProgress,
    });
  } catch (error) {
    next(error);
  }
});

export default router;