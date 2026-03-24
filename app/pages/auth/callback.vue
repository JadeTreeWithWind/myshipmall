<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabase()

onMounted(async () => {
  await supabase.auth.getSession()
  const redirect = localStorage.getItem('auth:redirect') ?? '/'
  localStorage.removeItem('auth:redirect')
  await navigateTo(redirect, { replace: true })
})
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4">
    <span class="loading loading-spinner loading-lg text-primary" />
    <p class="text-base-content/60 text-sm">登入中，請稍候…</p>
  </div>
</template>
