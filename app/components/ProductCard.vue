<script setup lang="ts">
// 1. 外部引用（無）

// 2. 類型定義（無）

// 3. 常量宣告（無）

// 4. 響應式狀態/變數
const props = defineProps<{
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

// 5. 計算屬性（無）

// 6. 核心邏輯與函數（無）

// 7. 偵聽器（無）

// 8. 生命週期鉤子（無）
</script>

<template>
  <NuxtLink
    :to="`/product/${id}`"
    class="group bg-base-200/50 border-base-300/70 hover:border-base-300 flex cursor-pointer flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
  >
    <!-- 商品圖片 -->
    <div class="bg-base-200 aspect-square shrink-0 overflow-hidden">
      <img
        v-if="mainImage"
        :src="mainImage"
        :alt="name"
        width="400"
        height="400"
        :loading="isEager ? undefined : 'lazy'"
        :fetchpriority="isEager ? 'high' : undefined"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div v-else class="flex h-full w-full items-center justify-center">
        <Icon name="heroicons:photo" class="text-base-content/20 h-10 w-10" />
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-1.5 p-3">
      <!-- 商品名稱 -->
      <p
        class="text-base-content line-clamp-2 text-sm leading-snug font-medium sm:text-base"
      >
        {{ name }}
      </p>

      <!-- 價格 -->
      <p class="text-primary text-base font-semibold">
        <template v-if="minPrice === maxPrice">
          NT$&nbsp;{{ minPrice.toLocaleString() }}
        </template>
        <template v-else>
          NT$&nbsp;{{ minPrice.toLocaleString() }}–{{
            maxPrice.toLocaleString()
          }}
        </template>
      </p>

      <!-- 商城名稱 & 熱門度 -->
      <div
        class="border-base-200 mt-auto flex items-center justify-between border-t pt-2"
      >
        <NuxtLink
          :to="`/shop/${shopId}`"
          class="text-base-content hover:text-primary max-w-[70%] cursor-pointer truncate text-xs transition-colors sm:text-sm"
          @click.stop
        >
          {{ shopName }}
        </NuxtLink>
        <span
          class="text-base-content/90 flex shrink-0 items-center gap-0.5 text-xs sm:text-sm"
        >
          <Icon name="heroicons:fire" class="h-3 w-3 text-orange-400/80" />
          {{ clickCount }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
