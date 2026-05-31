<template>
  <div class="manager-page">
    <div class="page-header">
      <h1 class="font-display">高级资源管理器</h1>
      <p class="text-muted">管理您的书签资源</p>
    </div>

    <div class="toolbar flex gap-3 mb-4">
      <UInput 
        v-model="searchKeyword" 
        placeholder="搜索书签..."
        class="search-input"
      >
        <template #leading>
          <UIcon name="i-ph-magnifying-glass" />
        </template>
      </UInput>
      <UButton color="primary" @click="handleRefresh">
        <UIcon name="i-ph-arrows-clockwise" />
        刷新
      </UButton>
      <UButton variant="soft" @click="handleAiCategorize">
        <UIcon name="i-ph-robot" />
        AI 分类
      </UButton>
    </div>

    <div class="card table-card">
      <UTable 
        :data="bookmarks" 
        :columns="columns" 
        :loading="loading"
        class="bookmark-table"
      >
        <template #icon="{ row }">
          <img v-if="row.favicon" :src="row.favicon" class="favicon" />
          <UIcon v-else name="i-ph-link" class="default-icon" />
        </template>
        
        <template #title="{ row }">
          <div class="title-cell">
            <a :href="row.url" target="_blank" class="bookmark-link">
              {{ row.title }}
            </a>
          </div>
        </template>

        <template #tags="{ row }">
          <div class="tags-cell">
            <UBadge v-for="tag in row.tags" :key="tag" variant="subtle" size="sm">
              {{ tag }}
            </UBadge>
          </div>
        </template>

        <template #actions="{ row }">
          <UButton variant="ghost" size="sm" @click="handleEdit(row)">
            <UIcon name="i-ph-pencil" />
          </UButton>
          <UButton variant="ghost" size="sm" color="error" @click="handleDelete(row)">
            <UIcon name="i-ph-trash" />
          </UButton>
        </template>
      </UTable>

      <div class="pagination-wrapper">
        <UPagination 
          v-model:page="queryParams.page" 
          v-model:page-size="queryParams.limit"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

definePageMeta({
  layout: 'default'
})

const loading = ref(false)
const searchKeyword = ref('')
const bookmarks = ref<any[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  limit: 10
})

const columns = [
  { key: 'icon', label: '图标', width: 60 },
  { key: 'title', label: '标题' },
  { key: 'url', label: '地址', width: 300 },
  { key: 'tags', label: '标签', width: 200 },
  { key: 'createdAt', label: '创建时间', width: 180 },
  { key: 'actions', label: '操作', width: 120 }
]

const handleRefresh = async () => {
  loading.value = true
  try {
    const res = await bookmarkApi.getListData(queryParams)
    bookmarks.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
}

const handleAiCategorize = async () => {
  const selected = bookmarks.value.filter(b => b.selected)
  if (selected.length === 0) {
    useToast().add({ title: '请先选择要分类的书签', color: 'warning' })
    return
  }
  try {
    await bookmarkApi.aiCategorize(selected.map(b => b.id))
    useToast().add({ title: 'AI 分类完成', color: 'success' })
    handleRefresh()
  } catch (error: any) {
    useToast().add({ title: error.message || '分类失败', color: 'error' })
  }
}

const handleEdit = (row: any) => {
  console.log('edit', row)
}

const handleDelete = async (row: any) => {
  try {
    await useConfirm().confirm('确定要删除该书签吗？')
    useToast().add({ title: '删除成功', color: 'success' })
    handleRefresh()
  } catch {}
}

onMounted(() => {
  handleRefresh()
})
</script>

<style scoped>
.manager-page {
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

.toolbar {
  flex-wrap: wrap;
}

.search-input {
  max-width: 300px;
}

.table-card {
  border-radius: 20px;
  overflow: hidden;
}

.favicon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.default-icon {
  font-size: 20px;
  color: var(--color-text-muted);
}

.bookmark-link {
  color: var(--color-brand);
  text-decoration: none;
}

.bookmark-link:hover {
  text-decoration: underline;
}

.tags-cell {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px 0 8px;
}
</style>