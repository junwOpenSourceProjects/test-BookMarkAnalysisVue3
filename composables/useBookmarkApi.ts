interface ApiResponse<T = any> {
  code: number
  message?: string
  msg?: string
  data: T
}

const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = (config.public.baseURL as string | undefined) ?? ''

  const request = async <T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    params?: any
  ): Promise<ApiResponse<T>> => {
    const token = process.client ? localStorage.getItem('token') : null

    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }

    // 仅在非 FormData 时设置 JSON Content-Type；FormData 由浏览器自动设置 boundary
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
    if (!isFormData) {
      headers['Content-Type'] = 'application/json;charset=UTF-8'
    }

    const options: RequestInit = {
      method,
      headers
    }

    if (data && method !== 'GET') {
      options.body = isFormData ? data : JSON.stringify(data)
    }

    let queryString = ''
    if (params) {
      queryString =
        '?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)])
        ).toString()
    }

    const response = await fetch(`${baseURL}${url}${queryString}`, options)
    const result = (await response.json()) as ApiResponse<T>

    if (result.code === 200) {
      return result
    } else {
      throw new Error(result.msg || result.message || '请求失败')
    }
  }

  return {
    get: <T>(url: string, params?: any) => request<T>('GET', url, undefined, params),
    post: <T>(url: string, data?: any) => request<T>('POST', url, data),
    put: <T>(url: string, data?: any) => request<T>('PUT', url, data),
    del: <T>(url: string, data?: any) => request<T>('DELETE', url, data)
  }
}

export const bookmarkApi = {
  // 底层请求助手（供工具箱等调用任意接口）
  get: <T>(url: string, params?: any) => useApi().get<T>(url, params),
  post: <T>(url: string, data?: any) => useApi().post<T>(url, data),
  put: <T>(url: string, data?: any) => useApi().put<T>(url, data),
  del: <T>(url: string, data?: any) => useApi().del<T>(url, data),

  // 导入书签文件（自动识别 HTML / plist 格式）
  importBookmarks: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return useApi().post('/BookMarks/upload/auto', formData)
  },

  // 获取仪表盘统计数据
  getStats: () => {
    return useApi().get('/BookMarks/stats')
  },

  // 获取分组统计（用于图表展示域名分布）
  getGroupStats: () => {
    return useApi().get('/BookMarks/analyze')
  },

  // 获取完整树状数据
  getTreeData: () => {
    return useApi().get('/BookMarks/all')
  },

  // 获取分页列表数据
  getListData: (params: { page?: number; limit?: number; keyword?: string }) => {
    return useApi().get('/BookMarks/list', params)
  },

  // 关键词搜索
  search: (keyword: string, page?: number, limit?: number) => {
    return useApi().get('/BookMarks/search', { keyword, page, limit })
  },

  // AI 智能分类
  aiCategorize: (ids: number[]) => {
    return useApi().post('/BookMarks/toolbox/ai/categorize', { bookmarkIds: ids })
  },

  // 批量删除节点
  deleteBookmarks: (ids: number[]) => {
    return useApi().post('/BookMarks/deleteNodes', ids)
  }
}

export default useApi
