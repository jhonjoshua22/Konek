import { createClient } from '@supabase/supabase-js';

// Pulling safely from your environmental variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Throw a visible warning structure if keys are missing to save debugging time
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environmental keys are missing. Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are defined.'
  );
}

// Exporting a singleton client connection instance
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);