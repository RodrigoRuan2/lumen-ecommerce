import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env and restart Vite.')
}

if (supabaseUrl.includes('your-project.supabase.co')) {
  throw new Error('Supabase URL is still using the placeholder value. Replace it with your real Supabase project URL in frontend/.env.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function createUserProfile(user, name) {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email,
        name,
        role: 'customer'
      },
      { returning: 'minimal' }
    )

  return error
}

export async function getUserProfile(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  return { data, error }
}
