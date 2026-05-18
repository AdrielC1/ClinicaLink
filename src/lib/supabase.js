import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

// Tambahkan pengaman ini:
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase Environment Variables! Periksa file .env atau .env.local Anda.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)