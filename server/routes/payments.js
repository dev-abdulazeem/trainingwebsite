import express from 'express';
import { body, validationResult } from 'express-validator';
import Paystack from 'paystack-api';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY);

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
};

// @route   POST /api/payments/initialize
// @desc    Initialize Paystack payment
// @access  Private
router.post(
  '/initialize',
  authenticate,
  [
    body('courseId').isUUID().withMessage('Valid course ID required'),
    body('couponCode').optional().trim().toUpperCase(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { courseId, couponCode } = req.body;
      const userId = req.user.id;

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) return res.status(404).json({ message: 'Course not found.' });

      const existingEnrollment = await prisma.enrollment.findFirst({ where: { userId, courseId } });
      if (existingEnrollment) return res.status(409).json({ message: 'You are already enrolled in this course.' });

      let finalPrice = course.price;
      let discount = 0;
      let couponId = null;

      if (couponCode) {
        const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
        if (coupon && coupon.isActive) {
          const now = new Date();
          const isExpired = coupon.expiryDate && coupon.expiryDate < now;
          const isMaxed = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
          const validCourse = !coupon.courseId || coupon.courseId === courseId;

          if (!isExpired && !isMaxed && validCourse) {
            if (coupon.discountType === 'PERCENTAGE') {
              discount = (course.price * coupon.discountValue) / 100;
            } else {
              discount = coupon.discountValue;
            }
            finalPrice = Math.max(0, course.price - discount);
            couponId = coupon.id;
          }
        }
      }

      const payment = await prisma.payment.create({
        data: {
          userId,
          courseId,
          amount: course.price,
          discount,
          finalAmount: finalPrice,
          couponId,
          status: 'PENDING',
        },
      });

      // Initialize Paystack transaction
      const response = await paystack.transaction.initialize({
        email: req.user.email,
        amount: Math.round(finalPrice * 100), // Paystack expects amount in kobo
        reference: `YAC-${payment.id}-${Date.now()}`,
        // ✅ FIX: Redirect user to the FRONTEND success page, not the API verify route
        callback_url: `${process.env.FRONTEND_URL}/payment/success`,
        metadata: {
          paymentId: payment.id,
          userId,
          courseId,
          couponCode: couponCode || null,
        },
      });

      if (!response.status) {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
        return res.status(400).json({ message: response.message || 'Payment initialization failed.' });
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: { paystackRef: response.data.reference },
      });

      res.json({
        message: 'Payment initialized',
        authorizationUrl: response.data.authorization_url,
        reference: response.data.reference,
        payment: {
          id: payment.id,
          amount: course.price,
          discount,
          finalAmount: finalPrice,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/payments/verify
// @desc    Verify Paystack payment (Called by frontend after redirect)
// @access  Private
router.get('/verify', authenticate, async (req, res, next) => {
  try {
    const { reference } = req.query;
    if (!reference) return res.status(400).json({ message: 'Payment reference required.' });

    // Verify with Paystack
    const response = await paystack.transaction.verify({ reference });
    if (!response.status) return res.status(400).json({ message: 'Payment verification failed.' });

    const { status } = response.data;

    const payment = await prisma.payment.findUnique({
      where: { paystackRef: reference },
      include: { coupon: true },
    });

    if (!payment) return res.status(404).json({ message: 'Payment record not found.' });

    // Security: Ensure the logged-in user matches the payment owner
    if (payment.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to verify this payment.' });
    }

    if (status === 'success') {
      // ✅ IDEMPOTENCY: Only process if it hasn't been processed by the webhook already
      if (payment.status === 'PENDING') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'SUCCESS', paidAt: new Date() },
        });

        if (payment.couponId) {
          await prisma.coupon.update({
            where: { id: payment.couponId },
            data: { usedCount: { increment: 1 } },
          });
        }

        // Create enrollment if it doesn't exist
        const existingEnrollment = await prisma.enrollment.findFirst({
          where: { userId: payment.userId, courseId: payment.courseId },
        });

        if (!existingEnrollment) {
          await prisma.enrollment.create({
            data: {
              userId: payment.userId,
              courseId: payment.courseId,
              status: 'ACTIVE',
            },
          });
        }

        await prisma.notification.create({
          data: {
            userId: payment.userId,
            type: 'PAYMENT_SUCCESS',
            title: 'Welcome to the Course! 🎉',
            body: 'Your payment was successful. Start your learning journey now!',
          },
        });
      }

      return res.json({
        message: 'Payment successful',
        status: 'success',
        payment: {
          id: payment.id,
          amount: payment.amount,
          discount: payment.discount,
          finalAmount: payment.finalAmount,
          paidAt: payment.paidAt || new Date(),
        },
      });
    } else {
      if (payment.status === 'PENDING') {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      }
      return res.status(400).json({ message: 'Payment was not successful.', status });
    }
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payments/webhook
// @desc    Paystack webhook handler (Backend-to-Backend)
// @access  Public (Paystack only)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const event = JSON.parse(req.body);

    if (event.event === 'charge.success') {
      const { reference } = event.data;
      const payment = await prisma.payment.findUnique({ where: { paystackRef: reference } });

      if (payment && payment.status === 'PENDING') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'SUCCESS', paidAt: new Date() },
        });

        const existingEnrollment = await prisma.enrollment.findFirst({
          where: { userId: payment.userId, courseId: payment.courseId },
        });

        if (!existingEnrollment) {
          await prisma.enrollment.create({
            data: {
              userId: payment.userId,
              courseId: payment.courseId,
              status: 'ACTIVE',
            },
          });
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(200); // Always return 200 to Paystack
  }
});

// @route   GET /api/payments/history
// @desc    Get user's payment history
// @access  Private
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        coupon: { select: { code: true, discountType: true, discountValue: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ payments });
  } catch (error) {
    next(error);
  }
});

export default router;