// Step 8：Cloudflare Workers Cron Trigger handler
// 每 5 天 ping Supabase 一次，防止免費方案閒置暫停
// wrangler.toml 中設定：crons = ["0 0 */5 * *"]
export default defineNitroPlugin((nitroApp) => {
  // @ts-ignore — Nitro cloudflare-pages preset 提供的 hook
  nitroApp.hooks.hook("cloudflare:scheduled", async ({ event, env }) => {
    console.log("[cron] keep-alive triggered:", event.cron);

    const config = useRuntimeConfig();
    const supabaseUrl =
      config.public.supabaseUrl || env.NUXT_PUBLIC_SUPABASE_URL;
    const anonKey =
      config.public.supabasePublishableKey ||
      env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    try {
      const res = await $fetch(
        `${supabaseUrl}/rest/v1/shops?select=id&limit=1`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
        },
      );
      console.log("[cron] keep-alive ping success");
    } catch (err) {
      console.error("[cron] keep-alive ping failed:", err);
    }
  });
});
