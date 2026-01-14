export interface Vehicle {
  id: number
  name: string
  vehicle_type: string
  model: string
  base_location: string
  machine_number: string
  manufacturer: string
  acquisition_date: string
  management_office: string
  management_office_id?: number
  last_inspection_date?: string
  created_at: string
  updated_at: string
}

export interface Base {
  id: number
  base_name: string
  base_code?: string
  location: string
  management_office_id?: number
  office_name?: string
  office_code?: string
  storage_capacity?: number
  contact_info?: string
  created_at: string
  updated_at?: string
}

export interface ManagementOffice {
  id: number
  office_name: string
  office_code?: string
  responsible_area?: string
  created_at: string
  updated_at?: string
}

export interface OperationPlan {
  id: number
  vehicle_id: number | string  // DBはTEXT型、UUIDや機械番号文字列が入る
  plan_date: string
  end_date?: string | null
  shift_type: 'day' | 'night' | 'day_night' | 'maintenance'
  start_time?: string | null
  end_time?: string | null
  departure_base_id?: number | null
  arrival_base_id?: number | null
  planned_distance?: number | null
  status?: string
  notes?: string | null
  created_at?: string
  updated_at?: string
  vehicle?: Vehicle
  departure_base?: Base
  arrival_base?: Base
  machine_number?: string  // JOIN結果で取得
  inspection_type_id?: number | string | null
  // 旧フィールド（互換性のため残す）
  schedule_id?: number
  schedule_date?: string
  description?: string
}

export interface OperationRecord {
  id: number
  vehicle_id: number | string  // DBはTEXT型、UUIDや機械番号文字列が入る
  record_date: string
  shift_type: 'day' | 'night' | 'day_night'
  actual_start_time?: string | null
  actual_end_time?: string | null
  departure_base_id?: number | null
  arrival_base_id?: number | null
  actual_distance?: number | null
  status: string
  notes?: string | null
  is_as_planned?: boolean
  created_at?: string
  updated_at?: string
  vehicle?: Vehicle
  departure_base?: Base
  arrival_base?: Base
  machine_number?: string
  // 旧フィールド（互換性のため残す）
  record_id?: number
  schedule_id?: number
  operation_date?: string
  start_time?: string
  end_time?: string
}

export interface InspectionPlan {
  id: number
  vehicle_id: number
  inspection_type: string
  inspection_category: string
  planned_start_date: string
  planned_end_date: string
  status: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
}

export interface OperationAssignment {
  id: number
  date: string
  vehicle_id: number
  base_id: number
  shift_type: "昼間" | "夜間" | "昼夜" | "夜翌"
  return_base_id?: number
  departure_base_id?: number | null
  arrival_base_id?: number | null
  is_detention?: boolean
  movement_destination?: string | null
}

// 留置状態を表す新しいインターフェース
export interface VehicleStayover {
  id: number
  date: string
  vehicle_id: number
  base_id: number
  from_date: string // 留置開始日
  from_shift_type: "夜間" | "昼夜" // 留置につながった運用区分
}

export interface TravelPlan {
  id: number
  vehicle_id: number
  plan_date: string
  departure_time: string
  arrival_time: string
  departure_location: string
  arrival_location: string
  distance: number
  purpose: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
}

export interface TravelRecord {
  id: number
  vehicle_id: number
  record_date: string
  departure_time: string
  arrival_time: string
  departure_location: string
  arrival_location: string
  distance: number
  fuel_consumption?: number
  created_at: string
  updated_at: string
  vehicle?: Vehicle
}

export interface Inspection {
  id: number
  vehicle_id: number
  inspection_type: string
  inspection_date: string
  priority: "urgent" | "high" | "normal" | "low"
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  pdf_file_url?: string
  notes?: string
  vehicle?: Vehicle
  created_at?: string
  updated_at?: string
}

export interface Failure {
  id: number
  vehicle_id: number
  failure_date: string
  failure_content: string
  image_urls?: string[]
  vehicle?: Vehicle
  repairs?: Repair[]
  created_at?: string
  updated_at?: string
}

export interface Repair {
  id: number
  failure_id: number
  repair_date: string
  repair_content: string
  repair_cost?: number
  image_urls?: string[]
  created_at?: string
  updated_at?: string
}

// 検査サイクル順序
export interface InspectionCycleOrder {
  id: number
  vehicle_type: string
  inspection_type: string
  cycle_order: number
  cycle_months: number
  warning_months: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 車両別検修計画
export interface VehicleInspectionPlan {
  id: number
  vehicle_id: number
  inspection_type: string
  planned_date: string
  cycle_order?: number
  base_id?: number
  status: 'planned' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  base?: Base
}

// 車両別検修実績
export interface VehicleInspectionRecord {
  id: number
  vehicle_id: number
  inspection_type: string
  inspection_date: string
  cycle_order?: number
  base_id?: number
  inspector_name?: string
  result: 'pass' | 'fail' | 'conditional'
  findings?: string
  next_inspection_date?: string
  notes?: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  base?: Base
  machine_number?: string
  vehicle_type?: string
  base_name?: string
}

// 車両の検査スケジュール（運用計画表示用）
export interface VehicleInspectionSchedule {
  vehicle_id: number
  machine_number: string
  vehicle_type: string
  last_inspection_type: string
  last_inspection_date: string
  last_cycle_order: number
  next_inspection_type: string
  next_cycle_order: number
  cycle_months: number
  warning_months: number
  next_inspection_date: string
  warning_start_date: string
  is_warning: boolean
  is_in_period: boolean
  days_until_inspection: number
  inspection_type?: string
  inspection_category?: string
  duration_days?: number
}

// 検査種別マスタ
export interface InspectionType {
  id: number
  type_name: string
  category: string
  interval_days?: number
  description?: string
  created_at: string
}

// 車両検査スケジュール（機械番号と検査種別のリンク）
export interface VehicleInspectionScheduleLink {
  id: number
  vehicle_id: number
  inspection_type_id: number
  last_inspection_date?: string
  next_inspection_date?: string
  interval_days: number
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
  // JOIN結果で取得される追加フィールド
  vehicle_type?: string
  machine_number?: string
  model?: string
  type_name?: string
  inspection_category?: string
  office_name?: string
}

