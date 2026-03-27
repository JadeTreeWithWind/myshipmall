<script setup lang="ts">
const pendingUrl = ref<string | null>(null);
const dialogRef = ref<HTMLDialogElement | null>(null);

function handleClick(e: MouseEvent) {
  const anchor = (e.target as Element).closest("a");
  if (!anchor) return;

  const href = anchor.getAttribute("href");
  if (!href) return;

  // 站內連結直接放行
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin === window.location.origin) return;
  } catch {
    return;
  }

  e.preventDefault();
  pendingUrl.value = href;
  dialogRef.value?.showModal();
}

function confirm() {
  if (pendingUrl.value) {
    window.open(pendingUrl.value, "_blank", "noopener,noreferrer");
  }
  close();
}

function close() {
  dialogRef.value?.close();
  pendingUrl.value = null;
}
</script>

<template>
  <div @click.capture="handleClick">
    <slot />
  </div>

  <dialog ref="dialogRef" class="modal">
    <div class="modal-box border-primary/50 w-full max-w-lg border">
      <div class="flex items-start gap-3">
        <div
          class="bg-warning/15 text-warning flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
        >
          🔗
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-base font-semibold sm:text-lg">離開前確認一下</h3>
          <p
            class="text-base-content/70 mt-1 text-sm leading-relaxed sm:text-base"
          >
            你即將前往一個外部網站，請確認該網址安全：
          </p>
        </div>
      </div>

      <div class="bg-base-200 mt-4 rounded-xl px-3 py-2.5">
        <p class="text-base-content/80 mb-0.5 text-xs sm:text-sm">目標網址</p>
        <p class="font-mono text-xs leading-relaxed break-all sm:text-sm">
          {{ pendingUrl }}
        </p>
      </div>

      <p class="text-base-content/80 mt-3 text-xs sm:text-sm">
        ⚠️ 外部網站不受本站控制，請小心釣魚網站，留意個資安全。
      </p>

      <div class="modal-action mt-4 gap-2">
        <button class="btn btn-ghost btn-sm sm:btn-md" @click="close">
          留在本站
        </button>
        <button class="btn btn-primary btn-sm sm:btn-md" @click="confirm">
          繼續前往
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @submit.prevent="close">
      <button>close</button>
    </form>
  </dialog>
</template>
