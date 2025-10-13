import { google } from 'googleapis';

// Initialize Google Drive with JWT
let drive;
try {
  const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    // Full scope needed for delete/download/move operations
    scopes: ['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/drive'],
  });

  drive = google.drive({ version: 'v3', auth });
} catch (err) {
  console.error('Failed to initialize Google Drive:', err.message);
  // Fallback or throw error if credentials are critical
  drive = google.drive({ version: 'v3' }); 
}

export { drive };

// Helper to format size
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

// -------------------- Fetch Drive Storage Quota --------------------
export const getStorageQuota = async (req, res) => {
  try {
    const aboutRes = await drive.about.get({
      fields: 'storageQuota,user',
    });

    const { storageQuota, user } = aboutRes.data;

    const userData = {
      name: user?.displayName || 'Unknown',
      email: user?.emailAddress || 'Unknown',
    };

    // Using formatSize for all size fields
    const storageData = {
      limit: storageQuota.limit
        ? formatSize(Number(storageQuota.limit))
        : 'Unlimited/Not Set',
      used: formatSize(Number(storageQuota.usage)),
      driveUsed: formatSize(Number(storageQuota.usageInDrive)),
      trashUsed: formatSize(Number(storageQuota.usageInDriveTrash)),
    };

    return res.json({ user: userData, storage: storageData });
  } catch (err) {
    console.error('Drive Quota Error:', err);
    return res.status(500).json({ message: 'Failed to fetch storage quota', error: err.message });
  }
};

// -------------------- Fetch Folder Contents (Non-Trashed) --------------------
export const getFileList = async (req, res) => {
    const parentId = req.query.parentId || 'root';

    try {
        let allFiles = [];
        let nextPageToken = null;

        // Query for files
        let q;
        if (parentId === 'root') {
            // Include files whose parent is root OR has no parent (orphaned files)
            q = "( 'root' in parents or 'root' in owners or not 'root' in parents ) and trashed = false";
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

            const validFiles = response.data.files.filter(f => f.id && f.name);
            allFiles.push(...validFiles);
            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);

        // Map items for UI
        const items = allFiles.map(f => ({
            id: f.id,
            name: f.name,
            size: f.mimeType !== 'application/vnd.google-apps.folder' ? formatSize(f.size) : '-',
            isFolder: f.mimeType === 'application/vnd.google-apps.folder',
            mimeType: f.mimeType,
            modifiedTime: f.modifiedTime,
        }));

        return res.json({ parentId, items });
    } catch (err) {
        console.error('File List Error:', err);
        return res.status(500).json({ message: 'Failed to fetch file list', error: err.message });
    }
};

// -------------------- Fetch Trash Contents --------------------

// -------------------- Fetch Trash Contents --------------------
export const getTrashList = async (req, res) => {
    try {
        let allFiles = [];
        let nextPageToken = null;

        // Query: only trashed items; we fetch parents to identify children of trashed folders
        const q = 'trashed = true';
        const fields = 'nextPageToken, files(id, name, size, mimeType, parents, modifiedTime)';

        // Order items by modification date descending for easier review
        const orderBy = 'modifiedTime desc';

        do {
            const resFiles = await drive.files.list({
                q,
                fields,
                pageSize: 1000,
                pageToken: nextPageToken,
                orderBy,
            });

            const validFiles = (resFiles.data.files || []).filter(f => f.id && f.name);
            allFiles.push(...validFiles);
            nextPageToken = resFiles.data.nextPageToken;
        } while (nextPageToken);

        // 1) Collect IDs of trashed folders
        const trashedFolderIds = new Set(
            allFiles
                .filter(f => f.mimeType === 'application/vnd.google-apps.folder')
                .map(f => f.id)
        );

        // 2) Keep:
        //    - All trashed folders (they should always appear),
        //    - Trashed files that are NOT children of any trashed folder.
        const topLevelTrashedItems = allFiles.filter(item => {
            if (item.mimeType === 'application/vnd.google-apps.folder') return true;

            const parents = item.parents || [];
            const isChildOfTrashedFolder = parents.some(pid => trashedFolderIds.has(pid));
            return !isChildOfTrashedFolder;
        });

        // Map for UI
        const items = topLevelTrashedItems.map(f => ({
            id: f.id,
            name: f.name,
            size: f.mimeType !== 'application/vnd.google-apps.folder' ? formatSize(f.size) : '-',
            isFolder: f.mimeType === 'application/vnd.google-apps.folder',
            mimeType: f.mimeType,
            modifiedTime: f.modifiedTime,
            parents: f.parents || [],
        }));

        return res.json({ items });

    } catch (err) {
        console.error('Trash List Error:', err);
        return res.status(500).json({ message: 'Failed to fetch trash list', error: err.message });
    }
};


// -------------------- Trash Item --------------------
export const trashItem = async (req, res) => {
  const { fileId } = req.params;
  try {
    const confirm = req.body.confirm;
    if (!confirm) return res.status(400).json({ message: 'Confirmation required to move to trash' });

    await drive.files.update({ fileId, requestBody: { trashed: true } });
    return res.json({ message: 'Item moved to trash' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to trash item', error: err.message });
  }
};

// -------------------- Restore Item --------------------
export const restoreItem = async (req, res) => {
  const { fileId } = req.params;
  try {
    const confirm = req.body.confirm;
    if (!confirm) return res.status(400).json({ message: 'Confirmation required to restore item' });

    await drive.files.update({ fileId, requestBody: { trashed: false } });
    return res.json({ message: 'Item restored' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to restore item', error: err.message });
  }
};

// -------------------- Permanently Delete Item --------------------
export const deleteItemPermanent = async (req, res) => {
  const { fileId } = req.params;
  try {
    const confirm = req.body.confirm;
    if (!confirm) return res.status(400).json({ message: 'Confirmation required to delete permanently' });

    await drive.files.delete({ fileId });
    return res.json({ message: 'Item permanently deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to delete item permanently', error: err.message });
  }
};

// -------------------- Download Item --------------------
export const downloadItem = async (req, res) => {
    const { fileId } = req.params;
    const isFolder = req.query.isFolder === 'true';
    const itemName = req.query.itemName || fileId;

    try {
        if (isFolder) {
            // For folders, we return a success message as recursive zipping of folders is complex 
            // and cannot be implemented simply in this environment.
            console.log(`Attempted download of folder: ${itemName} (${fileId}). Recursive zipping not implemented in this mock.`);
            return res.status(202).json({ 
                message: `Folder download request acknowledged for "${itemName}". Full folder zipping is complex and cannot be implemented in this demonstration. File download works directly.`,
                downloadMocked: true 
            });
        }

        // Handle direct file download
        const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${itemName}"`);
        
        // Pipe the file data to the response
        response.data.pipe(res);

    } catch (err) {
        console.error('Download Item Error:', err);
        return res.status(500).json({ message: 'Failed to download item', error: err.message });
    }
};
