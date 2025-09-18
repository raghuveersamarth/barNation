import { createClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Console warning instead of throwing to avoid breaking Metro bundler at startup
  console.warn(
    'Supabase env vars are missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    detectSessionInUrl: true,
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Handle deep links (barnation://auth-callback)
Linking.addEventListener('url', ({ url }) => {
  supabase.auth.onAuthStateChange((_event, _session) => {
    // no-op: ensure client processes url; on SDK v2, processing happens automatically
  });
});
