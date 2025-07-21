import type { Vehicle, ManagementOffice, Base, OperationPlan, OperationRecord } from "@/types/database"

export const mockManagementOffices: ManagementOffice[] = [
  {
    id: 1,
    office_name: "本社保守事業所",
    office_code: "HQ001",
    station_1: "東京駅",
    station_2: "品川駅",
    station_3: "新宿駅",
    station_4: "渋谷駅",
    station_5: "池袋駅",
    station_6: "上野駅",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    office_name: "関西支社保守事業所",
    office_code: "KS001",
    station_1: "大阪駅",
    station_2: "梅田駅",
    station_3: "難波駅",
    station_4: "天王寺駅",
    station_5: "新大阪駅",
    station_6: "京都駅",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

export const mockMaintenanceBases: MaintenanceBase[] = [
  {
    id: 1,
    base_name: "本社保守基地",
    base_code: "HQ-BASE001",
    management_office_id: 1,
    location: "東京",
    address: "東京都渋谷区○○1-1-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    management_office: mockManagementOffices[0],
  },
  {
    id: 2,
    base_name: "品川保守基地",
    base_code: "HQ-BASE002",
    management_office_id: 1,
    location: "東京",
    address: "東京都品川区○○2-2-2",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    management_office: mockManagementOffices[0],
  },
  {
    id: 3,
    base_name: "関西保守基地",
    base_code: "KS-BASE001",
    management_office_id: 2,
    location: "大阪",
    address: "大阪府大阪市○○3-3-3",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    management_office: mockManagementOffices[1],
  },
]

export const mockBases: Base[] = [
  {
    id: 1,
    base_name: "東京保守基地",
    location: "東京都品川区",
    base_type: "保守基地",
    management_office_id: 1,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    base_name: "品川車両基地",
    location: "東京都品川区",
    base_type: "車両基地",
    management_office_id: 1,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

export const mockVehicles: Vehicle[] = [
  {
    id: 1,
    vehicle_type: "マルチプルタイタンパー",
    machine_number: "MT-001",
    acquisition_date: "2020-04-01",
    type_approval_date: "2020-03-15",
    type_approval_number: "MT-2020-001",
    type_approval_conditions: "最高速度60km/h、作業時最高速度15km/h",
    manufacturer: "川崎重工業",
    model: "KMT-100",
    management_office_id: 1,
    home_base_id: 1,
    status: "稼働中",
    management_office: mockManagementOffices[0],
    home_base: mockBases[0],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    vehicle_type: "バラスト散布車",
    machine_number: "BS-001",
    acquisition_date: "2019-03-01",
    type_approval_date: "2019-02-15",
    type_approval_number: "BS-2019-001",
    type_approval_conditions: "最高速度80km/h",
    manufacturer: "日本車輌製造",
    model: "NBD-50",
    management_office_id: 1,
    home_base_id: 2,
    status: "稼働中",
    management_office: mockManagementOffices[0],
    home_base: mockBases[1],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

export const mockOperationPlans: OperationPlan[] = [
  {
    id: 1,
    plan_date: "2024-01-15",
    vehicle_id: 1,
    base_id: 1,
    shift_type: "日勤",
    work_type: "タイタンパー作業",
    start_time: "08:00",
    end_time: "17:00",
    planned_distance: 50,
    operator_name: "田中太郎",
    notes: "東海道線保守作業",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

export const mockOperationRecords: OperationRecord[] = [
  {
    id: 1,
    record_date: "2024-01-15",
    vehicle_id: 1,
    base_id: 1,
    shift_type: "日勤",
    work_type: "タイタンパー作業",
    actual_start_time: "08:05",
    actual_end_time: "17:10",
    actual_distance: 52,
    fuel_consumption: 45.5,
    operator_name: "田中太郎",
    notes: "予定より若干遅れて開始",
    operation_plan_id: 1,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

// 既存のモックデータも保持（後方互換性のため）
export const mockOffices = mockManagementOffices
export const mockInspections: any[] = []
export const mockInspectionPlans: any[] = []
export const mockFailures: any[] = []
export const mockTravelPlans: any[] = []
