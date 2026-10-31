import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import { logActivity } from '../middleware/activityLogger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const formatSize = (bytes) => {
  if (bytes == null || bytes === '' || isNaN(bytes)) return '-';

  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  let size = Number(bytes);
  let i = 0;

  if (size < 0) return '-';
  if (size === 0) return '0 Bytes';

  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }

  return `${size.toFixed(2)} ${units[i]}`;
};

const FREE_TIER_LIMIT_BYTES = 25 * 1024 * 1024 * 1024;

const findFolderResources = async (folder) => {
  let nextCursor = null;
  const resources = [];

  do {
    const searchBuilder = cloudinary.search
      .expression(
        `folder="${folder}" AND (resource_type:image OR resource_type:video OR resource_type:raw)`
      )
      .max_results(500);

    if (nextCursor) searchBuilder.next_cursor(nextCursor);

    const result = await searchBuilder.execute();
    resources.push(...(result.resources || []));
    nextCursor = result.next_cursor || null;
  } while (nextCursor);

  return resources;
};

const deleteCloudinaryBackupVersions = async (assetId, versionIds) => {
  const config = cloudinary.config();

  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    throw new Error('Cloudinary credentials are not configured correctly');
  }

  if (
    !assetId ||
    typeof assetId !== 'string' ||
    !Array.isArray(versionIds) ||
    versionIds.length === 0
  ) {
    throw new Error('Asset ID and backup version IDs are required');
  }

  const body = new URLSearchParams();

  versionIds.forEach((versionId) => {
    body.append('version_ids[]', String(versionId));
  });

  const response = await axios.delete(
    `https://api.cloudinary.com/v1_1/${config.cloud_name}/resources/backup/${encodeURIComponent(assetId)}`,
    {
      auth: {
        username: config.api_key,
        password: config.api_secret,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: body.toString(),
      timeout: 30000,
    }
  );

  return response.data;
};

