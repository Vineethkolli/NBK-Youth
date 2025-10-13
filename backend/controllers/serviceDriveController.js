import { google } from 'googleapis';

// Initialize Google Drive with JWT
let drive;
try {
  const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/drive'],
  });

  drive = google.drive({ version: 'v3', auth });
} catch (err) {
  console.error('Failed to initialize Google Drive:', err.message);
  drive = google.drive({ version: 'v3' }); 
}

export { drive };


// Fetch Service Account Drive Data
export const getDriveMonitorData = async (req, res) => {
  try {
    const aboutRes = await drive.about.get({
      fields: 'storageQuota,user',
    });

    const { storageQuota, user } = aboutRes.data;

    const userData = {
      name: user?.displayName || 'Unknown',
      email: user?.emailAddress || 'Unknown',
    };

    const storageData = {
      limit: storageQuota.limit
        ? (storageQuota.limit / 1024 ** 3).toFixed(2) + ' GB'
        : 'Unlimited/Not Set',
      used: (storageQuota.usage / 1024 ** 3).toFixed(2) + ' GB',
      driveUsed: (storageQuota.usageInDrive / 1024 ** 3).toFixed(2) + ' GB',
      trashUsed: (storageQuota.usageInDriveTrash / 1024 ** 3).toFixed(2) + ' GB',
    };

    // Get all files
    let allFiles = [];
    let nextPageToken = null;

    do {
      const resFiles = await drive.files.list({
        q: 'trashed=false',
        fields: 'nextPageToken, files(id, name, size, parents, mimeType)',
        pageSize: 1000,
        pageToken: nextPageToken,
      });
      allFiles.push(...resFiles.data.files);
      nextPageToken = resFiles.data.nextPageToken;
    } while (nextPageToken);

    // Get all folders
    let folders = {};
    nextPageToken = null;
    do {
      const resFolders = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'nextPageToken, files(id, name, parents)',
        pageSize: 1000,
        pageToken: nextPageToken,
      });
      for (const f of resFolders.data.files) {
        folders[f.id] = f;
      }
      nextPageToken = resFolders.data.nextPageToken;
    } while (nextPageToken);

    // Calculate folder usage
    let usageByFolder = {};
    let fileCountByFolder = {};
    let rootUsage = 0;
    let rootFileCount = 0;

    for (const file of allFiles) {
      if (file.mimeType === 'application/vnd.google-apps.folder') continue;
      const size = Number(file.size || 0);
      const parent = file.parents?.[0];

      if (parent) {
        usageByFolder[parent] = (usageByFolder[parent] || 0) + size;
        fileCountByFolder[parent] = (fileCountByFolder[parent] || 0) + 1;
      } else {
        rootUsage += size;
        rootFileCount += 1;
      }
    }

    const foldersList = Object.entries(usageByFolder).map(([folderId, size]) => ({
      id: folderId,
      name: folders[folderId]?.name || '(Unknown Folder)',
      sizeGB: size / 1024 ** 3,
      fileCount: fileCountByFolder[folderId] || 0,
    }));

    if (rootUsage > 0) {
      foldersList.push({
        id: 'root',
        name: 'My Drive Root',
        sizeGB: rootUsage / 1024 ** 3,
        fileCount: rootFileCount,
      });
    }

    return res.json({
      user: userData,
      storage: storageData,
      folders: foldersList,
    });
  } catch (error) {
    console.error('❌ Drive Monitor Error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch drive data', error: error.message });
  }
};

// Trash Folder
export const trashFolder = async (req, res) => {
  const { fileId } = req.params;
  try {
    await drive.files.update({ fileId, requestBody: { trashed: true } });
    return res.json({ message: 'Folder moved to trash' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to trash folder', error: err.message });
  }
};

// Restore Folder
export const restoreFolder = async (req, res) => {
  const { fileId } = req.params;
  try {
    await drive.files.update({ fileId, requestBody: { trashed: false } });
    return res.json({ message: 'Folder restored' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to restore folder', error: err.message });
  }
};

// Permanently Delete Folder
export const deleteFolderPermanent = async (req, res) => {
  const { fileId } = req.params;
  try {
    await drive.files.delete({ fileId });
    return res.json({ message: 'Folder permanently deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to delete folder permanently', error: err.message });
  }
};
