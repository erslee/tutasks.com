import type { Task } from '../types/task'

export interface ApiResponse {
  success?: boolean
  error?: string
  details?: string
  [key: string]: unknown
}

export interface AddTaskRequest {
  sheetId: string
  monthSheetName: string
  number: string
  description: string
  date: string
  time: string
  uid?: string
}

export interface UpdateTaskRequest {
  sheetId: string
  monthSheetName: string
  uid: string
  number: string
  description: string
  date: string
  time: string
}

export interface DeleteTaskRequest {
  sheetId: string
  monthSheetName: string
  uid: string
}

export interface BatchAppendRequest {
  sheetId: string
  monthSheetName: string
  values: string[][]
}

export interface CreateSheetRequest {
  name: string
}

export interface Sheet {
  id: string
  name: string
}

export interface CheckIdentifierResponse {
  hasIdentifier: boolean
  version?: string
}

export interface GetAllTasksResponse {
  tasks: Task[]
}

export interface ListSheetsResponse {
  sheets: Sheet[]
}

class ApiClient {
  private baseUrl = '/api'

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    }

    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return data
  }

  // Sheet management
  async listSheets(): Promise<ListSheetsResponse> {
    return this.request<ListSheetsResponse>('/sheets/list')
  }

  async createSheet(request: CreateSheetRequest): Promise<Sheet> {
    return this.request<Sheet>('/sheets/create', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async checkIdentifier(sheetId: string): Promise<CheckIdentifierResponse> {
    return this.request<CheckIdentifierResponse>(
      `/sheets/check-identifier?sheetId=${encodeURIComponent(sheetId)}`
    )
  }

  // Task management
  async getAllTasks(sheetId: string): Promise<GetAllTasksResponse> {
    return this.request<GetAllTasksResponse>(
      `/sheets/get-all-tasks?sheetId=${encodeURIComponent(sheetId)}`
    )
  }

  async addTask(request: AddTaskRequest): Promise<ApiResponse> {
    return this.request<ApiResponse>('/sheets/add-task', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async updateTask(request: UpdateTaskRequest): Promise<ApiResponse> {
    return this.request<ApiResponse>('/sheets/update-task', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async deleteTask(request: DeleteTaskRequest): Promise<ApiResponse> {
    return this.request<ApiResponse>('/sheets/delete-task', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async batchAppend(request: BatchAppendRequest): Promise<ApiResponse> {
    return this.request<ApiResponse>('/sheets/batch-append', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export class for testing purposes
export { ApiClient }
