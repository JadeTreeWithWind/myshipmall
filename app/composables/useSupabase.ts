import { createClient } from '@supabase/supabase-js'

export function useSupabase() {
  const config = useRuntimeConfig()

  const client = createClient(
    config.public.supabaseUrl,
    config.public.supabasePublishableKey,
  )

  return client
}
