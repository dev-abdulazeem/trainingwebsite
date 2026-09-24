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

// @route   GET /api/coupons
// @desc    Get all coupons (Admin)
// @access  Private (Admin)
router.get('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      include: {
        course: {
          select: { id: true, title: true },
        },
        _count: {
          select: { payments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      coupons: coupons.map(c => ({
        ...c,
        usedCount: c._count.payments,
        _count: undefined,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/coupons/validate/:code
// @desc    Validate coupon code (public, used during checkout)
// @access  Public
router.get(
  '/validate/:code',
  async (req, res, next) => {
    try {
      const { code } = req.params;
      const { courseId } = req.query;

      const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          course: { select: { id: true, title: true } },
        },
      });

      if (!coupon) {
        return res.status(404).json({ message: 'Invalid coupon code.' });
      }

      if (!coupon.isActive) {
        return res.status(400).json({ message: 'This coupon is no longer active.' });
      }

      if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        return res.status(400).json({ message: 'This coupon has expired.' });
      }

      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ message: 'This coupon has reached its maximum usage limit.' });
      }

      if (coupon.courseId && coupon.courseId !== courseId) {
        return res.status(400).json({ message: 'This coupon is not valid for this course.' });
      }

      // Calculate discount
      let discountAmount = 0;
      let finalPrice = 0;

      if (courseId) {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { price: true },
        });

        if (course) {
          if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (course.price * coupon.discountValue) / 100;
          } else {
            discountAmount = coupon.discountValue;
          }
          finalPrice = Math.max(0, course.price - discountAmount);
        }
      }

      res.json({
        valid: true,
        coupon: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount,
          finalPrice,
          course: coupon.course,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/coupons
// @desc    Create new coupon
// @access  Private (Admin)
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  [
    body('code').trim().isLength({ min: 3, max: 50 }).withMessage('Code must be 3-50 characters'),
    body('discountType').isIn(['FIXED', 'PERCENTAGE']).withMessage('Discount type must be FIXED or PERCENTAGE'),
    body('discountValue').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid discount value required'),
    body('maxUses').optional().isInt({ min: 1 }).withMessage('Max uses must be at least 1'),
    body('expiryDate').optional().isISO8601().withMessage('Valid date required'),
    body('courseId').optional().isUUID(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { code, discountType, discountValue, maxUses, expiryDate, courseId } = req.body;

      // Check if code already exists
      const existing = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (existing) {
        return res.status(409).json({ message: 'Coupon code already exists.' });
      }

      const coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase(),
          discountType,
          discountValue: parseFloat(discountValue),
          maxUses: maxUses || null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          courseId: courseId || null,
          isActive: true,
        },
      });

      res.status(201).json({
        message: 'Coupon created successfully',
        coupon,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/coupons/:id
// @desc    Update coupon
// @access  Private (Admin)
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  [
    param('id').isUUID(),
    body('discountValue').optional().isDecimal({ decimal_digits: '0,2' }),
    body('maxUses').optional().isInt({ min: 1 }),
    body('expiryDate').optional().isISO8601(),
    body('isActive').optional().isBoolean(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { discountValue, maxUses, expiryDate, isActive } = req.body;

      const coupon = await prisma.coupon.update({
        where: { id },
        data: {
          ...(discountValue !== undefined && { discountValue: parseFloat(discountValue) }),
          ...(maxUses !== undefined && { maxUses: maxUses || null }),
          ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      res.json({
        message: 'Coupon updated successfully',
        coupon,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/coupons/:id
// @desc    Delete coupon
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

      await prisma.coupon.delete({
        where: { id },
      });

      res.json({ message: 'Coupon deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PATCH /api/coupons/:id/toggle
// @desc    Toggle coupon active status
// @access  Private (Admin)
router.patch(
  '/:id/toggle',
  authenticate,
  authorize('ADMIN'),
  [
    param('id').isUUID(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const coupon = await prisma.coupon.findUnique({
        where: { id },
      });

      if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found.' });
      }

      const updated = await prisma.coupon.update({
        where: { id },
        data: { isActive: !coupon.isActive },
      });

      res.json({
        message: `Coupon ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
        coupon: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;