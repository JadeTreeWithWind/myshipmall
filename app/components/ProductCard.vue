<script setup lang="ts">
defineProps<{
  id: string;
  name: string;
  mainImage: string | null;
  minPrice: number;
  maxPrice: number;
  shopName: string;
  shopId: string;
  clickCount: number;
  isEager?: boolean;
}>();
</script>

<template>
  <NuxtLink
    :to="`/product/${id}`"
    class="card bg-base-100 group shadow-sm transition-shadow hover:shadow-md"
  >
    <!-- 商品圖片 -->
    <figure class="bg-base-200 aspect-square overflow-hidden">
      <img
        v-if="mainImage"
        :src="mainImage"
        :alt="name"
        :loading="isEager ? undefined : 'lazy'"
        :fetchpriority="isEager ? 'high' : undefined"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center text-4xl opacity-30"
      >
        📦
      </div>
    </figure>

    <div class="card-body gap-1 p-3">
      <!-- 商品名稱 -->
      <p class="line-clamp-2 text-sm leading-snug font-medium">{{ name }}</p>

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
      <div class="mt-1 flex items-center justify-between">
        <NuxtLink
          :to="`/shop/${shopId}`"
          class="text-base-content/50 hover:text-primary max-w-[70%] truncate text-xs"
          @click.stop
        >
          {{ shopName }}
        </NuxtLink>
        <span
          class="text-base-content/40 flex shrink-0 items-center gap-0.5 text-xs"
        >
          <Icon name="heroicons:fire" class="h-3 w-3" />
          {{ clickCount }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
