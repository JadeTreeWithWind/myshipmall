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
const { minLoadingTime } = useMinLoadingTime();
const URL_PATTERN = /^https:\/\/myship\.7-11\.com\.tw\/general\/detail/;
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
const importResult = ref<{ shop_name: string; product_count: number } | null>(
  null,
);
const turnstileWidgetId = ref<string | null>(null);
const turnstileContainer = ref<HTMLElement | null>(null);

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
      "格式不正確，請輸入 https://myship.7-11.com.tw/general/detail... 格式的網址";
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
    { name: "twitter:image", content: `${config.public.siteUrl}/og-import.png` },
    { property: "og:type", content: "website" },
  ],
});
</script>

<template>
  <div class="bg-base-200/50 min-h-screen px-4 py-12">
    <!-- Turnstile invisible container -->
    <div ref="turnstileContainer" class="hidden" />

    <div class="mx-auto max-w-xl">
      <!-- 頁面標題 -->
      <div class="mb-8 text-center">
        <div
          class="bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
        >
          <Icon name="heroicons:arrow-up-tray" class="text-primary h-5 w-5" />
        </div>
        <h1 class="text-base-content mb-2 font-serif text-2xl font-semibold">
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
        class="bg-base-100 border-base-300/70 rounded-2xl border p-6"
      >
        <div class="flex flex-col gap-4">
          <div>
            <label class="text-base-content mb-1.5 block text-sm font-medium"
              >賣場網址</label
            >
            <input
              v-model="url"
              type="url"
              placeholder="https://myship.7-11.com.tw/general/detail..."
              class="input input-bordered bg-base-100 focus:border-primary/60 w-full"
              :class="{ 'input-error': urlError }"
              @keyup.enter="handleScrape"
            />
            <p v-if="urlError" class="text-error mt-1.5 text-xs">
              {{ urlError }}
            </p>
          </div>

          <button
            class="btn btn-primary w-full cursor-pointer rounded-xl"
            :disabled="loading"
            @click="handleScrape"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm" />
            {{ loading ? "讀取中…" : "讀取賣場資料" }}
          </button>
        </div>
      </div>

      <!-- ══════════════ PHASE: preview ══════════════ -->
      <div v-if="phase === PAGE_PHASE.PREVIEW && previewData" class="space-y-4">
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
        class="bg-base-100 border-base-300/70 rounded-2xl border p-8"
      >
        <div class="flex flex-col items-center gap-4 text-center">
          <div
            class="bg-success/10 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
          >
            <Icon name="heroicons:check-circle" class="text-success h-7 w-7" />
          </div>
          <div>
            <h2 class="font-serif text-xl font-semibold">匯入成功！</h2>
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
              to="/"
              class="btn btn-primary btn-sm cursor-pointer rounded-xl"
              >前往首頁</NuxtLink
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
