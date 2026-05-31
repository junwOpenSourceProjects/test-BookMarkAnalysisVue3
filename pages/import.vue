<template>
  <div class="import-page">
    <div class="page-header">
      <h1 class="font-display">导入书签数据</h1>
      <p class="text-muted">从浏览器或文件导入书签</p>
    </div>

    <div class="card import-card">
      <div class="upload-area">
        <UIcon name="i-ph-upload-simple" class="upload-icon" />
        <h3 class="font-mid">拖拽文件到此处</h3>
        <p class="text-muted">或点击选择文件</p>
        <UInput 
          type="file" 
          accept=".html,.json"
          @change="handleFileSelect"
          class="file-input"
        />
      </div>

      <div class="import-options">
        <h4 class="font-mid">导入来源</h4>
        <div class="option-list">
          <UButton variant="soft" @click="handleChromeImport">
            <UIcon name="i-ph-browser" />
            Chrome 书签
          </UButton>
          <UButton variant="soft" @click="handleFirefoxImport">
            <UIcon name="i-ph-fire" />
            Firefox 书签
          </UButton>
          <UButton variant="soft" @click="handleEdgeImport">
            <UIcon name="i-ph-edge-logo" />
            Edge 书签
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'default'
})

const fileList = ref<File[]>([])

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    const file = input.files[0]
    try {
      await bookmarkApi.importBookmarks(file)
      useToast().add({ title: '导入成功', color: 'success' })
    } catch (error: any) {
      useToast().add({ title: error.message || '导入失败', color: 'error' })
    }
  }
}

const handleChromeImport = () => {
  useToast().add({ title: '请选择 Chrome 导出的 HTML 文件', color: 'info' })
}

const handleFirefoxImport = () => {
  useToast().add({ title: '请选择 Firefox 导出的 HTML 文件', color: 'info' })
}

const handleEdgeImport = () => {
  useToast().add({ title: '请选择 Edge 导出的 HTML 文件', color: 'info' })
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

.upload-area {
  border: 2px dashed var(--color-border);
  border-radius: 16px;
  padding: 48px;
  text-align: center;
  margin-bottom: 32px;
  position: relative;
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

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
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
</style>