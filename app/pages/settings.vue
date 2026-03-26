<script setup lang="ts">
const { user, signIn, signOut } = useAuth();
const { isAdmin } = useAdminCheck();
const contactOpen = useState("contactOpen", () => false);

const THEMES = { LIGHT: "lofi", DARK: "halloween" };
const theme = ref(THEMES.DARK);

function applyTheme(t: string) {
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem("theme", t);
  theme.value = t;
}

function toggleTheme() {
  applyTheme(theme.value === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
}

onMounted(() => {
  const saved = localStorage.getItem("theme");
  if (saved) theme.value = saved;
});

useHead({ title: "設定" });
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-6">
    <!-- 使用者資訊卡 -->
    <div class="bg-base-200 mb-6 flex items-center gap-4 rounded-2xl p-4">
      <div
        class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full"
      >
        <img
          v-if="user?.user_metadata?.avatar_url"
          :src="user.user_metadata.avatar_url"
          :alt="user.user_metadata?.full_name ?? '使用者'"
          class="h-full w-full object-cover"
        />
        <div
          v-else-if="user"
          class="bg-primary text-primary-content flex h-full w-full items-center justify-center text-xl font-bold"
        >
          {{
            (user.user_metadata?.full_name ??
              user.email ??
              "?")[0].toUpperCase()
          }}
        </div>
        <Icon
          v-else
          name="heroicons:user-circle"
          class="text-base-content/40 h-14 w-14 text-5xl"
        />
      </div>
      <div class="min-w-0 flex-1">
        <template v-if="user">
          <p class="text-base-content truncate font-semibold">
            {{ user.user_metadata?.full_name ?? "使用者" }}
          </p>
          <p class="text-base-content/60 truncate text-sm">{{ user.email }}</p>
          <span v-if="isAdmin" class="badge badge-primary badge-sm mt-1"
            >管理員</span
          >
        </template>
        <template v-else>
          <p class="text-base-content font-semibold">尚未登入</p>
          <p class="text-base-content/60 text-sm">登入以使用完整功能</p>
        </template>
      </div>
    </div>

    <!-- 功能 -->
    <section class="mb-4">
      <p
        class="text-base-content/50 mb-1 px-1 text-xs font-semibold tracking-wider uppercase"
      >
        功能
      </p>
      <ul
        class="bg-base-200 divide-base-300/40 divide-y overflow-hidden rounded-2xl"
      >
        <li>
          <NuxtLink
            to="/import"
            class="active:bg-base-300/50 flex items-center gap-3 px-4 py-3.5 transition-colors"
          >
            <Icon
              name="heroicons:arrow-down-tray"
              class="text-primary h-5 w-5 shrink-0"
            />
            <span class="text-base-content flex-1">匯入賣場</span>
            <Icon
              name="heroicons:chevron-right"
              class="text-base-content/30 h-4 w-4"
            />
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/search"
            class="active:bg-base-300/50 flex items-center gap-3 px-4 py-3.5 transition-colors"
          >
            <Icon name="heroicons:fire" class="text-primary h-5 w-5 shrink-0" />
            <span class="text-base-content flex-1">熱門商品</span>
            <Icon
              name="heroicons:chevron-right"
              class="text-base-content/30 h-4 w-4"
            />
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- 外觀 -->
    <section class="mb-4">
      <p
        class="text-base-content/50 mb-1 px-1 text-xs font-semibold tracking-wider uppercase"
      >
        外觀
      </p>
      <ul class="bg-base-200 overflow-hidden rounded-2xl">
        <li>
          <div class="flex items-center gap-3 px-4 py-3.5">
            <Icon
              name="heroicons:paint-brush"
              class="text-primary h-5 w-5 shrink-0"
            />
            <span class="text-base-content flex-1">深色模式</span>
            <input
              type="checkbox"
              class="toggle toggle-primary"
              :checked="theme === 'halloween'"
              @change="toggleTheme"
            />
          </div>
        </li>
      </ul>
    </section>

    <!-- 管理員 -->
    <section v-if="isAdmin" class="mb-4">
      <p
        class="text-base-content/50 mb-1 px-1 text-xs font-semibold tracking-wider uppercase"
      >
        管理員
      </p>
      <ul class="bg-base-200 overflow-hidden rounded-2xl">
        <li>
          <NuxtLink
            to="/admin/messages"
            class="active:bg-base-300/50 flex items-center gap-3 px-4 py-3.5 transition-colors"
          >
            <Icon
              name="material-symbols:stacked-email-outline"
              class="text-primary h-5 w-5 shrink-0"
            />
            <span class="text-base-content flex-1">聯絡訊息</span>
            <Icon
              name="heroicons:chevron-right"
              class="text-base-content/30 h-4 w-4"
            />
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- 關於 -->
    <section class="mb-4">
      <p
        class="text-base-content/50 mb-1 px-1 text-xs font-semibold tracking-wider uppercase"
      >
        關於
      </p>
      <ul
        class="bg-base-200 divide-base-300/40 divide-y overflow-hidden rounded-2xl"
      >
        <li>
          <NuxtLink
            to="/about"
            class="active:bg-base-300/50 flex items-center gap-3 px-4 py-3.5 transition-colors"
          >
            <Icon
              name="material-symbols:info-outline-rounded"
              class="text-primary h-5 w-5 shrink-0"
            />
            <span class="text-base-content flex-1">關於商城</span>
            <Icon
              name="heroicons:chevron-right"
              class="text-base-content/30 h-4 w-4"
            />
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/terms"
            class="active:bg-base-300/50 flex items-center gap-3 px-4 py-3.5 transition-colors"
          >
            <Icon
              name="material-symbols:docs-outline"
              class="text-primary h-5 w-5 shrink-0"
            />
            <span class="text-base-content flex-1">服務條款</span>
            <Icon
              name="heroicons:chevron-right"
              class="text-base-content/30 h-4 w-4"
            />
          </NuxtLink>
        </li>
        <li>
          <button
            class="active:bg-base-300/50 flex w-full items-center gap-3 px-4 py-3.5 transition-colors"
            @click="contactOpen = true"
          >
            <Icon
              name="material-symbols:chat-outline-rounded"
              class="text-primary h-5 w-5 shrink-0"
            />
            <span class="text-base-content flex-1 text-left">聯絡我</span>
            <Icon
              name="heroicons:chevron-right"
              class="text-base-content/30 h-4 w-4"
            />
          </button>
        </li>
      </ul>
    </section>

    <!-- 帳號 -->
    <section class="mb-8">
      <p
        class="text-base-content/50 mb-1 px-1 text-xs font-semibold tracking-wider uppercase"
      >
        帳號
      </p>
      <ul class="bg-base-200 overflow-hidden rounded-2xl">
        <li v-if="user">
          <button
            class="active:bg-base-300/50 text-error flex w-full items-center gap-3 px-4 py-3.5 transition-colors"
            @click="signOut"
          >
            <Icon
              name="material-symbols:mobile-arrow-right-outline-rounded"
              class="h-5 w-5 shrink-0"
            />
            <span class="flex-1 text-left">登出</span>
          </button>
        </li>
        <li v-else>
          <button
            class="active:bg-base-300/50 flex w-full items-center gap-3 px-4 py-3.5 transition-colors"
            @click="signIn"
          >
            <Icon
              name="material-symbols:account-circle-outline"
              class="text-primary h-5 w-5 shrink-0"
            />
            <span class="text-base-content flex-1 text-left">登入</span>
            <Icon
              name="heroicons:chevron-right"
              class="text-base-content/30 h-4 w-4"
            />
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
