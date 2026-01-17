// 検修関連の型定義

export interface MaintenanceSchedule {
  vehicle_id: string | number
  machine_number: string
  machine_type: string
  inspection_type_id: number
  inspection_type: string
  category: string
  base_date: string
  base_date_source: 'completion' | 'manual' | 'purchase' | 'system'
  cycle_months: number
  duration_days: number
  next_scheduled_date: string
  days_until: number
  is_warning: boolean
  office_id?: number
  office_name?: string
}

export interface MaintenanceBaseDate {
  id: number
  vehicle_id: string | number
  inspection_type_id: number
  base_date: string
  source: 'completion' | 'manual' | 'purchase' | 'system'
  notes?: string
  created_at: string
  updated_at: string
}

export interface MaintenanceScheduleDisplay {
  date: string
  inspection_type: string
  duration_days: number
  days_until: number
  is_warning: boolean
  vehicle_id: string | number
  machine_number: string
}
