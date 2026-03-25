<script setup lang="ts">
definePageMeta({
  middleware: "admin",
  ssr: false,
});

useHead({ title: "聯絡訊息管理" });

const { getToken } = useAuth();

type ContactSubmission = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const {
  data: messages,
  refresh,
  pending,
} = await useAsyncData<ContactSubmission[]>(
  "admin-contacts",
  async () => {
    const token = await getToken();
    return $fetch("/api/admin/contacts", {
      headers: { authorization: `Bearer ${token}` },
    });
  },
  { server: false, default: () => [] },
);

const selected = ref<ContactSubmission | null>(null);
const refreshing = ref(false);
const markingAll = ref(false);
const subjectFilter = ref("");

const filteredMessages = computed(() => {
  const q = subjectFilter.value.trim().toLowerCase();
  if (!q) return messages.value ?? [];
  return (messages.value ?? []).filter(
    (m) =>
      m.subject.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
  );
});

async function selectMessage(m: ContactSubmission) {
  selected.value = m;
  if (!m.is_read) {
    await markRead(m.id, true);
  }
}

async function markRead(id: number, is_read: boolean) {
  const token = await getToken();
  await $fetch(`/api/admin/contacts/${id}`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: { is_read },
  });
  const target = messages.value?.find((m) => m.id === id);
  if (target) target.is_read = is_read;
  if (selected.value?.id === id)
    selected.value = { ...selected.value, is_read };
}

async function markAllRead() {
  const unread = messages.value?.filter((m) => !m.is_read) ?? [];
  if (!unread.length) return;
  markingAll.value = true;
  try {
    await Promise.all(unread.map((m) => markRead(m.id, true)));
  } finally {
    markingAll.value = false;
  }
}

