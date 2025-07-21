"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Wrench,
  History,
  CalendarDays,
  AlertCircle,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { Vehicle, OperationPlan, OperationRecord, InspectionPlan, Base } from "@/types"
import { isDatabaseConfigured } from "@/lib/api-client"

export function OperationOverviewChart() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [operationPlans, setOperationPlans] = useState<OperationPlan[]>([])
  const [operationRecords, setOperationRecords] = useState<OperationRecord[]>([])
  const [inspectionPlans, setInspectionPlans] = useState<InspectionPlan[]>([])
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [allBases, setAllBases] = useState<Base[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // フィルター状態
  const [filterShiftType, setFilterShiftType] = useState<string>("all")
  const [filterRecordStatus, setFilterRecordStatus] = useState<string>("all")
  const [filterInspectionCategory, setFilterInspectionCategory] = useState<string>("all")

  const currentDate = new Date()
  const selectedDate = new Date(currentMonth + "-01")
  const isCurrentMonth = currentMonth === currentDate.toISOString().slice(0, 7)
  const isPastMonth = selectedDate < new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const isFutureMonth = selectedDate > new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  // 固定の機種リスト
  const vehicleTypes = ["モータカー", "鉄トロ（10t）", "鉄トロ（15t）", "箱トロ", "ホッパー車"]

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      setError(null)

      // モックデータを使用
      const mockVehicles: Vehicle[] = [
        {
          id: 1,
          name: "モータカー",
          model: "MC-100",
          base_location: "本社基地",
          machine_number: "M001",
          manufacturer: "日本車両",
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
          manufacturer: "日本車両",
          acquisition_date: "2020-05-01",
          management_office: "本社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 3,
          name: "鉄トロ（10t）",
          model: "TT-10",
          base_location: "北部基地",
          machine_number: "T001",
          manufacturer: "川崎重工",
          acquisition_date: "2019-06-01",
          management_office: "関西支社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 4,
          name: "ホッパー車",
          model: "HP-50",
          base_location: "南部基地",
          machine_number: "H001",
          manufacturer: "日立製作所",
          acquisition_date: "2021-03-01",
          management_office: "本社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]

      const mockBases: Base[] = [
        {
          id: 1,
          base_name: "本社基地",
          location: "東京",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          base_name: "北部基地",
          location: "埼玉",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 3,
          base_name: "南部基地",
          location: "神奈川",
          created_at: "2024-01-01T00:00:00Z",
        },
      ]

      // サンプル運用計画データ
      const mockOperationPlans: OperationPlan[] = [
        {
          id: 1,
          vehicle_id: 1,
          plan_date: `${currentMonth}-15`,
          shift_type: "day",
          start_time: "08:00",
          end_time: "17:00",
          planned_distance: 50,
          departure_base_id: 1,
          arrival_base_id: 2,
          notes: "定期点検後初回運用",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          vehicle: mockVehicles[0],
          departure_base: mockBases[0],
          arrival_base: mockBases[1],
        },
        {
          id: 2,
          vehicle_id: 2,
          plan_date: `${currentMonth}-16`,
          shift_type: "night",
          start_time: "22:00",
          end_time: "06:00",
          planned_distance: 30,
          departure_base_id: 2,
          arrival_base_id: 3,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          vehicle: mockVehicles[1],
          departure_base: mockBases[1],
          arrival_base: mockBases[2],
        },
        {
          id: 3,
          vehicle_id: 3,
          plan_date: `${currentMonth}-17`,
          shift_type: "day_night",
          start_time: "08:00",
          end_time: "20:00",
          planned_distance: 75,
          departure_base_id: 1,
          arrival_base_id: 3,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          vehicle: mockVehicles[2],
          departure_base: mockBases[0],
          arrival_base: mockBases[2],
        },
      ]

      // サンプル運用実績データ
      const mockOperationRecords: OperationRecord[] = [
        {
          id: 1,
          vehicle_id: 1,
          record_date: `${currentMonth}-15`,
          shift_type: "day",
          actual_start_time: "08:15",
          actual_end_time: "17:30",
          actual_distance: 48,
          departure_base_id: 1,
          arrival_base_id: 2,
          status: "completed",
          notes: "順調に完了",
          auto_imported: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          vehicle: mockVehicles[0],
          departure_base: mockBases[0],
          arrival_base: mockBases[1],
        },
        {
          id: 2,
          vehicle_id: 3,
          record_date: `${currentMonth}-17`,
          shift_type: "day_night",
          actual_start_time: "08:00",
          actual_end_time: "19:45",
          actual_distance: 72,
          departure_base_id: 1,
          arrival_base_id: 3,
          status: "completed",
          auto_imported: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          vehicle: mockVehicles[2],
          departure_base: mockBases[0],
          arrival_base: mockBases[2],
        },
      ]

      // サンプル検査計画データ
      const mockInspectionPlans: InspectionPlan[] = [
        {
          id: 1,
          vehicle_id: 4,
          inspection_type: "乙A検査",
          planned_start_date: `${currentMonth}-20`,
          planned_end_date: `${currentMonth}-22`,
          estimated_duration: 3,
          inspection_category: "定検",
          status: "planned",
          notes: "年次定期検査",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          vehicle: mockVehicles[3],
        },
      ]

      setOperationPlans(mockOperationPlans)
      setOperationRecords(mockOperationRecords)
      setInspectionPlans(mockInspectionPlans)
      setAllVehicles(mockVehicles)
      setAllBases(mockBases)
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

  // 特定の日付と機種の運用データを取得
  const getDataForDateAndType = (date: string, vehicleType: string) => {
    const vehiclesOfType = allVehicles.filter((v) => v.name === vehicleType)
    const vehicleIds = vehiclesOfType.map((v) => v.id)

    const plans = operationPlans.filter(
      (p) =>
        p.plan_date === date &&
        vehicleIds.includes(p.vehicle_id) &&
        (filterShiftType === "all" || p.shift_type === filterShiftType),
    )

    const records = operationRecords.filter(
      (r) =>
        r.record_date === date &&
        vehicleIds.includes(r.vehicle_id) &&
        (filterShiftType === "all" || r.shift_type === filterShiftType) &&
        (filterRecordStatus === "all" || r.status === filterRecordStatus),
    )

    const inspections = inspectionPlans.filter(
      (i) =>
        vehicleIds.includes(i.vehicle_id) &&
        date >= i.planned_start_date &&
        date <= i.planned_end_date &&
        (filterInspectionCategory === "all" || i.inspection_category === filterInspectionCategory),
    )

    return { plans, records, inspections, vehicles: vehiclesOfType }
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

  const getShiftBadgeColor = (shiftType: string) => {
    switch (shiftType) {
      case "day":
        return "bg-yellow-100 text-yellow-800"
      case "night":
        return "bg-blue-100 text-blue-800"
      case "day_night":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getInspectionCategoryColor = (category: string) => {
    switch (category) {
      case "臨修":
        return "bg-red-100 text-red-800"
      case "甲検":
        return "bg-orange-100 text-orange-800"
      case "乙検":
        return "bg-blue-100 text-blue-800"
      case "定検":
        return "bg-green-100 text-green-800"
      case "その他":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  if (loading) {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      {!isDatabaseConfigured() && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            データベースが設定されていません。モックデータを表示しています。実際のデータを使用するには、Supabaseの設定を完了してください。
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
          <h2 className="text-2xl font-bold">運用管理チャート</h2>
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

      {/* 月の概要情報 */}
      <Card className={monthInfo.bgColor}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <MonthIcon className={`w-6 h-6 ${monthInfo.color}`} />
              <div>
                <h3 className="font-semibold text-lg">
                  {new Date(currentMonth + "-01").toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                  })}
                </h3>
                <p className={`text-sm ${monthInfo.color}`}>
                  {isPastMonth && "過去の運用履歴を表示しています"}
                  {isFutureMonth && "将来の運用計画を表示しています"}
                  {isCurrentMonth && "当月の運用状況を表示しています"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                運用計画: {operationPlans.length}件 | 実績記録: {operationRecords.length}件 | 検査計画:{" "}
                {inspectionPlans.length}件
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 凡例 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">凡例</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="font-medium">運用計画</div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <Badge className="bg-yellow-100 text-yellow-800">昼間</Badge>
                <Badge className="bg-blue-100 text-blue-800">夜間</Badge>
                <Badge className="bg-purple-100 text-purple-800">昼夜</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium">実績状況</div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <Badge className="bg-green-100 text-green-800">完了</Badge>
                <Badge className="bg-red-100 text-red-800">中止</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium">検査種別</div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <Badge className="bg-red-100 text-red-800">臨修</Badge>
                <Badge className="bg-orange-100 text-orange-800">甲検</Badge>
                <Badge className="bg-blue-100 text-blue-800">乙検</Badge>
                <Badge className="bg-green-100 text-green-800">定検</Badge>
                <Badge className="bg-gray-100 text-gray-800">その他</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* フィルター */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="filterShiftType" className="text-sm">
                運用計画:
              </Label>
              <Select value={filterShiftType} onValueChange={setFilterShiftType}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="全て" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  <SelectItem value="day">昼間</SelectItem>
                  <SelectItem value="night">夜間</SelectItem>
                  <SelectItem value="day_night">昼夜</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="filterRecordStatus" className="text-sm">
                実績状況:
              </Label>
              <Select value={filterRecordStatus} onValueChange={setFilterRecordStatus}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="全て" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                  <SelectItem value="cancelled">中止</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="filterInspectionCategory" className="text-sm">
                検査種別:
              </Label>
              <Select value={filterInspectionCategory} onValueChange={setFilterInspectionCategory}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="全て" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  <SelectItem value="臨修">臨修</SelectItem>
                  <SelectItem value="定検">定検</SelectItem>
                  <SelectItem value="乙検">乙検</SelectItem>
                  <SelectItem value="甲検">甲検</SelectItem>
                  <SelectItem value="その他">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* メインチャート */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>{currentMonth} 運用管理チャート</span>
            <Badge variant="outline" className={monthInfo.color}>
              {monthInfo.label}表示
            </Badge>
          </CardTitle>
          <div className="text-sm text-gray-600">
            {isPastMonth && "過去の運用履歴と検査実績を確認できます"}
            {isFutureMonth && "将来の運用計画と検査予定を確認できます"}
            {isCurrentMonth && "当月の運用状況をリアルタイムで確認できます"}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-50 text-left min-w-20">日付</th>
                  {vehicleTypes.map((type) => (
                    <th key={type} className="border p-2 bg-gray-50 text-center min-w-32 text-sm">
                      {type}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => {
                  const dateString = getDateString(day)
                  const dayOfWeek = new Date(dateString).toLocaleDateString("ja-JP", { weekday: "short" })
                  const isWeekend = dayOfWeek === "土" || dayOfWeek === "日"

                  return (
                    <tr key={day}>
                      <td className={`border p-2 font-medium text-center ${isWeekend ? "bg-red-50" : "bg-blue-50"}`}>
                        <div className="text-sm">
                          <div className="font-semibold">{day}日</div>
                          <div className={`text-xs ${isWeekend ? "text-red-600" : "text-gray-500"}`}>({dayOfWeek})</div>
                        </div>
                      </td>
                      {vehicleTypes.map((vehicleType) => {
                        const { plans, records, inspections, vehicles } = getDataForDateAndType(dateString, vehicleType)

                        return (
                          <td key={vehicleType} className="border p-1">
                            <div className="space-y-1">
                              {/* 運用計画 */}
                              {plans.map((plan) => {
                                const vehicle = vehicles.find((v) => v.id === plan.vehicle_id)
                                return (
                                  <div key={`plan-${plan.id}`} className="space-y-1 p-1 bg-blue-100 rounded">
                                    <div className="flex items-center justify-between">
                                      <Badge className={`text-xs ${getShiftBadgeColor(plan.shift_type)}`}>
                                        {plan.shift_type === "day"
                                          ? "昼間"
                                          : plan.shift_type === "night"
                                            ? "夜間"
                                            : "昼夜"}
                                      </Badge>
                                      <div className="text-xs text-gray-600">{vehicle?.machine_number}</div>
                                    </div>
                                    <div className="text-xs text-gray-800">{plan.planned_distance}km</div>
                                    {plan.start_time && (
                                      <div className="text-xs text-gray-700 flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {plan.start_time}
                                      </div>
                                    )}
                                    {(plan.departure_base || plan.arrival_base) && (
                                      <div className="text-xs text-gray-700 flex items-center">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {plan.departure_base?.base_name || "不明"}
                                        {plan.arrival_base && ` → ${plan.arrival_base.base_name}`}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}

                              {/* 運用実績 */}
                              {records.map((record) => {
                                const vehicle = vehicles.find((v) => v.id === record.vehicle_id)
                                return (
                                  <div key={`record-${record.id}`} className="space-y-1 p-1 bg-green-100 rounded">
                                    <div className="flex items-center justify-between">
                                      <Badge className={`text-xs ${getShiftBadgeColor(record.shift_type)}`}>
                                        {record.shift_type === "day"
                                          ? "昼間"
                                          : record.shift_type === "night"
                                            ? "夜間"
                                            : "昼夜"}
                                      </Badge>
                                      <div className="text-xs text-gray-600">{vehicle?.machine_number}</div>
                                    </div>
                                    <Badge className={`text-xs ${getStatusBadgeColor(record.status)}`}>
                                      {record.status === "completed" ? "完了" : "中止"}
                                    </Badge>
                                    <div className="text-xs text-gray-800">{record.actual_distance}km</div>
                                    {record.actual_start_time && (
                                      <div className="text-xs text-gray-700 flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {record.actual_start_time}
                                      </div>
                                    )}
                                    {(record.departure_base || record.arrival_base) && (
                                      <div className="text-xs text-gray-700 flex items-center">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {record.departure_base?.base_name || "不明"}
                                        {record.arrival_base && ` → ${record.arrival_base.base_name}`}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}

                              {/* 検査計画 */}
                              {inspections.map((inspection) => {
                                const vehicle = vehicles.find((v) => v.id === inspection.vehicle_id)
                                return (
                                  <div
                                    key={`inspection-${inspection.id}`}
                                    className="space-y-1 p-1 bg-purple-100 rounded"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-1">
                                        <Wrench className="w-3 h-3 text-purple-600" />
                                        <Badge
                                          className={`text-xs ${getInspectionCategoryColor(inspection.inspection_category)}`}
                                        >
                                          {inspection.inspection_category}
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-gray-600">{vehicle?.machine_number}</div>
                                    </div>
                                    <div className="text-xs text-gray-800">{inspection.inspection_type}</div>
                                    <Badge variant="outline" className="text-xs">
                                      {inspection.status === "planned"
                                        ? "予定"
                                        : inspection.status === "in_progress"
                                          ? "実施中"
                                          : inspection.status === "completed"
                                            ? "完了"
                                            : "延期"}
                                    </Badge>
                                  </div>
                                )
                              })}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* データが無い場合の表示 */}
      {operationPlans.length === 0 && operationRecords.length === 0 && inspectionPlans.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">データがありません</h3>
              <p className="text-sm">
                {isPastMonth && "この月の運用履歴はありません"}
                {isFutureMonth && "この月の運用計画はまだ作成されていません"}
                {isCurrentMonth && "当月の運用データがまだありません"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
