<script setup lang="ts">
// 1. Imports (None)

// 2. Types (None)

// 3. Constants
const config = useRuntimeConfig();
const DESC =
  "了解 賣貨商城 如何幫助您瀏覽 7-11 賣貨便商品，以及如何將您的賣場匯入本平台。";

const FEATURES = [
  {
    icon: "heroicons:magnifying-glass",
    title: "強力搜尋",
    desc: "支援中文模糊搜尋，依商品名稱或商城名稱快速找到目標商品。",
  },
  {
    icon: "heroicons:building-storefront",
    title: "商城頁面",
    desc: "每個賣場都有獨立頁面，方便買家瀏覽同一賣家的所有商品。",
  },
  {
    icon: "heroicons:arrow-up-tray",
    title: "一鍵匯入",
    desc: "賣家只需貼上賣貨便網址，即可將整個賣場資料匯入本平台，無需登入。",
  },
  {
    icon: "heroicons:star",
    title: "評論系統",
    desc: "買家可透過 Google 登入後留下評論與評分，協助其他人做出購買決策。",
  },
  {
    icon: "heroicons:fire",
    title: "熱門排序",
    desc: "依購買點擊數排序，讓最受歡迎的商品自然浮現在搜尋結果頂部。",
  },
  {
    icon: "heroicons:device-phone-mobile",
    title: "行動裝置友好",
    desc: "全站響應式設計，在手機、平板、桌機上都能順暢瀏覽。",
  },
];

const FAQS = [
  {
    q: "賣貨商城 與 7-11 賣貨便是什麼關係？",
    a: "賣貨商城 是由獨立開發者建立的非官方展示平台，與統一超商或賣貨便官方完全無關。本站不經手任何金流，所有購買行為皆導向賣貨便官方頁面完成。",
  },
  {
    q: "購買流程是什麼？",
    a: "在商品詳細頁點擊「前往賣貨便購買」按鈕，將開啟新視窗導向 7-11 賣貨便的原始商品頁面，後續的購買、付款、取貨等流程皆在賣貨便平台上完成，與本站無關。",
  },
  {
    q: "如何把我的賣貨便賣場匯入本站？",
    a: "前往「匯入賣場」頁面，在輸入框貼上您的賣貨便賣場網址（格式為 https://myship.7-11.com.tw/general/detail/GM...），通過驗證後點擊「讀取賣場資料」，確認預覽內容後按下「確認匯入」即可。整個過程不需要登入，任何人皆可使用。",
  },
  {
    q: "商品資料多久更新一次？",
    a: "本站不會自動同步賣貨便的最新資料。商品資料僅在賣家主動執行匯入時更新。若您是賣家，建議每次更新商品後重新匯入，以確保本站顯示的資料與賣貨便一致。",
  },
  {
    q: "我可以評論商品嗎？",
    a: "可以，但需要先以 Google 帳號登入。每位使用者對同一商品只能留下一則評論，且可以事後編輯。未登入的訪客仍可瀏覽所有評論。",
  },
  {
    q: "商品資料顯示錯誤或已下架，該怎麼辦？",
    a: "若您是賣家，請重新匯入最新的賣場資料即可更新。若商品在賣貨便已下架，重新匯入後該商品會自動標記為下架，不再顯示於搜尋結果。",
  },
];

// 4. State/Variables (None)

// 5. Computed Properties (None)

// 6. Functions/Methods (None)

// 7. Watchers (None)

// 8. Lifecycle Hooks
useHead({
  title: "關於 賣貨商城 — 賣貨便商品瀏覽平台",
  meta: [
    { name: "description", content: DESC },
    { property: "og:title", content: "關於 賣貨商城" },
    { property: "og:description", content: DESC },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `${config.public.siteUrl}/about` },
    { name: "twitter:card", content: "summary" },
  ],
});
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <!-- ── Hero ── -->
    <div class="mb-14 text-center">
      <h1
        class="text-base-content mb-3 font-serif text-3xl font-semibold lg:text-4xl"
      >
        關於 賣貨商城
      </h1>
      <p class="text-base-content/90 text-base leading-relaxed">
        為賣貨便賣家與買家打造的非官方商品瀏覽平台
      </p>
    </div>

    <!-- ── 理念 ── -->
    <section class="mb-12">
      <div class="mb-5 flex items-center gap-3">
        <div class="bg-primary h-5 w-1 rounded-full" />
        <h2 class="font-serif text-xl font-semibold">為什麼建立這個網站？</h2>
      </div>
      <div
        class="bg-base-100 border-base-300/70 space-y-3 rounded-2xl border p-6 lg:p-8"
      >
        <p class="text-base-content/90 text-base leading-relaxed">
          7-11
          賣貨便是台灣常見的電商物流服務，但官方平台缺乏獨立商品頁面與搜尋功能，買家很難快速找到想要的商品，賣家也無法方便地分享特定商品連結。
        </p>
        <p class="text-base-content/90 text-base leading-relaxed">
          賣貨商城 作為「展示層」，讓每個賣貨便商品都有獨立的 URL，支援 SEO
          與社群分享，並提供搜尋、篩選、排序等功能，提升買賣雙方的體驗。
        </p>
      </div>
    </section>

    <!-- ── 功能介紹 ── -->
    <section class="mb-12">
      <div class="mb-5 flex items-center gap-3">
        <div class="bg-primary h-5 w-1 rounded-full" />
        <h2 class="font-serif text-xl font-semibold">核心功能</h2>
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
            <p class="mb-1 text-sm font-semibold">{{ f.title }}</p>
            <p class="text-base-content/80 text-sm leading-relaxed">
              {{ f.desc }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FAQ ── -->
    <section class="mb-12">
      <div class="mb-5 flex items-center gap-3">
        <div class="bg-primary h-5 w-1 rounded-full" />
        <h2 class="font-serif text-xl font-semibold">常見問題</h2>
      </div>
      <div class="flex flex-col gap-2">
        <div
          v-for="faq in FAQS"
          :key="faq.q"
          class="collapse-arrow bg-base-100 border-base-300/70 collapse rounded-xl border"
        >
          <input type="checkbox" />
          <div class="collapse-title py-4 text-sm font-medium">{{ faq.q }}</div>
          <div class="collapse-content">
            <p class="text-base-content/80 pb-2 text-base leading-relaxed">
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
      <h2 class="text-base-content/90 mb-2 text-base font-semibold">免責聲明</h2>
      <p class="text-base-content/70 text-sm leading-relaxed">
        本網站為非官方獨立平台，與統一超商股份有限公司或賣貨便官方服務無任何關聯。商品資訊由賣家自行匯入，本站不保證資料的即時性與完整性。所有交易行為皆在賣貨便官方平台進行，本站不承擔任何交易相關責任。
      </p>
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
