<script setup lang="ts">
// 1. Imports
import type { ShopData } from "../../server/utils/types";

// 2. Types
declare global {
  interface Window {
    turnstile: {
      render: (
        container: string | HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      execute: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

// 3. Constants
const config = useRuntimeConfig();
const faqItems = [
  {
    q: "哪些網址可以匯入？",
    a: "目前只支援賣貨便的賣場網址(https://myship.7-11.com.tw/general/detail...)，其他格式的網址系統會擋下來，避免詐騙或惡意網址。",
  },
  {
    q: "匯入有什麼限制嗎？",
    a: "為了防止濫用導致伺服器無法負荷，讀取資料每小時最多 10 次、確認匯入每小時最多 5 次。正常使用完全夠用，除非你一次要匯入非常大量的賣場。",
  },
  {
    q: "匯入後商品資料會自動保持最新嗎？",
    a: "不會。匯入的是當下那一刻的快照，之後賣貨便上的價格、庫存或商品異動都不會自動同步過來。如果你更新了商品，重新匯入一次就好，系統會自動覆蓋舊資料。",
  },
  {
    q: "可以匯入多個不同的賣場嗎？",
    a: "可以，使用次數內沒有限制。每次輸入不同的賣場網址就會建立或更新對應的商城頁面。想幫朋友的賣場匯入也完全沒問題。",
  },
  {
    q: "匯入需要多久？",
    a: "通常幾秒鐘就搞定。商品數量特別多的賣場可能會稍微久一點，但一般不會超過 20 秒。如果等了很久都沒反應，可以重新整理頁面再試一次。",
  },
  {
    q: "需要登入才能匯入嗎？",
    a: "不需要。匯入功能完全開放，任何人都可以使用。不過為了防止濫用，讀取資料每小時最多 10 次、確認匯入每小時最多 5 次，正常使用絕對夠用。",
  },
  {
    q: "重複匯入同一個賣場會怎樣？",
    a: "不會產生重複資料。系統會自動辨識是同一個賣場，然後更新商品資訊。如果有商品在賣貨便上已經下架了，重新匯入後系統也會自動把它標記為下架。",
  },
  {
    q: "可以編輯匯入後的商品資料嗎？",
    a: "不行，這是刻意的設計。為了保護買家，本站的所有商品資訊都必須 100% 來自賣貨便原始頁面，不允許任何人在匯入後自行修改。這樣可以避免有人竄改價格、放置惡意連結或發布不實資訊。如果你需要更新商品內容，請先到賣貨便上修改，然後回來重新匯入一次就好。",
  },
  {
    q: "為什麼讀取失敗了？",
    a: "常見原因有幾個：網址格式不對、賣場已經被賣家關閉或下架、賣貨便那邊伺服器暫時不穩定，或是你的匯入次數已經到達這小時的上限。確認網址沒問題的話，過一陣子再試試看。",
  },
  {
    q: "按了確認匯入卻顯示「預覽已過期」？",
    a: "這表示你在讀取資料後超過 10 分鐘才按確認。為了確保資料的新鮮度，預覽資料只會保留 10 分鐘。重新點一次「讀取賣場資料」就好，不會計入額外的匯入次數。",
  },
  {
    q: "我不是賣場本人，也可以匯入嗎？",
    a: "技術上可以，本站目前無法驗證匯入者是否為賣場擁有者。如果你是想幫朋友匯入，沒問題；但如果賣場本人不希望自己的賣場出現在這裡，請與我聯繫，我會協助下架。",
  },
  {
    q: "匯入後要去哪裡看我的商城？",
    a: "匯入成功後頁面會顯示結果，點擊「前往商城」就能看到你的賣場專屬頁面。你也可以透過首頁搜尋賣場名稱找到它。",
  },
];
const { minLoadingTime } = useMinLoadingTime();
const URL_PATTERN =
  /^https:\/\/myship\.7-11\.com\.tw\/general\/detail(?:\/|\?id=)GM\d{10,16}$/;
const PAGE_PHASE = {
  INPUT: "input",
  PREVIEW: "preview",
  SUCCESS: "success",
};

// 4. Variables
const url = ref("");
const urlError = ref("");
const phase = ref(PAGE_PHASE.INPUT);
const loading = ref(false);
const errorMsg = ref("");
const previewData = ref<ShopData | null>(null);
const importResult = ref<{
  shop_id: string;
  shop_name: string;
  product_count: number;
} | null>(null);
const turnstileWidgetId = ref<string | null>(null);
const turnstileContainer = ref<HTMLElement | null>(null);
const agreedToTerms = ref(false);

// 5. Computed (None)

// 6. Methods
function getTurnstileToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.turnstile) {
      reject(new Error("Turnstile 尚未載入"));
      return;
    }

    if (turnstileWidgetId.value) {
      window.turnstile.remove(turnstileWidgetId.value);
    }

    const id = window.turnstile.render(turnstileContainer.value!, {
      sitekey: config.public.turnstileSiteKey,
      size: "invisible",
      callback: (token: string) => resolve(token),
      "error-callback": () => reject(new Error("Turnstile 驗證失敗，請重試")),
      "expired-callback": () =>
        reject(new Error("Turnstile token 已過期，請重試")),
    });
    turnstileWidgetId.value = id;
    window.turnstile.execute(id);
  });
}

