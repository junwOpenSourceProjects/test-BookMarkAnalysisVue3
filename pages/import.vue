<template>
  <div class="import-page">
    <div class="page-header">
      <h1 class="font-display">导入书签数据</h1>
      <p class="text-muted">从浏览器或文件导入书签</p>
    </div>

    <div class="card import-card">
      <!-- 隐藏的文件输入，由拖拽区域和浏览器按钮共同触发 -->
      <input
        ref="fileInput"
        type="file"
        accept=".html,.htm,.plist"
        class="hidden-file-input"
        @change="handleFileSelect"
      />

      <div class="upload-area" @click="triggerFileSelect">
        <UIcon name="i-ph-upload-simple" class="upload-icon" />
        <h3 class="font-mid">拖拽文件到此处</h3>
        <p class="text-muted">或点击选择文件</p>
      </div>

      <div class="import-options">
        <h4 class="font-mid">导入来源</h4>
        <div class="option-list">
          <UButton
            variant="soft"
            :loading="uploading"
            :disabled="uploading"
            @click="triggerFileSelect"
          >
            <UIcon name="i-ph-browser" />
            Chrome 书签
          </UButton>
          <UButton
            variant="soft"
            :loading="uploading"
            :disabled="uploading"
            @click="triggerFileSelect"
          >
            <UIcon name="i-ph-fire" />
            Firefox 书签
          </UButton>
          <UButton
            variant="soft"
            :loading="uploading"
            :disabled="uploading"
            @click="triggerFileSelect"
          >
            <UIcon name="i-ph-globe" />
            Edge 书签
          </UButton>
        </div>
        <p class="option-hint text-muted">
          请选择浏览器导出的 HTML（Chrome / Firefox / Edge）或 plist（Safari）书签文件。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 使用默认布局
definePageMeta({
  layout: 'default'
})

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const toast = useToast()

// 触发隐藏文件输入框
const triggerFileSelect = () => {
  if (uploading.value) return
  fileInput.value?.click()
}

// 处理文件选择并上传
const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    await bookmarkApi.importBookmarks(file)
    toast.add({ title: '导入成功', color: 'success' })
  } catch (error: any) {
    toast.add({ title: error.message || '导入失败', color: 'error' })
  } finally {
    uploading.value = false
    // 清空 input 值，允许重复选择同一文件
    if (input) input.value = ''
  }
}
</script>

<style scoped>
.import-page {
  padding-bottom: 64px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.import-card {
  border-radius: 20px;
}

.hidden-file-input {
  display: none;
}

.upload-area {
  border: 2px dashed var(--color-border);
  border-radius: 16px;
  padding: 48px;
  text-align: center;
  margin-bottom: 32px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.upload-area:hover {
  background-color: var(--color-bg-secondary);
}

.upload-icon {
  font-size: 48px;
  color: var(--color-text-muted);
  margin-bottom: 16px;
}

.upload-area h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.import-options h4 {
  font-size: 16px;
  margin-bottom: 16px;
}

.option-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.option-hint {
  margin-top: 16px;
  font-size: 13px;
}
</style>
