<script setup lang="ts">
const route = useRoute()
const shopId = route.params.id as string
const { sanitize } = useSanitize()

// ── 取得商城資料 ─────────────────────────────────────────────
const supabase = useSupabase()

const { data: shop, error: shopError } = await useAsyncData(`shop-${shopId}`, async () => {
  const { data, error } = await supabase
    .from('shops')
    .select('id, name, image_url, description, shop_url, updated_at')
    .eq('id', shopId)
    .single()
  if (error) throw error
  return data
})

if (shopError.value || !shop.value) {
  throw createError({ statusCode: 404, message: '找不到此商城' })
}

useHead({ title: `${shop.value?.name ?? ''} — MyShipBang` })

// ── 商城商品列表 ──────────────────────────────────────────────
const sort = ref('popular')
const sortOptions = [
  { value: 'popular', label: '最熱門' },
  { value: 'price_asc', label: '價格低→高' },
  { value: 'price_desc', label: '價格高→低' },
  { value: 'newest', label: '最新上架' },
]

const products = ref<any[]>([])
const loading = ref(false)
const hasMore = ref(true)
const offset = ref(0)
const PAGE_SIZE = 20

async function fetchProducts(reset = false) {
  loading.value = true
  const curOffset = reset ? 0 : offset.value
  try {
    let q = supabase
      .from('products')
      .select('id, name, main_image, min_price, max_price, click_count, updated_at')
      .eq('shop_id', shopId)
      .eq('status', 1)
      .range(curOffset, curOffset + PAGE_SIZE - 1)

    switch (sort.value) {
      case 'price_asc': q = q.order('min_price', { ascending: true }); break
      case 'price_desc': q = q.order('max_price', { ascending: false }); break
      case 'newest': q = q.order('updated_at', { ascending: false }); break
      default: q = q.order('click_count', { ascending: false })
    }

    const { data } = await q
    const result = data ?? []

    if (reset) {
      products.value = result
      offset.value = result.length
    } else {
      products.value.push(...result)
      offset.value += result.length
    }
    hasMore.value = result.length === PAGE_SIZE
  } finally {
    loading.value = false
  }
}

watch(sort, () => fetchProducts(true))
await fetchProducts(true)

const updatedAt = computed(() => {
  const d = shop.value?.updated_at
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- ── 商城資訊 ── -->
    <div class="card bg-base-100 shadow-sm mb-8">
      <div class="card-body">
        <div class="flex items-center gap-5 flex-wrap">
          <!-- 商城圖片 -->
          <div class="avatar shrink-0">
            <div class="w-20 h-20 rounded-full bg-base-200">
              <img
                v-if="shop?.image_url"
                :src="shop.image_url"
                :alt="shop?.name"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-3xl">🏪</div>
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-bold">{{ shop?.name }}</h1>
            <p class="text-base-content/50 text-sm mt-1">資料最後更新：{{ updatedAt }}</p>
            <a
              v-if="shop?.shop_url"
              :href="shop.shop_url"
              target="_blank"
              rel="noopener noreferrer"
              class="link link-primary text-sm mt-1 inline-flex items-center gap-1"
            >
              前往賣貨便賣場
              <Icon name="heroicons:arrow-top-right-on-square" class="w-4 h-4" />
            </a>
          </div>
        </div>

        <!-- 商城描述 -->
        <div
          v-if="shop?.description"
          class="prose prose-sm max-w-none mt-4 text-base-content/70"
          v-html="sanitize(shop.description)"
        />
      </div>
    </div>

    <!-- ── 商品列表 ── -->
    <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
      <h2 class="text-xl font-bold">商城商品</h2>
      <select v-model="sort" class="select select-bordered select-sm">
        <option v-for="o in sortOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>

    <div v-if="products.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <ProductCard
        v-for="p in products"
        :key="p.id"
        :id="p.id"
        :name="p.name"
        :main-image="p.main_image"
        :min-price="p.min_price"
        :max-price="p.max_price"
        :shop-name="shop?.name ?? ''"
        :shop-id="shopId"
        :click-count="p.click_count"
      />
    </div>

    <div v-else-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <div v-for="i in 6" :key="i" class="card bg-base-100 shadow-sm animate-pulse">
        <div class="aspect-square bg-base-200 rounded-t-xl" />
        <div class="card-body p-3 gap-2">
          <div class="h-4 bg-base-200 rounded w-3/4" />
          <div class="h-4 bg-base-200 rounded w-1/2" />
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20 text-base-content/40">
      <p class="text-lg">此商城目前沒有上架商品</p>
    </div>

    <!-- 載入更多 -->
    <div v-if="hasMore && products.length" class="flex justify-center mt-10">
      <button class="btn btn-outline" :disabled="loading" @click="fetchProducts(false)">
        <span v-if="loading" class="loading loading-spinner loading-sm" />
        {{ loading ? '載入中…' : '載入更多' }}
      </button>
    </div>
  </div>
</template>
