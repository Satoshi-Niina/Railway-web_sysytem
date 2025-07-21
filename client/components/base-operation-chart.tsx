"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Filter, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import type { Vehicle, OperationPlan, OperationRecord, InspectionPlan } from "@/types"

export function BaseOperationChart() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [operationPlans, setOperationPlans] = useState<OperationPlan[]>([])
  const [operationRecords, setOperationRecords] = useState<OperationRecord[]>([])
  const [inspectionPlans, setInspectionPlans] = useState<InspectionPlan[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  // フィルター状態
  const [filters, setFilters] = useState({
    vehicleType: "all",
    shiftType: "all",
    status: "all",
    inspectionCategory: "all",
  })

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [plansRes, recordsRes, inspectionsRes, vehiclesRes] = await Promise.all([
        fetch(`/api/operation-plans?month=${currentMonth}`),
        fetch(`/api/operation-records?month=${currentMonth}`),
        fetch(`/api/inspection-plans?month=${currentMonth}`),
        fetch("/api/vehicles"),
      ])

      const [plansData, recordsData, inspectionsData, vehiclesData] = await Promise.all([
        plansRes.json(),
        recordsRes.json(),
        inspectionsRes.json(),
        vehiclesRes.json(),
      ])

      setOperationPlans(plansData || [])
      setOperationRecords(recordsData || [])
      setInspectionPlans(inspectionsData || [])
      setVehicles(vehiclesData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      // エラー時は空配列を設定
      setOperationPlans([])
      setOperationRecords([])
      setInspectionPlans([])
      setVehicles([])
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

  const getPlansForDate = (vehicleId: number, date: string) => {
    return operationPlans.filter((p) => p.vehicle_id === vehicleId && p.plan_date === date)
  }

  const getRecordsForDate = (vehicleId: number, date: string) => {
    return operationRecords.filter((r) => r.vehicle_id === vehicleId && r.record_date === date)
  }

  const getInspectionsForDate = (vehicleId: number, date: string) => {
    return inspectionPlans.filter(
      (i) => i.vehicle_id === vehicleId && date >= i.planned_start_date && date <= i.planned_end_date,
    )
  }

  // フィルタリング関数
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (filters.vehicleType !== "all" && vehicle.name !== filters.vehicleType) return false
    return true
  })

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
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getInspectionBadgeColor = (category: string) => {
    switch (category) {
      case "臨修":
        return "bg-red-100 text-red-800"
      case "甲検":
        return "bg-orange-100 text-orange-800"
      case "乙検":
        return "bg-blue-100 text-blue-800"
      case "定検":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // 月ナビゲーション
  const navigateMonth = (direction: "prev" | "next" | "current") => {
    if (direction === "current") {
      setCurrentMonth(new Date().toISOString().slice(0, 7))
    } else {
      const [year, month] = currentMonth.split("-").map(Number)
      const date = new Date(year, month - 1)
      if (direction === "prev") {
        date.setMonth(date.getMonth() - 1)
      } else {
        date.setMonth(date.getMonth() + 1)
      }
      setCurrentMonth(date.toISOString().slice(0, 7))
    }
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  if (loading) {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">運用管理チャート</h2>
        <div className="flex items-center space-x-4">
          {/* 月ナビゲーション */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <Input
                type="month"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="w-40"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("current")}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Filter className="w-5 h-5 mr-2" />
            フィルター
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">機種</label>
              <Select
                value={filters.vehicleType}
                onValueChange={(value) => setFilters({ ...filters, vehicleType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="モータカー">モータカー</SelectItem>
                  <SelectItem value="鉄トロ">鉄トロ</SelectItem>
                  <SelectItem value="ホッパー">ホッパー</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">勤務区分</label>
              <Select value={filters.shiftType} onValueChange={(value) => setFilters({ ...filters, shiftType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="day">昼勤</SelectItem>
                  <SelectItem value="night">夜勤</SelectItem>
                  <SelectItem value="day_night">昼夜勤</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">実績状況</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                  <SelectItem value="partial">部分完了</SelectItem>
                  <SelectItem value="cancelled">中止</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">検査種別</label>
              <Select
                value={filters.inspectionCategory}
                onValueChange={(value) => setFilters({ ...filters, inspectionCategory: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="臨修">臨修</SelectItem>
                  <SelectItem value="定検">定検</SelectItem>
                  <SelectItem value="乙検">乙検</SelectItem>
                  <SelectItem value="甲検">甲検</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* メインチャート */}
      <Card>
        <CardHeader>
          <CardTitle>{currentMonth} 運用管理チャート</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-50 text-left min-w-32">車両</th>
                  <th className="border p-2 bg-gray-50 text-center min-w-20">機械番号</th>
                  {days.map((day) => (
                    <th key={day} className="border p-1 bg-gray-50 text-center min-w-24 text-sm">
                      {day}日
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td className="border p-2 font-medium bg-blue-50">
                      <div className="text-sm">
                        <div className="font-semibold">{vehicle.name}</div>
                        <div className="text-gray-500 text-xs">{vehicle.model}</div>
                        <div className="text-gray-500 text-xs">{vehicle.base_location}</div>
                      </div>
                    </td>
                    <td className="border p-2 text-center bg-blue-50 text-sm">{vehicle.machine_number || "-"}</td>
                    {days.map((day) => {
                      const dateString = getDateString(day)
                      const plans = getPlansForDate(vehicle.id, dateString)
                      const records = getRecordsForDate(vehicle.id, dateString)
                      const inspections = getInspectionsForDate(vehicle.id, dateString)

                      // フィルター適用
                      const filteredPlans = plans.filter(
                        (plan) => filters.shiftType === "all" || plan.shift_type === filters.shiftType,
                      )
                      const filteredRecords = records.filter(
                        (record) =>
                          (filters.shiftType === "all" || record.shift_type === filters.shiftType) &&
                          (filters.status === "all" || record.status === filters.status),
                      )
                      const filteredInspections = inspections.filter(
                        (inspection) =>
                          filters.inspectionCategory === "all" ||
                          inspection.inspection_category === filters.inspectionCategory,
                      )

                      return (
                        <td key={`${vehicle.id}-${day}`} className="border p-1">
                          <div className="space-y-1">
                            {/* 運用計画 */}
                            {filteredPlans.map((plan) => (
                              <div key={`plan-${plan.id}`} className="space-y-1">
                                <Badge className={`text-xs ${getShiftBadgeColor(plan.shift_type)}`}>
                                  計画: {plan.shift_type === "day" ? "昼" : plan.shift_type === "night" ? "夜" : "昼夜"}
                                </Badge>
                                <div className="text-xs text-gray-600">{plan.planned_distance}km</div>
                              </div>
                            ))}

                            {/* 運用実績 */}
                            {filteredRecords.map((record) => (
                              <div key={`record-${record.id}`} className="space-y-1">
                                <Badge className={`text-xs ${getShiftBadgeColor(record.shift_type)}`}>
                                  実績:{" "}
                                  {record.shift_type === "day" ? "昼" : record.shift_type === "night" ? "夜" : "昼夜"}
                                </Badge>
                                <Badge className={`text-xs ${getStatusBadgeColor(record.status)}`}>
                                  {record.status === "completed"
                                    ? "完了"
                                    : record.status === "partial"
                                      ? "部分"
                                      : "中止"}
                                </Badge>
                                <div className="text-xs text-gray-600">{record.actual_distance}km</div>
                              </div>
                            ))}

                            {/* 検査計画 */}
                            {filteredInspections.map((inspection) => (
                              <div key={`inspection-${inspection.id}`} className="space-y-1">
                                <Badge className={`text-xs ${getInspectionBadgeColor(inspection.inspection_category)}`}>
                                  {inspection.inspection_category}
                                </Badge>
                                <div className="text-xs text-gray-600">{inspection.inspection_type}</div>
                              </div>
                            ))}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12 text-gray-500">フィルター条件に一致する車両がありません。</div>
      )}
    </div>
  )
}
