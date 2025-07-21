"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Plus,
  Edit,
  Trash2,
  Wrench,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

import type { Vehicle, Base, ManagementOffice, OperationPlan } from "@/types"

// データベース設定の確認
const isDatabaseConfigured = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_DATABASE_URL || process.env.DATABASE_URL)
}

// 固定の機種表示順
const VEHICLE_TYPE_ORDER = ["モータカー", "MCR", "鉄トロ（10t）", "鉄トロ（15t）", "箱トロ", "ホッパー車"]

export function OperationPlanningChart() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [allBases, setAllBases] = useState<Base[]>([])
  const [allOffices, setAllOffices] = useState<ManagementOffice[]>([])
  const [operationPlans, setOperationPlans] = useState<OperationPlan[]>([])
  const [maintenancePlans, setMaintenancePlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // モーダル状態
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<OperationPlan | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedBase, setSelectedBase] = useState<Base | null>(null)

  // フィルター状態
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("all")
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("all")
  const [selectedMachineNumber, setSelectedMachineNumber] = useState<string>("all")

  const currentDate = new Date()
  const selectedDateObj = new Date(currentMonth + "-01")
  const isCurrentMonth = currentMonth === currentDate.toISOString().slice(0, 7)
  const isPastMonth = selectedDateObj < new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const isFutureMonth = selectedDateObj > new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      setError(null)

      // データベースから保守基地を読み込み
      let bases: Base[] = []
      try {
        const response = await fetch("/api/maintenance-bases")
        if (response.ok) {
          bases = await response.json()
        } else {
          throw new Error("保守基地の取得に失敗しました")
        }
      } catch (error) {
        console.error("Error fetching bases:", error)
        // フォールバック: モックデータ
        bases = [
          {
            id: 1,
            base_name: "本社基地",
            location: "東京",
            created_at: "2024-01-01T00:00:00Z",
          },
          {
            id: 2,
            base_name: "関西保守基地",
            location: "大阪",
            created_at: "2024-01-01T00:00:00Z",
          },
          {
            id: 3,
            base_name: "九州基地",
            location: "福岡",
            created_at: "2024-01-01T00:00:00Z",
          },
          {
            id: 4,
            base_name: "北海道基地",
            location: "札幌",
            created_at: "2024-01-01T00:00:00Z",
          },
        ]
      }

      // モックデータ
      const mockVehicles: Vehicle[] = [
        {
          id: 1,
          name: "モータカー",
          model: "MC-100",
          base_location: "本社基地",
          machine_number: "M001",
          manufacturer: "メーカーA",
          acquisition_date: "2020-04-01",
          management_office: "本社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          name: "モータカー",
          model: "MC-100",
          base_location: "本社基地",
          machine_number: "M002",
          manufacturer: "メーカーA",
          acquisition_date: "2020-05-01",
          management_office: "本社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 3,
          name: "MCR",
          model: "MCR-200",
          base_location: "本社基地",
          machine_number: "MCR001",
          manufacturer: "メーカーB",
          acquisition_date: "2019-06-01",
          management_office: "本社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]

      const mockOffices: ManagementOffice[] = [
        {
          id: 1,
          office_name: "本社保守事業所",
          location: "東京",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          office_name: "関西支社保守事業所",
          location: "大阪",
          created_at: "2024-01-01T00:00:00Z",
        },
      ]

      // サンプル運用計画データ
      const mockOperationPlans: OperationPlan[] = [
        {
          id: 1,
          vehicle_id: 1,
          plan_date: `${currentMonth}-01`,
          shift_type: "day",
          start_time: "08:00",
          end_time: "17:00",
          planned_distance: 50,
          departure_base_id: 1,
          arrival_base_id: 1,
          notes: "通常運用",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          vehicle_id: 1,
          plan_date: `${currentMonth}-02`,
          shift_type: "night",
          start_time: "20:00",
          end_time: "05:00",
          planned_distance: 80,
          departure_base_id: 1,
          arrival_base_id: 2,
          notes: "夜間運用（本社→関西）",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 3,
          vehicle_id: 1,
          plan_date: `${currentMonth}-02`,
          shift_type: "night",
          start_time: "20:00",
          end_time: "05:00",
          planned_distance: 0,
          departure_base_id: 2,
          arrival_base_id: 2,
          notes: "夜間運用（関西基地到着）",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]

      // 検修予定データを取得
      let maintenancePlans: any[] = []
      
      try {
        const response = await fetch(`/api/monthly-maintenance-plans?month=${currentMonth}`)
        if (response.ok) {
          maintenancePlans = await response.json()
        }
      } catch (error) {
        console.error("Error fetching maintenance plans:", error)
        // フォールバック: モックデータ
        maintenancePlans = [
          {
            id: 1,
            vehicle_id: 1,
            plan_month: currentMonth,
            inspection_type: "乙B検査",
            planned_date: `${currentMonth}-15`,
            status: "planned",
            notes: "乙B検査予定",
            vehicle: {
              id: 1,
              name: "モータカー",
              model: "MC-100",
              base_location: "本社基地",
              machine_number: "M001",
              manufacturer: "メーカーA",
              acquisition_date: "2020-04-01",
              management_office: "本社保守事業所",
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        ]
      }

      setAllVehicles(mockVehicles)
      setAllBases(bases)
      setAllOffices(mockOffices)
      setOperationPlans(mockOperationPlans)
      setMaintenancePlans(maintenancePlans)
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

  // 翌日の日付を取得
  const getNextDate = (dateString: string) => {
    const date = new Date(dateString)
    date.setDate(date.getDate() + 1)
    return date.toISOString().slice(0, 10)
  }

  // 前日の日付を取得
  const getPreviousDay = (dateString: string) => {
    const date = new Date(dateString)
    date.setDate(date.getDate() - 1)
    return date.toISOString().slice(0, 10)
  }

  // 事業所でフィルタリングされた車両を取得
  const filteredVehicles = useMemo(() => {
    let vehicles = allVehicles

    // 事業所でフィルタリング
    if (selectedOfficeId !== "all") {
      const officeName = allOffices.find((o) => o.id === Number.parseInt(selectedOfficeId))?.office_name
      vehicles = vehicles.filter((vehicle) => vehicle.management_office === officeName)
    }

    // 機種でフィルタリング
    if (selectedVehicleType !== "all") {
      vehicles = vehicles.filter((vehicle) => vehicle.name === selectedVehicleType)
    }

    // 機械番号でフィルタリング
    if (selectedMachineNumber !== "all") {
      vehicles = vehicles.filter((vehicle) => vehicle.machine_number === selectedMachineNumber)
    }

    return vehicles
  }, [allVehicles, selectedOfficeId, selectedVehicleType, selectedMachineNumber, allOffices])

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

  // 特定の日付、車両、基地の運用計画を取得
  const getPlanForVehicleDateAndBase = (vehicleId: number, date: string, baseId: number): OperationPlan | undefined => {
    return operationPlans.find((plan) => 
      plan.vehicle_id === vehicleId && 
      plan.plan_date === date && 
      plan.departure_base_id === baseId
    )
  }

  // 特定の日付、車両、基地の到着運用計画を取得
  const getArrivalPlanForVehicleDateAndBase = (vehicleId: number, date: string, baseId: number): OperationPlan | undefined => {
    return operationPlans.find((plan) => 
      plan.vehicle_id === vehicleId && 
      plan.plan_date === date && 
      plan.arrival_base_id === baseId
    )
  }

  // 前日の運用計画を取得（翌日表示用）
  const getPreviousDayPlan = (vehicleId: number, date: string): OperationPlan | undefined => {
    const previousDate = new Date(date)
    previousDate.setDate(previousDate.getDate() - 1)
    const previousDateString = previousDate.toISOString().slice(0, 10)
    
    return operationPlans.find((plan) => 
      plan.vehicle_id === vehicleId && 
      plan.plan_date === previousDateString
    )
  }

  // 車両の現在の留置基地を取得
  const getCurrentDetentionBase = (vehicleId: number, date: string): number | null => {
    // 前日の運用計画を取得
    const previousDay = getPreviousDay(date)
    const previousDayPlan = getPreviousDayPlan(vehicleId, previousDay)
    
    if (previousDayPlan) {
      // 前日の運用が夜間または昼夜の場合、翌日は留置
      if (previousDayPlan.shift_type === "night" || previousDayPlan.shift_type === "both") {
        return previousDayPlan.arrival_base_id
      }
    }
    
    return null
  }

  // 最終留置基地を取得
  const getFinalDetentionBase = (vehicleId: number, date: string): number | null => {
    // 指定日以前の最新の運用計画を取得
    const plans = operationPlans
      .filter(plan => plan.vehicle_id === vehicleId && plan.plan_date <= date)
      .sort((a, b) => new Date(b.plan_date).getTime() - new Date(a.plan_date).getTime())

    if (plans.length === 0) return null

    const latestPlan = plans[0]
    return latestPlan.arrival_base_id
  }

  // 留置期間かどうかをチェック
  const isDetentionPeriod = (vehicleId: number, date: string, baseId: number): boolean => {
    const currentDetentionBase = getCurrentDetentionBase(vehicleId, date)
    const finalDetentionBase = getFinalDetentionBase(vehicleId, date)
    
    // 前日の夜間・昼夜運用による留置
    if (currentDetentionBase === baseId) {
      return true
    }
    
    // 最終留置基地での継続留置
    if (finalDetentionBase === baseId) {
      // 指定日に運用計画がない場合
      const hasPlanOnDate = operationPlans.some(plan => 
        plan.vehicle_id === vehicleId && plan.plan_date === date
      )
      return !hasPlanOnDate
    }
    
    return false
  }

  // セルクリック時の処理
  const handleCellClick = (vehicle: Vehicle, date: string, base: Base) => {
    const existingPlan = getPlanForVehicleDateAndBase(vehicle.id, date, base.id)
    const currentDetentionBase = getCurrentDetentionBase(vehicle.id, date)
    const finalDetentionBase = getFinalDetentionBase(vehicle.id, date)
    const isDetentionPeriodActive = isDetentionPeriod(vehicle.id, date, base.id)
    
    // 既存計画がある場合は編集可能
    if (existingPlan) {
      setSelectedVehicle(vehicle)
      setSelectedDate(date)
      setSelectedBase(base)
      setEditingPlan(existingPlan)
      setShowPlanModal(true)
      return
    }
    
    // 留置基地または最終留置基地でのみ新規作成可能
    if (isDetentionPeriodActive || finalDetentionBase === base.id) {
      setSelectedVehicle(vehicle)
      setSelectedDate(date)
      setSelectedBase(base)
      setEditingPlan(null)
      setShowPlanModal(true)
      return
    }
    
    // 留置以外の基地では新規作成不可
    return
  }

  // 計画保存処理
  const handleSavePlan = async (planData: Partial<OperationPlan>) => {
    try {
      if (editingPlan) {
        // 既存計画の更新
        const updatedPlan = { ...editingPlan, ...planData }
        
        // 基地変更があった場合、到着基地を最終留置個所として設定
        if (planData.arrival_base_id && planData.arrival_base_id !== editingPlan.arrival_base_id) {
          updatedPlan.arrival_base_id = planData.arrival_base_id
        }
        
        setOperationPlans(operationPlans.map(p => p.id === editingPlan.id ? updatedPlan : p))
      } else {
        // 新規計画の作成
        const newPlan: OperationPlan = {
          id: Date.now(), // 仮のID
          vehicle_id: selectedVehicle!.id,
          plan_date: selectedDate,
          shift_type: planData.shift_type || "day",
          start_time: "08:00",
          end_time: "17:00",
          planned_distance: 0,
          departure_base_id: planData.departure_base_id ? Number.parseInt(planData.departure_base_id.toString()) : selectedBase!.id,
          arrival_base_id: planData.arrival_base_id ? Number.parseInt(planData.arrival_base_id.toString()) : selectedBase!.id,
          notes: planData.notes || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setOperationPlans([...operationPlans, newPlan])
      }
      
      setShowPlanModal(false)
      setEditingPlan(null)
      setSelectedVehicle(null)
      setSelectedDate("")
      setSelectedBase(null)
    } catch (error) {
      console.error("Error saving plan:", error)
    }
  }

  // 計画削除処理
  const handleDeletePlan = async (planId: number) => {
    try {
      setOperationPlans(operationPlans.filter(p => p.id !== planId))
      setShowPlanModal(false)
      setEditingPlan(null)
      setSelectedVehicle(null)
      setSelectedDate("")
      setSelectedBase(null)
    } catch (error) {
      console.error("Error deleting plan:", error)
    }
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
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // フィルターリセット
  const resetFilters = () => {
    setSelectedOfficeId("all")
    setSelectedVehicleType("all")
    setSelectedMachineNumber("all")
  }

  if (loading) {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      {!isDatabaseConfigured() && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            データベースが設定されていません。モックデータを表示しています。実際のデータを使用するには、データベースの設定を完了してください。
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">運用計画作成</h2>
          <Badge className={`${monthInfo.bgColor} ${monthInfo.color} border-0`}>
            <MonthIcon className="w-4 h-4 mr-1" />
            {monthInfo.label}
          </Badge>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2 min-w-40">
              <Calendar className="w-4 h-4" />
              <Input
                type="month"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="w-32"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          {!isCurrentMonth && (
            <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
              今月に戻る
            </Button>
          )}
        </div>
      </div>

      {/* 検修予定の表示 */}
      {maintenancePlans.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 mb-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">検修予定</span>
            </div>
            <div className="text-sm text-blue-700">
              検修周期マスタから機械番号
              {maintenancePlans.map((plan, index) => (
                <span key={plan.id}>
                  {plan.vehicle?.machine_number || `車両${plan.vehicle_id}`}
                  {index < maintenancePlans.length - 1 ? "、" : ""}
                </span>
              ))}
              の検修予定
            </div>
          </CardContent>
        </Card>
      )}

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
                  {allOffices.map((office) => (
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
                機種
              </Label>
              <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
                <SelectTrigger>
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ての機種</SelectItem>
                  {VEHICLE_TYPE_ORDER.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4" />
                        <span>{type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="machineNumberFilter" className="text-sm font-medium">
                機械番号
              </Label>
              <Select value={selectedMachineNumber} onValueChange={setSelectedMachineNumber}>
                <SelectTrigger>
                  <SelectValue placeholder="機械番号を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ての機械番号</SelectItem>
                  {filteredVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.machine_number} value={vehicle.machine_number}>
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4" />
                        <span>{vehicle.machine_number}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-gray-600">
              {selectedOfficeId !== "all" || selectedVehicleType !== "all" || selectedMachineNumber !== "all" ? (
                <div className="flex items-center space-x-2">
                  <span>フィルター適用中:</span>
                  {selectedOfficeId !== "all" && (
                    <Badge variant="secondary">
                      {allOffices.find((o) => o.id === Number.parseInt(selectedOfficeId))?.office_name}
                    </Badge>
                  )}
                  {selectedVehicleType !== "all" && <Badge variant="secondary">{selectedVehicleType}</Badge>}
                  {selectedMachineNumber !== "all" && <Badge variant="secondary">{selectedMachineNumber}</Badge>}
                </div>
              ) : (
                <span>全てのデータを表示中</span>
              )}
            </div>
            {(selectedOfficeId !== "all" || selectedVehicleType !== "all" || selectedMachineNumber !== "all") && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                フィルターをリセット
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 運用計画作成チャート（保守基地名を横軸に表示） */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>{currentMonth} 運用計画作成</span>
            <Badge variant="outline" className={monthInfo.color}>
              {monthInfo.label}作成
            </Badge>
          </CardTitle>
          <div className="text-sm text-gray-600">
            セルをクリックして運用区分を選択できます。🏠は同一基地、→は基地移動、留置は夜間・昼夜運用の翌日表示です。
          </div>
        </CardHeader>
        <CardContent>
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
                  const dayOfWeek = new Date(dateString).toLocaleDateString("ja-JP", { weekday: "short" })
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
                          className={`border p-2 text-center font-medium sticky left-0 z-10 ${
                            isToday ? "bg-yellow-100" : "bg-gray-50"
                          }`}
                          rowSpan={vehicleRows.length}
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

                      {/* 保守基地セル（クリック可能） */}
                      {allBases.map((base) => {
                        const departurePlan = getPlanForVehicleDateAndBase(row.vehicle.id, dateString, base.id)
                        const arrivalPlan = getArrivalPlanForVehicleDateAndBase(row.vehicle.id, dateString, base.id)
                        const hasDeparturePlan = !!departurePlan
                        const hasArrivalPlan = !!arrivalPlan
                        const currentDetentionBase = getCurrentDetentionBase(row.vehicle.id, dateString)
                        const finalDetentionBase = getFinalDetentionBase(row.vehicle.id, dateString)
                        const isDetentionPeriodActive = isDetentionPeriod(row.vehicle.id, dateString, base.id)
                        const isContinuedDetention = finalDetentionBase === base.id && !hasDeparturePlan && !hasArrivalPlan
                        const canInput = hasDeparturePlan || hasArrivalPlan || isDetentionPeriodActive || isContinuedDetention

                        return (
                          <td 
                            key={base.id}
                            className={`border p-2 transition-colors ${
                              hasDeparturePlan ? 'bg-blue-100 hover:bg-blue-200 cursor-pointer' : 
                              hasArrivalPlan ? 'bg-blue-200 hover:bg-blue-300 cursor-pointer' :
                              isDetentionPeriodActive ? 'bg-gray-200 hover:bg-gray-300 cursor-pointer' : 
                              isContinuedDetention ? 'bg-gray-100 hover:bg-gray-200 cursor-pointer' :
                              canInput ? 'bg-gray-50 hover:bg-blue-50 cursor-pointer' : 'bg-gray-100'
                            }`}
                            onClick={() => canInput && handleCellClick(row.vehicle, dateString, base)}
                          >
                            {hasDeparturePlan ? (
                              <div className="space-y-1">
                                <div className={`text-xs px-1 py-0.5 rounded ${getShiftTypeColor(departurePlan.shift_type)}`}>
                                  {getShiftTypeLabel(departurePlan.shift_type)}
                                </div>
                                
                                {/* 基地移動の表示（出発基地のみ） */}
                                {departurePlan.departure_base_id === departurePlan.arrival_base_id ? (
                                  <div className="text-xs text-gray-600 flex items-center justify-center">
                                    🏠
                                  </div>
                                ) : (
                                  <div className="text-xs text-blue-600 font-medium flex items-center justify-center">
                                    →{allBases.find(b => b.id === departurePlan.arrival_base_id)?.base_name}
                                  </div>
                                )}
                              </div>
                            ) : hasArrivalPlan ? (
                              <div className="text-sm text-gray-700 text-center font-bold">
                                留置
                              </div>
                            ) : isDetentionPeriodActive ? (
                              <div className="text-sm text-gray-700 text-center font-bold">
                                留置
                              </div>
                            ) : isContinuedDetention ? (
                              <div className="text-sm text-gray-600 text-center font-medium">
                                留置
                              </div>
                            ) : canInput ? (
                              <div className="flex items-center justify-center text-gray-500">
                                <Plus className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 text-center">
                                -
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 運用計画作成・編集モーダル */}
      <OperationPlanModal
        open={showPlanModal}
        onClose={() => {
          setShowPlanModal(false)
          setEditingPlan(null)
          setSelectedVehicle(null)
          setSelectedDate("")
          setSelectedBase(null)
        }}
        plan={editingPlan}
        vehicle={selectedVehicle}
        date={selectedDate}
        base={selectedBase}
        bases={allBases}
        onSave={handleSavePlan}
        onDelete={editingPlan ? () => handleDeletePlan(editingPlan.id) : undefined}
      />
    </div>
  )
}

// 運用計画作成・編集モーダルコンポーネント
function OperationPlanModal({
  open,
  onClose,
  plan,
  vehicle,
  date,
  base,
  bases,
  onSave,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  plan: OperationPlan | null
  vehicle: Vehicle | null
  date: string
  base: Base | null
  bases: Base[]
  onSave: (planData: Partial<OperationPlan>) => void
  onDelete?: () => void
}) {
  const [formData, setFormData] = useState({
    shift_type: "day",
    departure_base_id: "",
    arrival_base_id: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Partial<OperationPlan> | null>(null)

  useEffect(() => {
    if (plan) {
      setFormData({
        shift_type: plan.shift_type,
        departure_base_id: plan.departure_base_id?.toString() || "",
        arrival_base_id: plan.arrival_base_id?.toString() || "",
        notes: plan.notes || "",
      })
    } else if (base) {
      // 留置基地からの新規作成時は、その基地を出発・到着基地に設定
      setFormData({
        shift_type: "day",
        departure_base_id: base.id.toString(),
        arrival_base_id: base.id.toString(),
        notes: "",
      })
    } else {
      setFormData({
        shift_type: "day",
        departure_base_id: "",
        arrival_base_id: "",
        notes: "",
      })
    }
  }, [plan, base])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const changes = {
      shift_type: formData.shift_type,
      departure_base_id: formData.departure_base_id ? Number.parseInt(formData.departure_base_id) : null,
      arrival_base_id: formData.arrival_base_id ? Number.parseInt(formData.arrival_base_id) : null,
      notes: formData.notes,
    }

    // 編集時は変更確認ダイアログを表示
    if (plan) {
      const hasChanges = 
        plan.shift_type !== changes.shift_type ||
        plan.departure_base_id !== changes.departure_base_id ||
        plan.arrival_base_id !== changes.arrival_base_id

      if (hasChanges) {
        setPendingChanges(changes)
        setShowConfirmDialog(true)
        return
      }
    }

    await saveChanges(changes)
  }

  const saveChanges = async (changes: Partial<OperationPlan>) => {
    setLoading(true)

    try {
      await onSave(changes)
    } catch (error) {
      console.error("Error saving plan:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (onDelete) {
      setLoading(true)
      try {
        await onDelete()
      } catch (error) {
        console.error("Error deleting plan:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {plan ? "運用計画編集" : "運用計画作成"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>車両</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  <div className="font-medium">{vehicle?.name}</div>
                  <div className="text-sm text-gray-600">{vehicle?.machine_number}</div>
                </div>
              </div>
              <div>
                <Label>計画日</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  {new Date(date).toLocaleDateString("ja-JP")}
                </div>
              </div>
            </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>運用区分</Label>
              <Select
                value={formData.shift_type}
                onValueChange={(value) => setFormData({ ...formData, shift_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">昼間</SelectItem>
                  <SelectItem value="night">夜間</SelectItem>
                  <SelectItem value="both">昼夜</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>出発基地</Label>
              <Select
                value={formData.departure_base_id}
                onValueChange={(value) => setFormData({ ...formData, departure_base_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="基地を選択" />
                </SelectTrigger>
                <SelectContent>
                  {bases.map((base) => (
                    <SelectItem key={base.id} value={base.id.toString()}>
                      {base.base_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>到着基地</Label>
              <Select
                value={formData.arrival_base_id}
                onValueChange={(value) => setFormData({ ...formData, arrival_base_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="基地を選択" />
                </SelectTrigger>
                <SelectContent>
                  {bases.map((base) => (
                    <SelectItem key={base.id} value={base.id.toString()}>
                      {base.base_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>備考</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="運用に関する備考を入力してください"
            />
          </div>

            {/* 編集時の現在の運用計画表示 */}
            {plan && (
              <div className="p-3 bg-blue-50 rounded border">
                <div className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                  <Edit className="w-4 h-4 mr-2" />
                  現在の運用計画（編集可能）
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">運用区分:</span>
                    <span className="ml-2 font-medium">
                      {plan.shift_type === "day" ? "昼間" : plan.shift_type === "night" ? "夜間" : "昼夜"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">出発基地:</span>
                    <span className="ml-2 font-medium">
                      {bases.find(b => b.id === plan.departure_base_id)?.base_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">到着基地:</span>
                    <span className="ml-2 font-medium">
                      {bases.find(b => b.id === plan.arrival_base_id)?.base_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">計画日:</span>
                    <span className="ml-2 font-medium">
                      {new Date(plan.plan_date).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                </div>
                {plan.notes && (
                  <div className="mt-2">
                    <span className="text-gray-600">備考:</span>
                    <span className="ml-2 font-medium">{plan.notes}</span>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="text-xs text-blue-600">
                    最終更新: {new Date(plan.updated_at).toLocaleString("ja-JP")}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex justify-between">
              <div className="flex space-x-2">
                {plan && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    削除
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "保存中..." : plan ? "更新" : "作成"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 変更確認ダイアログ */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>運用計画の変更確認</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              以下の変更を行いますか？
            </div>
            {pendingChanges && plan && (
              <div className="space-y-2">
                {plan.shift_type !== pendingChanges.shift_type && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">運用区分:</span>
                    <span className="font-medium">
                      {plan.shift_type === "day" ? "昼間" : plan.shift_type === "night" ? "夜間" : "昼夜"} 
                      → {pendingChanges.shift_type === "day" ? "昼間" : pendingChanges.shift_type === "night" ? "夜間" : "昼夜"}
                    </span>
                  </div>
                )}
                {plan.departure_base_id !== pendingChanges.departure_base_id && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">出発基地:</span>
                    <span className="font-medium">
                      {bases.find(b => b.id === plan.departure_base_id)?.base_name} 
                      → {bases.find(b => b.id === pendingChanges.departure_base_id)?.base_name}
                    </span>
                  </div>
                )}
                {plan.arrival_base_id !== pendingChanges.arrival_base_id && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">到着基地:</span>
                    <span className="font-medium">
                      {bases.find(b => b.id === plan.arrival_base_id)?.base_name} 
                      → {bases.find(b => b.id === pendingChanges.arrival_base_id)?.base_name}
                    </span>
                  </div>
                )}
                {plan.notes !== pendingChanges.notes && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">備考:</span>
                    <span className="font-medium">
                      {plan.notes || "なし"} → {pendingChanges.notes || "なし"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              キャンセル
            </Button>
            <Button 
              onClick={() => {
                if (pendingChanges) {
                  saveChanges(pendingChanges)
                }
                setShowConfirmDialog(false)
                setPendingChanges(null)
              }}
            >
              変更を確定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 