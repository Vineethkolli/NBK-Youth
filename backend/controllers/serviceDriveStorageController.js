import { google } from 'googleapis';

let drive;
try {
  const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/drive',
    ],
  });

  drive = google.drive({ version: 'v3', auth });
} catch (err) {
  console.error('Failed to initialize Google Drive:', err.message);
  drive = google.drive({ version: 'v3' });
}

// Helper: format bytes
const formatSize = (bytes) => {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === '0') return '-';
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = Number(bytes);
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return size.toFixed(2) + ' ' + units[i];
};

// Helper: calculate total size & count in a folder
const calculateFolderSizeAndCount = async (folderId, trashed = false) => {
  let totalSize = 0;
  let totalCount = 0;
  let nextPageToken = null;
  const q = `'${folderId}' in parents and trashed = ${trashed}`;

  do {
    const res = await drive.files.list({
      q,
      fields: 'nextPageToken, files(id, name, size, mimeType)',
      pageSize: 1000,
      pageToken: nextPageToken,
    });

    const files = res.data.files || [];
    files.forEach((f) => {
      if (f.mimeType !== 'application/vnd.google-apps.folder') {
        totalSize += Number(f.size || 0);
        totalCount += 1;
      }
    });

    nextPageToken = res.data.nextPageToken;
  } while (nextPageToken);

  return { size: totalSize, count: totalCount };
};

// Helper: recursive delete for folder
const deleteFileRecursiveIfFolder = async (fileId) => {
  const meta = await drive.files.get({ fileId, fields: 'id, mimeType' }).catch(() => null);
  if (!meta || !meta.data) return;

  if (meta.data.mimeType === 'application/vnd.google-apps.folder') {
    let nextPageToken = null;
    const q = `'${fileId}' in parents and trashed = true`;
    do {
      const res = await drive.files.list({
        q,
        fields: 'nextPageToken, files(id, mimeType)',
        pageSize: 1000,
        pageToken: nextPageToken,
      });
      const files = res.data.files || [];
      for (const f of files) {
        await deleteFileRecursiveIfFolder(f.id);
      }
      nextPageToken = res.data.nextPageToken;
    } while (nextPageToken);
  }

  await drive.files.delete({ fileId });
};


