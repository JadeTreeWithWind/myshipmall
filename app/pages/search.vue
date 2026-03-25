<script setup lang="ts">
// 1. Imports (None)

// 2. Types (None)

// 3. Constants
const config = useRuntimeConfig();
const SEARCH_DESC = "在 賣貨商城 搜尋賣貨便商品，快速找到您想要的物品。";
const SORT_OPTIONS = [
  { value: "popular", label: "最熱門" },
  { value: "newest", label: "最新上架" },
  { value: "price_asc", label: "價格↑" },
  { value: "price_desc", label: "價格↓" },
];

// 4. State/Variables
const route = useRoute();
const router = useRouter();
const { products, loading, hasMore, search, loadMore, setProducts } =
  useProductSearch();
const { sentinel } = useInfiniteScroll(() => {
  if (!hasMore.value || loading.value) return;
  loadMore();
});

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

const SCROLL_CACHE_KEY = "search-scroll-state";

// 7. Watchers
watch(sort, doSearch);
watch(q, doSearch);

// 8. Lifecycle Hooks
onBeforeRouteLeave((to) => {
  if (to.path.startsWith("/product/")) {
    sessionStorage.setItem(
      SCROLL_CACHE_KEY,
      JSON.stringify({
        items: products.value,
        hasMore: hasMore.value,
        scrollY: window.scrollY,
        params: { q: q.value, sort: sort.value },
      }),
    );
  } else {
    sessionStorage.removeItem(SCROLL_CACHE_KEY);
  }
});

onMounted(async () => {
  const raw = sessionStorage.getItem(SCROLL_CACHE_KEY);
  if (raw) {
    sessionStorage.removeItem(SCROLL_CACHE_KEY);
    const { items, hasMore: more, scrollY, params } = JSON.parse(raw);
    if (params.q === q.value && params.sort === sort.value) {
      setProducts(items, more, { q: params.q, sort: params.sort });
      await nextTick();
      window.scrollTo(0, scrollY);
      return;
    }
  }
  await doSearch();
});
useHead({
  title: q.value ? `搜尋「${q.value}」` : "搜尋商品",
  link: [{ rel: "canonical", href: `${config.public.siteUrl}/search` }],
  meta: [
    { name: "description", content: SEARCH_DESC },
    { property: "og:title", content: "搜尋商品 — 賣貨商城" },
    { property: "og:description", content: SEARCH_DESC },
    { property: "og:image", content: `${config.public.siteUrl}/og-search.png` },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `${config.public.siteUrl}/search` },
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:image",
      content: `${config.public.siteUrl}/og-search.png`,
    },
  ],
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6">
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
        <div class="flex w-full flex-wrap gap-1">
          <button
            v-for="o in SORT_OPTIONS"
            :key="o.value"
            class="btn btn-sm cursor-pointer"
            :class="sort === o.value ? 'btn-primary' : 'btn-outline'"
            @click="sort = o.value"
          >
            {{ o.label }}
          </button>
        </div>
      </div>

      <!-- 分隔線 -->
      <!-- <div class="bg-base-300/60 mb-0.5 hidden h-8 w-px self-end sm:block" /> -->

      <!-- 最低價 -->
      <!-- <div class="flex flex-col gap-1">
        <span class="text-base-content/90 text-xs font-medium">最低價格</span>
        <input
          v-model.number="minPrice"
          type="number"
          min="0"
          aria-label="最低價格"
          placeholder="NT$"
          class="input input-bordered input-sm bg-base-100 focus:border-primary/60 w-28"
        />
      </div> -->

      <!-- 最高價 -->
      <!-- <div class="flex flex-col gap-1">
        <span class="text-base-content/90 text-xs font-medium">最高價格</span>
        <input
          v-model.number="maxPrice"
          type="number"
          min="0"
          aria-label="最高價格"
          placeholder="NT$"
          class="input input-bordered input-sm bg-base-100 focus:border-primary/60 w-28"
        />
      </div> -->

      <!-- <div class="flex items-end gap-2">
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
      </div> -->
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

    <!-- ── 無限捲動 sentinel ── -->
    <div v-if="hasMore && products.length" ref="sentinel" class="h-1" />

    <!-- ── 載入更多（備援按鈕） ── -->
    <div v-if="hasMore && products.length" class="mt-8 flex justify-center">
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
