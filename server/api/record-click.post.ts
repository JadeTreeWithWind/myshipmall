import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const productId = body?.product_id as string | undefined;

  if (!productId) {
    throw createError({ statusCode: 400, message: "product_id 為必填" });
  }

  const config = useRuntimeConfig();
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseSecretKey,
  );

  // 取得 IP
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";

  // 1. 確認商品存在
  const { data: product, error: productErr } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("status", 1)
    .single();

  if (productErr || !product) {
    throw createError({ statusCode: 404, message: "商品不存在" });
  }

  // 2. IP 防刷：同 IP + 同商品，過去 1 小時最多 3 次
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("purchase_clicks")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("ip", ip)
    .gte("clicked_at", oneHourAgo);

  if ((count ?? 0) >= 3) {
    throw createError({ statusCode: 429, message: "已超過點擊頻率限制" });
  }

  // 3. 寫入點擊記錄
  await supabase.from("purchase_clicks").insert({ product_id: productId, ip });

  // 4. 原子性累加 click_count
  await supabase.rpc("increment_click_count", { p_id: productId });

  return { success: true };
});
