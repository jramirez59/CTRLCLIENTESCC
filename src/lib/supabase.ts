import { createClient } from '@supabase/supabase-js'
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
export const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
export const configOk = !!supabaseUrl && !!supabaseKey && !supabaseUrl.startsWith('PEGA')
export const supabase = createClient(configOk ? supabaseUrl : 'http://localhost', configOk ? supabaseKey : 'x')
