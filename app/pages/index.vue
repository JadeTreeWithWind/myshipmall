<script setup lang="ts">
import type { ProductSearchResult } from "~/composables/useProductSearch";

const config = useRuntimeConfig();
const homeDesc =
  "搜尋並瀏覽所有已匯入的 7-11 賣貨便商品，提供更好的商品瀏覽與搜尋體驗。";

useHead({
  title: "MyShipBang — 賣貨便商品瀏覽平台",
  meta: [
    { name: "description", content: homeDesc },
    { property: "og:title", content: "MyShipBang — 賣貨便商品瀏覽平台" },
    { property: "og:description", content: homeDesc },
    { property: "og:type", content: "website" },
    { property: "og:url", content: config.public.siteUrl },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "MyShipBang — 賣貨便商品瀏覽平台" },
    { name: "twitter:description", content: homeDesc },
  ],
});

const router = useRouter();
const searchQ = ref("");

function goSearch() {
  if (!searchQ.value.trim()) return;
  router.push({ path: "/search", query: { q: searchQ.value.trim() } });
}

// 熱門商品：依 click_count 取前 20 筆
const { data: hotProducts, pending } = await useFetch<ProductSearchResult[]>(
  "/api/products/search",
  {
    query: { sort: "popular", offset: 0 },
  },
);
</script>

<template>
  <div>
    <!-- ── Hero 搜尋區 ── -->
    <section class="from-primary/10 to-secondary/10 bg-linear-to-br px-4 py-16">
      <div class="mx-auto max-w-2xl text-center">
        <h1 class="mb-3 text-3xl font-bold lg:text-4xl">探索賣貨便商品</h1>
        <p class="text-base-content/60 mb-8">
          搜尋並瀏覽所有已匯入的 7-11 賣貨便商品
        </p>
        <form class="mx-auto flex max-w-lg gap-2" @submit.prevent="goSearch">
          <input
            v-model="searchQ"
            type="search"
            placeholder="搜尋商品名稱、商城..."
            class="input input-bordered input-lg flex-1"
            autofocus
          />
          <button type="submit" class="btn btn-primary btn-lg">
            <Icon name="heroicons:magnifying-glass" class="h-5 w-5" />
          </button>
        </form>
      </div>
    </section>

    <!-- ── 熱門商品 ── -->
    <section class="mx-auto max-w-7xl px-4 py-10">
      <div class="mb-6 flex items-center gap-2">
        <Icon name="heroicons:fire" class="h-6 w-6 text-orange-500" />
        <h2 class="text-xl font-bold">熱門商品</h2>
      </div>

      <!-- 載入中 -->
      <div
        v-if="pending"
        class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        <div
          v-for="i in 10"
          :key="i"
          class="card bg-base-100 animate-pulse shadow-sm"
        >
          <div class="bg-base-200 aspect-square rounded-t-xl" />
          <div class="card-body gap-2 p-3">
            <div class="bg-base-200 h-4 w-3/4 rounded" />
            <div class="bg-base-200 h-4 w-1/2 rounded" />
          </div>
        </div>
      </div>

      <!-- 商品列表 -->
      <div
        v-else-if="hotProducts?.length"
        class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
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
      <div v-else class="text-base-content/40 py-20 text-center">
        <div class="mb-4 text-5xl">🛍️</div>
        <p class="text-lg">目前還沒有商品</p>
        <p class="mt-2 text-sm">
          <NuxtLink to="/import" class="link link-primary"
            >匯入第一個賣場</NuxtLink
          >
          來開始吧！
        </p>
      </div>
    </section>
  </div>
</template>
