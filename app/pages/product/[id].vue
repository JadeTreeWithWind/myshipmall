<script setup lang="ts">
const route = useRoute()
const productId = route.params.id as string
const supabase = useSupabase()
const { sanitize } = useSanitize()

// ── 取得商品資料 ─────────────────────────────────────────────
const { data: product, error: productError } = await useAsyncData(`product-${productId}`, async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, name, description, main_image, min_price, max_price, click_count, updated_at, status,
      shops!inner(id, name, shop_url),
      product_specs(id, name, price, sale_price, image, stock),
      product_images(id, url, ordering)
    `)
    .eq('id', productId)
    .single()
  if (error) throw error
  return data
})

if (productError.value || !product.value) {
  throw createError({ statusCode: 404, message: '找不到此商品' })
}

useHead({ title: `${product.value?.name ?? ''} — MyShipBang` })

// ── 圖片輪播 ─────────────────────────────────────────────────
const images = computed(() => {
  const imgs = [...(product.value?.product_images ?? [])].sort((a, b) => a.ordering - b.ordering)
  // 若沒有圖片，用主圖
  if (imgs.length === 0 && product.value?.main_image) {
    return [{ id: 'main', url: product.value.main_image, ordering: 0 }]
  }
  return imgs
})

const activeImageIdx = ref(0)
const activeImage = computed(() => images.value[activeImageIdx.value]?.url ?? product.value?.main_image ?? '')

// ── 規格列表 ─────────────────────────────────────────────────
const specs = computed(() =>
  [...(product.value?.product_specs ?? [])].sort((a, b) => a.price - b.price)
)

// ── 商城資訊 ─────────────────────────────────────────────────
const shop = computed(() => (product.value?.shops as any) ?? null)

const updatedAt = computed(() => {
  const d = product.value?.updated_at
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
})

// ── 購買點擊 ─────────────────────────────────────────────────
const buyUrl = computed(() => {
  // 賣貨便商品頁 URL 依商品的 external_id 規則組成
  // 無法直接反查，跳轉到商城頁讓使用者點
  return shop.value?.shop_url ?? null
})

async function handleBuy() {
  // 非同步記錄點擊，不阻擋跳轉
  $fetch('/api/record-click', {
    method: 'POST',
    body: { product_id: productId },
  }).catch(() => {
    // 靜默處理（429 等）
  })

  // 開啟賣貨便商城頁
  if (buyUrl.value) {
    window.open(buyUrl.value, '_blank', 'noopener,noreferrer')
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <!-- 麵包屑 -->
    <div class="breadcrumbs text-sm mb-6">
      <ul>
        <li><NuxtLink to="/">首頁</NuxtLink></li>
        <li v-if="shop">
          <NuxtLink :to="`/shop/${shop.id}`">{{ shop.name }}</NuxtLink>
        </li>
        <li class="truncate max-w-xs">{{ product?.name }}</li>
      </ul>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- ── 左：圖片 ── -->
      <div>
        <!-- 主圖 -->
        <div class="aspect-square rounded-xl overflow-hidden bg-base-200 mb-3">
          <img
            v-if="activeImage"
            :src="activeImage"
            :alt="product?.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-6xl opacity-20">📦</div>
        </div>

        <!-- 縮圖列 -->
        <div v-if="images.length > 1" class="flex gap-2 flex-wrap">
          <button
            v-for="(img, idx) in images"
            :key="img.id"
            class="w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors"
            :class="idx === activeImageIdx ? 'border-primary' : 'border-transparent'"
            @click="activeImageIdx = idx"
          >
            <img :src="img.url" :alt="`圖片 ${idx + 1}`" class="w-full h-full object-cover" loading="lazy" />
          </button>
        </div>
      </div>

      <!-- ── 右：商品資訊 ── -->
      <div class="flex flex-col gap-4">
        <h1 class="text-2xl font-bold leading-snug">{{ product?.name }}</h1>

        <!-- 價格 -->
        <div class="text-2xl text-primary font-bold">
          <template v-if="product?.min_price === product?.max_price">
            NT$ {{ product?.min_price?.toLocaleString() }}
          </template>
          <template v-else>
            NT$ {{ product?.min_price?.toLocaleString() }} ~ {{ product?.max_price?.toLocaleString() }}
          </template>
        </div>

        <!-- 所屬商城 -->
        <div v-if="shop" class="flex items-center gap-2 text-sm text-base-content/60">
          <Icon name="heroicons:building-storefront" class="w-4 h-4" />
          <NuxtLink :to="`/shop/${shop.id}`" class="link link-hover">{{ shop.name }}</NuxtLink>
        </div>

        <!-- 資料更新時間 -->
        <p class="text-xs text-base-content/40">資料最後更新：{{ updatedAt }}</p>

        <!-- ── 規格列表 ── -->
        <div v-if="specs.length" class="overflow-x-auto">
          <table class="table table-sm bg-base-100 rounded-xl">
            <thead>
              <tr>
                <th>規格</th>
                <th>價格</th>
                <th>庫存</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="spec in specs" :key="spec.id">
                <td class="font-medium">{{ spec.name }}</td>
                <td>
                  <template v-if="spec.sale_price > 0">
                    <span class="text-error font-bold">NT$ {{ spec.sale_price.toLocaleString() }}</span>
                    <span class="text-base-content/40 line-through text-xs ml-1">{{ spec.price.toLocaleString() }}</span>
                  </template>
                  <template v-else>
                    NT$ {{ spec.price.toLocaleString() }}
                  </template>
                </td>
                <td>
                  <span v-if="spec.stock > 0" class="badge badge-success badge-sm">{{ spec.stock }}</span>
                  <span v-else class="badge badge-error badge-sm">缺貨</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── 購買按鈕 ── -->
        <button
          class="btn btn-primary btn-lg w-full mt-2"
          @click="handleBuy"
        >
          <Icon name="heroicons:shopping-cart" class="w-5 h-5" />
          前往賣貨便購買
          <Icon name="heroicons:arrow-top-right-on-square" class="w-4 h-4 opacity-70" />
        </button>
        <p class="text-xs text-center text-base-content/40">點擊後將開啟 7-11 賣貨便頁面完成購買</p>

        <!-- 熱門度 -->
        <div class="flex items-center gap-1 text-xs text-base-content/40">
          <Icon name="heroicons:fire" class="w-4 h-4 text-orange-400" />
          {{ product?.click_count }} 次點擊購買
        </div>
      </div>
    </div>

    <!-- ── 商品描述 ── -->
    <div v-if="product?.description" class="mt-10">
      <h2 class="text-lg font-bold mb-4">商品說明</h2>
      <div
        class="prose prose-sm max-w-none bg-base-100 rounded-xl p-6"
        v-html="sanitize(product.description)"
      />
    </div>
  </div>
</template>
