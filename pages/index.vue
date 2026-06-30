<script setup lang="ts">
// 首页重定向到仪表盘
definePageMeta({
  middleware: [
    () => {
      return navigateTo('/dashboard')
    }
  ]
})
</script>
