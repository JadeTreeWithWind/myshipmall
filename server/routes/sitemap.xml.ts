import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const siteUrl = config.public.siteUrl;

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseSecretKey,
  );

  // 取得所有上架商品
  const { data: products } = await supabase
    .from("products")
    .select("id, updated_at")
    .eq("status", 1)
    .order("updated_at", { ascending: false });

  // 取得所有商城
  const { data: shops } = await supabase
    .from("shops")
    .select("id, updated_at")
    .order("updated_at", { ascending: false });

  const toW3C = (dateStr: string) =>
    new Date(dateStr).toISOString().split("T")[0];

  const productUrls = (products ?? [])
    .map(
      (p) => `
  <url>
    <loc>${siteUrl}/product/${p.id}</loc>
    <lastmod>${toW3C(p.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join("");

  const shopUrls = (shops ?? [])
    .map(
      (s) => `
  <url>
    <loc>${siteUrl}/shop/${s.id}</loc>
    <lastmod>${toW3C(s.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
    )
    .join("");

  const staticUrls = `
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://sitemaps.org/schemas/sitemap/0.9">
${staticUrls}${shopUrls}${productUrls}
</urlset>`;

  setHeader(event, "Content-Type", "application/xml");
  return xml;
});
