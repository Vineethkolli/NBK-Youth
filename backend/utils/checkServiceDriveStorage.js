// Command: node utils/checkServiceDriveStorage.js

import 'dotenv/config';
import { google } from 'googleapis';

// Initialize Google Drive API
const drive = google.drive({
  version: 'v3',
  auth: new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/drive.metadata.readonly'],
  }),
});

// Check overall storage
async function checkStorage() {
  try {
    const res = await drive.about.get({
      fields: 'storageQuota,user',
    });

    const { storageQuota, user } = res.data;

    console.log(`👤 User: ${user?.displayName || 'Unknown'}`);
    console.log(`📧 Email: ${user?.emailAddress || 'Unknown'}`);
    console.log(`📦 Storage Quota Info:`);
    console.log(
      `   Limit     : ${
        storageQuota.limit
          ? (storageQuota.limit / 1024 ** 3).toFixed(2) + ' GB'
          : 'Unlimited/Not Set'
      }`
    );
    console.log(`   Usage     : ${(storageQuota.usage / 1024 ** 3).toFixed(2)} GB`);
    console.log(
      `   Drive Used: ${(storageQuota.usageInDrive / 1024 ** 3).toFixed(2)} GB`
    );
    console.log(
      `   Trash Used: ${(storageQuota.usageInDriveTrash / 1024 ** 3).toFixed(2)} GB`
    );
  } catch (error) {
    console.error(' Failed to get storage info:', error.response?.data || error.message);
  }
}

// List files based on trashed state
async function listFiles(trashed = false) {
  let files = [];
  let pageToken = null;

  do {
    const res = await drive.files.list({
      q: `trashed=${trashed}`,
      fields: 'nextPageToken, files(id, name, size, parents, mimeType)',
      pageSize: 1000,
      pageToken,
    });

    files.push(...res.data.files);
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return files;
}

// Build folder map based on trashed state
async function buildFolderMap(trashed = false) {
  let folders = {};
  let pageToken = null;

  do {
    const res = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and trashed=${trashed}`,
      fields: 'nextPageToken, files(id, name, parents)',
      pageSize: 1000,
      pageToken,
    });

    for (const f of res.data.files) {
      folders[f.id] = f;
    }

    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return folders;
}

// Calculate and print info
async function calculateUsage(trashed = false) {
  try {
    const [allFiles, folders] = await Promise.all([
      listFiles(trashed),
      buildFolderMap(trashed),
    ]);

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

    console.log(trashed ? '\n🗑️ Files & Folders in Trash:' : '\n📁 Files & Folders in Drive:');

    for (const [folderId, size] of Object.entries(usageByFolder)) {
      const name = folders[folderId]?.name || '(Unknown Folder)';
      const count = fileCountByFolder[folderId] || 0;
      console.log(
        `📂 ${name} (${folderId}): ${(size / 1024 ** 3).toFixed(2)} GB, ${count} files`
      );
    }

    if (rootUsage > 0) {
      console.log(
        `📄 Files directly in ${trashed ? 'Trash root' : 'My Drive root'}: ${(rootUsage / 1024 ** 3).toFixed(2)} GB, ${rootFileCount} files`
      );
    }
  } catch (err) {
    console.error(' Error calculating usage:', err.message);
  }
}

(async () => {
  await checkStorage();
  await calculateUsage(false); 
  await calculateUsage(true); 
})();
