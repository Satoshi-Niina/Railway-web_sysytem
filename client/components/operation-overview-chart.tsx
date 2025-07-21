"use client"

import React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Wrench, History, CalendarDays, Car } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { Vehicle, OperationPlan, OperationRecord, InspectionPlan, Base } from "@/types" // types/enhanced.ts を types/index.ts に統合したため、こちらからインポート

export function OperationOverviewChart() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [operationPlans, setOperationPlans] = useState<OperationPlan[]>([])
  const [operationRecords, setOperationRecords] = useState<OperationRecord[]>([])
  const [inspectionPlans, setInspectionPlans] = useState<InspectionPlan[]>([])
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]) // 全車両を保持
  const [allBases, setAllBases] = useState<Base[]>([]) // 全基地を保持
  const [loading, setLoading] = useState(true)

  // フィルターと選択車両の状態
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([])
  const [showVehicleSelectModal, setShowVehicleSelectModal] = useState(false)
  const [filterShiftType, setFilterShiftType] = useState<string>("all") // "all", "day", "night", "day_night"
  const [filterRecordStatus, setFilterRecordStatus] = useState<string>("all") // "all", "completed", "cancelled"
  const [filterInspectionCategory, setFilterInspectionCategory] = useState<string>("all") // "all", "臨修", "定検", "乙検", "甲検", "その他"

  // 車両選択モーダル内のフィルター
  const [vehicleFilterCategory, setVehicleFilterCategory] = useState<string>("all")
  const [vehicleFilterBase, setVehicleFilterBase] = useState<string>("all")

  const currentDate = new Date()
  const selectedDate = new Date(currentMonth + "-01")
  const isCurrentMonth = currentMonth === currentDate.toISOString().slice(0, 7)
  const isPastMonth = selectedDate < new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const isFutureMonth = selectedDate > new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [plansRes, recordsRes, inspectionsRes, vehiclesRes, basesRes] = await Promise.all([
        fetch(`/api/operation-plans?month=${currentMonth}`),
        fetch(`/api/operation-records?month=${currentMonth}`),
        fetch(`/api/inspection-plans?month=${currentMonth}`),
        fetch("/api/vehicles"),
        fetch("/api/bases"),
      ])

      const [plansData, recordsData, inspectionsData, vehiclesData, basesData] = await Promise.all([
        plansRes.json(),
        recordsRes.json(),
        inspectionsRes.json(),
        vehiclesRes.json(),
        basesRes.json(),
      ])

      setOperationPlans(plansData)
      setOperationRecords(recordsData)
      setInspectionPlans(inspectionsData)
      setAllVehicles(vehiclesData)
      setAllBases(basesData)

      // 初回ロード時に全車両を選択状態にする（または最初の8両）
      if (selectedVehicleIds.length === 0 && vehiclesData.length > 0) {
        setSelectedVehicleIds(vehiclesData.slice(0, 8).map((v: Vehicle) => v.id))
      }
    } catch (error) {
      console.error("Error fetching data:", error)
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

  // フィルターを適用した計画データを取得
  const getFilteredPlansForDate = (vehicleId: number, date: string) => {
    return operationPlans.filter(
      (p) =>
        p.vehicle_id === vehicleId &&
        p.plan_date === date &&
        (filterShiftType === "all" || p.shift_type === filterShiftType),
    )
  }

  // フィルターを適用した実績データを取得
  const getFilteredRecordsForDate = (vehicleId: number, date: string) => {
    return operationRecords.filter(
      (r) =>
        r.vehicle_id === vehicleId &&
        r.record_date === date &&
        (filterShiftType === "all" || r.shift_type === filterShiftType) &&
        (filterRecordStatus === "all" || r.status === filterRecordStatus),
    )
  }

  // フィルターを適用した検査計画データを取得
  const getFilteredInspectionsForDate = (vehicleId: number, date: string) => {
    return inspectionPlans.filter(
      (i) =>
        i.vehicle_id === vehicleId &&
        date >= i.planned_start_date &&
        date <= i.planned_end_date &&
        (filterInspectionCategory === "all" || i.inspection_category === filterInspectionCategory),
    )
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
        return "bg-gray-100 text-gray-800" // 'その他' の色を追加
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

  // 表示対象の車両をフィルタリング
  const vehiclesToDisplay = useMemo(() => {
    if (selectedVehicleIds.length === 0) {
      return allVehicles.slice(0, 8) // 何も選択されていない場合は最初の8両を表示
    }
    return allVehicles.filter((v) => selectedVehicleIds.includes(v.id))
  }, [allVehicles, selectedVehicleIds])

  // 車両選択モーダルで表示する車両リスト
  const filteredVehiclesForModal = useMemo(() => {
    return allVehicles.filter((vehicle) => {
      const matchesCategory = vehicleFilterCategory === "all" || vehicle.name === vehicleFilterCategory // nameが機種
      const matchesBase = vehicleFilterBase === "all" || vehicle.base_location === vehicleFilterBase
      return matchesCategory && matchesBase
    })
  }, [allVehicles, vehicleFilterCategory, vehicleFilterBase])

  // ユニークな機種と基地のリストを取得
  const uniqueCategories = useMemo(() => {
    const categories = new Set(allVehicles.map((v) => v.name)) // nameが機種
    return ["all", ...Array.from(categories)].sort()
  }, [allVehicles])

  const uniqueBases = useMemo(() => {
    const bases = new Set(allVehicles.map((v) => v.base_location))
    return ["all", ...Array.from(bases)].sort()
  }, [allVehicles])

  if (loading) {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
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
                <Badge className="bg-gray-100 text-gray-800">その他</Badge> {/* その他を追加 */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* フィルターと車両選択 */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="outline" onClick={() => setShowVehicleSelectModal(true)}>
              <Car className="w-4 h-4 mr-2" />
              保守用車検索 ({selectedVehicleIds.length} / {allVehicles.length})
            </Button>
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
                  <SelectItem value="その他">その他</SelectItem> {/* その他を追加 */}
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
                  <th className="border p-2 bg-gray-50 text-left min-w-32">機種 / 機械番号</th> {/* ヘッダー変更 */}
                  {days.map((day) => (
                    <th key={day} className="border p-1 bg-gray-50 text-center min-w-24 text-sm">
                      {day}日
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehiclesToDisplay.length === 0 && (
                  <tr>
                    <td colSpan={days.length + 1} className="text-center py-8 text-gray-500">
                      表示する車両が選択されていません。
                    </td>
                  </tr>
                )}
                {vehiclesToDisplay.map((vehicle) => (
                  <React.Fragment key={vehicle.id}>
                    {/* 運用計画行 */}
                    <tr>
                      <td className="border p-2 font-medium bg-blue-50" rowSpan={3}>
                        <div className="text-sm">
                          <div className="font-semibold">{vehicle.name}</div> {/* 機種を表示 */}
                          <div className="text-gray-500 text-xs">{vehicle.machine_number}</div> {/* 機械番号を表示 */}
                        </div>
                      </td>
                      {days.map((day) => {
                        const dateString = getDateString(day)
                        const plans = getFilteredPlansForDate(vehicle.id, dateString)

                        return (
                          <td key={`plan-${day}`} className="border p-1">
                            <div className="space-y-1">
                              {plans.map((plan) => (
                                <div key={plan.id} className="space-y-1 p-1 bg-blue-100 rounded">
                                  <Badge className={`text-xs ${getShiftBadgeColor(plan.shift_type)}`}>
                                    {plan.shift_type === "day" ? "昼間" : plan.shift_type === "night" ? "夜間" : "昼夜"}
                                  </Badge>
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
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>

                    {/* 運用実績行 */}
                    <tr>
                      {days.map((day) => {
                        const dateString = getDateString(day)
                        const records = getFilteredRecordsForDate(vehicle.id, dateString)

                        return (
                          <td key={`record-${day}`} className="border p-1">
                            <div className="space-y-1">
                              {records.map((record) => (
                                <div key={record.id} className="space-y-1 p-1 bg-green-100 rounded">
                                  <Badge className={`text-xs ${getShiftBadgeColor(record.shift_type)}`}>
                                    {record.shift_type === "day"
                                      ? "昼間"
                                      : record.shift_type === "night"
                                        ? "夜間"
                                        : "昼夜"}
                                  </Badge>
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
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>

                    {/* 検査計画行 */}
                    <tr>
                      {days.map((day) => {
                        const dateString = getDateString(day)
                        const inspections = getFilteredInspectionsForDate(vehicle.id, dateString)

                        return (
                          <td key={`inspection-${day}`} className="border p-1">
                            <div className="space-y-1">
                              {inspections.map((inspection) => (
                                <div key={inspection.id} className="space-y-1 p-1 bg-purple-100 rounded">
                                  <div className="flex items-center space-x-1">
                                    <Wrench className="w-3 h-3 text-purple-600" />
                                    <Badge
                                      className={`text-xs ${getInspectionCategoryColor(inspection.inspection_category)}`}
                                    >
                                      {inspection.inspection_category}
                                    </Badge>
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
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* データが無い場合の表示 */}
      {vehiclesToDisplay.length > 0 &&
        operationPlans.length === 0 &&
        operationRecords.length === 0 &&
        inspectionPlans.length === 0 && (
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

      {/* 車両選択モーダル */}
      <Dialog open={showVehicleSelectModal} onOpenChange={setShowVehicleSelectModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>表示車両の選択 (最大8両)</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="vehicleFilterCategory" className="text-sm">
                機種:
              </Label>
              <Select value={vehicleFilterCategory} onValueChange={setVehicleFilterCategory}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="全て" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "全て" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="vehicleFilterBase" className="text-sm">
                基地:
              </Label>
              <Select value={vehicleFilterBase} onValueChange={setVehicleFilterBase}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="全て" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueBases.map((base) => (
                    <SelectItem key={base} value={base}>
                      {base === "all" ? "全て" : base}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-80 overflow-y-auto">
            {filteredVehiclesForModal.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`vehicle-${vehicle.id}`}
                  checked={selectedVehicleIds.includes(vehicle.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      if (selectedVehicleIds.length < 8) {
                        setSelectedVehicleIds([...selectedVehicleIds, vehicle.id])
                      }
                    } else {
                      setSelectedVehicleIds(selectedVehicleIds.filter((id) => id !== vehicle.id))
                    }
                  }}
                />
                <Label htmlFor={`vehicle-${vehicle.id}`}>
                  {vehicle.name} ({vehicle.machine_number})
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowVehicleSelectModal(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
