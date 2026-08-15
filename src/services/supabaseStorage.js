import supabaseConfig, { isSupabaseConfigured } from '../supabase/config';

// Builds the public download URL for a file stored in the Supabase public bucket.
// Public bucket URLs work with plain fetch from the browser (CORS enabled),
// so downloads show progress and are stored locally on the device.
export const getSupabasePublicUrl = (path) => {
  if (!isSupabaseConfigured() || !path) return null;
  const base = supabaseConfig.projectUrl.replace(/\/+$/, '');
  const bucket = supabaseConfig.publicBucket.replace(/^\/+|\/+$/g, '');
  return `${base}/storage/v1/object/public/${bucket}/${path.replace(/^\/+/, '')}`;
};

// Resolves the file URL of a volume in priority order:
// 1. explicit downloadUrl (any host, e.g. a direct CDN link)
// 2. storagePath → Supabase public storage URL (when configured)
// 3. bundled pdfUrl (Volume 1 ships with the app)
export const resolveVolumeUrl = (volume) => {
  if (!volume) return null;
  if (volume.downloadUrl) return volume.downloadUrl;
  if (volume.storagePath) {
    const url = getSupabasePublicUrl(volume.storagePath);
    if (url) return url;
  }
  if (volume.pdfUrl) return volume.pdfUrl;
  return null;
};

export default {
  getSupabasePublicUrl,
  resolveVolumeUrl
};
