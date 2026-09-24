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

// @route   GET /api/assignments/lesson/:lessonId
// @desc    Get assignment for a lesson
// @access  Private (Enrolled students + Admin)
router.get(
  '/lesson/:lessonId',
  authenticate,
  async (req, res, next) => {
    try {
      const { lessonId } = req.params;

      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: { include: { course: true } },
          assignment: {
            include: {
              submissions: {
                where: { userId: req.user.id },
                orderBy: { submittedAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found.' });
      }

      if (req.user.role !== 'ADMIN') {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            userId: req.user.id,
            courseId: lesson.module.courseId,
            status: 'ACTIVE',
          },
        });

        if (!enrollment) {
          return res.status(403).json({ message: 'Access denied.' });
        }
      }

      res.json({
        assignment: lesson.assignment,
        latestSubmission: lesson.assignment?.submissions[0] || null,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/assignments
// @desc    Create assignment for a lesson
// @access  Private (Admin)
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  [
    body('lessonId').isUUID().withMessage('Valid lesson ID required'),
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('dueDays').optional().isInt({ min: 1 }).withMessage('Due days must be at least 1'),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { lessonId, title, description, dueDays } = req.body;

      // Check if lesson already has an assignment
      const existing = await prisma.assignment.findUnique({
        where: { lessonId },
      });

      if (existing) {
        return res.status(409).json({ message: 'This lesson already has an assignment.' });
      }

      const assignment = await prisma.assignment.create({
        data: {
          lessonId,
          title,
          description,
          dueDays: dueDays || 7,
        },
      });

      res.status(201).json({
        message: 'Assignment created successfully',
        assignment,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/assignments/:id
// @desc    Update assignment
// @access  Private (Admin)
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 3, max: 200 }),
    body('description').optional().trim().isLength({ min: 10 }),
    body('dueDays').optional().isInt({ min: 1 }),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, description, dueDays } = req.body;

      const assignment = await prisma.assignment.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(dueDays && { dueDays }),
        },
      });

      res.json({
        message: 'Assignment updated successfully',
        assignment,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/assignments/:id
// @desc    Delete assignment
// @access  Private (Admin)
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  [
    param('id').isUUID(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.assignment.delete({
        where: { id },
      });

      res.json({ message: 'Assignment deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;