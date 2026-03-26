<script setup lang="ts">
// 1. 外部引用（無）

// 2. 類型定義（無）

// 3. 常量宣告
const config = useRuntimeConfig();
const DESC =
  "賣貨商城是一個為 7-11 賣貨便量身打造的商品展示平台——讓買家更好找、讓賣家更好賣。這裡會告訴你這個站是怎麼來的、能幫你做什麼，以及一些常見問題。";

const STORY = {
  icon: "heroicons:light-bulb",
  title: "為什麼會有這個網站？",
  content: [
    "如果你用過賣貨便，大概會發現一件事：它沒有搜尋功能，也沒有獨立的商品頁面。想找某個商品？只能靠賣家自己分享連結，或是在社群裡慢慢翻。對買家來說不太方便，對賣家來說也少了一個被找到的機會。",
    "賣貨商城就是為了解決這個問題而誕生的。這是一個由獨立開發者（也就是我）利用課餘時間打造的小專案，目標很簡單：幫每件商品建立獨立頁面，讓買家可以搜尋、瀏覽、比較，然後再跳轉到賣貨便完成購買。",
    "本站與統一超商或賣貨便官方完全無關，不經手任何金流——純粹就是一個展示層，幫你把散落各處的商品資訊整理在一起。",
    "對了，本站完全用愛發電——不收上架費、不收手續費、不抽成，現在沒有，未來也沒有打算。能幫到大家就是最大的動力了。",
    "也因為本站沒有任何收入來源，目前的伺服器都是挑最低價的方案在跑。如果偶爾遇到網站變慢、暫時無法連線之類的狀況，還請多多包涵——我會盡快修復，但沒辦法像大公司一樣保證全年無休。",
  ],
};

const FEATURES = [
  {
    icon: "heroicons:magnifying-glass",
    title: "強力搜尋",
    desc: "支援中文模糊搜尋，不管是商品名稱還是商城名稱，打幾個關鍵字就能快速找到目標。再也不用靠連結大海撈針了。",
  },
  {
    icon: "heroicons:building-storefront",
    title: "獨立商城頁面",
    desc: "每個賣場都有自己的專屬頁面，買家可以一次瀏覽同一賣家的所有商品，就像逛一間小店一樣。",
  },
  {
    icon: "heroicons:document-text",
    title: "完整商品資訊",
    desc: "每件商品都有獨立頁面，包含詳細描述、所有規格與價格、多張商品圖片，資訊一目了然。",
  },
  {
    icon: "heroicons:arrow-up-tray",
    title: "一鍵匯入",
    desc: "賣家只需貼上賣貨便賣場網址，就能把整個賣場的商品資料匯入本站。不需要登入、不需要手動輸入，幾秒鐘搞定。",
  },
  {
    icon: "heroicons:star",
    title: "評論與評分",
    desc: "買家可以用 Google 帳號登入，對商品留下星級評分和文字評論，幫助其他人做出更好的購買決策。",
  },
  {
    icon: "heroicons:fire",
    title: "熱門排序",
    desc: "系統會追蹤每件商品的購買點擊次數，讓最受歡迎的商品自然浮到搜尋結果的最上面。",
  },
  {
    icon: "heroicons:funnel",
    title: "篩選與排序",
    desc: "可以依熱門程度、價格高低或上架時間排序，快速找到符合你需求的選項。",
  },
  {
    icon: "heroicons:device-phone-mobile",
    title: "手機友好",
    desc: "全站採用響應式設計，不管你用手機、平板還是電腦，都能順暢瀏覽。畢竟現在大部分人都是滑手機在看的，對吧？",
  },
];

const HOW_IT_WORKS_BUYER = {
  icon: "heroicons:shopping-bag",
  title: "買家怎麼用？",
  steps: [
    {
      step: 1,
      title: "搜尋商品",
      desc: "在首頁或搜尋頁輸入關鍵字，瀏覽搜尋結果。可以用排序和價格篩選來縮小範圍。",
    },
    {
      step: 2,
      title: "查看詳情",
      desc: "點進商品頁面，查看完整的描述、規格、價格和其他買家的評論。",
    },
    {
      step: 3,
      title: "前往購買",
      desc: "直接點擊「前往賣貨便購買」按鈕，就會開啟新視窗跳轉到賣貨便官方頁面，在那邊完成下單、付款和取貨。",
    },
  ],
};

const HOW_IT_WORKS_SELLER = {
  icon: "heroicons:arrow-up-tray",
  title: "賣家怎麼用？",
  steps: [
    {
      step: 1,
      title: "複製網址",
      desc: "到賣貨便找到你的賣場頁面，複製網址列上的連結。",
    },
    {
      step: 2,
      title: "貼上並讀取",
      desc: "前往本站的「匯入賣場」頁面，把網址貼上，點擊「讀取賣場資料」。系統會自動抓取你的賣場和商品資訊。",
    },
    {
      step: 3,
      title: "預覽確認",
      desc: "檢查一下抓取到的資料是否正確——賣場名稱、商品列表、價格等等。",
    },
    {
      step: 4,
      title: "確認匯入",
      desc: "沒問題的話按下「確認匯入」，商品就會上架到本站。整個過程不需要登入，任何人都可以操作。",
    },
  ],
};

