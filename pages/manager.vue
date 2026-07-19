<template>
  <div class="manager-page">
    <div class="page-header">
      <h1 class="font-display">高级资源管理器</h1>
      <p class="text-muted">管理您的书签资源</p>
    </div>

    <!-- 工具栏：搜索、刷新 -->
    <div class="toolbar flex gap-3 mb-4">
      <UInput
        v-model="searchKeyword"
        placeholder="搜索书签..."
        class="search-input"
        @keyup.enter="handleRefresh"
      >
        <template #leading>
          <UIcon name="i-ph-magnifying-glass" />
        </template>
      </UInput>
      <UButton color="primary" :loading="loading" @click="handleRefresh">
        <UIcon name="i-ph-arrows-clockwise" />
        刷新
      </UButton>
    </div>

    <!-- 书签表格 -->
    <div class="card table-card">
      <UTable
        :data="bookmarks"
        :columns="columns"
        :loading="loading"
        empty="暂无书签数据"
        class="bookmark-table"
      />

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <UPagination
          v-model:page="queryParams.page"
          v-model:items-per-page="queryParams.limit"
          :total="total"
          :items-per-page-options="[10, 20, 50, 100]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'

// 使用默认布局
definePageMeta({
  layout: 'default'
})

interface Bookmark {
  id: number
  title: string
  url: string
  createdAt?: string
  selected?: boolean
}

const loading = ref(false)
const toast = useToast()
const searchKeyword = ref('')
const bookmarks = ref<Bookmark[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  limit: 10
})

// 表格列定义（TanStack ColumnDef）
const columns: ColumnDef<Bookmark>[] = [
  {
    accessorKey: 'icon',
    header: '图标',
    cell: () =>
      h(UIcon, { name: 'i-ph-link', class: 'default-icon' }),
    meta: { class: { td: 'w-16' } }
  },
  {
    accessorKey: 'title',
    header: '标题',
    cell: ({ row }) =>
      h(
        'a',
        {
          href: row.original.url,
          target: '_blank',
          class: 'bookmark-link'
        },
        row.original.title || row.original.url
      )
  },
  {
    accessorKey: 'url',
    header: '地址',
    cell: ({ row }) =>
      h(
        'a',
        {
          href: row.original.url,
          target: '_blank',
          class: 'bookmark-url'
        },
        row.original.url
      )
  },
  {
    accessorKey: 'tags',
    header: '标签',
    cell: () =>
      h('span', { class: 'text-muted' }, '—')
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    cell: ({ row }) => row.original.createdAt || '-'
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) =>
      h('div', { class: 'actions-cell' }, [
        h(
          UButton,
          {
            variant: 'ghost',
            size: 'sm',
            onClick: () => handleEdit(row.original)
          },
          () => h(UIcon, { name: 'i-ph-pencil' })
        ),
        h(
          UButton,
          {
            variant: 'ghost',
            size: 'sm',
            color: 'error',
            onClick: () => handleDelete(row.original)
          },
          () => h(UIcon, { name: 'i-ph-trash' })
        )
      ]),
    meta: { class: { td: 'w-28' } }
  }
]

// 将后端 BookMarks 实体字段映射为前端 Bookmark 结构
const normalizeBookmarks = (records: any[]): Bookmark[] => {
  return records.map((b) => ({
    id: Number(b.id),
    title: b.title,
    url: b.href || '',
    createdAt: b.addDate ? new Date(b.addDate * 1000).toLocaleString() : undefined,
  }))
}

// 拉取书签列表（有搜索关键词时调用 /search，否则调用 /list）
const handleRefresh = async () => {
  loading.value = true
  try {
    const keyword = searchKeyword.value.trim()
    const res = keyword
      ? await bookmarkApi.search(keyword, queryParams.page, queryParams.limit)
      : await bookmarkApi.getListData({
          page: queryParams.page,
          limit: queryParams.limit
        })
    const records = (res.data?.records || []) as any[]
    bookmarks.value = normalizeBookmarks(records)
    total.value = res.data?.total || 0
  } catch (error: any) {
    toast.add({ title: error.message || '获取数据失败', color: 'error' })
  } finally {
    loading.value = false
  }
}

const handleEdit = (row: Bookmark) => {
  toast.add({ title: `编辑功能开发中：${row.title}`, color: 'info' })
}

// 删除书签：先确认，再调用删除接口并刷新
const handleDelete = async (row: Bookmark) => {
  const confirmed = await useConfirm().confirm('确定要删除该书签吗？')
  if (!confirmed) return
  try {
    await bookmarkApi.deleteBookmarks([row.id])
    toast.add({ title: '删除成功', color: 'success' })
    handleRefresh()
  } catch (error: any) {
    toast.add({ title: error.message || '删除失败', color: 'error' })
  }
}

// 分页或搜索条件变化时重新加载
watch([() => queryParams.page, () => queryParams.limit], handleRefresh)

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
  color: var(--color-text);
  text-decoration: none;
  font-weight: 500;
}

.bookmark-link:hover {
  text-decoration: underline;
}

.bookmark-url {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 13px;
}

.bookmark-url:hover {
  text-decoration: underline;
}

.tags-cell {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.actions-cell {
  display: flex;
  gap: 4px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px 0 8px;
}
</style>
