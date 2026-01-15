"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Clock, Calendar, AlertCircle, Edit, Save, X } from "lucide-react"
import type { Vehicle } from "@/types"
import { apiCall, isDatabaseConfigured } from "@/lib/api-client"

interface MaintenanceCycle {
  id: number
  vehicle_type: string
  cycle_type: string
  cycle_days: number
  cycle_distance?: number
  maintenance_duration: number
  advance_notice_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}

const INSPECTION_TYPES = [
  { value: "定期点検", label: "定期点検", color: "bg-green-100 text-green-800" },
  { value: "乙A検査", label: "乙A検査", color: "bg-blue-100 text-blue-800" },
  { value: "乙B検査", label: "乙B検査", color: "bg-blue-100 text-blue-800" },
  { value: "甲A検査", label: "甲A検査", color: "bg-orange-100 text-orange-800" },
  { value: "甲B検査", label: "甲B検査", color: "bg-orange-100 text-orange-800" },
]

export function MaintenanceCycleManager() {
  const [cycles, setCycles] = useState<MaintenanceCycle[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingVehicleType, setEditingVehicleType] = useState<string | null>(null)
  const [editingCycles, setEditingCycles] = useState<Record<string, Partial<MaintenanceCycle>>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setError(null)
      const [cyclesData, vehiclesData] = await Promise.all([
        apiCall<MaintenanceCycle[]>("maintenance-cycles"),
        apiCall<Vehicle[]>("vehicles"),
      ])

      setCycles(cyclesData)
      setVehicles(vehiclesData)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("データの取得に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  // 機種別にグループ化
  const uniqueVehicleTypes = Array.from(new Set(vehicles.map((v) => v.name))).sort()

  // 機種別の検修周期を取得
  const getCyclesForVehicleType = (vehicleType: string) => {
    const vehicleCycles = cycles.filter((c) => c.vehicle_type === vehicleType)
    const cycleMap: Record<string, MaintenanceCycle> = {}

    vehicleCycles.forEach((cycle) => {
      cycleMap[cycle.cycle_type] = cycle
    })

    return INSPECTION_TYPES.map((inspectionType) => ({
      ...inspectionType,
      cycle: cycleMap[inspectionType.value] || null,
    }))
  }

  const startEditing = (vehicleType: string) => {
    setEditingVehicleType(vehicleType)
    const vehicleCycles = getCyclesForVehicleType(vehicleType)
    const editData: Record<string, Partial<MaintenanceCycle>> = {}

    INSPECTION_TYPES.forEach((inspectionType) => {
      const existingCycle = vehicleCycles.find((vc) => vc.value === inspectionType.value)?.cycle
      editData[inspectionType.value] = {
        vehicle_type: vehicleType,
        cycle_type: inspectionType.value,
        cycle_days: existingCycle?.cycle_days || 30,
        cycle_distance: existingCycle?.cycle_distance || 1000,
        maintenance_duration: existingCycle?.maintenance_duration || 1,
        advance_notice_days: existingCycle?.advance_notice_days || 7,
      }
    })

    setEditingCycles(editData)
  }

  const cancelEditing = () => {
    setEditingVehicleType(null)
    setEditingCycles({})
  }

  const saveChanges = async () => {
    if (!editingVehicleType) return

    try {
      for (const inspectionType of INSPECTION_TYPES) {
        const cycleData = editingCycles[inspectionType.value]
        if (!cycleData) continue

        if (isDatabaseConfigured()) {
          const existingCycle = cycles.find(
            (c) => c.vehicle_type === editingVehicleType && c.cycle_type === inspectionType.value,
          )

          if (existingCycle) {
            // 更新処理（実装が必要）
            console.log("Update cycle:", cycleData)
          } else {
            // 新規作成
            const newCycle = await apiCall<MaintenanceCycle>("maintenance-cycles", {
              method: "POST",
              body: JSON.stringify(cycleData),
            })

            setCycles((prev) => [...prev, newCycle])
          }
        } else {
          // モックデータ更新
          const mockCycle: MaintenanceCycle = {
            id: Date.now() + Math.random(),
            vehicle_type: editingVehicleType,
            cycle_type: inspectionType.value,
            cycle_days: cycleData.cycle_days || 30,
            cycle_distance: cycleData.cycle_distance,
            maintenance_duration: cycleData.maintenance_duration || 1,
            advance_notice_days: cycleData.advance_notice_days || 7,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          setCycles((prev) => {
            const filtered = prev.filter(
              (c) => !(c.vehicle_type === editingVehicleType && c.cycle_type === inspectionType.value),
            )
            return [...filtered, mockCycle]
          })
        }
      }

      setEditingVehicleType(null)
      setEditingCycles({})
    } catch (error) {
      console.error("Error saving cycles:", error)
      setError("検修周期の保存に失敗しました。")
    }
  }

  const updateEditingCycle = (inspectionType: string, field: string, value: any) => {
    setEditingCycles((prev) => ({
      ...prev,
      [inspectionType]: {
        ...prev[inspectionType],
        [field]: value,
      },
    }))
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
        <h2 className="text-2xl font-bold">検修周期マスタ</h2>
        <div className="text-sm text-gray-600">機種ごとに検修項目の周期を設定できます</div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {uniqueVehicleTypes.map((vehicleType) => {
          const vehicleCycles = getCyclesForVehicleType(vehicleType)
          const isEditing = editingVehicleType === vehicleType

          return (
            <Card key={vehicleType}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <span>{vehicleType} 検修周期</span>
                  </CardTitle>
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <Button size="sm" onClick={saveChanges} disabled={!isDatabaseConfigured()}>
                          <Save className="w-4 h-4 mr-2" />
                          保存
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          <X className="w-4 h-4 mr-2" />
                          キャンセル
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => startEditing(vehicleType)}>
                        <Edit className="w-4 h-4 mr-2" />
                        編集
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehicleCycles.map((item) => (
                    <div key={item.value} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={item.color}>{item.label}</Badge>
                        {item.cycle && (
                          <Badge variant="outline" className="text-xs">
                            {item.cycle.maintenance_duration}日間
                          </Badge>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-xs">周期 (日数)</Label>
                            <Input
                              type="number"
                              value={editingCycles[item.value]?.cycle_days || ""}
                              onChange={(e) =>
                                updateEditingCycle(item.value, "cycle_days", Number.parseInt(e.target.value))
                              }
                              placeholder="30"
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">走行距離 (km)</Label>
                            <Input
                              type="number"
                              value={editingCycles[item.value]?.cycle_distance || ""}
                              onChange={(e) =>
                                updateEditingCycle(item.value, "cycle_distance", Number.parseFloat(e.target.value))
                              }
                              placeholder="1000"
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">所要日数</Label>
                            <Input
                              type="number"
                              value={editingCycles[item.value]?.maintenance_duration || ""}
                              onChange={(e) =>
                                updateEditingCycle(item.value, "maintenance_duration", Number.parseInt(e.target.value))
                              }
                              placeholder="1"
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">事前通知 (日)</Label>
                            <Input
                              type="number"
                              value={editingCycles[item.value]?.advance_notice_days || ""}
                              onChange={(e) =>
                                updateEditingCycle(item.value, "advance_notice_days", Number.parseInt(e.target.value))
                              }
                              placeholder="7"
                              className="h-8"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>周期: {item.cycle?.cycle_days || "未設定"}日</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">距離:</span>
                            <span>{item.cycle?.cycle_distance?.toLocaleString() || "未設定"}km</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">所要:</span>
                            <span>{item.cycle?.maintenance_duration || "未設定"}日間</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>通知: {item.cycle?.advance_notice_days || "未設定"}日前</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {uniqueVehicleTypes.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">車両データがありません。まず車両を登録してください。</div>
      )}
    </div>
  )
}
