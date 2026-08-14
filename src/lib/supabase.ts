import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Só a chave anon vive no bundle. O acesso real é decidido pela RLS do schema
// valdez: sem linha em valdez.admins, o login funciona e não lê nada.
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, { db: { schema: 'valdez' } })
    : null

export const supabaseReady = !!supabase
