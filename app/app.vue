<script setup lang="ts">
const { init } = useAuth()

onMounted(() => {
  init()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
