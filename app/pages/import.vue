<script setup lang="ts">
import type { ShopData } from '~/server/utils/types'

useHead({ title: '匯入賣場 — MyShipBang' })

const config = useRuntimeConfig()

// ── State ──────────────────────────────────────────────────────────────────
const url = ref('')
const urlError = ref('')
const phase = ref<'input' | 'preview' | 'success'>('input')
const loading = ref(false)
const errorMsg = ref('')

const previewData = ref<ShopData | null>(null)
const importResult = ref<{ shop_name: string; product_count: number } | null>(null)

// ── Turnstile ──────────────────────────────────────────────────────────────
// Cloudflare Turnstile widget 會注入 window.turnstile
// 我們在需要 token 時才 execute()，取得 token 後立即送出
declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      execute: (widgetId: string) => void
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

const turnstileWidgetId = ref<string | null>(null)
const turnstileContainer = ref<HTMLElement | null>(null)

function getTurnstileToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.turnstile) {
      reject(new Error('Turnstile 尚未載入'))
      return
    }

    // 若已有 widget 先移除
    if (turnstileWidgetId.value) {
      window.turnstile.remove(turnstileWidgetId.value)
    }

    const id = window.turnstile.render(turnstileContainer.value!, {
      sitekey: config.public.turnstileSiteKey,
      size: 'invisible',
      callback: (token: string) => resolve(token),
      'error-callback': () => reject(new Error('Turnstile 驗證失敗，請重試')),
      'expired-callback': () => reject(new Error('Turnstile token 已過期，請重試')),
    })
    turnstileWidgetId.value = id
    window.turnstile.execute(id)
  })
}

// ── URL 驗證 ──────────────────────────────────────────────────────────────
function validateUrl(): boolean {
  const pattern = /^https:\/\/myship\.7-11\.com\.tw\/general\/detail\/GM\w+/
  if (!url.value) {
    urlError.value = '請輸入賣場網址'
    return false
  }
  if (!pattern.test(url.value)) {
    urlError.value = '格式不正確，請輸入 https://myship.7-11.com.tw/general/detail/GM... 格式的網址'
    return false
  }
  urlError.value = ''
  return true
}

