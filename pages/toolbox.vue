<template>
  <div class="toolbox-page">
    <div class="page-header">
      <h1 class="font-display">管家工具箱</h1>
      <p class="text-muted">实用工具集合</p>
    </div>

    <!-- 操作结果反馈 -->
    <div v-if="lastResult" class="card result-card mb-6">
      <div class="result-header">
        <UIcon
          :name="lastResult.success ? 'i-ph-check-circle' : 'i-ph-warning-circle'"
          :class="lastResult.success ? 'result-icon-success' : 'result-icon-error'"
        />
        <h3 class="font-mid">{{ lastResult.toolName }}</h3>
        <UButton variant="ghost" size="sm" @click="lastResult = null">
          <UIcon name="i-ph-x" />
        </UButton>
      </div>
      <div class="result-body">
        <p v-for="(line, i) in lastResult.messages" :key="i" class="result-line">
          {{ line }}
        </p>
      </div>
    </div>

    <!-- 智能分类对话框 -->
    <div v-if="showClassifyDialog" class="card classify-dialog mb-6">
      <div class="classify-header">
        <h3 class="font-mid">智能分类</h3>
        <UButton variant="ghost" size="sm" @click="closeClassify">
          <UIcon name="i-ph-x" />
        </UButton>
      </div>

      <!-- 步骤1：选择策略 -->
      <div v-if="classifyStep === 1" class="classify-step">
        <p class="text-secondary mb-4">选择分类策略：</p>
        <div class="strategy-options">
          <label
            v-for="s in strategies"
            :key="s.value"
            class="strategy-option"
            :class="{ active: selectedStrategy === s.value }"
          >
            <input
              v-model="selectedStrategy"
              type="radio"
              :value="s.value"
              name="strategy"
            />
            <div class="strategy-info">
              <strong>{{ s.label }}</strong>
              <span class="text-muted">{{ s.desc }}</span>
            </div>
          </label>
        </div>
        <div class="ai-toggle">
          <label class="toggle-label">
            <input v-model="useAI" type="checkbox" />
            <span>AI 增强：对规则未匹配的书签调用 AI 补全标题并分类</span>
          </label>
        </div>
        <div class="classify-actions">
          <UButton
            color="primary"
            :loading="classifyLoading"
            @click="runClassify"
          >
            {{ useAI ? 'AI 智能分类' : '预览分类结果' }}
          </UButton>
        </div>
      </div>

      <!-- 步骤2：后台分类进度 -->
      <div v-if="classifyStep === 2" class="classify-step">
        <div v-if="classifyTask" class="classify-progress-card">
          <div class="classify-progress-header">
            <strong>正在后台分类，请勿关闭服务</strong>
            <span class="text-muted">{{ classifyTask.status === 'QUEUED' ? '任务排队中' : 'AI 分类进行中' }}</span>
          </div>
          <div class="classify-progress-track">
            <div class="classify-progress-bar" :style="{ width: `${classifyProgress}%` }" />
          </div>
          <div class="classify-progress-text">
            <span>总计 {{ classifyTask.total }} 条，规则匹配 {{ classifyTask.ruleMatched }} 条，AI 已完成 {{ classifyTask.aiMatched }} 条</span>
            <span v-if="classifyTask.totalBatches > 0">AI 批次 {{ classifyTask.completedBatches }} / {{ classifyTask.totalBatches }}</span>
          </div>
        </div>
      </div>

      <!-- 步骤3：预览结果 -->
      <div v-if="classifyStep === 3" class="classify-step">
        <div class="classify-stats mb-4">
          <span class="text-secondary">
            策略：<strong>{{ strategies.find(s => s.value === selectedStrategy)?.label }}</strong>
            | 共 {{ classifyStats.total }} 条
          </span>
          <div class="classify-stats-detail">
            <span class="stat-badge stat-rule">规则匹配 {{ classifyStats.ruleMatched }} 条</span>
            <span v-if="classifyStats.aiMatched > 0" class="stat-badge stat-ai">AI 补全 {{ classifyStats.aiMatched }} 条</span>
            <span v-if="classifyStats.unmatched > 0" class="stat-badge stat-unmatched">未匹配 {{ classifyStats.unmatched }} 条</span>
          </div>
        </div>

        <p v-if="classifyResultTotal > classifyResults.length" class="text-muted classify-preview-hint">
          当前仅预览前 {{ classifyResults.length }} 条结果；确认应用时会使用服务端保存的全部 {{ classifyResultTotal }} 条结果。
        </p>
        <div class="classify-results">
          <div
            v-for="item in classifyResults"
            :key="item.bookmarkId"
            class="classify-item"
            :class="{ 'low-confidence': item.confidence < 70 && item.source !== 'rule' }"
          >
            <div class="classify-item-url text-muted">{{ item.url }}</div>
            <div class="classify-item-title">
              <span v-if="item.source === 'ai' && item.suggestedTitle" class="ai-title">
                {{ item.suggestedTitle }}
              </span>
              <span v-else>
                <span v-if="item.needsTitle" class="needs-title-badge">待补全</span>
                {{ item.originalTitle || '(无标题)' }}
              </span>
            </div>
            <div class="classify-item-meta">
              <UBadge :variant="item.suggestedFolder ? 'solid' : 'outline'" size="sm">
                {{ item.suggestedFolder || '未匹配' }}
              </UBadge>
              <span v-if="item.source === 'ai'" class="source-tag ai-tag">AI</span>
              <span v-else-if="item.source === 'rule'" class="source-tag rule-tag">规则</span>
              <span v-if="item.confidence < 70 && item.source !== 'rule'" class="low-conf-tag" :title="item.aiReason">
                ⚠️ 低置信度 ({{ item.confidence }}%)
              </span>
            </div>
          </div>
        </div>

        <div class="classify-actions">
          <UButton variant="soft" @click="classifyStep = 1">返回选择</UButton>
          <UButton
            color="primary"
            :loading="classifyLoading"
            :disabled="classifyStats.ruleMatched + classifyStats.aiMatched === 0"
            @click="applyClassify"
          >
            确认应用（{{ classifyStats.ruleMatched + classifyStats.aiMatched }} 条）
          </UButton>
        </div>
      </div>
    </div>

    <div class="tools-grid">
      <div v-for="tool in tools" :key="tool.id" class="card tool-card">
        <div class="tool-icon">
          <UIcon :name="tool.icon" />
        </div>
        <div class="tool-content">
          <h3 class="font-mid">{{ tool.name }}</h3>
          <p class="text-muted">{{ tool.description }}</p>
        </div>
        <UButton
          variant="soft"
          size="sm"
          :loading="loadingId === tool.id"
          :disabled="loadingId === tool.id"
          @click="handleUseTool(tool)"
        >
          {{ loadingId === tool.id ? tool.loadingText || '执行中…' : '使用' }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'default'
})

