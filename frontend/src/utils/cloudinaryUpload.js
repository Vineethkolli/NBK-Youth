import axios from 'axios';
import { API_URL } from './config';

// Get Cloudinary signature
export async function getCloudinarySignature(token, { folder, resourceType = 'auto', publicId, eager, overwrite }) {
  const res = await axios.post(
    `${API_URL}/api/uploads/sign`,
    {
      folder,
      public_id: publicId,
      eager,
      overwrite,
    },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );
  return res.data;
}

// 2️⃣ Direct upload using XHR for real-time progress
export async function uploadDirectToCloudinary({ file, folder, resourceType = 'auto', token, onProgress }) {
  const { cloudName, apiKey, signature, timestamp } = await getCloudinarySignature(token, { folder, resourceType });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', endpoint, true);

    // progress event for accurate real-time upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              url: response.secure_url,
              publicId: response.public_id,
              resourceType: response.resource_type,
            });
          } catch (err) {
            reject(new Error('Failed to parse Cloudinary response'));
          }
        } else {
          reject(new Error(`Cloudinary upload failed: ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));
    xhr.send(formData);
  });
}
