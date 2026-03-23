// C1-5 驗證：重複匯入為 upsert（不產生重複資料）
// 用法：/api/test-c1-5（使用固定測試資料，不需真實網址）
import { createClient } from '@supabase/supabase-js'

const TEST_SHOP_ID = 'TEST_C1_5_UPSERT'
const TEST_PRODUCT_ID = 'TEST_C1_5_PROD_001'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const supabase = createClient(config.public.supabaseUrl, config.supabaseSecretKey)

  const results: Record<string, unknown> = {}

  // 準備測試資料
  const shopData = {
    external_id: TEST_SHOP_ID,
    name: 'C1-5 測試賣場',
    shop_url: 'https://myship.7-11.com.tw/general/detail/GMTEST_C1_5',
    image_url: '',
    description: '',
    products: [
      {
        external_id: TEST_PRODUCT_ID,
        name: '測試商品（第一次匯入）',
        description: '',
        main_image: '',
        min_order: 1,
        max_order: 99,
        specs: [
          { external_id: 'TEST_C1_5_SPEC_001', name: '規格A', price: 100, sale_price: 0, image: '', stock: 10 },
        ],
        images: [],
      },
    ],
  }

  // 第一次匯入
  const { error: err1 } = await supabase.rpc('upsert_shop_with_products', { p_data: shopData })
  if (err1) {
    return { pass: false, step: '第一次匯入', error: err1.message }
  }

  // 第二次匯入（改名稱 + 改規格價格，驗證 upsert）
  const shopData2 = {
    ...shopData,
    name: 'C1-5 測試賣場（已更新）',
    products: [
      {
        ...shopData.products[0],
        name: '測試商品（第二次匯入，已更新）',
        specs: [
          { external_id: 'TEST_C1_5_SPEC_001', name: '規格A（已更新）', price: 200, sale_price: 0, image: '', stock: 5 },
        ],
      },
    ],
  }
  const { error: err2 } = await supabase.rpc('upsert_shop_with_products', { p_data: shopData2 })
  if (err2) {
    return { pass: false, step: '第二次匯入', error: err2.message }
  }

  // 驗證：shops 表中 TEST_SHOP_ID 只有一筆
  const { data: shopRows } = await supabase
    .from('shops')
    .select('id, name')
    .eq('external_id', TEST_SHOP_ID)

  results.no_duplicate_shop = {
    pass: shopRows?.length === 1,
    count: shopRows?.length,
    name: shopRows?.[0]?.name,
    expected_name: 'C1-5 測試賣場（已更新）',
    name_updated: shopRows?.[0]?.name === 'C1-5 測試賣場（已更新）',
  }

  // 驗證：products 表中 TEST_PRODUCT_ID 只有一筆，且名稱已更新
  const { data: productRows } = await supabase
    .from('products')
    .select('id, name, min_price, max_price')
    .eq('external_id', TEST_PRODUCT_ID)

  results.no_duplicate_product = {
    pass: productRows?.length === 1,
    count: productRows?.length,
    name: productRows?.[0]?.name,
    price_updated: productRows?.[0]?.min_price === 200 && productRows?.[0]?.max_price === 200,
    min_price: productRows?.[0]?.min_price,
    max_price: productRows?.[0]?.max_price,
  }

  // 清理測試資料
  await supabase.from('shops').delete().eq('external_id', TEST_SHOP_ID)

  const allPass = Object.values(results).every((r: any) => r.pass)

  return {
    checkpoint: 'C1-5',
    description: '重複匯入為 upsert，不產生重複資料',
    pass: allPass,
    results,
  }
})
