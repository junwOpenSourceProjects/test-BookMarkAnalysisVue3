<template>
  <div class="list-page">
    <div class="page-header">
      <h1 class="font-display">全量数据检索</h1>
      <p class="text-muted">搜索和筛选所有书签数据</p>
    </div>

    <div class="card search-card">
      <UInput 
        v-model="searchKeyword" 
        placeholder="输入关键词搜索..."
        size="lg"
        class="search-input"
      >
        <template #leading>
          <UIcon name="i-ph-magnifying-glass" />
        </template>
        <template #trailing>
          <UButton v-if="searchKeyword" variant="ghost" size="sm" @click="searchKeyword = ''">
            <UIcon name="i-ph-x" />
          </UButton>
        </template>
      </UInput>
    </div>

    <div class="results-card card mt-6">
      <div class="results-header flex justify-between items-center mb-4">
        <span class="text-secondary">找到 {{ total }} 条结果</span>
        <div class="flex gap-2">
          <USelect 
            v-model="queryParams.sort" 
            :items="sortOptions" 
            placeholder="排序方式"
            size="sm"
          />
        </div>
      </div>

      <div class="results-list">
        <div 
          class="result-item" 
          v-for="item in results" 
          :key="item.id"
        >
          <div class="result-icon">
            <img v-if="item.favicon" :src="item.favicon" class="favicon" />
            <UIcon v-else name="i-ph-link" />
          </div>
          <div class="result-content">
            <a :href="item.url" target="_blank" class="result-title">
              {{ item.title }}
            </a>
            <p class="result-url text-muted">{{ item.url }}</p>
            <p v-if="item.description" class="result-desc text-secondary">
              {{ item.description }}
            </p>
          </div>
          <div class="result-actions">
            <UButton variant="ghost" size="sm">
              <UIcon name="i-ph-bookmark-simple" />
            </UButton>
            <UButton variant="ghost" size="sm">
              <UIcon name="i-ph-share" />
            </UButton>
          </div>
        </div>
      </div>

      <div class="pagination-wrapper mt-6">
        <UPagination 
          v-model:page="queryParams.page" 
          v-model:page-size="queryParams.limit"
          :total="total"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

definePageMeta({
  layout: 'default'
})

const searchKeyword = ref('')
const results = ref<any[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  limit: 20,
  sort: 'relevance'
})

const sortOptions = [
  { label: '相关性', value: 'relevance' },
  { label: '时间', value: 'time' },
  { label: '名称', value: 'name' }
]

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    results.value = []
    total.value = 0
    return
  }
  
  try {
    const res = await bookmarkApi.search(searchKeyword.value)
    results.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('搜索失败:', error)
  }
}

watch(searchKeyword, (val) => {
  if (val.length > 2) {
    handleSearch()
  }
})

queryParams.page
</script>

<style scoped>
.list-page {
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

.search-card {
  border-radius: 20px;
  padding: 16px;
}

.search-input {
  max-width: 600px;
}

.mt-6 {
  margin-top: 24px;
}

.results-card {
  border-radius: 20px;
}

.mb-4 {
  margin-bottom: 16px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  transition: background-color 0.2s;
}

.result-item:hover {
  background-color: var(--color-bg-secondary);
}

.result-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.favicon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-brand);
  text-decoration: none;
}

.result-title:hover {
  text-decoration: underline;
}

.result-url {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-desc {
  font-size: 14px;
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
}
</style>