<script setup lang="ts">
// 1. Constants
const config = useRuntimeConfig();
const DESC =
  "不用去 Store 下載，直接把賣貨商城釘在手機，開起來跟一般 App 沒兩樣，還不佔什麼空間。";

const FEATURES = [
  {
    icon: "heroicons:bolt",
    title: "開好開滿",
    desc: "從主畫面直接點開，比每次重開瀏覽器找網址快多了。",
  },
  {
    icon: "heroicons:device-phone-mobile",
    title: "沉浸式瀏覽",
    desc: "沒有網址列佔版面，整個螢幕都是商品，看起來舒服很多。",
  },
  {
    icon: "heroicons:arrow-down-tray",
    title: "安裝即最新版",
    desc: "不會有「要不要更新」的提示，每次開都是最新版本。",
  },
  {
    icon: "heroicons:inbox-arrow-down",
    title: "幾乎不佔空間",
    desc: "沒有幾 MB 的安裝檔，就一個小小的捷徑，手機空間不哭泣。",
  },
];

const GUIDES = [
  {
    id: "ios",
    icon: "heroicons:device-phone-mobile",
    label: "iOS",
    steps: [
      "用 Safari 打開這個網站",
      "點一下畫面底部中間那個「分享」圖示",
      "選單往下滑，找到「加入主畫面」然後點它",
      "名稱保持預設就好，右上角點「新增」完成！",
    ],
    note: "Apple 限制iOS 只有 Safari 能安裝 PWA，其他瀏覽器的分享選單裡不會出現這個選項。",
  },
  {
    id: "android",
    icon: "heroicons:device-phone-mobile",
    label: "Android",
    steps: [
      "用 Chrome 打開這個網站",
      "點右上角三個點的選單",
      "找「新增至主畫面」或「安裝應用程式」，點下去",
      "確認一下名稱，按「安裝」就搞定了",
    ],
    note: "有些 Android 手機會主動跳出安裝提示，直接點那個也可以。",
  },
];

// 2. State
const { showInstallBanner, install, dismiss } = usePwaInstall();
const isInstalled = ref(false);
const isInstalling = ref(false);
const activeTab = ref<"ios" | "android">("android");

// 3. Computed
const canInstall = computed(
  () => showInstallBanner.value && !isInstalled.value,
);

// 4. Functions
function detectPlatform(): "ios" | "android" {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "android";
}

async function handleInstall() {
  isInstalling.value = true;
  await install();
  isInstalling.value = false;
  isInstalled.value = window.matchMedia("(display-mode: standalone)").matches;
}

// 5. Lifecycle
onMounted(() => {
  isInstalled.value = window.matchMedia("(display-mode: standalone)").matches;
  activeTab.value = detectPlatform();
});

useHead({
  title: "安裝 App",
  link: [{ rel: "canonical", href: `${config.public.siteUrl}/pwa` }],
  meta: [
    { name: "description", content: DESC },
    { property: "og:title", content: "安裝 App | 賣貨商城" },
    { property: "og:description", content: DESC },
  ],
});
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-12 sm:px-6">
    <!-- Hero -->
    <div class="mb-10 text-center">
      <div
        class="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
      >
        <Icon
          name="heroicons:device-phone-mobile"
          class="text-primary text-3xl"
        />
      </div>
      <h1 class="text-base-content mb-3 text-3xl font-semibold">
        加到主畫面吧！
      </h1>
      <p class="text-base-content/70 text-base leading-relaxed">
        {{ DESC }}
      </p>
    </div>

    <!-- 已安裝提示 -->
    <div
      v-if="isInstalled"
      class="bg-success/10 border-success/30 mb-8 flex items-center gap-3 rounded-2xl border p-5"
    >
      <Icon
        name="heroicons:check-circle"
        class="text-success shrink-0 text-2xl"
      />
      <div>
        <p class="text-success font-semibold">安裝成功！</p>
        <p class="text-base-content/60 text-sm">
          你現在就是在用 App 模式瀏覽，下次直接從主畫面點開就行。
        </p>
      </div>
    </div>

    <!-- 一鍵安裝（Android/Chrome/Edge 支援） -->
    <div v-if="canInstall" class="mb-8">
      <div
        class="border-base-300 bg-base-100 flex items-center justify-between gap-4 rounded-2xl border p-5 shadow-sm"
      >
        <div class="flex items-center gap-3">
          <img
            src="/pwa-192x192.png"
            alt="App icon"
            class="size-12 rounded-xl"
          />
          <div>
            <p class="text-base-content font-medium">加到主畫面</p>
            <p class="text-base-content/60 text-sm">安裝一下，以後就像 App</p>
          </div>
        </div>
        <div class="flex shrink-0 gap-2">
          <button class="btn btn-ghost btn-sm rounded-lg" @click="dismiss">
            稍後
          </button>
          <button
            class="btn btn-primary btn-sm rounded-lg"
            :disabled="isInstalling"
            @click="handleInstall"
          >
            <Icon
              v-if="isInstalling"
              name="heroicons:arrow-path"
              class="animate-spin"
            />
            {{ isInstalling ? "安裝中…" : "安裝" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 功能特色 -->
    <div class="mb-8 grid grid-cols-2 gap-3">
      <div
        v-for="f in FEATURES"
        :key="f.title"
        class="bg-base-100 border-base-300/70 rounded-2xl border p-4"
      >
        <div
          class="bg-primary/10 mb-3 flex h-8 w-8 items-center justify-center rounded-lg"
        >
          <Icon :name="f.icon" class="text-primary text-sm" />
        </div>
        <p class="text-base-content mb-1 text-base font-semibold">
          {{ f.title }}
        </p>
        <p class="text-base-content/60 text-sm leading-relaxed">{{ f.desc }}</p>
      </div>
    </div>

    <!-- 安裝教學 -->
    <div class="bg-base-100 border-base-300/70 rounded-2xl border p-6">
      <h2 class="text-base-content mb-4 text-base font-semibold">
        照著做，四步搞定
      </h2>

      <!-- Tabs -->
      <div class="tabs mb-5">
        <button
          v-for="g in GUIDES"
          :key="g.id"
          class="tab btn btn-ghost"
          :class="{ 'tab-active btn-active': activeTab === g.id }"
          @click="activeTab = g.id as typeof activeTab"
        >
          <Icon :name="g.icon" class="mr-1 text-sm" />
          {{ g.label }}
        </button>
      </div>

      <!-- Steps -->
      <template v-for="g in GUIDES" :key="g.id">
        <div v-if="activeTab === g.id">
          <ol class="space-y-3">
            <li
              v-for="(step, i) in g.steps"
              :key="i"
              class="flex items-start gap-3"
            >
              <span
                class="bg-primary text-primary-content flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              >
                {{ i + 1 }}
              </span>
              <span class="text-base-content/80 pt-0.5 text-sm leading-relaxed">
                {{ step }}
              </span>
            </li>
          </ol>
          <p
            class="bg-base-200 text-base-content/60 mt-4 rounded-xl px-4 py-3 text-xs leading-relaxed"
          >
            <Icon
              name="heroicons:information-circle"
              class="mr-1 inline-block align-text-bottom"
            />
            {{ g.note }}
          </p>
        </div>
      </template>
    </div>

    <!-- 底部 CTA -->
    <div class="mt-8 text-center">
      <NuxtLink to="/" class="btn btn-outline rounded-xl px-6">
        先逛逛商品
      </NuxtLink>
    </div>
  </div>
</template>
