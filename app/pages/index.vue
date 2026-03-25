<script setup lang="ts">
// 1. Imports
import type { ProductSearchResult } from "~/composables/useProductSearch";

// 2. Types (None beyond import)

// 3. Constants
const config = useRuntimeConfig();
const HOME_DESC =
  "搜尋並瀏覽所有已匯入的 7-11 賣貨便商品，提供更好的商品瀏覽與搜尋體驗。";

// 4. State/Variables
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

function refreshRandom() {
  if (isCoolingDown.value) return;
  isCoolingDown.value = true;
  _refreshRandom();
  setTimeout(() => (isCoolingDown.value = false), 5000);
}

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

// 5. Computed Properties (None)

// 6. Functions/Methods
function goSearch() {
  if (!searchQ.value.trim()) return;
  router.push({ path: "/search", query: { q: searchQ.value.trim() } });
}

// 7. Watchers (None)

// 8. Lifecycle Hooks
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
    <!-- ── Hero 搜尋區 ── -->
    <section class="relative overflow-hidden px-4 py-20 sm:py-28">
      <div class="relative mx-auto max-w-2xl text-center">
        <!-- 小標籤 -->
        <div
          class="text-primary border-primary/20 bg-primary/5 mb-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium tracking-widest uppercase"
        >
          <Icon name="heroicons:shopping-bag" class="h-3.5 w-3.5" />
          賣貨便商品瀏覽平台
        </div>

        <h1
          class="text-base-content mb-4 text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl"
        >
          探索賣貨便商品
        </h1>
        <p
          class="text-base-content/90 mb-10 text-sm leading-relaxed sm:text-base"
        >
          搜尋並瀏覽所有已匯入的 7-11 賣貨便商品
        </p>
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
