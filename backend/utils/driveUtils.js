import { google } from 'googleapis';

// Initialize Google Drive service
let drive;
let auth;
try {
  const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);

  auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  drive = google.drive({ version: 'v3', auth });
} catch (error) {
  console.error('Failed to initialize Google Drive:', error.message);
  drive = google.drive({ version: 'v3' });
}

// Extract file/folder IDs
export const extractFileIdFromUrl = (url) => {
  const direct = url.match(/[?&]id=([^&]+)/);
  if (direct) return direct[1];
  const match = url.match(/\/file\/d\/([^/]+)/);
  return match ? match[1] : null;
};

export const extractFolderIdFromUrl = (url) => {
  const match = url.match(/\/folders\/([^/?]+)/);
  return match ? match[1] : null;
};

// Generate direct view URL
export const getDirectViewUrl = (url) => {
  const id = extractFileIdFromUrl(url);
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
};

// Create subfolder
export const createSubfolder = async (parentFolderId, name) => {
  try {
    const res = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
    });
    return res.data.id;
  } catch (err) {
    console.error('Error creating subfolder:', err);
    throw err;
  }
};

// Get files in folder
export const getFilesFromFolder = async (folderId) => {
  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'image/' or mimeType contains 'video/')`,
      fields: 'files(id, name, mimeType, webViewLink)',
    });
    return res.data.files;
  } catch (err) {
    console.error('Error fetching folder files:', err);
    throw err;
  }
};

export { drive, auth };
