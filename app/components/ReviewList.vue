<script setup lang="ts">
interface Review {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  user_name: string | null;
  user_avatar: string | null;
}

const props = defineProps<{ productId: string }>();
const { minLoadingTime } = useMinLoadingTime();

const {
  data: reviews,
  refresh: _refresh,
  pending,
} = await useAsyncData<Review[]>(`reviews-${props.productId}`, () =>
  minLoadingTime($fetch(`/api/reviews/${props.productId}`)),
);

const refresh = async () => await minLoadingTime(_refresh());

const avgRating = computed(() => {
  const list = reviews.value ?? [];
  if (!list.length) return 0;
  return list.reduce((sum, r) => sum + r.rating, 0) / list.length;
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 供父元件呼叫，新增/編輯評論後重新載入
defineExpose({ refresh });
</script>

<template>
  <div>
    <!-- 標題列 + 平均評分 -->
    <div class="mb-4 flex items-center gap-3">
      <h2 class="text-lg font-bold">買家評論</h2>
      <template v-if="(reviews?.length ?? 0) > 0">
        <div class="flex items-center gap-1">
          <Icon
            name="material-symbols:star-rounded"
            class="text-lg text-yellow-500"
          />
          <span class="font-bold">{{ avgRating.toFixed(1) }}</span>
        </div>
        <span class="text-base-content/80 text-sm"
          >（{{ reviews?.length }} 則）</span
        >
      </template>
    </div>

    <!-- 載入中 -->
    <div v-if="pending" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md" />
    </div>

    <!-- 空狀態 -->
    <div
      v-else-if="!reviews?.length"
      class="bg-base-200 rounded-xl py-10 text-center text-sm opacity-50"
    >
      尚無評論，成為第一個留下評論的人吧！
    </div>

    <!-- 評論列表 -->
    <div v-else class="flex flex-col gap-4">
      <div
        v-for="review in reviews"
        :key="review.id"
        class="bg-base-100 border-base-200 rounded-xl border p-4"
      >
        <!-- 使用者資訊列 -->
        <div class="mb-2 flex items-center gap-2">
          <div class="avatar" aria-hidden="true">
            <div class="w-8 rounded-full">
              <img
                v-if="review.user_avatar"
                :src="review.user_avatar"
                :alt="review.user_name ?? '使用者'"
              />
              <div
                v-else
                class="bg-primary text-primary-content flex h-full w-full items-center justify-center text-xs font-bold"
              >
                {{ (review.user_name || "?").charAt(0).toUpperCase() }}
              </div>
            </div>
          </div>
          <span class="text-sm font-medium">{{
            review.user_name ?? "匿名使用者"
          }}</span>
          <span class="text-base-content/80 ml-auto text-xs">{{
            formatDate(review.created_at)
          }}</span>
        </div>

        <!-- 評分 -->
        <div
          class="mb-1 flex gap-0.5"
          :aria-label="`評分 ${review.rating} 顆星（滿分 5 顆）`"
          role="img"
        >
          <Icon
            v-for="i in 5"
            :key="i"
            name="material-symbols:star-rounded"
            aria-hidden="true"
            :class="
              i <= review.rating ? 'text-yellow-500' : 'text-base-content/20'
            "
          />
        </div>

        <!-- 內容 -->
        <p class="text-sm leading-relaxed">{{ review.content }}</p>
      </div>
    </div>
  </div>
</template>
