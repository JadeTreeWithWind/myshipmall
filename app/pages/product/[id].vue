<script setup lang="ts">
// 1. Imports (None)

// 2. Types (None)

// 3. Constants
const route = useRoute();
const productId = route.params.id as string;
const config = useRuntimeConfig();
const productUrl = `${config.public.siteUrl}${route.path}`;

// 4. State/Variables
const supabase = useSupabase();
const { sanitize } = useSanitize();

const { data: product, error: productError } = await useAsyncData(
  `product-${productId}`,
  async () => {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
      id, name, description, main_image, min_price, max_price, click_count, updated_at, status,
      shops!inner(id, name, shop_url),
      product_specs(id, name, price, sale_price, image, stock),
      product_images(id, url, ordering)
    `,
      )
      .eq("id", productId)
      .single();
    if (error) throw error;
    return data;
  },
);

if (productError.value || !product.value) {
  throw createError({ statusCode: 404, message: "找不到此商品" });
}

const activeImageIdx = ref(0);
const reviewListRef = ref<{ refresh: () => Promise<void> } | null>(null);

// 5. Computed Properties
const productDesc = computed(() => {
  const raw = product.value?.description ?? product.value?.name ?? "";
  return raw.replace(/<[^>]+>/g, "").slice(0, 150);
});

const images = computed(() => {
  const imgs = [...(product.value?.product_images ?? [])].sort(
    (a, b) => a.ordering - b.ordering,
  );
  if (imgs.length === 0 && product.value?.main_image) {
    return [{ id: "main", url: product.value.main_image, ordering: 0 }];
  }
  return imgs;
});

const activeImage = computed(
  () =>
    images.value[activeImageIdx.value]?.url ?? product.value?.main_image ?? "",
);

const specs = computed(() =>
  [...(product.value?.product_specs ?? [])].sort((a, b) => a.price - b.price),
);

const shop = computed(() => (product.value?.shops as any) ?? null);

const updatedAt = computed(() => {
  const d = product.value?.updated_at;
  if (!d) return "";
  return new Date(d).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

const buyUrl = computed(() => shop.value?.shop_url ?? null);

// 6. Functions/Methods
async function handleBuy() {
  $fetch("/api/record-click", {
    method: "POST",
    body: { product_id: productId },
  }).catch(() => {});

  if (buyUrl.value) {
    window.open(buyUrl.value, "_blank", "noopener,noreferrer");
  }
}

// 7. Watchers (None)

// 8. Lifecycle Hooks
useHead({
  title: `${product.value?.name ?? ""} — 賣貨商城`,
  meta: [
    { name: "description", content: productDesc.value },
    {
      property: "og:title",
      content: `${product.value?.name ?? ""} — 賣貨商城`,
    },
    { property: "og:description", content: productDesc.value },
    { property: "og:image", content: product.value?.main_image ?? "" },
    { property: "og:type", content: "product" },
    { property: "og:url", content: productUrl },
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content: `${product.value?.name ?? ""} — 賣貨商城`,
    },
    { name: "twitter:description", content: productDesc.value },
    { name: "twitter:image", content: product.value?.main_image ?? "" },
  ],
});
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
    <!-- 麵包屑 -->
    <div class="breadcrumbs text-base-content mb-8 text-base">
      <ul>
        <li>
          <NuxtLink to="/" class="hover:text-primary transition-colors"
            >首頁</NuxtLink
          >
        </li>
        <li v-if="shop">
          <NuxtLink
            :to="`/shop/${shop.id}`"
            class="hover:text-primary transition-colors"
            >{{ shop.name }}</NuxtLink
          >
        </li>
        <li class="text-base-content/90 max-w-xs truncate">
          {{ product?.name }}
        </li>
      </ul>
    </div>

    <div class="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <!-- ── 左：圖片 ── -->
      <div>
        <!-- 主圖 -->
        <div
          class="bg-base-200 border-base-300/50 mb-3 aspect-square overflow-hidden rounded-2xl border"
        >
          <img
            v-if="activeImage"
            :src="activeImage"
            :alt="product?.name"
            class="h-full w-full object-cover"
            fetchpriority="high"
          />
          <div v-else class="flex h-full w-full items-center justify-center">
            <Icon
              name="heroicons:photo"
              class="text-base-content/20 h-16 w-16"
            />
          </div>
        </div>

        <!-- 縮圖列 -->
        <div v-if="images.length > 1" class="flex flex-wrap gap-2">
          <button
            v-for="(img, idx) in images"
            :key="img.id"
            aria-label="更換預覽圖片"
            class="h-16 w-16 cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200"
            :class="
              idx === activeImageIdx
                ? 'border-primary shadow-sm'
                : 'border-base-300/50 hover:border-base-300'
            "
            @click="activeImageIdx = idx"
          >
            <img
              :src="img.url"
              :alt="`圖片 ${idx + 1}`"
              class="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        </div>
      </div>

      <!-- ── 右：商品資訊 ── -->
      <div class="flex flex-col gap-5">
        <h1
          class="text-base-content font-serif text-2xl leading-snug font-semibold"
        >
          {{ product?.name }}
        </h1>

        <!-- 價格 -->
        <div class="text-primary text-3xl font-bold tracking-tight">
          <template v-if="product?.min_price === product?.max_price">
            NT$&nbsp;{{ product?.min_price?.toLocaleString() }}
          </template>
          <template v-else>
            NT$&nbsp;{{ product?.min_price?.toLocaleString() }}&nbsp;–&nbsp;{{
              product?.max_price?.toLocaleString()
            }}
          </template>
        </div>

        <!-- 所屬商城 -->
        <div
          v-if="shop"
          class="text-base-content flex items-center gap-2 text-base"
        >
          <Icon name="heroicons:building-storefront" class="h-4 w-4 shrink-0" />
          <NuxtLink
            :to="`/shop/${shop.id}`"
            class="hover:text-primary cursor-pointer transition-colors"
            >{{ shop.name }}</NuxtLink
          >
        </div>

        <!-- 資料更新時間 -->
        <p class="text-base-content/90 text-sm">
          資料最後更新：{{ updatedAt }}
        </p>

        <!-- ── 規格列表 ── -->
        <div
          v-if="specs.length"
          class="border-base-300/70 overflow-x-auto rounded-xl border"
        >
          <table class="table-sm bg-base-100 table w-full">
            <thead class="bg-base-200/60">
              <tr class="text-base-content/90 text-sm font-medium">
                <th>規格</th>
                <th>價格</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="spec in specs"
                :key="spec.id"
                class="border-base-300/40"
              >
                <td class="text-base font-medium">{{ spec.name }}</td>
                <td class="text-base">
                  <template v-if="spec.sale_price > 0">
                    <span class="text-error font-semibold"
                      >NT$&nbsp;{{ spec.sale_price.toLocaleString() }}</span
                    >
                    <span
                      class="text-base-content/80 ml-1.5 text-sm line-through"
                      >{{ spec.price.toLocaleString() }}</span
                    >
                  </template>
                  <template v-else>
                    NT$&nbsp;{{ spec.price.toLocaleString() }}
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── 購買按鈕 ── -->
        <button
          class="btn btn-primary btn-lg mt-1 w-full cursor-pointer gap-2 rounded-xl"
          @click="handleBuy"
        >
          <Icon name="heroicons:shopping-cart" class="h-5 w-5" />
          前往賣貨便購買
          <Icon
            name="heroicons:arrow-top-right-on-square"
            class="h-4 w-4 opacity-60"
          />
        </button>
        <p class="text-base-content/90 -mt-2 text-center text-sm">
          點擊後將開啟 7-11 賣貨便頁面完成購買
        </p>

        <!-- 熱門度 -->
        <div class="text-base-content/90 flex items-center gap-1.5 text-sm">
          <Icon name="heroicons:fire" class="h-4 w-4 text-orange-400/60" />
          {{ product?.click_count }} 次點擊購買
        </div>
      </div>
    </div>

    <!-- ── 商品描述 ── -->
    <div v-if="product?.description" class="mt-14">
      <div class="mb-6 flex items-center gap-3">
        <div class="bg-primary h-5 w-1 rounded-full" />
        <h2 class="font-serif text-lg font-semibold">商品說明</h2>
      </div>
      <div
        class="prose prose-sm bg-base-100 border-base-300/60 max-w-none rounded-2xl border p-6"
        v-html="sanitize(product.description)"
      />
    </div>

    <!-- ── 評論區 ── -->
    <div class="mt-14">
      <div class="mb-6 flex items-center gap-3">
        <div class="bg-primary h-5 w-1 rounded-full" />
        <h2 class="font-serif text-lg font-semibold">評論</h2>
      </div>
      <ReviewForm
        :product-id="productId"
        class="mb-8"
        @submitted="reviewListRef?.refresh()"
      />
      <ReviewList ref="reviewListRef" :product-id="productId" />
    </div>
  </div>
</template>
