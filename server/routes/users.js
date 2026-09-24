import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { comparePassword, hashPassword } from '../utils/auth.js';

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
};

// @route   GET /api/users/profile
// @desc    Get user profile with stats
// @access  Private
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastActiveAt: true,
        createdAt: true,
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                price: true,
              },
            },
          },
        },
        progress: {
          select: {
            isCompleted: true,
          },
        },
        submissions: {
          select: {
            status: true,
          },
        },
        posts: {
          select: { id: true },
        },
        notifications: {
          where: { isRead: false },
          select: { id: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Calculate stats
    const stats = {
      totalLessonsCompleted: user.progress.filter(p => p.isCompleted).length,
      totalAssignmentsSubmitted: user.submissions.length,
      pendingAssignments: user.submissions.filter(s => s.status === 'PENDING').length,
      communityPosts: user.posts.length,
      unreadNotifications: user.notifications.length,
    };

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastActiveAt: user.lastActiveAt,
        createdAt: user.createdAt,
        enrollments: user.enrollments,
      },
      stats,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { name } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { name },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          updatedAt: true,
        },
      });

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/users/change-password
// @desc    Change password
// @access  Private
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    body('confirmNewPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, password: true },
      });

      const isMatch = await comparePassword(currentPassword, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }

      const hashedNewPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedNewPassword },
      });

      res.json({ message: 'Password changed successfully.' });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/users/dashboard
// @desc    Get student dashboard data
// @access  Private (Students only)
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get enrollment with course details
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return res.json({
        hasEnrollment: false,
        message: 'No active enrollment found.',
      });
    }

    // Get progress for all lessons
    const progress = await prisma.progress.findMany({
      where: { userId },
    });

    const progressMap = new Map(progress.map(p => [p.lessonId, p]));

    // Calculate overall progress
    const allLessons = enrollment.course.modules.flatMap(m => m.lessons);
    const completedLessons = progress.filter(p => p.isCompleted).length;
    const progressPercentage = allLessons.length > 0 
      ? Math.round((completedLessons / allLessons.length) * 100) 
      : 0;

    // Find current lesson (first incomplete)
    let currentLesson = null;
    let nextLesson = null;
    
    for (let i = 0; i < allLessons.length; i++) {
      const lesson = allLessons[i];
      const lessonProgress = progressMap.get(lesson.id);
      
      if (!lessonProgress || !lessonProgress.isCompleted) {
        currentLesson = lesson;
        nextLesson = allLessons[i + 1] || null;
        break;
      }
    }

    // If all completed
    if (!currentLesson && allLessons.length > 0) {
      currentLesson = allLessons[allLessons.length - 1];
    }

    // Get pending assignments
    const pendingAssignments = await prisma.submission.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      include: {
        assignment: {
          include: {
            lesson: {
              select: { title: true },
            },
          },
        },
      },
      take: 3,
    });

    // Get recent community activity
    const recentReplies = await prisma.communityReply.findMany({
      where: {
        post: {
          userId,
        },
      },
      include: {
        user: {
          select: { name: true },
        },
        post: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    // Get unread notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Check inactivity
    const daysSinceActive = Math.floor(
      (new Date() - new Date(req.user.lastActiveAt)) / (1000 * 60 * 60 * 24)
    );

    let inactivityWarning = null;
    if (daysSinceActive >= 5) {
      inactivityWarning = {
        level: 'critical',
        message: 'Final warning: Your account will be paused if you remain inactive.',
        daysInactive: daysSinceActive,
      };
    } else if (daysSinceActive >= 3) {
      inactivityWarning = {
        level: 'warning',
        message: 'You haven\'t been active for 3 days. Complete a lesson to stay on track.',
        daysInactive: daysSinceActive,
      };
    }

    res.json({
      hasEnrollment: true,
      welcomeMessage: `Welcome back, ${req.user.name} 👋`,
      courseProgress: {
        percentage: progressPercentage,
        completedLessons,
        totalLessons: allLessons.length,
      },
      currentLesson: currentLesson ? {
        id: currentLesson.id,
        title: currentLesson.title,
        moduleTitle: enrollment.course.modules.find(m => m.id === currentLesson.moduleId)?.title,
      } : null,
      nextLesson: nextLesson ? {
        id: nextLesson.id,
        title: nextLesson.title,
      } : null,
      pendingAssignments: pendingAssignments.map(a => ({
        id: a.id,
        title: a.assignment.title,
        lessonTitle: a.assignment.lesson.title,
        submittedAt: a.submittedAt,
      })),
      recentCommunityActivity: recentReplies.map(r => ({
        id: r.id,
        replierName: r.user.name,
        postTitle: r.post.title,
        createdAt: r.createdAt,
      })),
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        createdAt: n.createdAt,
      })),
      inactivityWarning,
      streak: 0, // TODO: Implement streak calculation
    });
  } catch (error) {
    next(error);
  }
});

export default router;