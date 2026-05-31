<template>
  <div class="toolbox-page">
    <div class="page-header">
      <h1 class="font-display">管家工具箱</h1>
      <p class="text-muted">实用工具集合</p>
    </div>

    <div class="tools-grid">
      <div class="card tool-card" v-for="tool in tools" :key="tool.id">
        <div class="tool-icon">
          <UIcon :name="tool.icon" />
        </div>
        <div class="tool-content">
          <h3 class="font-mid">{{ tool.name }}</h3>
          <p class="text-muted">{{ tool.description }}</p>
        </div>
        <UButton variant="soft" size="sm" @click="handleUseTool(tool.id)">
          使用
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const tools = ref([
  { id: 1, name: '批量标签管理', description: '批量添加或移除书签标签', icon: 'i-ph-tags' },
  { id: 2, name: '失效链接检测', description: '检测书签中的失效链接', icon: 'i-ph-link-break' },
  { id: 3, name: '数据导出', description: '导出书签数据为多种格式', icon: 'i-ph-export' },
  { id: 4, name: '重复检测', description: '查找重复的书签链接', icon: 'i-ph-copy' },
  { id: 5, name: '标签合并', description: '合并相似的标签', icon: 'i-ph-git-merge' },
  { id: 6, name: '数据清理', description: '清理无效书签数据', icon: 'i-ph-broom' }
])

const handleUseTool = (id: number) => {
  useToast().add({ title: `启动工具 ${id}`, color: 'info' })
}
</script>

<style scoped>
.toolbox-page {
  padding-bottom: 64px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 8px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 16px;
  border-radius: 20px;
  padding: 20px;
}

.tool-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-secondary);
  border-radius: 12px;
  font-size: 24px;
  color: var(--color-brand);
  flex-shrink: 0;
}

.tool-content {
  flex: 1;
}

.tool-content h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.tool-content p {
  font-size: 14px;
}
</style>