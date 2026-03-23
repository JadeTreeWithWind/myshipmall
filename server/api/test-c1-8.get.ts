// C1-8 驗證：DB Function transaction 完整性
// 傳入會讓 DB Function 失敗的資料，確認整筆 rollback，不會出現部分寫入
import { createClient } from '@supabase/supabase-js'

const TEST_SHOP_ID = 'TEST_C1_8_TRANSACTION'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const supabase = createClient(config.public.supabaseUrl, config.supabaseSecretKey)

  const results: Record<string, unknown> = {}

  // Step 1：確認測試賣場在 DB 中不存在（清理殘留）
  await supabase.from('shops').delete().eq('external_id', TEST_SHOP_ID)

  // Step 2：傳入 null name 的商品，讓 DB Function 在 products INSERT 時失敗
  // （products.name 是 NOT NULL）
  const badData = {
    external_id: TEST_SHOP_ID,
    name: 'C1-8 Transaction 測試賣場',
    shop_url: 'https://myship.7-11.com.tw/general/detail/GMTEST_C1_8',
    image_url: '',
    description: '',
    products: [
      {
        external_id: 'TEST_C1_8_PROD_OK',
        name: '正常商品',
        description: '',
        main_image: '',
        min_order: 1,
        max_order: 99,
        specs: [],
        images: [],
      },
      {
        external_id: 'TEST_C1_8_PROD_BAD',
        name: null, // 這應該觸發 NOT NULL 違反
        description: '',
        main_image: '',
        min_order: 1,
        max_order: 99,
        specs: [],
        images: [],
      },
    ],
  }

  const { error: fnError } = await supabase.rpc('upsert_shop_with_products', {
    p_data: badData,
  })

  results.function_failed = {
    pass: fnError !== null,
    error: fnError?.message ?? '（沒有錯誤，這不正常）',
  }

  // Step 3：確認 shops 表中沒有 TEST_SHOP_ID（transaction rollback 正常）
  const { data: shopRows } = await supabase
    .from('shops')
    .select('id')
    .eq('external_id', TEST_SHOP_ID)

  results.rollback_shop = {
    pass: shopRows?.length === 0,
    count: shopRows?.length,
    message: shopRows?.length === 0 ? '賣場沒有被寫入，rollback 正確' : '賣場被部分寫入，transaction 有問題',
  }

  // Step 4：確認 products 表中也沒有任何 TEST_C1_8 的商品
  const { data: productRows } = await supabase
    .from('products')
    .select('id')
    .like('external_id', 'TEST_C1_8_%')

  results.rollback_products = {
    pass: productRows?.length === 0,
    count: productRows?.length,
    message: productRows?.length === 0 ? '商品也沒有被寫入，rollback 完整' : '部分商品被寫入，transaction 不完整',
  }

  // 清理（以防萬一）
  await supabase.from('shops').delete().eq('external_id', TEST_SHOP_ID)

  const allPass = Object.values(results).every((r: any) => r.pass)

  return {
    checkpoint: 'C1-8',
    description: 'DB Function transaction 完整性',
    pass: allPass,
    results,
  }
})
