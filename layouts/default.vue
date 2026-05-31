<template>
  <div class="layout">
    <header class="header">
      <div class="container flex items-center justify-between">
        <div class="logo-wrapper">
          <h1 class="logo font-display">书签分析</h1>
          <UBadge variant="subtle" color="primary">管理器</UBadge>
        </div>
        <nav class="nav flex gap-2">
          <UButton 
            v-for="item in navItems" 
            :key="item.path"
            :variant="route.path === item.path ? 'solid' : 'ghost'"
            size="sm"
            @click="navigateTo(item.path)"
          >
            <UIcon :name="item.icon" />
            {{ item.label }}
          </UButton>
        </nav>
      </div>
    </header>
    
    <main class="main">
      <div class="container">
        <slot />
      </div>
    </main>
    
    <footer class="footer">
      <div class="container">
        <p class="text-muted">© 2024 书签分析管理系统</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const navItems = [
  { path: '/dashboard', label: '仪表盘', icon: 'i-ph-chart-pie' },
  { path: '/import', label: '导入', icon: 'i-ph-upload' },
  { path: '/manager', label: '管理器', icon: 'i-ph-folder' },
  { path: '/toolbox', label: '工具箱', icon: 'i-ph-wrench' },
  { path: '/tree', label: '树状图', icon: 'i-ph-tree' },
  { path: '/list', label: '数据检索', icon: 'i-ph-list' }
]

const navigateTo = (path: string) => {
  navigateTo(path)
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg);
}

.header {
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-border-light);
  padding: 16px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
}

.main {
  flex: 1;
  padding: 32px 0;
}

.footer {
  background-color: var(--color-bg-dark);
  color: rgba(255, 255, 255, 0.8);
  padding: 24px 0;
  margin-top: auto;
}

.footer p {
  font-size: 14px;
}
</style>