interface ToolResult {
  toolName: string
  success: boolean
  messages: string[]
}

interface Tool {
  id: number
  name: string
  description: string
  icon: string
  loadingText?: string
}

interface ClassifyItem {
  bookmarkId: string
  url: string
  originalTitle: string
  needsTitle: boolean
  suggestedTitle?: string
  suggestedFolder: string | null
  confidence?: number
  source?: 'rule' | 'ai' | 'unmatched'
  aiReason?: string
}

interface ClassifyTask {
  taskId: string
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  total: number
  ruleMatched: number
  aiMatched: number
  unmatched: number
  completedBatches: number
  totalBatches: number
  errorMessage?: string
  resultTotal?: number
}

const loadingId = ref<number | null>(null)
const lastResult = ref<ToolResult | null>(null)
const toast = useToast()

// 智能分类状态
const showClassifyDialog = ref(false)
const classifyStep = ref(1)
const classifyLoading = ref(false)
const selectedStrategy = ref('function')
const useAI = ref(true)
const classifyResults = ref<ClassifyItem[]>([])
const classifyResultTotal = ref(0)
const classifyStats = ref({ total: 0, ruleMatched: 0, aiMatched: 0, unmatched: 0 })
const classifyTask = ref<ClassifyTask | null>(null)
let classifyPollTimer: ReturnType<typeof setInterval> | null = null

