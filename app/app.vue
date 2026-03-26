<script setup lang="ts">
const { init } = useAuth();
const router = useRouter();
const slideDir = ref<"left" | "right">("left");

// 保存 unregister，避免重複注冊造成問題
const unregisterGuard = router.beforeEach((to, from) => {
  const toDepth = to.path.split("/").filter(Boolean).length;
  const fromDepth = from.path.split("/").filter(Boolean).length;
  slideDir.value = toDepth >= fromDepth ? "left" : "right";
});

const pageTransition = computed(() => ({
  name: `slide-${slideDir.value}`,
  mode: "out-in" as const,
}));

let unsubscribeAuth: (() => void) | undefined;

onMounted(async () => {
  unsubscribeAuth = await init();
});

onBeforeUnmount(() => {
  unregisterGuard();
  unsubscribeAuth?.();
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage :transition="pageTransition" />
  </NuxtLayout>
</template>

<style>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 前進：新頁從右滑入，舊頁往左淡出 */
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(32px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-32px);
}

/* 後退：新頁從左滑入，舊頁往右淡出 */
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-32px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(32px);
}
</style>
