import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function useSupabase() {
  const config = useRuntimeConfig()

  // Server-side：每次都建新 client（無 localStorage、無 auth）
  if (import.meta.server) {
    return createClient(
      config.public.supabaseUrl,
      config.public.supabasePublishableKey,
    )
  }

  // Client-side：singleton，確保 onAuthStateChange 只註冊一次
  if (!_client) {
    _client = createClient(
      config.public.supabaseUrl,
      config.public.supabasePublishableKey,
    )
  }
  return _client
}
