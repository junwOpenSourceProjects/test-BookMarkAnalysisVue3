import axios, { type AxiosRequestConfig } from 'axios'

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

const useApi = () => {
  const baseURL = '/api'

  const request = async <T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    params?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const token = process.client ? localStorage.getItem('token') : null
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }

    let queryString = ''
    if (params) {
      queryString = '?' + new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)])
      ).toString()
    }

    const response = await fetch(`${baseURL}${url}${queryString}`, options)
    const result = await response.json()

    if (result.code === 200 || result.code === 0) {
      return result as T
    } else {
      throw new Error(result.message || result.msg || '请求失败')
    }
  }

  return {
    get: <T>(url: string, params?: any) => request<T>('GET', url, undefined, params),
    post: <T>(url: string, data?: any) => request<T>('POST', url, data),
    put: <T>(url: string, data?: any) => request<T>('PUT', url, data),
    del: <T>(url: string) => request<T>('DELETE', url)
  }
}

export const bookmarkApi = {
  // 导入书签
  importBookmarks: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return useApi().post('/bookmark/import', formData)
  },
  
  // 获取统计数据
  getStats: () => {
    return useApi().get('/bookmark/stats')
  },
  
  // 获取分组统计
  getGroupStats: () => {
    return useApi().get('/bookmark/group/stats')
  },
  
  // 获取树状数据
  getTreeData: () => {
    return useApi().get('/bookmark/tree')
  },
  
  // 获取列表数据
  getListData: (params: any) => {
    return useApi().get('/bookmark/list', params)
  },
  
  // 搜索
  search: (keyword: string) => {
    return useApi().get('/bookmark/search', { keyword })
  },
  
  // AI 分类
  aiCategorize: (ids: number[]) => {
    return useApi().post('/bookmark/ai/categorize', { ids })
  }
}

export default useApi