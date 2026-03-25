import { createClient } from "@supabase/supabase-js";
import { verifyTurnstile } from "../utils/verifyTurnstile";
import { checkRateLimit } from "../utils/checkRateLimit";
import { validateMyshipUrl, hashUrl } from "../utils/scrapeMyship";
import type { ShopData } from "../utils/types";

export default defineEventHandler(async (event) => {
  const { cloudflare } = event.context;

  if (!cloudflare?.env?.SCRAPE_CACHE || !cloudflare?.env?.RATE_LIMIT) {
    throw createError({
      statusCode: 500,
      message: "KV binding 未設定，請確認 Cloudflare 部署設定",
    });
  }

  const scrapeCache = cloudflare.env.SCRAPE_CACHE as KVNamespace;
  const rateLimit = cloudflare.env.RATE_LIMIT as KVNamespace;

  const body = await readBody(event);
  const { url, turnstile_token } = body ?? {};

  if (!url || !turnstile_token) {
    throw createError({
      statusCode: 400,
      message: "缺少必要欄位：url 或 turnstile_token",
    });
  }

  // 1. 驗證 Turnstile
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
  await verifyTurnstile(turnstile_token, ip);

  // 2. Rate Limit（每 IP 每小時 5 次）
  await checkRateLimit(rateLimit, ip, "confirm-import", 5);

  // 3. 驗證網址格式
  validateMyshipUrl(url);

  // 4. 從 KV 讀取快取
  const cacheKey = `scrape:${await hashUrl(url)}`;
  const cached = await scrapeCache.get(cacheKey);

  if (!cached) {
    throw createError({
      statusCode: 410,
      message: "預覽資料已過期，請重新讀取賣場資料",
    });
  }

  const shopData: ShopData = JSON.parse(cached);

  // 5. 呼叫 DB Function 原子性寫入
  const config = useRuntimeConfig(event);
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseSecretKey,
  );

  const { error } = await supabase.rpc("upsert_shop_with_products", {
    p_data: shopData,
  });

  if (error) {
    throw createError({
      statusCode: 500,
      message: `資料庫寫入失敗：${error.message}`,
    });
  }

  const { data: shopRow, error: shopError } = await supabase
    .from("shops")
    .select("id")
    .eq("external_id", shopData.external_id)
    .single();

  if (shopError || !shopRow) {
    throw createError({
      statusCode: 500,
      message: "無法取得商城 ID，請稍後再試",
    });
  }

  // 6. 寫入成功後刪除 KV 快取
  await scrapeCache.delete(cacheKey);

  return {
    success: true,
    shop_id: shopRow.id as string,
    shop_name: shopData.name,
    product_count: shopData.products.length,
  };
});
