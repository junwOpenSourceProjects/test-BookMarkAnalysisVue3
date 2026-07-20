<template>
  <div class="tree-page">
    <div class="page-header">
      <h1 class="font-display">树状文件夹浏览</h1>
      <p class="text-muted">目录优先展示；未分类书签会收纳在独立节点中</p>
    </div>

    <div class="card tree-card">
      <div class="tree-toolbar flex gap-2 mb-4">
        <UButton variant="soft" size="sm" :loading="loading" @click="handleRefresh">
          <UIcon name="i-ph-arrow-clockwise" />
          刷新树状结构
        </UButton>
        <UButton variant="soft" size="sm" :disabled="loading" @click="handleExpandAll">
          <UIcon name="i-ph-caret-down" />
          展开全部
        </UButton>
        <UButton variant="soft" size="sm" :disabled="loading" @click="handleCollapseAll">
          <UIcon name="i-ph-caret-right" />
          收起全部
        </UButton>
        <span v-if="unclassifiedCount > 0" class="tree-toolbar-summary text-muted">
          {{ unclassifiedCount }} 条未分类书签已收纳到独立节点
        </span>
      </div>

      <div v-if="loading && treeData.length === 0" class="tree-status">
        <UIcon name="i-ph-spinner" class="animate-spin" />
      </div>
      <div v-else-if="treeData.length === 0" class="tree-status text-muted">
        暂无文件夹数据
      </div>

      <UTree
        v-else
        :items="treeData"
        v-model:expanded="expandedIds"
        @node-click="handleNodeClick"
      >
        <template #item="{ item, expanded }">
          <div class="tree-node">
            <UIcon :name="getNodeIcon(item, expanded)" />
            <span class="tree-node-label">{{ item.label }}</span>
            <UBadge v-if="item.count !== undefined" variant="subtle" size="sm">
              {{ item.count }}
            </UBadge>
            <UButton
              v-if="!item.isVirtual"
              variant="ghost"
              size="sm"
              color="error"
              class="tree-node-delete"
              :loading="deletingId === item.id"
              :disabled="deletingId === item.id"
              @click.stop="handleDeleteNode(item)"
            >
              <UIcon name="i-ph-trash" />
            </UButton>
          </div>
        </template>
      </UTree>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  buildBookmarkTree,
  type BackendBookmarkNode,
  type BookmarkTreeItem
} from '~/utils/bookmarkTree'

definePageMeta({
  layout: 'default'
})

const loading = ref(false)
const deletingId = ref<string | null>(null)
const toast = useToast()
const expandedIds = ref<string[]>([])
const treeData = ref<BookmarkTreeItem[]>([])
const unclassifiedCount = ref(0)

const collectIds = (nodes: BookmarkTreeItem[]): string[] => {
  const ids: string[] = []
  for (const node of nodes) {
    ids.push(node.id)
    if (node.children?.length) {
      ids.push(...collectIds(node.children))
    }
  }
  return ids
}

const collectDefaultExpandedIds = (
  nodes: BookmarkTreeItem[],
  depth = 0,
  maxDepth = 2
): string[] => {
  const ids: string[] = []
  for (const node of nodes) {
    if (!node.isVirtual && node.isFolder && depth < maxDepth) {
      ids.push(node.id)
      if (node.children?.length) {
        ids.push(...collectDefaultExpandedIds(node.children, depth + 1, maxDepth))
      }
    }
  }
  return ids
}

const getNodeIcon = (item: BookmarkTreeItem, expanded: boolean) => {
  if (!item.isFolder) return 'i-ph-link'
  return expanded ? 'i-ph-folder-open' : 'i-ph-folder'
}

const handleExpandAll = () => {
  expandedIds.value = collectIds(treeData.value)
}

const handleCollapseAll = () => {
  expandedIds.value = []
}

const handleNodeClick = (_node: BookmarkTreeItem) => {
  // 目录节点由 UTree 自动处理展开/收起；链接节点暂不在此页面跳转。
}

const collectAllIds = (nodes: BookmarkTreeItem[]): number[] => {
  const ids: number[] = []
  for (const node of nodes) {
    if (!node.isVirtual) ids.push(Number(node.id))
    if (node.children?.length) {
      ids.push(...collectAllIds(node.children))
    }
  }
  return ids
}

const loadTreeData = async () => {
  const res = await bookmarkApi.getTreeData()
  const raw = (res.data || []) as BackendBookmarkNode[]
  const tree = buildBookmarkTree(raw)
  treeData.value = tree.items
  unclassifiedCount.value = tree.unclassifiedCount
  expandedIds.value = collectDefaultExpandedIds(tree.items)
}

const handleRefresh = async () => {
  loading.value = true
  try {
    await loadTreeData()
    toast.add({ title: '树状结构已刷新', color: 'success' })
  } catch (error: any) {
    toast.add({ title: error.message || '刷新树状数据失败', color: 'error' })
  } finally {
    loading.value = false
  }
}

const handleDeleteNode = async (node: BookmarkTreeItem) => {
  const confirmed = await useConfirm().confirm(
    `确定要删除「${node.label}」${node.children ? '及其所有子节点' : ''}吗？此操作不可恢复。`
  )
  if (!confirmed) return

  deletingId.value = node.id
  try {
    const idsToDelete = collectAllIds([node])
    await bookmarkApi.deleteBookmarks(idsToDelete)
    toast.add({ title: `已删除「${node.label}」`, color: 'success' })
    await loadTreeData()
  } catch (error: any) {
    toast.add({ title: error.message || '删除失败', color: 'error' })
  } finally {
    deletingId.value = null
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await loadTreeData()
  } catch (error: any) {
    toast.add({ title: error.message || '获取树状数据失败', color: 'error' })
  } finally {
    loading.value = false
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

.tree-toolbar {
  align-items: center;
  flex-wrap: wrap;
}

.tree-toolbar-summary {
  font-size: 13px;
  margin-left: 4px;
}

.tree-status {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  font-size: 14px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tree-node-label {
  flex: 1;
}

.tree-node-delete {
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node:hover .tree-node-delete {
  opacity: 1;
}
</style>
