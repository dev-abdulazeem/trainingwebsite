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

// @route   GET /api/courses
// @desc    Get all published courses with modules (public)
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        modules: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            title: true,
            sortOrder: true,
            _count: {
              select: { lessons: true },
            },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    res.json({
      courses: courses.map(c => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        price: c.price,
        createdAt: c.createdAt,
        studentCount: c._count.enrollments,
        modules: c.modules.map(m => ({
          id: m.id,
          title: m.title,
          sortOrder: m.sortOrder,
          lessonCount: m._count.lessons,
        })),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/courses/:slug
// @desc    Get single course with modules (public preview)
// @access  Public
router.get(
  '/:slug',
  [param('slug').trim().notEmpty(), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { slug } = req.params;

      const course = await prisma.course.findUnique({
        where: { slug, status: 'PUBLISHED' },
        include: {
          modules: {
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              title: true,
              sortOrder: true,
              _count: { select: { lessons: true } },
            },
          },
        },
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found.' });
      }

      res.json({
        course: {
          ...course,
          modules: course.modules.map(m => ({
            ...m,
            lessonCount: m._count.lessons,
            _count: undefined,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/courses
// @desc    Create new course
// @access  Private (Admin)
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    body('slug').trim().isLength({ min: 3, max: 100 }).matches(/^[a-z0-9-]+$/).withMessage('Slug must be lowercase letters, numbers, and hyphens only'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('price').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid price required'),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { title, slug, description, price } = req.body;

      const course = await prisma.course.create({
        data: {
          title,
          slug,
          description,
          price: parseFloat(price),
          status: 'DRAFT',
        },
      });

      res.status(201).json({ message: 'Course created successfully', course });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Admin)
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 3, max: 200 }),
    body('description').optional().trim().isLength({ min: 10 }),
    body('price').optional().isDecimal({ decimal_digits: '0,2' }),
    body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, description, price, status } = req.body;

      const course = await prisma.course.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(price && { price: parseFloat(price) }),
          ...(status && { status }),
        },
      });

      res.json({ message: 'Course updated successfully', course });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Admin)
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  [param('id').isUUID(), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      await prisma.course.delete({ where: { id } });
      res.json({ message: 'Course deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/courses/:id/students
// @desc    Get all students enrolled in course
// @access  Private (Admin)
router.get(
  '/:id/students',
  authenticate,
  authorize('ADMIN'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              lastActiveAt: true,
              createdAt: true,
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      });

      res.json({
        students: enrollments.map(e => ({
          ...e.user,
          enrollmentStatus: e.status,
          enrolledAt: e.enrolledAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/courses/:id/learn
// @desc    Full course content for an enrolled student (modules + published lessons)
// @access  Private (Enrolled students)
router.get('/:id/learn', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: id } },
    });
    
    if (!enrollment || enrollment.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'You are not enrolled in this course.' });
    }

    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        price: true,
        modules: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            title: true,
            sortOrder: true,
            lessons: {
              where: { isPublished: true },
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                title: true,
                videoUrl: true,
                videoType: true,
                duration: true,
                description: true,
                sortOrder: true,
                isPublished: true,
              },
            },
          },
        },
      },
    });

    if (!course) return res.status(404).json({ message: 'Course not found.' });

    res.json({ course });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/courses/:id/full
// @desc    Full course tree for admin (all lessons, published or not)
// @access  Private (Admin)
router.get('/:id/full', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    res.json({ course });
  } catch (error) {
    next(error);
  }
});

export default router;