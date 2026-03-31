<script setup lang="ts">
// 1. 外部引用
import { BOTTOM_NAV_ITEMS, CONTACT_SUBJECTS } from "~/constants/text";

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const { user, signIn, signOut } = useAuth();
const { isAdmin, checkAdmin } = useAdminCheck();

// 2. 類型定義（無）

// 3. 常量宣告
const THEMES = {
  LIGHT: "lofi",
  DARK: "halloween",
};

// 4. 響應式狀態/變數
const theme = ref(THEMES.DARK);
const searchQ = ref("");
const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
const contactOpen = useState("contactOpen", () => false);
const contactForm = useState("contactForm", () => ({
  name: "",
  email: "",
  subject: "",
  message: "",
}));
const contactSending = ref(false);
const contactSent = ref(false);
const navVisible = ref(true);
let lastScrollY = 0;

const bottomNavItems = BOTTOM_NAV_ITEMS;

// 5. 計算屬性（無）

// 6. 核心邏輯與函數
function closeDropdown() {
  (document.activeElement as HTMLElement)?.blur();
}
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

async function submitContact() {
  if (
    !contactForm.value.name.trim() ||
    !contactForm.value.email.trim() ||
    !contactForm.value.message.trim()
  )
    return;
  contactSending.value = true;
  try {
    await $fetch("/api/contact", {
      method: "POST",
      body: { ...contactForm.value },
    });
    contactSent.value = true;
    contactForm.value.name = "";
    contactForm.value.email = "";
    contactForm.value.message = "";
  } catch {
    useToast().error("訊息送出失敗，請稍後再試");
  } finally {
    contactSending.value = false;
  }
}

function openContact() {
  contactSent.value = false;
  contactOpen.value = true;
}

/**
 * 點選選單外部時關閉漢堡選單
 */
function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    menuOpen.value = false;
  }
}

const SCROLL_UP_THRESHOLD = 60;
let scrollUpAccum = 0;
let scrollRafId: number | null = null;

// 用 rAF 節流，避免高頻 scroll 事件過度更新響應式狀態
function handleScroll() {
  if (scrollRafId !== null) return;
  scrollRafId = requestAnimationFrame(() => {
    scrollRafId = null;
    const currentY = window.scrollY;
    const delta = lastScrollY - currentY;

    if (currentY < 10) {
      navVisible.value = true;
      scrollUpAccum = 0;
    } else if (delta > 0) {
      scrollUpAccum += delta;
      if (scrollUpAccum >= SCROLL_UP_THRESHOLD) {
        navVisible.value = true;
      }
    } else {
      scrollUpAccum = 0;
      navVisible.value = false;
    }

    lastScrollY = currentY;
  });
}

// 7. 偵聽器
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

watch(
  user,
  (u) => {
    if (u) checkAdmin();
    else isAdmin.value = false;
  },
  { immediate: true },
);

// 8. 生命週期鉤子
const { initInstallPrompt } = usePwaInstall();

useHead({
  titleTemplate: (title) =>
    title ? `${title} | 賣貨便商城` : "賣貨便商城 — 賣貨便商品瀏覽平台",
  link: [{ rel: "canonical", href: `${config.public.siteUrl}${route.path}` }],
});

onMounted(() => {
  initInstallPrompt();
  const saved = localStorage.getItem("theme");
  if (saved) {
    theme.value = saved;
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    theme.value = THEMES.DARK;
  }
  applyTheme(theme.value);
  document.addEventListener("mousedown", handleClickOutside);
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
  window.removeEventListener("scroll", handleScroll);
  if (scrollRafId !== null) cancelAnimationFrame(scrollRafId);
});
</script>

