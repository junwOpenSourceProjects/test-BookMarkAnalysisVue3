/**
 * 基于浏览器原生 window.confirm 的简单确认对话框组合式函数。
 * 替代 @nuxt/ui 中不存在的 useConfirm。
 */
export async function confirm(message: string): Promise<boolean> {
  if (process.client && typeof window !== 'undefined') {
    return window.confirm(message)
  }
  return false
}

export function useConfirm() {
  return { confirm }
}
