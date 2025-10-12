import { google } from 'googleapis';
import { Readable } from 'stream';

// Initialize Google Drive service
const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);

const auth = new google.auth.JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({
  version: 'v3',
  auth,
});


// Extract Google Drive file ID from URL
export const extractFileIdFromUrl = (url) => {
  const directMatch = url.match(/[?&]id=([^&]+)/);
  if (directMatch) return directMatch[1];

  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) return fileMatch[1];

  return null;
};

// Extract folder ID from URL
export const extractFolderIdFromUrl = (url) => {
  const folderMatch = url.match(/\/folders\/([^/?]+)/);
  if (folderMatch) return folderMatch[1];
  return null;
};

// Get direct view URL
export const getDirectViewUrl = (url) => {
  const fileId = extractFileIdFromUrl(url);
  return fileId ? `https://drive.google.com/uc?export=view&id=${fileId}` : url;
};

// Create subfolder in Drive
export const createSubfolder = async (parentFolderId, subfolderName) => {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: subfolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
    });
    return response.data.id;
  } catch (error) {
    console.error('Error creating subfolder:', error);
    throw error;
  }
};

// List files in a folder
export const getFilesFromFolder = async (folderId) => {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'image/' or mimeType contains 'video/')`,
      fields: 'files(id, name, mimeType, webViewLink)',
    });
    return response.data.files;
  } catch (error) {
    console.error('Error getting files from folder:', error);
    throw error;
  }
};

export { drive, Readable };
