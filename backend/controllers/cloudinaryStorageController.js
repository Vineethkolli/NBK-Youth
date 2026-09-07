import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

const FREE_TIER_LIMIT_BYTES = 25 * 1024 * 1024 * 1024; 

const findFolderResources = async (folder) => {
  let nextCursor = null;
  const resources = [];

  do {
    const searchBuilder = cloudinary.search
      .expression(`folder="${folder}" AND (resource_type:image OR resource_type:video OR resource_type:raw)`)
      .max_results(500);

    if (nextCursor) searchBuilder.next_cursor(nextCursor);

    const result = await searchBuilder.execute();
    resources.push(...(result.resources || []));
    nextCursor = result.next_cursor || null;
  } while (nextCursor);

  return resources;
};


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
          name: f.name,
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

  listCloudinaryFiles: async (req, res) => {
    const folder = req.query.folder;

    if (!folder) {
      return res.status(400).json({ message: 'Folder is required' });
    }

    try {
      const files = await findFolderResources(folder);

      return res.json({
        files: files.map((file) => ({
          publicId: file.public_id,
          name: file.public_id.split('/').pop() + (file.format ? `.${file.format}` : ''),
          resourceType: file.resource_type,
          format: file.format,
          size: formatSize(file.bytes),
          bytes: file.bytes,
          secureUrl: file.secure_url,
          createdAt: file.created_at,
        })),
      });
    } catch (err) {
      console.error('Cloudinary files error:', err);
      return res.status(500).json({ message: 'Failed to fetch Cloudinary files', error: err.message });
    }
  },

  downloadCloudinaryFolder: async (req, res) => {
    const folder = req.query.folder;

    if (!folder) {
      return res.status(400).json({ message: 'Folder is required' });
    }

    try {
      const resources = await findFolderResources(folder);

      if (!resources.length) {
        return res.status(404).json({ message: 'No files found in this folder' });
      }

      const archiveUrl = cloudinary.utils.download_archive_url({
        public_ids: resources.map((resource) => resource.public_id),
        resource_types: ['image', 'video', 'raw'],
        target_format: 'zip',
        flatten_folders: true,
      });

      return res.json({ url: archiveUrl, count: resources.length });
    } catch (err) {
      console.error('Cloudinary folder download error:', err);
      return res.status(500).json({ message: 'Failed to create Cloudinary folder download', error: err.message });
    }
  },

  deleteCloudinaryItem: async (req, res) => {
    const { publicId, resourceType = 'image', folder } = req.body;

    if (!publicId && !folder) {
      return res.status(400).json({ message: 'A public ID or folder is required' });
    }

    try {
      if (folder) {
        const resources = await findFolderResources(folder);

        await Promise.all(
          resources.map((resource) => cloudinary.uploader.destroy(resource.public_id, {
            resource_type: resource.resource_type,
            type: 'upload',
            invalidate: true,
          }))
        );

        return res.json({ message: 'Folder deleted', deleted: resources.length });
      }

      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        type: 'upload',
        invalidate: true,
      });

      return res.json({ message: 'File deleted' });
    } catch (err) {
      console.error('Cloudinary delete error:', err);
      return res.status(500).json({ message: 'Failed to delete Cloudinary item', error: err.message });
    }
  },
};
