import { google } from 'googleapis';
import { Readable } from 'stream';

// Initialize Google Drive service
const drive = google.drive({
  version: 'v3',
  auth: new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/drive'],
  }),
});

// Helper function to extract Google Drive file ID from URL
export const extractFileIdFromUrl = (url) => {
  const directMatch = url.match(/[?&]id=([^&]+)/);
  if (directMatch) {
    return directMatch[1];
  }
  
  const fileMatch = url.match(/\/file\/d\/([^\/]+)/);
  if (fileMatch) {
    return fileMatch[1];
  }
  
  return null;
};

// Helper function to extract folder ID from URL
export const extractFolderIdFromUrl = (url) => {
  const folderMatch = url.match(/\/folders\/([^/?]+)/);
  if (folderMatch) {
    return folderMatch[1];
  }
  return null;
};

// Helper function to get direct view URL from Drive sharing URL
export const getDirectViewUrl = (url) => {
  const fileId = extractFileIdFromUrl(url);
  if (!fileId) return url;
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

// Helper function to create subfolder
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

// Helper function to get all files from a folder
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
