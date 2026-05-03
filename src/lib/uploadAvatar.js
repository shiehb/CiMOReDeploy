import { supabase } from './supabase';

const BUCKET = 'avatars';
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Uploads a profile photo to Supabase Storage under avatars/{safeUserId}/avatar.{ext}
 * and returns the public URL (with a cache-buster so browsers always load the new image).
 *
 * @param {File}   file   - Image file selected by the user.
 * @param {string|number} userId - The user's numeric/UUID ID from the backend (NOT email/username).
 * @returns {Promise<string>} Public URL of the uploaded avatar.
 */
export async function uploadAvatar(file, userId) {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('Image must be 5 MB or smaller.');
  }

  // Strip any characters that are unsafe in a storage path (@, dots, spaces, etc.)
  const safeId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${safeId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: true,       // overwrite existing photo instead of returning a conflict error
      contentType: file.type,
    });

  if (uploadError) {
    console.error('[uploadAvatar] Storage upload error:', uploadError);

    if (
      uploadError.statusCode === '403' ||
      uploadError.message?.toLowerCase().includes('row-level security') ||
      uploadError.message?.toLowerCase().includes('policy') ||
      uploadError.message?.toLowerCase().includes('permission')
    ) {
      throw new Error(
        'Upload blocked by a storage policy (RLS). Ensure the "avatars" bucket has an INSERT policy for anon/authenticated users.'
      );
    }
    if (uploadError.statusCode === '413' || uploadError.message?.toLowerCase().includes('too large')) {
      throw new Error('Image must be 5 MB or smaller.');
    }
    throw new Error(uploadError.message || 'Storage upload failed.');
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Append a timestamp so the browser never serves the cached old photo
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
  return publicUrl;
}
