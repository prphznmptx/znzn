import { supabase } from './supabase';

/**
 * Validate that a URL is properly formatted and doesn't contain undefined/null
 */
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('undefined') || url.includes('null')) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Upload a file to Backblaze B2 via Supabase Edge Function
 * Replaces supabase.storage with B2
 */
export async function uploadToB2(
  file: File,
  folderPath: string
): Promise<{ publicUrl: string; error: string | null }> {
  try {
    const filename = `${folderPath}/${Date.now()}-${file.name}`;
    const contentType = file.type || 'application/octet-stream';

    // Upload file via Edge Function (server-side, no CORS issues)
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('filename', filename);
    uploadFormData.append('contentType', contentType);

    const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
      'upload-to-b2',
      {
        body: uploadFormData
      }
    );

    if (uploadError) {
      return {
        publicUrl: '',
        error: uploadError?.message || 'Failed to upload file to B2'
      };
    }

    if (!uploadData?.publicUrl) {
      return {
        publicUrl: '',
        error: 'No URL returned from upload. Please check server configuration.'
      };
    }

    // Validate the returned URL
    const publicUrl = uploadData.publicUrl as string;
    if (!isValidUrl(publicUrl)) {
      console.error('Invalid URL returned from B2 upload:', publicUrl);
      return {
        publicUrl: '',
        error: `Invalid URL returned from server: ${publicUrl}. Please check B2 configuration.`
      };
    }

    return {
      publicUrl,
      error: null
    };
  } catch (err) {
    return {
      publicUrl: '',
      error: err instanceof Error ? err.message : 'Upload failed'
    };
  }
}

/**
 * Get a B2 file URL from a stored filename
 */
export function getB2FileUrl(filename: string): string {
  return `${import.meta.env.VITE_B2_PUBLIC_URL}/${filename}`;
}

/**
 * Note: File deletion from B2 would require a separate Edge Function
 * For now, files can be managed through Backblaze B2 console
 */
