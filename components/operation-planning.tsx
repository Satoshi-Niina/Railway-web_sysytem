"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, ChevronLeft, ChevronRight, Car, AlertCircle, Building, Filter, Copy } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { Vehicle, OperationPlan, Base, Office } from "@/types"
import { apiCall, isDatabaseConfigured } from "@/lib/api-client"

// 固定の機種表示順
const VEHICLE_TYPE_ORDER = ["モータカー", "MCR", "鉄トロ（10t）", "鉄トロ（15t）", "箱トロ"]

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 計画編集モーダル
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<OperationPlan | null>(null)
  const [planForm, setPlanForm] = useState({
    vehicle_id: "",
    plan_date: "",
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
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("all")

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
      const [plansData, vehiclesData, basesData, officesData] = await Promise.all([
        apiCall<OperationPlan[]>(`/api/operation-plans?month=${currentMonth}`),
        apiCall<Vehicle[]>("/api/vehicles"),
        apiCall<Base[]>("/api/bases"),
        apiCall<Office[]>("/api/offices"),
      ])

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
      const selectedOffice = allOffices.find((office) => office.id === Number.parseInt(selectedOfficeId))
      if (selectedOffice) {
        const officeBases = allBases
          .filter((base) => base.office_id === selectedOffice.id)
          .map((base) => base.base_name)

        vehicles = vehicles.filter((vehicle) => officeBases.includes(vehicle.base_location))
      }
    }

    // 機種でフィルタリング
    if (selectedVehicleType !== "all") {
      vehicles = vehicles.filter((vehicle) => vehicle.name === selectedVehicleType)
    }

    return vehicles
  }, [allVehicles, allBases, allOffices, selectedOfficeId, selectedVehicleType])

  // 事業所でフィルタリングされた機種リストを取得（固定順序）
  const availableVehicleTypes = useMemo(() => {
    let vehicles = allVehicles

    if (selectedOfficeId !== "all") {
      const selectedOffice = allOffices.find((office) => office.id === Number.parseInt(selectedOfficeId))
      if (selectedOffice) {
        const officeBases = allBases
          .filter((base) => base.office_id === selectedOffice.id)
          .map((base) => base.base_name)

        vehicles = vehicles.filter((vehicle) => officeBases.includes(vehicle.base_location))
      }
    }

    const availableTypes = new Set(vehicles.map((v) => v.name))
    return VEHICLE_TYPE_ORDER.filter((type) => availableTypes.has(type))
  }, [allVehicles, allBases, allOffices, selectedOfficeId])

  // 事業所でフィルタリングされた基地リストを取得
  const availableBases = useMemo(() => {
    if (selectedOfficeId === "all") {
      return allBases
    }

    const selectedOffice = allOffices.find((office) => office.id === Number.parseInt(selectedOfficeId))
    if (selectedOffice) {
      return allBases.filter((base) => base.office_id === selectedOffice.id)
    }

    return allBases
  }, [allBases, allOffices, selectedOfficeId])

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

  // 特定の車両と日付の運用計画を取得
  const getPlanForVehicleAndDate = (vehicleId: number, date: string) => {
    return operationPlans.find((p) => p.vehicle_id === vehicleId && p.plan_date === date)
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
        return "bg-blue-100 text-blue-800"
      case "day_night":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // セルクリック時の処理（新規計画作成）
  const handleCellClick = (vehicleId: number, date: string) => {
    const existingPlan = getPlanForVehicleAndDate(vehicleId, date)
    
    if (existingPlan) {
      // 既存計画の編集
      setEditingPlan(existingPlan)
      setPlanForm({
        vehicle_id: existingPlan.vehicle_id.toString(),
        plan_date: existingPlan.plan_date,
        shift_type: existingPlan.shift_type,
        start_time: existingPlan.start_time || "08:00",
        end_time: existingPlan.end_time || "17:00",
        planned_distance: existingPlan.planned_distance || 0,
        departure_base_id: existingPlan.departure_base_id?.toString() || "",
        arrival_base_id: existingPlan.arrival_base_id?.toString() || "",
        notes: existingPlan.notes || "",
      })
    } else {
      // 新規計画作成
      setEditingPlan(null)
      setPlanForm({
        vehicle_id: vehicleId.toString(),
        plan_date: date,
        shift_type: "day",
        start_time: "08:00",
        end_time: "17:00",
        planned_distance: 0,
        departure_base_id: "",
        arrival_base_id: "",
        notes: "",
      })
    }
    
    setShowPlanModal(true)
  }

  // 計画の保存
  const handleSavePlan = async () => {
    try {
      const planData = {
        vehicle_id: Number.parseInt(planForm.vehicle_id),
        plan_date: planForm.plan_date,
        shift_type: planForm.shift_type,
        start_time: planForm.start_time,
        end_time: planForm.end_time,
        planned_distance: planForm.planned_distance,
        departure_base_id: planForm.departure_base_id ? Number.parseInt(planForm.departure_base_id) : null,
        arrival_base_id: planForm.arrival_base_id ? Number.parseInt(planForm.arrival_base_id) : null,
        notes: planForm.notes,
      }

      if (editingPlan) {
        // 更新
        await apiCall(`/api/operation-plans/${editingPlan.id}`, {
          method: "PUT",
          body: JSON.stringify(planData),
        })
      } else {
        // 新規作成
        await apiCall("/api/operation-plans", {
          method: "POST",
          body: JSON.stringify(planData),
        })
      }

      fetchData()
      setShowPlanModal(false)
      setEditingPlan(null)
    } catch (error) {
      console.error("Error saving plan:", error)
      setError("計画の保存に失敗しました。")
    }
  }

  // 計画の削除
  const handleDeletePlan = async () => {
    if (!editingPlan) return

    try {
      await apiCall(`/api/operation-plans/${editingPlan.id}`, {
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
        const newPlan = {
          vehicle_id: plan.vehicle_id,
          plan_date: plan.plan_date.replace(prevMonthString, currentMonth),
          shift_type: plan.shift_type,
          start_time: plan.start_time,
          end_time: plan.end_time,
          planned_distance: plan.planned_distance,
          departure_base_id: plan.departure_base_id,
          arrival_base_id: plan.arrival_base_id,
          notes: plan.notes,
        }

        return apiCall("/api/operation-plans", {
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
    setSelectedVehicleType("all")
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {office.region && <span className="text-gray-500">({office.region})</span>}
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
                  {availableVehicleTypes.map((type) => (
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
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-gray-600">
              {selectedOfficeId !== "all" || selectedVehicleType !== "all" ? (
                <div className="flex items-center space-x-2">
                  <span>フィルター適用中:</span>
                  {selectedOfficeId !== "all" && (
                    <Badge variant="secondary">
                      {allOffices.find((o) => o.id === Number.parseInt(selectedOfficeId))?.office_name}
                    </Badge>
                  )}
                  {selectedVehicleType !== "all" && <Badge variant="secondary">{selectedVehicleType}</Badge>}
                </div>
              ) : (
                <span>全てのデータを表示中</span>
              )}
            </div>
            {(selectedOfficeId !== "all" || selectedVehicleType !== "all") && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                フィルターをリセット
              </Button>
            )}
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
                    <th key={day} className="border p-1 bg-gray-50 text-center min-w-20">
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
                        const plan = getPlanForVehicleAndDate(vehicle.id, dateString)
                        const isWeekend = new Date(dateString).getDay() === 0 || new Date(dateString).getDay() === 6

                        return (
                          <td
                            key={day}
                            className={`border p-2 cursor-pointer transition-colors ${
                              plan
                                ? "bg-blue-100 hover:bg-blue-200"
                                : "bg-gray-50 hover:bg-gray-100"
                            } ${isWeekend ? "bg-red-50" : ""}`}
                            onClick={() => !isPastMonth && handleCellClick(vehicle.id, dateString)}
                          >
                            {plan ? (
                              <div className="space-y-1">
                                <Badge className={`text-xs ${getShiftBadgeColor(plan.shift_type)}`}>
                                  {plan.shift_type === "day" ? "昼間" : plan.shift_type === "night" ? "夜間" : "昼夜"}
                                </Badge>
                                <div className="text-xs text-gray-600">
                                  {plan.start_time} - {plan.end_time}
                                </div>
                                {plan.departure_base_id && plan.arrival_base_id && (
                                  <div className="text-xs text-gray-500">
                                    {allBases.find((b) => b.id === plan.departure_base_id)?.base_name} → {allBases.find((b) => b.id === plan.arrival_base_id)?.base_name}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs">未計画</div>
                            )}
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
    </div>
  )
}
