<script setup lang="ts">
// 1. Imports (None)

// 2. Types (None)

// 3. Constants
const config = useRuntimeConfig();
const SEARCH_DESC = "在 賣貨商城 搜尋賣貨便商品，快速找到您想要的物品。";
const SORT_OPTIONS = [
  { value: "popular", label: "最熱門" },
  { value: "price_asc", label: "價格低→高" },
  { value: "price_desc", label: "價格高→低" },
  { value: "newest", label: "最新上架" },
];

// 4. State/Variables
const route = useRoute();
const router = useRouter();
const { products, loading, hasMore, search, loadMore } = useProductSearch();

const sort = ref((route.query.sort as string) || "popular");
const minPrice = ref(
  route.query.min_price ? Number(route.query.min_price) : undefined,
);
const maxPrice = ref(
  route.query.max_price ? Number(route.query.max_price) : undefined,
);

// 5. Computed Properties
const q = computed(() => (route.query.q as string) || "");

// 6. Functions/Methods
async function doSearch() {
  router.replace({
    query: {
      q: q.value || undefined,
      sort: sort.value !== "popular" ? sort.value : undefined,
      min_price: minPrice.value ?? undefined,
      max_price: maxPrice.value ?? undefined,
    },
  });
  await search({
    q: q.value,
    sort: sort.value as any,
    minPrice: minPrice.value,
    maxPrice: maxPrice.value,
  });
}

function clearFilters() {
  minPrice.value = undefined;
  maxPrice.value = undefined;
  doSearch();
}

// 7. Watchers
watch(sort, doSearch);
watch(q, doSearch, { immediate: true });

// 8. Lifecycle Hooks
useHead({
  title: "搜尋商品 — 賣貨商城",
  meta: [
    { name: "description", content: SEARCH_DESC },
    { property: "og:title", content: "搜尋商品 — 賣貨商城" },
    { property: "og:description", content: SEARCH_DESC },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `${config.public.siteUrl}/search` },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: "搜尋商品 — 賣貨商城" },
    { name: "twitter:description", content: SEARCH_DESC },
  ],
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <!-- ── 標題 ── -->
    <div class="mb-6">
      <h1 class="text-base-content font-serif text-2xl font-semibold">
        <template v-if="q">「{{ q }}」的搜尋結果</template>
        <template v-else>全部商品</template>
      </h1>
      <p v-if="products.length" class="text-base-content/80 mt-1 text-sm">
        共找到 {{ products.length }}{{ hasMore ? "+" : "" }} 件商品
      </p>
    </div>

    <!-- ── 篩選列 ── -->
    <div
      class="bg-base-100 border-base-300/70 mb-8 flex flex-wrap items-end gap-4 rounded-xl border p-4"
    >
      <!-- 排序 -->
      <div class="flex flex-col gap-1">
        <span class="text-base-content/90 text-xs font-medium">排序</span>
        <select
          v-model="sort"
          aria-label="排序方式"
          class="select select-bordered select-sm bg-base-100 focus:border-primary/60 min-w-[120px]"
        >
          <option v-for="o in SORT_OPTIONS" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
        </select>
      </div>

      <!-- 分隔線 -->
      <div class="bg-base-300/60 mb-0.5 hidden h-8 w-px self-end sm:block" />

      <!-- 最低價 -->
      <div class="flex flex-col gap-1">
        <span class="text-base-content/90 text-xs font-medium">最低價格</span>
        <input
          v-model.number="minPrice"
          type="number"
          min="0"
          aria-label="最低價格"
          placeholder="NT$"
          class="input input-bordered input-sm bg-base-100 focus:border-primary/60 w-28"
        />
      </div>

      <!-- 最高價 -->
      <div class="flex flex-col gap-1">
        <span class="text-base-content/90 text-xs font-medium">最高價格</span>
        <input
          v-model.number="maxPrice"
          type="number"
          min="0"
          aria-label="最高價格"
          placeholder="NT$"
          class="input input-bordered input-sm bg-base-100 focus:border-primary/60 w-28"
        />
      </div>

      <div class="flex items-end gap-2">
        <button
          class="btn btn-primary btn-sm cursor-pointer"
          :disabled="loading"
          @click="doSearch"
        >
          套用篩選
        </button>
        <button
          v-if="minPrice || maxPrice"
          class="btn btn-ghost btn-sm text-base-content/90 cursor-pointer"
          @click="clearFilters"
        >
          清除
        </button>
      </div>
    </div>

    <!-- ── 商品列表 ── -->
    <div
      v-if="products.length"
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      <ProductCard
        v-for="(p, index) in products"
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

    <!-- 骨架載入中 -->
    <div
      v-else-if="loading"
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      <SkeletonCard v-for="i in 10" :key="i" />
    </div>

    <!-- 無結果 -->
    <div v-else class="py-24 text-center">
      <div
        class="bg-base-200 mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
      >
        <Icon
          name="heroicons:magnifying-glass"
          aria-hidden="true"
          class="text-base-content/70 h-7 w-7"
        />
      </div>
      <p class="text-base-content/90 mb-1 text-base">找不到符合的商品</p>
      <p class="text-base-content/80 text-sm">
        試試不同的關鍵字，或調整篩選條件
      </p>
    </div>

    <!-- ── 載入更多 ── -->
    <div v-if="hasMore && products.length" class="mt-12 flex justify-center">
      <button
        class="btn btn-outline cursor-pointer rounded-xl px-8"
        :disabled="loading"
        @click="loadMore"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm" />
        {{ loading ? "載入中…" : "載入更多商品" }}
      </button>
    </div>
  </div>
</template>
