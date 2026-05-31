<template>
  <div class="tree-page">
    <div class="page-header">
      <h1 class="font-display">树状文件夹浏览</h1>
      <p class="text-muted">以树形结构展示书签文件夹</p>
    </div>

    <div class="card tree-card">
      <div class="tree-toolbar flex gap-2 mb-4">
        <UButton variant="soft" size="sm" @click="handleExpandAll">
          <UIcon name="i-ph-caret-down" />
          展开全部
        </UButton>
        <UButton variant="soft" size="sm" @click="handleCollapseAll">
          <UIcon name="i-ph-caret-right" />
          收起全部
        </UButton>
      </div>

      <div class="tree-container">
        <UTree :data="treeData" :expand-all="expandAll" @node-click="handleNodeClick">
          <template #default="{ node }">
            <div class="tree-node">
              <UIcon :name="node.icon || 'i-ph-folder'" />
              <span>{{ node.label }}</span>
              <UBadge v-if="node.count" variant="subtle" size="sm">
                {{ node.count }}
              </UBadge>
            </div>
          </template>
        </UTree>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default'
})

const expandAll = ref(true)
const treeData = ref<any[]>([])

const handleExpandAll = () => {
  expandAll.value = true
}

const handleCollapseAll = () => {
  expandAll.value = false
}

const handleNodeClick = (node: any) => {
  console.log('node click', node)
}

onMounted(async () => {
  try {
    const res = await bookmarkApi.getTreeData()
    treeData.value = res.data || []
  } catch (error) {
    console.error('获取树状数据失败:', error)
  }
})
</script>

<style scoped>
.tree-page {
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

.mb-4 {
  margin-bottom: 16px;
}

.tree-card {
  border-radius: 20px;
}

.tree-container {
  padding: 8px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>