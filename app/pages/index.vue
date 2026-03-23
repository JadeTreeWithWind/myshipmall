<script setup lang="ts">
import type { ProductSearchResult } from '~/composables/useProductSearch'

useHead({ title: 'MyShipBang — 賣貨便商品瀏覽平台' })

const router = useRouter()
const searchQ = ref('')

function goSearch() {
  if (!searchQ.value.trim()) return
  router.push({ path: '/search', query: { q: searchQ.value.trim() } })
}

// 熱門商品：依 click_count 取前 20 筆
const { data: hotProducts, pending } = await useFetch<ProductSearchResult[]>('/api/products/search', {
  query: { sort: 'popular', offset: 0 },
})
</script>

<template>
  <div>
    <!-- ── Hero 搜尋區 ── -->
    <section class="bg-linear-to-br from-primary/10 to-secondary/10 py-16 px-4">
      <div class="max-w-2xl mx-auto text-center">
        <h1 class="text-3xl lg:text-4xl font-bold mb-3">探索賣貨便商品</h1>
        <p class="text-base-content/60 mb-8">搜尋並瀏覽所有已匯入的 7-11 賣貨便商品</p>
        <form class="flex gap-2 max-w-lg mx-auto" @submit.prevent="goSearch">
          <input
            v-model="searchQ"
            type="search"
            placeholder="搜尋商品名稱、商城..."
            class="input input-bordered flex-1 input-lg"
            autofocus
          />
          <button type="submit" class="btn btn-primary btn-lg">
            <Icon name="heroicons:magnifying-glass" class="w-5 h-5" />
          </button>
        </form>
      </div>
    </section>

    <!-- ── 熱門商品 ── -->
    <section class="max-w-7xl mx-auto px-4 py-10">
      <div class="flex items-center gap-2 mb-6">
        <Icon name="heroicons:fire" class="w-6 h-6 text-orange-500" />
        <h2 class="text-xl font-bold">熱門商品</h2>
      </div>

      <!-- 載入中 -->
      <div v-if="pending" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div v-for="i in 10" :key="i" class="card bg-base-100 shadow-sm animate-pulse">
          <div class="aspect-square bg-base-200 rounded-t-xl" />
          <div class="card-body p-3 gap-2">
            <div class="h-4 bg-base-200 rounded w-3/4" />
            <div class="h-4 bg-base-200 rounded w-1/2" />
          </div>
        </div>
      </div>

      <!-- 商品列表 -->
      <div v-else-if="hotProducts?.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <ProductCard
          v-for="p in hotProducts"
          :key="p.id"
          :id="p.id"
          :name="p.name"
          :main-image="p.main_image"
          :min-price="p.min_price"
          :max-price="p.max_price"
          :shop-name="p.shop_name"
          :shop-id="p.shop_id"
          :click-count="p.click_count"
        />
      </div>

      <!-- 無資料 -->
      <div v-else class="text-center py-20 text-base-content/40">
        <div class="text-5xl mb-4">🛍️</div>
        <p class="text-lg">目前還沒有商品</p>
        <p class="text-sm mt-2">
          <NuxtLink to="/import" class="link link-primary">匯入第一個賣場</NuxtLink>
          來開始吧！
        </p>
      </div>
    </section>
  </div>
</template>