const FAQS = [
  {
    q: "賣貨商城是什麼？",
    a: "賣貨商城是一個專為 7-11 賣貨便打造的非官方商品搜尋與展示平台。賣貨便本身沒有搜尋功能，也沒有獨立的商品頁面，買家很難找到想要的東西。賣貨商城解決了這個問題——它讓賣家可以一鍵匯入賣場資料，為每件商品建立獨立頁面，並提供搜尋、篩選、排序和評論功能，讓買家能更輕鬆地瀏覽和比較賣貨便上的商品。本站不經手任何金流，所有購買行為都會導向賣貨便官方頁面完成。完全免費、不收取任何費用。",
  },
  {
    q: "賣貨商城跟 7-11 賣貨便是什麼關係？",
    a: "完全沒有關係。賣貨商城是我個人獨立開發的非官方平台，與統一超商、賣貨便官方沒有任何隸屬或合作關係。本站不賣任何東西、不碰任何錢，純粹幫你更方便地找到賣貨便上的商品。",
  },
  {
    q: "使用賣貨商城需要付費嗎？",
    a: "不用。本站不收上架費、不收手續費、不抽成，現在沒有，未來也沒有打算。完全免費、不收取任何費用。",
  },
  {
    q: "在這裡買東西安全嗎？",
    a: "本站不處理任何交易，只負責商品資訊的展示與導流。所有匯入的資料均來自賣貨便官方頁面，不允許任何人自行修改內容，從源頭降低資訊被竄改的風險。正常情況下，當你點擊「前往賣貨便購買」後，會被導向賣貨便的官方頁面，後續的購買、付款、取貨、退換貨全部都在賣貨便平台上進行，跟你直接去賣貨便買是一樣的。不過還是要提醒：本站無法審核每一位賣家的信譽，購買前請自行留意賣場詳情、賣家評價與商品描述是否合理，如有疑慮建議多方確認再下單。",
  },
  {
    q: "如何把我的賣貨便賣場匯入本站？",
    a: "前往「匯入賣場」頁面，貼上你的賣貨便賣場網址，通過簡單的驗證後點擊「讀取賣場資料」。確認預覽內容無誤後，按下「確認匯入」就完成了。不需要登入、不需要註冊，幾秒鐘就能搞定。",
  },
  {
    q: "匯入有什麼限制嗎？",
    a: "為了防止濫用導致伺服器無法負荷，讀取資料每小時最多 10 次、確認匯入每小時最多 5 次。正常使用完全夠用，除非你一次要匯入非常大量的賣場。",
  },
  {
    q: "匯入的商品有什麼限制？",
    a: "請勿透過本站展示任何違法商品，包含仿冒品、禁藥、管制物品等等。一旦發現違規內容，我會直接刪除整個賣場的資料，並將該賣場永久加入黑名單、無法再次匯入，而且不會事先通知。這是為了保護所有使用者，也是維持平台乾淨的底線，還請大家配合。",
  },
  {
    q: "別人可以匯入我的賣場嗎？",
    a: "技術上來說，是的。目前匯入功能不需要登入，也無法驗證操作者是否為賣場本人。這是因為我目前沒有技術能力驗證QQ，同時為了降低使用門檻而做的取捨——好處是任何人都能幫忙匯入，除了增加曝光的機會外也沒有其他壞處。但如果你不希望自己的賣場出現在這裡，請聯繫我，我會盡快協助下架。",
  },
  {
    q: "商品資料多久更新一次？",
    a: "本站不會自動同步賣貨便的資料。商品資訊只有在賣家主動重新匯入時才會更新。如果你是賣家，建議在更新商品後重新匯入一次，確保這邊的資料是最新的。每個商品頁面上都會標示「資料最後更新時間」，方便買家參考。",
  },
  {
    q: "商品顯示的價格和賣貨便不一樣？",
    a: "有可能。因為商品資料是匯入時的快照，如果賣家之後在賣貨便上調整了價格但沒有重新匯入，這邊顯示的就會是舊的價格。實際售價請以賣貨便官方頁面為準。",
  },
  {
    q: "我可以評論商品嗎？",
    a: "可以！只要用 Google 帳號登入就能對商品留下評分（1~5 顆星）和文字評論。每個人對同一件商品只能評論一次，但可以事後修改。沒有登入的話也可以瀏覽別人的評論。",
  },
  {
    q: "商品已經下架了，但這裡還看得到？",
    a: "如果賣家在賣貨便上下架了某些商品，只要重新匯入一次賣場資料，系統就會自動偵測到哪些商品消失了，並將它們下架、從搜尋結果中移除。",
  },
  {
    q: "我想刪除我匯入的賣場，該怎麼辦？",
    a: "如果你需要下架整個賣場的資料，請直接聯繫我，我會盡快協助處理。",
  },
  {
    q: "發現 Bug 或有功能建議？",
    a: "非常歡迎！這個專案還在持續開發中，任何回饋對我來說都很有價值。請透過 [聯絡我] 跟我說，我會盡快回覆。",
  },
  {
    q: "網站為什麼有時會卡住或連不上了？",
    a: "本站是用愛發電的專案，伺服器都是用最經濟的方案在撐。偶爾可能會因為維護、流量突增或是方案的限制而短暫中斷。如果你發現網站掛了，通常等一下就會恢復，或是透過 [聯絡我] 跟我說一聲，我會盡快處理。",
  },
];

// 4. 響應式狀態/變數（無）

// 5. 計算屬性（無）

// 6. 核心邏輯與函數（無）

// 7. 偵聽器（無）

// 8. 生命週期鉤子
useHead({
  title: "關於我們",
  link: [{ rel: "canonical", href: `${config.public.siteUrl}/about` }],
  meta: [
    { name: "description", content: DESC },
    { property: "og:title", content: "關於 賣貨商城" },
    { property: "og:description", content: DESC },
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
        關於 賣貨商城
      </h1>
      <p class="text-base-content/90 mt-4 text-sm leading-relaxed sm:text-base">
        {{ DESC }}
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
        賣貨商城是非官方獨立平台，與統一超商或賣貨便官方完全無關。商品資訊由使用者自行匯入，本站不保證資料的即時性與完整性。所有購買行為皆在賣貨便官方平台進行，本站不承擔任何交易相關責任。
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
