<script setup lang="ts">
// 1. 外部引用（無）

// 2. 類型定義（無）

// 3. 常量宣告
const route = useRoute();
const productId = route.params.id as string;
const config = useRuntimeConfig();
const productUrl = `${config.public.siteUrl}${route.path}`;

// 4. 響應式狀態/變數
const supabase = useSupabase();
const { sanitize } = useSanitize();

const {
  data: product,
  error: productError,
  pending,
} = useAsyncData(`product-${productId}`, async () => {
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
});

const activeImageIdx = ref(0);
const reviewListRef = ref<{ refresh: () => Promise<void> } | null>(null);
const thumbsRef = ref<HTMLElement | null>(null);
const specsExpanded = ref(false);

watch(activeImageIdx, (idx) => {
  const btn = thumbsRef.value?.children[idx] as HTMLElement | undefined;
  btn?.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "center",
  });
});

function scrollThumbs(dir: "left" | "right") {
  thumbsRef.value?.scrollBy({
    left: dir === "left" ? -300 : 300,
    behavior: "smooth",
  });
}

/**
 * 切換商品主圖
 * @param {'prev' | 'next'} dir - 切換方向：prev 上一張，next 下一張
 */
function navigate(dir: "prev" | "next") {
  const len = images.value.length;
  activeImageIdx.value =
    dir === "next"
      ? (activeImageIdx.value + 1) % len
      : (activeImageIdx.value - 1 + len) % len;
}

// Swipe
const touchStartX = ref(0);
function onTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0]!.clientX;
}
function onTouchEnd(e: TouchEvent) {
  const diff = touchStartX.value - e.changedTouches[0]!.clientX;
  if (Math.abs(diff) < 40) return;
  // diff > 0：手指往左滑 → 看下一張；diff < 0：手指往右滑 → 看上一張
  navigate(diff > 0 ? "next" : "prev");
}

// 5. 計算屬性
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

interface ShopRef {
  id: string;
  name: string;
  shop_url: string;
}
const shop = computed(
  () => (product.value?.shops as unknown as ShopRef) ?? null,
);

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

// 6. 核心邏輯與函數
async function handleBuy() {
  $fetch("/api/record-click", {
    method: "POST",
    body: { product_id: productId },
  }).catch(() => {});

  if (buyUrl.value) {
    window.open(buyUrl.value, "_blank", "noopener,noreferrer");
  }
}

// 7. 偵聽器（無）

// 8. 生命週期鉤子
useHead({
  title: () => product.value?.name ?? "商品載入中",
  meta: [
    { name: "description", content: () => productDesc.value + "| 賣貨商城" },
    {
      property: "og:title",
      content: () => (product.value?.name ?? "") + "| 賣貨商城",
    },
    {
      property: "og:description",
      content: () => productDesc.value + "| 賣貨商城",
    },
    { property: "og:image", content: () => product.value?.main_image ?? "" },
    { property: "og:type", content: "product" },
    { property: "og:url", content: productUrl },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: () => product.value?.main_image ?? "" },
  ],
  script: computed(() =>
    product.value
      ? [
          {
            type: "application/ld+json",
            innerHTML: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              name: product.value.name,
              image: images.value.map((img) => img.url),
              description: productDesc.value,
              offers: {
                "@type": "AggregateOffer",
                availability: "https://schema.org/InStock",
                priceCurrency: "TWD",
                lowPrice: product.value.min_price,
                highPrice: product.value.max_price,
                offerCount: specs.value.length || 1,
              },
            }),
          },
        ]
      : [],
  ),
});
</script>

