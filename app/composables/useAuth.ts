import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const user = useState<User | null>('auth:user', () => null)
  const supabase = useSupabase()

  /**
   * 初始化：讀取現有 session，並監聽後續 auth 狀態變更。
   * 應在 app.vue 的 onMounted 呼叫一次。
   * @returns {() => void} 呼叫後可取消 auth 狀態監聽，避免 memory leak
   */
  async function init(): Promise<() => void> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    user.value = session?.user ?? null

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })

    return () => subscription.unsubscribe()
  }

  async function signIn() {
    localStorage.setItem(
      'auth:redirect',
      window.location.pathname + window.location.search,
    )
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  /** 取得 JWT token，用於 API 呼叫的 Authorization header */
  async function getToken(): Promise<string | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  return { user, init, signIn, signOut, getToken }
}
