"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, TrendingUp, TrendingDown } from "lucide-react"
import type { TravelPlan, TravelRecord, Vehicle } from "@/types"

export function TravelChart() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [plans, setPlans] = useState<TravelPlan[]>([])
  const [records, setRecords] = useState<TravelRecord[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [plansRes, recordsRes, vehiclesRes] = await Promise.all([
        fetch(`/api/travel-plans?month=${currentMonth}`),
        fetch(`/api/travel-records?month=${currentMonth}`),
        fetch("/api/vehicles"),
      ])

      const [plansData, recordsData, vehiclesData] = await Promise.all([
        plansRes.json(),
        recordsRes.json(),
        vehiclesRes.json(),
      ])

      setPlans(plansData)
      setRecords(recordsData)
      setVehicles(vehiclesData)
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

  const getPlanForDate = (vehicleId: number, date: string) => {
    return plans.find((p) => p.vehicle_id === vehicleId && p.plan_date === date)
  }

  const getRecordForDate = (vehicleId: number, date: string) => {
    return records.find((r) => r.vehicle_id === vehicleId && r.record_date === date)
  }

  // 月間統計の計算
  const getMonthlyStats = (vehicleId: number) => {
    const vehiclePlans = plans.filter((p) => p.vehicle_id === vehicleId)
    const vehicleRecords = records.filter((r) => r.vehicle_id === vehicleId)

    const totalPlanned = vehiclePlans.reduce((sum, p) => sum + p.planned_distance, 0)
    const totalActual = vehicleRecords.reduce((sum, r) => sum + r.actual_distance, 0)

    return { totalPlanned, totalActual, achievement: totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0 }
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  if (loading) {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">走行計画・実績管理</h2>
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
          <Button onClick={() => setShowPlanForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            計画追加
          </Button>
          <Button onClick={() => setShowRecordForm(true)} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            実績追加
          </Button>
        </div>
      </div>

      {showPlanForm && (
        <TravelPlanForm
          vehicles={vehicles}
          onSubmit={(plan) => {
            setPlans([...plans, plan])
            setShowPlanForm(false)
          }}
          onCancel={() => setShowPlanForm(false)}
        />
      )}

      {showRecordForm && (
        <TravelRecordForm
          vehicles={vehicles}
          onSubmit={(record) => {
            setRecords([...records, record])
            setShowRecordForm(false)
          }}
          onCancel={() => setShowRecordForm(false)}
        />
      )}

      {/* 月間統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vehicles.slice(0, 3).map((vehicle) => {
          const stats = getMonthlyStats(vehicle.id)
          return (
            <Card key={vehicle.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{vehicle.name}</p>
                    <p className="text-xs text-gray-500">{vehicle.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{stats.achievement.toFixed(1)}%</p>
                    <div className="flex items-center text-xs">
                      {stats.achievement >= 100 ? (
                        <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                      )}
                      <span>
                        {stats.totalActual.toFixed(1)}/{stats.totalPlanned.toFixed(1)}km
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentMonth} 走行計画・実績チャート</CardTitle>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
              <span>計画</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
              <span>実績</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-50 text-left min-w-32">車両</th>
                  <th className="border p-2 bg-gray-50 text-center min-w-16">種別</th>
                  {days.map((day) => (
                    <th key={day} className="border p-1 bg-gray-50 text-center min-w-20 text-sm">
                      {day}日
                    </th>
                  ))}
                  <th className="border p-2 bg-gray-50 text-center min-w-24">月計</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => {
                  const stats = getMonthlyStats(vehicle.id)
                  return (
                    <React.Fragment key={vehicle.id}>
                      {/* 計画行 */}
                      <tr className="bg-blue-25">
                        <td className="border p-2 font-medium bg-blue-50" rowSpan={2}>
                          <div className="text-sm">
                            <div className="font-semibold">{vehicle.name}</div>
                            <div className="text-gray-500 text-xs">{vehicle.name}</div>
                            <div className="text-gray-500 text-xs">{vehicle.base_location}</div>
                          </div>
                        </td>
                        <td className="border p-2 text-center bg-blue-50 text-blue-700 font-medium text-sm">計画</td>
                        {days.map((day) => {
                          const dateString = getDateString(day)
                          const plan = getPlanForDate(vehicle.id, dateString)
                          return (
                            <td key={`plan-${day}`} className="border p-1">
                              {plan && (
                                <div className="bg-blue-100 text-blue-800 text-xs p-1 rounded text-center font-medium">
                                  {plan.planned_distance}km
                                </div>
                              )}
                            </td>
                          )
                        })}
                        <td className="border p-2 text-center bg-blue-50">
                          <div className="text-sm font-semibold text-blue-700">{stats.totalPlanned.toFixed(1)}km</div>
                        </td>
                      </tr>

                      {/* 実績行 */}
                      <tr className="bg-green-25">
                        <td className="border p-2 text-center bg-green-50 text-green-700 font-medium text-sm">実績</td>
                        {days.map((day) => {
                          const dateString = getDateString(day)
                          const record = getRecordForDate(vehicle.id, dateString)
                          const plan = getPlanForDate(vehicle.id, dateString)

                          return (
                            <td key={`record-${day}`} className="border p-1">
                              {record && (
                                <div
                                  className={`text-xs p-1 rounded text-center font-medium ${
                                    plan && record.actual_distance >= plan.planned_distance
                                      ? "bg-green-100 text-green-800"
                                      : plan && record.actual_distance < plan.planned_distance
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {record.actual_distance}km
                                  {plan && (
                                    <div className="text-xs opacity-75">
                                      ({((record.actual_distance / plan.planned_distance) * 100).toFixed(0)}%)
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          )
                        })}
                        <td className="border p-2 text-center bg-green-50">
                          <div className="text-sm font-semibold text-green-700">{stats.totalActual.toFixed(1)}km</div>
                          <div className="text-xs text-gray-600">({stats.achievement.toFixed(1)}%)</div>
                        </td>
                      </tr>
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// TravelPlanFormとTravelRecordFormは既存のまま維持
function TravelPlanForm({
  vehicles,
  onSubmit,
  onCancel,
}: {
  vehicles: Vehicle[]
  onSubmit: (plan: TravelPlan) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    vehicle_id: "",
    plan_date: "",
    planned_distance: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/travel-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: Number.parseInt(formData.vehicle_id),
          plan_date: formData.plan_date,
          planned_distance: Number.parseFloat(formData.planned_distance),
        }),
      })

      if (response.ok) {
        const newPlan = await response.json()
        onSubmit(newPlan)
      }
    } catch (error) {
      console.error("Error creating plan:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>走行計画追加</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      {vehicle.name}
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
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "追加中..." : "追加"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function TravelRecordForm({
  vehicles,
  onSubmit,
  onCancel,
}: {
  vehicles: Vehicle[]
  onSubmit: (record: TravelRecord) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    vehicle_id: "",
    record_date: "",
    actual_distance: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/travel-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: Number.parseInt(formData.vehicle_id),
          record_date: formData.record_date,
          actual_distance: Number.parseFloat(formData.actual_distance),
        }),
      })

      if (response.ok) {
        const newRecord = await response.json()
        onSubmit(newRecord)
      }
    } catch (error) {
      console.error("Error creating record:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>走行実績追加</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      {vehicle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>実績日</Label>
              <Input
                type="date"
                value={formData.record_date}
                onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>実績距離 (km)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.actual_distance}
                onChange={(e) => setFormData({ ...formData, actual_distance: e.target.value })}
                placeholder="24.8"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "追加中..." : "追加"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
