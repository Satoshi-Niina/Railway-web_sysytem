"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Car } from "lucide-react"
import type { InspectionPlan, Vehicle, Base } from "@/types"

interface InspectionPlanFormProps {
  vehicles: Vehicle[]
  bases: Base[] // 基地データも受け取る
  onSubmit: (plans: InspectionPlan[]) => void
  onCancel: () => void
}

export function InspectionPlanForm({ vehicles, bases, onSubmit, onCancel }: InspectionPlanFormProps) {
  const [formData, setFormData] = useState({
    inspection_type: "", // 新しい検査種別
    planned_start_date: "",
    planned_end_date: "",
    notes: "",
  })
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [showVehicleSelectModal, setShowVehicleSelectModal] = useState(false)

  // 車両選択モーダル内のフィルター
  const [vehicleFilterCategory, setVehicleFilterCategory] = useState<string>("all")
  const [vehicleFilterBase, setVehicleFilterBase] = useState<string>("all")

  const inspectionTypeOptions = ["臨時修繕", "定期点検", "乙A検査", "乙B検査", "甲A検査", "甲B検査", "その他"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (selectedVehicleIds.length === 0) {
      alert("車両を1つ以上選択してください。")
      setLoading(false)
      return
    }

    const newPlans: InspectionPlan[] = []
    for (const vehicleId of selectedVehicleIds) {
      try {
        const response = await fetch("/api/inspection-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicle_id: vehicleId,
            inspection_type: formData.inspection_type,
            planned_start_date: formData.planned_start_date,
            planned_end_date: formData.planned_end_date || formData.planned_start_date, // 終了日がなければ開始日と同じ
            notes: formData.notes || null,
            // inspection_category はAPI側で導出される
            // status はAPI側でデフォルト値が設定される
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
      const matchesCategory = vehicleFilterCategory === "all" || vehicle.name === vehicleFilterCategory // nameが機種
      const matchesBase = vehicleFilterBase === "all" || vehicle.base_location === vehicleFilterBase
      return matchesCategory && matchesBase
    })
  }, [vehicles, vehicleFilterCategory, vehicleFilterBase])

  // ユニークな機種と基地のリストを取得
  const uniqueCategories = useMemo(() => {
    const categories = new Set(vehicles.map((v) => v.name)) // nameが機種
    return ["all", ...Array.from(categories)].sort()
  }, [vehicles])

  const uniqueBases = useMemo(() => {
    const bases = new Set(vehicles.map((v) => v.base_location))
    return ["all", ...Array.from(bases)].sort()
  }, [vehicles])

  return (
    <Card>
      <CardHeader>
        <CardTitle>新規検査計画登録</CardTitle> {/* タイトル変更 */}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <Label htmlFor="inspection_type">検査種別</Label> {/* ラベル変更 */}
            <Select
              value={formData.inspection_type}
              onValueChange={(value) => setFormData({ ...formData, inspection_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="検査種別を選択" />
              </SelectTrigger>
              <SelectContent>
                {inspectionTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="planned_start_date">施工予定 (開始)</Label> {/* ラベル変更 */}
              <Input
                id="planned_start_date"
                type="date"
                value={formData.planned_start_date}
                onChange={(e) => setFormData({ ...formData, planned_start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="planned_end_date">施工予定 (終了)</Label> {/* ラベル変更 */}
              <Input
                id="planned_end_date"
                type="date"
                value={formData.planned_end_date}
                onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="検査結果や特記事項を入力してください"
              rows={3}
            />
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
                    {vehicle.name} ({vehicle.machine_number})
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