function validateUrl(): boolean {
  if (!url.value) {
    urlError.value = "請輸入賣場網址";
    return false;
  }
  if (!URL_PATTERN.test(url.value)) {
    urlError.value =
      "格式不正確，請輸入 https://myship.7-11.com.tw/general/detail/GM1234567890123 格式的網址";
    return false;
  }
  urlError.value = "";
  return true;
}

async function handleScrape() {
  if (!validateUrl()) return;
  loading.value = true;
  errorMsg.value = "";

  try {
    const token = await getTurnstileToken();

    const data = await minLoadingTime(
      $fetch<ShopData>("/api/scrape", {
        method: "POST",
        body: { url: url.value, turnstile_token: token },
      }),
    );

    previewData.value = data;
    phase.value = PAGE_PHASE.PREVIEW;
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string };
    errorMsg.value = e.data?.message || e.message || "讀取失敗，請稍後再試";
  } finally {
    loading.value = false;
  }
}

async function handleConfirmImport() {
  loading.value = true;
  errorMsg.value = "";

  try {
    const token = await getTurnstileToken();

    const result = await minLoadingTime(
      $fetch<{
        success: boolean;
        shop_id: string;
        shop_name: string;
        product_count: number;
      }>("/api/confirm-import", {
        method: "POST",
        body: { url: url.value, turnstile_token: token },
      }),
    );

    importResult.value = result;
    phase.value = PAGE_PHASE.SUCCESS;
  } catch (err: unknown) {
    const e = err as {
      data?: { message?: string; statusCode?: number };
      message?: string;
    };
    const status = e.data?.statusCode;
    if (status === 410) {
      errorMsg.value = "預覽已過期（超過 10 分鐘），請重新讀取賣場資料";
      phase.value = PAGE_PHASE.INPUT;
      previewData.value = null;
    } else {
      errorMsg.value = e.data?.message || e.message || "匯入失敗，請稍後再試";
    }
  } finally {
    loading.value = false;
  }
}

function resetToInput() {
  phase.value = PAGE_PHASE.INPUT;
  previewData.value = null;
  importResult.value = null;
  errorMsg.value = "";
}

// 7. Watchers (None)

// 8. Lifecycle Hooks
useHead({
  title: "匯入賣場 — 賣貨商城",
  meta: [
    {
      name: "description",
      content:
        "輸入您的賣貨便賣場網址，將賣場商品一鍵匯入 賣貨商城，建立您的專屬商城頁面。",
    },
    { property: "og:title", content: "匯入賣場 — 賣貨商城" },
    {
      property: "og:description",
      content:
        "輸入您的賣貨便賣場網址，將賣場商品一鍵匯入 賣貨商城，建立您的專屬商城頁面。",
    },
    { property: "og:image", content: `${config.public.siteUrl}/og-import.png` },
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:image",
      content: `${config.public.siteUrl}/og-import.png`,
    },
    { property: "og:type", content: "website" },
  ],
});
</script>

