"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, ChevronLeft, ChevronRight, Car, AlertCircle, Building, Filter, Copy, Edit, Trash2, FileText, Settings } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { Vehicle, OperationPlan, Base, Office, VehicleInspectionSchedule, MaintenanceSchedule } from "@/types"
import { apiCall, isDatabaseConfigured } from "@/lib/api-client"
import { OperationCalendarView } from "./operation-calendar-view"
import { MaintenanceScheduleBadge } from "./maintenance-schedule-badge"
import { SystemSettings } from "./system-settings"

// 検修タイプの型定義
interface InspectionType {
  id: number
  type_name: string
  category: string
  interval_months?: number
  description?: string
}

// 事業所の型定義
interface Office {
  id?: string
  office_id: string
  office_name: string
  area?: string
}

// 機種タイプの型定義
interface MachineType {
  id: number | string
  type_name: string
  model_name?: string
  manufacturer?: string
  category?: string
}

// ファイル保存ダイアログの型定義
declare global {
  interface Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string
      types?: Array<{
        description: string
        accept: Record<string, string[]>
      }>
    }) => Promise<FileSystemFileHandle>
  }
}

// 機種タイプの表示順（実際に存在する機種のみを表示）
const VEHICLE_TYPE_ORDER = [
  "MC-100", "MC-150",  // モータカー
  "TT-200", "TT-250",  // 鉄トロ
  "HP-300", "HP-350"   // ホッパー
]