const classifyProgress = computed(() => {
  if (!classifyTask.value) return 0
  if (classifyTask.value.status === 'COMPLETED') return 100
  if (classifyTask.value.totalBatches === 0) return 0
  return Math.round((classifyTask.value.completedBatches / classifyTask.value.totalBatches) * 100)
})

const strategies = [
  { value: 'function', label: '按功能分类', desc: '根据网站功能归类（开发工具、视频娱乐、新闻资讯等）' },
  { value: 'domain', label: '按域名分类', desc: '按域名精确分组（github.com、zhihu.com 等）' },
  { value: 'region', label: '按国内外分类', desc: '根据域名后缀和语言分为国内/国外' }
]

const tools = ref<Tool[]>([
  { id: 7, name: '智能分类', description: 'AI + 规则引擎自动分类书签', icon: 'i-ph-brain' },
  { id: 1, name: '批量标签管理', description: '批量添加或移除书签标签', icon: 'i-ph-tag' },
  { id: 2, name: '失效链接检测', description: '检测书签中的失效链接', icon: 'i-ph-link-break', loadingText: '正在启动扫描…' },
  { id: 3, name: '数据导出', description: '导出书签数据为多种格式', icon: 'i-ph-export' },
  { id: 4, name: '重复检测', description: '查找重复的书签链接', icon: 'i-ph-copy', loadingText: '正在扫描重复…' },
  { id: 5, name: '标签合并', description: '合并相似的标签', icon: 'i-ph-git-merge' },
  { id: 6, name: '数据清理', description: '清理无效书签数据', icon: 'i-ph-broom', loadingText: '正在清理…' }
])

// 智能分类
const updateClassifyStats = (task: ClassifyTask) => {
  classifyStats.value = {
    total: task.total || 0,
    ruleMatched: task.ruleMatched || 0,
    aiMatched: task.aiMatched || 0,
    unmatched: task.unmatched || 0
  }
}

const stopClassifyPolling = () => {
  if (classifyPollTimer) {
    clearInterval(classifyPollTimer)
    classifyPollTimer = null
  }
}

const pollClassifyTask = async () => {
  const taskId = classifyTask.value?.taskId
  if (!taskId) return

  try {
    const statusRes = await bookmarkApi.get<ClassifyTask>(`/BookMarks/toolbox/classify/task/${taskId}`)
    const task = statusRes.data as ClassifyTask
    classifyTask.value = task
    updateClassifyStats(task)

    if (task.status === 'FAILED') {
      stopClassifyPolling()
      toast.add({ title: task.errorMessage || '智能分类任务失败', color: 'error' })
      classifyStep.value = 1
      return
    }

    if (task.status !== 'COMPLETED') return

    stopClassifyPolling()
    const resultRes = await bookmarkApi.get<any>(`/BookMarks/toolbox/classify/task/${taskId}/result`, { limit: 200 })
    const result = resultRes.data as any
    classifyResults.value = result.results || []
    classifyResultTotal.value = result.resultTotal || classifyResults.value.length
    classifyTask.value = result as ClassifyTask
    updateClassifyStats(result as ClassifyTask)
    classifyStep.value = 3
  } catch (error: any) {
    stopClassifyPolling()
    toast.add({ title: error.message || '查询分类任务进度失败', color: 'error' })
    classifyStep.value = 1
  }
}

