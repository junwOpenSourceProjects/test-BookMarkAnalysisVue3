<template>
  <div class="list-page">
    <div class="page-header">
      <h1 class="font-display">全量数据检索</h1>
      <p class="text-muted">搜索和筛选所有书签数据</p>
    </div>

    <!-- 搜索框 -->
    <div class="card search-card">
      <UInput
        v-model="searchKeyword"
        placeholder="输入关键词搜索..."
        size="lg"
        class="search-input"
        @keyup.enter="handleSearch"
      >
        <template #leading>
          <UIcon name="i-ph-magnifying-glass" />
        </template>
        <template #trailing>
          <UButton v-if="searchKeyword" variant="ghost" size="sm" @click="clearSearch">
            <UIcon name="i-ph-x" />
          </UButton>
        </template>
      </UInput>
    </div>

    <!-- 搜索结果 -->
    <div class="results-card card mt-6">
      <div class="results-header flex justify-between items-center mb-4">
        <span class="text-secondary">
          {{ loading ? '搜索中…' : `找到 ${total} 条结果` }}
        </span>
        <USelect
          v-model="queryParams.sort"
          :items="sortOptions"
          placeholder="排序方式"
          size="sm"
        />
      </div>

      <div v-if="loading" class="results-empty">
        <UIcon name="i-ph-spinner" class="animate-spin" />
      </div>

      <div v-else-if="results.length === 0" class="results-empty text-muted">
        暂无数据，请输入关键词搜索
      </div>

      <div v-else class="results-list">
        <div
          v-for="item in results"
          :key="item.id"
          class="result-item"
        >
          <div class="result-icon">
            <UIcon name="i-ph-link" />
          </div>
          <div class="result-content">
            <a :href="item.url" target="_blank" class="result-title">
              {{ item.title || item.url }}
            </a>
            <p class="result-url text-muted">{{ item.url }}</p>
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

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination-wrapper mt-6">
        <UPagination
          v-model:page="queryParams.page"
          v-model:items-per-page="queryParams.limit"
          :total="total"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'

// 使用默认布局
definePageMeta({
  layout: 'default'
})

interface BookmarkItem {
  id: number
  title?: string
  url: string
}

const searchKeyword = ref('')
const results = ref<BookmarkItem[]>([])
const total = ref(0)
const loading = ref(false)
const toast = useToast()

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

// 执行搜索：关键词为空时回退到列表接口
const handleSearch = async () => {
  const keyword = searchKeyword.value.trim()

  // 关键词长度不足且非空时不发起请求
  if (keyword && keyword.length <= 2) {
    return
  }

  loading.value = true
  try {
    const res = keyword
      ? await bookmarkApi.search(keyword, queryParams.page, queryParams.limit)
      : await bookmarkApi.getListData({
          page: queryParams.page,
          limit: queryParams.limit
        })
    const records = (res.data?.records || []) as any[]
    results.value = records.map((b) => ({
      id: Number(b.id),
      title: b.title,
      url: b.href || ''
    }))
    total.value = res.data?.total || 0
  } catch (error: any) {
    toast.add({ title: error.message || '搜索失败', color: 'error' })
  } finally {
    loading.value = false
  }
}

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = ''
  queryParams.page = 1
  handleSearch()
}

// 输入关键词时自动搜索（长度大于 2）
watch(searchKeyword, (val) => {
  queryParams.page = 1
  if (val.length > 2 || val.length === 0) {
    handleSearch()
  }
})

// 分页或排序变化时重新搜索
watch([() => queryParams.page, () => queryParams.limit, () => queryParams.sort], handleSearch)

// 首次加载默认列表
onMounted(handleSearch)
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

.results-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  font-size: 14px;
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
  color: var(--color-text);
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
