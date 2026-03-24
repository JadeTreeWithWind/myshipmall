<script setup lang="ts">
const props = defineProps<{ productId: string }>()
const emit = defineEmits<{ submitted: [] }>()

const { user, signIn, getToken } = useAuth()
const supabase = useSupabase()

// ── 表單狀態 ──────────────────────────────────────────────────
const rating = ref(0)
const hoverRating = ref(0)
const content = ref('')
const submitting = ref(false)
const errorMsg = ref('')

// ── 判斷使用者是否已評論過 ────────────────────────────────────
const existingReview = ref<{
  id: string
  rating: number
  content: string
} | null>(null)
const isEditing = ref(false)
const loadingExisting = ref(false)

async function fetchExistingReview() {
  if (!user.value) return
  loadingExisting.value = true
  const { data } = await supabase
    .from('reviews')
    .select('id, rating, content')
    .eq('product_id', props.productId)
    .eq('user_id', user.value.id)
    .maybeSingle()
  existingReview.value = data
  loadingExisting.value = false
}

watch(
  user,
  (u) => {
    if (u) fetchExistingReview()
    else existingReview.value = null
  },
  { immediate: true },
)

function startEdit() {
  if (!existingReview.value) return
  rating.value = existingReview.value.rating
  content.value = existingReview.value.content
  isEditing.value = true
  errorMsg.value = ''
}

function cancelEdit() {
  isEditing.value = false
  rating.value = 0
  content.value = ''
  errorMsg.value = ''
}

// ── 送出 ──────────────────────────────────────────────────────
async function submit() {
  errorMsg.value = ''
  if (!rating.value) {
    errorMsg.value = '請選擇評分'
    return
  }
  if (!content.value.trim()) {
    errorMsg.value = '請輸入評論內容'
    return
  }

  submitting.value = true
  try {
    const token = await getToken()
    if (!token) throw new Error('請先登入')

    const method = isEditing.value ? 'PUT' : 'POST'
    await $fetch('/api/reviews', {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        product_id: props.productId,
        rating: rating.value,
        content: content.value.trim(),
      },
    })

    // 重新取得已評論資料
    await fetchExistingReview()
    isEditing.value = false
    rating.value = 0
    content.value = ''
    emit('submitted')
  } catch (err: any) {
    errorMsg.value = err?.data?.message ?? err?.message ?? '送出失敗，請稍後再試'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <!-- 未登入提示 -->
    <div
      v-if="!user"
      class="bg-base-200 flex items-center justify-between rounded-xl px-5 py-4"
    >
      <p class="text-sm">登入後即可留下評論</p>
      <button class="btn btn-primary btn-sm" @click="signIn">
        <Icon name="heroicons:user-circle" class="h-4 w-4" />
        Google 登入
      </button>
    </div>

    <!-- 已評論、非編輯模式 -->
    <div v-else-if="existingReview && !isEditing" class="bg-base-200 rounded-xl p-4">
      <div class="mb-2 flex items-center justify-between">
        <span class="text-sm font-medium">您的評論</span>
        <button class="btn btn-ghost btn-xs" @click="startEdit">
          <Icon name="heroicons:pencil" class="h-3 w-3" />
          編輯
        </button>
      </div>
      <div class="text-warning mb-1 text-sm">
        <span v-for="i in 5" :key="i">{{ i <= existingReview.rating ? '★' : '☆' }}</span>
      </div>
      <p class="text-sm">{{ existingReview.content }}</p>
    </div>

    <!-- 評論表單（新增或編輯） -->
    <div v-else-if="user && (!existingReview || isEditing)" class="space-y-3">
      <h3 class="text-sm font-medium">{{ isEditing ? '編輯評論' : '寫下您的評論' }}</h3>

      <!-- 星評選擇 -->
      <div class="flex gap-1">
        <button
          v-for="i in 5"
          :key="i"
          class="text-2xl transition-transform hover:scale-110 focus:outline-none"
          :class="i <= (hoverRating || rating) ? 'text-warning' : 'text-base-content/20'"
          @mouseenter="hoverRating = i"
          @mouseleave="hoverRating = 0"
          @click="rating = i"
        >
          ★
        </button>
      </div>

      <!-- 文字框 -->
      <textarea
        v-model="content"
        rows="3"
        placeholder="分享您的購買心得..."
        class="textarea textarea-bordered w-full resize-none"
        maxlength="500"
      />

      <!-- 字數 + 錯誤訊息 -->
      <div class="flex items-center justify-between">
        <p v-if="errorMsg" class="text-error text-xs">{{ errorMsg }}</p>
        <span v-else class="text-base-content/30 text-xs">{{ content.length }} / 500</span>
        <span v-if="!errorMsg" class="text-base-content/30 text-xs">{{ content.length }} / 500</span>
      </div>

      <!-- 操作按鈕 -->
      <div class="flex gap-2">
        <button
          v-if="isEditing"
          class="btn btn-ghost btn-sm"
          :disabled="submitting"
          @click="cancelEdit"
        >
          取消
        </button>
        <button
          class="btn btn-primary btn-sm flex-1"
          :disabled="submitting"
          @click="submit"
        >
          <span v-if="submitting" class="loading loading-spinner loading-xs" />
          {{ isEditing ? '儲存修改' : '送出評論' }}
        </button>
      </div>
    </div>

    <!-- 載入中（查詢既有評論） -->
    <div v-else class="flex justify-center py-4">
      <span class="loading loading-spinner loading-sm" />
    </div>
  </div>
</template>
