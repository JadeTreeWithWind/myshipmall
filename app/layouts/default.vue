<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { user, signIn, signOut } = useAuth()

// ── 主題切換 ───────────────────────────────────────────────────
const theme = ref('light')

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved) {
    theme.value = saved
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme.value = 'dark'
  }
  applyTheme(theme.value)
})

function applyTheme(t: string) {
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem('theme', t)
  theme.value = t
}

function toggleTheme() {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

// ── 搜尋框 ────────────────────────────────────────────────────
const searchQ = ref('')

watch(
  () => route.query.q,
  (v) => { searchQ.value = (v as string) || '' },
  { immediate: true }
)

function handleSearch() {
  if (!searchQ.value.trim()) return
  router.push({ path: '/search', query: { q: searchQ.value.trim() } })
}

// ── 漢堡選單 ─────────────────────────────────────────────────
const menuOpen = ref(false)
watch(() => route.path, () => { menuOpen.value = false })
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- ── Navbar ── -->
    <nav class="navbar bg-base-100 shadow-sm sticky top-0 z-50">
      <!-- Logo -->
      <div class="navbar-start">
        <NuxtLink to="/" class="btn btn-ghost text-xl font-bold gap-1">
          <span class="text-primary">🛒</span>
          <span>MyShipBang</span>
        </NuxtLink>
      </div>

      <!-- 搜尋框（桌面） -->
      <div class="navbar-center hidden lg:flex">
        <form class="flex gap-2" @submit.prevent="handleSearch">
          <input
            v-model="searchQ"
            type="search"
            placeholder="搜尋商品..."
            class="input input-bordered w-72"
          />
          <button type="submit" class="btn btn-primary btn-square">
            <Icon name="heroicons:magnifying-glass" class="w-5 h-5" />
          </button>
        </form>
      </div>

      <!-- 右側按鈕 -->
      <div class="navbar-end gap-1">
        <!-- 主題切換 -->
        <button class="btn btn-ghost btn-square" :title="theme === 'dark' ? '切換亮色' : '切換暗色'" @click="toggleTheme">
          <Icon v-if="theme === 'dark'" name="heroicons:sun" class="w-5 h-5" />
          <Icon v-else name="heroicons:moon" class="w-5 h-5" />
        </button>

        <!-- 匯入連結（桌面） -->
        <NuxtLink to="/import" class="btn btn-ghost hidden lg:flex">匯入賣場</NuxtLink>

        <!-- 登入狀態（桌面） -->
        <template v-if="user">
          <div class="dropdown dropdown-end hidden lg:block">
            <label tabindex="0" class="btn btn-ghost btn-circle avatar">
              <div class="w-8 rounded-full">
                <img
                  v-if="user.user_metadata?.avatar_url"
                  :src="user.user_metadata.avatar_url"
                  :alt="user.user_metadata?.full_name ?? '使用者'"
                />
                <div v-else class="bg-primary text-primary-content flex h-full w-full items-center justify-center text-sm font-bold">
                  {{ (user.user_metadata?.full_name ?? user.email ?? '?')[0].toUpperCase() }}
                </div>
              </div>
            </label>
            <ul tabindex="0" class="menu dropdown-content bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow">
              <li class="menu-title truncate px-4 py-2 text-xs opacity-60">
                {{ user.user_metadata?.full_name ?? user.email }}
              </li>
              <li><button @click="signOut">登出</button></li>
            </ul>
          </div>
        </template>
        <template v-else>
          <button class="btn btn-ghost hidden lg:flex" @click="signIn">登入</button>
        </template>

        <!-- 漢堡選單（手機） -->
        <div class="relative lg:hidden">
          <button class="btn btn-ghost btn-square" @click="menuOpen = !menuOpen">
            <Icon name="heroicons:bars-3" class="w-6 h-6" />
          </button>
          <ul
            v-if="menuOpen"
            class="absolute right-0 top-full mt-1 w-56 bg-base-100 rounded-box shadow-lg p-2 z-50 flex flex-col gap-1"
          >
            <li>
              <form @submit.prevent="handleSearch">
                <input
                  v-model="searchQ"
                  type="search"
                  placeholder="搜尋商品..."
                  class="input input-bordered input-sm w-full"
                />
              </form>
            </li>
            <li><NuxtLink to="/import" class="block px-3 py-2 rounded-lg hover:bg-base-200">匯入賣場</NuxtLink></li>
            <li><NuxtLink to="/about" class="block px-3 py-2 rounded-lg hover:bg-base-200">關於</NuxtLink></li>
            <li v-if="user">
              <div class="px-3 py-2 text-xs opacity-60 truncate">{{ user.user_metadata?.full_name ?? user.email }}</div>
            </li>
            <li>
              <button v-if="user" class="block w-full text-left px-3 py-2 rounded-lg hover:bg-base-200" @click="signOut">登出</button>
              <button v-else class="block w-full text-left px-3 py-2 rounded-lg hover:bg-base-200" @click="signIn">登入</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- ── 頁面內容 ── -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- ── Footer ── -->
    <footer class="footer footer-center bg-base-200 text-base-content p-6 mt-10">
      <div class="flex flex-col items-center gap-1">
        <p class="font-semibold">MyShipBang</p>
        <p class="text-sm opacity-60">非官方賣貨便商品瀏覽平台，所有購買行為均在賣貨便完成</p>
        <div class="flex gap-4 text-sm opacity-60">
          <NuxtLink to="/about" class="link link-hover">關於</NuxtLink>
          <NuxtLink to="/import" class="link link-hover">匯入賣場</NuxtLink>
        </div>
        <p class="text-xs opacity-40">© {{ new Date().getFullYear() }} MyShipBang</p>
      </div>
    </footer>
  </div>
</template>
