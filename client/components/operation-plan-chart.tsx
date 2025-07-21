"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Calendar, MapPin, Car } from "lucide-react"
import type { TravelPlan, Vehicle, Base } from "@/types"
import { Badge } from "@/components/ui/badge"

export function OperationPlanChart() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [plans, setPlans] = useState<TravelPlan[]>([])
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [allBases, setAllBases] = useState<Base[]>([])
  const [loading, setLoading] = useState(true)
  const [showPlanForm, setShowPlanForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [plansRes, vehiclesRes, basesRes] = await Promise.all([
        fetch(`/api/travel-plans?month=${currentMonth}`),
        fetch("/api/vehicles"),
        fetch("/api/bases"),
      ])

      const [plansData, vehiclesData, basesData] = await Promise.all([
        plansRes.json(),
        vehiclesRes.json(),
        basesRes.json(),
      ])

      setPlans(plansData)
      setAllVehicles(vehiclesData)
      setAllBases(basesData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlanAdded = (newPlans: TravelPlan[]) => {
    setPlans([...plans, ...newPlans])
    setShowPlanForm(false)
  }

  const getDaysInMonth = (dateString: string) => {
    const [year, month] = dateString.split("-").map(Number)
    return new Date(year, month, 0).getDate()
  }

  const getDateString = (day: number) => {
    return `${currentMonth}-${day.toString().padStart(2, "0")}`
  }

  const getPlansForDate = (vehicleId: number, date: string) => {
    return plans.filter((p) => p.vehicle_id === vehicleId && p.plan_date === date)
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  if (loading) {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">運用計画管理</h2>
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
        </div>
      </div>

      {showPlanForm && (
        <OperationPlanForm
          vehicles={allVehicles}
          bases={allBases}
          onSubmit={handlePlanAdded}
          onCancel={() => setShowPlanForm(false)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{currentMonth} 運用計画チャート</CardTitle>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
              <span>計画</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-50 text-left min-w-32">機種 / 機械番号</th> {/* ヘッダー変更 */}
                  <th className="border p-2 bg-gray-50 text-center min-w-20">詳細</th>
                  {days.map((day) => (
                    <th key={day} className="border p-1 bg-gray-50 text-center min-w-24 text-sm">
                      {day}日
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allVehicles.map((vehicle) => {
                  return (
                    <tr key={vehicle.id} className="bg-blue-25">
                      <td className="border p-2 font-medium bg-blue-50">
                        <div className="text-sm">
                          <div className="font-semibold">{vehicle.name}</div> {/* 機種を表示 */}
                          <div className="text-gray-500 text-xs">{vehicle.machine_number}</div> {/* 機械番号を表示 */}
                        </div>
                      </td>
                      <td className="border p-2 text-center bg-blue-50 text-blue-700 font-medium text-sm">計画</td>
                      {days.map((day) => {
                        const dateString = getDateString(day)
                        const dailyPlans = getPlansForDate(vehicle.id, dateString)
                        return (
                          <td key={`plan-${day}`} className="border p-1">
                            <div className="space-y-1">
                              {dailyPlans.map((plan) => (
                                <div
                                  key={plan.id}
                                  className="bg-blue-100 text-blue-800 text-xs p-1 rounded font-medium"
                                >
                                  {plan.planned_distance}km
                                  {(plan.departure_base || plan.arrival_base) && (
                                    <div className="text-xs text-gray-700 flex items-center mt-1">
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
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {plans.length === 0 && (
        <div className="text-center py-12 text-gray-500">運用計画がありません。新しい計画を追加してください。</div>
      )}
    </div>
  )
}

interface OperationPlanFormProps {
  vehicles: Vehicle[]
  bases: Base[]
  onSubmit: (plans: TravelPlan[]) => void
  onCancel: () => void
}

function OperationPlanForm({ vehicles, bases, onSubmit, onCancel }: OperationPlanFormProps) {
  const [formData, setFormData] = useState({
    plan_date: "",
    planned_distance: "",
    departure_base_id: "",
    arrival_base_id: "",
  })
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [showVehicleSelectModal, setShowVehicleSelectModal] = useState(false) // モーダルの状態

  // 車両選択モーダル内のフィルター
  const [vehicleFilterCategory, setVehicleFilterCategory] = useState<string>("all")
  const [vehicleFilterBase, setVehicleFilterBase] = useState<string>("all")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (selectedVehicleIds.length === 0) {
      alert("車両を1つ以上選択してください。")
      setLoading(false)
      return
    }

    const newPlans: TravelPlan[] = []
    for (const vehicleId of selectedVehicleIds) {
      try {
        const response = await fetch("/api/travel-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicle_id: vehicleId,
            plan_date: formData.plan_date,
            planned_distance: Number.parseFloat(formData.planned_distance),
            departure_base_id: formData.departure_base_id ? Number.parseInt(formData.departure_base_id) : null,
            arrival_base_id: formData.arrival_base_id ? Number.parseInt(formData.arrival_base_id) : null,
          }),
        })

        if (response.ok) {
          const newPlan = await response.json()
          newPlans.push(newPlan)
        } else {
          console.error(`Failed to create plan for vehicle ${vehicleId}`)
        }
      } catch (error) {
        console.error(`Error creating plan for vehicle ${vehicleId}:`, error)
      }
    }

    setLoading(false)
    if (newPlans.length > 0) {
      onSubmit(newPlans)
    } else {
      alert("計画の追加に失敗しました。")
    }
  }

  // 車両選択モーダルで表示する車両リスト
  const filteredVehiclesForModal = useMemo(() => {
    return vehicles.filter((vehicle) => {
      // vehicle.name が機種、vehicle.base_location が基地
      const matchesCategory = vehicleFilterCategory === "all" || vehicle.name === vehicleFilterCategory
      const matchesBase = vehicleFilterBase === "all" || vehicle.base_location === vehicleFilterBase
      return matchesCategory && matchesBase
    })
  }, [vehicles, vehicleFilterCategory, vehicleFilterBase])

  // ユニークな機種と基地のリストを取得
  const uniqueCategories = useMemo(() => {
    const categories = new Set(vehicles.map((v) => v.name)) // nameが機種になった
    return ["all", ...Array.from(categories)].sort()
  }, [vehicles])

  const uniqueBases = useMemo(() => {
    const bases = new Set(vehicles.map((v) => v.base_location))
    return ["all", ...Array.from(bases)].sort()
  }, [vehicles])

  return (
    <Card>
      <CardHeader>
        <CardTitle>運用計画追加</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label>帰着基地</Label>
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
            <Label>機械の種類 (最大8機種)</Label>
            <div className="flex flex-wrap items-center gap-2 border rounded-md p-2 min-h-[40px]">
              {selectedVehicleIds.length === 0 ? (
                <span className="text-gray-500 text-sm">車両を選択してください</span>
              ) : (
                selectedVehicleIds.map((id) => {
                  const vehicle = vehicles.find((v) => v.id === id)
                  return (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                      {vehicle?.name} ({vehicle?.machine_number}) {/* 機種と機械番号を表示 */}
                      <button
                        type="button"
                        onClick={() => setSelectedVehicleIds(selectedVehicleIds.filter((vid) => vid !== id))}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        &times;
                      </button>
                    </Badge>
                  )
                })
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setVehicleFilterCategory("all")
                  setVehicleFilterBase("all")
                  setShowVehicleSelectModal(true)
                }}
                className="ml-auto"
              >
                <Car className="w-4 h-4 mr-2" />
                選択
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading || selectedVehicleIds.length === 0}>
              {loading ? "追加中..." : "追加"}
            </Button>
          </div>
        </form>

        {/* 車両選択モーダル */}
        <Dialog open={showVehicleSelectModal} onOpenChange={setShowVehicleSelectModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>機械の種類を選択 (最大8機種)</DialogTitle>
            </DialogHeader>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="vehicleFilterCategory" className="text-sm">
                  機種: {/* ラベル変更 */}
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
                    id={`modal-vehicle-${vehicle.id}`}
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
                  <Label htmlFor={`modal-vehicle-${vehicle.id}`}>
                    {vehicle.name} ({vehicle.machine_number}) {/* 機種と機械番号を表示 */}
                  </Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowVehicleSelectModal(false)}>選択完了</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
