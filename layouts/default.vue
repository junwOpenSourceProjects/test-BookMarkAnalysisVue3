<!--
  默认布局：顶部导航 + 主内容区 + 页脚。
  导航使用胶囊按钮样式，并支持小屏幕下的汉堡菜单展开/收起。
  点击导航项直接调用 Nuxt 自动导入的 navigateTo 进行路由跳转。
-->
<template>
  <div class="layout">
    <header class="header">
      <div class="container flex items-center justify-between">
        <div class="logo-wrapper">
          <h1 class="logo font-display">书签分析</h1>
          <UBadge variant="subtle" color="primary">管理器</UBadge>
        </div>

        <!-- 小屏幕汉堡按钮 -->
        <button class="menu-toggle" aria-label="切换导航" @click="menuOpen = !menuOpen">
          <UIcon :name="menuOpen ? 'i-ph-x' : 'i-ph-list'" />
        </button>

        <!-- 导航：桌面端始终显示，移动端根据 menuOpen 显示/隐藏 -->
        <nav class="nav" :class="{ open: menuOpen }">
          <button
            v-for="item in navItems"
            :key="item.path"
            type="button"
            class="nav-pill"
            :class="{ active: route.path === item.path }"
            @click="navigateTo(item.path)"
          >
            <UIcon :name="item.icon" />
            {{ item.label }}
          </button>
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
const menuOpen = ref(false)

const navItems = [
  { path: '/dashboard', label: '仪表盘', icon: 'i-ph-chart-pie' },
  { path: '/import', label: '导入', icon: 'i-ph-upload' },
  { path: '/manager', label: '管理器', icon: 'i-ph-folder' },
  { path: '/toolbox', label: '工具箱', icon: 'i-ph-wrench' },
  { path: '/tree', label: '树状图', icon: 'i-ph-tree' },
  { path: '/list', label: '数据检索', icon: 'i-ph-list' }
]
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

.nav {
  display: flex;
  gap: 8px;
  align-items: center;
}

.menu-toggle {
  display: none;
  background: transparent;
  border: none;
  font-size: 24px;
  color: var(--color-text);
  cursor: pointer;
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

@media (max-width: 768px) {
  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    background-color: var(--color-bg);
    border-bottom: 1px solid var(--color-border-light);
    padding: 16px;
    gap: 8px;
    box-shadow: var(--shadow-sm);
  }

  .nav.open {
    display: flex;
  }

  .nav-pill {
    justify-content: flex-start;
  }
}
</style>