// ── Step 1：讀取賣場資料 ──────────────────────────────────────────────────
async function handleScrape() {
  if (!validateUrl()) return
  loading.value = true
  errorMsg.value = ''

  try {
    const token = await getTurnstileToken()

    const data = await $fetch<ShopData>('/api/scrape', {
      method: 'POST',
      body: { url: url.value, turnstile_token: token },
    })

    previewData.value = data
    phase.value = 'preview'
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    errorMsg.value = e.data?.message || e.message || '讀取失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

// ── Step 2：確認匯入 ──────────────────────────────────────────────────────
async function handleConfirmImport() {
  loading.value = true
  errorMsg.value = ''

  try {
    const token = await getTurnstileToken()

    const result = await $fetch<{ success: boolean; shop_name: string; product_count: number }>(
      '/api/confirm-import',
      {
        method: 'POST',
        body: { url: url.value, turnstile_token: token },
      },
    )

    importResult.value = result
    phase.value = 'success'
  } catch (err: unknown) {
    const e = err as { data?: { message?: string; statusCode?: number }; message?: string }
    const status = e.data?.statusCode
    if (status === 410) {
      errorMsg.value = '預覽已過期（超過 10 分鐘），請重新讀取賣場資料'
      phase.value = 'input'
      previewData.value = null
    } else {
      errorMsg.value = e.data?.message || e.message || '匯入失敗，請稍後再試'
    }
  } finally {
    loading.value = false
  }
}

function resetToInput() {
  phase.value = 'input'
  previewData.value = null
  importResult.value = null
  errorMsg.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-base-200 py-10 px-4">
    <!-- Turnstile invisible container -->
    <div ref="turnstileContainer" class="hidden" />

    <div class="mx-auto max-w-2xl">
      <h1 class="mb-2 text-center text-2xl font-bold">匯入賣貨便賣場</h1>
      <p class="mb-8 text-center text-sm text-base-content/60">
        輸入您的賣貨便賣場網址，系統將自動讀取並建立商城頁面
      </p>

      <!-- ── 錯誤提示 ──────────────────────────────────────────────────── -->
      <div v-if="errorMsg" role="alert" class="alert alert-error mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
        </svg>
        <span>{{ errorMsg }}</span>
      </div>

      <!-- ══════════════ PHASE: input ══════════════ -->
      <div v-if="phase === 'input'" class="card bg-base-100 shadow-sm">
        <div class="card-body gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">賣場網址</span>
            </label>
            <input
              v-model="url"
              type="url"
              placeholder="https://myship.7-11.com.tw/general/detail/GM..."
              class="input input-bordered w-full"
              :class="{ 'input-error': urlError }"
              @keyup.enter="handleScrape"
            />
            <label v-if="urlError" class="label">
              <span class="label-text-alt text-error">{{ urlError }}</span>
            </label>
          </div>

          <button
            class="btn btn-primary w-full"
            :disabled="loading"
            @click="handleScrape"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm" />
            {{ loading ? '讀取中…' : '讀取賣場資料' }}
          </button>

          <p class="text-center text-xs text-base-content/40">
            受 Cloudflare Turnstile 保護，使用者完全無感知
          </p>
        </div>
      </div>

      <!-- ══════════════ PHASE: preview ══════════════ -->
      <div v-if="phase === 'preview' && previewData" class="space-y-4">
        <!-- 賣場資訊卡 -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="flex items-center gap-4">
              <div class="avatar">
                <div class="h-16 w-16 rounded-full bg-base-200">
                  <img
                    v-if="previewData.image_url"
                    :src="previewData.image_url"
                    :alt="previewData.name"
                  />
                  <div v-else class="flex h-full w-full items-center justify-center text-2xl">
                    🏪
                  </div>
                </div>
              </div>
              <div>
                <h2 class="text-lg font-bold">{{ previewData.name }}</h2>
                <p class="text-sm text-base-content/60">
                  共 {{ previewData.products.length }} 件商品
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 商品列表預覽 -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h3 class="card-title text-base mb-3">商品預覽</h3>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="product in previewData.products"
                :key="product.external_id"
                class="flex items-center gap-3 rounded-lg border border-base-200 p-3"
              >
                <div class="avatar shrink-0">
                  <div class="h-12 w-12 rounded bg-base-200">
                    <img
                      v-if="product.main_image"
                      :src="product.main_image"
                      :alt="product.name"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ product.name }}</p>
                  <div class="flex gap-2 text-xs text-base-content/60">
                    <span>{{ product.specs.length }} 種規格</span>
                    <span v-if="product.specs.length > 0">
                      · NT$
                      {{ Math.min(...product.specs.map((s) => s.price)) }}
                      <template v-if="product.specs.length > 1">
                        ~ {{ Math.max(...product.specs.map((s) => s.price)) }}
                      </template>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="flex gap-3">
          <button class="btn btn-ghost flex-1" :disabled="loading" @click="resetToInput">
            重新輸入
          </button>
          <button class="btn btn-primary flex-1" :disabled="loading" @click="handleConfirmImport">
            <span v-if="loading" class="loading loading-spinner loading-sm" />
            {{ loading ? '匯入中…' : '確認匯入' }}
          </button>
        </div>

        <p class="text-center text-xs text-base-content/40">
          預覽資料將在 10 分鐘後過期，請盡快確認匯入
        </p>
      </div>

      <!-- ══════════════ PHASE: success ══════════════ -->
      <div v-if="phase === 'success' && importResult" class="card bg-base-100 shadow-sm">
        <div class="card-body items-center text-center gap-4">
          <div class="text-5xl">✅</div>
          <div>
            <h2 class="text-xl font-bold">匯入成功！</h2>
            <p class="mt-1 text-base-content/70">
              <strong>{{ importResult.shop_name }}</strong> 已建立，
              共匯入 <strong>{{ importResult.product_count }}</strong> 件商品
            </p>
          </div>
          <div class="flex gap-3">
            <button class="btn btn-ghost" @click="resetToInput">繼續匯入其他賣場</button>
            <NuxtLink to="/" class="btn btn-primary">前往首頁</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
