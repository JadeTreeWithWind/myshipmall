<script setup lang="ts">
// 1. 外部引用
import type { ProductSearchResult } from "~/composables/useProductSearch";

// 2. 類型定義（無）

// 3. 常量宣告
const config = useRuntimeConfig();
const HOME_DESC =
  "搜尋並瀏覽所有已匯入的 7-11 賣貨便商品，提供更好的商品瀏覽與搜尋體驗。";

// 4. 響應式狀態/變數
const router = useRouter();
const searchQ = ref("");
const {
  data: randomProducts,
  pending: randomPending,
  refresh: _refreshRandom,
} = useFetch<ProductSearchResult[]>("/api/products/random", {
  query: { count: 10 },
});

const isCoolingDown = ref(false);

const { data: hotProducts, pending } = useFetch<ProductSearchResult[]>(
  "/api/products/search",
  {
    query: { sort: "popular", offset: 0, limit: 20 },
  },
);

const { data: newProducts, pending: newPending } = useFetch<
  ProductSearchResult[]
>("/api/products/search", {
  query: { sort: "newest", offset: 0, limit: 20 },
});

const { data: stats } = useFetch<{ products: number; shops: number }>(
  "/api/stats",
);

const displayProducts = ref(0);
const displayShops = ref(0);

function countUp(target: number, setter: (v: number) => void, duration = 3000) {
  const from = Math.max(0, target - 30);
  const start = performance.now();
  function step(now: number) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    setter(Math.round(from + ease * (target - from)));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

watch(
  stats,
  (val) => {
    if (!val) return;
    countUp(val.products, (v) => (displayProducts.value = v));
    countUp(val.shops, (v) => (displayShops.value = v));
  },
  { immediate: true },
);

// 5. 計算屬性（無）

// 6. 核心邏輯與函數
function refreshRandom() {
  if (isCoolingDown.value) return;
  isCoolingDown.value = true;
  _refreshRandom();
  setTimeout(() => (isCoolingDown.value = false), 5000);
}
function goSearch() {
  if (!searchQ.value.trim()) return;
  router.push({ path: "/search", query: { q: searchQ.value.trim() } });
}

// 7. 偵聽器（無）

// 8. 生命週期鉤子
useHead({
  title: "賣貨商城 — 賣貨便商品瀏覽平台",
  meta: [
    { name: "description", content: HOME_DESC },
    { property: "og:title", content: "賣貨商城 — 賣貨便商品瀏覽平台" },
    { property: "og:description", content: HOME_DESC },
    { property: "og:type", content: "website" },
    { property: "og:url", content: config.public.siteUrl },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "賣貨商城 — 賣貨便商品瀏覽平台" },
    { name: "twitter:description", content: HOME_DESC },
  ],
});
</script>