export const cloudinaryStorageController = {
  
getStorageQuota: async (req, res) => {
  try {
    const usage = await cloudinary.api.usage();
    const storageUsedBytes = usage.storage?.usage ?? 0;
    const storageLimitBytes = usage.storage?.limit ?? FREE_TIER_LIMIT_BYTES;

    return res.json({
      lifetime: {
        storageUsedBytes,
        storageUsedReadable: formatSize(storageUsedBytes),
        storageLimitBytes,
        storageLimitReadable: formatSize(storageLimitBytes),
      },
      lastUpdated: usage.last_updated,
    });
  } catch (err) {
    console.error('Cloudinary quota error:', err.response?.data || err);

    return res.status(500).json({
      message: 'Failed to fetch Cloudinary quota',
      error: err.response?.data?.error?.message || err.message,
    });
  }
},

  listCloudinaryFolders: async (req, res) => {
    try {
      const rootFoldersResult = await cloudinary.api.root_folders();
      const folders = rootFoldersResult.folders || [];

      const folderData = await Promise.all(
        folders.map(async (folder) => {
          let nextCursor = null;
          let totalBytes = 0;
          let totalCount = 0;

          do {
            const searchBuilder = cloudinary.search
              .expression(
                `folder="${folder.path}" AND (resource_type:image OR resource_type:video OR resource_type:raw)`
              )
              .max_results(500);

            if (nextCursor) searchBuilder.next_cursor(nextCursor);

            const result = await searchBuilder.execute();

            totalBytes += (result.resources || []).reduce(
              (sum, resource) => sum + (resource.bytes || 0),
              0
            );

            totalCount += (result.resources || []).length;
            nextCursor = result.next_cursor || null;
          } while (nextCursor);

          return {
            name: folder.name,
            path: folder.path,
            sizeBytes: totalBytes,
            sizeReadable: formatSize(totalBytes),
            count: totalCount,
          };
        })
      );

      return res.json({ folders: folderData });
    } catch (err) {
      console.error('Cloudinary folders error:', err);

      return res.status(500).json({
        message: 'Failed to fetch Cloudinary folders',
        error: err.message,
      });
    }
  },

  listCloudinaryFiles: async (req, res) => {
    const { folder } = req.query;

    if (!folder) {
      return res.status(400).json({
        message: 'Folder is required',
      });
    }

    try {
      const files = await findFolderResources(folder);

      return res.json({
        files: files.map((file) => ({
          publicId: file.public_id,
          name:
            file.public_id.split('/').pop() +
            (file.format ? `.${file.format}` : ''),
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

      return res.status(500).json({
        message: 'Failed to fetch Cloudinary files',
        error: err.message,
      });
    }
  },

  downloadCloudinaryFolder: async (req, res) => {
    const { folder } = req.query;

    if (!folder) {
      return res.status(400).json({
        message: 'Folder is required',
      });
    }

    try {
      const resources = await findFolderResources(folder);

      if (!resources.length) {
        return res.status(404).json({
          message: 'No files found in this folder',
        });
      }

      const archiveUrl = cloudinary.utils.download_archive_url({
        public_ids: resources.map((resource) => resource.public_id),
        resource_types: ['image', 'video', 'raw'],
        target_format: 'zip',
        flatten_folders: true,
      });

      return res.json({
        url: archiveUrl,
        count: resources.length,
      });
    } catch (err) {
      console.error('Cloudinary folder download error:', err);

      return res.status(500).json({
        message: 'Failed to create Cloudinary folder download',
        error: err.message,
      });
    }
  },

  deleteCloudinaryItem: async (req, res) => {
    const {
      publicId,
      resourceType = 'image',
      folder,
    } = req.body || {};

    if (!publicId && !folder) {
      return res.status(400).json({
        message: 'A public ID or folder is required',
      });
    }

    try {
      if (folder) {
        const resources = await findFolderResources(folder);

        const results = await Promise.all(
          resources.map((resource) =>
            cloudinary.uploader.destroy(resource.public_id, {
              resource_type: resource.resource_type,
              type: 'upload',
              invalidate: true,
            })
          )
        );

        const deleted = results.filter(
          (result) => result.result === 'ok'
        ).length;

        await logActivity(
          req,
          'DELETE',
          'Monitor',
          'Cloudinary',
          { before: { folder, total: resources.length }, after: { deleted } },
          `Cloudinary folder "${folder}" deleted`
        );
        return res.json({
          message: 'Folder deletion processed',
          deleted,
          total: resources.length,
        });
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        type: 'upload',
        invalidate: true,
      });

      if (result.result !== 'ok' && result.result !== 'not found') {
        return res.status(400).json({
          message: 'Cloudinary did not confirm file deletion',
          result,
        });
      }

      await logActivity(
        req,
        'DELETE',
        'Monitor',
        'Cloudinary',
        { before: { publicId, resourceType }, after: null },
        `Cloudinary item "${publicId}" deleted and moved to trash`
      );
      return res.json({
        message:
          result.result === 'ok'
            ? 'File deleted'
            : 'File was not found',
        result,
      });
    } catch (err) {
      console.error('Cloudinary delete error:', err);

      return res.status(500).json({
        message: 'Failed to delete Cloudinary item',
        error: err.message,
      });
    }
  },

  listDeletedCloudinaryItems: async (req, res) => {
    try {
      const pageSize = Math.min(
        Math.max(Number(req.query.maxResults) || 100, 1),
        500
      );

      const searchBuilder = cloudinary.search
        .expression('status=deleted')
        .max_results(pageSize);

      if (req.query.nextCursor) {
        searchBuilder.next_cursor(req.query.nextCursor);
      }

      const result = await searchBuilder.execute();

      return res.json({
        items: (result.resources || []).map((item) => ({
          assetId: item.asset_id,
          publicId: item.public_id,
          resourceType: item.resource_type,
          deliveryType: item.type || 'upload',
          format: item.format || '',
          name:
            (item.public_id?.split('/').pop() || 'Unnamed asset') +
            (item.format ? `.${item.format}` : ''),
          bytes: item.bytes || 0,
          size: formatSize(item.bytes),
          createdAt: item.created_at,
        })),
        nextCursor: result.next_cursor || null,
      });
    } catch (err) {
      console.error('Cloudinary Trash list error:', err);

      return res.status(500).json({
        message: 'Failed to fetch Cloudinary Trash',
        error: err.message,
      });
    }
  },

  restoreCloudinaryItem: async (req, res) => {
    const { assetId } = req.body || {};

    if (!assetId || typeof assetId !== 'string') {
      return res.status(400).json({
        message: 'A valid Cloudinary asset ID is required',
      });
    }

    try {
      const result = await cloudinary.api.restore_by_asset_ids([assetId]);

      return res.json({
        message: 'Cloudinary restore request completed',
        result,
      });
    } catch (err) {
      console.error('Cloudinary restore error:', err);

      return res.status(500).json({
        message: 'Failed to restore Cloudinary asset',
        error: err.message,
      });
    }
  },

  permanentlyDeleteCloudinaryBackup: async (req, res) => {
    const { assetId } = req.body || {};

    if (!assetId || typeof assetId !== 'string') {
      return res.status(400).json({
        message: 'A valid Cloudinary asset ID is required',
      });
    }

    try {
      const resource = await cloudinary.api.resource_by_asset_id(assetId, {
        versions: true,
      });

      const versionIds = (resource.versions || [])
        .map((version) => version.version_id)
        .filter(Boolean);

      if (!versionIds.length) {
        return res.status(404).json({
          message: 'No version IDs were found. Nothing was deleted.',
        });
      }

      const result = await deleteCloudinaryBackupVersions(
        assetId,
        versionIds
      );

      await logActivity(
        req,
        'DELETE',
        'Monitor',
        'Cloudinary',
        { before: { assetId, versionCount: versionIds.length }, after: null },
        `Cloudinary trash item "${assetId}" permanently deleted`
      );
      return res.json({
        message: 'Backup deletion request completed',
        deletedVersionCount: versionIds.length,
        result,
      });
    } catch (err) {
      console.error(
        'Cloudinary permanent backup deletion error:',
        err.response?.data || err
      );

      return res.status(err.response?.status || 500).json({
        message: 'Failed to permanently delete Cloudinary backups',
        error: err.response?.data?.error?.message || err.message,
      });
    }
  },

  emptyCloudinaryTrash: async (req, res) => {
    if (req.body?.confirm !== true) {
      return res.status(400).json({
        message: 'Explicit confirmation is required',
      });
    }

    try {
      const assets = [];
      let nextCursor = null;

      do {
        const searchBuilder = cloudinary.search
          .expression('status=deleted')
          .max_results(100);

        if (nextCursor) {
          searchBuilder.next_cursor(nextCursor);
        }

        const page = await searchBuilder.execute();

        assets.push(...(page.resources || []));
        nextCursor = page.next_cursor || null;
      } while (nextCursor);

      let deletedAssets = 0;
      let deletedVersions = 0;
      const failures = [];

      for (const item of assets) {
        try {
          if (!item.asset_id) {
            throw new Error('Cloudinary asset ID is missing');
          }

          const resource = await cloudinary.api.resource_by_asset_id(
            item.asset_id,
            { versions: true }
          );

          const versionIds = (resource.versions || [])
            .map((version) => version.version_id)
            .filter(Boolean);

          if (!versionIds.length) {
            failures.push({
              assetId: item.asset_id,
              publicId: item.public_id,
              reason: 'No version IDs were found',
            });
            continue;
          }

          await deleteCloudinaryBackupVersions(
            item.asset_id,
            versionIds
          );

          deletedAssets++;
          deletedVersions += versionIds.length;
        } catch (err) {
          console.error(
            `Failed to delete Cloudinary backup for ${item.asset_id}:`,
            err.response?.data || err
          );

          failures.push({
            assetId: item.asset_id,
            publicId: item.public_id,
            reason:
              err.response?.data?.error?.message || err.message,
          });
        }
      }

      await logActivity(
        req,
        'DELETE',
        'Monitor',
        'Cloudinary',
        {
          before: { totalAssetsFound: assets.length },
          after: { deletedAssets, deletedVersions, failures: failures.length },
        },
        `Cloudinary trash emptied (${deletedAssets} assets)`
      );
      return res.json({
        message: failures.length
          ? 'Trash processing finished with some failures'
          : 'Cloudinary Trash processing completed',
        totalAssetsFound: assets.length,
        deletedAssets,
        deletedVersions,
        failures,
      });
    } catch (err) {
      console.error(
        'Cloudinary empty Trash error:',
        err.response?.data || err
      );

      return res.status(err.response?.status || 500).json({
        message: 'Failed to empty Cloudinary Trash',
        error: err.response?.data?.error?.message || err.message,
      });
    }
  },
};
