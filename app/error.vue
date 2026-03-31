<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number;
    message?: string;
  };
}>();

const router = useRouter();

const title = computed(() => {
  if (props.error.statusCode === 404) return "找不到頁面";
  if (props.error.statusCode === 410) return "資料已過期";
  return "發生錯誤";
});

const desc = computed(() => {
  if (props.error.statusCode === 404) return "您所尋找的頁面不存在或已被移除。";
  if (props.error.statusCode === 410) return "此資料已過期，請重新操作。";
  return props.error.message || "發生未知錯誤，請稍後再試。";
});

useHead({
  title: `${title.value} — 賣貨便商城`,
});
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <div
      class="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center"
    >
      <p class="text-primary/30 mb-4 text-8xl font-black">
        {{ error.statusCode }}
      </p>
      <h1 class="mb-3 text-2xl font-bold">{{ title }}</h1>
      <p class="text-base-content/60 mb-8 max-w-sm">{{ desc }}</p>
      <div class="flex gap-3">
        <button class="btn btn-ghost" @click="router.back()">
          <Icon name="heroicons:arrow-left" class="h-4 w-4" />
          返回上頁
        </button>
        <NuxtLink to="/" class="btn btn-primary">回到首頁</NuxtLink>
      </div>
    </div>
  </div>
</template>
