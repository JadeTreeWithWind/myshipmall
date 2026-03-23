import { createClient } from '@supabase/supabase-js'

const PAGE_SIZE = 20

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const config = useRuntimeConfig()

  const supabase = createClient(config.public.supabaseUrl, config.supabaseSecretKey)

  const keyword = (query.q as string) || ''
  const sort = (query.sort as string) || 'popular'
  const minPrice = query.min_price ? Number(query.min_price) : null
  const maxPrice = query.max_price ? Number(query.max_price) : null
  const offset = query.offset ? Number(query.offset) : 0

  // 先 SELECT products join shops
  let q = supabase
    .from('products')
    .select('id, name, main_image, min_price, max_price, click_count, updated_at, shops!inner(id, name)')
    .eq('status', 1)
    .range(offset, offset + PAGE_SIZE - 1)

  // 關鍵字搜尋：商品名稱 ILIKE（Trigram 索引會介入）
  // 若同時也要搜商城名稱，使用 or() 搭配 embedded filter
  if (keyword) {
    q = q.or(`name.ilike.%${keyword}%,shops.name.ilike.%${keyword}%`)
  }

  // 價格篩選（區間重疊）
  if (minPrice != null) q = q.gte('max_price', minPrice)
  if (maxPrice != null) q = q.lte('min_price', maxPrice)

  // 排序
  switch (sort) {
    case 'price_asc':
      q = q.order('min_price', { ascending: true })
      break
    case 'price_desc':
      q = q.order('max_price', { ascending: false })
      break
    case 'newest':
      q = q.order('updated_at', { ascending: false })
      break
    default: // popular
      q = q.order('click_count', { ascending: false })
  }

  const { data, error } = await q

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    main_image: p.main_image,
    min_price: p.min_price,
    max_price: p.max_price,
    click_count: p.click_count,
    updated_at: p.updated_at,
    shop_name: p.shops?.name ?? '',
    shop_id: p.shops?.id ?? '',
  }))
})
