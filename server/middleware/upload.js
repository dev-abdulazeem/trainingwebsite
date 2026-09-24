import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const videoFilter = (req, file, cb) => {
  const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/avi'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only video files (MP4, WebM, MOV, MKV, AVI) are allowed.'));
};

const fileFilter = (req, file, cb) => {
  // allow common resource types
  cb(null, true);
};

export const uploadVideo = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024, files: 1 }, // 1 GB per video, one at a time
  fileFilter: videoFilter,
});

export const uploadFile = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 200, files: 1 }, // 200 MB
  fileFilter: fileFilter,
});

export const uploadSubmission = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 50, files: 1 },
  fileFilter: fileFilter,
});

// Use on routes where the video is optional — attaches req.file if sent, never errors
export const optionalVideoUpload = (req, res, next) => {
  uploadVideo.single('video')(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large.' : `Upload error: ${err.message}`;
    return res.status(400).json({ message: msg });
  }
  if (err) return res.status(400).json({ message: err.message });
  next();
};