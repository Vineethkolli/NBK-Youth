import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: format bytes
const formatSize = (bytes) => {
  if (!bytes || isNaN(bytes) || bytes === '0') return '-';
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = Number(bytes);
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return size.toFixed(2) + ' ' + units[i];
};

// Fixed free-tier limit
const FREE_TIER_LIMIT_BYTES = 25 * 1024 * 1024 * 1024; 

export const cloudinaryStorageController = {
    
  getStorageQuota: async (req, res) => {
  try {
    let nextCursor = null;
    let totalBytes = 0;

    do {
      const searchBuilder = cloudinary.search
        .expression('(resource_type:image OR resource_type:video OR resource_type:raw)')
        .max_results(500);
      if (nextCursor) searchBuilder.next_cursor(nextCursor);

      const result = await searchBuilder.execute();
      totalBytes += (result.resources || []).reduce((sum, r) => sum + (r.bytes || 0), 0);
      nextCursor = result.next_cursor || null;
    } while (nextCursor);

    res.json({
      lifetime: {
        storageUsedBytes: totalBytes,
        storageUsedReadable: formatSize(totalBytes),
        storageLimitBytes: FREE_TIER_LIMIT_BYTES,
        storageLimitReadable: formatSize(FREE_TIER_LIMIT_BYTES),
      },
    });
  } catch (err) {
    console.error('Cloudinary quota error:', err);
    res.status(500).json({ message: 'Failed to fetch Cloudinary quota', error: err.message });
  }
},

  listCloudinaryFolders: async (req, res) => {
  try {
    const rootFoldersResult = await cloudinary.api.root_folders();
    const folders = rootFoldersResult.folders || [];

    // Map folders to include size and count
    const folderData = await Promise.all(
      folders.map(async (f) => {
        let nextCursor = null;
        let totalBytes = 0;
        let totalCount = 0;

        do {
          const searchBuilder = cloudinary.search
            .expression(`folder="${f.path}" AND (resource_type:image OR resource_type:video OR resource_type:raw)`)
            .max_results(500);

          if (nextCursor) searchBuilder.next_cursor(nextCursor);

          const result = await searchBuilder.execute();

          totalBytes += (result.resources || []).reduce((sum, r) => sum + (r.bytes || 0), 0);
          totalCount += (result.resources || []).length;

          nextCursor = result.next_cursor || null;
        } while (nextCursor);

        return {
          folder: f.name,
          path: f.path,
          sizeBytes: totalBytes,
          sizeReadable: formatSize(totalBytes),
          count: totalCount,
        };
      })
    );

    res.json({ folders: folderData });
  } catch (err) {
    console.error('Cloudinary folders error:', err);
    res.status(500).json({ message: 'Failed to fetch Cloudinary folders', error: err.message });
  }
},
};
