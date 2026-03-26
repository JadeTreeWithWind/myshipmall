import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/a11y", "@nuxt/image", "@nuxt/icon", "@vite-pwa/nuxt"],
  experimental: {
    viewTransition: true,
  },
  app: {
    head: {
      htmlAttrs: { lang: "zh-Hant" },
      meta: [
        { name: "theme-color", content: "#ffffff" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "format-detection", content: "telephone=no" },
      ],
      link: [
        { rel: "icon", type: "image/png", href: "/favicon.png" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        // 非阻塞字型載入：media="print" + onload 切換，避免 render-blocking
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap",
          media: "print",
          onload: "this.media='all'",
        },
      ],
      script: [
        // 🔹 這裡加入小小 Inline Script，防止主題閃爍 (Theme Flicker)
        {
          innerHTML: `(function() {
            const saved = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'halloween' : 'lofi');
            document.documentElement.setAttribute('data-theme', saved);
          })()`,
          type: "text/javascript",
        },
        // 🔹 Speculation Rules API：預先 prefetch/prerender 頁面以加速導航
        {
          type: "speculationrules",
          innerHTML: JSON.stringify({
            prefetch: [
              {
                where: {
                  and: [
                    { href_matches: "/*" },
                    { not: { href_matches: "/admin/*" } },
                    { not: { href_matches: "/auth/*" } },
                    { not: { href_matches: "/import" } },
                  ],
                },
                eagerness: "moderate",
              },
            ],
            prerender: [
              {
                where: {
                  or: [
                    { href_matches: "/" },
                    { href_matches: "/shop/*" },
                    { href_matches: "/product/*" },
                    { href_matches: "/search" },
                  ],
                },
                eagerness: "conservative",
              },
            ],
          }),
        },
      ],
    },
  },
  css: ["@/assets/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "MyShipMall",
      short_name: "MyShipMall",
      description: "購物評價平台",
      lang: "zh-Hant",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
      orientation: "portrait",
      start_url: "/",
      icons: [
        {
          src: "/icons/pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/icons/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/icons/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
    workbox: {
      navigateFallback: null, // SSR 模式不使用 fallback，保持 SSR 正常運作
      globPatterns: [], // SSR 模式不 precache，改由 runtimeCaching 處理
      runtimeCaching: [
        {
          // 靜態資源：Cache First，一年
          urlPattern: /\/_nuxt\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "nuxt-assets",
            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          // 圖片：Cache First，30 天
          urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
          handler: "CacheFirst",
          options: {
            cacheName: "images",
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          // API（Supabase）：Network First，失敗才用快取
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "supabase-api",
            networkTimeoutSeconds: 5,
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
      type: "module",
    },
  },
  nitro: {
    preset: "cloudflare-pages",
  },
  runtimeConfig: {
    supabaseSecretKey: "",
    turnstileSecretKey: "",
    adminEmail: "",
    public: {
      supabaseUrl: "",
      supabasePublishableKey: "",
      turnstileSiteKey: "",
      siteUrl: "https://myshipmall.pages.dev",
    },
  },
});