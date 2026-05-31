<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// Redirect to dashboard
definePageMeta({
  middleware: [
    () => {
      navigateTo('/dashboard')
    }
  ]
})
</script>