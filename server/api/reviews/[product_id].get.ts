import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const product_id = getRouterParam(event, 'product_id')
  if (!product_id) throw createError({ statusCode: 400, message: 'product_id 必填' })

  const config = useRuntimeConfig(event)
  const supabase = createClient(config.public.supabaseUrl, config.supabaseSecretKey)

  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, content, created_at, user_name, user_avatar')
    .eq('product_id', product_id)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
