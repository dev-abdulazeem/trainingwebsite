import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
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

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private (Admin)
router.get('/dashboard', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      recentPayments,
      pendingSubmissions,
      recentStudents,
      activeWarnings,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { finalAmount: true },
      }),
      prisma.payment.findMany({
        where: { status: 'SUCCESS' },
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true } },
        },
        orderBy: { paidAt: 'desc' },
        take: 10,
      }),
      prisma.submission.count({ where: { status: 'PENDING' } }),
      prisma.user.findMany({
        where: { role: 'STUDENT' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          lastActiveAt: true,
          createdAt: true,
          _count: {
            select: {
              progress: { where: { isCompleted: true } },
              submissions: true,
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          lastActiveAt: {
            lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          isActive: true,
        },
      }),
    ]);

    // Calculate completion rates
    const completionStats = await prisma.progress.groupBy({
      by: ['isCompleted'],
      _count: { isCompleted: true },
    });

    const completedLessons = completionStats.find(c => c.isCompleted)?._count.isCompleted || 0;
    const totalProgress = completionStats.reduce((sum, c) => sum + c._count.isCompleted, 0);

    res.json({
      stats: {
        totalStudents,
        totalCourses,
        totalEnrollments,
        totalRevenue: totalRevenue._sum.finalAmount || 0,
        completionRate: totalProgress > 0 ? Math.round((completedLessons / totalProgress) * 100) : 0,
        pendingSubmissions,
        activeWarnings,
      },
      recentPayments,
      recentStudents: recentStudents.map(s => ({
        ...s,
        completedLessons: s._count.progress,
        totalSubmissions: s._count.submissions,
        _count: undefined,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/students
// @desc    Get all students with filters
// @access  Private (Admin)
router.get(
  '/students',
  authenticate,
  authorize('ADMIN'),
  [
    query('search').optional().trim(),
    query('status').optional().isIn(['ACTIVE', 'PAUSED', 'ALL']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { search, status = 'ALL', page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { role: 'STUDENT' };

      if (status !== 'ALL') {
        where.isActive = status === 'ACTIVE';
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [students, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            lastActiveAt: true,
            createdAt: true,
            enrollments: {
              include: {
                course: { select: { title: true } },
              },
            },
            _count: {
              select: {
                progress: { where: { isCompleted: true } },
                submissions: true,
                posts: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        students: students.map(s => ({
          ...s,
          completedLessons: s._count.progress,
          totalSubmissions: s._count.submissions,
          totalPosts: s._count.posts,
          _count: undefined,
        })),
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
  }
);

// @route   PATCH /api/admin/students/:id/toggle-status
// @desc    Pause or reactivate student account
// @access  Private (Admin)
router.patch(
  '/students/:id/toggle-status',
  authenticate,
  authorize('ADMIN'),
  [
    param('id').isUUID(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const student = await prisma.user.findUnique({
        where: { id, role: 'STUDENT' },
        select: { id: true, isActive: true, name: true },
      });

      if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: !student.isActive },
      });

      // Notify student
      await prisma.notification.create({
        data: {
          userId: id,
          type: updated.isActive ? 'PAYMENT_SUCCESS' : 'ACCESS_PAUSED',
          title: updated.isActive ? 'Account Reactivated' : 'Account Access Paused',
          body: updated.isActive
            ? 'Your account has been reactivated. Welcome back!'
            : 'Your account access has been paused. Contact support for assistance.',
        },
      });

      res.json({
        message: `Student account ${updated.isActive ? 'reactivated' : 'paused'}`,
        student: {
          id: updated.id,
          name: updated.name,
          isActive: updated.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/admin/students/:id/progress
// @desc    Get detailed progress for a student
// @access  Private (Admin)
router.get(
  '/students/:id/progress',
  authenticate,
  authorize('ADMIN'),
  [
    param('id').isUUID(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const student = await prisma.user.findUnique({
        where: { id },
        include: {
          enrollments: {
            include: {
              course: {
                include: {
                  modules: {
                    include: {
                      lessons: {
                        orderBy: { sortOrder: 'asc' },
                      },
                    },
                  },
                },
              },
            },
          },
          progress: true,
          submissions: {
            include: {
              assignment: {
                select: { title: true },
              },
            },
          },
        },
      });

      if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
      }

      const progressMap = new Map(student.progress.map(p => [p.lessonId, p]));

      const courseProgress = student.enrollments.map(enrollment => {
        const allLessons = enrollment.course.modules.flatMap(m => m.lessons);
        const completedLessons = allLessons.filter(l => {
          const p = progressMap.get(l.id);
          return p?.isCompleted;
        }).length;

        return {
          courseId: enrollment.course.id,
          courseTitle: enrollment.course.title,
          totalLessons: allLessons.length,
          completedLessons,
          percentage: allLessons.length > 0
            ? Math.round((completedLessons / allLessons.length) * 100)
            : 0,
          lessons: allLessons.map(l => ({
            id: l.id,
            title: l.title,
            isCompleted: progressMap.get(l.id)?.isCompleted || false,
            watchedSeconds: progressMap.get(l.id)?.watchedSeconds || 0,
          })),
        };
      });

      res.json({
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          isActive: student.isActive,
          lastActiveAt: student.lastActiveAt,
        },
        courseProgress,
        submissions: student.submissions,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/admin/lessons/:id/release
// @desc    Release a scheduled lesson
// @access  Private (Admin)
router.post(
  '/lessons/:id/release',
  authenticate,
  authorize('ADMIN'),
  [
    param('id').isUUID(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const lesson = await prisma.lesson.update({
        where: { id },
        data: {
          isPublished: true,
          releaseDate: new Date(),
        },
        include: {
          module: {
            include: {
              course: true,
            },
          },
        },
      });

      // Notify all enrolled students
      const enrollments = await prisma.enrollment.findMany({
        where: {
          courseId: lesson.module.courseId,
          status: 'ACTIVE',
        },
        select: { userId: true },
      });

      await prisma.notification.createMany({
        data: enrollments.map(e => ({
          userId: e.userId,
          type: 'NEW_LESSON',
          title: 'New Lesson Available! 🎉',
          body: `"${lesson.title}" is now available in ${lesson.module.course.title}.`,
        })),
      });

      res.json({
        message: 'Lesson released and students notified',
        lesson,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/admin/broadcast
// @desc    Send broadcast notification to all students
// @access  Private (Admin)
router.post(
  '/broadcast',
  authenticate,
  authorize('ADMIN'),
  [
    body('title').trim().isLength({ min: 3, max: 100 }),
    body('body').trim().isLength({ min: 5 }),
    body('type').optional().isIn(['NEW_LESSON', 'ASSIGNMENT_DUE', 'GENERAL']),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { title, body, type = 'GENERAL' } = req.body;

      const students = await prisma.user.findMany({
        where: { role: 'STUDENT', isActive: true },
        select: { id: true },
      });

      await prisma.notification.createMany({
        data: students.map(s => ({
          userId: s.id,
          type,
          title,
          body,
        })),
      });

      res.json({
        message: `Broadcast sent to ${students.length} students`,
        recipientCount: students.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;