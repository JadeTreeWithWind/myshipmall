import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/a11y", "@nuxt/image", "@nuxt/icon"],
  app: {
    head: {
      htmlAttrs: { lang: "zh-Hant" },
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        // 非阻塞字型載入：preload + onload 教學，減少 render-blocking
        {
          rel: "preload",
          as: "style",
          href: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Noto+Serif+TC:wght@400;500;600;700&display=swap",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Noto+Serif+TC:wght@400;500;600;700&display=swap",
          media: "print",
          onload: "this.media='all'",
        },
      ],
      script: [
        {
          src: "https://challenges.cloudflare.com/turnstile/v0/api.js",
          async: true,
          defer: true,
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
    public: {
      supabaseUrl: "",
      supabasePublishableKey: "",
      turnstileSiteKey: "",
      siteUrl: "https://myshipmall.pages.dev",
    },
  },
});
