<script setup lang="ts">
// Imports
import {
  TERMS_DESC,
  TERMS_LAST_UPDATED,
  TERMS_SECTIONS as SECTIONS,
} from "~/constants/text";

// Constants
const config = useRuntimeConfig();

// Lifecycle Hooks
useHead({
  title: "條款與免責聲明",
  link: [{ rel: "canonical", href: `${config.public.siteUrl}/terms` }],
  meta: [
    { name: "description", content: TERMS_DESC },
    { property: "og:title", content: "條款與免責聲明 | 賣貨便商城" },
    { property: "og:description", content: TERMS_DESC },
    { property: "og:image", content: `${config.public.siteUrl}/og-image.png` },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `${config.public.siteUrl}/terms` },
    { name: "twitter:card", content: "summary" },
  ],
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6">
    <!-- ── Hero ── -->
    <div class="mb-14 text-center">
      <h1 class="text-base-content mb-3 text-3xl font-semibold lg:text-4xl">
        條款與免責聲明
      </h1>
      <p class="text-base-content/90 mt-4 text-base leading-relaxed">
        {{ TERMS_DESC }}
      </p>
    </div>

    <!-- ── 各節 ── -->
    <div class="space-y-6">
      <section
        v-for="s in SECTIONS"
        :key="s.title"
        class="bg-base-100 border-base-300/70 rounded-2xl border p-6 lg:p-8"
      >
        <div class="mb-4 flex items-center gap-3">
          <div
            class="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          >
            <Icon :name="s.icon" class="text-primary text-base sm:text-lg" />
          </div>
          <h2 class="text-base font-semibold sm:text-lg">
            {{ s.title }}
          </h2>
        </div>
        <ul class="space-y-4">
          <li
            v-for="(para, i) in s.content"
            :key="i"
            class="text-base-content/80 flex gap-2 text-sm leading-relaxed sm:text-base"
          >
            <span class="text-primary mt-1.5 shrink-0 text-xs">＊</span>
            <span class="text-">{{ para }}</span>
          </li>
        </ul>
      </section>
    </div>

    <!-- ── 最後更新 ── -->
    <p class="text-base-content/50 mt-8 text-center text-xs">
      最後更新：{{ TERMS_LAST_UPDATED }}
    </p>

    <!-- ── CTA ── -->
    <div
      class="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
    >
      <NuxtLink to="/" class="btn btn-primary cursor-pointer rounded-xl px-6"
        >探索商品</NuxtLink
      >
      <NuxtLink
        to="/about"
        class="btn btn-outline cursor-pointer rounded-xl px-6"
        >關於我們</NuxtLink
      >
    </div>
  </div>
</template>
