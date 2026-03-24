import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  // ── 驗證 JWT ──────────────────────────────────────────────────
  const authHeader = getRequestHeader(event, 'authorization')
  const token = authHeader?.replace('Bearer ', '').trim()
  if (!token) throw createError({ statusCode: 401, message: '請先登入' })

  const config = useRuntimeConfig(event)
  const supabase = createClient(config.public.supabaseUrl, config.supabaseSecretKey)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    throw createError({ statusCode: 401, message: '登入已失效，請重新登入' })
  }

  // ── 驗證 body ─────────────────────────────────────────────────
  const body = await readBody(event)
  const { product_id, rating, content } = body ?? {}

  if (!product_id) throw createError({ statusCode: 400, message: 'product_id 必填' })
  if (!rating || rating < 1 || rating > 5)
    throw createError({ statusCode: 400, message: 'rating 需為 1～5 的整數' })
  if (!content?.trim()) throw createError({ statusCode: 400, message: '評論內容不可為空' })

  // ── 寫入 ──────────────────────────────────────────────────────
  const userName: string =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? '匿名'
  const userAvatar: string | null =
    user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id,
      user_id: user.id,
      rating,
      content: content.trim(),
      user_name: userName,
      user_avatar: userAvatar,
    })
    .select()
    .single()

  if (error) {
    // unique(product_id, user_id) 衝突
    if (error.code === '23505') {
      throw createError({ statusCode: 409, message: '您已評論過此商品，如需修改請使用編輯功能' })
    }
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
