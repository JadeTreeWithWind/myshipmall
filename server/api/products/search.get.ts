import { createClient } from "@supabase/supabase-js";

const PAGE_SIZE = 20;

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const config = useRuntimeConfig();

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseSecretKey,
  );

  const keyword = (query.q as string) || "";
  const sort = (query.sort as string) || "popular";
  const minPrice = query.min_price ? Number(query.min_price) : null;
  const maxPrice = query.max_price ? Number(query.max_price) : null;
  const offset = query.offset ? Number(query.offset) : 0;
  const limit = query.limit ? Math.min(Number(query.limit), 200) : PAGE_SIZE;

  // 先 SELECT products join shops
  let q = supabase
    .from("products")
    .select(
      "id, name, main_image, min_price, max_price, click_count, updated_at, shops!inner(id, name)",
    )
    .eq("status", 1)
    .range(offset, offset + limit - 1);

  // 關鍵字搜尋：商品名稱 ILIKE（Trigram 索引介入）
  // PostgREST 不支援 or() 跨 embedded table，shop name 搜尋另外處理
  if (keyword) {
    // 找出名稱符合 keyword 的 shop IDs
    const { data: matchedShops } = await supabase
      .from("shops")
      .select("id")
      .ilike("name", `%${keyword}%`);

    const shopIds = (matchedShops ?? []).map((s: any) => s.id);

    if (shopIds.length > 0) {
      // 商品名稱 OR 商城名稱都符合
      // 注意：keyword 直接嵌入 or() 字串有特殊字符風險，
      // 改用 .or() 搭配 .ilike() 建構，並以 encodeURIComponent 保護 keyword
      // PostgREST 的 ilike filter 值需使用 % 作萬用字元，逗號、括號需跳脫
      const escapedKeyword = keyword.replace(/[(),%]/g, (c) => `\\${c}`);
      q = q.or(
        `name.ilike.%${escapedKeyword}%,shop_id.in.(${shopIds.join(",")})`,
      );
    } else {
      q = q.ilike("name", `%${keyword}%`);
    }
  }

  // 價格篩選（區間重疊）
  if (minPrice != null) q = q.gte("max_price", minPrice);
  if (maxPrice != null) q = q.lte("min_price", maxPrice);

  // 排序
  switch (sort) {
    case "price_asc":
      q = q.order("min_price", { ascending: true });
      break;
    case "price_desc":
      q = q.order("max_price", { ascending: false });
      break;
    case "newest":
      q = q.order("updated_at", { ascending: false });
      break;
    default: // popular
      q = q.order("click_count", { ascending: false });
  }

  const { data, error } = await q;

  if (error) {
    throw createError({ statusCode: 500, message: error.message });
  }

  // 搜尋結果短暫快取（無 keyword 的熱門頁可多快取一點）
  const maxAge = keyword ? 30 : 120;
  setHeader(
    event,
    "Cache-Control",
    `public, max-age=${maxAge}, stale-while-revalidate=60`,
  );

  return (data ?? []).map((p: any) => ({
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
