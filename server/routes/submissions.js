import express from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
};

// @route   POST /api/submissions
// @desc    Submit assignment
// @access  Private (Students)
router.post(
  '/',
  authenticate,
  [
    body('assignmentId').isUUID().withMessage('Valid assignment ID required'),
    body('content').optional().trim(),
    body('fileUrl').optional().trim().isURL(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { assignmentId, content, fileUrl } = req.body;
      const userId = req.user.id;

      // Get assignment with lesson and course info
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          lesson: {
            include: {
              module: { include: { course: true } },
            },
          },
        },
      });

      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found.' });
      }

      // Check enrollment
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId,
          courseId: assignment.lesson.module.courseId,
          status: 'ACTIVE',
        },
      });

      if (!enrollment) {
        return res.status(403).json({ message: 'You are not enrolled in this course.' });
      }

      // Check if already submitted and pending
      const existingSubmission = await prisma.submission.findFirst({
        where: {
          assignmentId,
          userId,
          status: 'PENDING',
        },
      });

      if (existingSubmission) {
        return res.status(409).json({ 
          message: 'You already have a pending submission for this assignment.',
          submission: existingSubmission,
        });
      }

      // Create submission
      const submission = await prisma.submission.create({
        data: {
          assignmentId,
          userId,
          content: content || null,
          fileUrl: fileUrl || null,
          status: 'PENDING',
        },
      });

      // Create notification for admin
      await prisma.notification.create({
        data: {
          userId: assignment.lesson.module.courseId, // This should be admin ID, fix in production
          type: 'ASSIGNMENT_DUE',
          title: 'New Assignment Submission',
          body: `${req.user.name} submitted "${assignment.title}"`,
        },
      });

      res.status(201).json({
        message: 'Assignment submitted successfully',
        submission,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/submissions/pending
// @desc    Get pending submissions (Admin)
// @access  Private (Admin)
router.get(
  '/pending',
  authenticate,
  authorize('ADMIN'),
  async (req, res, next) => {
    try {
      const submissions = await prisma.submission.findMany({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          assignment: {
            include: {
              lesson: {
                select: { title: true, module: { select: { title: true } } },
              },
            },
          },
        },
        orderBy: { submittedAt: 'asc' },
      });

      res.json({ submissions });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/submissions/my
// @desc    Get my submissions
// @access  Private
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { userId: req.user.id },
      include: {
        assignment: {
          select: {
            title: true,
            lesson: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json({ submissions });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/submissions/:id/grade
// @desc    Grade a submission
// @access  Private (Admin)
router.put(
  '/:id/grade',
  authenticate,
  authorize('ADMIN'),
  [
    param('id').isUUID(),
    body('status').isIn(['APPROVED', 'REJECTED', 'NEEDS_REVISION']).withMessage('Valid status required'),
    body('feedback').optional().trim(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, feedback } = req.body;

      const submission = await prisma.submission.update({
        where: { id },
        data: {
          status,
          feedback: feedback || null,
          gradedAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          assignment: {
            select: { title: true, lessonId: true },
          },
        },
      });

      // Notify student
      await prisma.notification.create({
        data: {
          userId: submission.userId,
          type: 'ASSIGNMENT_GRADED',
          title: 'Assignment Graded',
          body: `Your submission for "${submission.assignment.title}" has been ${status.toLowerCase()}.`,
        },
      });

      // If approved, unlock next lesson logic could go here
      if (status === 'APPROVED') {
        // Optionally auto-unlock next lesson
      }

      res.json({
        message: 'Submission graded successfully',
        submission,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;