const runClassify = async () => {
  classifyLoading.value = true
  try {
    const res = await bookmarkApi.post<ClassifyTask>('/BookMarks/toolbox/classify/start', {
      strategy: selectedStrategy.value,
      useAI: useAI.value
    })
    classifyTask.value = res.data as ClassifyTask
    updateClassifyStats(classifyTask.value)
    classifyResults.value = []
    classifyResultTotal.value = 0
    classifyStep.value = 2
    stopClassifyPolling()
    classifyPollTimer = setInterval(() => { void pollClassifyTask() }, 2000)
    await pollClassifyTask()
  } catch (error: any) {
    toast.add({ title: error.message || '启动分类任务失败', color: 'error' })
  } finally {
    classifyLoading.value = false
  }
}

const applyClassify = async () => {
  const taskId = classifyTask.value?.taskId
  if (!taskId) return

  classifyLoading.value = true
  try {
    const res = await bookmarkApi.post(`/BookMarks/toolbox/classify/task/${taskId}/apply`, {})
    const stats = res.data as any
    lastResult.value = {
      toolName: '智能分类',
      success: true,
      messages: [
        '✅ 分类完成',
        `📁 创建 ${stats?.createdFolders || 0} 个文件夹`,
        `📝 补全 ${stats?.updatedTitles || 0} 个标题`,
        `📑 归类 ${stats?.movedBookmarks || 0} 条书签`,
        `策略：${strategies.find(s => s.value === selectedStrategy)?.label}`
      ]
    }
    closeClassify()
  } catch (error: any) {
    toast.add({ title: error.message || '应用分类失败', color: 'error' })
  } finally {
    classifyLoading.value = false
  }
}

const closeClassify = () => {
  stopClassifyPolling()
  showClassifyDialog.value = false
  classifyStep.value = 1
  classifyResults.value = []
  classifyResultTotal.value = 0
  classifyTask.value = null
}

onBeforeUnmount(stopClassifyPolling)

