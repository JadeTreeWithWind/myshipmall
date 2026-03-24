<script setup lang="ts">
// 1. Imports (None)

// 2. Types (None)

// 3. Constants (None)

// 4. State/Variables
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

const router = useRouter();

// 5. Computed Properties (None)

// 6. Functions/Methods
function goToShop(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  router.push(`/shop/${props.shopId}`);
}

// 7. Watchers (None)

// 8. Lifecycle Hooks (None)
</script>

<template>
  <div
    class="group bg-base-100 border-base-300/70 hover:border-base-300 flex cursor-pointer flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    @click="router.push(`/product/${id}`)"
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
        class="text-base-content line-clamp-2 text-base leading-snug font-medium"
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
          class="text-base-content hover:text-primary max-w-[70%] cursor-pointer truncate text-sm transition-colors"
          @click.stop
        >
          {{ shopName }}
        </NuxtLink>
        <span
          class="text-base-content/90 flex shrink-0 items-center gap-0.5 text-sm"
        >
          <Icon name="heroicons:fire" class="h-3 w-3 text-orange-400/80" />
          {{ clickCount }}
        </span>
      </div>
    </div>
  </div>
</template>
