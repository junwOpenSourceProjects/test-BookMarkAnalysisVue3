<template>
  <div class="tree-page">
    <div class="page-header">
      <h1 class="font-display">树状文件夹浏览</h1>
      <p class="text-muted">以树形结构展示书签文件夹</p>
    </div>

    <div class="card tree-card">
      <!-- 展开/收起工具栏 -->
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

      <!-- 加载与空状态 -->
      <div v-if="loading" class="tree-status">
        <UIcon name="i-ph-spinner" class="animate-spin" />
      </div>
      <div v-else-if="treeData.length === 0" class="tree-status text-muted">
        暂无文件夹数据
      </div>

      <!-- 树组件：使用 items 与 v-model:expanded -->
      <UTree
        v-else
        :items="treeData"
        v-model:expanded="expandedIds"
        @node-click="handleNodeClick"
      >
        <template #item="{ item, expanded }">
          <div class="tree-node">
            <UIcon :name="expanded ? 'i-ph-folder-open' : 'i-ph-folder'" />
            <span class="tree-node-label">{{ item.label }}</span>
            <UBadge v-if="item.count" variant="subtle" size="sm">
              {{ item.count }}
            </UBadge>
            <UButton
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
import { ref, onMounted } from 'vue'

// 使用默认布局
definePageMeta({
  layout: 'default'
})

interface BackendNode {
  id: number | string
  title?: string
  type?: 'h3' | 'a' | string
  href?: string
  parentId?: number | string | null
  sortOrder?: number
}

interface TreeItem {
  id: string
  label: string
  icon?: string
  count?: number
  children?: TreeItem[]
}

const loading = ref(false)
const deletingId = ref<string | null>(null)
const toast = useToast()
const expandedIds = ref<string[]>([])
const treeData = ref<TreeItem[]>([])

// 将后端返回的扁平书签列表按 parentId 构建为树形结构
const buildTree = (nodes: BackendNode[]): TreeItem[] => {
  const map = new Map<string, TreeItem>()
  const roots: TreeItem[] = []

  // 预处理：按 sortOrder 排序，保证展示顺序稳定
  const sorted = [...nodes].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

  // 第一遍：创建所有节点映射
  for (const node of sorted) {
    const isFolder = node.type === 'h3' || !node.href
    const id = String(node.id)
    map.set(id, {
      id,
      label: node.title || '未命名',
      icon: isFolder ? 'i-ph-folder' : 'i-ph-link',
      children: isFolder ? [] : undefined
    })
  }

  // 第二遍：挂载到父节点或作为根节点
  for (const node of sorted) {
    const id = String(node.id)
    const item = map.get(id)
    if (!item) continue

    const parentId = node.parentId ?? null
    if (parentId !== null && parentId !== undefined && String(parentId) !== '0') {
      const parent = map.get(String(parentId))
      if (parent && parent.children) {
        parent.children.push(item)
      } else {
        // 父节点不存在时降级为根节点
        roots.push(item)
      }
    } else {
      roots.push(item)
    }
  }

  // 为文件夹计算直接子节点数量，并过滤空 children 数组
  const walk = (items: TreeItem[]) => {
    for (const item of items) {
      if (item.children?.length) {
        item.count = item.children.length
        walk(item.children)
      } else {
        item.children = undefined
      }
    }
  }
  walk(roots)

  return roots
}

// 收集所有节点 ID，用于展开全部
const collectIds = (nodes: TreeItem[]): string[] => {
  const ids: string[] = []
  for (const node of nodes) {
    ids.push(node.id)
    if (node.children?.length) {
      ids.push(...collectIds(node.children))
    }
  }
  return ids
}

const handleExpandAll = () => {
  expandedIds.value = collectIds(treeData.value)
}

const handleCollapseAll = () => {
  expandedIds.value = []
}

const handleNodeClick = (node: TreeItem) => {
  // 点击节点时，如果有 href 则在新标签页打开
  // 文件夹节点由 UTree 自动处理展开/收起
}

// 删除节点
const handleDeleteNode = async (node: TreeItem) => {
  const confirmed = await useConfirm().confirm(
    `确定要删除「${node.label}」${node.children ? '及其所有子节点' : ''}吗？此操作不可恢复。`
  )
  if (!confirmed) return

  deletingId.value = node.id
  try {
    // 收集该节点及其所有子孙节点的 ID
    const idsToDelete = collectAllIds([node])
    await bookmarkApi.deleteBookmarks(idsToDelete.map(Number))
    toast.add({ title: `已删除「${node.label}」`, color: 'success' })
    // 刷新树数据
    await loadTreeData()
  } catch (error: any) {
    toast.add({ title: error.message || '删除失败', color: 'error' })
  } finally {
    deletingId.value = null
  }
}

// 收集节点及其所有子孙节点的 ID
const collectAllIds = (nodes: TreeItem[]): number[] => {
  const ids: number[] = []
  for (const node of nodes) {
    ids.push(Number(node.id))
    if (node.children?.length) {
      ids.push(...collectAllIds(node.children))
    }
  }
  return ids
}

// 加载树数据
const loadTreeData = async () => {
  const res = await bookmarkApi.getTreeData()
  const raw = (res.data || []) as BackendNode[]
  treeData.value = buildTree(raw)
}

onMounted(async () => {
  loading.value = true
  try {
    await loadTreeData()
    // 默认展开前两层
    expandedIds.value = collectIds(treeData.value).slice(0, 20)
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
  flex-wrap: wrap;
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
