<template>
  <div>
    <button class="btn" data-set-theme="dark">Dark</button>
    <button class="btn" data-set-theme="light">Light</button>
    <button class="btn" data-set-theme="cupcake">Cupcake</button>
    <button class="btn" data-set-theme="bumblebee">Bumblebee</button>
    <button class="btn" data-set-theme="emerald">Emerald</button>
  </div>
</template>

<script setup lang="ts">
import { themeChange } from "theme-change";

onMounted(() => {
  themeChange(false);
});
</script>
