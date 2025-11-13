import cloudinary from '../config/cloudinary.js';

export const cloudinaryController = {
  // Returns signature and params for direct upload to Cloudinary
  getSignature: async (req, res) => {
    try {
      const { folder, resource_type = 'auto', public_id, eager, overwrite } = req.body || {};

      if (!folder) {
        return res.status(400).json({ message: 'folder is required' });
      }

      const timestamp = Math.floor(Date.now() / 1000);

      // Only sign parameters that will be sent to Cloudinary in the request body
      const paramsToSign = {
        timestamp,
        folder,
      };

      if (public_id) paramsToSign.public_id = public_id;
      if (typeof overwrite !== 'undefined') paramsToSign.overwrite = overwrite;
      if (eager) paramsToSign.eager = eager;

      const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET
      );

      return res.json({
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        signature,
        timestamp,
        folder,
        resource_type,
        public_id: public_id || undefined,
      });
    } catch (error) {
      console.error('Signature generation failed:', error);
      return res.status(500).json({ message: 'Failed to generate upload signature' });
    }
  },
};

export default cloudinaryController;
