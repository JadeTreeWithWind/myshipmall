<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

useHead({ title: "聯絡訊息管理" });

const { getToken } = useAuth();

const { data: messages, refresh, pending } = await useAsyncData("admin-contacts", async () => {
  const token = await getToken();
  return $fetch("/api/admin/contacts", {
    headers: { authorization: `Bearer ${token}` },
  }) as Promise<{
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    is_read: boolean;
    created_at: string;
  }[]>;
});

async function toggleRead(id: number, current: boolean) {
  const token = await getToken();
  await $fetch(`/api/admin/contacts/${id}`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: { is_read: !current },
  });
  await refresh();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const selected = ref<(typeof messages.value)[0] | null>(null);
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10 sm:px-6">
    <h1 class="text-base-content mb-6 text-2xl font-bold">聯絡訊息</h1>

    <div v-if="pending" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="!messages?.length" class="text-base-content/50 py-20 text-center text-sm">
      目前沒有訊息
    </div>

    <div v-else class="flex gap-4">
      <!-- 列表 -->
      <ul class="border-base-300/50 flex w-72 shrink-0 flex-col divide-y overflow-hidden rounded-xl border">
        <li
          v-for="m in messages"
          :key="m.id"
          class="hover:bg-base-200 flex cursor-pointer flex-col gap-0.5 px-4 py-3 transition-colors"
          :class="{ 'bg-base-200': selected?.id === m.id }"
          @click="selected = m"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-base-content truncate text-sm font-medium">{{ m.name }}</span>
            <span
              v-if="!m.is_read"
              class="bg-primary h-2 w-2 shrink-0 rounded-full"
            />
          </div>
          <span class="text-base-content/50 truncate text-xs">{{ m.subject }}</span>
          <span class="text-base-content/40 text-xs">{{ formatDate(m.created_at) }}</span>
        </li>
      </ul>

      <!-- 詳細內容 -->
      <div class="border-base-300/50 flex-1 rounded-xl border">
        <div v-if="!selected" class="text-base-content/40 flex h-full items-center justify-center text-sm">
          選擇一則訊息查看
        </div>
        <div v-else class="flex h-full flex-col p-5">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-base-content text-base font-semibold">{{ selected.subject }}</h2>
              <p class="text-base-content/60 mt-0.5 text-sm">
                {{ selected.name }} &lt;{{ selected.email }}&gt;
              </p>
              <p class="text-base-content/40 text-xs">{{ formatDate(selected.created_at) }}</p>
            </div>
            <button
              class="btn btn-ghost btn-sm shrink-0"
              @click="toggleRead(selected.id, selected.is_read)"
            >
              {{ selected.is_read ? "標為未讀" : "標為已讀" }}
            </button>
          </div>
          <p class="text-base-content/80 flex-1 whitespace-pre-wrap text-sm leading-relaxed">
            {{ selected.message }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
