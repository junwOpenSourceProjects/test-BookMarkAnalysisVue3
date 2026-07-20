export interface BackendBookmarkNode {
  id: number | string
  title?: string
  type?: 'h3' | 'a' | string
  href?: string
  parentId?: number | string | null
  sortOrder?: number | null
}

export interface BookmarkTreeItem {
  id: string
  label: string
  isFolder: boolean
  isVirtual?: boolean
  count?: number
  children?: BookmarkTreeItem[]
}

export interface BookmarkTreeBuildResult {
  items: BookmarkTreeItem[]
  unclassifiedCount: number
}

const ROOT_ID = '0'
const UNCLASSIFIED_ROOT_ID = 'virtual:unclassified-bookmarks'

const compareNodes = (left: BackendBookmarkNode, right: BackendBookmarkNode) => {
  const sortOrderDifference = (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
  if (sortOrderDifference !== 0) return sortOrderDifference

  return (left.title ?? '').localeCompare(right.title ?? '', 'zh-CN')
}

const isRootParent = (parentId: BackendBookmarkNode['parentId']) => {
  return parentId === null || parentId === undefined || String(parentId) === ROOT_ID
}

const applyChildCounts = (items: BookmarkTreeItem[]) => {
  for (const item of items) {
    if (item.children?.length) {
      item.count = item.children.length
      applyChildCounts(item.children)
    } else {
      item.count = undefined
      if (!item.isFolder) item.children = undefined
    }
  }
}

/**
 * Builds a folder-first tree without changing the underlying bookmark data.
 * Root-level links are represented by a synthetic "未分类书签" folder so a
 * large unclassified collection cannot hide the actual bookmark hierarchy.
 */
export const buildBookmarkTree = (nodes: BackendBookmarkNode[]): BookmarkTreeBuildResult => {
  const sortedNodes = [...nodes].sort(compareNodes)
  const itemsById = new Map<string, BookmarkTreeItem>()
  const rootFolders: BookmarkTreeItem[] = []
  const rootLinks: BookmarkTreeItem[] = []

  for (const node of sortedNodes) {
    const isFolder = node.type === 'h3' || !node.href
    itemsById.set(String(node.id), {
      id: String(node.id),
      label: node.title || '未命名',
      isFolder,
      children: isFolder ? [] : undefined
    })
  }

  for (const node of sortedNodes) {
    const item = itemsById.get(String(node.id))
    if (!item) continue

    if (!isRootParent(node.parentId)) {
      const parent = itemsById.get(String(node.parentId))
      if (parent?.isFolder && parent.children) {
        parent.children.push(item)
        continue
      }
    }

    if (item.isFolder) {
      rootFolders.push(item)
    } else {
      rootLinks.push(item)
    }
  }

  applyChildCounts(rootFolders)

  if (rootLinks.length === 0) {
    return { items: rootFolders, unclassifiedCount: 0 }
  }

  const unclassifiedRoot: BookmarkTreeItem = {
    id: UNCLASSIFIED_ROOT_ID,
    label: '未分类书签',
    isFolder: true,
    isVirtual: true,
    count: rootLinks.length,
    children: rootLinks
  }
  return {
    items: [...rootFolders, unclassifiedRoot],
    unclassifiedCount: rootLinks.length
  }
}
