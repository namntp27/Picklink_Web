import { apiRequest } from './client';

export type SignatureResponse = {
  signature: string;
  timestamp: string;
  apiKey: string;
  cloudName: string;
};

export const getUploadSignature = (token: string, parameters: Record<string, string>) => {
  return apiRequest<SignatureResponse>('/api/Upload/signature', {
    method: 'POST',
    body: JSON.stringify({ parameters }),
  }, token);
};

const getResourceType = (file: File): string => {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  return 'raw';
};

export const uploadToCloudinary = async (
  token: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; publicId: string }> => {
  const resourceType = getResourceType(file);
  const folder = 'picklink_clubs';

  // Request signature from backend
  const sigData = await getUploadSignature(token, {
    folder,
  });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', sigData.apiKey);
  formData.append('timestamp', sigData.timestamp);
  formData.append('folder', folder);
  formData.append('signature', sigData.signature);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sigData.cloudName}/${resourceType}/upload`);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.secure_url || response.url,
            publicId: response.public_id,
          });
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.statusText} (${xhr.status})`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during Cloudinary upload'));
    };

    xhr.send(formData);
  });
};