async function handleRefresh() {
  refreshing.value = true;
  await refresh();
  refreshing.value = false;
  if (selected.value) {
    selected.value =
      messages.value?.find((m) => m.id === selected.value!.id) ?? null;
  }
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

const unreadCount = computed(
  () => messages.value?.filter((m) => !m.is_read).length ?? 0,
);
</script>

<template>
  <ClientOnly>
    <template #fallback>
      <div class="flex justify-center py-32">
        <span class="loading loading-spinner loading-lg" />
      </div>
    </template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <!-- Header -->
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <h1 class="text-base-content text-xl font-bold">聯絡訊息</h1>
        <span
          v-if="unreadCount > 0"
          class="badge badge-primary badge-sm font-medium"
        >
          {{ unreadCount }} 未讀
        </span>
      </div>

      <div class="flex items-center gap-2">
        <!-- 一鍵全部已讀 -->
        <button
          v-if="unreadCount > 0"
          class="btn btn-ghost btn-sm gap-1.5"
          :disabled="markingAll"
          @click="markAllRead"
        >
          <span v-if="markingAll" class="loading loading-spinner loading-xs" />
          <Icon v-else name="heroicons:check-circle" class="h-4 w-4" />
          全部標為已讀
        </button>

        <button
          class="btn btn-ghost btn-sm gap-1.5"
          :disabled="refreshing"
          @click="handleRefresh"
        >
          <Icon
            name="heroicons:arrow-path"
            class="h-4 w-4 transition-transform"
            :class="{ 'animate-spin': refreshing }"
          />
          重新整理
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-32">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!messages?.length"
      class="border-base-300/40 flex flex-col items-center gap-3 rounded-2xl border py-32 text-center"
    >
      <Icon name="heroicons:inbox" class="text-base-content/20 h-12 w-12" />
      <p class="text-base-content/40 text-sm">目前沒有訊息</p>
    </div>

    <!-- Main layout -->
    <div
      v-else
      class="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]"
      style="height: calc(100vh - 200px)"
    >
      <!-- 左側列表 -->
      <div
        class="border-base-300 flex min-h-0 flex-col overflow-hidden rounded-2xl border"
      >
        <!-- 篩選欄 -->
        <div class="border-base-300/30 border-b px-3 py-2.5">
          <label class="input input flex items-center gap-2">
            <Icon
              name="heroicons:magnifying-glass"
              class="text-base-content/40 h-3.5 w-3.5 shrink-0"
            />
            <input
              v-model="subjectFilter"
              type="text"
              class="grow"
              placeholder="依主旨或姓名搜尋…"
            />
            <button
              v-if="subjectFilter"
              class="text-base-content/40 hover:text-base-content cursor-pointer transition-colors"
              @click="subjectFilter = ''"
            >
              <Icon name="heroicons:x-mark" class="h-3.5 w-3.5" />
            </button>
          </label>
        </div>

        <!-- 篩選結果為空 -->
        <div
          v-if="!filteredMessages.length"
          class="flex flex-1 flex-col items-center justify-center gap-2 py-8"
        >
          <Icon
            name="heroicons:magnifying-glass"
            class="text-base-content/20 h-8 w-8"
          />
          <p class="text-base-content/35 text-xs">找不到符合的訊息</p>
        </div>

        <!-- 訊息列表 -->
        <ul class="flex flex-1 flex-col overflow-y-auto">
          <li
            v-for="m in filteredMessages"
            :key="m.id"
            class="border-base-300/25 relative cursor-pointer border-b px-4 py-3.5 transition-colors last:border-b-0"
            :class="
              selected?.id === m.id ? 'bg-primary/8' : 'hover:bg-base-200/60'
            "
            @click="selectMessage(m)"
          >
            <!-- 未讀指示條 -->
            <div
              v-if="!m.is_read"
              class="bg-primary absolute top-0 left-0 h-full w-0.5 rounded-l-2xl"
            />
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <span
                    class="text-base-content truncate text-[15px] leading-5"
                    :class="m.is_read ? 'font-normal' : 'font-semibold'"
                    >{{ m.name }}</span
                  >
                </div>
                <p
                  class="mt-0.5 truncate text-sm leading-5"
                  :class="
                    m.is_read
                      ? 'text-base-content/55'
                      : 'text-base-content/80 font-medium'
                  "
                >
                  {{ m.subject }}
                </p>
                <p class="text-base-content/45 mt-1.5 text-xs">
                  {{ formatDate(m.created_at) }}
                </p>
              </div>
              <span
                v-if="!m.is_read"
                class="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              />
            </div>
          </li>
        </ul>

        <!-- 列表底部計數 -->
        <div class="border-base-300/25 border-t px-4 py-2">
          <p class="text-base-content/50 text-xs">
            {{ filteredMessages.length }} 則
            <template v-if="subjectFilter"
              >（共 {{ messages?.length }} 則）</template
            >
          </p>
        </div>
      </div>

      <!-- 右側詳細 -->
      <div
        class="border-base-300 flex min-h-0 flex-col overflow-hidden rounded-2xl border"
      >
        <!-- 未選擇 -->
        <div
          v-if="!selected"
          class="flex h-full flex-col items-center justify-center gap-3"
        >
          <Icon
            name="heroicons:chat-bubble-left-right"
            class="text-base-content/12 text-3xl"
          />
          <p class="text-base-content/50 text-xl">選擇一則訊息查看</p>
        </div>

        <!-- 詳細內容 -->
        <template v-else>
          <!-- 標題列 -->
          <div
            class="border-base-300/40 flex items-start justify-between gap-4 border-b px-6 py-4"
          >
            <div class="min-w-0 flex-1">
              <h2
                class="text-base-content truncate text-lg leading-6 font-semibold"
              >
                {{ selected.subject }}
              </h2>
              <div
                class="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5"
              >
                <span class="text-base-content/85 text-sm font-medium">{{
                  selected.name
                }}</span>
                <span class="text-base-content/40 text-sm">·</span>
                <a
                  :href="`mailto:${selected.email}`"
                  class="text-base-content/65 hover:text-primary text-sm transition-colors"
                  >{{ selected.email }}</a
                >
              </div>
              <p class="text-base-content/50 mt-1 text-xs">
                {{ formatDate(selected.created_at) }}
              </p>
            </div>
            <button
              class="btn btn-ghost btn-sm shrink-0 gap-1.5"
              @click="markRead(selected.id, !selected.is_read)"
            >
              <Icon
                :name="
                  selected.is_read
                    ? 'heroicons:envelope'
                    : 'heroicons:envelope-open'
                "
                class="h-4 w-4"
              />
              {{ selected.is_read ? "標為未讀" : "標為已讀" }}
            </button>
          </div>

          <!-- 訊息本文 -->
          <div class="flex-1 overflow-y-auto px-6 py-6">
            <p
              class="text-base-content/90 text-lg leading-[1.85] whitespace-pre-wrap"
            >
              {{ selected.message }}
            </p>
          </div>

          <!-- 底部回覆 -->
          <div
            class="border-base-300/40 flex items-center gap-3 border-t px-6 py-3.5"
          >
            <a
              :href="`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`"
              class="btn btn-primary btn-sm gap-1.5"
            >
              <Icon name="heroicons:paper-airplane" class="h-4 w-4" />
              以 Email 回覆
            </a>
            <span class="text-base-content/50 text-xs">{{
              selected.email
            }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
  </ClientOnly>
</template>