<template>
  <div class="relative mx-auto max-w-7xl px-4 sm:px-6 sm:py-4">
    <!-- 404 -->
    <div
      v-if="!pending && (productError || !product)"
      class="flex flex-col items-center gap-4 py-32 text-center"
    >
      <Icon
        name="heroicons:face-frown"
        class="text-base-content/30 h-16 w-16"
      />
      <p class="text-base-content/60">找不到此商品</p>
      <NuxtLink to="/" class="btn btn-primary btn-sm">回首頁</NuxtLink>
    </div>

    <!-- Skeleton -->
    <template v-else-if="pending">
      <!-- 麵包屑 skeleton -->
      <div class="mb-8 hidden items-center gap-2 sm:flex">
        <div class="skeleton h-4 w-12 rounded" />
        <div class="skeleton h-4 w-4 rounded" />
        <div class="skeleton h-4 w-24 rounded" />
        <div class="skeleton h-4 w-4 rounded" />
        <div class="skeleton h-4 w-40 rounded" />
      </div>

      <div class="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <!-- 左：圖片 skeleton -->
        <div>
          <div
            class="skeleton bg-base-200 mb-3 aspect-square w-full rounded-2xl"
          />
          <div class="flex gap-2">
            <div
              v-for="n in 3"
              :key="n"
              class="skeleton h-16 w-16 rounded-xl"
            />
          </div>
        </div>

        <!-- 右：資訊 skeleton -->
        <div class="flex flex-col gap-5">
          <div class="skeleton h-7 w-3/4 rounded-lg" />
          <div class="skeleton h-7 w-1/2 rounded-lg" />
          <div class="skeleton h-10 w-full rounded-xl" />
          <div class="skeleton h-4 w-1/3 rounded" />
          <div class="border-base-300/70 overflow-hidden rounded-xl border">
            <div class="skeleton h-48 w-full" />
          </div>
          <div class="skeleton h-12 w-full rounded-xl" />
        </div>
      </div>
    </template>

    <!-- 實際內容 -->
    <template v-else>
      <!-- 麵包屑 -->
      <div class="breadcrumbs text-base-content mb-8 hidden text-sm sm:flex">
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
            class="bg-base-200 group border-base-300/50 relative mb-3 aspect-square overflow-hidden rounded-2xl border"
            @touchstart="onTouchStart"
            @touchend="onTouchEnd"
          >
            <Transition name="fade">
              <img
                v-if="activeImage"
                :key="activeImageIdx"
                :src="activeImage"
                :alt="product?.name"
                class="absolute inset-0 h-full w-full object-cover"
                fetchpriority="high"
              />
              <div
                v-else
                :key="`empty-${activeImageIdx}`"
                class="absolute inset-0 flex h-full w-full items-center justify-center"
              >
                <Icon
                  name="heroicons:photo"
                  class="text-base-content/20 h-16 w-16"
                />
              </div>
            </Transition>

            <!-- 左右箭頭（多張圖才顯示） -->
            <template v-if="images.length > 1">
              <button
                class="btn btn-circle btn-sm bg-base-100/50 absolute top-1/2 left-2 -translate-y-1/2 border-0 opacity-0 backdrop-blur-xs transition-all duration-300 group-hover:opacity-100 hover:scale-105"
                aria-label="上一張"
                @click="navigate('prev')"
              >
                <Icon name="heroicons:chevron-left" class="h-4 w-4" />
              </button>
              <button
                class="btn btn-circle btn-sm bg-base-100/50 absolute top-1/2 right-2 -translate-y-1/2 border-0 opacity-0 backdrop-blur-xs transition-all duration-300 group-hover:opacity-100 hover:scale-105"
                aria-label="下一張"
                @click="navigate('next')"
              >
                <Icon name="heroicons:chevron-right" class="h-4 w-4" />
              </button>

              <!-- 底部 dot 指示器 -->
              <div
                class="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5"
              >
                <span
                  v-for="(_, i) in images"
                  :key="i"
                  class="block h-1.5 w-1.5 rounded-full transition-all duration-200"
                  :class="
                    i === activeImageIdx ? 'bg-primary w-3' : 'bg-base-100/60'
                  "
                />
              </div>
            </template>
          </div>

          <!-- 縮圖列 -->
          <div v-if="images.length > 1" class="group relative">
            <div
              ref="thumbsRef"
              class="scrollbar-hide flex gap-1 overflow-x-auto sm:gap-2"
            >
              <button
                v-for="(img, idx) in images"
                :key="img.id"
                aria-label="更換預覽圖片"
                class="h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-200"
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
            <button
              class="btn btn-circle btn-sm bg-base-100/50 absolute top-1/2 left-0 -translate-y-1/2 border-0 opacity-0 backdrop-blur-xs transition-all duration-300 group-hover:opacity-100 hover:scale-105"
              aria-label="往左"
              @click="scrollThumbs('left')"
            >
              <Icon name="heroicons:chevron-left" class="h-4 w-4" />
            </button>
            <button
              class="btn btn-circle btn-sm bg-base-100/50 absolute top-1/2 right-0 -translate-y-1/2 border-0 opacity-0 backdrop-blur-xs transition-all duration-300 group-hover:opacity-100 hover:scale-105"
              aria-label="往右"
              @click="scrollThumbs('right')"
            >
              <Icon name="heroicons:chevron-right" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- ── 右：商品資訊 ── -->
        <div class="flex flex-col gap-5">
          <h1
            class="text-base-content text-xl leading-snug font-semibold sm:text-2xl"
          >
            {{ product?.name }}
          </h1>

          <!-- 價格 -->
          <div
            class="text-primary text-xl font-bold tracking-tight sm:text-3xl"
          >
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
            <Icon
              name="heroicons:building-storefront"
              class="h-4 w-4 shrink-0"
            />
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
          <div v-if="specs.length" class="border-base-300/70 rounded-xl border">
            <div
              class="overflow-x-auto transition-all duration-300"
              :class="
                specsExpanded ? 'max-h-none' : 'max-h-48 overflow-y-hidden'
              "
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
                    <td class="w-full max-w-0 truncate text-sm font-medium">
                      {{ spec.name }}
                    </td>
                    <td class="min-w-30 text-sm">
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
            <button
              v-if="specs.length > 5"
              class="border-base-300/70 text-base-content/70 hover:bg-base-200/50 flex w-full cursor-pointer items-center justify-center gap-1 border-t py-2 text-xs transition-colors"
              @click="specsExpanded = !specsExpanded"
            >
              <Icon
                name="heroicons:chevron-down"
                class="h-3.5 w-3.5 transition-transform duration-300"
                :class="specsExpanded ? 'rotate-180' : ''"
              />
              {{
                specsExpanded ? "收起規格" : `展開全部 ${specs.length} 個規格`
              }}
            </button>
          </div>

          <!-- ── 購買按鈕 ── -->
          <button
            class="btn btn-primary btn-lg mt-1 w-full cursor-pointer gap-2 rounded-xl text-base"
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
          <h2 class="text-lg font-semibold">商品說明</h2>
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
          <h2 class="text-lg font-semibold">評論</h2>
        </div>
        <ReviewForm
          :product-id="productId"
          class="mb-8"
          @submitted="reviewListRef?.refresh()"
        />
        <ReviewList ref="reviewListRef" :product-id="productId" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
  position: absolute;
  inset: 0;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scrollbar-hide {
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
