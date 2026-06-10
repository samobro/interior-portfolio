// server/middleware/cloudinaryUpload.js - OPTIMIZED VERSION
const multer = require('multer');
const getCloudinary = require('../config/cloudinary');

// Configure multer for memory storage (not disk storage)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/tif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, tif or WEBP images are allowed"));
    }
  }
});

// ⚡ OPTIMIZED: Function to upload buffer to cloudinary with timeout
const uploadToCloudinary = (buffer, folder = 'interior-portfolio') => {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Starting Cloudinary upload to folder: ${folder}`);
    const startTime = Date.now();
    
    // ⚡ Add timeout to prevent hanging
    const uploadTimeout = setTimeout(() => {
      console.error('❌ Cloudinary upload timeout after 30s');
      reject(new Error('Cloudinary upload timeout after 30 seconds'));
    }, 30000); // 30 second timeout

    getCloudinary().uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        // ⚡ OPTIMIZED TRANSFORMATIONS - Much faster!
        transformation: [
          { width: 800, height: 600, crop: 'limit', quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        // ⚡ PERFORMANCE OPTIMIZATIONS
        eager_async: true,    // Process transformations in background
        invalidate: true,     // Cache busting
        overwrite: true,      // Overwrite existing files
        unique_filename: true // Ensure unique filenames
      },
      (error, result) => {
        clearTimeout(uploadTimeout);
        const uploadTime = Date.now() - startTime;
        
        if (error) {
          console.error(`❌ Cloudinary upload failed in ${uploadTime}ms:`, error.message);
          reject(error);
        } else {
          console.log(`✅ Cloudinary upload successful in ${uploadTime}ms: ${result.secure_url}`);
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// ⚡ OPTIMIZED: Function to delete image from cloudinary with timeout
const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    console.log(`🗑️ Deleting from Cloudinary: ${publicId}`);
    const startTime = Date.now();
    
    // Add timeout for delete operations too
    const deleteTimeout = setTimeout(() => {
      console.error('❌ Cloudinary delete timeout after 15s');
      reject(new Error('Cloudinary delete timeout'));
    }, 15000); // 15 second timeout for deletes

    getCloudinary().uploader.destroy(publicId, (error, result) => {
      clearTimeout(deleteTimeout);
      const deleteTime = Date.now() - startTime;
      
      if (error) {
        console.error(`❌ Cloudinary delete failed in ${deleteTime}ms:`, error.message);
        reject(error);
      } else {
        console.log(`✅ Cloudinary delete successful in ${deleteTime}ms`);
        resolve(result);
      }
    });
  });
};

// ⚡ NEW: Batch upload function for multiple images
const uploadMultipleToCloudinary = async (files, folder = 'interior-portfolio') => {
  console.log(`🔄 Starting batch upload of ${files.length} files`);
  const startTime = Date.now();
  const results = [];
  const errors = [];

  // Upload files in parallel for better performance
  const uploadPromises = files.map(async (file, index) => {
    try {
      const result = await uploadToCloudinary(file.buffer, `${folder}/batch_${Date.now()}`);
      results.push({ index, result: result.secure_url });
    } catch (error) {
      console.error(`❌ Failed to upload file ${index}:`, error.message);
      errors.push({ index, error: error.message });
    }
  });

  await Promise.allSettled(uploadPromises);
  
  const totalTime = Date.now() - startTime;
  console.log(`✅ Batch upload completed in ${totalTime}ms. Success: ${results.length}, Errors: ${errors.length}`);
  
  return { results, errors, totalTime };
};

module.exports = { 
  upload, 
  uploadToCloudinary, 
  deleteFromCloudinary,
  uploadMultipleToCloudinary // Export the new batch function
};
