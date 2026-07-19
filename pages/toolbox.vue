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

    <!-- 可恢复 AI 重分类对话框 -->
    <div v-if="showClassifyDialog" class="card classify-dialog mb-6">
      <div class="classify-header">
        <h3 class="font-mid">AI 全量重新分类</h3>
        <UButton variant="ghost" size="sm" @click="closeClassify">
          <UIcon name="i-ph-x" />
        </UButton>
      </div>

      <div v-if="!classifyTask" class="classify-step">
        <p class="text-secondary mb-3">
          开始重新分类会立即清空现有文件夹结构；书签链接会保留。
        </p>
        <p class="text-muted">
          系统先按主域名整理 5 条及以上的书签，再用 AI 将零散书签按主题归类。任务进度和结果保存在数据库中，服务重启后可手动继续。
        </p>
        <div class="classify-actions">
          <UButton color="primary" :loading="classifyLoading" @click="startReclassification">
            开始重新分类
          </UButton>
        </div>
      </div>

      <div v-else class="classify-step">
        <div class="classify-progress-card">
          <div class="classify-progress-header">
            <strong>{{ reclassificationStatusLabel(classifyTask.status) }}</strong>
            <span class="text-muted">{{ reclassificationPhaseLabel(classifyTask.phase) }}</span>
          </div>
          <div class="classify-progress-track">
            <div class="classify-progress-bar" :style="{ width: `${classifyProgress}%` }" />
          </div>
          <div class="classify-progress-text">
            <span>工作单元 {{ classifyTask.completedWorkUnits }} / {{ classifyTask.totalWorkUnits }}</span>
            <span>书签 {{ classifyTask.totalBookmarks }} 条</span>
          </div>
        </div>

        <div class="classify-stats mt-4">
          <div class="classify-stats-detail">
            <span class="stat-badge stat-rule">大域名组 {{ classifyTask.largeDomainGroups }} 个</span>
            <span class="stat-badge stat-ai">零散书签 {{ classifyTask.smallPoolBookmarks }} 条</span>
            <span v-if="classifyTask.recoveryCount > 0" class="stat-badge stat-unmatched">已恢复 {{ classifyTask.recoveryCount }} 次</span>
          </div>
          <p v-if="classifyTask.errorMessage" class="task-error">{{ classifyTask.errorMessage }}</p>
        </div>

        <div v-if="classifyTask.status === 'COMPLETED'" class="classify-outcome">
          <strong class="text-success">已自动应用分类结果</strong>
          <span>已创建 {{ classifyTask.createdFolders }} 个文件夹</span>
          <span>已移动 {{ classifyTask.movedBookmarks }} 条书签</span>
          <span>已更新 {{ classifyTask.updatedTitles }} 个标题</span>
        </div>

        <div class="classify-actions">
          <UButton
            v-if="classifyTask.status === 'RUNNING'"
            color="warning"
            variant="soft"
            :loading="classifyLoading"
            @click="pauseReclassification"
          >
            暂停
          </UButton>
          <UButton
            v-if="classifyTask.status === 'PAUSED' || classifyTask.status === 'RECOVERABLE'"
            color="primary"
            :loading="classifyLoading"
            @click="resumeReclassification(classifyTask.taskId)"
          >
            继续
          </UButton>
          <UButton variant="soft" @click="closeClassify">关闭</UButton>
        </div>
      </div>

      <div v-if="recoverableTasks.length && !classifyTask" class="recoverable-tasks">
        <strong>可继续的历史任务</strong>
        <div v-for="task in recoverableTasks" :key="task.taskId" class="recoverable-task">
          <div>
            <span>{{ reclassificationStatusLabel(task.status) }}</span>
            <span class="text-muted"> · {{ reclassificationPhaseLabel(task.phase) }}</span>
            <span class="text-muted"> · {{ task.completedWorkUnits }} / {{ task.totalWorkUnits }}</span>
          </div>
          <UButton size="xs" :loading="classifyLoading" @click="resumeReclassification(task.taskId)">继续</UButton>
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

interface ReclassificationTask {
  taskId: string
  status: 'QUEUED' | 'RUNNING' | 'PAUSED' | 'RECOVERABLE' | 'COMPLETED' | 'FAILED'
  phase: string
  totalBookmarks: number
  totalWorkUnits: number
  completedWorkUnits: number
  largeDomainGroups: number
  smallPoolBookmarks: number
  createdFolders: number
  movedBookmarks: number
  updatedTitles: number
  recoveryCount: number
  treeClearedAt?: string
  errorMessage?: string
}

const loadingId = ref<number | null>(null)
const lastResult = ref<ToolResult | null>(null)
const toast = useToast()

// 可恢复 AI 重分类状态
const showClassifyDialog = ref(false)
const classifyLoading = ref(false)
const classifyTask = ref<ReclassificationTask | null>(null)
const recoverableTasks = ref<ReclassificationTask[]>([])
let classifyPollTimer: ReturnType<typeof setInterval> | null = null

