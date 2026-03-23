// C0-5 + C0-6 驗證：Supabase 連線 + upsert_shop_with_products
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  if (!config.public.supabaseUrl || !config.supabaseSecretKey) {
    return {
      success: false,
      error: "環境變數未設定：NUXT_PUBLIC_SUPABASE_URL 或 NUXT_SUPABASE_SECRET_KEY",
    };
  }

  const supabase = createClient(config.public.supabaseUrl, config.supabaseSecretKey);

  const testPayload = {
    external_id: "TEST_SHOP_CHECKPOINT0",
    name: "Checkpoint 0 測試賣場",
    shop_url: "https://myship.7-11.com.tw/general/detail/GMTEST",
    image_url: "",
    description: "",
    products: [
      {
        external_id: "TEST_PROD_C0_001",
        name: "測試商品 A",
        description: "",
        main_image: "",
        min_order: 1,
        max_order: 99,
        specs: [
          {
            external_id: "TEST_SPEC_C0_001",
            name: "預設規格",
            price: 299,
            sale_price: 0,
            image: "",
            stock: 10,
          },
        ],
        images: [{ url: "https://example.com/img.jpg", ordering: 0 }],
      },
    ],
  };

  // 呼叫 DB Function（C0-5）
  const { data: fnResult, error: fnError } = await supabase.rpc(
    "upsert_shop_with_products",
    { p_data: testPayload }
  );

  if (fnError) {
    return { success: false, step: "upsert_shop_with_products", error: fnError.message };
  }

  // 驗證資料確實寫入（C0-6 連線驗證）
  const { data: shopRow, error: selectError } = await supabase
    .from("shops")
    .select("id, name, external_id")
    .eq("external_id", "TEST_SHOP_CHECKPOINT0")
    .single();

  if (selectError) {
    return { success: false, step: "select verify", error: selectError.message };
  }

  // 清理測試資料
  await supabase.from("shops").delete().eq("external_id", "TEST_SHOP_CHECKPOINT0");

  return {
    success: true,
    functionResult: fnResult,
    verifiedShop: shopRow,
  };
});
