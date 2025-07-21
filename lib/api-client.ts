const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

// 汎用API呼び出し関数
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// モックデータ
const mockManagementOffices = [
  {
    id: 1,
    office_name: "本社保守事業所",
    office_code: "HQ001",
    responsible_area: "関東エリア",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    office_name: "関西支社保守事業所",
    office_code: "KS001",
    responsible_area: "関西エリア",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

const mockBases = [
  {
    id: 1,
    base_name: "本社保守基地",
    base_type: "maintenance",
    location: "東京",
    management_office_id: 1,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    base_name: "品川保守基地",
    base_type: "maintenance",
    location: "東京",
    management_office_id: 1,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 3,
    base_name: "関西保守基地",
    base_type: "maintenance",
    location: "大阪",
    management_office_id: 2,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

const mockVehicles = [
  {
    id: 1,
    machine_number: "M001",
    vehicle_type: "モータカー",
    model: "MC-100",
    manufacturer: "メーカーA",
    acquisition_date: "2020-04-01",
    management_office_id: 1,
    home_base_id: 1,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    machine_number: "M002",
    vehicle_type: "モータカー",
    model: "MC-100",
    manufacturer: "メーカーA",
    acquisition_date: "2020-05-01",
    management_office_id: 1,
    home_base_id: 1,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 3,
    machine_number: "MCR001",
    vehicle_type: "MCR",
    model: "MCR-300",
    manufacturer: "メーカーC",
    acquisition_date: "2019-06-01",
    management_office_id: 2,
    home_base_id: 3,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 4,
    machine_number: "T001",
    vehicle_type: "鉄トロ（10t）",
    model: "TT-10",
    manufacturer: "メーカーD",
    acquisition_date: "2018-08-01",
    management_office_id: 2,
    home_base_id: 3,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

// API呼び出し用のユーティリティ関数
const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  },

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  },
}

// APIクライアントのキャッシュ機能
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// キャッシュのTTL（ミリ秒）
const CACHE_TTL = 5 * 60 * 1000 // 5分

// キャッシュからデータを取得
function getFromCache(key: string): any | null {
  const cached = cache.get(key)
  if (!cached) return null

  const now = Date.now()
  if (now - cached.timestamp > cached.ttl) {
    cache.delete(key)
    return null
  }

  return cached.data
}

// キャッシュにデータを保存
function setCache(key: string, data: any, ttl: number = CACHE_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  })
}

// キャッシュをクリア
export function clearCache(): void {
  cache.clear()
}

// キャッシュ付きのAPI呼び出し
export async function cachedFetch(url: string, options?: RequestInit, ttl?: number): Promise<any> {
  const cacheKey = `${url}-${JSON.stringify(options || {})}`
  
  // キャッシュから取得を試行
  const cached = getFromCache(cacheKey)
  if (cached) {
    return cached
  }

  // API呼び出し
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`)
  }

  const data = await response.json()
  
  // キャッシュに保存
  setCache(cacheKey, data, ttl)
  
  return data
}

// 事業所データの取得（キャッシュ付き）
export async function getManagementOffices() {
  return cachedFetch('/api/management-offices', {}, 2 * 60 * 1000) // 2分キャッシュ
}

// 保守基地データの取得（キャッシュ付き）
export async function getMaintenanceBases() {
  return cachedFetch('/api/maintenance-bases', {}, 2 * 60 * 1000) // 2分キャッシュ
}

// 車両データの取得（キャッシュ付き）
export async function getVehicles() {
  return cachedFetch('/api/vehicles', {}, 1 * 60 * 1000) // 1分キャッシュ
}

// データ作成・更新・削除時はキャッシュをクリア
export async function invalidateCache(): Promise<void> {
  clearCache()
}

// モックデータを返すヘルパー関数
function getMockData(url: string) {
  const currentMonth = new Date().toISOString().slice(0, 7)

  if (url.includes("/api/management-offices")) {
    return mockManagementOffices
  } else if (url.includes("/api/bases")) {
    return mockBases
  } else if (url.includes("/api/vehicles")) {
    return mockVehicles
  } else if (url.includes("/api/operation-plans")) {
    return [
      {
        id: 1,
        vehicle_id: 1,
        plan_date: `${currentMonth}-15`,
        shift_type: "day",
        departure_base_id: 1,
        arrival_base_id: 1,
        planned_distance: 50,
        start_time: "08:00",
        end_time: "17:00",
        status: "planned",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        vehicle: mockVehicles[0],
        departure_base: mockBases[0],
        arrival_base: mockBases[0],
      },
      {
        id: 2,
        vehicle_id: 2,
        plan_date: `${currentMonth}-16`,
        shift_type: "night",
        departure_base_id: 1,
        arrival_base_id: 1,
        planned_distance: 30,
        start_time: "22:00",
        end_time: "06:00",
        status: "planned",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        vehicle: mockVehicles[1],
        departure_base: mockBases[0],
        arrival_base: mockBases[0],
      },
    ]
  } else if (url.includes("/api/operation-records")) {
    return [
      {
        id: 1,
        vehicle_id: 1,
        record_date: `${currentMonth}-15`,
        shift_type: "day",
        departure_base_id: 1,
        arrival_base_id: 1,
        actual_distance: 48,
        actual_start_time: "08:15",
        actual_end_time: "16:45",
        status: "completed",
        auto_imported: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        vehicle: mockVehicles[0],
        departure_base: mockBases[0],
        arrival_base: mockBases[0],
      },
    ]
  } else if (url.includes("/api/inspection-plans")) {
    return [
      {
        id: 1,
        vehicle_id: 3,
        inspection_type: "乙A検査",
        inspection_category: "法定検査",
        planned_start_date: `${currentMonth}-20`,
        planned_end_date: `${currentMonth}-22`,
        status: "planned",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        vehicle: mockVehicles[2],
      },
    ]
  }

  return []
}

// データベース設定の確認
export const isDatabaseConfigured = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_DATABASE_URL || process.env.DATABASE_URL)
}

export const fetchVehicles = async () => {
  if (!isDatabaseConfigured()) {
    return []
  }

  try {
    const response = await apiClient.get("/api/vehicles")
    return response
  } catch (error) {
    console.error("Error fetching vehicles:", error)
    return []
  }
}

export const fetchBases = async () => {
  if (!isDatabaseConfigured()) {
    return []
  }

  try {
    const response = await apiClient.get("/api/bases")
    return response
  } catch (error) {
    console.error("Error fetching bases:", error)
    return []
  }
}

export const fetchManagementOffices = async () => {
  if (!isDatabaseConfigured()) {
    return []
  }

  try {
    const response = await apiClient.get("/api/management-offices")
    return response
  } catch (error) {
    console.error("Error fetching management offices:", error)
    return []
  }
}
