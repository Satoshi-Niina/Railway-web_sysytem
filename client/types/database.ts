// 基本型定義
export interface ManagementOffice {
  id: number
  office_name: string
  office_code: string
  station_1?: string
  station_2?: string
  station_3?: string
  station_4?: string
  station_5?: string
  station_6?: string
  created_at: string
  updated_at: string
}

export interface MaintenanceBase {
  id: number
  base_name: string
  base_code: string
  management_office_id: number
  location?: string
  address?: string
  created_at: string
  updated_at: string
  management_office?: ManagementOffice
}

export interface Base {
  id: number
  base_name: string
  base_code?: string
  base_type: string
  location?: string
  management_office_id?: number
  is_active: boolean
  created_at: string
  updated_at: string
  management_office?: ManagementOffice
  // APIレスポンス用フィールド
  office_name?: string
  office_code?: string
}

export interface VehicleType {
  id: number
  type_name: string
  category?: string
  description?: string
  created_at: string
}

export interface Vehicle {
  id: number
  machine_number: string
  vehicle_type: string
  model?: string
  manufacturer?: string
  acquisition_date?: string // YYYY-MM形式（年月）
  type_approval_start_date?: string // YYYY-MM形式（年月）
  type_approval_duration?: number // 月数
  special_notes?: string
  management_office_id?: number
  home_base_id?: number
  status: string
  created_at: string
  updated_at: string
  management_office?: ManagementOffice
  // APIレスポンス用フィールド
  office_name?: string
  office_code?: string
  base_name?: string
}

export interface InspectionType {
  id: number
  type_name: string
  category: string
  interval_days?: number
  description?: string
  created_at: string
}

export interface OperationPlan {
  id: number
  vehicle_id: number
  plan_date: string
  shift_type: string
  departure_base_id: number
  arrival_base_id: number
  planned_distance?: number
  start_time?: string
  end_time?: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
  // 事業所情報（APIレスポンス用）
  office_name?: string
  office_code?: string
  station_1?: string
  station_2?: string
  station_3?: string
  station_4?: string
  station_5?: string
  station_6?: string
  vehicle?: Vehicle
  departure_base?: Base
  arrival_base?: Base
}

export interface OperationRecord {
  id: number
  vehicle_id: number
  record_date: string
  shift_type: string
  departure_base_id: number
  arrival_base_id: number
  actual_distance?: number
  actual_start_time?: string
  actual_end_time?: string
  status: string
  auto_imported: boolean
  created_at: string
  updated_at: string
  // 事業所情報（APIレスポンス用）
  office_name?: string
  office_code?: string
  station_1?: string
  station_2?: string
  station_3?: string
  station_4?: string
  station_5?: string
  station_6?: string
  vehicle?: Vehicle
  departure_base?: Base
  arrival_base?: Base
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

export interface Inspection {
  id: number
  vehicle_id: number
  inspection_type: string
  inspection_category: string
  inspection_date: string
  inspector_name?: string
  status: string
  findings?: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
}

export interface Failure {
  id: number
  vehicle_id: number
  failure_date: string
  failure_type?: string
  description?: string
  severity: string
  status: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
}

export interface Repair {
  id: number
  failure_id?: number
  vehicle_id: number
  repair_date: string
  repair_type?: string
  description?: string
  cost?: number
  status: string
  created_at: string
  updated_at: string
  failure?: Failure
  vehicle?: Vehicle
}

export interface MaintenanceCycle {
  id: number
  vehicle_type: string
  inspection_type: string
  cycle_days: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MonthlyMaintenancePlan {
  id: number
  vehicle_id: number
  plan_month: string
  inspection_type: string
  planned_date?: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
}

// API レスポンス型
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// フィルター型
export interface VehicleFilter {
  management_office_id?: string
  vehicle_type?: string
  status?: string
  search?: string
}

export interface OperationFilter {
  date?: string
  month?: string
  management_office_id?: string
  vehicle_type?: string
  shift_type?: string
  status?: string
}

export interface InspectionFilter {
  date?: string
  month?: string
  vehicle_id?: number
  inspection_type?: string
  inspection_category?: string
  status?: string
}

// 統計データ型
export interface OperationStatistics {
  total_plans: number
  total_records: number
  completion_rate: number
  total_distance: number
  average_distance: number
  by_shift_type: {
    day: number
    night: number
    day_night: number
  }
  by_status: {
    completed: number
    cancelled: number
    partial: number
  }
}

export interface InspectionStatistics {
  total_planned: number
  total_completed: number
  completion_rate: number
  by_category: {
    [key: string]: number
  }
  by_status: {
    planned: number
    in_progress: number
    completed: number
    postponed: number
  }
}

// チャート表示用データ型
export interface ChartData {
  date: string
  planned: number
  actual: number
  inspections: number
}

export interface MonthlyChartData {
  month: string
  total_operations: number
  total_inspections: number
  completion_rate: number
}

// フォーム用型
export interface VehicleFormData {
  machine_number: string
  vehicle_type: string
  model?: string
  manufacturer?: string
  acquisition_date?: string
  management_office_id?: number
  home_base_id?: number
  status: string
}

export interface OperationPlanFormData {
  vehicle_id: number
  plan_date: string
  shift_type: string
  departure_base_id?: number
  arrival_base_id?: number
  planned_distance?: number
  start_time?: string
  end_time?: string
  notes?: string
}

export interface InspectionPlanFormData {
  vehicle_id: number
  inspection_type: string
  inspection_category: string
  planned_start_date: string
  planned_end_date: string
  notes?: string
}