<template>
  <div>
    <!-- ── Hero 區 ── -->
    <section class="relative overflow-hidden px-4 py-2 lg:py-10">
      <div class="relative mx-auto max-w-7xl rounded-2xl p-2 sm:p-10">
        <div
          class="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[1fr_300px]"
        >
          <!-- 左：焦點區塊 -->
          <div
            class="flex flex-col items-center justify-center py-4 lg:items-start"
          >
            <!-- 小標籤 -->
            <div
              class="text-primary border-primary/20 bg-primary/5 mb-5 inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium tracking-widest uppercase sm:text-base"
            >
              <Icon name="heroicons:shopping-bag" class="h-3.5 w-3.5" />
              賣貨便商品瀏覽平台
            </div>

            <h1
              class="text-base-content mb-4 text-center text-4xl leading-tight font-semibold sm:text-start sm:text-5xl lg:text-6xl"
            >
              探索賣貨便商品
            </h1>
            <p
              class="text-base-content/65 mb-8 max-w-lg text-center text-sm leading-relaxed sm:text-start sm:text-base"
            >
              搜尋並瀏覽所有已匯入的 7-11賣貨便商品， <br />
              找到你喜歡的小農、手作與特色商品。
            </p>

            <!-- 搜尋列 -->
            <form
              class="border-primary/50 bg-base-100/80 shadow-base-content/5 flex w-full max-w-xl items-center gap-2 rounded-xl border px-2 py-1 shadow-lg backdrop-blur-sm sm:px-4 sm:py-2.5"
              @submit.prevent="goSearch"
            >
              <Icon
                name="heroicons:magnifying-glass"
                class="text-base-content/40 h-5 w-5 shrink-0"
              />
              <input
                v-model="searchQ"
                type="text"
                class="placeholder:text-base-content/35 input-sm min-w-0 flex-1 bg-transparent text-base outline-none"
                placeholder="搜尋商品名稱、賣場…"
                autofocus
              />
              <button
                type="submit"
                class="btn btn-primary btn-sm sm:btn-md rounded-lg px-4"
                :disabled="!searchQ.trim()"
              >
                搜尋
              </button>
            </form>

            <!-- 熱門搜尋 -->
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <span class="text-base-content/40 text-xs">推薦：</span>
              <button
                v-for="tag in ['貓', '蛋糕', '甜點', '美妝', '戒指', '布朗尼']"
                :key="tag"
                class="border-base-content/10 bg-base-100/60 text-base-content/60 hover:border-primary/40 hover:bg-primary/5 hover:text-primary cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors"
                @click="
                  searchQ = tag;
                  goSearch();
                "
              >
                {{ tag }}
              </button>
            </div>
          </div>

          <!-- 右：CTA + 統計 -->
          <div class="hidden gap-4 sm:flex lg:flex-col">
            <!-- 匯入 CTA 卡 -->
            <div
              class="bg-error/10 border-error/20 flex flex-1 flex-col justify-between rounded-2xl border p-6"
            >
              <div>
                <div class="flex items-center gap-2 lg:flex-col">
                  <h2
                    class="text-base-content mb-4 text-lg font-semibold lg:mb-2"
                  >
                    有賣貨便賣場嗎？
                  </h2>
                </div>

                <p
                  class="text-base-content/60 mb-5 text-sm leading-relaxed sm:text-base"
                >
                  匯入你的賣場，讓更多人找到你的商品。
                </p>
              </div>
              <NuxtLink to="/import" class="btn btn-primary w-full gap-2">
                <Icon name="heroicons:plus-circle" class="h-4 w-4" />
                立即匯入賣場
              </NuxtLink>
            </div>

            <!-- 統計卡 -->
            <div
              class="border-base-content/10 bg-base-100/60 flex-1 rounded-2xl border p-6 backdrop-blur-sm"
            >
              <p
                class="text-base-content/50 mb-4 text-base font-medium tracking-wider uppercase"
              >
                目前已經有
              </p>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p
                    class="text-primary text-4xl font-bold tabular-nums lg:text-2xl"
                  >
                    {{
                      stats?.products != null
                        ? displayProducts.toLocaleString() + "+"
                        : "—"
                    }}
                  </p>
                  <p class="text-base-content/55 mt-0.5 text-sm">上架商品</p>
                </div>
                <div>
                  <p
                    class="text-secondary text-4xl font-bold tabular-nums lg:text-2xl"
                  >
                    {{
                      stats?.shops != null
                        ? displayShops.toLocaleString() + "+"
                        : "—"
                    }}
                  </p>
                  <p class="text-base-content/55 mt-0.5 text-sm">已匯入賣場</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 隨機推薦 ── -->
    <section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <!-- 區塊標題 -->
      <div class="mb-8 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <div class="bg-accent h-5 w-1 rounded-full" />
            <h2 class="text-base-content text-2xl font-semibold">隨機推薦</h2>
          </div>
          <Icon name="heroicons:arrow-path" class="text-xl text-purple-400" />
        </div>
        <button
          class="btn btn-ghost"
          :disabled="isCoolingDown"
          @click="refreshRandom"
        >
          換一批
          <Icon
            name="heroicons:arrow-path"
            class="h-5 w-5"
            :class="{ 'animate-spin': isCoolingDown }"
          />
        </button>
      </div>

      <!-- 載入中 -->
      <div
        v-if="randomPending"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        <SkeletonCard v-for="i in 10" :key="i" />
      </div>

      <!-- 商品列表 -->
      <div
        v-else-if="randomProducts?.length"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        <ProductCard
          v-for="p in randomProducts"
          :key="p.id"
          :id="p.id"
          :name="p.name"
          :main-image="p.main_image"
          :min-price="p.min_price"
          :max-price="p.max_price"
          :shop-name="p.shop_name"
          :shop-id="p.shop_id"
          :click-count="p.click_count"
        />
      </div>
    </section>

    <!-- ── 熱門商品 ── -->
    <section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <!-- 區塊標題 -->
      <div class="mb-8 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <div class="bg-primary h-5 w-1 rounded-full" />
            <h2 class="text-base-content text-2xl font-semibold">熱門商品</h2>
          </div>
          <Icon name="heroicons:fire" class="text-xl text-orange-400" />
        </div>
        <NuxtLink to="/search?sort=popular" class="btn btn-ghost">
          查看更多
          <Icon name="heroicons:arrow-right" class="h-5 w-5" />
        </NuxtLink>
      </div>

      <!-- 載入中 -->
      <div
        v-if="pending"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        <SkeletonCard v-for="i in 20" :key="i" />
      </div>

      <!-- 商品列表 -->
      <div
        v-else-if="hotProducts?.length"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        <ProductCard
          v-for="(p, index) in hotProducts"
          :key="p.id"
          :id="p.id"
          :name="p.name"
          :main-image="p.main_image"
          :min-price="p.min_price"
          :max-price="p.max_price"
          :shop-name="p.shop_name"
          :shop-id="p.shop_id"
          :click-count="p.click_count"
          :is-eager="index < 5"
        />
      </div>

      <!-- 無資料 -->
      <div v-else class="py-24 text-center">
        <div
          class="bg-base-200 mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
        >
          <Icon
            name="heroicons:shopping-bag"
            class="text-base-content/70 h-7 w-7"
          />
        </div>
        <p class="text-base-content mb-1 text-lg">目前還沒有商品</p>
        <p class="text-base-content/90 text-base">
          <NuxtLink
            to="/import"
            class="text-primary cursor-pointer hover:underline"
            >匯入第一個賣場</NuxtLink
          >
          來開始吧！
        </p>
      </div>
    </section>

    <!-- ── 最新上架 ── -->
    <section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <!-- 區塊標題 -->
      <div class="mb-8 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <div class="bg-secondary h-5 w-1 rounded-full" />
            <h2 class="text-base-content text-2xl font-semibold">最新上架</h2>
          </div>
          <Icon name="heroicons:sparkles" class="text-xl text-blue-400" />
        </div>
        <NuxtLink to="/search?sort=newest" class="btn btn-ghost">
          查看更多
          <Icon name="heroicons:arrow-right" class="h-5 w-5" />
        </NuxtLink>
      </div>

      <!-- 載入中 -->
      <div
        v-if="newPending"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        <SkeletonCard v-for="i in 20" :key="i" />
      </div>

      <!-- 商品列表 -->
      <div
        v-else-if="newProducts?.length"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        <ProductCard
          v-for="p in newProducts"
          :key="p.id"
          :id="p.id"
          :name="p.name"
          :main-image="p.main_image"
          :min-price="p.min_price"
          :max-price="p.max_price"
          :shop-name="p.shop_name"
          :shop-id="p.shop_id"
          :click-count="p.click_count"
        />
      </div>
    </section>
  </div>
</template>
