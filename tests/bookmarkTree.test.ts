import assert from 'node:assert/strict'
import test from 'node:test'

import { buildBookmarkTree } from '../utils/bookmarkTree.ts'

test('buildBookmarkTree keeps folders at the root and groups root links under an unclassified virtual folder', () => {
  const result = buildBookmarkTree([
    { id: 'root-folder', title: '01_技术开发', type: 'h3', parentId: null, sortOrder: 10 },
    { id: 'sub-folder', title: '人工智能与数据', type: 'h3', parentId: 'root-folder', sortOrder: 10 },
    { id: 'leaf-link', title: 'OpenAI', type: 'a', href: 'https://openai.com', parentId: 'sub-folder', sortOrder: 10 },
    { id: 'root-link-1', title: '未分类链接 1', type: 'a', href: 'https://example.com/1', parentId: null, sortOrder: 0 },
    { id: 'root-link-2', title: '未分类链接 2', type: 'a', href: 'https://example.com/2', parentId: null, sortOrder: 0 }
  ])

  assert.equal(result.unclassifiedCount, 2)
  assert.deepEqual(result.items.map(item => item.label), ['01_技术开发', '未分类书签'])

  const technical = result.items[0]
  assert.equal(technical.count, 1)
  assert.deepEqual(technical.children?.map(item => item.label), ['人工智能与数据'])
  assert.deepEqual(technical.children?.[0].children?.map(item => item.label), ['OpenAI'])

  const unclassified = result.items[1]
  assert.equal(unclassified.isVirtual, true)
  assert.equal(unclassified.isFolder, true)
  assert.equal(unclassified.count, 2)
  assert.deepEqual(unclassified.children?.map(item => item.label), ['未分类链接 1', '未分类链接 2'])
})
