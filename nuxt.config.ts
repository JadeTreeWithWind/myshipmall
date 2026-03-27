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
        { name: "theme-color", content: "#000000" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
      ],
      link: [
        { rel: "icon", type: "image/png", href: "/favicon.png" },
        // app.head.link 裡加這行
        { rel: "manifest", href: "/manifest.webmanifest" },
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
        {
          rel: "apple-touch-icon",
          href: "/apple-touch-icon-180x180.png",
          sizes: "180x180",
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
      name: "賣貨商城",
      short_name: "賣貨商城",
      description: "購物評價平台",
      lang: "zh-Hant",
      theme_color: "#000000",
      background_color: "#80D1CA",
      display: "standalone",
      orientation: "portrait",
      start_url: "/",
      icons: [
        { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
        {
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      navigateFallback: "/",
      navigateFallbackAllowlist: [/^\/$/],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts",
            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
          },
        },
        {
          urlPattern: /\.(png|jpg|jpeg|svg|webp|avif)$/i,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "images",
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
          },
        },
      ],
    },
    devOptions: {
      enabled: false,
      type: "module",
      suppressWarnings: true,
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
      siteUrl: "https://myshipmall.org",
    },
  },
});