// 工具调用
const handleUseTool = async (tool: Tool) => {
  // 智能分类：打开对话框
  if (tool.id === 7) {
    showClassifyDialog.value = true
    classifyStep.value = 1
    return
  }

  loadingId.value = tool.id
  try {
    switch (tool.id) {
      case 2: {
        await bookmarkApi.post('/BookMarks/toolbox/scanDeadLinks/start', {})
        lastResult.value = {
          toolName: '失效链接检测',
          success: true,
          messages: [
            '✅ 死链扫描任务已启动',
            '系统正在后台异步检测所有书签链接的可访问性',
            '检测完成后可在管理器页面查看结果'
          ]
        }
        break
      }

      case 3: {
        window.open('/BookMarks/export?format=html', '_blank')
        lastResult.value = {
          toolName: '数据导出',
          success: true,
          messages: [
            '✅ 导出任务已在新标签页打开',
            '导出格式：HTML（可导入浏览器）',
            '如需其他格式（Markdown / JSON），请在 URL 中修改 format 参数'
          ]
        }
        break
      }

      case 4: {
        const res = await bookmarkApi.post('/BookMarks/toolbox/deduplicate', {})
        const data = res.data as any
        const deleted = data?.deletedCount ?? 0
        const groups = data?.duplicateGroups ?? 0
        const checked = data?.totalChecked ?? 0
        if (deleted === 0) {
          lastResult.value = {
            toolName: '重复检测',
            success: true,
            messages: [
              `📊 共检查 ${checked} 条书签`,
              '✅ 未发现重复链接，无需清理'
            ]
          }
        } else {
          lastResult.value = {
            toolName: '重复检测',
            success: true,
            messages: [
              `📊 共检查 ${checked} 条书签`,
              `🔍 发现 ${groups} 组重复链接`,
              `🗑️ 已删除 ${deleted} 条重复书签（每组保留最早的一条）`
            ]
          }
        }
        break
      }

      case 6: {
        if (!(await useConfirm().confirm('确定要清理所有书签数据吗？此操作不可恢复。'))) {
          lastResult.value = {
            toolName: '数据清理',
            success: false,
            messages: ['⚠️ 操作已取消']
          }
          break
        }
        const res = await bookmarkApi.post('/BookMarks/toolbox/reset', {})
        const data = res.data as any
        const deleted = data?.deletedCount ?? 0
        lastResult.value = {
          toolName: '数据清理',
          success: true,
          messages: [
            '✅ 数据清理完成',
            `🗑️ 共清理 ${deleted} 条书签记录`,
            '数据库已恢复为空状态'
          ]
        }
        break
      }

      default:
        lastResult.value = {
          toolName: tool.name,
          success: false,
          messages: ['🚧 该功能尚未实现，敬请期待']
        }
    }
  } catch (error: any) {
    lastResult.value = {
      toolName: tool.name,
      success: false,
      messages: [`❌ 执行失败：${error.message || '未知错误'}`]
    }
  } finally {
    loadingId.value = null
  }
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

.mb-6 {
  margin-bottom: 24px;
}

/* 结果卡片 */
.result-card {
  border-radius: 20px;
  padding: 20px;
  border: 1px solid var(--color-border-light);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.result-header h3 {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
}

.result-icon-success {
  font-size: 24px;
  color: #22c55e;
}

.result-icon-error {
  font-size: 24px;
  color: #ef4444;
}

.result-body {
  padding-left: 36px;
}

.result-line {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.8;
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

/* 智能分类对话框 */
.classify-dialog {
  border-radius: 20px;
  padding: 24px;
  border: 1px solid var(--color-border-light);
}

.classify-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.classify-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.classify-step {
  min-height: 120px;
}

.mb-4 {
  margin-bottom: 16px;
}

.strategy-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.strategy-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 2px solid var(--color-border-light);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.strategy-option.active {
  border-color: var(--color-brand);
  background-color: rgba(20, 86, 240, 0.04);
}

.strategy-option:hover {
  border-color: var(--color-border);
}

.strategy-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.strategy-info strong {
  font-size: 15px;
}

.strategy-info span {
  font-size: 13px;
}

.classify-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.classify-progress-card {
  padding: 20px;
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  background-color: var(--color-bg-secondary);
}

.classify-progress-header,
.classify-progress-text {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
}

.classify-progress-track {
  height: 8px;
  overflow: hidden;
  margin: 16px 0 12px;
  border-radius: 999px;
  background: var(--color-border-light);
}

.classify-progress-bar {
  height: 100%;
  border-radius: inherit;
  background: var(--color-brand);
  transition: width 0.3s ease;
}

.classify-preview-hint {
  margin: 0 0 12px;
  font-size: 13px;
}

.classify-stats {
  font-size: 14px;
  padding: 12px;
  background-color: var(--color-bg-secondary);
  border-radius: 8px;
}

.classify-stats-detail {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.stat-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.stat-rule {
  background-color: #dbeafe;
  color: #1e40af;
}

.stat-ai {
  background-color: #ede9fe;
  color: #6b21a8;
}

.stat-unmatched {
  background-color: #fef3c7;
  color: #92400e;
}

.ai-toggle {
  padding: 12px 0;
  margin-bottom: 8px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.text-success {
  color: #22c55e;
}

.text-warning {
  color: #f59e0b;
}

.classify-results {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.classify-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  background-color: var(--color-bg-secondary);
}

.classify-item-url {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.classify-item-title {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.needs-title-badge {
  font-size: 11px;
  padding: 1px 6px;
  background-color: #fef3c7;
  color: #92400e;
  border-radius: 4px;
  white-space: nowrap;
}

.classify-item-folder {
  font-size: 13px;
}

.classify-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.ai-title {
  color: #6b21a8;
  font-weight: 500;
}

.source-tag {
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 3px;
}

.ai-tag {
  background-color: #ede9fe;
  color: #6b21a8;
}

.rule-tag {
  background-color: #dbeafe;
  color: #1e40af;
}

.low-conf-tag {
  font-size: 11px;
  color: #dc2626;
  cursor: help;
}

.low-confidence {
  border-left: 3px solid #fca5a5;
}
</style>
