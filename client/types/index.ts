export interface Vehicle {
  id: number
  name: string
  model: string
  base_location: string
  machine_number: string
  manufacturer: string
  acquisition_date: string
  management_office: string
  created_at: string
  updated_at: string
}

export interface Base {
  id: number
  base_name: string
  location: string
  created_at: string
}

export interface ManagementOffice {
  id: number
  office_name: string
  location: string
  created_at: string
}

export interface OperationPlan {
  id: number
  vehicle_id: number
  plan_date: string
  shift_type: string
  departure_base_id: number | null
  arrival_base_id: number | null
  planned_distance: number
  start_time: string
  end_time: string
  notes?: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  departure_base?: Base
  arrival_base?: Base
}

export interface OperationRecord {
  id: number
  vehicle_id: number
  record_date: string
  shift_type: string
  departure_base_id: number | null
  arrival_base_id: number | null
  actual_distance: number
  start_time: string
  end_time: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
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
