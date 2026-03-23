<script setup lang="ts">
defineProps<{
  id: string
  name: string
  mainImage: string | null
  minPrice: number
  maxPrice: number
  shopName: string
  shopId: string
  clickCount: number
}>()
</script>

<template>
  <NuxtLink :to="`/product/${id}`" class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow group">
    <!-- 商品圖片 -->
    <figure class="aspect-square overflow-hidden bg-base-200">
      <img
        v-if="mainImage"
        :src="mainImage"
        :alt="name"
        loading="lazy"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-4xl opacity-30">
        📦
      </div>
    </figure>

    <div class="card-body p-3 gap-1">
      <!-- 商品名稱 -->
      <p class="font-medium text-sm line-clamp-2 leading-snug">{{ name }}</p>

      <!-- 價格 -->
      <p class="text-primary font-bold">
        <template v-if="minPrice === maxPrice">
          NT$ {{ minPrice.toLocaleString() }}
        </template>
        <template v-else>
          NT$ {{ minPrice.toLocaleString() }} ~ {{ maxPrice.toLocaleString() }}
        </template>
      </p>

      <!-- 商城名稱 & 熱門度 -->
      <div class="flex items-center justify-between mt-1">
        <NuxtLink
          :to="`/shop/${shopId}`"
          class="text-xs text-base-content/50 hover:text-primary truncate max-w-[70%]"
          @click.stop
        >
          {{ shopName }}
        </NuxtLink>
        <span class="text-xs text-base-content/40 flex items-center gap-0.5 shrink-0">
          <Icon name="heroicons:fire" class="w-3 h-3" />
          {{ clickCount }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
