import express from 'express';
import { uploadVideo, uploadFile, uploadSubmission, handleUploadError } from '../middleware/upload.js';
import { uploadVideo as uploadVideoToCloudinary, uploadFile as uploadFileToCloudinary } from '../config/cloudinary.js';
import { authenticate, authorize } from '../middleware/auth.js';
import fs from 'fs/promises';

const router = express.Router();

// @route   POST /api/upload/video
// @desc    Upload video to Cloudinary
// @access  Private (Admin only)
router.post(
  '/video',
  authenticate,
  authorize('ADMIN'),
  uploadVideo.single('video'),
  handleUploadError,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No video file provided.' });
      }

      const result = await uploadVideoToCloudinary(req.file.path, {
        folder: 'course-videos',
        eager: [
          { streaming_profile: 'hd', format: 'm3u8' },
        ],
        eager_async: true,
      });

      // Clean up temp file
      await fs.unlink(req.file.path).catch(() => {});

      res.json({
        message: 'Video uploaded successfully',
        data: {
          publicId: result.publicId,
          url: result.url,
          duration: result.duration,
          thumbnailUrl: result.thumbnailUrl,
          streamingUrl: result.eager?.[0]?.secure_url || result.url,
        },
      });
    } catch (error) {
      // Clean up on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      next(error);
    }
  }
);

// @route   POST /api/upload/file
// @desc    Upload file/resource to Cloudinary
// @access  Private (Admin only)
router.post(
  '/file',
  authenticate,
  authorize('ADMIN'),
  uploadFile.single('file'),
  handleUploadError,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided.' });
      }

      const result = await uploadFileToCloudinary(req.file.path, {
        folder: 'course-resources',
      });

      // Clean up temp file
      await fs.unlink(req.file.path).catch(() => {});

      res.json({
        message: 'File uploaded successfully',
        data: {
          publicId: result.publicId,
          url: result.url,
          format: result.format,
          bytes: result.bytes,
        },
      });
    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      next(error);
    }
  }
);

// @route   POST /api/upload/submission
// @desc    Upload assignment submission file
// @access  Private (Students)
router.post(
  '/submission',
  authenticate,
  // Optional: You might want to add authorize('STUDENT') here depending on your auth middleware setup
  uploadSubmission.single('file'),
  handleUploadError,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided.' });
      }

      const result = await uploadFileToCloudinary(req.file.path, {
        folder: 'student-submissions',
      });

      // Clean up temp file
      await fs.unlink(req.file.path).catch(() => {});

      res.json({
        message: 'Submission file uploaded successfully',
        data: {
          publicId: result.publicId,
          url: result.url,
          format: result.format,
          bytes: result.bytes,
        },
      });
    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      next(error);
    }
  }
);

// @route   DELETE /api/upload/:publicId
// @desc    Delete file from Cloudinary
// @access  Private (Admin only)
router.delete(
  '/:publicId',
  authenticate,
  authorize('ADMIN'),
  async (req, res, next) => {
    try {
      const { publicId } = req.params;
      const { resourceType = 'video' } = req.query;

      const { deleteFromCloudinary } = await import('../config/cloudinary.js');
      const result = await deleteFromCloudinary(publicId, resourceType);

      res.json({
        message: 'File deleted successfully',
        result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;