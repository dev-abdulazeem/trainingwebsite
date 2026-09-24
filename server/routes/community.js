import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation Failed:', errors.array());
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  next();
};

// @route   GET /api/community
// @desc    Get community chat messages (supports search and category for admin)
// @access  Public (with optional auth)
router.get(
  '/',
  [
    query('category').optional({ values: 'falsy' }).isIn([
      'GENERAL', 'NICHE_RESEARCH', 'EDITING', 'YOUTUBE', 
      'MONETIZATION', 'TECHNICAL_ISSUES', 'ASSIGNMENTS'
    ]),
    query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 100 }),
    query('search').optional({ values: 'falsy' }).trim(),
    handleValidationErrors,
  ],
  optionalAuth,
  async (req, res, next) => {
    try {
      const { category, limit = 50, search } = req.query;
      
      const where = {};
      if (category && typeof category === 'string') {
        where.category = category.toUpperCase();
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { body: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const posts = await prisma.communityPost.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          _count: { select: { replies: true } },
        },
        orderBy: [
          { isPinned: 'desc' }, // Pinned posts first
          { createdAt: 'desc' },
        ],
        take: parseInt(limit),
      });

      const formattedPosts = posts.map(p => ({
        ...p,
        replyCount: p._count.replies,
        _count: undefined,
      }));

      // Reverse only for simple chat view (no search/category) to show oldest at bottom
      if (!search && !category) {
         formattedPosts.reverse();
      }

      res.json({ posts: formattedPosts });
    } catch (error) {
      console.error('❌ Community GET Error:', error);
      next(error);
    }
  }
);

// @route   POST /api/community
// @desc    Create new chat message/post
// @access  Private
router.post(
  '/',
  authenticate,
  [
    body('category').trim().toUpperCase().isIn([
      'GENERAL', 'NICHE_RESEARCH', 'EDITING', 'YOUTUBE', 
      'MONETIZATION', 'TECHNICAL_ISSUES', 'ASSIGNMENTS'
    ]).withMessage('Invalid category'),
    body('title').optional({ values: 'falsy' }).trim(),
    body('body').trim().isLength({ min: 1 }).withMessage('Message cannot be empty'),
    body('imageUrl').optional({ values: 'falsy' }).isURL().withMessage('Invalid image URL'),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { category, title, body, imageUrl } = req.body;

      const post = await prisma.communityPost.create({
        data: {
          userId: req.user.id,
          category: category.toUpperCase(),
          title: title || (body.length > 50 ? body.slice(0, 50) + '...' : body),
          body,
          imageUrl: imageUrl || null,
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({ message: 'Message sent', post });
    } catch (error) {
      console.error('❌ Community POST Error:', error);
      next(error);
    }
  }
);

// @route   POST /api/community/:id/reply
// @desc    Reply to a message
// @access  Private
router.post(
  '/:id/reply',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid post ID'),
    body('body').trim().isLength({ min: 1 }).withMessage('Reply cannot be empty'),
    body('imageUrl').optional({ values: 'falsy' }).isURL().withMessage('Invalid image URL'),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { body, imageUrl } = req.body;

      const post = await prisma.communityPost.findUnique({
        where: { id },
        select: { id: true, userId: true, title: true },
      });

      if (!post) {
        return res.status(404).json({ message: 'Message not found.' });
      }

      const reply = await prisma.communityReply.create({
        data: {
          postId: id,
          userId: req.user.id,
          body,
          imageUrl: imageUrl || null,
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      });

      if (post.userId !== req.user.id) {
        await prisma.notification.create({
          data: {
            userId: post.userId,
            type: 'QUESTION_ANSWERED',
            title: 'New Reply',
            body: `${req.user.name} replied to your message`,
          },
        });
      }

      res.status(201).json({ message: 'Reply sent', reply });
    } catch (error) {
      console.error('❌ Community Reply Error:', error);
      next(error);
    }
  }
);

// ==========================================
// ADMIN / MODERATION ROUTES
// ==========================================

// @route   PUT /api/community/:id/resolve
// @desc    Mark post as resolved/unresolved
// @access  Private (Admin or Post Owner)
router.put(
  '/:id/resolve',
  authenticate,
  [param('id').isUUID(), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const post = await prisma.communityPost.findUnique({
        where: { id },
        select: { id: true, userId: true, isResolved: true },
      });

      if (!post) return res.status(404).json({ message: 'Post not found.' });

      if (req.user.role !== 'ADMIN' && post.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied.' });
      }

      const updated = await prisma.communityPost.update({
        where: { id },
        data: { isResolved: !post.isResolved },
      });

      res.json({
        message: `Post marked as ${updated.isResolved ? 'resolved' : 'unresolved'}`,
        post: updated,
      });
    } catch (error) {
      console.error('❌ Community Resolve Error:', error);
      next(error);
    }
  }
);

// @route   PUT /api/community/:id/pin
// @desc    Pin or unpin a post
// @access  Private (Admin only)
router.put(
  '/:id/pin',
  authenticate,
  [param('id').isUUID(), handleValidationErrors],
  async (req, res, next) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
      }

      const { id } = req.params;
      const post = await prisma.communityPost.findUnique({
        where: { id },
        select: { id: true, isPinned: true },
      });

      if (!post) return res.status(404).json({ message: 'Post not found.' });

      const updated = await prisma.communityPost.update({
        where: { id },
        data: { isPinned: !post.isPinned },
      });

      res.json({
        message: `Post ${updated.isPinned ? 'pinned' : 'unpinned'} successfully`,
        post: updated,
      });
    } catch (error) {
      console.error('❌ Community Pin Error:', error);
      next(error);
    }
  }
);

// @route   DELETE /api/community/:id
// @desc    Delete a post
// @access  Private (Admin or Post Owner)
router.delete(
  '/:id',
  authenticate,
  [param('id').isUUID(), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const post = await prisma.communityPost.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });

      if (!post) return res.status(404).json({ message: 'Post not found.' });

      if (req.user.role !== 'ADMIN' && post.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied.' });
      }

      await prisma.communityPost.delete({ where: { id } });

      res.json({ message: 'Post deleted successfully.' });
    } catch (error) {
      console.error('❌ Community Delete Error:', error);
      next(error);
    }
  }
);

export default router;