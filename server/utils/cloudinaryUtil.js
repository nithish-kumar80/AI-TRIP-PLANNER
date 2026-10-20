const cloudinary = require('cloudinary').v2;
const fs = require('fs');

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

exports.uploadImage = async (filePath, folder = 'voyageai') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
    // Return a placeholder URL in dev mode
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return `https://ui-avatars.com/api/?name=User&background=818cf8&color=ffffff&size=200`;
  }
  const result = await cloudinary.uploader.upload(filePath, { folder, resource_type: 'image', quality: 'auto', fetch_format: 'auto' });
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return result.secure_url;
};

exports.deleteImage = async (publicId) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') return;
  await cloudinary.uploader.destroy(publicId);
};
