import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload video to Cloudinary
export const uploadVideo = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder: 'course-videos',
      eager: [
        { streaming_profile: 'hd', format: 'm3u8' }, // HLS streaming
      ],
      eager_async: true,
      ...options,
    });
    
    return {
      publicId: result.public_id,
      url: result.secure_url,
      duration: result.duration,
      eager: result.eager,
      thumbnailUrl: cloudinary.url(result.public_id, {
        resource_type: 'video',
        format: 'jpg',
        transformation: [
          { width: 1280, height: 720, crop: 'fill' },
          { quality: 'auto' },
        ],
      }),
    };
  } catch (error) {
    throw new Error(`Video upload failed: ${error.message}`);
  }
};

// Upload image/resource to Cloudinary
export const uploadFile = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'course-resources',
      ...options,
    });
    
    return {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }
};

// Delete from Cloudinary
export const deleteFromCloudinary = async (publicId, resourceType = 'video') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};

// Generate signed URL for private videos (if needed)
export const generateSignedUrl = (publicId, expiresIn = 3600) => {
  return cloudinary.utils.private_download_url(publicId, 'mp4', {
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
  });
};

export default cloudinary;