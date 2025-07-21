"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Save, X } from "lucide-react"

// 静的生成を無効化
export const dynamic = 'force-dynamic'

interface MaintenanceCycle {
  id: string
  vehicleType: string
  inspectionType: string
  cycleDays: number
  cycleDistance: number
  requiredDays: number
  notificationDays: number
}

export default function MaintenanceCyclesPage() {
  const [cycles, setCycles] = useState<MaintenanceCycle[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<MaintenanceCycle>>({})

  useEffect(() => {
    // モックデータの読み込み
    const mockCycles: MaintenanceCycle[] = [
      {
        id: "1",
        vehicleType: "モータカー",
        inspectionType: "定期点検",
        cycleDays: 30,
        cycleDistance: 1000,
        requiredDays: 1,
        notificationDays: 7,
      },
      {
        id: "2",
        vehicleType: "モータカー",
        inspectionType: "乙A検査",
        cycleDays: 90,
        cycleDistance: 3000,
        requiredDays: 2,
        notificationDays: 14,
      },
      {
        id: "3",
        vehicleType: "モータカー",
        inspectionType: "乙B検査",
        cycleDays: 180,
        cycleDistance: 6000,
        requiredDays: 3,
        notificationDays: 21,
      },
      {
        id: "4",
        vehicleType: "モータカー",
        inspectionType: "甲A検査",
        cycleDays: 365,
        cycleDistance: 12000,
        requiredDays: 5,
        notificationDays: 30,
      },
      {
        id: "5",
        vehicleType: "モータカー",
        inspectionType: "甲B検査",
        cycleDays: 730,
        cycleDistance: 24000,
        requiredDays: 7,
        notificationDays: 45,
      },
      {
        id: "6",
        vehicleType: "鉄トロ",
        inspectionType: "定期点検",
        cycleDays: 45,
        cycleDistance: 800,
        requiredDays: 1,
        notificationDays: 7,
      },
      {
        id: "7",
        vehicleType: "鉄トロ",
        inspectionType: "乙A検査",
        cycleDays: 120,
        cycleDistance: 2500,
        requiredDays: 2,
        notificationDays: 14,
      },
      {
        id: "8",
        vehicleType: "ホッパー",
        inspectionType: "定期点検",
        cycleDays: 60,
        cycleDistance: 500,
        requiredDays: 1,
        notificationDays: 7,
      },
    ]
    setCycles(mockCycles)
  }, [])

  const handleEdit = (cycle: MaintenanceCycle) => {
    setEditingId(cycle.id)
    setEditData(cycle)
  }

  const handleSave = () => {
    if (editingId && editData) {
      setCycles((cycles) => cycles.map((cycle) => (cycle.id === editingId ? { ...cycle, ...editData } : cycle)))
      setEditingId(null)
      setEditData({})
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditData({})
  }

  const groupedCycles = cycles.reduce(
    (acc, cycle) => {
      if (!acc[cycle.vehicleType]) {
        acc[cycle.vehicleType] = []
      }
      acc[cycle.vehicleType].push(cycle)
      return acc
    },
    {} as Record<string, MaintenanceCycle[]>,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">検修周期マスタ</h1>
        <p className="text-gray-600 mt-2">機種ごとの検修項目の周期を設定・管理します</p>
      </div>

      {Object.entries(groupedCycles).map(([vehicleType, typeCycles]) => (
        <Card key={vehicleType}>
          <CardHeader>
            <CardTitle className="flex items-center">{vehicleType}の検修周期設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">検修項目</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">周期日数</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">走行距離 (km)</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">所要日数</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">事前通知日数</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {typeCycles.map((cycle) => (
                    <tr key={cycle.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-medium">{cycle.inspectionType}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {editingId === cycle.id ? (
                          <Input
                            type="number"
                            value={editData.cycleDays || ""}
                            onChange={(e) => setEditData({ ...editData, cycleDays: Number(e.target.value) })}
                            className="w-20"
                          />
                        ) : (
                          `${cycle.cycleDays}日`
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {editingId === cycle.id ? (
                          <Input
                            type="number"
                            value={editData.cycleDistance || ""}
                            onChange={(e) => setEditData({ ...editData, cycleDistance: Number(e.target.value) })}
                            className="w-24"
                          />
                        ) : (
                          `${cycle.cycleDistance}km`
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {editingId === cycle.id ? (
                          <Input
                            type="number"
                            value={editData.requiredDays || ""}
                            onChange={(e) => setEditData({ ...editData, requiredDays: Number(e.target.value) })}
                            className="w-20"
                          />
                        ) : (
                          `${cycle.requiredDays}日`
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {editingId === cycle.id ? (
                          <Input
                            type="number"
                            value={editData.notificationDays || ""}
                            onChange={(e) => setEditData({ ...editData, notificationDays: Number(e.target.value) })}
                            className="w-20"
                          />
                        ) : (
                          `${cycle.notificationDays}日前`
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {editingId === cycle.id ? (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleEdit(cycle)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
