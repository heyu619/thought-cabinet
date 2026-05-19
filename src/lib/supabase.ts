import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ywhhayauksioynsnphln.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aGhheWF1a3Npb3luc25waGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODgxNTcsImV4cCI6MjA5NDQ2NDE1N30.E6CNM7bMVck2RZmuAbquwjDv7l3-ctigwzemhsYv1Qw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})
