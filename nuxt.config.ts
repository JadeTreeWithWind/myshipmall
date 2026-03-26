import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/a11y", "@nuxt/image", "@nuxt/icon"],
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
      ],
    },
  },
  css: ["@/assets/main.css"],
  vite: {
    plugins: [tailwindcss()],
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
