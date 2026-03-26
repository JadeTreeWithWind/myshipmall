<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div
        v-if="showInstallBanner"
        class="border-base-300 bg-base-100 fixed right-4 bottom-20 left-4 z-[200] flex items-center justify-between gap-3 rounded-xl border p-4 shadow-lg sm:right-4 sm:bottom-4 sm:left-auto sm:max-w-sm"
      >
        <div class="flex items-center gap-3">
          <img
            src="/pwa-192x192.png"
            alt="App icon"
            class="size-10 rounded-lg"
          />
          <div>
            <p class="text-sm font-medium">安裝賣貨商城</p>
            <p class="text-base-content/60 text-xs">
              加到主畫面，享受更接近App的體驗
            </p>
          </div>
        </div>
        <div class="flex shrink-0 gap-2">
          <button class="btn btn-ghost btn-sm" @click="dismiss">稍後</button>
          <button class="btn btn-primary btn-sm" @click="install">安裝</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { showInstallBanner, install, dismiss } = usePwaInstall();
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
