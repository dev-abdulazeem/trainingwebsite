import express from 'express';
import { param, validationResult } from 'express-validator';
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

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.notification.count({
        where: { userId: req.user.id },
      }),
      prisma.notification.count({
        where: {
          userId: req.user.id,
          isRead: false,
        },
      }),
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put(
  '/:id/read',
  authenticate,
  [
    param('id').isUUID(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const notification = await prisma.notification.updateMany({
        where: {
          id,
          userId: req.user.id,
        },
        data: { isRead: true },
      });

      if (notification.count === 0) {
        return res.status(404).json({ message: 'Notification not found.' });
      }

      res.json({ message: 'Notification marked as read.' });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete(
  '/:id',
  authenticate,
  [
    param('id').isUUID(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.notification.deleteMany({
        where: {
          id,
          userId: req.user.id,
        },
      });

      res.json({ message: 'Notification deleted.' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;