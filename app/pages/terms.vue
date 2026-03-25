<script setup lang="ts">
// 1. Imports (None)

// 2. Types (None)

// 3. Constants
const config = useRuntimeConfig();
const DESC =
  "嗨！在使用賣貨商城之前，請花幾分鐘讀一下這份使用條款。內容不長，但很重要——它會幫助你了解這個平台是什麼、不是什麼，以及我們之間的一些基本約定。";

const SECTIONS = [
  {
    icon: "heroicons:information-circle",
    title: "關於本平台",
    content: [
      "賣貨商城（以下簡稱「本站」）是一個由獨立開發者出於個人興趣打造的非官方商品展示平台。這裡必須說清楚：本站與統一超商股份有限公司、賣貨便官方服務，或任何相關機構之間，不存在任何隸屬、合作、授權或代理關係。",
      "本站為免費服務，不向任何賣家收取上架費、手續費、佣金或其他任何費用。",
      "本站的核心功能很單純——幫助買家更方便地搜尋、瀏覽賣貨便上的商品。所有商品資訊都是由使用者自行匯入的，本站不販售任何商品，也不經手任何金流。",
      "「賣貨商城」這個名稱僅為方便使用者辨識本站用途，並不代表與統一超商或賣貨便官方有任何關聯。",
    ],
  },
  {
    icon: "heroicons:shield-exclamation",
    title: "免責聲明",
    content: [
      "本站顯示的所有商品資訊（包含但不限於名稱、描述、價格、圖片、規格）都是使用者透過公開途徑匯入的。由於商品資訊可能隨時變動，本站無法保證這些資料的即時性、準確性或完整性。每件商品頁面上都會標示「資料最後更新時間」，實際狀況請以賣貨便官方頁面為準。",
      "當你點擊「前往購買」按鈕時，會被導向賣貨便官方平台完成交易。本站全程不介入任何金流、物流、退換貨或售後服務。因購買行為產生的任何糾紛、損失或不便，均與本站無關，請直接與賣家或賣貨便官方聯繫處理。",
      "身為一人獨立開發的小專案，無收取任何費用，本站無法保證 24/7 全年無休。使用的技術、系統也只負擔得起最經濟的伺服器，因此系統可能因維護、升級、技術問題或不可抗力因素而暫時中斷服務，對此造成的不便，還請見諒。",
    ],
  },
  {
    icon: "heroicons:user-group",
    title: "使用者行為規範",
    content: [
      "本站的匯入功能為開放設計，無法驗證操作者是否為賣場擁有者。這意味著任何人都可能將您的賣貨便賣場資料匯入本站。若您為賣場擁有者且不希望資料出現於本站，請透過本站聯絡方式與我們聯繫，我們將盡快處理下架。",
      "我希望這裡能維持一個友善、有用的社群環境，所以請遵守以下基本規範：不要利用本站從事任何違法行為；不要散佈虛假或誤導性的資訊；不要發表人身攻擊、歧視、騷擾或其他不當的評論內容。",
      "評論功能需要透過 Google 帳號登入才能使用，你對自己發表的所有評論內容負完全責任。如果發現有違規內容，本站保留不事先通知即移除的權利。情節嚴重者，本站有權限制該帳號的使用。",
      "請不要使用自動化程式、爬蟲或任何技術手段大量存取本站資料或試圖干擾正常服務運作。本站設有基本的防濫用機制，異常行為可能導致你的 IP 被暫時限制存取。",
    ],
  },
  {
    icon: "heroicons:lock-closed",
    title: "隱私與資料",
    content: [
      "本站透過 Google 登入進行身份驗證，過程中僅會取得你的基本公開資訊（顯示名稱、電子郵件、大頭照），用途僅限於識別身份與顯示在評論區。我們不會將你的個人資料出售、出租或提供給任何第三方。",
      "本站使用 Cookie 及類似技術來維持你的登入狀態與主題偏好設定。繼續使用本站，即表示你同意這些 Cookie 的使用。",
      "請注意，你在本站發表的商品評論（包含你的顯示名稱與大頭照）屬於公開資訊，任何訪客都可以看到。發表前請確認你願意公開這些內容，並且無任何違法行為。",
      "本站不會主動蒐集你的 IP 位址作為個人識別用途，但為了防止濫用（例如惡意刷點擊或灌評論），部分 API 會暫時記錄 IP 用於頻率限制，這些記錄不會與你的個人身份連結，且會定期自動清除。",
    ],
  },
  {
    icon: "heroicons:scale",
    title: "智慧財產權",
    content: [
      "本站展示的商品圖片、文案等內容，其著作權歸原始賣家或賣貨便平台所有。本站僅作為資訊展示用途，無意侵害任何人的智慧財產權。如果你認為本站上的任何內容侵害了你的權利，請透過本站聯絡方式與我聯繫，我會盡快處理下架。",
      "本站自行開發的程式碼、介面設計及整體架構等著作權歸開發者所有，未經書面授權不得複製、修改或用於商業用途。",
    ],
  },
  {
    icon: "heroicons:arrow-path",
    title: "條款變更",
    content: [
      "本站保留隨時修改這份使用條款的權利。條款更新後會在本頁面公布最新版本與修訂日期。如果有重大變更（例如資料使用方式的調整），我會盡合理努力透過站內公告或其他適當方式通知大家。",
      "更新後繼續使用本站，即視為你同意最新版本的條款內容。",
    ],
  },
  {
    icon: "heroicons:envelope",
    title: "聯絡我們",
    content: [
      "如果你對本站有任何問題、建議，或是需要回報著作權相關問題，歡迎直接聯絡我。",
      "這是一個一人開發的小專案，我會盡量在合理時間內回覆，但無法保證即時回應，還請多多包涵。",
    ],
  },
];
// 4. State/Variables (None)

// 5. Computed Properties (None)

// 6. Functions/Methods (None)

// 7. Watchers (None)

// 8. Lifecycle Hooks
useHead({
  title: "條款與免責聲明",
  link: [{ rel: "canonical", href: `${config.public.siteUrl}/terms` }],
  meta: [
    { name: "description", content: DESC },
    { property: "og:title", content: "條款與免責聲明 | 賣貨商城" },
    { property: "og:description", content: DESC },
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
        {{ DESC }}
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
      最後更新：2026 年 3 月 25 日
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
