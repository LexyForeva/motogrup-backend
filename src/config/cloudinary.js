const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Memory storage for multer
const storage = multer.memoryStorage();

const uploadProfile = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
    }
  }
});

const uploadPost = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim ve video dosyaları yüklenebilir!'), false);
    }
  }
});

// Upload helper functions
const uploadToCloudinary = async (buffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `motogrup/${folder}`,
        resource_type: resourceType,
        transformation: resourceType === 'image' ? [
          { width: folder === 'profiles' ? 400 : 1200, height: folder === 'profiles' ? 400 : 1200, crop: folder === 'profiles' ? 'fill' : 'limit', quality: 'auto' }
        ] : []
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

module.exports = { cloudinary, uploadProfile, uploadPost, uploadToCloudinary };
