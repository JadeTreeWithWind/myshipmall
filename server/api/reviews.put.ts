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

  // ── 更新（只允許更新自己的評論）─────────────────────────────
  const { data, error } = await supabase
    .from('reviews')
    .update({ rating, content: content.trim() })
    .eq('product_id', product_id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data) throw createError({ statusCode: 404, message: '找不到您的評論' })

  return data
})
