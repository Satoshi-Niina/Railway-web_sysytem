"use client"

import React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Wrench, History, CalendarDays, Car, Plus, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { Vehicle, OperationPlan, OperationRecord, InspectionPlan, Base } from "@/types"

export function EnhancedOperationChart() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [operationPlans, setOperationPlans] = useState<OperationPlan[]>([])
  const [operationRecords, setOperationRecords] = useState<OperationRecord[]>([])
  const [inspectionPlans, setInspectionPlans] = useState<InspectionPlan[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bases, setBases] = useState<Base[]>([])
  const [loading, setLoading] = useState(true)

  // モーダル状態
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null)

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
      setVehicles(vehiclesData)
      setBases(basesData)
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

  const handleCellClick = (vehicleId: number, date: string) => {
    setSelectedVehicle(vehicleId)
    setSelectedDate(date)
    setShowPlanModal(true)
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
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "normal":
        return "bg-blue-100 text-blue-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
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
        <h2 className="text-2xl font-bold">運用管理計画チャート</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <Input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={() => setShowPlanModal(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            計画追加
          </Button>
        </div>
      </div>

      {/* 凡例 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">凡例</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium">勤務区分</div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-yellow-100 text-yellow-800">昼勤</Badge>
                <Badge className="bg-blue-100 text-blue-800">夜勤</Badge>
                <Badge className="bg-purple-100 text-purple-800">昼夜</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium">実績状況</div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">完了</Badge>
                <Badge className="bg-yellow-100 text-yellow-800">部分</Badge>
                <Badge className="bg-red-100 text-red-800">中止</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium">検査優先度</div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-red-100 text-red-800">緊急</Badge>
                <Badge className="bg-orange-100 text-orange-800">高</Badge>
                <Badge className="bg-blue-100 text-blue-800">通常</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium">自動取込</div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>自動</span>
                <Clock className="w-4 h-4 text-blue-600" />
                <span>手動</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* メインチャート */}
      <Card>
        <CardHeader>
          <CardTitle>{currentMonth} 運用管理計画チャート</CardTitle>
          <div className="text-sm text-gray-600">セルをクリックして運用計画を追加できます</div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-50 text-left min-w-32">車両</th>
                  <th className="border p-2 bg-gray-50 text-center min-w-20">種別</th>
                  {days.map((day) => (
                    <th key={day} className="border p-1 bg-gray-50 text-center min-w-24 text-sm">
                      {day}日
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <React.Fragment key={vehicle.id}>
                    {/* 運用計画行 */}
                    <tr>
                      <td className="border p-2 font-medium bg-blue-50" rowSpan={3}>
                        <div className="text-sm">
                          <div className="font-semibold">{vehicle.name}</div>
                          <div className="text-gray-500 text-xs">{vehicle.model}</div>
                          <div className="text-gray-500 text-xs">{vehicle.category}</div>
                        </div>
                      </td>
                      <td className="border p-2 text-center bg-blue-50 text-blue-700 font-medium text-sm">運用計画</td>
                      {days.map((day) => {
                        const dateString = getDateString(day)
                        const plans = getPlansForDate(vehicle.id, dateString)

                        return (
                          <td
                            key={`plan-${day}`}
                            className="border p-1 cursor-pointer hover:bg-blue-50 transition-colors"
                            onClick={() => handleCellClick(vehicle.id, dateString)}
                          >
                            <div className="space-y-1">
                              {plans.map((plan) => (
                                <div key={plan.id} className="space-y-1">
                                  <Badge className={`text-xs ${getShiftBadgeColor(plan.shift_type)}`}>
                                    {plan.shift_type === "day" ? "昼" : plan.shift_type === "night" ? "夜" : "昼夜"}
                                  </Badge>
                                  <div className="text-xs text-gray-600">{plan.planned_distance}km</div>
                                  {plan.departure_base && (
                                    <div className="text-xs text-gray-500 flex items-center">
                                      <MapPin className="w-3 h-3 mr-1" />
                                      {plan.departure_base.base_name}
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
                      <td className="border p-2 text-center bg-green-50 text-green-700 font-medium text-sm">
                        運用実績
                      </td>
                      {days.map((day) => {
                        const dateString = getDateString(day)
                        const records = getRecordsForDate(vehicle.id, dateString)

                        return (
                          <td key={`record-${day}`} className="border p-1">
                            <div className="space-y-1">
                              {records.map((record) => (
                                <div key={record.id} className="space-y-1">
                                  <div className="flex items-center space-x-1">
                                    <Badge className={`text-xs ${getShiftBadgeColor(record.shift_type)}`}>
                                      {record.shift_type === "day"
                                        ? "昼"
                                        : record.shift_type === "night"
                                          ? "夜"
                                          : "昼夜"}
                                    </Badge>
                                    {record.auto_imported ? (
                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                    ) : (
                                      <Clock className="w-3 h-3 text-blue-600" />
                                    )}
                                  </div>
                                  <Badge className={`text-xs ${getStatusBadgeColor(record.status)}`}>
                                    {record.status === "completed" ? "完了" : "中止"}
                                  </Badge>
                                  <div className="text-xs text-gray-600">{record.actual_distance}km</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>

                    {/* 検査計画行 */}
                    <tr>
                      <td className="border p-2 text-center bg-purple-50 text-purple-700 font-medium text-sm">
                        検査計画
                      </td>
                      {days.map((day) => {
                        const dateString = getDateString(day)
                        const inspections = getInspectionsForDate(vehicle.id, dateString)

                        return (
                          <td key={`inspection-${day}`} className="border p-1">
                            <div className="space-y-1">
                              {inspections.map((inspection) => (
                                <div key={inspection.id} className="space-y-1">
                                  <div className="flex items-center space-x-1">
                                    <Wrench className="w-3 h-3 text-purple-600" />
                                    <Badge className="text-xs bg-blue-100 text-blue-800">
                                      {inspection.inspection_category}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-gray-600">{inspection.inspection_type}</div>
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

      {/* 運用計画追加モーダル */}
      <OperationPlanModal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        vehicles={vehicles}
        bases={bases}
        selectedDate={selectedDate}
        selectedVehicle={selectedVehicle}
        onSubmit={(plan) => {
          setOperationPlans([...operationPlans, plan])
          setShowPlanModal(false)
        }}
      />
    </div>
  )
}

// 運用計画追加モーダルコンポーネント
function OperationPlanModal({
  open,
  onClose,
  vehicles,
  bases,
  selectedDate,
  selectedVehicle,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  vehicles: Vehicle[]
  bases: Base[]
  selectedDate: string
  selectedVehicle: number | null
  onSubmit: (plan: OperationPlan) => void
}) {
  const [formData, setFormData] = useState({
    vehicle_id: selectedVehicle?.toString() || "",
    plan_date: selectedDate || "",
    shift_type: "day",
    start_time: "",
    end_time: "",
    planned_distance: "",
    departure_base_id: "",
    arrival_base_id: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedVehicle) {
      setFormData((prev) => ({ ...prev, vehicle_id: selectedVehicle.toString() }))
    }
    if (selectedDate) {
      setFormData((prev) => ({ ...prev, plan_date: selectedDate }))
    }
  }, [selectedVehicle, selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/operation-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: Number.parseInt(formData.vehicle_id),
          plan_date: formData.plan_date,
          shift_type: formData.shift_type,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          planned_distance: Number.parseFloat(formData.planned_distance),
          departure_base_id: formData.departure_base_id ? Number.parseInt(formData.departure_base_id) : null,
          arrival_base_id: formData.arrival_base_id ? Number.parseInt(formData.arrival_base_id) : null,
          notes: formData.notes || null,
        }),
      })

      if (response.ok) {
        const newPlan = await response.json()
        onSubmit(newPlan)
        setFormData({
          vehicle_id: "",
          plan_date: "",
          shift_type: "day",
          start_time: "",
          end_time: "",
          planned_distance: "",
          departure_base_id: "",
          arrival_base_id: "",
          notes: "",
        })
      }
    } catch (error) {
      console.error("Error creating operation plan:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>運用計画追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>車両</Label>
              <Select
                value={formData.vehicle_id}
                onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="車両を選択" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.name} ({vehicle.model})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>計画日</Label>
              <Input
                type="date"
                value={formData.plan_date}
                onChange={(e) => setFormData({ ...formData, plan_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>勤務区分</Label>
              <Select
                value={formData.shift_type}
                onValueChange={(value) => setFormData({ ...formData, shift_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">昼勤</SelectItem>
                  <SelectItem value="night">夜勤</SelectItem>
                  <SelectItem value="day_night">昼夜勤</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>開始時刻</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label>終了時刻</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>計画距離 (km)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.planned_distance}
                onChange={(e) => setFormData({ ...formData, planned_distance: e.target.value })}
                placeholder="25.5"
                required
              />
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
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="作業内容や特記事項を入力してください"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "追加中..." : "追加"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
