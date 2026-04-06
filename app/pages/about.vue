<script setup lang="ts">
// 外部引用
import {
  ABOUT_DESC,
  ABOUT_STORY as STORY,
  ABOUT_FEATURES as FEATURES,
  ABOUT_HOW_IT_WORKS_BUYER as HOW_IT_WORKS_BUYER,
  ABOUT_HOW_IT_WORKS_SELLER as HOW_IT_WORKS_SELLER,
  ABOUT_FAQS as FAQS,
} from "~/constants/text";

// 常量宣告
const config = useRuntimeConfig();

// 生命週期鉤子
useHead({
  title: "關於我們",
  link: [{ rel: "canonical", href: `${config.public.siteUrl}/about` }],
  meta: [
    { name: "description", content: ABOUT_DESC },
    { property: "og:title", content: "關於 賣貨便商城" },
    { property: "og:description", content: ABOUT_DESC },
    { property: "og:image", content: `${config.public.siteUrl}/og-image.png` },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `${config.public.siteUrl}/about` },
    { name: "twitter:card", content: "summary" },
  ],
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6">
    <!-- ── Hero ── -->
    <div class="mb-14 text-center">
      <h1 class="text-base-content mb-3 text-3xl font-semibold lg:text-4xl">
        關於 賣貨便商城
      </h1>
      <p class="text-base-content/90 mt-4 text-sm leading-relaxed sm:text-base">
        {{ ABOUT_DESC }}
      </p>
    </div>

    <!-- ── 理念 ── -->
    <section class="mb-12">
      <div class="mb-5 flex items-center gap-3">
        <div
          class="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        >
          <Icon :name="STORY.icon" class="text-primary h-4 w-4" />
        </div>
        <h2 class="text-xl font-semibold">{{ STORY.title }}</h2>
      </div>
      <div
        class="bg-base-100 border-base-300/70 space-y-3 rounded-2xl border p-6 lg:p-8"
      >
        <p
          v-for="para in STORY.content"
          :key="para"
          class="text-base-content/90 text-sm leading-relaxed sm:text-base"
        >
          {{ para }}
        </p>
      </div>
    </section>

    <!-- ── 功能介紹 ── -->
    <section class="mb-12">
      <div class="mb-5 flex items-center gap-3">
        <div class="bg-primary h-5 w-1 rounded-full" />
        <h2 class="text-xl font-semibold">核心功能</h2>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          v-for="f in FEATURES"
          :key="f.title"
          class="bg-base-100 border-base-300/70 flex gap-4 rounded-xl border p-4"
        >
          <div
            class="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          >
            <Icon :name="f.icon" class="text-primary h-4 w-4" />
          </div>
          <div>
            <p class="mb-1 text-sm font-semibold sm:text-base">{{ f.title }}</p>
            <p
              class="text-base-content/80 text-sm leading-relaxed sm:text-base"
            >
              {{ f.desc }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 使用流程 ── -->
    <section class="mb-12">
      <div class="mb-5 flex items-center gap-3">
        <div class="bg-primary h-5 w-1 rounded-full" />
        <h2 class="text-xl font-semibold">怎麼使用？</h2>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- 買家 -->
        <div
          class="bg-base-100 border-base-300/70 rounded-2xl border p-6 lg:p-8"
        >
          <div class="mb-4 flex items-center gap-3">
            <div
              class="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            >
              <Icon
                :name="HOW_IT_WORKS_BUYER.icon"
                class="text-primary h-4 w-4"
              />
            </div>
            <h3 class="text-sm font-semibold sm:text-base">
              {{ HOW_IT_WORKS_BUYER.title }}
            </h3>
          </div>
          <ol class="space-y-3">
            <li
              v-for="s in HOW_IT_WORKS_BUYER.steps"
              :key="s.step"
              class="flex gap-3"
            >
              <span
                class="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                >{{ s.step }}</span
              >
              <div>
                <p class="mb-0.5 text-sm font-semibold sm:text-base">
                  {{ s.title }}
                </p>
                <p
                  class="text-base-content/70 text-sm leading-relaxed sm:text-base"
                >
                  {{ s.desc }}
                </p>
              </div>
            </li>
          </ol>
        </div>
        <!-- 賣家 -->
        <div
          class="bg-base-100 border-base-300/70 rounded-2xl border p-6 lg:p-8"
        >
          <div class="mb-4 flex items-center gap-3">
            <div
              class="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            >
              <Icon
                :name="HOW_IT_WORKS_SELLER.icon"
                class="text-primary h-4 w-4"
              />
            </div>
            <h3 class="text-sm font-semibold sm:text-base">
              {{ HOW_IT_WORKS_SELLER.title }}
            </h3>
          </div>
          <ol class="space-y-3">
            <li
              v-for="s in HOW_IT_WORKS_SELLER.steps"
              :key="s.step"
              class="flex gap-3"
            >
              <span
                class="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                >{{ s.step }}</span
              >
              <div>
                <p class="mb-0.5 text-sm font-semibold sm:text-base">
                  {{ s.title }}
                </p>
                <p
                  class="text-base-content/70 text-sm leading-relaxed sm:text-base"
                >
                  {{ s.desc }}
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- ── FAQ ── -->
    <section class="mb-12">
      <div class="mb-5 flex items-center gap-3">
        <div class="bg-primary h-5 w-1 rounded-full" />
        <h2 class="text-xl font-semibold">常見問題</h2>
      </div>
      <div class="flex flex-col gap-2">
        <div
          v-for="faq in FAQS"
          :key="faq.q"
          class="collapse-arrow bg-base-100 border-base-300/70 collapse rounded-xl border"
        >
          <input type="checkbox" />
          <div class="collapse-title py-4 text-sm font-medium sm:text-base">
            {{ faq.q }}
          </div>
          <div class="collapse-content">
            <p
              class="text-base-content/80 pb-2 text-sm leading-relaxed sm:text-base"
            >
              {{ faq.a }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 免責聲明 ── -->
    <section
      class="border-base-300/70 bg-base-200/40 mb-10 rounded-2xl border p-6"
    >
      <h2 class="text-base-content/90 mb-2 text-sm font-semibold sm:text-base">
        免責聲明
      </h2>
      <p class="text-base-content/70 text-sm leading-relaxed sm:text-base">
        賣貨便商城是非官方獨立平台，與統一超商或賣貨便官方完全無關。商品資訊由使用者自行匯入，本站不保證資料的即時性與完整性。所有購買行為皆在賣貨便官方平台進行，本站不承擔任何交易相關責任。
      </p>
      <NuxtLink
        to="/terms"
        class="text-primary mt-3 inline-flex items-center gap-1 text-sm hover:underline sm:text-base"
      >
        查看完整條款與免責聲明
        <Icon name="heroicons:arrow-right" class="h-3.5 w-3.5" />
      </NuxtLink>
    </section>

    <!-- ── CTA ── -->
    <div class="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <NuxtLink to="/" class="btn btn-primary cursor-pointer rounded-xl px-6"
        >探索商品</NuxtLink
      >
      <NuxtLink
        to="/import"
        class="btn btn-outline cursor-pointer rounded-xl px-6"
        >匯入我的賣場</NuxtLink
      >
    </div>
  </div>
</template>
