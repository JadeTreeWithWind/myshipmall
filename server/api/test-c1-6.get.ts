// C1-6 驗證：軟刪除機制正常運作
// 商品消失後 status = 0；再次匯入包含該商品時 status 恢復為 1
import { createClient } from '@supabase/supabase-js'

const TEST_SHOP_ID = 'TEST_C1_6_SOFTDELETE'
const PROD_KEEP = 'TEST_C1_6_PROD_KEEP'
const PROD_REMOVE = 'TEST_C1_6_PROD_REMOVE'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const supabase = createClient(config.public.supabaseUrl, config.supabaseSecretKey)

  const results: Record<string, unknown> = {}

  const makeShopData = (includeRemoved: boolean) => ({
    external_id: TEST_SHOP_ID,
    name: 'C1-6 測試賣場',
    shop_url: 'https://myship.7-11.com.tw/general/detail/GMTEST_C1_6',
    image_url: '',
    description: '',
    products: [
      {
        external_id: PROD_KEEP,
        name: '常駐商品',
        description: '',
        main_image: '',
        min_order: 1,
        max_order: 99,
        specs: [{ external_id: 'TEST_C1_6_SPEC_K', name: '規格', price: 100, sale_price: 0, image: '', stock: 10 }],
        images: [],
      },
      ...(includeRemoved
        ? [
            {
              external_id: PROD_REMOVE,
              name: '即將下架商品',
              description: '',
              main_image: '',
              min_order: 1,
              max_order: 99,
              specs: [{ external_id: 'TEST_C1_6_SPEC_R', name: '規格', price: 200, sale_price: 0, image: '', stock: 5 }],
              images: [],
            },
          ]
        : []),
    ],
  })

  // Step 1：兩件商品都匯入
  const { error: err1 } = await supabase.rpc('upsert_shop_with_products', {
    p_data: makeShopData(true),
  })
  if (err1) return { pass: false, step: '第一次匯入', error: err1.message }

  // 確認兩件都是 status=1
  const { data: beforeRows } = await supabase
    .from('products')
    .select('external_id, status')
    .in('external_id', [PROD_KEEP, PROD_REMOVE])

  results.before_import = {
    pass: beforeRows?.every((r) => r.status === 1) && beforeRows?.length === 2,
    rows: beforeRows,
  }

  // Step 2：只匯入常駐商品（移除即將下架商品）
  const { error: err2 } = await supabase.rpc('upsert_shop_with_products', {
    p_data: makeShopData(false),
  })
  if (err2) return { pass: false, step: '第二次匯入', error: err2.message }

  const { data: afterRows } = await supabase
    .from('products')
    .select('external_id, status')
    .in('external_id', [PROD_KEEP, PROD_REMOVE])

  const keepRow = afterRows?.find((r) => r.external_id === PROD_KEEP)
  const removeRow = afterRows?.find((r) => r.external_id === PROD_REMOVE)

  results.after_remove = {
    pass: keepRow?.status === 1 && removeRow?.status === 0,
    keep_status: keepRow?.status,
    removed_status: removeRow?.status,
  }

  // Step 3：再次匯入包含下架商品，確認 status 恢復為 1
  const { error: err3 } = await supabase.rpc('upsert_shop_with_products', {
    p_data: makeShopData(true),
  })
  if (err3) return { pass: false, step: '第三次匯入', error: err3.message }

  const { data: restoreRows } = await supabase
    .from('products')
    .select('external_id, status')
    .in('external_id', [PROD_KEEP, PROD_REMOVE])

  results.after_restore = {
    pass: restoreRows?.every((r) => r.status === 1),
    rows: restoreRows,
  }

  // 清理
  await supabase.from('shops').delete().eq('external_id', TEST_SHOP_ID)

  const allPass = Object.values(results).every((r: any) => r.pass)

  return {
    checkpoint: 'C1-6',
    description: '軟刪除機制正常運作',
    pass: allPass,
    results,
  }
})