const tools = ref<Tool[]>([
  { id: 7, name: '重新分类', description: '可暂停、可恢复的全量目录重建', icon: 'i-ph-brain' },
  { id: 1, name: '批量标签管理', description: '批量添加或移除书签标签', icon: 'i-ph-tag' },
  { id: 2, name: '失效链接检测', description: '检测书签中的失效链接', icon: 'i-ph-link-break', loadingText: '正在启动扫描…' },
  { id: 3, name: '数据导出', description: '导出书签数据为多种格式', icon: 'i-ph-export' },
  { id: 4, name: '重复检测', description: '查找重复的书签链接', icon: 'i-ph-copy', loadingText: '正在扫描重复…' },
  { id: 5, name: '标签合并', description: '合并相似的标签', icon: 'i-ph-git-merge' },
  { id: 6, name: '数据清理', description: '清理无效书签数据', icon: 'i-ph-broom', loadingText: '正在清理…' }
])

const classifyProgress = computed(() => {
  const task = classifyTask.value
  if (!task) return 0
  if (task.status === 'COMPLETED') return 100
  if (task.totalWorkUnits === 0) return 0
  return Math.round((task.completedWorkUnits / task.totalWorkUnits) * 100)
})

const reclassificationStatusLabel = (status: ReclassificationTask['status']) => ({
  QUEUED: '任务准备中',
  RUNNING: '正在重新分类',
  PAUSED: '任务已暂停',
  RECOVERABLE: '任务等待恢复',
  COMPLETED: '重新分类完成',
  FAILED: '任务失败'
})[status] || status

const reclassificationPhaseLabel = (phase: string) => ({
  PREPARING: '正在生成快照并清空旧目录',
  LARGE_DOMAINS: '正在处理大域名组',
  SMALL_ANALYSIS: '正在分析零散书签',
  SMALL_CLUSTER_DRAFTS: '正在聚合零散主题',
  SMALL_CANONICALIZATION: '正在规范目录名称',
  APPLYING: '正在应用分类结果'
})[phase] || phase

const stopClassifyPolling = () => {
  if (classifyPollTimer) {
    clearInterval(classifyPollTimer)
    classifyPollTimer = null
  }
}

const shouldPollTask = (task?: ReclassificationTask | null) =>
  task?.status === 'QUEUED' || task?.status === 'RUNNING'

const loadRecoverableTasks = async () => {
  try {
    const res = await bookmarkApi.get<ReclassificationTask[]>('/BookMarks/toolbox/reclassification/recoverable')
    recoverableTasks.value = res.data || []
  } catch (error) {
    console.warn('加载可恢复分类任务失败', error)
  }
}

const pollClassifyTask = async () => {
  const taskId = classifyTask.value?.taskId
  if (!taskId) return

  try {
    const res = await bookmarkApi.get<ReclassificationTask>(`/BookMarks/toolbox/reclassification/task/${taskId}`)
    classifyTask.value = res.data
    if (!shouldPollTask(classifyTask.value)) {
      stopClassifyPolling()
      await loadRecoverableTasks()
    }
  } catch (error: any) {
    stopClassifyPolling()
    toast.add({ title: error.message || '查询重分类任务进度失败', color: 'error' })
  }
}

const startPolling = () => {
  stopClassifyPolling()
  if (shouldPollTask(classifyTask.value)) {
    classifyPollTimer = setInterval(() => { void pollClassifyTask() }, 2000)
  }
}

const startReclassification = async () => {
  classifyLoading.value = true
  try {
    const res = await bookmarkApi.post<ReclassificationTask>('/BookMarks/toolbox/reclassification/start', {})
    classifyTask.value = res.data
    startPolling()
    await pollClassifyTask()
  } catch (error: any) {
    toast.add({ title: error.message || '启动重新分类失败', color: 'error' })
  } finally {
    classifyLoading.value = false
  }
}

const pauseReclassification = async () => {
  const taskId = classifyTask.value?.taskId
  if (!taskId) return
  classifyLoading.value = true
  try {
    const res = await bookmarkApi.post<ReclassificationTask>(`/BookMarks/toolbox/reclassification/task/${taskId}/pause`, {})
    classifyTask.value = res.data
    stopClassifyPolling()
    await loadRecoverableTasks()
  } catch (error: any) {
    toast.add({ title: error.message || '暂停重分类任务失败', color: 'error' })
  } finally {
    classifyLoading.value = false
  }
}

const resumeReclassification = async (taskId: string) => {
  classifyLoading.value = true
  try {
    const res = await bookmarkApi.post<ReclassificationTask>(`/BookMarks/toolbox/reclassification/task/${taskId}/resume`, {})
    classifyTask.value = res.data
    startPolling()
    await pollClassifyTask()
    await loadRecoverableTasks()
  } catch (error: any) {
    toast.add({ title: error.message || '继续重分类任务失败', color: 'error' })
  } finally {
    classifyLoading.value = false
  }
}

const closeClassify = () => {
  stopClassifyPolling()
  showClassifyDialog.value = false
  classifyTask.value = null
}

onMounted(() => { void loadRecoverableTasks() })
onBeforeUnmount(stopClassifyPolling)

// 工具调用
const handleUseTool = async (tool: Tool) => {
  // AI 重新分类：打开数据库持久化的任务控制面板
  if (tool.id === 7) {
    showClassifyDialog.value = true
    void loadRecoverableTasks()
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

.task-error {
  margin: 12px 0 0;
  color: #b45309;
  font-size: 13px;
}

.classify-outcome {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 16px;
  padding: 14px;
  border-radius: 10px;
  background-color: #f0fdf4;
  color: #166534;
  font-size: 14px;
}

.recoverable-tasks {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--color-border-light);
  font-size: 14px;
}

.recoverable-task {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background-color: var(--color-bg-secondary);
}

</style>
