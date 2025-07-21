// types/enhanced.ts の内容をこちらに統合し、不要な重複を解消します。

export interface VehicleType {
  id: number
  type_name: string
  category: string
  created_at: string
}

export interface Base {
  id: number
  base_name: string
  location?: string
  created_at: string
}

export interface Vehicle {
  id: number
  name: string // 機種 (例: モータカー, 鉄トロ)
  model: string // 型式 (例: MC-100)
  base_location: string
  machine_number?: string // 機械番号 (例: モータカー001, M01)
  manufacturer?: string
  acquisition_date?: string
  management_office?: string
  type_approval_number?: string
  type_approval_expiration_date?: string
  type_approval_conditions?: string
  created_at: string
  updated_at: string
}

export interface OperationPlan {
  id: number
  vehicle_id: number
  plan_date: string
  shift_type: "day" | "night" | "day_night"
  start_time?: string
  end_time?: string
  planned_distance: number
  departure_base_id?: number
  arrival_base_id?: number
  notes?: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  departure_base?: Base
  arrival_base?: Base
}

export interface OperationRecord {
  id: number
  plan_id?: number
  vehicle_id: number
  record_date: string
  shift_type: "day" | "night" | "day_night"
  actual_start_time?: string
  actual_end_time?: string
  actual_distance: number
  departure_base_id?: number
  arrival_base_id?: number
  status: "completed" | "cancelled"
  notes?: string
  auto_imported: boolean
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  departure_base?: Base
  arrival_base?: Base
  plan?: OperationPlan
}

// 検査計画のインターフェースを更新
export interface InspectionPlan {
  id: number
  vehicle_id: number
  inspection_type: string // 例: "臨時修繕", "定期点検", "乙A検査"
  planned_start_date: string
  planned_end_date: string
  estimated_duration?: number
  inspection_category: "臨修" | "定検" | "乙検" | "甲検" | "その他" // 新しいカテゴリを追加
  status: "planned" | "in_progress" | "completed" | "postponed"
  notes?: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
}

// 検査インターフェースを追加
export interface Inspection {
  id: number
  vehicle_id: number
  inspection_type: string
  inspection_date: string
  inspector?: string
  result: "pass" | "fail" | "pending"
  notes?: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
}

// 走行計画インターフェースを追加
export interface TravelPlan {
  id: number
  vehicle_id: number
  plan_date: string
  planned_distance: number
  departure_base_id?: number
  arrival_base_id?: number
  notes?: string
  status: "planned" | "in_progress" | "completed" | "cancelled"
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  departure_base?: Base
  arrival_base?: Base
}

// 走行実績、故障、修繕のインターフェースは変更なし
export interface TravelRecord {
  id: number
  vehicle_id: number
  record_date: string
  actual_distance: number
  created_at: string
  updated_at: string
  vehicle?: Vehicle
}

export interface Failure {
  id: number
  vehicle_id: number
  failure_date: string
  failure_content: string
  image_urls?: string[]
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  repairs?: Repair[]
}

export interface Repair {
  id: number
  failure_id: number
  repair_date: string
  repair_content: string
  repair_cost?: number
  image_urls?: string[]
  created_at: string
  updated_at: string
}
