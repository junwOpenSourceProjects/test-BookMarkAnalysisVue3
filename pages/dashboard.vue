<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h1 class="font-display">仪表盘统计</h1>
      <p class="text-muted">书签数据分析概览</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div
        v-for="stat in statCards"
        :key="stat.key"
        class="card card-featured stat-card"
      >
        <div class="stat-icon">
          <UIcon :name="stat.icon" />
        </div>
        <div class="stat-content">
          <span class="stat-value font-display">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <!-- 域名分布图表 -->
    <div class="card card-featured chart-card">
      <div class="chart-header">
        <h3 class="font-mid">域名分布</h3>
        <span v-if="loading" class="text-muted text-sm">加载中…</span>
      </div>

      <div v-if="loading" class="chart-placeholder">
        <UIcon name="i-ph-spinner" class="animate-spin" />
      </div>

      <div v-else-if="domainList.length === 0" class="chart-placeholder text-muted">
        暂无分布数据
      </div>

      <div v-else class="domain-bars">
        <div
          v-for="item in domainList"
          :key="item.domain"
          class="domain-bar-row"
        >
          <span class="domain-name">{{ item.domain }}</span>
          <div class="domain-track">
            <div
              class="domain-fill"
              :style="{ width: `${item.percent}%` }"
            />
          </div>
          <span class="domain-count">{{ item.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 使用默认布局
definePageMeta({
  layout: 'default'
})

interface StatsData {
  total?: number
  folders?: number
  tags?: number
  recent?: number
}

interface DomainItem {
  domain: string
  count: number
}

const stats = ref<StatsData>({
  total: 0,
  folders: 0,
  tags: 0,
  recent: 0
})

const loading = ref(false)
const toast = useToast()
const domainDistribution = ref<DomainItem[]>([])

const statCards = computed(() => [
  { key: 'total', label: '总书签数', value: stats.value.total || 0, icon: 'i-ph-bookmark' },
  { key: 'folders', label: '文件夹', value: stats.value.folders || 0, icon: 'i-ph-folder' },
  { key: 'tags', label: '标签数', value: stats.value.tags || 0, icon: 'i-ph-tag' },
  { key: 'recent', label: '最近添加', value: stats.value.recent || 0, icon: 'i-ph-clock' }
])

const domainList = computed(() => {
  const raw = domainDistribution.value || {}
  const list = Object.entries(raw).map(([domain, count]) => ({
    domain,
    count: Number(count)
  }))
  const max = Math.max(...list.map((d) => d.count), 1)
  return list.map((d) => ({
    ...d,
    percent: Math.round((d.count / max) * 100)
  }))
})

onMounted(async () => {
  try {
    const res = await bookmarkApi.getStats()
    stats.value = res.data || {}
  } catch (error: any) {
    toast.add({ title: error.message || '获取统计数据失败', color: 'error' })
  }

  loading.value = true
  try {
    const res = await bookmarkApi.getGroupStats()
    domainDistribution.value = res.data?.domainDistribution || []
  } catch (error: any) {
    toast.add({ title: error.message || '获取分组统计失败', color: 'error' })
  } finally {
    loading.value = false
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

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.chart-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.text-sm {
  font-size: 14px;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.domain-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.domain-bar-row {
  display: grid;
  grid-template-columns: 160px 1fr 48px;
  align-items: center;
  gap: 16px;
}

.domain-name {
  font-size: 14px;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.domain-track {
  height: 12px;
  background-color: var(--color-bg-secondary);
  border-radius: 9999px;
  overflow: hidden;
}

.domain-fill {
  height: 100%;
  background-color: var(--color-brand);
  border-radius: 9999px;
  transition: width 0.4s ease;
}

.domain-count {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-align: right;
}

@media (max-width: 640px) {
  .domain-bar-row {
    grid-template-columns: 100px 1fr 40px;
  }
}
</style>