<template>
  <div class="bg-base-200/50 min-h-screen px-4 py-12">
    <!-- Turnstile invisible container -->
    <div ref="turnstileContainer" class="hidden" />

    <div class="mx-auto max-w-4xl">
      <!-- 頁面標題 -->
      <div class="mb-8 text-center">
        <div
          class="bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
        >
          <Icon name="heroicons:arrow-up-tray" class="text-primary h-5 w-5" />
        </div>
        <h1 class="text-base-content mb-2 text-2xl font-semibold">
          匯入賣貨便賣場
        </h1>
        <p class="text-base-content/90 text-sm">
          輸入您的賣貨便賣場網址，系統將自動讀取並建立商城頁面
        </p>
      </div>

      <!-- ── 錯誤提示 ── -->
      <div
        v-if="errorMsg"
        role="alert"
        class="bg-error/10 border-error/30 text-error mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm"
      >
        <Icon
          name="heroicons:exclamation-circle"
          class="mt-0.5 h-5 w-5 shrink-0"
        />
        <span>{{ errorMsg }}</span>
      </div>

      <!-- ══════════════ PHASE: input ══════════════ -->
      <div
        v-if="phase === PAGE_PHASE.INPUT"
        class="bg-base-100 border-base-300/70 mx-auto max-w-2xl rounded-2xl border p-6"
      >
        <div class="flex flex-col gap-4">
          <div>
            <label class="text-base-content mb-1.5 block text-sm font-medium"
              >賣場網址</label
            >
            <input
              v-model="url"
              type="url"
              placeholder="https://myship.7-11.com.tw/general/detail/GM..."
              class="input input-bordered bg-base-100 focus:border-primary/60 w-full"
              :class="{ 'input-error': urlError }"
              @keyup.enter="handleScrape"
            />
            <p v-if="urlError" class="text-error mt-1.5 text-xs">
              {{ urlError }}
            </p>
          </div>

          <label class="ml-1 flex cursor-pointer items-start gap-2 text-sm">
            <input
              v-model="agreedToTerms"
              type="checkbox"
              class="checkbox checkbox-primary checkbox-sm mt-0.5 shrink-0"
            />
            <span class="text-base-content/80">
              我已閱讀並同意
              <NuxtLink
                to="/terms"
                class="text-primary underline-offset-2 hover:underline"
                >服務條款</NuxtLink
              >
            </span>
          </label>

          <button
            class="btn btn-primary w-full cursor-pointer rounded-xl"
            :disabled="loading || !agreedToTerms"
            @click="handleScrape"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm" />
            {{ loading ? "讀取中…" : "讀取賣場資料" }}
          </button>
        </div>
      </div>

      <!-- ══════════════ PHASE: preview ══════════════ -->
      <div
        v-if="phase === PAGE_PHASE.PREVIEW && previewData"
        class="mx-auto max-w-2xl space-y-4 rounded-2xl border p-6"
      >
        <!-- 賣場資訊卡 -->
        <div class="bg-base-100 border-base-300/70 rounded-2xl border p-5">
          <div class="flex items-center gap-4">
            <div
              class="bg-base-200 border-base-300/50 h-14 w-14 shrink-0 overflow-hidden rounded-xl border"
            >
              <img
                v-if="previewData.image_url"
                :src="previewData.image_url"
                :alt="previewData.name"
                class="h-full w-full object-cover"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center"
              >
                <Icon
                  name="heroicons:building-storefront"
                  class="text-base-content/25 h-6 w-6"
                />
              </div>
            </div>
            <div>
              <h2 class="text-base font-semibold">{{ previewData.name }}</h2>
              <p class="text-base-content/90 mt-0.5 text-sm">
                共 {{ previewData.products.length }} 件商品
              </p>
            </div>
          </div>
        </div>

        <!-- 商品列表預覽 -->
        <div class="bg-base-100 border-base-300/70 rounded-2xl border p-5">
          <h3 class="mb-4 text-sm font-semibold">商品預覽</h3>
          <div class="max-h-80 space-y-2 overflow-y-auto">
            <div
              v-for="product in previewData.products"
              :key="product.external_id"
              class="border-base-200 hover:bg-base-200/40 flex items-center gap-3 rounded-xl border p-3 transition-colors"
            >
              <div
                class="bg-base-200 h-11 w-11 shrink-0 overflow-hidden rounded-lg"
              >
                <img
                  v-if="product.main_image"
                  :src="product.main_image"
                  :alt="product.name"
                  loading="lazy"
                  class="h-full w-full object-cover"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center"
                >
                  <Icon
                    name="heroicons:photo"
                    class="text-base-content/25 h-4 w-4"
                  />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ product.name }}</p>
                <div class="text-base-content/80 mt-0.5 flex gap-2 text-sm">
                  <span>{{ product.specs.length }} 種規格</span>
                  <span v-if="product.specs.length > 0">
                    · NT$&nbsp;{{
                      Math.min(
                        ...product.specs.map((s: any) => s.price),
                      ).toLocaleString()
                    }}<template v-if="product.specs.length > 1"
                      >–{{
                        Math.max(
                          ...product.specs.map((s: any) => s.price),
                        ).toLocaleString()
                      }}</template
                    >
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="flex gap-3">
          <button
            class="btn btn-ghost flex-1 cursor-pointer rounded-xl"
            :disabled="loading"
            @click="resetToInput"
          >
            重新輸入
          </button>
          <button
            class="btn btn-primary flex-1 cursor-pointer rounded-xl"
            :disabled="loading"
            @click="handleConfirmImport"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm" />
            {{ loading ? "匯入中…" : "確認匯入" }}
          </button>
        </div>

        <p class="text-base-content/80 text-center text-sm">
          預覽資料將在 10 分鐘後過期，請盡快確認匯入
        </p>
      </div>

      <!-- ══════════════ PHASE: success ══════════════ -->
      <div
        v-if="phase === PAGE_PHASE.SUCCESS && importResult"
        class="bg-base-100 border-base-300/70 mx-auto max-w-2xl rounded-2xl border p-8"
      >
        <div class="flex flex-col items-center gap-4 text-center">
          <div
            class="bg-success/10 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
          >
            <Icon name="heroicons:check-circle" class="text-success h-7 w-7" />
          </div>
          <div>
            <h2 class="text-xl font-semibold">匯入成功！</h2>
            <p class="text-base-content/90 mt-2 text-base leading-relaxed">
              <strong>{{ importResult.shop_name }}</strong> 已建立，<br />
              共匯入 <strong>{{ importResult.product_count }}</strong> 件商品
            </p>
          </div>
          <div class="mt-2 flex gap-3">
            <button
              class="btn btn-ghost btn-sm cursor-pointer rounded-xl"
              @click="resetToInput"
            >
              繼續匯入
            </button>
            <NuxtLink
              :to="`/shop/${importResult.shop_id}`"
              class="btn btn-primary btn-sm cursor-pointer rounded-xl"
              >前往商城</NuxtLink
            >
          </div>
        </div>
      </div>

      <!-- ══════════════ FAQ ══════════════ -->
      <section class="mt-8">
        <div class="mb-5 flex items-center gap-3">
          <div class="bg-primary h-5 w-1 rounded-full" />
          <h2 class="text-xl font-semibold">常見問題</h2>
        </div>
        <div class="flex flex-col gap-2">
          <div
            v-for="(item, i) in faqItems"
            :key="i"
            class="collapse-arrow bg-base-100 border-base-300/70 collapse rounded-xl border"
          >
            <input type="checkbox" />
            <div class="collapse-title py-4 text-sm font-medium sm:text-base">
              {{ item.q }}
            </div>
            <div class="collapse-content">
              <p
                class="text-base-content/80 pb-2 text-sm leading-relaxed sm:text-base"
              >
                {{ item.a }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
