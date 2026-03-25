import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseSecretKey,
  );

  const [{ count: productCount }, { count: shopCount }] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("status", 1),
    supabase.from("shops").select("*", { count: "exact", head: true }),
  ]);

  setHeader(
    event,
    "Cache-Control",
    "public, max-age=300, stale-while-revalidate=60",
  );

  return {
    products: productCount ?? 0,
    shops: shopCount ?? 0,
  };
});
