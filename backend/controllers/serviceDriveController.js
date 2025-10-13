import { google } from 'googleapis';

// Initialize Google Drive with JWT
let drive;
try {
    const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);

    const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [
            'https://www.googleapis.com/auth/drive.metadata.readonly',
            'https://www.googleapis.com/auth/drive'
        ],
    });

    drive = google.drive({ version: 'v3', auth });
} catch (err) {
    console.error('Failed to initialize Google Drive:', err.message);
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

export const getStorageQuota = async (req, res) => {
    try {
        const aboutRes = await drive.about.get({ fields: 'storageQuota,user' });
        const { storageQuota, user } = aboutRes.data;

        const userData = {
            name: user?.displayName || 'Unknown',
            email: user?.emailAddress || 'Unknown',
        };

        const storageData = {
            limit: storageQuota.limit ? formatSize(Number(storageQuota.limit)) : 'Unlimited/Not Set',
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

const calculateFolderSizeAndCount = async (folderId) => {
    let totalSize = 0;
    let totalCount = 0;

    let nextPageToken = null;
    const q = `'${folderId}' in parents and trashed = false`;

    do {
        const res = await drive.files.list({
            q,
            fields: 'nextPageToken, files(id, name, size, mimeType)',
            pageSize: 1000,
            pageToken: nextPageToken,
        });

        const files = res.data.files || [];
        files.forEach(f => {
            if (f.mimeType !== 'application/vnd.google-apps.folder') {
                totalSize += Number(f.size || 0);
                totalCount += 1;
            }
        });

        nextPageToken = res.data.nextPageToken;
    } while (nextPageToken);

    return { size: totalSize, count: totalCount };
};

export const getFileList = async (req, res) => {
    const parentId = req.query.parentId || 'root';

    try {
        let allFiles = [];
        let nextPageToken = null;

        let q;
        if (parentId === 'root') {
            q = "('root' in parents or 'root' in owners or not 'root' in parents) and trashed = false";
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

        let items;

        if (parentId === 'root') {
            // Show only folders initially with size & count
            items = await Promise.all(
                allFiles
                    .filter(f => f.mimeType === 'application/vnd.google-apps.folder')
                    .map(async (f) => {
                        const { size, count } = await calculateFolderSizeAndCount(f.id);
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
            // Inside a folder, show all items normally
            items = allFiles.map(f => ({
                id: f.id,
                name: f.name,
                size: f.mimeType !== 'application/vnd.google-apps.folder' ? formatSize(f.size) : '-',
                count: undefined,
                isFolder: f.mimeType === 'application/vnd.google-apps.folder',
                mimeType: f.mimeType,
                modifiedTime: f.modifiedTime,
            }));
        }

        return res.json({ parentId, items });
    } catch (err) {
        console.error('File List Error:', err);
        return res.status(500).json({ message: 'Failed to fetch file list', error: err.message });
    }
};

const calculateFolderSizeAndCountTrash = async (folderId) => {
    let totalSize = 0;
    let totalCount = 0;

    let nextPageToken = null;
    const q = `'${folderId}' in parents and trashed = true`;

    do {
        const res = await drive.files.list({
            q,
            fields: 'nextPageToken, files(id, name, size, mimeType)',
            pageSize: 1000,
            pageToken: nextPageToken,
        });

        const files = res.data.files || [];
        files.forEach(f => {
            if (f.mimeType !== 'application/vnd.google-apps.folder') {
                totalSize += Number(f.size || 0);
                totalCount += 1;
            }
        });

        nextPageToken = res.data.nextPageToken;
    } while (nextPageToken);

    return { size: totalSize, count: totalCount };
};

export const getTrashList = async (req, res) => {
    const parentId = req.query.parentId || 'root'; // use query to drill into folders in trash

    try {
        let allFiles = [];
        let nextPageToken = null;

        const q = parentId === 'root' ? 'trashed = true' : `'${parentId}' in parents and trashed = true`;
        const fields = 'nextPageToken, files(id, name, size, mimeType, parents, modifiedTime)';
        const orderBy = 'folder, name';

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

        let items;

        if (parentId === 'root') {
            // Show only folders at top-level trash
            items = await Promise.all(
                allFiles
                    .filter(f => f.mimeType === 'application/vnd.google-apps.folder')
                    .map(async (f) => {
                        const { size, count } = await calculateFolderSizeAndCountTrash(f.id);
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
            // Inside a trash folder, show all items normally
            items = allFiles.map(f => ({
                id: f.id,
                name: f.name,
                size: f.mimeType !== 'application/vnd.google-apps.folder' ? formatSize(f.size) : '-',
                count: undefined,
                isFolder: f.mimeType === 'application/vnd.google-apps.folder',
                mimeType: f.mimeType,
                modifiedTime: f.modifiedTime,
            }));
        }

        return res.json({ parentId, items });
    } catch (err) {
        console.error('Trash List Error:', err);
        return res.status(500).json({ message: 'Failed to fetch trash list', error: err.message });
    }
};


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

export const downloadItem = async (req, res) => {
    const { fileId } = req.params;
    const isFolder = req.query.isFolder === 'true';
    const itemName = req.query.itemName || fileId;

    try {
        if (isFolder) {
            console.log(`Attempted download of folder: ${itemName} (${fileId}). Recursive zipping not implemented.`);
            return res.status(202).json({
                message: `Folder download request acknowledged for "${itemName}". File download works directly.`,
                downloadMocked: true
            });
        }

        const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
        res.setHeader('Content-Disposition', `attachment; filename="${itemName}"`);
        response.data.pipe(res);

    } catch (err) {
        console.error('Download Item Error:', err);
        return res.status(500).json({ message: 'Failed to download item', error: err.message });
    }
};

