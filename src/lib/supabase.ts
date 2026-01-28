import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // Only throw in browser/client-side to avoid build errors if envs are missing during static generation
    // console.warn('Missing Supabase Environment Variables'); 
}

console.log('Initializing Supabase client with URL:', supabaseUrl?.substring(0, 20) + '...');

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);
