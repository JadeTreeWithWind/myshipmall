<script setup lang="ts">
const { toasts, remove } = useToast();

const alertClass: Record<string, string> = {
  success: "alert-success",
  error: "alert-error",
  info: "alert-info",
  warning: "alert-warning",
};

const iconName: Record<string, string> = {
  success: "heroicons:check-circle",
  error: "heroicons:x-circle",
  info: "heroicons:information-circle",
  warning: "heroicons:exclamation-triangle",
};
</script>

<template>
  <div class="toast toast-top toast-end z-[100] gap-2">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="alert shadow-lg"
        :class="alertClass[t.type]"
      >
        <Icon :name="iconName[t.type]" class="h-5 w-5 shrink-0" />
        <span class="text-sm">{{ t.message }}</span>
        <button class="btn btn-ghost btn-xs ml-2" @click="remove(t.id)">
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(1rem);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
