<script setup lang="ts">
// 1. Imports
const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const { user, signIn, signOut } = useAuth();

// 2. Type Definitions (None)

// 3. Constants
const THEMES = {
  LIGHT: "lofi",
  DARK: "halloween",
};

// 4. State/Variables
const theme = ref(THEMES.DARK);
const searchQ = ref("");
const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

// 5. Computed Properties (None)

// 6. Functions/Methods
function applyTheme(t: string) {
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem("theme", t);
  theme.value = t;
}

function toggleTheme() {
  applyTheme(theme.value === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
}

function goBack() {
  history.state?.back ? router.back() : router.push("/");
}

function handleSearch() {
  if (!searchQ.value.trim()) return;
  router.push({ path: "/search", query: { q: searchQ.value.trim() } });
}

/**
 * 點選選單外部時關閉漢堡選單
 */
function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    menuOpen.value = false;
  }
}

// 7. Watchers
watch(
  () => route.query.q,
  (v) => {
    searchQ.value = (v as string) || "";
  },
  { immediate: true },
);

watch(
  () => route.path,
  () => {
    menuOpen.value = false;
  },
);

// 8. Lifecycle Hooks
useHead({
  titleTemplate: (title) =>
    title ? `${title} | 賣貨商城` : "賣貨商城 — 賣貨便商品瀏覽平台",
  link: [{ rel: "canonical", href: `${config.public.siteUrl}${route.path}` }],
  script: [
    {
      type: "speculationrules",
      innerHTML: JSON.stringify({
        prerender: [
          {
            source: "list",
            urls: ["/about", "/import", "/search"],
          },
        ],
      }),
    },
  ],
});

onMounted(() => {
  const saved = localStorage.getItem("theme");
  if (saved) {
    theme.value = saved;
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    theme.value = THEMES.DARK;
  }
  applyTheme(theme.value);
  document.addEventListener("mousedown", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
});
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- ── Navbar ── -->
    <nav
      class="bg-base-100 border-base-300/60 sticky top-0 z-50 backdrop-blur-xs"
    >
      <div
        class="mx-auto flex h-14 max-w-7xl items-center px-4 sm:h-20 sm:gap-3 sm:px-6"
      >
        <!-- Logo -->
        <button
          v-if="route.path !== '/'"
          class="btn btn-ghost btn-sm btn-square text-xl sm:hidden"
          aria-label="返回上一頁"
          @click="goBack"
        >
          <Icon name="heroicons:arrow-left" class="h-5 w-5" />
        </button>
        <NuxtLink
          to="/"
          :class="route.path !== '/' ? 'hidden sm:flex' : 'flex'"
          class="shrink-0 cursor-pointer items-center gap-2"
        >
          <Icon name="heroicons:shopping-bag" class="text-primary h-10 w-10" />
          <span
            class="text-base-content font-Noto font-semibold tracking-wide sm:text-xl"
            >賣貨商城</span
          >
        </NuxtLink>

        <!-- 搜尋框（桌面） -->
        <div class="mx-4 flex flex-1">
          <form class="relative w-full" @submit.prevent="handleSearch">
            <Icon
              name="heroicons:magnifying-glass"
              class="text-base-content/40 pointer-events-none absolute top-1/2 left-3 z-1 h-6 w-6 -translate-y-1/2"
            />
            <input
              v-model="searchQ"
              type="search"
              aria-label="搜尋商品名稱、商城"
              placeholder="搜尋商品名稱、商城..."
              class="input input-bordered focus:input-primary bg-base-100 h-10 w-full rounded-lg pr-3 pl-9 text-sm transition-colors"
            />
          </form>
        </div>

        <!-- 右側 -->
        <div class="flex items-center gap-0.5">
          <!-- 主題切換 -->
          <label class="swap swap-rotate">
            <!-- this hidden checkbox controls the state -->
            <input
              type="checkbox"
              aria-label="切換主題"
              :title="theme === THEMES.DARK ? '切換亮色' : '切換暗色'"
              @click="toggleTheme"
            />

            <!-- sun icon -->
            <svg
              class="swap-on h-6 w-6 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path
                d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"
              />
            </svg>

            <!-- moon icon -->
            <svg
              class="swap-off h-6 w-6 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path
                d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"
              />
            </svg>
          </label>
          <!-- 桌面導覽 -->
          <NuxtLink
            to="/about"
            class="btn btn-ghost text-base-content/70 hover:text-base-content hidden lg:flex"
            >關於</NuxtLink
          >
          <NuxtLink to="/import" class="btn btn-primary ml-1 hidden lg:flex"
            >匯入賣場</NuxtLink
          >

          <!-- 登入（桌面） -->
          <template v-if="user">
            <div class="dropdown dropdown-end ml-1 hidden lg:block">
              <label
                tabindex="0"
                class="btn btn-ghost btn-sm btn-circle avatar cursor-pointer"
              >
                <div class="w-7 overflow-hidden rounded-full">
                  <img
                    v-if="user.user_metadata?.avatar_url"
                    :src="user.user_metadata.avatar_url"
                    :alt="user.user_metadata?.full_name ?? '使用者'"
                  />
                  <div
                    v-else
                    class="bg-primary text-primary-content flex h-full w-full items-center justify-center text-xs font-bold"
                  >
                    {{
                      (user.user_metadata?.full_name ??
                        user.email ??
                        "?")[0].toUpperCase()
                    }}
                  </div>
                </div>
              </label>
              <ul
                tabindex="0"
                class="menu dropdown-content bg-base-100 border-base-300/50 z-50 mt-2 w-52 rounded-xl border p-2 shadow-lg"
              >
                <li
                  class="menu-title text-base-content/90 truncate px-3 py-2 text-xs"
                >
                  {{ user.user_metadata?.full_name ?? user.email }}
                </li>
                <li>
                  <button class="rounded-lg text-sm" @click="signOut">
                    登出
                  </button>
                </li>
              </ul>
            </div>
          </template>
          <template v-else>
            <button
              class="btn btn-ghost btn-sm text-base-content/70 ml-1 hidden lg:flex"
              @click="signIn"
            >
              登入
            </button>
          </template>
        </div>
      </div>
    </nav>

    <!-- ── 頁面內容 ── -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- ── Toast 通知 ── -->
    <ToastContainer />

    <!-- ── Footer ── -->
    <footer class="border-base-300/60 bg-base-100 mt-16 border-t">
      <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div
          class="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"
        >
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center gap-2">
              <Icon
                name="heroicons:shopping-bag"
                class="text-primary h-4 w-4"
              />
              <span class="font-serif text-sm font-semibold">賣貨商城</span>
            </div>
            <p class="text-base-content/80 max-w-xs text-xs leading-relaxed">
              非官方賣貨便商品瀏覽平台，所有購買行為均在賣貨便完成
            </p>
          </div>
          <div class="flex flex-col gap-2 text-sm">
            <NuxtLink
              to="/about"
              class="text-base-content/90 hover:text-primary cursor-pointer transition-colors"
              >關於</NuxtLink
            >
            <NuxtLink
              to="/import"
              class="text-base-content/90 hover:text-primary cursor-pointer transition-colors"
              >匯入賣場</NuxtLink
            >
          </div>
        </div>
        <div class="border-base-300/40 mt-8 border-t pt-6">
          <p class="text-base-content/70 text-center text-xs">
            © {{ new Date().getFullYear() }} 賣貨商城
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
