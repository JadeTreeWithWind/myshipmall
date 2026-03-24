<script setup lang="ts">
const config = useRuntimeConfig();
const searchDesc = "在 MyShipBang 搜尋賣貨便商品，快速找到您想要的物品。";

useHead({
  title: "搜尋商品 — MyShipBang",
  meta: [
    { name: "description", content: searchDesc },
    { property: "og:title", content: "搜尋商品 — MyShipBang" },
    { property: "og:description", content: searchDesc },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `${config.public.siteUrl}/search` },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: "搜尋商品 — MyShipBang" },
    { name: "twitter:description", content: searchDesc },
  ],
});

const route = useRoute();
const router = useRouter();
const { products, loading, hasMore, search, loadMore } = useProductSearch();

// ── 篩選狀態（從 URL query 同步）─────────────────────────────
const q = computed(() => (route.query.q as string) || "");
const sort = ref((route.query.sort as string) || "popular");
const minPrice = ref(
  route.query.min_price ? Number(route.query.min_price) : undefined,
);
const maxPrice = ref(
  route.query.max_price ? Number(route.query.max_price) : undefined,
);

const sortOptions = [
  { value: "popular", label: "最熱門" },
  { value: "price_asc", label: "價格低→高" },
  { value: "price_desc", label: "價格高→低" },
  { value: "newest", label: "最新上架" },
];

// ── 執行搜尋 ─────────────────────────────────────────────────
async function doSearch() {
  // 同步回 URL
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

// 任何篩選變動重新搜尋
watch(sort, doSearch);

// 首次載入 & keyword 改變
watch(q, doSearch, { immediate: true });

function clearFilters() {
  minPrice.value = undefined;
  maxPrice.value = undefined;
  doSearch();
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <!-- ── 標題 & 搜尋關鍵字 ── -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold">
        <template v-if="q">「{{ q }}」的搜尋結果</template>
        <template v-else>全部商品</template>
      </h1>
      <p v-if="products.length" class="text-base-content/50 mt-1 text-sm">
        共找到 {{ products.length }}{{ hasMore ? "+" : "" }} 件商品
      </p>
    </div>

    <!-- ── 篩選列 ── -->
    <div class="bg-base-200 mb-6 flex flex-wrap items-end gap-3 rounded-xl p-4">
      <!-- 排序 -->
      <label class="form-control">
        <div class="label pb-1">
          <span class="label-text text-xs">排序</span>
        </div>
        <select v-model="sort" class="select select-bordered select-sm">
          <option v-for="o in sortOptions" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
        </select>
      </label>

      <!-- 最低價 -->
      <label class="form-control">
        <div class="label pb-1">
          <span class="label-text text-xs">最低價格</span>
        </div>
        <input
          v-model.number="minPrice"
          type="number"
          min="0"
          placeholder="NT$"
          class="input input-bordered input-sm w-28"
        />
      </label>

      <!-- 最高價 -->
      <label class="form-control">
        <div class="label pb-1">
          <span class="label-text text-xs">最高價格</span>
        </div>
        <input
          v-model.number="maxPrice"
          type="number"
          min="0"
          placeholder="NT$"
          class="input input-bordered input-sm w-28"
        />
      </label>

      <div class="flex gap-2 self-end">
        <button
          class="btn btn-primary btn-sm"
          :disabled="loading"
          @click="doSearch"
        >
          套用篩選
        </button>
        <button
          v-if="minPrice || maxPrice"
          class="btn btn-ghost btn-sm"
          @click="clearFilters"
        >
          清除
        </button>
      </div>
    </div>

    <!-- ── 商品列表 ── -->
    <div
      v-if="products.length"
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
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

    <!-- 無結果 -->
    <div v-else class="text-base-content/40 py-20 text-center">
      <div class="mb-4 text-5xl">🔍</div>
      <p class="text-lg">找不到符合的商品</p>
      <p class="mt-2 text-sm">試試不同的關鍵字，或調整篩選條件</p>
    </div>

    <!-- ── 載入更多 ── -->
    <div v-if="hasMore && products.length" class="mt-10 flex justify-center">
      <button class="btn btn-outline" :disabled="loading" @click="loadMore">
        <span v-if="loading" class="loading loading-spinner loading-sm" />
        {{ loading ? "載入中…" : "載入更多商品" }}
      </button>
    </div>
  </div>
</template>
