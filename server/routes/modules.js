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

// @route   POST /api/modules/course/:courseId
// @desc    Create a module in a course
// @access  Private (Admin)
router.post(
  '/course/:courseId',
  authenticate,
  authorize('ADMIN'),
  [
    param('courseId').isUUID(),
    body('title').trim().isLength({ min: 2, max: 200 }),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { courseId } = req.params;
      const { title } = req.body;

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) return res.status(404).json({ message: 'Course not found.' });

      const count = await prisma.module.count({ where: { courseId } });
      const module = await prisma.module.create({
        data: { courseId, title, sortOrder: count },
      });

      res.status(201).json({ message: 'Module created', module });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/modules/:id
// @desc    Rename / reorder a module
// @access  Private (Admin)
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 2, max: 200 }),
    body('sortOrder').optional().isInt({ min: 0 }),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, sortOrder } = req.body;

      const module = await prisma.module.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(sortOrder !== undefined && { sortOrder }),
        },
      });

      res.json({ message: 'Module updated', module });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/modules/:id
// @desc    Delete a module (cascades lessons)
// @access  Private (Admin)
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  [param('id').isUUID(), handleValidationErrors],
  async (req, res, next) => {
    try {
      await prisma.module.delete({ where: { id: req.params.id } });
      res.json({ message: 'Module deleted.' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;