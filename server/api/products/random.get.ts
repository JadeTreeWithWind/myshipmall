import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const config = useRuntimeConfig();
  const count = query.count ? Math.min(Number(query.count), 20) : 5;

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseSecretKey,
  );

  // 抓前 200 筆熱門商品後 server-side shuffle，避免每次結果相同
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, main_image, min_price, max_price, click_count, updated_at, shops!inner(id, name)",
    )
    .eq("status", 1)
    .order("click_count", { ascending: false })
    .range(0, 199);

  if (error) {
    throw createError({ statusCode: 500, message: error.message });
  }

  const shuffled = (data ?? [])
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  setHeader(
    event,
    "Cache-Control",
    "no-store",
  );

  return shuffled.map((p: any) => ({
    id: p.id,
    name: p.name,
    main_image: p.main_image,
    min_price: p.min_price,
    max_price: p.max_price,
    click_count: p.click_count,
    updated_at: p.updated_at,
    shop_name: p.shops?.name ?? "",
    shop_id: p.shops?.id ?? "",
  }));
});
