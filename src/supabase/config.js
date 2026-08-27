// Supabase Configuration
// Replace these values with your Supabase project details.
// Get them from: https://supabase.com/dashboard → Project Settings → API

const supabaseConfig = {
  // Your project URL, e.g. "https://abcdefgh.supabase.co"
  projectUrl: 'YOUR_PROJECT_URL',
  // The public bucket where book PDFs are stored, e.g. "books"
  publicBucket: 'books'
};

// Returns true only when real Supabase credentials are present.
// When false, volumes must use an explicit downloadUrl/pdfUrl instead.
export const isSupabaseConfigured = () => {
  if (typeof window === 'undefined') return false;
  return !Object.values(supabaseConfig).some(
    (value) => typeof value === 'string' && value.startsWith('YOUR_')
  );
};

export default supabaseConfig;
