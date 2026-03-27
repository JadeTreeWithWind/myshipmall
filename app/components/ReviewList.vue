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

const PAGE_SIZE = 20;

const reviews = ref<Review[]>([]);
const initialPending = ref(false);
const loadingMore = ref(false);
const hasMore = ref(true);
const totalFetched = ref(0);

async function fetchPage(offset: number, append = true) {
  if (append) loadingMore.value = true;
  else initialPending.value = true;
  try {
    const data = await minLoadingTime(
      $fetch<Review[]>(`/api/reviews/${props.productId}`, {
        query: { limit: PAGE_SIZE, offset },
      }),
    );
    if (append) {
      reviews.value.push(...data);
    } else {
      reviews.value = data;
    }
    totalFetched.value = offset + data.length;
    hasMore.value = data.length === PAGE_SIZE;
  } finally {
    if (append) loadingMore.value = false;
    else initialPending.value = false;
  }
}

// SSR 初始載入第一頁
await fetchPage(0, false);

const refresh = async () => {
  totalFetched.value = 0;
  hasMore.value = true;
  await fetchPage(0, false);
};

watch(
  () => props.productId,
  () => refresh(),
);

// IntersectionObserver 監控底部哨兵
const sentinel = ref<HTMLElement | null>(null);

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && hasMore.value && !loadingMore.value) {
        fetchPage(totalFetched.value);
      }
    },
    { threshold: 0.1 },
  );
  watch(sentinel, (el) => { if (el) observer.observe(el); }, { immediate: true });
  onUnmounted(() => observer.disconnect());
});

const avgRating = computed(() => {
  if (!reviews.value.length) return 0;
  return reviews.value.reduce((sum, r) => sum + r.rating, 0) / reviews.value.length;
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
    <div class="mb-3 flex items-center gap-3">
      <h2 class="text-lg font-bold">買家評論</h2>
      <template v-if="reviews.length > 0">
        <div class="flex items-center gap-1">
          <Icon
            name="material-symbols:star-rounded"
            class="text-lg text-yellow-500"
          />
          <span class="font-bold">{{ avgRating.toFixed(1) }}</span>
        </div>
        <span class="text-base-content/80 text-sm"
          >（{{ reviews.length }} 則）</span
        >
      </template>
    </div>

    <!-- 防詐警語 -->
    <div class="alert mb-4 py-2 text-sm" role="alert">
      <Icon
        name="material-symbols:warning-outline-rounded"
        class="h-4 w-4 shrink-0"
        aria-hidden="true"
      />
      <span>提醒：切勿在非官方管道與陌生人私下交易或轉帳，謹防詐騙。</span>
    </div>

    <!-- 初始載入中 -->
    <div v-if="initialPending" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md" />
    </div>

    <!-- 空狀態 -->
    <div
      v-else-if="!reviews.length"
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

    <!-- Infinite scroll 哨兵 -->
    <div ref="sentinel" class="flex justify-center py-4">
      <span v-if="hasMore" class="loading loading-spinner loading-sm" />
    </div>
  </div>
</template>
