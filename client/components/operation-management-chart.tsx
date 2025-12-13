"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  History,
  CalendarDays,
  Car,
  AlertCircle,
  Building,
  Filter,
  Home,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Wrench,
  Download,
  Upload,
  FileText,
  Edit,
  Save,
  Trash2,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import Link from "next/link"

import type { Vehicle, Base, ManagementOffice, OperationPlan, OperationRecord, Inspection, Office } from "@/types"
import { apiCall, isDatabaseConfigured } from "@/lib/api-client"

export function OperationManagementChart() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [allBases, setAllBases] = useState<Base[]>([])
  const [allOffices, setAllOffices] = useState<ManagementOffice[]>([])
  const [operationPlans, setOperationPlans] = useState<OperationPlan[]>([])
  const [operationRecords, setOperationRecords] = useState<OperationRecord[]>([])
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 実績編集モーダル
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<OperationRecord | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<OperationPlan | null>(null)
  const [recordForm, setRecordForm] = useState({
    vehicle_id: "",
    record_date: "",
    shift_type: "day",
    start_time: "08:00",
    end_time: "17:00",
    actual_distance: 0,
    departure_base_id: "none",
    arrival_base_id: "none",
    status: "completed",
    notes: "",
    is_as_planned: false,
  })

  // フィルター状態
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("all")
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([])
  const [selectedMachineNumbers, setSelectedMachineNumbers] = useState<string[]>([])
  const [selectedDates, setSelectedDates] = useState<string[]>([])

  const currentDateObj = new Date()
  const selectedMonthDate = new Date(currentMonth + "-01")
  const isCurrentMonth = currentMonth === currentDateObj.toISOString().slice(0, 7)
  const isPastMonth = selectedMonthDate < new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), 1)
  const isFutureMonth = selectedMonthDate > new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), 1)

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      setError(null)

      // 車両データの取得
      let vehiclesData: Vehicle[] = []
      try {
        console.log("車両データを取得中...")
        vehiclesData = await apiCall<Vehicle[]>("vehicles")
        console.log("車両データ取得成功:", vehiclesData.length, "件")
      } catch (error) {
        console.error("車両データの取得エラー:", error)
        console.error("エラー詳細:", error instanceof Error ? error.message : String(error))
        throw new Error("車両データの取得に失敗しました")
      }

      // 基地データの取得
      let basesData: Base[] = []
      try {
        basesData = await apiCall<Base[]>("bases")
      } catch (error) {
        console.error("基地データの取得エラー:", error)
        throw new Error("基地データの取得に失敗しました")
      }

      // 事業所データの取得
      let officesData: Office[] = []
      try {
        officesData = await apiCall<Office[]>("offices")
      } catch (error) {
        console.error("事業所データの取得エラー:", error)
        throw new Error("事業所データの取得に失敗しました")
      }

      // 運用計画データの取得
      let plansData: OperationPlan[] = []
      try {
        plansData = await apiCall<OperationPlan[]>(`operation-plans?month=${currentMonth}`)
      } catch (error) {
        console.error("運用計画データの取得エラー:", error)
        // 運用計画は必須ではないので空配列のまま
      }

      // 運用実績データの取得
      let recordsData: OperationRecord[] = []
      try {
        recordsData = await apiCall<OperationRecord[]>(`operation-records?month=${currentMonth}`)
      } catch (error) {
        console.error("運用実績データの取得エラー:", error)
        // 運用実績は必須ではないので空配列のまま
      }

      // 検査データの取得
      let inspectionsData: Inspection[] = []
      try {
        inspectionsData = await apiCall<Inspection[]>(`inspections?month=${currentMonth}`)
      } catch (error) {
        console.error("検査データの取得エラー:", error)
        // 検査データは必須ではないので空配列のまま
      }

      setAllVehicles(vehiclesData)
      setAllBases(basesData)
      setAllOffices(officesData as ManagementOffice[])
      setOperationPlans(plansData)
      setOperationRecords(recordsData)
      setInspections(inspectionsData)

      console.log("データ取得結果:", {
        vehicles: vehiclesData.length,
        bases: basesData.length,
        offices: officesData.length,
        plans: plansData.length,
        records: recordsData.length,
        inspections: inspectionsData.length
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("データの取得に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  // セルクリック時の処理（運用実績の作成・編集）
  const handleCellClick = (vehicleId: number, date: string, editRecord?: OperationRecord) => {
    const plan = getPlanForVehicleAndDate(vehicleId, date)
    
    if (editRecord) {
      // 既存実績の編集
      setEditingRecord(editRecord)
      setSelectedPlan(plan || null)
      setRecordForm({
        vehicle_id: editRecord.vehicle_id.toString(),
        record_date: editRecord.record_date,
        shift_type: editRecord.shift_type,
        start_time: editRecord.start_time || "08:00",
        end_time: editRecord.end_time || "17:00",
        actual_distance: editRecord.actual_distance || 0,
        departure_base_id: editRecord.departure_base_id?.toString() || "none",
        arrival_base_id: editRecord.arrival_base_id?.toString() || "none",
        status: editRecord.status,
        notes: editRecord.notes || "",
        is_as_planned: editRecord.is_as_planned || false,
      })
    } else if (plan) {
      // 計画から実績を作成（新規）
      setEditingRecord(null)
      setSelectedPlan(plan)
      setRecordForm({
        vehicle_id: plan.vehicle_id.toString(),
        record_date: date,
        shift_type: plan.shift_type,
        start_time: plan.start_time || "08:00",
        end_time: plan.end_time || "17:00",
        actual_distance: plan.planned_distance || 0,
        departure_base_id: plan.departure_base_id?.toString() || "none",
        arrival_base_id: plan.arrival_base_id?.toString() || "none",
        status: "completed",
        notes: plan.notes || "",
        is_as_planned: true,
      })
    } else {
      // 新規実績作成 - 前回の到着基地を出発基地として設定
      const previousRecords = operationRecords
        .filter(r => {
          const rDate = typeof r.record_date === 'string' ? r.record_date.split('T')[0] : r.record_date
          return r.vehicle_id === vehicleId && rDate < date
        })
        .sort((a, b) => {
          const aDate = typeof a.record_date === 'string' ? a.record_date.split('T')[0] : a.record_date
          const bDate = typeof b.record_date === 'string' ? b.record_date.split('T')[0] : b.record_date
          return bDate.localeCompare(aDate)
        })
      const lastRecord = previousRecords[0]
      const lastArrivalBaseId = lastRecord?.arrival_base_id?.toString() || "none"
      
      setEditingRecord(null)
      setSelectedPlan(null)
      setRecordForm({
        vehicle_id: vehicleId.toString(),
        record_date: date,
        shift_type: "day",
        start_time: "08:00",
        end_time: "17:00",
        actual_distance: 0,
        departure_base_id: lastArrivalBaseId,
        arrival_base_id: "none",
        status: "completed",
        notes: "",
        is_as_planned: false,
      })
    }
    
    setShowRecordModal(true)
  }

  // 実績の保存
  const handleSaveRecord = async () => {
    try {
      const recordData = {
        vehicle_id: Number.parseInt(recordForm.vehicle_id),
        record_date: recordForm.record_date,
        shift_type: recordForm.shift_type,
        start_time: recordForm.start_time,
        end_time: recordForm.end_time,
        actual_distance: recordForm.actual_distance,
        departure_base_id: recordForm.departure_base_id && recordForm.departure_base_id !== "none" ? Number.parseInt(recordForm.departure_base_id) : null,
        arrival_base_id: recordForm.arrival_base_id && recordForm.arrival_base_id !== "none" ? Number.parseInt(recordForm.arrival_base_id) : null,
        status: recordForm.status,
        notes: recordForm.notes,
      }

      if (editingRecord) {
        // 更新
        await apiCall(`operation-records/${editingRecord.id}`, {
          method: "PUT",
          body: JSON.stringify(recordData),
        })
      } else {
        // 新規作成
        await apiCall("operation-records", {
          method: "POST",
          body: JSON.stringify(recordData),
        })
      }

      fetchData()
      setShowRecordModal(false)
      setEditingRecord(null)
      setSelectedPlan(null)
    } catch (error) {
      console.error("Error saving record:", error)
      setError("実績の保存に失敗しました。")
    }
  }

  // 実績の削除
  const handleDeleteRecord = async () => {
    if (!editingRecord) return

    try {
      await apiCall(`operation-records/${editingRecord.id}`, {
        method: "DELETE",
      })

      fetchData()
      setShowRecordModal(false)
      setEditingRecord(null)
      setSelectedPlan(null)
    } catch (error) {
      console.error("Error deleting record:", error)
      setError("実績の削除に失敗しました。")
    }
  }

  const getDaysInMonth = (dateString: string) => {
    const [year, month] = dateString.split("-").map(Number)
    return new Date(year, month, 0).getDate()
  }

  const getDateString = (day: number) => {
    return `${currentMonth}-${day.toString().padStart(2, "0")}`
  }

  // 運用計画がある車両IDのセットを取得
  const vehiclesWithPlans = useMemo(() => {
    return new Set(operationPlans.map(plan => plan.vehicle_id))
  }, [operationPlans])

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

  // 利用可能な機種を取得（運用計画がある車両の機種のみ）
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
    const availableTypes = new Set(vehicles.map(v => v.vehicle_type).filter(Boolean))
    return Array.from(availableTypes).sort()
  }, [allVehicles, selectedOfficeId, selectedMachineNumbers])

  // 利用可能な機械番号を取得
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
    
    // ユニークな機械番号を取得してソート
    const uniqueNumbers = Array.from(new Set(vehicles.map(v => v.machine_number).filter(Boolean)))
    return uniqueNumbers.sort((a, b) => a.localeCompare(b, 'ja', { numeric: true }))
  }, [allVehicles, selectedOfficeId, selectedVehicleTypes])

  // 利用可能な日付リストを取得（現在の月の日付）
  const availableDates = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const dates: string[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(getDateString(day))
    }
    return dates
  }, [currentMonth])

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
  }, [allVehicles, selectedOfficeId, selectedVehicleTypes, selectedMachineNumbers])

  // 機種別にグループ化された車両を取得
  const vehiclesByType = useMemo(() => {
    const grouped: Record<string, Vehicle[]> = {}

    filteredVehicles.forEach((vehicle) => {
      const type = vehicle.vehicle_type
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type].push(vehicle)
    })

    // 各機種内で機械番号順にソート
    Object.keys(grouped).forEach((type) => {
      grouped[type].sort((a, b) => (a.machine_number || "").localeCompare(b.machine_number || "", 'ja', { numeric: true }))
    })

    return grouped
  }, [filteredVehicles])

  // 特定の日付と車両の運用計画を取得
  const getPlanForVehicleAndDate = (vehicleId: number, date: string): OperationPlan | undefined => {
    return operationPlans.find((plan) => {
      const planDate = typeof plan.plan_date === 'string' ? plan.plan_date.split('T')[0] : plan.plan_date
      return plan.vehicle_id === vehicleId && planDate === date
    })
  }

  // 特定の日付と車両の運用実績を取得
  const getRecordForVehicleAndDate = (vehicleId: number, date: string): OperationRecord | undefined => {
    return operationRecords.find((record) => {
      const recordDate = typeof record.record_date === 'string' ? record.record_date.split('T')[0] : record.record_date
      return record.vehicle_id === vehicleId && recordDate === date
    })
  }

  // 特定の日付、車両、基地の運用計画を取得
  const getPlanForVehicleDateAndBase = (vehicleId: number, date: string, baseId: number): OperationPlan | undefined => {
    return operationPlans.find((plan) => {
      const planDate = typeof plan.plan_date === 'string' ? plan.plan_date.split('T')[0] : plan.plan_date
      return plan.vehicle_id === vehicleId && planDate === date && 
        (plan.departure_base_id === baseId || plan.arrival_base_id === baseId)
    })
  }

  // 特定の日付、車両、基地の運用実績を取得
  const getRecordForVehicleDateAndBase = (vehicleId: number, date: string, baseId: number): OperationRecord | undefined => {
    return operationRecords.find((record) => {
      const recordDate = typeof record.record_date === 'string' ? record.record_date.split('T')[0] : record.record_date
      return record.vehicle_id === vehicleId && recordDate === date && 
        (record.departure_base_id === baseId || record.arrival_base_id === baseId)
    })
  }

  // 特定の日付と車両の検査を取得
  const getInspectionForVehicleAndDate = (vehicleId: number, date: string): Inspection | undefined => {
    return inspections.find((inspection) => {
      const inspectionDate = typeof inspection.inspection_date === 'string' ? inspection.inspection_date.split('T')[0] : inspection.inspection_date
      return inspection.vehicle_id === vehicleId && inspectionDate === date
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

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date().toISOString().slice(0, 7))
  }

  const getShiftTypeColor = (shiftType: string) => {
    switch (shiftType) {
      case "day":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "night":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "both":
        return "bg-purple-100 text-purple-800 border-purple-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getShiftTypeLabel = (shiftType: string) => {
    switch (shiftType) {
      case "day":
        return "昼"
      case "night":
        return "夜"
      case "both":
        return "昼夜"
      default:
        return "不明"
    }
  }

  // 実績の表示色を取得（計画通りの場合は青系、そうでない場合は緑系）
  const getRecordDisplayColor = (record: OperationRecord, shiftType: string) => {
    if (record.is_as_planned) {
      // 計画通りの実績は青系（少し濃いめ）
      switch (shiftType) {
        case "day":
          return "bg-cyan-100 text-cyan-900 border-cyan-400"
        case "night":
          return "bg-sky-100 text-sky-900 border-sky-400"
        case "both":
          return "bg-indigo-100 text-indigo-900 border-indigo-400"
        default:
          return "bg-blue-100 text-blue-900 border-blue-400"
      }
    } else {
      // 計画外の実績は緑系
      switch (shiftType) {
        case "day":
          return "bg-green-100 text-green-800 border-green-300"
        case "night":
          return "bg-emerald-100 text-emerald-800 border-emerald-300"
        case "both":
          return "bg-teal-100 text-teal-800 border-teal-300"
        default:
          return "bg-green-100 text-green-800 border-green-300"
      }
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300"
      case "partial":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "完了"
      case "partial":
        return "部分"
      case "cancelled":
        return "中止"
      default:
        return "不明"
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "normal":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getMonthTypeInfo = () => {
    if (isPastMonth) {
      return {
        icon: History,
        label: "履歴",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
      }
    } else if (isFutureMonth) {
      return {
        icon: CalendarDays,
        label: "計画",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      }
    } else {
      return {
        icon: Calendar,
        label: "当月",
        color: "text-green-600",
        bgColor: "bg-green-50",
      }
    }
  }

  const monthInfo = getMonthTypeInfo()
  const MonthIcon = monthInfo.icon

  const daysInMonth = getDaysInMonth(currentMonth)
  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  
  // 日付フィルターを適用
  const days = useMemo(() => {
    if (selectedDates.length === 0) {
      return allDays
    }
    // 選択された日付のみを返す
    return allDays.filter(day => {
      const dateString = getDateString(day)
      return selectedDates.includes(dateString)
    })
  }, [allDays, selectedDates, currentMonth])

  // フィルターリセット
  const resetFilters = () => {
    setSelectedOfficeId("all")
    setSelectedVehicleTypes([])
    setSelectedMachineNumbers([])
    setSelectedDates([])
  }

  // 仕業点検簿へのリンクを生成
  const getInspectionBookLink = (vehicleType: string, date: string) => {
    return `/inspections?vehicle_type=${encodeURIComponent(vehicleType)}&date=${date}`
  }

  // 機械番号の仕業点検へのリンクを生成（仮）
  const getMachineInspectionLink = (machineNumber: string, date: string) => {
    return `/machine-inspection?machine_number=${encodeURIComponent(machineNumber)}&date=${date}`
  }

  // 指定日の翌日を取得
  const getNextDay = (date: string) => {
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)
    return nextDay.toISOString().slice(0, 10)
  }

  // 今日の日付を取得
  const getTodayDate = () => {
    return new Date().toISOString().slice(0, 10)
  }

  // 明日の日付を取得
  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 10)
  }

  // 日付をクリックしたときの処理
  const handleDateClick = (date: string) => {
    setSelectedDate(date)
  }

  // 月表示に戻る
  const handleBackToMonth = () => {
    setSelectedDate(null)
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
          <h2 className="text-2xl font-bold">運用実績管理表</h2>
          <Badge className={`${monthInfo.bgColor} ${monthInfo.color} border-0`}>
            <MonthIcon className="w-4 h-4 mr-1" />
            {monthInfo.label}
          </Badge>
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
          {!isCurrentMonth && (
            <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
              今月に戻る
            </Button>
          )}
        </div>
      </div>
      
      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>フィルター</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Label htmlFor="dateFilter" className="text-sm font-medium">
                日付（複数選択可）
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="w-4 h-4 mr-2" />
                    {selectedDates.length === 0 ? (
                      <span>全ての日付</span>
                    ) : (
                      <span>{selectedDates.length}件選択中</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandList className="max-h-[300px]">
                      <CommandGroup>
                        {availableDates.map((date) => {
                          const dateObj = new Date(date)
                          const dayOfWeek = dateObj.toLocaleDateString('ja-JP', { weekday: 'short' })
                          const day = dateObj.getDate()
                          return (
                            <CommandItem
                              key={date}
                              onSelect={() => {
                                setSelectedDates(prev => 
                                  prev.includes(date) 
                                    ? prev.filter(d => d !== date)
                                    : [...prev, date]
                                )
                              }}
                            >
                              <Checkbox
                                checked={selectedDates.includes(date)}
                                className="mr-2"
                              />
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>{day}日（{dayOfWeek}）</span>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
              {selectedOfficeId !== "all" || selectedVehicleTypes.length > 0 || selectedMachineNumbers.length > 0 || selectedDates.length > 0 ? (
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  <span>フィルター適用中:</span>
                  {selectedOfficeId !== "all" && (
                    <Badge variant="secondary">
                      {allOffices.find((o) => o.id === Number.parseInt(selectedOfficeId))?.office_name}
                    </Badge>
                  )}
                  {selectedVehicleTypes.map((type) => (
                    <Badge key={type} variant="secondary">{type}</Badge>
                  ))}
                  {selectedMachineNumbers.map((number) => (
                    <Badge key={number} variant="secondary">{number}</Badge>
                  ))}
                  {selectedDates.map((date) => {
                    const day = new Date(date).getDate()
                    return <Badge key={date} variant="secondary">{day}日</Badge>
                  })}
                </div>
              ) : (
                <span>全てのデータを表示中</span>
              )}
            </div>
            {(selectedOfficeId !== "all" || selectedVehicleTypes.length > 0 || selectedMachineNumbers.length > 0) && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                フィルターをリセット
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 運用実績管理表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>{currentMonth} 運用実績管理表</span>
            <Badge variant="outline" className={monthInfo.color}>
              {monthInfo.label}表示
            </Badge>
          </CardTitle>
          <div className="text-sm text-gray-600 space-y-2">
            <div>
              運用計画と実績を統合表示します。セルをクリックして実績を追加・編集できます（計画がない場合でも実績追加可能）。
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span>計画</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-cyan-100 border border-cyan-400 rounded"></div>
                <span>実績（計画通り✓）</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span>実績（計画外）</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
                <span>検査</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedDate ? (
            // 選択された日付の詳細表示（当日と翌日）
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">選択日: {selectedDate}</h3>
                <Button variant="outline" size="sm" onClick={handleBackToMonth}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  月表示に戻る
                </Button>
              </div>

              {/* 当日 */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-blue-600">当日: {selectedDate}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="border p-2 bg-gray-50 text-center min-w-20">機種</th>
                        <th className="border p-2 bg-gray-50 text-center min-w-20">機械番号</th>
                        <th className="border p-2 bg-blue-50 text-center min-w-20">計画</th>
                        <th className="border p-2 bg-green-50 text-center min-w-20">実績</th>
                        {allBases.map((base) => (
                          <th key={base.id} className="border p-2 bg-green-50 text-center min-w-24">
                            <div className="space-y-1">
                              <div className="font-medium">{base.base_name}</div>
                              <div className="text-xs text-gray-600">{base.location}</div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(vehiclesByType).map(([vehicleType, vehicles]) =>
                        vehicles.map((vehicle, vehicleIndex) => {
                          const plan = getPlanForVehicleDateAndBase(vehicle.id, selectedDate, 1)
                          const record = getRecordForVehicleDateAndBase(vehicle.id, selectedDate, 1)
                          const inspection = getInspectionForVehicleAndDate(vehicle.id, selectedDate)

                          return (
                            <tr key={`${selectedDate}-${vehicle.id}`}>
                              {/* 機種セル */}
                              {vehicleIndex === 0 && (
                                <td className="border p-2 text-center font-medium bg-blue-50" rowSpan={vehicles.length}>
                                  <div className="flex flex-col items-center space-y-1">
                                    <Car className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs font-semibold">{vehicleType}</span>
                                  </div>
                                </td>
                              )}

                              {/* 機械番号セル */}
                              <td className="border p-2 text-center font-medium bg-blue-50">
                                <div className="text-sm font-semibold text-blue-600">
                                  {vehicle.machine_number}
                                </div>
                              </td>

                              {/* 計画セル */}
                              <td className="border p-2 text-center bg-blue-50">
                                {plan ? (
                                  <div className="space-y-1">
                                    <div className={`text-xs px-1 py-0.5 rounded ${getShiftTypeColor(plan.shift_type)}`}>
                                      {getShiftTypeLabel(plan.shift_type)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400">計画なし</div>
                                )}
                              </td>

                              {/* 実績セル */}
                              <td className="border p-2 text-center bg-green-50">
                                {record ? (
                                  <div className="space-y-1">
                                    <div className={`text-xs px-1 py-0.5 rounded border ${getRecordDisplayColor(record, record.shift_type)}`}>
                                      {getShiftTypeLabel(record.shift_type)}
                                      {record.is_as_planned && (
                                        <span className="ml-1 text-xs">✓</span>
                                      )}
                                    </div>
                                    <div className={`text-xs px-1 py-0.5 rounded ${getStatusBadgeColor(record.status)}`}>
                                      {getStatusLabel(record.status)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400">実績なし</div>
                                )}
                              </td>

                              {/* 保守基地セル */}
                              {allBases.map((base) => {
                                const basePlan = getPlanForVehicleDateAndBase(vehicle.id, selectedDate, base.id)
                                const baseRecord = getRecordForVehicleDateAndBase(vehicle.id, selectedDate, base.id)

                                return (
                                  <td key={base.id} className="border p-2">
                                    <div className="space-y-2">
                                      {/* 運用計画 */}
                                      {basePlan && (
                                        <div className="space-y-1">
                                          <div className={`text-xs px-1 py-0.5 rounded ${getShiftTypeColor(basePlan.shift_type)}`}>
                                            計画: {getShiftTypeLabel(basePlan.shift_type)}
                                          </div>
                                        </div>
                                      )}

                                      {/* 運用実績 */}
                                      {baseRecord && (
                                        <div className="space-y-1">
                                          <div className={`text-xs px-1 py-0.5 rounded border ${getRecordDisplayColor(baseRecord, baseRecord.shift_type)}`}>
                                            実績: {getShiftTypeLabel(baseRecord.shift_type)}
                                            {baseRecord.is_as_planned && (
                                              <span className="ml-1 text-xs">✓</span>
                                            )}
                                          </div>
                                          <div className={`text-xs px-1 py-0.5 rounded ${getStatusBadgeColor(baseRecord.status)}`}>
                                            {getStatusLabel(baseRecord.status)}
                                          </div>
                                        </div>
                                      )}

                                      {/* 検査 */}
                                      {inspection && (
                                        <div className="space-y-1">
                                          <div className="flex items-center space-x-1">
                                            <Wrench className="w-3 h-3 text-purple-600" />
                                            <div className={`text-xs px-1 py-0.5 rounded ${getPriorityBadgeColor(inspection.priority)}`}>
                                              {inspection.priority === "urgent"
                                                ? "緊急"
                                                : inspection.priority === "high"
                                                  ? "高"
                                                  : inspection.priority === "normal"
                                                    ? "通常"
                                                    : "低"}
                                            </div>
                                          </div>
                                          <div className="text-xs text-gray-600">{inspection.inspection_type}</div>
                                          <div className="text-xs text-gray-500">{inspection.notes}</div>
                                        </div>
                                      )}

                                      {/* データがない場合 */}
                                      {!basePlan && !baseRecord && !inspection && (
                                        <div className="text-xs text-gray-400 text-center py-2">
                                          データなし
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            // 月表示
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-50 text-center min-w-16 sticky left-0 z-10">日付</th>
                    <th className="border p-2 bg-gray-50 text-center min-w-12 sticky left-16 z-10">曜日</th>
                    <th className="border p-2 bg-blue-50 text-center min-w-20">機種</th>
                    <th className="border p-2 bg-blue-50 text-center min-w-20">機械番号</th>
                    {allBases.map((base) => (
                      <th key={base.id} className="border p-2 bg-green-50 text-center min-w-24">
                        <div className="space-y-1">
                          <div className="font-medium">{base.base_name}</div>
                          <div className="text-xs text-gray-600">{base.location}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => {
                    const dateString = getDateString(day)
                    const dayOfWeek = new Date(dateString + 'T00:00:00').toLocaleDateString("ja-JP", { weekday: "short" })
                    const isWeekend = dayOfWeek === "土" || dayOfWeek === "日"
                    const isToday = dateString === new Date().toISOString().slice(0, 10)

                    // 各日付に対して、機種×機械番号の組み合わせごとに行を作成
                    const vehicleRows = Object.entries(vehiclesByType).flatMap(([vehicleType, vehicles]) =>
                      vehicles.map((vehicle, vehicleIndex) => ({
                        vehicleType,
                        vehicle,
                        isFirstOfType: vehicleIndex === 0,
                        typeCount: vehicles.length,
                      })),
                    )

                    return vehicleRows.map((row, rowIndex) => (
                      <tr key={`${day}-${row.vehicle.id}`} className={isWeekend ? "bg-red-25" : ""}>
                        {/* 日付セル（最初の車両行のみ表示） */}
                        {rowIndex === 0 && (
                          <td
                            className={`border p-2 text-center font-medium sticky left-0 z-10 cursor-pointer hover:bg-blue-100 transition-colors ${
                              isToday ? "bg-yellow-100" : "bg-gray-50"
                            }`}
                            rowSpan={vehicleRows.length}
                            onClick={() => handleDateClick(dateString)}
                          >
                            {day}
                          </td>
                        )}

                        {/* 曜日セル（最初の車両行のみ表示） */}
                        {rowIndex === 0 && (
                          <td
                            className={`border p-2 text-center text-sm sticky left-16 z-10 ${
                              isWeekend ? "text-red-600 font-medium" : "text-gray-600"
                            } ${isToday ? "bg-yellow-100" : "bg-gray-50"}`}
                            rowSpan={vehicleRows.length}
                          >
                            {dayOfWeek}
                          </td>
                        )}

                        {/* 機種セル */}
                        {row.isFirstOfType && (
                          <td className="border p-2 text-center font-medium bg-blue-50" rowSpan={row.typeCount}>
                            <div className="flex flex-col items-center space-y-1">
                              <Car className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-semibold">{row.vehicleType}</span>
                            </div>
                          </td>
                        )}

                        {/* 機械番号セル */}
                        <td className="border p-2 text-center font-medium bg-blue-50">
                          <div className="text-sm font-semibold">{row.vehicle.machine_number}</div>
                        </td>

                        {/* 保守基地セル（計画と実績の統合表示） */}
                        {allBases.map((base) => {
                          const plan = getPlanForVehicleDateAndBase(row.vehicle.id, dateString, base.id)
                          const records = operationRecords.filter(
                            r => r.vehicle_id === row.vehicle.id && r.record_date === dateString && 
                            (r.departure_base_id === base.id || r.arrival_base_id === base.id)
                          )
                          const inspection = getInspectionForVehicleAndDate(row.vehicle.id, dateString)

                          return (
                            <td 
                              key={base.id} 
                              className="border p-2"
                            >
                              <div className="space-y-2">
                                {/* 運用計画 */}
                                {plan && (
                                  <div 
                                    className="space-y-1 cursor-pointer hover:bg-blue-100 rounded p-1"
                                    onClick={() => handleCellClick(row.vehicle.id, dateString)}
                                  >
                                    <div className={`text-xs px-1 py-0.5 rounded ${getShiftTypeColor(plan.shift_type)}`}>
                                      計画: {getShiftTypeLabel(plan.shift_type)}
                                    </div>
                                  </div>
                                )}

                                {/* 運用実績リスト */}
                                {records.length > 0 && (
                                  <div className="space-y-1">
                                    {records.map((record) => (
                                      <div 
                                        key={record.id}
                                        className="space-y-1 cursor-pointer hover:opacity-80 rounded p-1"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleCellClick(row.vehicle.id, dateString, record)
                                        }}
                                      >
                                        <div className={`text-xs px-1 py-0.5 rounded border ${getRecordDisplayColor(record, record.shift_type)}`}>
                                          実績: {getShiftTypeLabel(record.shift_type)}
                                          {record.is_as_planned && (
                                            <span className="ml-1 text-xs">✓</span>
                                          )}
                                        </div>
                                        <div className={`text-xs px-1 py-0.5 rounded ${getStatusBadgeColor(record.status)}`}>
                                          {getStatusLabel(record.status)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* 実績追加ボタン（計画がある場合） */}
                                {plan && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCellClick(row.vehicle.id, dateString)
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded w-full text-left"
                                  >
                                    + 実績追加
                                  </button>
                                )}

                                {/* 検査 */}
                                {inspection && (
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-1">
                                      <Wrench className="w-3 h-3 text-purple-600" />
                                      <div className={`text-xs px-1 py-0.5 rounded ${getPriorityBadgeColor(inspection.priority)}`}>
                                        {inspection.priority === "urgent"
                                          ? "緊急"
                                          : inspection.priority === "high"
                                            ? "高"
                                            : inspection.priority === "normal"
                                              ? "通常"
                                              : "低"}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-600">{inspection.inspection_type}</div>
                                    <div className="text-xs text-gray-500">{inspection.notes}</div>
                                  </div>
                                )}

                                {/* データがない場合（クリックで実績追加可能） */}
                                {!plan && records.length === 0 && !inspection && (
                                  <button
                                    onClick={() => handleCellClick(row.vehicle.id, dateString)}
                                    className="text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 px-2 py-2 rounded w-full text-center transition-colors"
                                  >
                                    + 実績追加
                                  </button>
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 実績編集モーダル */}
      <Dialog open={showRecordModal} onOpenChange={setShowRecordModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? "運用実績を編集" : "新しい運用実績を作成"}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan 
                ? "運用計画を基に実績を入力します。必要に応じて修正してください。"
                : editingRecord 
                  ? "既存の運用実績を編集します。"
                  : "計画にはない実績を新規作成します。日付・機種・基地を入力してください。"}
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-1">
              <div className="text-sm font-medium text-blue-900">参照: 運用計画</div>
              <div className="text-xs text-blue-700">
                <div>勤務形態: {selectedPlan.shift_type === "day" ? "昼間" : selectedPlan.shift_type === "night" ? "夜間" : "昼夜"}</div>
                <div>時間: {selectedPlan.start_time?.slice(0, 5)} - {selectedPlan.end_time?.slice(0, 5)}</div>
                <div>予定距離: {selectedPlan.planned_distance} km</div>
                {selectedPlan.notes && <div>備考: {selectedPlan.notes}</div>}
              </div>
            </div>
          )}

          {!selectedPlan && !editingRecord && (
            <div className="bg-amber-50 p-3 rounded-lg space-y-1">
              <div className="text-sm font-medium text-amber-900">⚠️ 計画なしの実績追加</div>
              <div className="text-xs text-amber-700">
                運用計画が存在しない実績を追加します。日付、機種、基地を指定してください。
              </div>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">車両</Label>
                <Select 
                  value={recordForm.vehicle_id} 
                  onValueChange={(value) => setRecordForm({ ...recordForm, vehicle_id: value })}
                  disabled={!!editingRecord}
                >
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="車両を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {allVehicles.filter(v => v.id).map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.name} - {vehicle.machine_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="record_date">実績日</Label>
                <Input
                  id="record_date"
                  type="date"
                  value={recordForm.record_date}
                  onChange={(e) => setRecordForm({ ...recordForm, record_date: e.target.value })}
                  disabled={!!editingRecord}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift_type">勤務形態</Label>
                <Select 
                  value={recordForm.shift_type} 
                  onValueChange={(value) => setRecordForm({ ...recordForm, shift_type: value })}
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
                <Input
                  id="start_time"
                  type="time"
                  value={recordForm.start_time}
                  onChange={(e) => setRecordForm({ ...recordForm, start_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">終了時刻</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={recordForm.end_time}
                  onChange={(e) => setRecordForm({ ...recordForm, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure_base">出発基地</Label>
                <Select 
                  value={recordForm.departure_base_id} 
                  onValueChange={(value) => setRecordForm({ ...recordForm, departure_base_id: value })}
                >
                  <SelectTrigger id="departure_base">
                    <SelectValue placeholder="出発基地を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">なし</SelectItem>
                    {allBases.filter(b => b.id).map((base) => (
                      <SelectItem key={base.id} value={base.id.toString()}>
                        {base.base_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!editingRecord && (() => {
                  const previousRecords = operationRecords
                    .filter(r => r.vehicle_id === Number.parseInt(recordForm.vehicle_id) && r.record_date < recordForm.record_date)
                    .sort((a, b) => b.record_date.localeCompare(a.record_date))
                  const lastRecord = previousRecords[0]
                  const lastArrivalBaseId = lastRecord?.arrival_base_id
                  const currentDepartureBaseId = recordForm.departure_base_id ? Number.parseInt(recordForm.departure_base_id) : null
                  
                  if (lastArrivalBaseId && currentDepartureBaseId && lastArrivalBaseId !== currentDepartureBaseId) {
                    const lastBase = allBases.find(b => b.id === lastArrivalBaseId)
                    return (
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        ⚠️ 現在の留置は{lastBase?.base_name}基地です
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrival_base">到着基地</Label>
                <Select 
                  value={recordForm.arrival_base_id} 
                  onValueChange={(value) => setRecordForm({ ...recordForm, arrival_base_id: value })}
                >
                  <SelectTrigger id="arrival_base">
                    <SelectValue placeholder="到着基地を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">なし</SelectItem>
                    {allBases.filter(b => b.id).map((base) => (
                      <SelectItem key={base.id} value={base.id.toString()}>
                        {base.base_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actual_distance">実績距離 (km)</Label>
                <Input
                  id="actual_distance"
                  type="number"
                  min="0"
                  step="0.1"
                  value={recordForm.actual_distance}
                  onChange={(e) => setRecordForm({ ...recordForm, actual_distance: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">ステータス</Label>
                <Select 
                  value={recordForm.status} 
                  onValueChange={(value) => setRecordForm({ ...recordForm, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">完了</SelectItem>
                    <SelectItem value="partial">部分実施</SelectItem>
                    <SelectItem value="cancelled">中止</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={recordForm.notes}
                onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                placeholder="備考を入力してください"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <Checkbox
                id="is_as_planned"
                checked={recordForm.is_as_planned}
                onCheckedChange={(checked) => setRecordForm({ ...recordForm, is_as_planned: checked as boolean })}
              />
              <Label htmlFor="is_as_planned" className="text-sm font-medium cursor-pointer">
                計画通りの実績（チェックすると青系の色で表示されます）
              </Label>
            </div>
          </div>

          <DialogFooter>
            <div className="flex justify-between w-full">
              <div>
                {editingRecord && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteRecord}
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
                    setShowRecordModal(false)
                    setEditingRecord(null)
                    setSelectedPlan(null)
                  }}
                >
                  キャンセル
                </Button>
                <Button onClick={handleSaveRecord}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingRecord ? "更新" : "作成"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 