export function OperationPlanning() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    // デフォルトで来月を表示
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return nextMonth.toISOString().slice(0, 7)
  })
  
  const [operationPlans, setOperationPlans] = useState<OperationPlan[]>([])
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [allBases, setAllBases] = useState<Base[]>([])
  const [allOffices, setAllOffices] = useState<Office[]>([])
  const [inspectionSchedules, setInspectionSchedules] = useState<VehicleInspectionSchedule[]>([])
  const [inspectionTypes, setInspectionTypes] = useState<InspectionType[]>([])
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([])
  const [masterMachineTypes, setMasterMachineTypes] = useState<any[]>([])
  const [masterMachines, setMasterMachines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeFieldErrors, setTimeFieldErrors] = useState<{ start: boolean; end: boolean }>({ start: false, end: false })
  const [conflictDetails, setConflictDetails] = useState<{ start: string | null; end: string | null }>({ start: null, end: null })
  const [baseFieldErrors, setBaseFieldErrors] = useState<{ departure: boolean; arrival: boolean }>({ departure: false, arrival: false })
  const [baseConflictDetails, setBaseConflictDetails] = useState<{ departure: string | null; arrival: string | null }>({ departure: null, arrival: null })

  // 計画編集モーダル
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<OperationPlan | null>(null)
  const [planForm, setPlanForm] = useState({
    vehicle_id: "",
    plan_date: "",
    end_date: "",
    shift_type: "day",
    inspection_type_id: "",
    start_time: "08:00",
    end_time: "17:00",
    departure_base_id: "",
    arrival_base_id: "",
    planned_distance: 0,
    notes: "",
  })

  // フィルター状態
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("all")
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([])
  const [selectedMachineNumbers, setSelectedMachineNumbers] = useState<string[]>([])
  
  // ビュー切り替え状態
  const [viewMode, setViewMode] = useState<"table" | "calendar">("calendar")
  
  // メインタブ状態（運用計画 or 設定）
  const [mainTab, setMainTab] = useState<"operations" | "settings">("operations")

  const currentDate = new Date()
  const selectedDate = new Date(currentMonth + "-01")
  const isPastMonth = selectedDate <= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  // 事業所フィルターが変更されたとき、機種と機械番号の選択をクリア
  useEffect(() => {
    setSelectedVehicleTypes([])
    setSelectedMachineNumbers([])
  }, [selectedOfficeId])

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      setError(null)
      
      // 各APIを個別に呼び出してエラーハンドリング
      let plansData: OperationPlan[] = []
      let vehiclesData: Vehicle[] = []
      let basesData: Base[] = []
      let officesData: Office[] = []

      // 運用計画データの取得
      try {
        plansData = await apiCall<OperationPlan[]>(`operation-plans?month=${currentMonth}`)
      } catch (error) {
        console.error("運用計画データの取得エラー:", error)
        // 運用計画は必須ではないので空配列のまま
      }

      // 車両データの取得
      try {
        const rawVehiclesData = await apiCall<any[]>("machines")
        console.log("=== Raw Machines Data (first 2) ===")
        console.log(JSON.stringify(rawVehiclesData.slice(0, 2), null, 2))
        // APIから返されるデータをVehicle型にマッピング（model_nameのみを使用）
        vehiclesData = rawVehiclesData.map(v => ({
          id: v.id,
          name: v.model_name || '', 
          vehicle_type: v.model_name || '', // model_nameのみを使用
          model: v.machine_type_id || '',
          base_location: v.office_name || '',
          machine_number: v.machine_number || '',
          manufacturer: v.manufacturer || '',
          acquisition_date: v.created_at || '',
          management_office: v.office_name || '',
          management_office_id: v.office_id,
          created_at: v.created_at || '',
          updated_at: v.updated_at || '',
        }))
        console.log("=== Mapped Vehicles Data (first 2) ===")
        console.log(JSON.stringify(vehiclesData.slice(0, 2), null, 2))
      } catch (error) {
        console.error("車両データの取得エラー:", error)
        throw new Error("車両データの取得に失敗しました")
      }

      // 基地データの取得
      try {
        basesData = await apiCall<Base[]>("bases")
      } catch (error) {
        console.error("基地データの取得エラー:", error)
        throw new Error("基地データの取得に失敗しました")
      }

      // マスタ機種データの取得
      try {
        const types = await apiCall<any[]>("machine-types")
        setMasterMachineTypes(types)
      } catch (error) {
        // マスタ機種データは必須ではないので空配列のまま
        setMasterMachineTypes([])
      }

      // マスタ機械データの取得
      try {
        const machineList = await apiCall<any[]>("machines")
        setMasterMachines(machineList)
      } catch (error) {
        // マスタ機械データは必須ではないので空配列のまま
        setMasterMachines([])
      }

      // 事業所データの取得
      try {
        officesData = await apiCall<Office[]>("offices")
      } catch (error) {
        // 事業所データがない場合は空配列を使用
        officesData = []
      }

      // 検査スケジュールデータの取得（オプショナル - エラーを静かに処理）
      try {
        const schedulesData = await apiCall<VehicleInspectionSchedule[]>(
          `vehicle-inspection-schedule?month=${currentMonth}&show_warnings=true`
        )
        setInspectionSchedules(schedulesData)
      } catch (error) {
        // 検査スケジュールは必須ではないので空配列のまま（エラーログも出力しない）
        setInspectionSchedules([])
      }

      // 検修タイプマスタの取得
      let inspectionTypesData: InspectionType[] = []
      try {
        inspectionTypesData = await apiCall<InspectionType[]>("inspection-types")
        setInspectionTypes(inspectionTypesData)
      } catch (error) {
        // 検修タイプは必須ではないので空配列のまま（エラーログも出力しない）
        setInspectionTypes([])
      }

      // 検修スケジュールデータの取得
      try {
        const maintenanceData = await apiCall<MaintenanceSchedule[]>(
          `maintenance-schedules?month=${currentMonth}`
        )
        setMaintenanceSchedules(maintenanceData)
        console.log("検修スケジュールデータ:", maintenanceData.length, "件")
      } catch (error) {
        // 検修スケジュールは必須ではないので空配列のまま（エラーログも出力しない）
        setMaintenanceSchedules([])
      }

      console.log("=== データ取得完了 ===")
      console.log("運用計画データ:", plansData.length, "件")
      console.log("運用計画サンプル:", JSON.stringify(plansData[0], null, 2))
      console.log("車両データ:", vehiclesData.length, "件")
      console.log("車両データサンプル:", JSON.stringify(vehiclesData.slice(0, 2), null, 2))
      console.log("基地データ:", basesData.length, "件")
      console.log("事業所データ:", officesData.length, "件")
      console.log("検査スケジュールデータ:", inspectionSchedules.length, "件")
      
      // 翌日またぎ計画をチェック
      const overnightPlans = plansData.filter(p => {
        const planDate = p.schedule_date?.split('T')[0]
        return false // schedules table in image doesn't have end_date, so overnight logic needs rethinking or addition of columns
      })
      console.log("翌日またぎ計画:", overnightPlans.length, "件")
      if (overnightPlans.length > 0) {
        console.log("翌日またぎ計画詳細:", overnightPlans.map(p => ({
          schedule_id: p.schedule_id,
          vehicle_id: p.vehicle_id,
          schedule_date: p.schedule_date
        })))
      }
      
      setOperationPlans(plansData)
      setAllVehicles(vehiclesData)
      setAllBases(basesData)
      setAllOffices(officesData)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("データの取得に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (dateString: string) => {
    const [year, month] = dateString.split("-").map(Number)
    return new Date(year, month, 0).getDate()
  }

  const getDateString = (day: number) => {
    return `${currentMonth}-${day.toString().padStart(2, "0")}`
  }

  // 車両フィルタリング（事業所・機種・機械番号）
  const filteredVehicles = useMemo(() => {
    let vehicles = allVehicles

    // 事業所でフィルタリング
    if (selectedOfficeId !== "all") {
      vehicles = vehicles.filter((vehicle) => 
        vehicle.management_office_id?.toString() === selectedOfficeId
      )
    }

    // 機種でフィルタリング（複数選択対応）
    if (selectedVehicleTypes.length > 0) {
      vehicles = vehicles.filter((vehicle) => selectedVehicleTypes.includes(vehicle.vehicle_type))
    }

    // 機械番号でフィルタリング（複数選択対応）
    if (selectedMachineNumbers.length > 0) {
      vehicles = vehicles.filter((vehicle) => selectedMachineNumbers.includes(vehicle.machine_number))
    }

    return vehicles
  }, [allVehicles, selectedOfficeId, selectedVehicleTypes, selectedMachineNumbers])

  // フィルタリングされた運用計画を取得
  const filteredOperationPlans = useMemo(() => {
    const filteredVehicleIds = filteredVehicles.map(v => v.id)
    return operationPlans.filter(plan => filteredVehicleIds.includes(plan.vehicle_id))
  }, [operationPlans, filteredVehicles])

  // フィルタリングされた検修スケジュールを取得
  const filteredMaintenanceSchedules = useMemo(() => {
    const filteredVehicleIds = filteredVehicles.map(v => v.id)
    return maintenanceSchedules.filter(schedule => filteredVehicleIds.includes(schedule.vehicle_id))
  }, [maintenanceSchedules, filteredVehicles])

  // 機種・機械番号フィルター変更時に検修スケジュールを再取得
  useEffect(() => {
    const fetchFilteredMaintenanceSchedules = async () => {
      if (selectedVehicleTypes.length === 0 && selectedMachineNumbers.length === 0) {
        // フィルターがクリアされた場合は全体を再取得
        try {
          const maintenanceData = await apiCall<MaintenanceSchedule[]>(
            `maintenance-schedules?month=${currentMonth}`
          )
          setMaintenanceSchedules(maintenanceData)
        } catch (error) {
          setMaintenanceSchedules([])
        }
        return
      }

      // 個別にフィルタリングされた検修スケジュールを取得
      const params = new URLSearchParams({ month: currentMonth })
      if (selectedVehicleTypes.length > 0) {
        params.append('machine_type', selectedVehicleTypes.join(','))
      }
      if (selectedMachineNumbers.length > 0) {
        params.append('machine_number', selectedMachineNumbers.join(','))
      }

      try {
        const maintenanceData = await apiCall<MaintenanceSchedule[]>(
          `maintenance-schedules?${params.toString()}`
        )
        setMaintenanceSchedules(maintenanceData)
      } catch (error) {
        // エラーは静かに処理
        setMaintenanceSchedules([])
      }
    }

    fetchFilteredMaintenanceSchedules()
  }, [selectedVehicleTypes, selectedMachineNumbers, currentMonth])

  // 各フィルターで利用可能な事業所リストを取得（全ての事業所を表示）
  const availableOffices = useMemo(() => {
    // 全ての事業所を返す
    return allOffices
  }, [allOffices])

  // 各フィルターで利用可能な機種リストを取得（machine_typesテーブルから）
  const availableVehicleTypes = useMemo(() => {
    // 事業所が「すべて」の場合：machine_typesテーブルの全機種を表示
    if (selectedOfficeId === "all") {
      const allModelNames = masterMachineTypes
        .map(mt => mt.model_name)
        .filter(Boolean)
      return Array.from(new Set(allModelNames)).sort()
    }
    
    // 事業所が選択されている場合：その事業所の機械が持つ機種のみを表示
    const vehiclesInOffice = allVehicles.filter(
      v => v.management_office_id?.toString() === selectedOfficeId
    )
    const vehicleTypes = vehiclesInOffice
      .map(v => v.vehicle_type)
      .filter(Boolean)
    
    // 重複を除去してソート
    return Array.from(new Set(vehicleTypes)).sort()
  }, [masterMachineTypes, allVehicles, selectedOfficeId])

  // 各フィルターで利用可能な機械番号リストを取得
  const availableMachineNumbers = useMemo(() => {
    let vehicles = allVehicles
    
    // 事業所でフィルタリングされている場合は絞り込む
    if (selectedOfficeId !== "all") {
      vehicles = vehicles.filter(v => v.management_office_id?.toString() === selectedOfficeId)
    }
    
    // 機種でフィルタリングされている場合は絞り込む
    if (selectedVehicleTypes.length > 0) {
      vehicles = vehicles.filter(v => selectedVehicleTypes.includes(v.vehicle_type))
    }

    const machineNumbers = vehicles
      .map((v) => v.machine_number)
      .filter(Boolean)

    return machineNumbers.sort((a, b) => a.localeCompare(b, 'ja', { numeric: true }))
  }, [allVehicles, selectedOfficeId, selectedVehicleTypes])

  // 機種フィルターが変更されたとき、無効な機械番号を除外
  useEffect(() => {
    if (selectedMachineNumbers.length > 0 && selectedVehicleTypes.length > 0) {
      const validMachineNumbers = selectedMachineNumbers.filter(num => 
        availableMachineNumbers.includes(num)
      )
      if (validMachineNumbers.length !== selectedMachineNumbers.length) {
        setSelectedMachineNumbers(validMachineNumbers)
      }
    }
  }, [selectedVehicleTypes, availableMachineNumbers])

  // 計画作成時の基地リストを取得（フィルターで選択した事業所の基地を優先表示 + その他の基地）
  const getAvailableBasesForPlan = (vehicleId: string) => {
    // フィルターで事業所が選択されている場合はそれを優先
    if (selectedOfficeId !== "all") {
      // 選択された事業所の基地を優先
      const officeBases = allBases.filter(
        base => base.management_office_id === Number.parseInt(selectedOfficeId)
      )
      
      // その他の基地
      const otherBases = allBases.filter(
        base => base.management_office_id !== Number.parseInt(selectedOfficeId)
      )
      
      return { officeBases, otherBases }
    }
    
    // フィルターが"all"の場合は、選択車両の事業所で絞り込む
    if (!vehicleId) {
      // 車両が選択されていない場合は全基地を返す（管轄基地なし）
      return { officeBases: [], otherBases: allBases }
    }
    
    const vehicle = allVehicles.find(v => v.id.toString() === vehicleId)
    if (!vehicle || !vehicle.management_office_id) {
      // 車両が見つからない、または事業所が未設定の場合は全基地を返す
      return { officeBases: [], otherBases: allBases }
    }
    
    // 選択車両の事業所の基地を優先
    const officeBases = allBases.filter(
      base => base.management_office_id === vehicle.management_office_id
    )
    
    // その他の基地
    const otherBases = allBases.filter(
      base => base.management_office_id !== vehicle.management_office_id
    )
    
    return { officeBases, otherBases }
  }

  // 車両と日付から検査予告情報を取得するヘルパー関数
  const getInspectionWarning = (vehicleId: string | number, dateString: string) => {
    return inspectionSchedules.find(schedule => 
      String(schedule.vehicle_id) === String(vehicleId) && 
      schedule.is_warning && 
      schedule.is_in_period
    )
  }

  // 検修スケジュール取得（特定日付）
  const getMaintenanceScheduleForDate = (vehicleId: string | number, dateString: string) => {
    return filteredMaintenanceSchedules.find(
      (schedule) => {
        if (schedule.vehicle_id.toString() !== vehicleId.toString()) return false
        
        const scheduleDate = new Date(schedule.next_scheduled_date).toISOString().slice(0, 10)
        const checkDate = new Date(dateString).toISOString().slice(0, 10)
        
        // 予定日の当日または予定日から期間内をチェック
        const scheduleDateObj = new Date(scheduleDate)
        const checkDateObj = new Date(checkDate)
        const endDateObj = new Date(scheduleDateObj)
        endDateObj.setDate(endDateObj.getDate() + (schedule.duration_days - 1))
        
        return checkDateObj >= scheduleDateObj && checkDateObj <= endDateObj
      }
    )
  }

  // 機種別にグループ化された車両を取得（固定順序）
  const vehiclesByType = useMemo(() => {
    const grouped: Record<string, Vehicle[]> = {}

    // 固定順序で初期化
    VEHICLE_TYPE_ORDER.forEach((type) => {
      grouped[type] = []
    })

    filteredVehicles.forEach((vehicle) => {
      const type = vehicle.vehicle_type || vehicle.name || "その他"
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type].push(vehicle)
    })

    // 各機種内で機械番号順にソート
    Object.keys(grouped).forEach((type) => {
      grouped[type].sort((a, b) => (a.machine_number || "").localeCompare(b.machine_number || "", 'ja', { numeric: true }))
    })

    // 空の機種を除外
    const result: Record<string, Vehicle[]> = {}
    
    // まずVEHICLE_TYPE_ORDERの順に並べる
    VEHICLE_TYPE_ORDER.forEach(type => {
      if (grouped[type]?.length > 0) {
        result[type] = grouped[type]
      }
    })
    
    // その他の機種を追加
    Object.entries(grouped).forEach(([type, vehicles]) => {
      if (!VEHICLE_TYPE_ORDER.includes(type) && vehicles.length > 0) {
        result[type] = vehicles
      }
    })

    return result
  }, [filteredVehicles])

  // 特定の車両と日付の運用計画を取得（単一）
  const getPlanForVehicleAndDate = (vehicleId: number, date: string) => {
    const plans = getPlansForVehicleAndDate(vehicleId, date)
    return plans[0] || undefined
  }

  // 翌日にまたがるかチェック（end_dateがplan_dateより大きい場合）
  const isOvernight = (plan?: OperationPlan) => {
    if (!plan?.plan_date) return false
    const planDate = plan.plan_date.split('T')[0]
    const endDate = plan.end_date ? plan.end_date.split('T')[0] : planDate
    return endDate > planDate
  }

  // 前日から継続する計画を取得（前日開始で当日終了の計画のみ）
  const getPreviousDayOvernightPlans = (vehicleId: string | number, date: string) => {
    const targetDate = date.split('T')[0]
    
    const prevPlans = operationPlans.filter((p) => {
      if (String(p.vehicle_id) !== String(vehicleId)) return false
      
      const planDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
      const endDate = p.end_date ? (typeof p.end_date === 'string' ? p.end_date.split('T')[0] : p.end_date) : planDate
      
      // 【重要】計画日が当日より前で、終了日が当日の計画のみ
      // ★計画日が当日またはそれ以降の場合は絶対に含めない★
      const isPreviousDayStart = planDate < targetDate
      const isCurrentDayEnd = endDate === targetDate
      
      // 計画日が当日以降なら除外（当日開始の計画は前日継続ではない）
      if (planDate >= targetDate) return false
      
      return isPreviousDayStart && isCurrentDayEnd
    })
    
    return prevPlans
  }

  // 特定の車両と日付の全運用計画を取得（複数）- 当日開始の計画のみ
  const getPlansForVehicleAndDate = (vehicleId: string | number, date: string) => {
    // 全計画を確認（最初の呼び出しのみ）
    const firstVehicleId = filteredVehicles[0]?.id
    if (String(vehicleId) === String(firstVehicleId) && date === getDateString(1)) {
      console.log("=== 計画検索デバッグ ===")
      console.log("検索条件:", { vehicleId, date })
      console.log("全運用計画:", operationPlans.length, "件")
      console.log("計画サンプル:", operationPlans[0])
    }
    
    const plans = operationPlans.filter((p) => {
      // 日付を正規化して比較（タイムスタンプがある場合は日付部分のみ取得）
      const planDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
      // 当日開始の計画のみを取得（文字列として比較）
      return String(p.vehicle_id) === String(vehicleId) && planDate === date
    })
    
    return plans
  }

  // 検修期間中かどうかを判定（plan_dateからend_dateまで）
  const isInMaintenancePeriod = (vehicleId: string | number, date: string): OperationPlan | undefined => {
    return operationPlans.find((plan) => {
      if (String(plan.vehicle_id) !== String(vehicleId) || plan.shift_type !== 'maintenance') return false
      
      const planStartDate = typeof plan.plan_date === 'string' ? plan.plan_date.split('T')[0] : plan.plan_date
      const planEndDate = plan.end_date 
        ? (typeof plan.end_date === 'string' ? plan.end_date.split('T')[0] : plan.end_date)
        : planStartDate
      
      return date >= planStartDate && date <= planEndDate
    })
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const [year, month] = currentMonth.split("-").map(Number)
    const newDate = new Date(year, month - 1, 1)

    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }

    setCurrentMonth(newDate.toISOString().slice(0, 7))
  }

  // カレンダービューから計画を編集
  const handleCalendarPlanClick = (plan: OperationPlan) => {
    handleCellClick(plan.vehicle_id, plan.plan_date.split("T")[0], plan)
  }

  const getShiftBadgeColor = (shiftType: string) => {
    switch (shiftType) {
      case "day":
        return "bg-yellow-100 text-yellow-800"
      case "night":
        return "bg-blue-700 text-white font-bold"
      case "day_night":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // セルクリック時の処理（新規計画作成または編集）
  const handleCellClick = (vehicleId: string | number, date: string, planToEdit?: OperationPlan) => {
    console.log('セルクリック:', { vehicleId, date, planToEdit })
    
    // エラー状態をリセット
    setError(null)
    setTimeFieldErrors({ start: false, end: false })
    setConflictDetails({ start: null, end: null })
    setBaseFieldErrors({ departure: false, arrival: false })
    setBaseConflictDetails({ departure: null, arrival: null })
    setConflictDetails({ start: null, end: null })
    
    if (planToEdit) {
      // 既存計画の編集
      setEditingPlan(planToEdit)
      const planDate = typeof planToEdit.plan_date === 'string' ? planToEdit.plan_date.split('T')[0] : planToEdit.plan_date
      const endDate = planToEdit.end_date ? (typeof planToEdit.end_date === 'string' ? planToEdit.end_date.split('T')[0] : planToEdit.end_date) : ""
      setPlanForm({
        vehicle_id: planToEdit.vehicle_id.toString(),
        plan_date: planDate,
        end_date: endDate,
        shift_type: planToEdit.shift_type || "day",
        inspection_type_id: "",
        start_time: planToEdit.start_time || "08:00",
        end_time: planToEdit.end_time || "17:00",
        departure_base_id: planToEdit.departure_base_id?.toString() || "",
        arrival_base_id: planToEdit.arrival_base_id?.toString() || "",
        planned_distance: planToEdit.planned_distance || 0,
        notes: planToEdit.notes || "",
      })
    } else {
      setEditingPlan(null)
      setPlanForm({
        vehicle_id: vehicleId.toString(),
        plan_date: date,
        end_date: "",
        shift_type: "day",
        inspection_type_id: "",
        start_time: "08:00",
        end_time: "17:00",
        departure_base_id: "",
        arrival_base_id: "",
        planned_distance: 0,
        notes: "",
      })
    }
    
    setShowPlanModal(true)
  }

  // 計画の保存
  const handleSavePlan = async () => {
    try {
      console.log('=== 保存処理開始 ===')
      console.log('フォームの入力値:', planForm)
      
      // 日付のバリデーション
      if (!planForm.plan_date) {
        setError("計画日を入力してください。")
        return
      }
      
      // 車両IDのバリデーション
      if (!planForm.vehicle_id) {
        setError("車両を選択してください。")
        return
      }
      
      // UUID形式の文字列としてそのまま使用
      const vehicleId = planForm.vehicle_id
      console.log('Vehicle ID (UUID):', vehicleId)
      
      // 日付をローカルタイムゾーン（T00:00:00）として明示的に扱う
      const normalizedPlanDate = planForm.plan_date.includes('T') 
        ? planForm.plan_date.split('T')[0] 
        : planForm.plan_date
      const normalizedEndDate = planForm.end_date 
        ? (planForm.end_date.includes('T') ? planForm.end_date.split('T')[0] : planForm.end_date)
        : normalizedPlanDate
      
      console.log('正規化された日付:', { normalizedPlanDate, normalizedEndDate })
      
      const planData = {
        vehicle_id: vehicleId,
        plan_date: normalizedPlanDate,
        end_date: normalizedEndDate,
        shift_type: planForm.shift_type,
        start_time: planForm.start_time,
        end_time: planForm.end_time,
        planned_distance: planForm.planned_distance,
        departure_base_id: planForm.departure_base_id ? Number.parseInt(planForm.departure_base_id) : null,
        arrival_base_id: planForm.arrival_base_id ? Number.parseInt(planForm.arrival_base_id) : null,
        notes: planForm.notes,
      }
      
      console.log('保存する計画データ:', planData)

      // 時刻の前後関係チェック：同日計画の場合、開始時刻が終了時刻より後はエラー
      if (planData.start_time && planData.end_time) {
        const isSameDay = !planData.end_date || planData.end_date === planData.plan_date
        
        if (isSameDay) {
          // 同日計画の場合、開始時刻 >= 終了時刻はエラー
          if (planData.start_time >= planData.end_time) {
            const vehicle = allVehicles.find(v => v.id === planData.vehicle_id)
            const [year, month, day] = planData.plan_date.split('-').map(Number)
            
            setTimeFieldErrors({ start: true, end: true })
            setConflictDetails({
              start: '開始時刻が終了時刻より後になっています',
              end: '終了時刻が開始時刻より前になっています'
            })
            
            setError(
              `時刻の入力エラー\n\n${vehicle?.machine_number || '選択した車両'}の${month}月${day}日の計画で、開始時刻（${planData.start_time}）が終了時刻（${planData.end_time}）より後になっています。\n\n翌日にまたがる運用の場合は、「終了日」を翌日に設定してください。\n同日内の運用の場合は、開始時刻を終了時刻より前に設定してください。`
            )
            return // 保存をブロック
          }
        }
      }

      // 時間の重複チェック：同じ日に同じ車両の時間が重複していないか
      if (planData.start_time && planData.end_time) {
        const sameDayPlans = operationPlans.filter((p) => {
          // 編集中の計画は除外
          if (editingPlan && p.id === editingPlan.id) return false
          
          const pDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
          const pEndDate = p.end_date ? (typeof p.end_date === 'string' ? p.end_date.split('T')[0] : p.end_date) : pDate
          
          // 同じ車両で、plan_dateまたはend_dateが対象日と重複する計画を検索
          return p.vehicle_id === planData.vehicle_id && 
                 (pDate === planData.plan_date || 
                  pEndDate === planData.plan_date ||
                  (pDate <= planData.plan_date && pEndDate >= planData.plan_date))
        })
        
        // 時間の重複をチェック（翌日またぎと前日継続を考慮）
        const overlappingPlan = sameDayPlans.find((p) => {
          if (!p.start_time || !p.end_time) return false
          
          // 時刻を分単位に変換
          const timeToMinutes = (time: string) => {
            const [hours, minutes] = time.split(':').map(Number)
            return hours * 60 + minutes
          }
          
          const pDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
          const pEndDate = p.end_date ? (typeof p.end_date === 'string' ? p.end_date.split('T')[0] : p.end_date) : pDate
          
          // 前日からの継続計画かチェック
          const isPreviousDayContinuation = pDate < planData.plan_date && pEndDate === planData.plan_date
          
          // 既存計画が翌日またぎかチェック（当日開始の場合のみ）
          const isExistingOvernight = pDate === planData.plan_date && pEndDate > pDate
          
          // 新規計画が翌日またぎかチェック
          const isNewOvernight = planData.end_date > planData.plan_date
          
          let existingStartMin: number
          let existingEndMin: number
          
          if (isPreviousDayContinuation) {
            // 前日からの継続計画の場合、当日は00:00から終了時刻まで
            existingStartMin = 0
            existingEndMin = timeToMinutes(p.end_time)
            console.log('前日継続計画を検出:', {
              plan_date: pDate,
              end_date: pEndDate,
              end_time: p.end_time,
              range: `00:00-${p.end_time} (0-${existingEndMin}分)`
            })
          } else {
            // 当日開始の計画
            existingStartMin = timeToMinutes(p.start_time)
            existingEndMin = timeToMinutes(p.end_time) + (isExistingOvernight ? 1440 : 0)
          }
          
          // 新規計画の時間範囲
          const newStartMin = timeToMinutes(planData.start_time)
          const newEndMin = timeToMinutes(planData.end_time) + (isNewOvernight ? 1440 : 0)
          
          console.log('時間重複チェック:', {
            existing: {
              time: `${p.start_time}-${p.end_time}`,
              range: `${existingStartMin}-${existingEndMin}分`,
              isPreviousDayContinuation,
              isOvernight: isExistingOvernight
            },
            new: {
              time: `${planData.start_time}-${planData.end_time}`,
              range: `${newStartMin}-${newEndMin}分`,
              isOvernight: isNewOvernight
            }
          })
          
          // 重複判定（境界を含まない）
          const hasOverlap = newStartMin < existingEndMin && newEndMin > existingStartMin
          
          if (hasOverlap) {
            console.log('⚠️ 時間重複を検出！')
          }
          
          return hasOverlap
        })
        
        if (overlappingPlan) {
          const vehicle = allVehicles.find(v => v.id === planData.vehicle_id)
          const [year, month, day] = planData.plan_date.split('-').map(Number)
          const pDate = typeof overlappingPlan.plan_date === 'string' ? overlappingPlan.plan_date.split('T')[0] : overlappingPlan.plan_date
          const pEndDate = overlappingPlan.end_date ? 
            (typeof overlappingPlan.end_date === 'string' ? overlappingPlan.end_date.split('T')[0] : overlappingPlan.end_date) : 
            pDate
          const isPreviousDayContinuation = pDate < planData.plan_date && pEndDate === planData.plan_date
          const isOvernight = pDate === planData.plan_date && pEndDate > planData.plan_date
          
          let timeRange = ''
          if (isPreviousDayContinuation) {
            timeRange = `前日${overlappingPlan.start_time?.slice(0,5)}～当日${overlappingPlan.end_time?.slice(0,5)}`
          } else if (isOvernight) {
            timeRange = `${overlappingPlan.start_time?.slice(0,5)}～${overlappingPlan.end_time?.slice(0,5)}(翌日)`
          } else {
            timeRange = `${overlappingPlan.start_time?.slice(0,5)}～${overlappingPlan.end_time?.slice(0,5)}`
          }
          
          // 重複している時刻フィールドを判定
          const newStartMin = parseInt(planData.start_time.replace(':', ''))
          const newEndMin = parseInt(planData.end_time.replace(':', ''))
          const existingStartMin = overlappingPlan.start_time ? parseInt(overlappingPlan.start_time.replace(':', '')) : 0
          const existingEndMin = overlappingPlan.end_time ? parseInt(overlappingPlan.end_time.replace(':', '')) : 2400
          
          // どちらのフィールドにエラーがあるか判定
          const startHasError = isPreviousDayContinuation 
            ? newStartMin < existingEndMin 
            : newStartMin < existingEndMin && newStartMin >= existingStartMin
          const endHasError = newEndMin > existingStartMin && newEndMin <= existingEndMin
          
          const conflictInfo = `${timeRange}の計画と重複`
          
          setTimeFieldErrors({ 
            start: startHasError || (!startHasError && !endHasError), 
            end: endHasError || (!startHasError && !endHasError)
          })
          
          setConflictDetails({
            start: (startHasError || (!startHasError && !endHasError)) ? conflictInfo : null,
            end: (endHasError || (!startHasError && !endHasError)) ? conflictInfo : null
          })
          
          setError(
            `時間が重複しています。\n\n${vehicle?.machine_number || '選択した車両'}は、${month}月${day}日の${timeRange}に既に運用計画があります。\n\n同じ車両が同じ時間帯に2つの運用計画を設定することはできません。開始時刻または終了時刻を変更してください。`
          )
          return // 保存をブロック
        }
        
        // 境界が完全一致する場合の警告（例: 前が08:00終了、後が08:00開始）
        const boundaryConflict = sameDayPlans.find((p) => {
          if (!p.start_time || !p.end_time) return false
          
          // 既存計画が翌日またぎかチェック
          const pDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
          const pEndDate = p.end_date ? (typeof p.end_date === 'string' ? p.end_date.split('T')[0] : p.end_date) : pDate
          const isExistingOvernight = pEndDate > pDate
          
          // 翌日またぎの場合、終了時刻は翌日なので境界一致はない
          if (isExistingOvernight) return false
          
          const newStart = planData.start_time
          const newEnd = planData.end_time
          const existingStart = p.start_time
          const existingEnd = p.end_time
          
          return newStart === existingEnd || newEnd === existingStart
        })
        
        if (boundaryConflict) {
          const vehicle = allVehicles.find(v => v.id === planData.vehicle_id)
          const [year, month, day] = planData.plan_date.split('-').map(Number)
          const timePoint = planData.start_time === boundaryConflict.end_time ? planData.start_time : planData.end_time
          
          const isStartConflict = planData.start_time === boundaryConflict.end_time
          const isEndConflict = planData.end_time === boundaryConflict.start_time
          const conflictInfo = `${boundaryConflict.start_time}～${boundaryConflict.end_time}の計画と${timePoint}で重複`
          
          // 境界が重なっているフィールドを判定
          setTimeFieldErrors({
            start: isStartConflict,
            end: isEndConflict
          })
          
          setConflictDetails({
            start: isStartConflict ? conflictInfo : null,
            end: isEndConflict ? conflictInfo : null
          })
          
          setError(
            `時間が重複しています。\n\n${vehicle?.machine_number || '選択した車両'}は、${month}月${day}日の${timePoint}に既存の計画と時刻が重なっています。\n\n連続する運用の場合、終了時刻と開始時刻を1分ずらしてください。\n（例: 07:59終了 → 08:00開始）`
          )
          return // 保存をブロック
        }
        
        // 前後の計画との整合性チェック
        // 1. 同じ車両の同日または前後日の計画を時系列で取得
        const allVehiclePlans = operationPlans
          .filter((p) => {
            if (editingPlan && p.id === editingPlan.id) return false
            return p.vehicle_id === planData.vehicle_id
          })
          .sort((a, b) => {
            const aDate = typeof a.plan_date === 'string' ? a.plan_date.split('T')[0] : a.plan_date
            const bDate = typeof b.plan_date === 'string' ? b.plan_date.split('T')[0] : b.plan_date
            const dateCompare = aDate.localeCompare(bDate)
            if (dateCompare !== 0) return dateCompare
            return (a.start_time || '').localeCompare(b.start_time || '')
          })
        
        // 2. 新規計画の直前の計画を見つける
        const previousPlan = allVehiclePlans
          .filter((p) => {
            const pDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
            const pEndDate = p.end_date ? (typeof p.end_date === 'string' ? p.end_date.split('T')[0] : p.end_date) : pDate
            
            // 終了日時（end_date + end_time）が新規計画の開始日時（plan_date + start_time）より前
            // 1. 終了日が新規計画開始日より前
            if (pEndDate < planData.plan_date) return true
            // 2. 終了日が同じで、終了時刻が開始時刻より前（厳密に<）
            if (pEndDate === planData.plan_date && (p.end_time || '') < planData.start_time) return true
            return false
          })
          .pop() // 時系列でソート済みなので最後の要素が直前の計画
        
        // 3. 新規計画の直後の計画を見つける
        const nextPlan = allVehiclePlans
          .find((p) => {
            const pDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
            const newEndDate = planData.end_date || planData.plan_date
            
            // 計画日が新規計画の終了日より後、または同日で開始時刻が終了時刻より後（厳密に>を使用）
            if (pDate > newEndDate) return true
            if (pDate === newEndDate && (p.start_time || '') > planData.end_time) return true
            return false
          })
        
        console.log('前後の計画チェック:', { 
          previousPlan: previousPlan ? {
            date: previousPlan.plan_date,
            endDate: previousPlan.end_date,
            time: `${previousPlan.start_time}-${previousPlan.end_time}`,
            bases: `${previousPlan.departure_base_id}->${previousPlan.arrival_base_id}`
          } : null,
          nextPlan: nextPlan ? {
            date: nextPlan.plan_date,
            time: `${nextPlan.start_time}-${nextPlan.end_time}`,
            bases: `${nextPlan.departure_base_id}->${nextPlan.arrival_base_id}`
          } : null,
          newPlan: {
            date: planData.plan_date,
            endDate: planData.end_date,
            time: `${planData.start_time}-${planData.end_time}`,
            bases: `${planData.departure_base_id}->${planData.arrival_base_id}`
          }
        })
        
        // 4. 前の計画の到着基地と新規計画の出発基地の整合性チェック
        if (previousPlan && previousPlan.arrival_base_id && planData.departure_base_id) {
          if (previousPlan.arrival_base_id?.toString() !== planData.departure_base_id?.toString()) {
            const prevArrivalBase = allBases.find(b => b.id?.toString() === previousPlan.arrival_base_id?.toString())
            const newDepartureBase = allBases.find(b => b.id?.toString() === planData.departure_base_id?.toString())
            const vehicle = allVehicles.find(v => v.id === planData.vehicle_id)
            const prevEndDate = previousPlan.end_date ? 
              (typeof previousPlan.end_date === 'string' ? previousPlan.end_date.split('T')[0] : previousPlan.end_date) : 
              (typeof previousPlan.plan_date === 'string' ? previousPlan.plan_date.split('T')[0] : previousPlan.plan_date)
            const [year, month, day] = prevEndDate.split('-').map(Number)
            
            setBaseFieldErrors({ departure: true, arrival: false })
            setBaseConflictDetails({
              departure: `前の計画は${prevArrivalBase?.base_name}に留置。${prevArrivalBase?.base_name}から出発する必要があります`,
              arrival: null
            })
            
            setError(
              `出発基地の整合性エラー\n\n${vehicle?.machine_number || '選択した車両'}は、前の運用計画で${month}月${day}日 ${previousPlan.end_time}に${prevArrivalBase?.base_name}に到着・留置されています。\n\n新しい計画の出発基地は${prevArrivalBase?.base_name}である必要がありますが、${newDepartureBase?.base_name}が選択されています。`
            )
            return // 保存をブロック
          }
        }
        
        // 5. 新規計画の到着基地と次の計画の出発基地の整合性チェック（翌日以内の場合のみ）
        if (nextPlan && nextPlan.departure_base_id && planData.arrival_base_id) {
          const nextDate = typeof nextPlan.plan_date === 'string' ? nextPlan.plan_date.split('T')[0] : nextPlan.plan_date
          const newEndDate = planData.end_date || planData.plan_date
          
          // 次の計画が翌日以内の場合のみ基地の整合性をチェック
          const newEndDateObj = new Date(newEndDate)
          const nextDateObj = new Date(nextDate)
          const daysDiff = Math.floor((nextDateObj.getTime() - newEndDateObj.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysDiff <= 1) {
            if (nextPlan.departure_base_id?.toString() !== planData.arrival_base_id?.toString()) {
              const newArrivalBase = allBases.find(b => b.id?.toString() === planData.arrival_base_id?.toString())
              const nextDepartureBase = allBases.find(b => b.id?.toString() === nextPlan.departure_base_id?.toString())
              const vehicle = allVehicles.find(v => v.id === planData.vehicle_id)
              const [year, month, day] = nextDate.split('-').map(Number)
              
              setBaseFieldErrors({ departure: false, arrival: true })
              setBaseConflictDetails({
                departure: null,
                arrival: `次の計画は${nextDepartureBase?.base_name}から出発。${nextDepartureBase?.base_name}に留置する必要があります`
              })
              
              setError(
                `到着基地の整合性エラー\n\n${vehicle?.machine_number || '選択した車両'}は、次の運用計画で${month}月${day}日 ${nextPlan.start_time}に${nextDepartureBase?.base_name}から出発予定です。\n\n新しい計画の到着基地は${nextDepartureBase?.base_name}である必要がありますが、${newArrivalBase?.base_name}が選択されています。`
              )
              return // 保存をブロック
            }
          }
        }
        
        // 6. 新規計画の終了時刻と次の計画の開始時刻の重複チェック
        if (nextPlan && nextPlan.start_time && planData.end_time) {
          const nextDate = typeof nextPlan.plan_date === 'string' ? nextPlan.plan_date.split('T')[0] : nextPlan.plan_date
          const newEndDate = planData.end_date || planData.plan_date
          
          // 終了日と次の計画の開始日が同じ場合のみ時刻チェック
          if (newEndDate === nextDate) {
            const newEndTime = planData.end_time
            const nextStartTime = nextPlan.start_time
            
            // 終了時刻が次の開始時刻以上の場合はエラー（同時刻も不可）
            if (newEndTime >= nextStartTime) {
              const vehicle = allVehicles.find(v => v.id === planData.vehicle_id)
              const [year, month, day] = nextDate.split('-').map(Number)
              
              setTimeFieldErrors({ start: false, end: true })
              setConflictDetails({
                start: null,
                end: `次の計画は${nextStartTime}開始。${nextStartTime}より前に終了する必要があります`
              })
              
              setError(
                `時間の重複エラー\n\n${vehicle?.machine_number || '選択した車両'}は、${month}月${day}日 ${nextStartTime}から次の運用計画が始まります。\n\n新しい計画の終了時刻（${newEndTime}）が次の計画の開始時刻以降になっています。終了時刻を${nextStartTime}より前に変更してください。`
              )
              return // 保存をブロック
            }
          }
        }
      }

      // 検修の場合は検査テーブルに保存
      if (planForm.shift_type === "maintenance" && planForm.inspection_type_id) {
        const inspectionType = inspectionTypes.find(t => t.id.toString() === planForm.inspection_type_id)
        const inspectionData = {
          vehicle_id: planData.vehicle_id,
          inspection_type: inspectionType?.type_name || "",
          inspection_category: inspectionType?.category || "定期検査",
          planned_start_date: planData.plan_date,
          planned_end_date: planData.plan_date,
          status: "planned",
          notes: planData.notes
        }

        await apiCall("inspections", {
          method: "POST",
          body: JSON.stringify(inspectionData),
        })
      } else {
        // 運用の場合は運用計画テーブルに保存
        if (editingPlan) {
          // 更新
          await apiCall(`operation-plans/${editingPlan.id}`, {
            method: "PUT",
            body: JSON.stringify(planData),
          })
        } else {
          // 新規作成
          await apiCall("operation-plans", {
            method: "POST",
            body: JSON.stringify(planData),
          })
        }
      }

      await fetchData()
      setShowPlanModal(false)
      setEditingPlan(null)
      setError(null)
      setTimeFieldErrors({ start: false, end: false })
      setConflictDetails({ start: null, end: null })
      setBaseFieldErrors({ departure: false, arrival: false })
      setBaseConflictDetails({ departure: null, arrival: null })
      console.log("保存後、運用計画:", operationPlans.length)
    } catch (error) {
      console.error("Error saving plan:", error)
      setError("計画の保存に失敗しました。")
      setTimeFieldErrors({ start: false, end: false })
      setConflictDetails({ start: null, end: null })
      setBaseFieldErrors({ departure: false, arrival: false })
      setBaseConflictDetails({ departure: null, arrival: null })
    }
  }

  // 計画の削除
  const handleDeletePlan = async () => {
    if (!editingPlan) return

    try {
      await apiCall(`operation-plans/${editingPlan.id}`, {
        method: "DELETE",
      })

      fetchData()
      setShowPlanModal(false)
      setEditingPlan(null)
    } catch (error) {
      console.error("Error deleting plan:", error)
      setError("計画の削除に失敗しました。")
    }
  }

  // 前月からのコピー
  const copyFromPreviousMonth = async () => {
    try {
      const [year, month] = currentMonth.split("-").map(Number)
      const prevMonth = new Date(year, month - 1, 1)
      prevMonth.setMonth(prevMonth.getMonth() - 1)
      const prevMonthString = prevMonth.toISOString().slice(0, 7)

      const prevPlans = await apiCall<OperationPlan[]>(`operation-plans?month=${prevMonthString}`)

      // 前月の計画を当月にコピー
      const copyPromises = prevPlans.map((plan) => {
        // 日付を正規化（YYYY-MM-DD形式に統一）
        const normalizedPlanDate = plan.plan_date.split('T')[0]
        const normalizedEndDate = plan.end_date ? plan.end_date.split('T')[0] : normalizedPlanDate
        
        const planDate = normalizedPlanDate.replace(prevMonthString, currentMonth)
        const endDate = normalizedEndDate.replace(prevMonthString, currentMonth)
        
        const newPlan = {
          vehicle_id: plan.vehicle_id,
          plan_date: planDate,
          end_date: endDate,
          shift_type: plan.shift_type,
          start_time: plan.start_time,
          end_time: plan.end_time,
          planned_distance: plan.planned_distance,
          departure_base_id: plan.departure_base_id,
          arrival_base_id: plan.arrival_base_id,
          notes: plan.notes,
        }

        return apiCall("operation-plans", {
          method: "POST",
          body: JSON.stringify(newPlan),
        })
      })

      await Promise.all(copyPromises)
      fetchData()
    } catch (error) {
      console.error("Error copying from previous month:", error)
      setError("前月からのコピーに失敗しました。")
    }
  }

  // フィルターリセット
  const resetFilters = () => {
    setSelectedOfficeId("all")
    setSelectedVehicleTypes([])
    setSelectedMachineNumbers([])
  }

  // Excelエクスポート
  const handleExportToExcel = async () => {
    try {
      const { exportOperationPlanToA3Excel } = await import('@/lib/excel-export')
      await exportOperationPlanToA3Excel(
        filteredVehicles,       // 1. 車両データ
        filteredOperationPlans, // 2. 運用計画データ
        [],                     // 3. 検査データ（現在は空配列）
        currentMonth,           // 4. 月（"YYYY-MM" 形式の文字列）
        allBases                // 5. 基地データ（基地名表示用）
      )
    } catch (error) {
      console.error('Excel export error:', error)
      setError('Excelエクスポートに失敗しました。')
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* メインタブ切り替え */}
      <Tabs value={mainTab} onValueChange={(value) => setMainTab(value as "operations" | "settings")}>
        <TabsList className="mb-4">
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            運用計画
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            検修設定
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-6">
          {/* ローディングオーバーレイ */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 font-medium">データを読み込んでいます...</p>
              </div>
            </div>
          )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Badge className="bg-blue-50 text-blue-600 border-0">
            <Calendar className="w-4 h-4 mr-1" />
            計画作成
          </Badge>
          {isPastMonth && (
            <Badge variant="destructive">
              <AlertCircle className="w-4 h-4 mr-1" />
              過去月は編集できません
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <Select 
              value={currentMonth.split('-')[0]} 
              onValueChange={(year) => {
                const month = currentMonth.split('-')[1]
                setCurrentMonth(`${year}-${month}`)
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 1 + i
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}年
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Select 
              value={currentMonth.split('-')[1]} 
              onValueChange={(month) => {
                const year = currentMonth.split('-')[0]
                setCurrentMonth(`${year}-${month}`)
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = (i + 1).toString().padStart(2, '0')
                  return (
                    <SelectItem key={month} value={month}>
                      {i + 1}月
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          {!isPastMonth && (
            <Button variant="outline" size="sm" onClick={copyFromPreviousMonth}>
              <Copy className="w-4 h-4 mr-2" />
              前月からコピー
            </Button>
          )}
        </div>
      </div>

      {/* 月の概要情報 */}
      <Card className="bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-lg">
                  {new Date(currentMonth + "-01").toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                  })} の運用計画
                </h3>
                <p className="text-sm text-blue-600">
                  {isPastMonth ? "過去月のため編集はできません" : "セルをクリックして運用計画を作成・編集できます"}
                </p>
                
                {/* 検査予定の表示 */}
                {inspectionSchedules.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(() => {
                      // 検査種別ごとに集計
                      const summaryMap = new Map();
                      inspectionSchedules.forEach(s => {
                        const key = `${s.inspection_type}`;
                        if (!summaryMap.has(key)) {
                          summaryMap.set(key, {
                            type: s.inspection_type,
                            duration: s.duration_days,
                            machines: []
                          });
                        }
                        summaryMap.get(key).machines.push(s.machine_number);
                      });

                      return Array.from(summaryMap.values()).map((summary, idx) => (
                        <div key={idx} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-md border border-orange-200 flex items-center shadow-sm animate-pulse">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          <span>今月に <strong>{summary.type}</strong> があります。({summary.machines.join(', ')}) 検修期間は<strong>{summary.duration || '未設定'}</strong>日です。</span>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                運用計画: {operationPlans.length}件
              </div>
              <div className="text-sm text-gray-600">対象車両: {filteredVehicles.length}台</div>
              {selectedOfficeId !== "all" && (
                <div className="text-sm text-blue-600">
                  {allOffices.find((o) => o.id === Number.parseInt(selectedOfficeId))?.office_name}でフィルタリング中
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>フィルター</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="officeFilter" className="text-sm font-medium">
                事業所
              </Label>
              <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
                <SelectTrigger>
                  <SelectValue placeholder="事業所を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ての事業所</SelectItem>
                  {availableOffices.filter(office => office.id).map((office) => (
                    <SelectItem key={office.id} value={office.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4" />
                        <span>{office.office_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleTypeFilter" className="text-sm font-medium">
                機種（複数選択可）
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Car className="w-4 h-4 mr-2" />
                    {selectedVehicleTypes.length === 0 ? (
                      <span>全ての機種</span>
                    ) : (
                      <span>{selectedVehicleTypes.length}件選択中</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {availableVehicleTypes.map((type) => (
                          <CommandItem
                            key={type}
                            onSelect={() => {
                              setSelectedVehicleTypes(prev => 
                                prev.includes(type) 
                                  ? prev.filter(t => t !== type)
                                  : [...prev, type]
                              )
                            }}
                          >
                            <Checkbox
                              checked={selectedVehicleTypes.includes(type)}
                              className="mr-2"
                            />
                            <Car className="w-4 h-4 mr-2" />
                            <span>{type}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="machineNumberFilter" className="text-sm font-medium">
                機械番号（複数選択可）
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Car className="w-4 h-4 mr-2" />
                    {selectedMachineNumbers.length === 0 ? (
                      <span>全ての機械番号</span>
                    ) : (
                      <span>{selectedMachineNumbers.length}件選択中</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {availableMachineNumbers.map((number) => (
                          <CommandItem
                            key={number}
                            onSelect={() => {
                              setSelectedMachineNumbers(prev => 
                                prev.includes(number) 
                                  ? prev.filter(n => n !== number)
                                  : [...prev, number]
                              )
                            }}
                          >
                            <Checkbox
                              checked={selectedMachineNumbers.includes(number)}
                              className="mr-2"
                            />
                            <Car className="w-4 h-4 mr-2" />
                            <span>{number}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-gray-600">
              {selectedOfficeId !== "all" || selectedVehicleTypes.length > 0 || selectedMachineNumbers.length > 0 ? (
                <div className="flex items-center space-x-2">
                  <span>フィルター適用中:</span>
                  {selectedOfficeId !== "all" && (
                    <Badge variant="secondary">
                      {availableOffices.find((o) => o.id === Number.parseInt(selectedOfficeId))?.office_name}
                    </Badge>
                  )}
                  {selectedMachineNumbers.map((number) => (
                    <Badge key={number} variant="secondary">{number}</Badge>
                  ))}
                </div>
              ) : (
                <span>全てのデータを表示中</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFilters}
                disabled={selectedOfficeId === "all" && selectedVehicleTypes.length === 0 && selectedMachineNumbers.length === 0}
              >
                フィルターをリセット
              </Button>
              <div className="w-4" />
              <Button variant="outline" size="sm" onClick={handleExportToExcel} className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                <FileText className="w-4 h-4 mr-2" />
                エクスポート
              </Button>
            </div>
          </div>

          {/* 補足説明 */}
          <div className="mt-2">
            <div className="text-xs text-blue-600 font-medium text-right">
              ※ フィルターで絞り込んだデータがエクセル（A3）でエクスポートされます。
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 運用計画表 */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "calendar")}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>{currentMonth} 運用計画</span>
                  <Badge variant="outline" className="text-blue-600">
                    計画作成・編集
                  </Badge>
                </CardTitle>
                <div className="text-sm text-gray-600 mt-2">
                  {viewMode === "table" 
                    ? "セルをクリックして運用計画を作成・編集できます。青色は計画済み、グレーは未計画を表示します。"
                    : "カレンダー形式で運用計画を表示します。日付をクリックして詳細を確認できます。"
                  }
                </div>
              </div>
              <TabsList>
                <TabsTrigger value="calendar" className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>カレンダー</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center space-x-1">
                  <span>表形式</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="table" className="mt-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-gray-50 text-left min-w-24">機種</th>
                      <th className="border p-2 bg-gray-50 text-left min-w-32">機械番号</th>
                      {days.map((day) => (
                        <th key={day} className="border p-1 bg-gray-50 text-center min-w-32">
                          {day}
                        </th>
                      ))}
                    </tr>
              </thead>
              <tbody>
                {Object.entries(vehiclesByType).length === 0 ? (
                  <tr>
                    <td colSpan={days.length + 2} className="border p-8 text-center">
                      <div className="flex flex-col items-center space-y-2 text-gray-500">
                        <Car className="w-12 h-12 text-gray-400" />
                        <p className="font-medium">表示する車両がありません</p>
                        <p className="text-sm">
                          {selectedOfficeId !== "all" || selectedVehicleTypes.length > 0 || selectedMachineNumbers.length > 0
                            ? "フィルター条件を変更してください"
                            : "車両データを追加してください"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  Object.entries(vehiclesByType).map(([vehicleType, vehicles]) =>
                  vehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td className="border p-2 bg-blue-50">
                        <div className="flex items-center space-x-2">
                          <Car className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{vehicleType}</span>
                        </div>
                      </td>
                      <td className="border p-2 bg-blue-50">
                        <div className="font-medium">{vehicle.machine_number}</div>
                      </td>
                      {days.map((day) => {
                        const dateString = getDateString(day)
                        
                        // 当日開始の計画を取得
                        const allPlans = getPlansForVehicleAndDate(vehicle.id, dateString)
                          .sort((a, b) => {
                            const timeA = a.start_time || '00:00'
                            const timeB = b.start_time || '00:00'
                            return timeA.localeCompare(timeB)
                          })
                        
                        // デバッグログ：車両100の1-3日のみ
                        if (day <= 3 && vehicle.machine_number === '100') {
                          console.log(`\n=== ${day}日 車両100 ===`)
                          console.log('当日開始の計画:', allPlans.map(p => ({
                            id: p.id,
                            plan_date: p.plan_date,
                            end_date: p.end_date,
                            time: `${p.start_time}-${p.end_time}`,
                            shift: p.shift_type
                          })))
                        }
                        
                        // 時刻文字列を正規化するヘルパー関数 (H:MM -> HH:MM)
                        const normalizeTime = (time?: string) => {
                          if (!time) return "00:00"
                          const parts = time.split(':')
                          const h = parts[0] || '00'
                          const m = parts[1] || '00'
                          return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
                        }
                        
                        // 当日計画の時間帯セットを作成（時刻を正規化）
                        const currentDayTimeRanges = allPlans.map(p => ({
                          id: p.id,
                          start: normalizeTime(p.start_time),
                          end: normalizeTime(p.end_time)
                        }))
                        
                        // 前日継続計画を取得
                        const allPreviousDayPlans = getPreviousDayOvernightPlans(vehicle.id, dateString)
                          .filter(p => p.shift_type !== 'maintenance') // 検修は別途表示
                          .sort((a, b) => {
                            const timeA = a.start_time || '00:00'
                            const timeB = b.start_time || '00:00'
                            return timeA.localeCompare(timeB)
                          })
                        
                        // 重複除外：当日計画と同じ時間帯の前日継続は除外
                        const previousDayPlans = allPreviousDayPlans.filter(prevPlan => {
                          // 前日継続の時刻を正規化
                          const prevStart = normalizeTime(prevPlan.start_time)
                          const prevEnd = normalizeTime(prevPlan.end_time)
                          
                          // 当日計画に同じ時間帯が存在する場合は前日継続を除外
                          // ※翌日またぎの計画（22:00-08:00）の場合も、表記が同じなら重複として除外する
                          // （ユーザー要望: Day 1の夜間計画と重複する前日継続表示は不要）
                          for (const currentRange of currentDayTimeRanges) {
                            if (prevStart === currentRange.start && prevEnd === currentRange.end) {
                              return false // 同じ時間帯の前日継続は除外
                            }
                          }
                          
                          return true
                        })

                        
                        // デバッグログ：フィルター後
                        if (day <= 3 && vehicle.machine_number === '100') {
                          console.log('前日継続（フィルター後）:', previousDayPlans.map(p => ({
                            time: `${p.start_time?.slice(0,5)}-${p.end_time?.slice(0,5)}`
                          })))
                          console.log('当日計画の時間帯:', currentDayTimeRanges.map(r => `${r.start}-${r.end}`))
                        }
                        
                        // 前日継続のIDセットを作成
                        const previousPlanIds = new Set(previousDayPlans.map(p => p.id))
                        
                        // 当日計画から前日継続に含まれるIDを除外
                        const plans = allPlans.filter(plan => !previousPlanIds.has(plan.id))
                        
                        // タイムゾーンの影響を避けるため、日付文字列から直接曜日を計算
                        const [year, month, dayNum] = dateString.split('-').map(Number)
                        const isWeekend = new Date(year, month - 1, dayNum).getDay() === 0 || new Date(year, month - 1, dayNum).getDay() === 6
                        const hasAnyPlan = plans.length > 0 || previousDayPlans.length > 0

                        return (
                          <td
                            key={day}
                            className={`border p-1 cursor-pointer transition-colors align-top ${
                              hasAnyPlan
                                ? "bg-blue-100 hover:bg-blue-200"
                                : "bg-gray-50 hover:bg-gray-100"
                            } ${isWeekend ? "bg-red-50" : ""}`}
                            style={{ minHeight: '60px' }}
                            onClick={() => !isPastMonth && handleCellClick(vehicle.id, dateString)}
                          >
                            <div className="space-y-1.5 relative" onClick={(e) => e.stopPropagation()}>
                              {/* 検修期間判定 */}
                              {(() => {
                                const maintenancePlan = isInMaintenancePeriod(vehicle.id, dateString)
                                
                                return (
                                  <>
                                    {/* 前日からの継続計画（検修期間中でも表示、既に検修は除外済み） */}
                                    {previousDayPlans.map((plan, idx) => (
                                      <div 
                                        key={`prev-${plan.id || idx}`} 
                                        className="p-1 rounded bg-amber-50 border-2 border-amber-300"
                                      >
                                        <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                                          <Badge className="text-xs bg-amber-600 text-white whitespace-nowrap">
                                            前日継続
                                          </Badge>
                                          <span className="text-xs font-medium text-amber-900 whitespace-nowrap">
                                            {plan.start_time?.slice(0, 5)}~{plan.end_time?.slice(0, 5)}
                                          </span>
                                        </div>
                                        {plan.departure_base_id && plan.arrival_base_id && (
                                          <div className="text-xs text-amber-700 mt-0.5">
                                            {allBases.find((b) => b.id?.toString() === plan.departure_base_id?.toString())?.base_name || '不明'} → {allBases.find((b) => b.id?.toString() === plan.arrival_base_id?.toString())?.base_name || '不明'}
                                          </div>
                                        )}
                                      </div>
                                    ))}

                                    {/* 検修期間中の表示 */}
                                    {maintenancePlan && (
                                      <div 
                                        className="cursor-pointer hover:bg-blue-50 rounded p-2"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          !isPastMonth && handleCellClick(vehicle.id, dateString, maintenancePlan)
                                        }}
                                      >
                                        <div className="bg-white text-blue-700 border-2 border-blue-400 text-sm px-3 py-2 rounded text-center font-medium">
                                          検修中
                                        </div>
                                      </div>
                                    )}

                                    {/* 検修期間外の通常表示 */}
                                    {!maintenancePlan && (
                                      <>
                                        {/* 検修予定バッジ */}
                                        {(() => {
                                          const schedule = getMaintenanceScheduleForDate(vehicle.id, dateString)
                                          if (schedule) {
                                            return (
                                              <div className="mb-1">
                                                <MaintenanceScheduleBadge schedule={schedule} compact={true} />
                                              </div>
                                            )
                                          }
                                          return null
                                        })()}
                                        
                                        {/* 検査予告バッジ */}
                                        {(() => {
                                          const warning = getInspectionWarning(vehicle.id, dateString)
                                          if (warning) {
                                            return (
                                              <div className="mb-1">
                                                <Badge className="text-xs bg-yellow-500 text-white whitespace-nowrap">
                                                  <AlertCircle className="w-3 h-3 mr-1 inline" />
                                                  {warning.next_inspection_type}予告 (残{warning.days_until_inspection}日)
                                                </Badge>
                                              </div>
                                            )
                                          }
                                          return null
                                        })()}
                                        {(plans.length + previousDayPlans.length) > 1 && (
                                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold z-10">
                                            {plans.length + previousDayPlans.length}
                                          </div>
                                        )}

                                {/* 当日の計画 */}
                                {plans.map((plan, idx) => (
                                  <div 
                                    key={plan.id || idx} 
                                    className={`p-1 rounded cursor-pointer hover:ring-2 hover:ring-blue-400 ${idx < plans.length - 1 ? 'mb-1.5 border-b border-blue-200' : ''} ${plans.length > 1 ? 'bg-white/50' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      !isPastMonth && handleCellClick(vehicle.id, dateString, plan)
                                    }}
                                  >
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <Badge className={`text-xs ${getShiftBadgeColor(plan.shift_type)}`}>
                                        {plan.shift_type === "day" ? "昼間" : plan.shift_type === "night" ? "夜間" : "昼夜"}
                                      </Badge>
                                      {plans.length > 1 && (
                                        <span className="text-xs text-gray-500">({idx + 1})</span>
                                      )}
                                      {isOvernight(plan) && (
                                        <span className="text-xs text-orange-600 font-semibold">→翌朝</span>
                                      )}
                                    </div>
                                    <div className="text-xs font-medium text-gray-700">
                                      {plan.start_time?.slice(0, 5)} - {plan.end_time?.slice(0, 5)}
                                      {isOvernight(plan) && (
                                        <span className="text-orange-600"> (翌日)</span>
                                      )}
                                    </div>
                                    {plan.departure_base_id && plan.arrival_base_id && (
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {allBases.find((b) => b.id?.toString() === plan.departure_base_id?.toString())?.base_name || '不明'} → {allBases.find((b) => b.id?.toString() === plan.arrival_base_id?.toString())?.base_name || '不明'}
                                      </div>
                                    )}
                                          </div>
                                        ))}
                                        {/* 当日計画がない場合の表示 */}
                                        {plans.length === 0 && previousDayPlans.length === 0 && (
                                          <div className="text-gray-400 text-xs mb-1">未計画</div>
                                        )}
                                        {/* 追加ボタン（常に表示） */}
                                        {!isPastMonth && (
                                          <button
                                            className="w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded py-1 border border-dashed border-blue-300"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleCellClick(vehicle.id, dateString)
                                            }}
                                          >
                                            + 追加
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-0">
          <OperationCalendarView
            operationPlans={filteredOperationPlans}
            currentMonth={currentMonth}
            allBases={allBases}
            onMonthChange={navigateMonth}
            onPlanClick={handleCalendarPlanClick}
          />
        </TabsContent>
      </CardContent>
    </Card>
  </Tabs>

      {/* 計画編集モーダル */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "運用計画を編集" : "新しい運用計画を作成"}
            </DialogTitle>
            <DialogDescription>
              {editingPlan 
                ? "既存の運用計画を編集します。必要な項目を変更してください。"
                : "新しい運用計画を作成します。必要な項目を入力してください。"}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan_date">計画日（開始日）</Label>
                <Input
                  id="plan_date"
                  type="date"
                  value={planForm.plan_date}
                  onChange={(e) => setPlanForm({ ...planForm, plan_date: e.target.value })}
                  disabled={!!editingPlan}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">終了日</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={planForm.end_date || planForm.plan_date}
                  onChange={(e) => setPlanForm({ ...planForm, end_date: e.target.value })}
                  min={planForm.plan_date}
                  disabled={!!editingPlan || !planForm.plan_date}
                />
                <p className="text-xs text-gray-500">
                  翌日にまたがる運用の場合は終了日を設定してください（例: 23:00→翌04:00）
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shift_type">運用予定</Label>
                  <Select 
                    value={planForm.shift_type} 
                    onValueChange={(value) => {
                      setPlanForm({ 
                        ...planForm, 
                        shift_type: value,
                        inspection_type_id: value === "maintenance" ? planForm.inspection_type_id : ""
                      })
                    }}
                  >
                    <SelectTrigger id="shift_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">昼間</SelectItem>
                      <SelectItem value="night">夜間</SelectItem>
                      <SelectItem value="maintenance">検修</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {planForm.shift_type === "maintenance" && (
                  <div className="space-y-2">
                    <Label htmlFor="inspection_type">検修種別</Label>
                    <Select 
                      value={planForm.inspection_type_id} 
                      onValueChange={async (value) => {
                        setPlanForm({ ...planForm, inspection_type_id: value })
                        
                        // 検修種別が選択された場合、期間を自動設定
                        if (value && planForm.vehicle_id && planForm.plan_date) {
                          try {
                            const schedule = await apiCall<MaintenanceSchedule>(
                              `maintenance-schedules/${planForm.vehicle_id}/${value}`
                            )
                            
                            if (schedule && schedule.duration_days) {
                              // 開始日から期間を計算して終了日を設定
                              const startDate = new Date(planForm.plan_date)
                              const endDate = new Date(startDate)
                              endDate.setDate(endDate.getDate() + schedule.duration_days - 1)
                              
                              setPlanForm(prev => ({
                                ...prev,
                                inspection_type_id: value,
                                end_date: endDate.toISOString().slice(0, 10)
                              }))
                            }
                          } catch (error) {
                            // エラーは静かに処理
                            console.error("検修期間の取得に失敗:", error)
                          }
                        }
                      }}
                    >
                      <SelectTrigger id="inspection_type">
                        <SelectValue placeholder="検修種別を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {inspectionTypes.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            検修種別マスタにデータがありません
                          </div>
                        ) : (
                          inspectionTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.type_name}
                              {type.interval_months && ` (${type.interval_months}ヶ月周期)`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">開始時刻</Label>
                  <div className="relative">
                    <Input
                      id="start_time"
                      type="time"
                      value={planForm.start_time}
                      onChange={(e) => setPlanForm({ ...planForm, start_time: e.target.value })}
                      className={timeFieldErrors.start ? "border-2 border-red-500" : ""}
                    />
                    {timeFieldErrors.start && conflictDetails.start && (
                      <div className="absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-red-600 rounded shadow-lg">
                        {conflictDetails.start}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">終了時刻</Label>
                  <div className="relative">
                    <Input
                      id="end_time"
                      type="time"
                      value={planForm.end_time}
                      onChange={(e) => setPlanForm({ ...planForm, end_time: e.target.value })}
                      className={timeFieldErrors.end ? "border-2 border-red-500" : ""}
                    />
                    {timeFieldErrors.end && conflictDetails.end && (
                      <div className="absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-red-600 rounded shadow-lg">
                        {conflictDetails.end}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure_base">出発基地</Label>
                <div className="relative">
                  <Select 
                    value={planForm.departure_base_id || "none"} 
                    onValueChange={(value) => setPlanForm({ ...planForm, departure_base_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger 
                      id="departure_base"
                      className={baseFieldErrors.departure ? "border-2 border-red-500" : ""}
                    >
                      <SelectValue placeholder="出発基地を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">なし</SelectItem>
                      {(() => {
                        const { officeBases, otherBases } = getAvailableBasesForPlan(planForm.vehicle_id)
                        return (
                          <>
                            {officeBases.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                                  管轄基地
                                </div>
                                {officeBases.map((base) => (
                                  <SelectItem key={base.id} value={base.id.toString()}>
                                    {base.base_name}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            {otherBases.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t">
                                  その他の基地
                                </div>
                                {otherBases.map((base) => (
                                  <SelectItem key={base.id} value={base.id.toString()}>
                                    {base.base_name}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </>
                        )
                      })()}
                    </SelectContent>
                  </Select>
                  {baseFieldErrors.departure && baseConflictDetails.departure && (
                    <div className="absolute z-10 w-80 p-2 mt-1 text-xs text-white bg-red-600 rounded shadow-lg">
                      {baseConflictDetails.departure}
                    </div>
                  )}
                </div>
                {!editingPlan && planForm.vehicle_id && planForm.plan_date && (() => {
                  // 前回の運用の最終到着基地を取得（同日・前日両方を考慮）
                  const vehicleId = Number.parseInt(planForm.vehicle_id)
                  
                  // 同日の既存計画
                  const sameDayPlans = operationPlans
                    .filter(p => {
                      if (p.vehicle_id !== vehicleId) return false
                      const pDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
                      return pDate === planForm.plan_date
                    })
                    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                  
                  // 前日以前の計画
                  const previousDayPlans = operationPlans
                    .filter(p => {
                      if (p.vehicle_id !== vehicleId) return false
                      const pDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
                      const pEndDate = p.end_date ? (typeof p.end_date === 'string' ? p.end_date.split('T')[0] : p.end_date) : pDate
                      return pDate < planForm.plan_date || (pDate < planForm.plan_date && pEndDate <= planForm.plan_date)
                    })
                    .sort((a, b) => {
                      const aEndDate = a.end_date ? (typeof a.end_date === 'string' ? a.end_date.split('T')[0] : a.end_date) : 
                                      (typeof a.plan_date === 'string' ? a.plan_date.split('T')[0] : a.plan_date)
                      const bEndDate = b.end_date ? (typeof b.end_date === 'string' ? b.end_date.split('T')[0] : b.end_date) : 
                                      (typeof b.plan_date === 'string' ? b.plan_date.split('T')[0] : b.plan_date)
                      const dateCompare = bEndDate.localeCompare(aEndDate)
                      if (dateCompare !== 0) return dateCompare
                      return (b.end_time || '').localeCompare(a.end_time || '')
                    })
                  
                  let lastPlan = null
                  let lastEndDate = null
                  
                  // 同日に計画があれば最後の計画、なければ前日以前の最終計画
                  if (sameDayPlans.length > 0) {
                    lastPlan = sameDayPlans[sameDayPlans.length - 1]
                    lastEndDate = planForm.plan_date
                  } else if (previousDayPlans.length > 0) {
                    lastPlan = previousDayPlans[0]
                    lastEndDate = lastPlan.end_date ? 
                      (typeof lastPlan.end_date === 'string' ? lastPlan.end_date.split('T')[0] : lastPlan.end_date) : 
                      (typeof lastPlan.plan_date === 'string' ? lastPlan.plan_date.split('T')[0] : lastPlan.plan_date)
                  }
                  
                  const lastArrivalBaseId = lastPlan?.arrival_base_id
                  const currentDepartureBaseId = planForm.departure_base_id ? Number.parseInt(planForm.departure_base_id) : null
                  
                  if (lastArrivalBaseId && currentDepartureBaseId && lastArrivalBaseId !== currentDepartureBaseId) {
                    const lastBase = allBases.find(b => b.id === lastArrivalBaseId)
                    const [y, m, d] = lastEndDate.split('-').map(Number)
                    return (
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-1">
                        ⚠️ {m}月{d}日 {lastPlan.end_time?.slice(0,5)}の最終留置場所は{lastBase?.base_name}です
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrival_base">到着基地</Label>
                <div className="relative">
                  <Select 
                    value={planForm.arrival_base_id || "none"} 
                    onValueChange={(value) => setPlanForm({ ...planForm, arrival_base_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger 
                      id="arrival_base"
                      className={baseFieldErrors.arrival ? "border-2 border-red-500" : ""}
                    >
                      <SelectValue placeholder="到着基地を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">なし</SelectItem>
                      {(() => {
                        const { officeBases, otherBases } = getAvailableBasesForPlan(planForm.vehicle_id)
                        return (
                          <>
                            {officeBases.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                                  管轄基地
                                </div>
                                {officeBases.map((base) => (
                                  <SelectItem key={base.id} value={base.id.toString()}>
                                    {base.base_name}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            {otherBases.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t">
                                  その他の基地
                                </div>
                                {otherBases.map((base) => (
                                  <SelectItem key={base.id} value={base.id.toString()}>
                                    {base.base_name}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </>
                        )
                      })()}
                    </SelectContent>
                  </Select>
                  {baseFieldErrors.arrival && baseConflictDetails.arrival && (
                    <div className="absolute z-10 w-80 p-2 mt-1 text-xs text-white bg-red-600 rounded shadow-lg">
                      {baseConflictDetails.arrival}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planned_distance">予定距離 (km)</Label>
              <Input
                id="planned_distance"
                type="number"
                min="0"
                step="0.1"
                value={planForm.planned_distance}
                onChange={(e) => setPlanForm({ ...planForm, planned_distance: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={planForm.notes}
                onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
                placeholder="備考を入力してください"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            {editingPlan && (
              <Button
                variant="destructive"
                onClick={handleDeletePlan}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                削除
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setShowPlanModal(false)
                setEditingPlan(null)
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleSavePlan}>
              {editingPlan ? "更新" : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