<template>
  <div
    class="relative mb-8 flex min-h-screen flex-col overflow-x-hidden sm:mb-0"
  >
    <!-- ── Navbar ── -->
    <nav
      class="bg-base-100 border-base-300/60 fixed top-0 z-50 w-full backdrop-blur-xs transition-transform duration-300"
      :class="
        navVisible ? 'translate-y-0' : '-translate-y-full sm:translate-y-0'
      "
    >
      <div
        class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-20 sm:gap-3 sm:px-6"
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
          <Icon
            name="icon-park-outline:shopping-bag"
            class="text-primary text-[20px]"
          />
          <span
            class="text-base-content font-Noto font-semibold tracking-wide sm:text-xl"
            >賣貨便商城</span
          >
        </NuxtLink>

        <!-- 搜尋框（桌面） -->
        <div
          class="mx-4 flex flex-1"
          :class="route.path === '/' ? 'hidden' : 'flex'"
        >
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
              class="input input-bordered input-primary bg-base-100 h-10 w-full rounded-lg pr-3 pl-9 text-sm transition-colors"
            />
          </form>
        </div>

        <!-- 右側 -->
        <div class="flex items-center gap-0.5">
          <!-- 主題切換 -->
          <div class="hidden sm:flex">
            <label
              class="swap btn btn-circle btn-ghost btn-sm swap-rotate cursor-pointer"
            >
              <!-- this hidden checkbox controls the state -->
              <input
                type="checkbox"
                aria-label="切換主題"
                :title="theme === THEMES.DARK ? '切換亮色' : '切換暗色'"
                @click="toggleTheme"
              />

              <!-- sun icon -->
              <svg
                class="swap-on h-5 w-5 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"
                />
              </svg>

              <!-- moon icon -->
              <svg
                class="swap-off h-5 w-5 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path
                  d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"
                />
              </svg>
            </label>
          </div>

          <!-- 桌面導覽 -->

          <NuxtLink to="/import" class="btn btn-primary ml-1 hidden sm:flex"
            >匯入賣場</NuxtLink
          >

          <!-- 漢堡選單 -->
          <div class="dropdown dropdown-end ml-1 hidden lg:block">
            <label
              tabindex="0"
              class="btn btn-ghost btn-sm btn-circle avatar cursor-pointer"
            >
              <div
                class="flex w-7 items-center justify-center overflow-hidden rounded-full"
              >
                <div v-if="user">
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
                <Icon
                  v-else
                  name="iconamoon:menu-burger-horizontal-bold"
                  class="h-5 w-5"
                />
              </div>
            </label>
            <ul
              tabindex="0"
              class="menu dropdown-content bg-base-100 border-base-300/50 z-50 mt-2 w-52 rounded-xl border p-2 shadow-lg"
              @click="closeDropdown"
            >
              <li
                v-if="user"
                class="menu-title text-base-content/90 truncate px-3 py-2"
              >
                {{ user.user_metadata?.full_name ?? user.email }}
              </li>
              <li v-if="isAdmin">
                <NuxtLink to="/admin/messages" class="rounded-lg text-base">
                  <Icon
                    name="material-symbols:stacked-email-outline"
                    class="text-base-content/90 text-xl"
                  />
                  聯絡訊息
                </NuxtLink>
              </li>

              <li>
                <NuxtLink to="/pwa" class="rounded-lg text-base">
                  <Icon
                    name="heroicons:device-phone-mobile"
                    class="text-base-content/90 text-xl"
                  />
                  安裝 App
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/about" class="rounded-lg text-base">
                  <Icon
                    name="material-symbols:info-outline-rounded"
                    class="text-base-content/90 text-xl"
                  />
                  關於商城
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/terms" class="rounded-lg text-base">
                  <Icon
                    name="material-symbols:docs-outline"
                    class="text-base-content/90 text-xl"
                  />
                  服務條款
                </NuxtLink>
              </li>
              <li>
                <button class="rounded-lg text-base" @click="openContact">
                  <Icon
                    name="material-symbols:chat-outline-rounded"
                    class="text-base-content/90 text-xl"
                  />
                  聯絡我
                </button>
              </li>
              <li v-if="user">
                <button class="rounded-lg text-base" @click="signOut">
                  <Icon
                    name="material-symbols:mobile-arrow-right-outline-rounded"
                    class="text-base-content/90 text-xl"
                  />
                  登出
                </button>
              </li>
              <li v-else>
                <button class="rounded-lg text-base" @click="signIn">
                  <Icon
                    name="material-symbols:account-circle-outline"
                    class="text-base-content/90 text-xl"
                  />
                  登入
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>

    <!-- ── 手機底部導航列 ── -->
    <nav
      style="view-transition-name: bottom-nav"
      class="border-base-200 bg-base-200 fixed bottom-0 left-0 z-99 flex w-full items-center justify-around border-t pb-2 shadow-xl sm:hidden"
    >
      <NuxtLink
        v-for="item in bottomNavItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-lg font-semibold transition-colors"
        :class="
          route.path === item.path ? 'text-primary' : 'text-base-content/60'
        "
      >
        <Icon :name="item.icon" />
        <span class="text-xs">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- ── 頁面內容 ── -->
    <main class="mt-14 flex-1 pb-16 sm:pb-0">
      <slot />
    </main>

    <!-- ── Toast 通知 ── -->
    <ToastContainer />

    <!-- ── PWA 安裝提示 ── -->
    <div class="sm:hidden">
      <PwaInstallBanner />
    </div>

    <!-- ── 聯絡我浮動視窗 ── -->
    <Teleport to="body">
      <div
        v-if="contactOpen"
        class="fixed inset-0 z-99 cursor-pointer bg-black/10"
        @click="contactOpen = false"
      />
      <Transition name="contact-panel">
        <div
          v-if="contactOpen"
          class="bg-base-100 border-primary/50 fixed right-0 bottom-0 z-100 w-full rounded-t-2xl border border-b-0 p-2 shadow-2xl sm:right-4 sm:bottom-4 sm:max-w-96 sm:rounded-b-2xl sm:border-b"
        >
          <div
            class="border-base-300/40 flex items-center justify-between border-b px-4 py-3"
          >
            <div class="flex items-center gap-2">
              <Icon
                name="heroicons:chat-bubble-left-ellipsis"
                class="text-primary h-4 w-4 text-lg"
              />
              <h2 class="text-base-content text-lg font-semibold">聯絡我</h2>
            </div>
            <button
              class="btn btn-ghost btn-circle"
              aria-label="關閉"
              @click="contactOpen = false"
            >
              <Icon name="heroicons:x-mark" class="text-xl" />
            </button>
          </div>

          <div class="p-4">
            <template v-if="!contactSent">
              <form
                class="flex flex-col gap-2.5"
                @submit.prevent="submitContact"
              >
                <input
                  v-model="contactForm.name"
                  type="text"
                  placeholder="你的名稱"
                  required
                  class="input input-lg input-bordered w-full"
                />
                <input
                  v-model="contactForm.email"
                  type="email"
                  placeholder="電子郵件"
                  required
                  class="input input-lg input-bordered w-full"
                />
                <select
                  v-model="contactForm.subject"
                  required
                  class="select select-lg select-bordered w-full cursor-pointer"
                >
                  <option value="" disabled>選擇主旨</option>
                  <option
                    v-for="subject in CONTACT_SUBJECTS"
                    :key="subject"
                    :value="subject"
                  >
                    {{ subject }}
                  </option>
                </select>
                <textarea
                  v-model="contactForm.message"
                  placeholder="留言內容..."
                  required
                  rows="5"
                  class="textarea textarea-lg textarea-bordered w-full resize-none"
                />
                <button
                  type="submit"
                  class="btn btn-primary w-full"
                  :disabled="contactSending"
                >
                  <span v-if="contactSending" class="loading loading-spinner" />
                  {{ contactSending ? "傳送中..." : "送出" }}
                </button>
              </form>
            </template>

            <template v-else>
              <div class="flex flex-col items-center gap-4 py-4 text-center">
                <Icon
                  name="heroicons:check-circle"
                  class="text-success text-5xl"
                />
                <p class="text-base-content text-lg font-medium">
                  訊息已送出，謝謝！
                </p>
                <button class="btn btn-primary" @click="contactOpen = false">
                  關閉
                </button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Footer ── -->
    <footer class="border-base-300/60 bg-base-100 border-t sm:mt-16">
      <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div
          class="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"
        >
          <div class="flex flex-1 flex-col gap-1.5">
            <div class="flex items-center gap-2">
              <Icon
                name="heroicons:shopping-bag"
                class="text-primary h-4 w-4"
              />
              <span class="text-sm font-semibold">賣貨便商城</span>
            </div>
            <p class="text-base-content/80 max-w-xs text-xs leading-relaxed">
              本站為獨立開發者建立的非官方展示平台，與統一超商、賣貨便官方無任何隸屬或合作關係。本站不販售商品、不經手金流，所有購買行為均導向賣貨便官方頁面完成。商品資訊由第三方匯入，本站不保證其準確性，實際內容請以賣貨便為準。
            </p>
          </div>
          <div class="flex w-full flex-1 justify-between gap-4">
            <div class="flex w-1/2 flex-col gap-2 text-sm sm:w-auto">
              <div class="title text-base-content/90 text-lg font-semibold">
                功能
              </div>
              <NuxtLink
                to="/import"
                class="text-base-content/90 hover:text-primary cursor-pointer transition-colors"
                >* 匯入賣場</NuxtLink
              >
              <button
                type="button"
                class="text-base-content/90 hover:text-primary cursor-pointer text-left transition-colors"
                @click="contactOpen = true"
              >
                * 聯絡我
              </button>
            </div>
            <div class="flex w-1/2 flex-col gap-2 text-sm sm:w-auto">
              <div class="title text-base-content/90 text-lg font-semibold">
                關於
              </div>
              <NuxtLink
                to="/about"
                class="text-base-content/90 hover:text-primary cursor-pointer transition-colors"
                >* 關於商城</NuxtLink
              >
              <NuxtLink
                to="/terms"
                class="text-base-content/90 hover:text-primary cursor-pointer transition-colors"
                >* 條款與免責</NuxtLink
              >
            </div>
          </div>
        </div>
        <div class="border-base-300/40 mt-8 border-t pt-6">
          <p class="text-base-content/70 text-center text-xs">
            © {{ new Date().getFullYear() }} All rights reserved.
          </p>
          <p class="text-base-content/70 mt-2 text-center text-xs">
            Made with ♥ by TJ
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.contact-panel-enter-active,
.contact-panel-leave-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}
.contact-panel-enter-from,
.contact-panel-leave-to {
  transform: translateY(100%);
}
</style>
