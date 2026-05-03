import { supabase } from './supabase';

const BUCKET = 'uploads';
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Uploads any file to Supabase Storage under the given folder and returns the public URL.
 * Each upload gets a unique path using a timestamp so files are never overwritten.
 *
 * Buckets used:  uploads/chat/{safeUser}/{ts}_{filename}
 *                uploads/requests/{safeUser}/{ts}_{filename}
 *
 * @param {File}   file   - File to upload.
 * @param {string} folder - Sub-path inside the bucket (e.g. "chat/john_doe").
 * @returns {Promise<string>} Public URL of the uploaded file.
 */
export async function uploadFile(file, folder) {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('File must be 10 MB or smaller.');
  }

  const safeFolder = String(folder).replace(/[^a-zA-Z0-9/_-]/g, '_');
  const safeName   = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path       = `${safeFolder}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) {
    console.error('[uploadFile] Storage error:', error);
    if (
      error.statusCode === '403' ||
      error.message?.toLowerCase().includes('row-level security') ||
      error.message?.toLowerCase().includes('policy') ||
      error.message?.toLowerCase().includes('permission')
    ) {
      throw new Error(
        'Upload blocked by a storage policy (RLS). Ensure the "uploads" bucket has an INSERT policy.'
      );
    }
    if (error.statusCode === '413' || error.message?.toLowerCase().includes('too large')) {
      throw new Error('File must be 10 MB or smaller.');
    }
    throw new Error(error.message || 'Storage upload failed.');
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
