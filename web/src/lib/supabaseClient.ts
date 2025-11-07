import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please check your .env.local file in the web/ directory.')
  console.error('Required variables:')
  console.error('  VITE_SUPABASE_URL=https://egepmpvtvpsqfcihbiml.supabase.co')
  console.error('  VITE_SUPABASE_ANON_KEY=your-anon-key-here')
  // Don't throw - just log and use placeholder values to prevent blank screen
  console.warn('⚠️ Using placeholder Supabase client. Some features may not work.')
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('❌ Invalid Supabase URL format. It should start with https://')
}

// Validate key format (JWT tokens start with eyJ)
if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
  console.error('❌ Invalid Supabase anon key format. It should be a JWT token starting with eyJ')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Log client initialization
console.log('🔧 Supabase client initialized:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey?.substring(0, 20) + '...',
})


