<script setup lang="ts">
// 1. Imports
const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const { user, signIn, signOut } = useAuth();

// 2. Type Definitions (None)

// 3. Constants
const THEMES = {
  LIGHT: "corporate",
  DARK: "sunset",
};

// 4. State/Variables
const theme = ref(THEMES.LIGHT);
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
  titleTemplate: (title) => (title ? `${title} | 賣貨商城` : "賣貨商城 — 賣貨便商品瀏覽平台"),
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
      class="bg-base-100/95 border-base-300/60 sticky top-0 z-50 border-b backdrop-blur-md"
    >
      <div class="mx-auto flex h-20 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <!-- Logo -->
        <NuxtLink
          to="/"
          class="flex shrink-0 cursor-pointer items-center gap-2"
        >
          <Icon name="heroicons:shopping-bag" class="text-primary h-10 w-10" />
          <span
            class="text-base-content font-Noto text-xl font-semibold tracking-wide"
            >賣貨商城</span
          >
        </NuxtLink>

        <!-- 搜尋框（桌面） -->
        <div class="mx-4 hidden flex-1 lg:flex">
          <form class="relative w-full" @submit.prevent="handleSearch">
            <Icon
              name="heroicons:magnifying-glass"
              class="pointer-events-none absolute top-1/2 left-3 h-6 w-6 -translate-y-1/2 text-base-content/40"
            />
            <input
              v-model="searchQ"
              type="search"
              aria-label="搜尋商品名稱、商城"
              placeholder="搜尋商品名稱、商城..."
              class="input input-bordered focus:input-primary h-10 w-full rounded-lg bg-base-100 pr-3 pl-9 text-sm transition-colors"
            />
          </form>
        </div>

        <!-- 右側 -->
        <div class="ml-auto flex items-center gap-0.5">
          <!-- 主題切換 -->
          <button
            class="btn btn-ghost btn-sm btn-square"
            aria-label="切換主題"
            :title="theme === THEMES.DARK ? '切換亮色' : '切換暗色'"
            @click="toggleTheme"
          >
            <Icon
              v-if="theme === THEMES.DARK"
              name="heroicons:sun"
              class="h-10 w-10"
            />
            <Icon v-else name="heroicons:moon" class="h-10 w-10" />
          </button>

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

          <!-- 漢堡選單（手機） -->
          <div ref="menuRef" class="relative ml-1 lg:hidden">
            <button
              class="btn btn-ghost btn-sm btn-square"
              aria-label="開啟選單"
              @click="menuOpen = !menuOpen"
            >
              <Icon name="heroicons:bars-3" class="h-5 w-5" />
            </button>
            <div
              v-if="menuOpen"
              class="bg-base-100 border-base-300/60 absolute top-full right-0 z-50 mt-2 flex w-60 flex-col gap-1 rounded-xl border p-3 shadow-lg"
            >
              <!-- 手機搜尋 -->
              <form @submit.prevent="handleSearch" class="mb-1">
                <div class="relative">
                  <Icon
                    name="heroicons:magnifying-glass"
                    class="text-base-content/80 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                  />
                  <input
                    v-model="searchQ"
                    type="search"
                    aria-label="搜尋商品"
                    placeholder="搜尋商品..."
                    class="border-base-300 bg-base-200/60 focus:border-primary/60 h-9 w-full rounded-lg border pr-3 pl-9 text-sm transition-colors focus:outline-none"
                  />
                </div>
              </form>
              <NuxtLink
                to="/import"
                class="hover:bg-base-200 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
              >
                <Icon
                  name="heroicons:arrow-up-tray"
                  class="text-primary h-4 w-4"
                />
                匯入賣場
              </NuxtLink>
              <NuxtLink
                to="/about"
                class="hover:bg-base-200 text-base-content/70 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm"
              >
                <Icon name="heroicons:information-circle" class="h-4 w-4" />
                關於
              </NuxtLink>
              <div class="border-base-300/50 my-1 border-t" />
              <div
                v-if="user"
                class="text-base-content/80 truncate px-3 py-1 text-xs"
              >
                {{ user.user_metadata?.full_name ?? user.email }}
              </div>
              <button
                v-if="user"
                class="hover:bg-base-200 text-base-content/70 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm"
                @click="signOut"
              >
                <Icon
                  name="heroicons:arrow-right-on-rectangle"
                  class="h-4 w-4"
                />
                登出
              </button>
              <button
                v-else
                class="hover:bg-base-200 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium"
                @click="signIn"
              >
                <Icon name="heroicons:user" class="text-primary h-4 w-4" />
                Google 登入
              </button>
            </div>
          </div>
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
