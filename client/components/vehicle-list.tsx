"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Car, MapPin, Factory, CalendarDays, Building2, FileText, CalendarX } from "lucide-react"
import type { Vehicle } from "@/types"
import { VehicleForm } from "./vehicle-form"

export function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/vehicles")
      const data = await response.json()
      setVehicles(data)
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVehicleAdded = (newVehicle: Vehicle) => {
    setVehicles([newVehicle, ...vehicles])
    setShowForm(false)
  }

  if (loading) {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">保守用車マスタ管理</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          保守用車登録
        </Button>
      </div>

      {showForm && <VehicleForm onSubmit={handleVehicleAdded} onCancel={() => setShowForm(false)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Car className="w-5 h-5 mr-2" />
                  {vehicle.name} {/* 機種を表示 */}
                </CardTitle>
                {vehicle.machine_number && <Badge variant="secondary">{vehicle.machine_number}</Badge>}{" "}
                {/* 機械番号を表示 */}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center">
                  <span className="font-semibold w-24">型式:</span> {vehicle.model}
                </div>
                {vehicle.manufacturer && (
                  <div className="flex items-center">
                    <Factory className="w-4 h-4 mr-1 text-gray-500" />
                    <span className="font-semibold w-20">製造メーカー:</span> {vehicle.manufacturer}
                  </div>
                )}
                {vehicle.acquisition_date && (
                  <div className="flex items-center">
                    <CalendarDays className="w-4 h-4 mr-1 text-gray-500" />
                    <span className="font-semibold w-20">取得年月日:</span>{" "}
                    {new Date(vehicle.acquisition_date).toLocaleDateString("ja-JP")}
                  </div>
                )}
                {vehicle.management_office && (
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-1 text-gray-500" />
                    <span className="font-semibold w-20">管理事業所:</span> {vehicle.management_office}
                  </div>
                )}
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                  <span className="font-semibold w-20">留置基地:</span> {vehicle.base_location}
                </div>
                {vehicle.type_approval_number && (
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-1 text-gray-500" />
                    <span className="font-semibold w-20">型式認定番号:</span> {vehicle.type_approval_number}
                  </div>
                )}
                {vehicle.type_approval_expiration_date && (
                  <div className="flex items-center">
                    <CalendarX className="w-4 h-4 mr-1 text-gray-500" />
                    <span className="font-semibold w-20">認定有効期限:</span>{" "}
                    {new Date(vehicle.type_approval_expiration_date).toLocaleDateString("ja-JP")}
                  </div>
                )}
                {vehicle.type_approval_conditions && (
                  <div>
                    <span className="font-semibold">認定条件:</span>
                    <p className="text-xs text-gray-600 mt-1">{vehicle.type_approval_conditions}</p>
                  </div>
                )}
                <div className="text-xs text-gray-500 pt-2">
                  登録日: {new Date(vehicle.created_at).toLocaleDateString("ja-JP")}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          保守用車が登録されていません。新しい保守用車を登録してください。
        </div>
      )}
    </div>
  )
}
