"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, ChevronLeft, ChevronRight, Car, AlertCircle, Building, Filter, Copy, Download, Edit, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"

import type { Vehicle, OperationPlan, Base, Office, VehicleInspectionSchedule } from "@/types"
import { apiCall, isDatabaseConfigured } from "@/lib/api-client"

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
    start_time: "08:00",
    end_time: "17:00",
    planned_distance: 0,
    departure_base_id: "",
    arrival_base_id: "",
    notes: "",
  })

  // フィルター状態
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("all")
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([])
  const [selectedMachineNumbers, setSelectedMachineNumbers] = useState<string[]>([])

  const currentDate = new Date()
  const selectedDate = new Date(currentMonth + "-01")
  const isPastMonth = selectedDate <= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

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
        const rawVehiclesData = await apiCall<any[]>("vehicles")
        // APIから返されるデータをVehicle型にマッピング
        vehiclesData = rawVehiclesData.map(v => ({
          id: v.id,
          name: v.vehicle_type || v.name, // vehicle_typeをnameにマッピング
          vehicle_type: v.vehicle_type || '', // vehicle_typeフィールドを保持
          model: v.model || '',
          base_location: v.base_name || '',
          machine_number: v.machine_number || '',
          manufacturer: v.manufacturer || '',
          acquisition_date: v.acquisition_date || '',
          management_office: v.office_name || '',
          management_office_id: v.management_office_id,
          created_at: v.created_at || '',
          updated_at: v.updated_at || '',
        }))
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

      // 事業所データの取得
      try {
        officesData = await apiCall<Office[]>("offices")
      } catch (error) {
        console.error("事業所データの取得エラー:", error)
        throw new Error("事業所データの取得に失敗しました")
      }

      // 検査スケジュールデータの取得
      try {
        const schedulesData = await apiCall<VehicleInspectionSchedule[]>(
          `vehicle-inspection-schedule?month=${currentMonth}&show_warnings=true`
        )
        setInspectionSchedules(schedulesData)
      } catch (error) {
        console.error("検査スケジュールの取得エラー:", error)
        // 検査スケジュールは必須ではないので空配列のまま
      }

      console.log("=== データ取得完了 ===")
      console.log("運用計画データ:", plansData.length, "件")
      console.log("運用計画サンプル:", JSON.stringify(plansData[0], null, 2))
      console.log("車両データ:", vehiclesData.length, "件")
      console.log("基地データ:", basesData.length, "件")
      console.log("事業所データ:", officesData.length, "件")
      console.log("検査スケジュールデータ:", inspectionSchedules.length, "件")
      
      // 翌日またぎ計画をチェック
      const overnightPlans = plansData.filter(p => {
        const planDate = p.plan_date?.split('T')[0]
        const endDate = p.end_date?.split('T')[0]
        return endDate && planDate && endDate > planDate
      })
      console.log("翌日またぎ計画:", overnightPlans.length, "件")
      if (overnightPlans.length > 0) {
        console.log("翌日またぎ計画詳細:", overnightPlans.map(p => ({
          id: p.id,
          vehicle_id: p.vehicle_id,
          plan_date: p.plan_date,
          end_date: p.end_date,
          start_time: p.start_time,
          end_time: p.end_time
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

  // 事業所でフィルタリングされた車両を取得
  const filteredVehicles = useMemo(() => {
    let vehicles = allVehicles

    // 事業所でフィルタリング
    if (selectedOfficeId !== "all") {
      vehicles = vehicles.filter((vehicle) => vehicle.management_office_id === Number.parseInt(selectedOfficeId))
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
  }, [allVehicles, allBases, allOffices, selectedOfficeId, selectedVehicleTypes, selectedMachineNumbers])

  // 各フィルターで利用可能な事業所リストを取得（他のフィルターに応じて絞り込み）
  const availableOffices = useMemo(() => {
    let vehicles = allVehicles

    // 機種でフィルタリング（複数選択対応）
    if (selectedVehicleTypes.length > 0) {
      vehicles = vehicles.filter((vehicle) => selectedVehicleTypes.includes(vehicle.vehicle_type))
    }

    // 機械番号でフィルタリング（複数選択対応）
    if (selectedMachineNumbers.length > 0) {
      vehicles = vehicles.filter((vehicle) => selectedMachineNumbers.includes(vehicle.machine_number))
    }

    // 利用可能な事業所IDを取得
    const availableOfficeIds = new Set(vehicles.map((v) => v.management_office_id).filter(Boolean))
    return allOffices.filter((office) => availableOfficeIds.has(office.id))
  }, [allVehicles, allOffices, selectedVehicleTypes, selectedMachineNumbers])

  // 各フィルターで利用可能な機種リストを取得（他のフィルターに応じて絞り込み）
  const availableVehicleTypes = useMemo(() => {
    let vehicles = allVehicles

    // 事業所でフィルタリング
    if (selectedOfficeId !== "all") {
      vehicles = vehicles.filter((vehicle) => vehicle.management_office_id === Number.parseInt(selectedOfficeId))
    }

    // 機械番号でフィルタリング（複数選択対応）
    if (selectedMachineNumbers.length > 0) {
      vehicles = vehicles.filter((vehicle) => selectedMachineNumbers.includes(vehicle.machine_number))
    }

    // 実際に存在する機種を取得
    const availableTypes = new Set(vehicles.map((v) => v.vehicle_type).filter(Boolean))
    // VEHICLE_TYPE_ORDERの順序で並べ替え、存在するもののみを返す
    const orderedTypes = VEHICLE_TYPE_ORDER.filter((type) => availableTypes.has(type))
    // 順序に含まれていない機種も追加（アルファベット順）
    const otherTypes = Array.from(availableTypes)
      .filter((type) => !VEHICLE_TYPE_ORDER.includes(type))
      .sort()
    
    return [...orderedTypes, ...otherTypes]
  }, [allVehicles, selectedOfficeId, selectedMachineNumbers])

  // 各フィルターで利用可能な機械番号リストを取得（他のフィルターに応じて絞り込み）
  const availableMachineNumbers = useMemo(() => {
    let vehicles = allVehicles

    // 事業所でフィルタリング
    if (selectedOfficeId !== "all") {
      vehicles = vehicles.filter((vehicle) => vehicle.management_office_id === Number.parseInt(selectedOfficeId))
    }

    // 機種でフィルタリング（複数選択対応）
    if (selectedVehicleTypes.length > 0) {
      vehicles = vehicles.filter((vehicle) => selectedVehicleTypes.includes(vehicle.vehicle_type))
    }

    // 機械番号を取得してソート
    return vehicles
      .map((v) => v.machine_number)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'ja', { numeric: true }))
  }, [allVehicles, selectedOfficeId, selectedVehicleTypes])

  // 事業所でフィルタリングされた基地リストを取得
  const availableBases = useMemo(() => {
    if (selectedOfficeId === "all") {
      return allBases
    }

    // 選択された事業所の基地のみを返す
    return allBases.filter((base) => base.management_office_id === Number.parseInt(selectedOfficeId))
  }, [allBases, selectedOfficeId])

  // 車両と日付から検査予告情報を取得するヘルパー関数
  const getInspectionWarning = (vehicleId: number, dateString: string) => {
    return inspectionSchedules.find(schedule => 
      schedule.vehicle_id === vehicleId && 
      schedule.is_warning && 
      schedule.is_in_period
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
      if (grouped[vehicle.name]) {
        grouped[vehicle.name].push(vehicle)
      }
    })

    // 各機種内で機械番号順にソート
    Object.keys(grouped).forEach((type) => {
      grouped[type].sort((a, b) => (a.machine_number || "").localeCompare(b.machine_number || ""))
    })

    // 空の機種を除外
    const result: Record<string, Vehicle[]> = {}
    Object.entries(grouped).forEach(([type, vehicles]) => {
      if (vehicles.length > 0) {
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

  // 前日から継続する計画を取得（end_dateが当日の計画）
  const getPreviousDayOvernightPlans = (vehicleId: number, date: string) => {
    const targetDate = date.split('T')[0]
    
    const prevPlans = operationPlans.filter((p) => {
      const planDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
      const endDate = p.end_date ? (typeof p.end_date === 'string' ? p.end_date.split('T')[0] : p.end_date) : planDate
      
      // 計画日が当日より前で、終了日が当日の計画
      const match = p.vehicle_id === vehicleId && planDate < targetDate && endDate === targetDate
      
      if (match && vehicleId === filteredVehicles[0]?.id && targetDate === getDateString(1)) {
        console.log('前日継続計画発見:', { vehicleId, targetDate, planDate, endDate, plan: p })
      }
      
      return match
    })
    
    if (vehicleId === filteredVehicles[0]?.id && targetDate === getDateString(1)) {
      console.log('前日継続計画取得結果:', { vehicleId, targetDate, count: prevPlans.length })
    }
    
    return prevPlans
  }

  // 特定の車両と日付の全運用計画を取得（複数）- 当日開始の計画のみ
  const getPlansForVehicleAndDate = (vehicleId: number, date: string) => {
    // 全計画を確認（最初の呼び出しのみ）
    if (vehicleId === filteredVehicles[0]?.id && date === getDateString(1)) {
      console.log("=== 計画検索デバッグ ===")
      console.log("検索条件:", { vehicleId, date })
      console.log("全運用計画:", operationPlans.length, "件")
      console.log("計画サンプル:", operationPlans[0])
    }
    
    const plans = operationPlans.filter((p) => {
      // 日付を正規化して比較（タイムスタンプがある場合は日付部分のみ取得）
      const planDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
      // 当日開始の計画のみを取得
      return p.vehicle_id === vehicleId && planDate === date
    }).sort((a, b) => {
      // 勤務形態の優先順位: night(夜間) > day_night(昼夜) > day(昼間)
      const shiftOrder = { night: 0, day_night: 1, day: 2 }
      const aOrder = shiftOrder[a.shift_type as keyof typeof shiftOrder] ?? 3
      const bOrder = shiftOrder[b.shift_type as keyof typeof shiftOrder] ?? 3
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }
      
      // 同じshift_typeの場合は開始時刻でソート
      return (a.start_time || '').localeCompare(b.start_time || '')
    })
    
    return plans
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
  const handleCellClick = (vehicleId: number, date: string, planToEdit?: OperationPlan) => {
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
      const planDate = planToEdit.plan_date.split('T')[0]
      const endDate = planToEdit.end_date ? planToEdit.end_date.split('T')[0] : planDate
      console.log('編集モード - 日付:', { planDate, endDate })
      setPlanForm({
        vehicle_id: planToEdit.vehicle_id.toString(),
        plan_date: planDate,
        end_date: endDate,
        shift_type: planToEdit.shift_type,
        start_time: planToEdit.start_time || "08:00",
        end_time: planToEdit.end_time || "17:00",
        planned_distance: planToEdit.planned_distance || 0,
        departure_base_id: planToEdit.departure_base_id?.toString() || "",
        arrival_base_id: planToEdit.arrival_base_id?.toString() || "",
        notes: planToEdit.notes || "",
      })
    } else {
      // 新規計画作成 - 最後の運用計画の到着基地を出発基地として自動設定
      console.log('=== 新規計画作成 ===')
      console.log('対象日:', date)
      console.log('車両ID:', vehicleId)
      
      // 同日の既存計画を取得
      const sameDayPlans = operationPlans
        .filter(p => {
          if (p.vehicle_id !== vehicleId) return false
          const pDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
          return pDate === date
        })
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
      
      // 前日以前の計画を取得
      const previousDayPlans = operationPlans
        .filter(p => {
          if (p.vehicle_id !== vehicleId) return false
          
          const pDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
          const pEndDate = p.end_date ? (typeof p.end_date === 'string' ? p.end_date.split('T')[0] : p.end_date) : pDate
          
          // 前日以前に開始し、対象日以前に終了した計画
          return pDate < date || (pDate < date && pEndDate <= date)
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
      
      let lastArrivalBaseId = ""
      let lastPlanInfo = null
      
      // 同日に既存計画がある場合、最後の計画の到着基地を使用
      if (sameDayPlans.length > 0) {
        const lastSameDayPlan = sameDayPlans[sameDayPlans.length - 1]
        lastArrivalBaseId = lastSameDayPlan.arrival_base_id?.toString() || ""
        lastPlanInfo = {
          date: date,
          time: lastSameDayPlan.end_time,
          plan: lastSameDayPlan
        }
        console.log(`✓ 同日の計画あり: ${sameDayPlans.length}件`)
        console.log('同日計画:', sameDayPlans.map(p => ({
          start_time: p.start_time,
          end_time: p.end_time,
          departure_base_id: p.departure_base_id,
          arrival_base_id: p.arrival_base_id
        })))
      } 
      // 同日に計画がない場合、前日以前の最終計画を使用
      else if (previousDayPlans.length > 0) {
        const lastPreviousPlan = previousDayPlans[0]
        lastArrivalBaseId = lastPreviousPlan.arrival_base_id?.toString() || ""
        const lastEndDate = lastPreviousPlan.end_date ? 
          (typeof lastPreviousPlan.end_date === 'string' ? lastPreviousPlan.end_date.split('T')[0] : lastPreviousPlan.end_date) : 
          (typeof lastPreviousPlan.plan_date === 'string' ? lastPreviousPlan.plan_date.split('T')[0] : lastPreviousPlan.plan_date)
        lastPlanInfo = {
          date: lastEndDate,
          time: lastPreviousPlan.end_time,
          plan: lastPreviousPlan
        }
        console.log(`✓ 前日の計画: ${previousDayPlans.length}件`)
      }
      
      if (lastPlanInfo) {
        const lastArrivalBase = allBases.find(b => b.id === lastPlanInfo.plan.arrival_base_id)
        console.log(`✓ 最終留置: ${lastPlanInfo.date} ${lastPlanInfo.time} → ${lastArrivalBase?.base_name || '不明'} (ID: ${lastArrivalBaseId})`)
      } else {
        console.log('✗ 前回の計画なし - 出発基地は手動で選択してください')
      }
      
      console.log('設定する出発基地ID:', lastArrivalBaseId)
      setEditingPlan(null)
      setPlanForm({
        vehicle_id: vehicleId.toString(),
        plan_date: date,
        end_date: date,
        shift_type: "day",
        start_time: "08:00",
        end_time: "17:00",
        planned_distance: 0,
        departure_base_id: lastArrivalBaseId,
        arrival_base_id: "",
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
      
      // 日付をローカルタイムゾーン（T00:00:00）として明示的に扱う
      const normalizedPlanDate = planForm.plan_date.includes('T') 
        ? planForm.plan_date.split('T')[0] 
        : planForm.plan_date
      const normalizedEndDate = planForm.end_date 
        ? (planForm.end_date.includes('T') ? planForm.end_date.split('T')[0] : planForm.end_date)
        : normalizedPlanDate
      
      console.log('正規化された日付:', { normalizedPlanDate, normalizedEndDate })
      
      const planData = {
        vehicle_id: Number.parseInt(planForm.vehicle_id),
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
            
            // 計画日が新規計画より前、または同日で終了時刻が開始時刻より前（厳密に<を使用）
            if (pEndDate < planData.plan_date) return true
            if (pDate === planData.plan_date && (p.end_time || '') < planData.start_time) return true
            return false
          })
          .pop()
        
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
        
        console.log('前後の計画チェック:', { previousPlan, nextPlan })
        
        // 4. 前の計画の到着基地と新規計画の出発基地の整合性チェック
        if (previousPlan && previousPlan.arrival_base_id && planData.departure_base_id) {
          if (previousPlan.arrival_base_id !== planData.departure_base_id) {
            const prevArrivalBase = allBases.find(b => b.id === previousPlan.arrival_base_id)
            const newDepartureBase = allBases.find(b => b.id === planData.departure_base_id)
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
            if (nextPlan.departure_base_id !== planData.arrival_base_id) {
              const newArrivalBase = allBases.find(b => b.id === planData.arrival_base_id)
              const nextDepartureBase = allBases.find(b => b.id === nextPlan.departure_base_id)
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

      const prevPlans = await apiCall<OperationPlan[]>(`/api/operation-plans?month=${prevMonthString}`)

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

  // CSVエクスポート機能
  const exportToCSV = async () => {
    try {
      setError(null)
      
      // 現在のフィルター設定を含むURLを構築
      const params = new URLSearchParams({
        month: currentMonth,
        format: 'csv'
      })
      
      if (selectedOfficeId !== "all") {
        params.append('office_id', selectedOfficeId)
      }
      
      // 複数の機種パラメータを送信
      selectedVehicleTypes.forEach(type => {
        params.append('vehicle_type', type)
      })
      
      const response = await fetch(`/api/operation-plans?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      
      // ファイル名を生成（フィルターがある場合は含める）
      const officeName = selectedOfficeId !== "all" 
        ? allOffices.find(o => o.id === Number.parseInt(selectedOfficeId))?.office_name || ""
        : ""
      const vehicleTypeNames = selectedVehicleTypes.length > 0 
        ? selectedVehicleTypes.join('-') 
        : ""
      
      let fileName = `operation-plans-${currentMonth}`
      if (officeName) fileName += `-${officeName}`
      if (vehicleTypeNames) fileName += `-${vehicleTypeNames}`
      fileName += '.csv'
      
      // ブラウザがファイル保存ダイアログをサポートしているかチェック
      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: 'CSVファイル',
              accept: { 'text/csv': ['.csv'] }
            }]
          })
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
        } catch (saveError) {
          // ファイル保存ダイアログがキャンセルされた場合やエラーの場合は従来の方法を使用
          console.log('ファイル保存ダイアログが使用できません:', saveError)
          downloadFile(blob, fileName)
        }
      } else {
        // 従来のダウンロード方法
        downloadFile(blob, fileName)
      }
    } catch (error) {
      console.error('CSVエクスポートエラー:', error)
      setError(`CSVエクスポートに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  // ファイルダウンロード関数
  const downloadFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (loading) {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
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
              {(selectedOfficeId !== "all" || selectedVehicleTypes.length > 0 || selectedMachineNumbers.length > 0) && (
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  フィルターをリセット
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                CSVエクスポート
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 運用計画表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>{currentMonth} 運用計画表</span>
            <Badge variant="outline" className="text-blue-600">
              計画作成・編集
            </Badge>
          </CardTitle>
          <div className="text-sm text-gray-600">
            セルをクリックして運用計画を作成・編集できます。青色は計画済み、グレーは未計画を表示します。
          </div>
        </CardHeader>
        <CardContent>
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
                {Object.entries(vehiclesByType).map(([vehicleType, vehicles]) =>
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
                        <div className="text-sm text-gray-600">{vehicle.base_location}</div>
                      </td>
                      {days.map((day) => {
                        const dateString = getDateString(day)
                        const plans = getPlansForVehicleAndDate(vehicle.id, dateString)
                          // 時間順にソート（朝→昼→夜）
                          .sort((a, b) => {
                            const timeA = a.start_time || '00:00'
                            const timeB = b.start_time || '00:00'
                            return timeA.localeCompare(timeB)
                          })
                        const previousDayPlans = getPreviousDayOvernightPlans(vehicle.id, dateString)
                          // 前日継続も時間順にソート
                          .sort((a, b) => {
                            const timeA = a.start_time || '00:00'
                            const timeB = b.start_time || '00:00'
                            return timeA.localeCompare(timeB)
                          })
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
                              {/* 前日からの継続計画 */}
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
                                        {allBases.find((b) => b.id === plan.departure_base_id)?.base_name} → {allBases.find((b) => b.id === plan.arrival_base_id)?.base_name}
                                      </div>
                                    )}
                                  </div>
                                ))}
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
                                        {allBases.find((b) => b.id === plan.departure_base_id)?.base_name} → {allBases.find((b) => b.id === plan.arrival_base_id)?.base_name}
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
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
                <Label htmlFor="vehicle">車両</Label>
                <Select 
                  value={planForm.vehicle_id} 
                  onValueChange={(value) => setPlanForm({ ...planForm, vehicle_id: value })}
                  disabled={!!editingPlan}
                >
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="車両を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {allVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.name} - {vehicle.machine_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift_type">勤務形態</Label>
                <Select 
                  value={planForm.shift_type} 
                  onValueChange={(value) => setPlanForm({ ...planForm, shift_type: value })}
                >
                  <SelectTrigger id="shift_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">昼間</SelectItem>
                    <SelectItem value="night">夜間</SelectItem>
                    <SelectItem value="day_night">昼夜</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                      {availableBases.map((base) => (
                        <SelectItem key={base.id} value={base.id.toString()}>
                          {base.base_name}
                        </SelectItem>
                      ))}
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
                      {availableBases.map((base) => (
                        <SelectItem key={base.id} value={base.id.toString()}>
                          {base.base_name}
                        </SelectItem>
                      ))}
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
            <div className="flex justify-between w-full">
              <div>
                {editingPlan && (
                  <Button
                    variant="destructive"
                    onClick={handleDeletePlan}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    削除
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
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
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
