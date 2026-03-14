import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const cloudinaryService = {
  // Upload d'une image depuis un buffer (multer)
  async uploadImage(
    buffer: Buffer,
    folder: string,
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `gites-nucleaire/${folder}`,
            transformation: [
              { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
            ],
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error('Échec de l\'upload'));
              return;
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          },
        )
        .end(buffer);
    });
  },

  // Upload de document de vérification
  async uploadDocument(
    buffer: Buffer,
    userId: string,
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `gites-nucleaire/verifications/${userId}`,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error('Échec de l\'upload'));
              return;
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          },
        )
        .end(buffer);
    });
  },

  // Supprimer une image
  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  },
};
