import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // Only throw in browser/client-side to avoid build errors if envs are missing during static generation
    // console.warn('Missing Supabase Environment Variables'); 
}

console.log('Initializing Supabase client with URL:', supabaseUrl?.substring(0, 20) + '...');

// Fallback to prevent build crash if env vars are missing (e.g. during build)
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder';

export const supabase = createClient(url, key);
