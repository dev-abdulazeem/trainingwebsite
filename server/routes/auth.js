import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { hashPassword, comparePassword, generateTokenPair, verifyRefreshToken } from '../utils/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware helper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
};

// @route   POST /api/auth/register
// @desc    Register new student
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
    body('couponCode').optional().trim().toUpperCase(),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { name, email, password, couponCode } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({ message: 'Email already registered. Please login.' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'STUDENT',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const tokens = generateTokenPair(user.id);

      res.status(201).json({
        message: 'Account created successfully',
        user,
        ...tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is paused or deactivated. Contact support.' });
      }

      // Compare password
      const isMatch = await comparePassword(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      // Update last active
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      });

      // Generate tokens
      const tokens = generateTokenPair(user.id);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        ...tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public (requires refresh token)
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required.' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    const tokens = generateTokenPair(user.id);

    res.json({
      message: 'Token refreshed',
      ...tokens,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
              },
            },
          },
        },
      },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal, server can blacklist if needed)
// @access  Private
router.post('/logout', authenticate, async (req, res) => {
  // In a more advanced setup, you'd add the token to a blacklist in Redis
  // For now, client removes tokens from storage
  res.json({ message: 'Logged out successfully.' });
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post(
  '/forgot-password',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        // Don't reveal if email exists
        return res.json({ message: 'If an account exists, a reset link has been sent.' });
      }

      // TODO: Generate reset token and send email
      // For now, return success message
      res.json({ message: 'If an account exists, a reset link has been sent.' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;