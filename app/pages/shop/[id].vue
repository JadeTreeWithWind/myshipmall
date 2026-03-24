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
  (
    shop.value?.description?.replace(/<[^>]+>/g, "") ??
    shop.value?.name ??
    ""
  ).slice(0, 150),
);
const shopUrl = `${config.public.siteUrl}${route.path}`;

useHead({
  title: shop.value?.name,
  link: [{ rel: "canonical", href: shopUrl }],
  meta: [
    { name: "description", content: shopDesc.value },
    { property: "og:title", content: shop.value?.name },
    { property: "og:description", content: shopDesc.value },
    { property: "og:image", content: shop.value?.image_url ?? "" },
    { property: "og:type", content: "website" },
    { property: "og:url", content: shopUrl },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: shop.value?.image_url ?? "" },
  ],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Store",
        name: shop.value?.name,
        description: shopDesc.value,
        image: shop.value?.image_url,
        url: shopUrl,
      }),
    },
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
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <!-- ── 商城資訊 ── -->
    <div class="bg-base-100 border-base-300/70 mb-10 rounded-2xl border p-6">
      <div class="flex flex-wrap items-start gap-5">
        <!-- 商城圖片 -->
        <div class="shrink-0">
          <div
            class="bg-base-200 border-base-300/50 h-20 w-20 overflow-hidden rounded-2xl border"
          >
            <img
              v-if="shop?.image_url"
              :src="shop.image_url"
              :alt="shop?.name"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex h-full w-full items-center justify-center">
              <Icon
                name="heroicons:building-storefront"
                class="text-base-content/25 h-8 w-8"
              />
            </div>
          </div>
        </div>

        <div class="min-w-0 flex-1">
          <h1 class="text-base-content font-serif text-2xl font-semibold">
            {{ shop?.name }}
          </h1>
          <p class="text-base-content/90 mt-1 text-sm">
            資料最後更新：{{ updatedAt }}
          </p>
          <a
            v-if="shop?.shop_url"
            :href="shop.shop_url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary mt-2 inline-flex cursor-pointer items-center gap-1 text-base hover:underline"
          >
            前往賣貨便賣場
            <Icon
              name="heroicons:arrow-top-right-on-square"
              class="h-3.5 w-3.5"
            />
          </a>
        </div>
      </div>

      <!-- 商城描述 -->
      <div
        v-if="shop?.description"
        class="prose prose-sm text-base-content/80 border-base-300/50 mt-5 max-w-none border-t pt-5"
        v-html="sanitize(shop.description)"
      />
    </div>

    <!-- ── 商品列表 ── -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="bg-primary h-5 w-1 rounded-full" />
        <h2 class="text-base-content font-serif text-xl font-semibold">
          商城商品
        </h2>
      </div>
      <select
        v-model="sort"
        class="select select-bordered select-sm bg-base-100 focus:border-primary/60 cursor-pointer"
      >
        <option v-for="o in sortOptions" :key="o.value" :value="o.value">
          {{ o.label }}
        </option>
      </select>
    </div>

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
        :shop-name="shop?.name ?? ''"
        :shop-id="shopId"
        :click-count="p.click_count"
        :is-eager="index < 5"
      />
    </div>

    <div
      v-else-if="loading"
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      <SkeletonCard v-for="i in 6" :key="i" />
    </div>

    <div v-else class="py-24 text-center">
      <div
        class="bg-base-200 mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
      >
        <Icon
          name="heroicons:shopping-bag"
          class="text-base-content/70 h-7 w-7"
        />
      </div>
      <p class="text-base-content text-lg">此商城目前沒有上架商品</p>
    </div>

    <!-- 載入更多 -->
    <div v-if="hasMore && products.length" class="mt-12 flex justify-center">
      <button
        class="btn btn-outline cursor-pointer rounded-xl px-8"
        :disabled="loading"
        @click="fetchProducts(false)"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm" />
        {{ loading ? "載入中…" : "載入更多" }}
      </button>
    </div>
  </div>
</template>
