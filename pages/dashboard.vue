<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h1 class="font-display">仪表盘统计</h1>
      <p class="text-muted">书签数据分析概览</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="card stat-card">
        <div class="stat-icon">
          <UIcon name="i-ph-bookmark" />
        </div>
        <div class="stat-content">
          <span class="stat-value font-display">{{ stats.total || 0 }}</span>
          <span class="stat-label">总书签数</span>
        </div>
      </div>
      
      <div class="card stat-card">
        <div class="stat-icon">
          <UIcon name="i-ph-folder" />
        </div>
        <div class="stat-content">
          <span class="stat-value font-display">{{ stats.folders || 0 }}</span>
          <span class="stat-label">文件夹</span>
        </div>
      </div>
      
      <div class="card stat-card">
        <div class="stat-icon">
          <UIcon name="i-ph-tag" />
        </div>
        <div class="stat-content">
          <span class="stat-value font-display">{{ stats.tags || 0 }}</span>
          <span class="stat-label">标签数</span>
        </div>
      </div>
      
      <div class="card stat-card">
        <div class="stat-icon">
          <UIcon name="i-ph-clock" />
        </div>
        <div class="stat-content">
          <span class="stat-value font-display">{{ stats.recent || 0 }}</span>
          <span class="stat-label">最近添加</span>
        </div>
      </div>
    </div>

    <!-- 图表 -->
    <div class="card chart-card">
      <h3 class="font-mid">分类分布</h3>
      <div class="chart-placeholder">
        <UBadge variant="subtle" color="primary">图表区域</UBadge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default'
})

const stats = ref({
  total: 0,
  folders: 0,
  tags: 0,
  recent: 0
})

onMounted(async () => {
  try {
    const res = await bookmarkApi.getStats()
    stats.value = res.data || {}
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
})
</script>

<style scoped>
.dashboard-page {
  padding-bottom: 64px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  border-radius: 20px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-secondary);
  border-radius: 12px;
  font-size: 24px;
  color: var(--color-brand);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text);
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-muted);
}

.chart-card {
  border-radius: 20px;
}

.chart-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 24px;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>