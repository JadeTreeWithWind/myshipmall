<script setup lang="ts">
const route = useRoute();
const shopId = route.params.id as string;
const { sanitize } = useSanitize();

// ── 取得商城資料 ─────────────────────────────────────────────
const supabase = useSupabase();

const { data: shop, error: shopError } = await useAsyncData(
  `shop-${shopId}`,
  async () => {
    const { data, error } = await supabase
      .from("shops")
      .select("id, name, image_url, description, shop_url, updated_at")
      .eq("id", shopId)
      .single();
    if (error) throw error;
    return data;
  },
);

if (shopError.value || !shop.value) {
  throw createError({ statusCode: 404, message: "找不到此商城" });
}

const config = useRuntimeConfig();
const shopDesc = computed(() =>
  (shop.value?.description?.replace(/<[^>]+>/g, "") ?? shop.value?.name ?? "").slice(0, 150),
);
const shopUrl = `${config.public.siteUrl}${route.path}`;

useHead({
  title: `${shop.value?.name ?? ""} — MyShipBang`,
  meta: [
    { name: "description", content: shopDesc.value },
    { property: "og:title", content: `${shop.value?.name ?? ""} — MyShipBang` },
    { property: "og:description", content: shopDesc.value },
    { property: "og:image", content: shop.value?.image_url ?? "" },
    { property: "og:type", content: "website" },
    { property: "og:url", content: shopUrl },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: `${shop.value?.name ?? ""} — MyShipBang` },
    { name: "twitter:description", content: shopDesc.value },
    { name: "twitter:image", content: shop.value?.image_url ?? "" },
  ],
});

const { minLoadingTime } = useMinLoadingTime();

// ── 商城商品列表 ──────────────────────────────────────────────
const sort = ref("popular");
const sortOptions = [
  { value: "popular", label: "最熱門" },
  { value: "price_asc", label: "價格低→高" },
  { value: "price_desc", label: "價格高→低" },
  { value: "newest", label: "最新上架" },
];

const products = ref<any[]>([]);
const loading = ref(false);
const hasMore = ref(true);
const offset = ref(0);
const PAGE_SIZE = 20;

async function fetchProducts(reset = false) {
  loading.value = true;
  const curOffset = reset ? 0 : offset.value;
  try {
    let q = supabase
      .from("products")
      .select(
        "id, name, main_image, min_price, max_price, click_count, updated_at",
      )
      .eq("shop_id", shopId)
      .eq("status", 1)
      .range(curOffset, curOffset + PAGE_SIZE - 1);

    switch (sort.value) {
      case "price_asc":
        q = q.order("min_price", { ascending: true });
        break;
      case "price_desc":
        q = q.order("max_price", { ascending: false });
        break;
      case "newest":
        q = q.order("updated_at", { ascending: false });
        break;
      default:
        q = q.order("click_count", { ascending: false });
    }

    const { data } = await minLoadingTime(q);
    const result = data ?? [];

    if (reset) {
      products.value = result;
      offset.value = result.length;
    } else {
      products.value.push(...result);
      offset.value += result.length;
    }
    hasMore.value = result.length === PAGE_SIZE;
  } finally {
    loading.value = false;
  }
}

watch(sort, () => fetchProducts(true));
await fetchProducts(true);

const updatedAt = computed(() => {
  const d = shop.value?.updated_at;
  if (!d) return "";
  return new Date(d).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <!-- ── 商城資訊 ── -->
    <div class="card bg-base-100 mb-8 shadow-sm">
      <div class="card-body">
        <div class="flex flex-wrap items-center gap-5">
          <!-- 商城圖片 -->
          <div class="avatar shrink-0">
            <div class="bg-base-200 h-20 w-20 rounded-full">
              <img
                v-if="shop?.image_url"
                :src="shop.image_url"
                :alt="shop?.name"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-3xl"
              >
                🏪
              </div>
            </div>
          </div>

          <div class="min-w-0 flex-1">
            <h1 class="text-2xl font-bold">{{ shop?.name }}</h1>
            <p class="text-base-content/50 mt-1 text-sm">
              資料最後更新：{{ updatedAt }}
            </p>
            <a
              v-if="shop?.shop_url"
              :href="shop.shop_url"
              target="_blank"
              rel="noopener noreferrer"
              class="link link-primary mt-1 inline-flex items-center gap-1 text-sm"
            >
              前往賣貨便賣場
              <Icon
                name="heroicons:arrow-top-right-on-square"
                class="h-4 w-4"
              />
            </a>
          </div>
        </div>

        <!-- 商城描述 -->
        <div
          v-if="shop?.description"
          class="prose prose-sm text-base-content/70 mt-4 max-w-none"
          v-html="sanitize(shop.description)"
        />
      </div>
    </div>

    <!-- ── 商品列表 ── -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xl font-bold">商城商品</h2>
      <select v-model="sort" class="select select-bordered select-sm">
        <option v-for="o in sortOptions" :key="o.value" :value="o.value">
          {{ o.label }}
        </option>
      </select>
    </div>

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
        :shop-name="shop?.name ?? ''"
        :shop-id="shopId"
        :click-count="p.click_count"
        :is-eager="index < 5"
      />
    </div>

    <div
      v-else-if="loading"
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      <div
        v-for="i in 6"
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

    <div v-else class="text-base-content/40 py-20 text-center">
      <p class="text-lg">此商城目前沒有上架商品</p>
    </div>

    <!-- 載入更多 -->
    <div v-if="hasMore && products.length" class="mt-10 flex justify-center">
      <button
        class="btn btn-outline"
        :disabled="loading"
        @click="fetchProducts(false)"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm" />
        {{ loading ? "載入中…" : "載入更多" }}
      </button>
    </div>
  </div>
</template>