export const serviceDriveStorageController = {

  getStorageQuota: async (req, res) => {
    try {
      const aboutRes = await drive.about.get({ fields: 'storageQuota,user' });
      const { storageQuota, user } = aboutRes.data;

      const userData = {
        name: user?.displayName || 'Unknown',
        email: user?.emailAddress || 'Unknown',
      };

      const storageData = {
        storageLimit: storageQuota.limit
          ? formatSize(Number(storageQuota.limit))
          : 'Unlimited/Not Set',
        storageUsed: formatSize(Number(storageQuota.usage)),
        driveUsed: formatSize(Number(storageQuota.usageInDrive)),
        trashUsed: formatSize(Number(storageQuota.usageInDriveTrash)),
      };

      return res.json({ user: userData, storage: storageData });
    } catch (err) {
      console.error('Drive Quota Error:', err);
      return res
        .status(500)
        .json({ message: 'Failed to fetch storage quota', error: err.message });
    }
  },

  getFileList: async (req, res) => {
    const parentId = req.query.parentId || 'root';

    try {
      let allFiles = [];
      let nextPageToken = null;

      let q;
      if (parentId === 'root') {
        q =
          "('root' in parents or 'root' in owners or not 'root' in parents) and trashed = false";
      } else {
        q = `'${parentId}' in parents and trashed = false`;
      }

      do {
        const response = await drive.files.list({
          q,
          fields: 'nextPageToken, files(id, name, size, mimeType, parents, modifiedTime)',
          pageSize: 1000,
          pageToken: nextPageToken,
          orderBy: 'folder, name',
        });

        const validFiles = response.data.files.filter((f) => f.id && f.name);
        allFiles.push(...validFiles);
        nextPageToken = response.data.nextPageToken;
      } while (nextPageToken);

      let items;

      if (parentId === 'root') {
        items = await Promise.all(
          allFiles
            .filter((f) => f.mimeType === 'application/vnd.google-apps.folder')
            .map(async (f) => {
              const { size, count } = await calculateFolderSizeAndCount(f.id, false);
              return {
                id: f.id,
                name: f.name,
                size: formatSize(size),
                count,
                isFolder: true,
                mimeType: f.mimeType,
                modifiedTime: f.modifiedTime,
              };
            })
        );
      } else {
        items = allFiles.map((f) => ({
          id: f.id,
          name: f.name,
          size:
            f.mimeType !== 'application/vnd.google-apps.folder'
              ? formatSize(f.size)
              : '-',
          count: undefined,
          isFolder: f.mimeType === 'application/vnd.google-apps.folder',
          mimeType: f.mimeType,
          modifiedTime: f.modifiedTime,
        }));
      }

      return res.json({ parentId, items });
    } catch (err) {
      console.error('File List Error:', err);
      return res
        .status(500)
        .json({ message: 'Failed to fetch file list', error: err.message });
    }
  },

  getTrashList: async (req, res) => {
    try {
      let allFiles = [];
      let nextPageToken = null;
      const qAll = 'trashed = true';
      const fields =
        'nextPageToken, files(id, name, size, mimeType, parents, modifiedTime)';

      do {
        const resFiles = await drive.files.list({
          q: qAll,
          fields,
          pageSize: 1000,
          pageToken: nextPageToken,
          orderBy: 'folder, name',
        });

        const validFiles = (resFiles.data.files || []).filter((f) => f.id && f.name);
        allFiles.push(...validFiles);
        nextPageToken = resFiles.data.nextPageToken;
      } while (nextPageToken);

      const trashedFolderIds = new Set(
        allFiles
          .filter((f) => f.mimeType === 'application/vnd.google-apps.folder')
          .map((f) => f.id)
      );

      const rootVisible = allFiles.filter((f) => {
        if (f.mimeType === 'application/vnd.google-apps.folder') return true;
        const parents = f.parents || [];
        const hasTrashedParent = parents.some((p) => trashedFolderIds.has(p));
        return !hasTrashedParent;
      });

      const items = await Promise.all(
        rootVisible.map(async (f) => {
          if (f.mimeType === 'application/vnd.google-apps.folder') {
            const { size, count } = await calculateFolderSizeAndCount(f.id, true);
            return {
              id: f.id,
              name: f.name,
              size: formatSize(size),
              count,
              isFolder: true,
              mimeType: f.mimeType,
              modifiedTime: f.modifiedTime,
            };
          }
          return {
            id: f.id,
            name: f.name,
            size:
              f.mimeType !== 'application/vnd.google-apps.folder'
                ? formatSize(f.size)
                : '-',
            isFolder: false,
            mimeType: f.mimeType,
            modifiedTime: f.modifiedTime,
          };
        })
      );

      return res.json({ items });
    } catch (err) {
      console.error('Trash List Error:', err);
      return res
        .status(500)
        .json({ message: 'Failed to fetch trash list', error: err.message });
    }
  },

  trashItem: async (req, res) => {
    const { fileId } = req.params;
    try {
      const confirm = req.body.confirm;
      if (!confirm)
        return res
          .status(400)
          .json({ message: 'Confirmation required to move to trash' });

      await drive.files.update({ fileId, requestBody: { trashed: true } });
      return res.json({ message: 'Item moved to trash' });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: 'Failed to trash item', error: err.message });
    }
  },

  deleteItemPermanent: async (req, res) => {
    const { fileId } = req.params;
    try {
      const confirm = req.body.confirm;
      if (!confirm)
        return res
          .status(400)
          .json({ message: 'Confirmation required to delete permanently' });

      await deleteFileRecursiveIfFolder(fileId);
      return res.json({ message: 'Item permanently deleted' });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: 'Failed to delete item permanently', error: err.message });
    }
  },

  emptyTrash: async (req, res) => {
    try {
      const confirm = req.body.confirm;
      if (!confirm)
        return res
          .status(400)
          .json({ message: 'Confirmation required to empty trash' });

      let nextPageToken = null;
      const q = 'trashed = true';

      do {
        const resFiles = await drive.files.list({
          q,
          fields: 'nextPageToken, files(id)',
          pageSize: 1000,
          pageToken: nextPageToken,
        });
        const files = resFiles.data.files || [];
        for (const f of files) {
          try {
            await deleteFileRecursiveIfFolder(f.id);
          } catch (e) {
            console.error('Failed to delete trashed item', f.id, e.message);
          }
        }
        nextPageToken = resFiles.data.nextPageToken;
      } while (nextPageToken);

      return res.json({ message: 'Trash emptied successfully' });
    } catch (err) {
      console.error('Empty Trash Error:', err);
      return res
        .status(500)
        .json({ message: 'Failed to empty trash', error: err.message });
    }
  },

  downloadItem: async (req, res) => {
    const { fileId } = req.params;
    const itemName = req.query.itemName || fileId;

    try {
      const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );
      res.setHeader('Content-Disposition', `attachment; filename="${itemName}"`);
      response.data.pipe(res);
    } catch (err) {
      console.error('Download Item Error:', err);
      return res
        .status(500)
        .json({ message: 'Failed to download item', error: err.message });
    }
  },
};
