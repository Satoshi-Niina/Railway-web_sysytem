// 環境変数からAPIベースURLを取得
// 開発環境: /api (Next.js API routes)
// 本番環境: 環境変数 NEXT_PUBLIC_API_URL で指定
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

// 汎用API呼び出し関数
// endpoint: エンドポイント名のみを指定 (例: "vehicles", "operation-plans")
// 自動的に API_BASE_URL とマージされます
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // 絶対URLの場合はそのまま使用
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    console.log('API Call (absolute):', endpoint)
    const response = await fetch(endpoint, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }

  // エンドポイントの正規化
  // API_BASE_URLの末尾のスラッシュを処理
  let baseUrl = API_BASE_URL.replace(/\/+$/, '') // 末尾のスラッシュを削除
  
  // baseUrl がドメインのみで /api を含んでいない場合、自動的に付与
  // ただし、 baseUrl が "/api" (相対パス) でない場合のみ
  if (baseUrl !== "/api" && !baseUrl.includes("/api") && (baseUrl.startsWith('http://') || baseUrl.startsWith('https://'))) {
    baseUrl = `${baseUrl}/api`
  }

  const cleanEndpoint = endpoint.replace(/^\/+/, '') // 先頭のスラッシュを削除
  const url = `${baseUrl}/${cleanEndpoint}`
  
  console.log('API Call:', url, { baseUrl, cleanEndpoint, originalBase: API_BASE_URL })
  
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

  console.log('API Response:', response.status, response.statusText)

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`
    try {
      const errorData = await response.json()
      console.error('API Error Details:', errorData)
      errorMessage = errorData.details || errorData.error || errorMessage
    } catch (e) {
      // JSONパースエラーを無視
    }
    throw new Error(errorMessage)
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
    return apiCall<T>(endpoint, { method: 'GET' });
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    return apiCall<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async put<T>(endpoint: string, data: any): Promise<T> {
    return apiCall<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete<T>(endpoint: string): Promise<T> {
    return apiCall<T>(endpoint, {
      method: "DELETE",
    });
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
export async function cachedFetch(endpoint: string, options?: RequestInit, ttl?: number): Promise<any> {
  const cacheKey = `${endpoint}-${JSON.stringify(options || {})}`
  
  // キャッシュから取得を試行
  const cached = getFromCache(cacheKey)
  if (cached) {
    return cached
  }

  // apiCallを使用して呼び出し
  const data = await apiCall(endpoint, options)
  
  // キャッシュに保存
  setCache(cacheKey, data, ttl)
  
  return data
}

// 事業所データの取得（キャッシュ付き）
export async function getManagementOffices() {
  return cachedFetch('management-offices', {}, 2 * 60 * 1000) // 2分キャッシュ
}

// 保守基地データの取得（キャッシュ付き）
export async function getMaintenanceBases() {
  return cachedFetch('bases', {}, 2 * 60 * 1000) // 2分キャッシュ
}

// 車両データの取得（キャッシュ付き）
export async function getVehicles() {
  return cachedFetch('vehicles', {}, 1 * 60 * 1000) // 1分キャッシュ
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
  // ブラウザ環境（windowが存在する場合）
  if (typeof window !== 'undefined') {
    // 開発環境では常にAPIリクエストを許可し、サーバー側のエラー判定に任せる
    return true
  }
  
  // サーバーサイド（Next.js API Routes / SSR）の場合
  // process.env から直接取得（Next.jsが自動ロードすることを期待）
  return !!(process.env.NEXT_PUBLIC_DATABASE_URL || process.env.DATABASE_URL)
}

export const fetchVehicles = async () => {
  // apiCall 自体の中で API_BASE_URL を使用しているため、ここでのチェックは不要または緩和
  try {
    const response = await apiClient.get("vehicles")
    return response
  } catch (error) {
    console.error("Error fetching vehicles:", error)
    return []
  }
}

export const fetchBases = async () => {
  try {
    const response = await apiClient.get("bases")
    return response
  } catch (error) {
    console.error("Error fetching bases:", error)
    return []
  }
}

export const fetchManagementOffices = async () => {
  try {
    const response = await apiClient.get("management-offices")
    return response
  } catch (error) {
    console.error("Error fetching management offices:", error)
    return []
  }
}
