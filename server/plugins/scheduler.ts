// C0-8：Cloudflare Cron Trigger handler
// 定期 ping Supabase 防止 free tier 休眠
// 驗證完成後可將 wrangler.toml 的 crons 改為 ["0 0 */3 * *"]（每 3 天）
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("cloudflare:scheduled", async ({ event, config }) => {
    console.log("[cron] triggered at", new Date().toISOString());

    const supabaseUrl = config?.env?.NUXT_PUBLIC_SUPABASE_URL as string | undefined;
    const serviceKey = config?.env?.NUXT_SUPABASE_SECRET_KEY as string | undefined;

    if (!supabaseUrl || !serviceKey) {
      console.warn("[cron] 環境變數未設定，跳過 ping");
      return;
    }

    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/shops?select=id&limit=1`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });
      console.log("[cron] Supabase ping status:", res.status);
    } catch (e) {
      console.error("[cron] ping failed:", e);
    }
  });
});
