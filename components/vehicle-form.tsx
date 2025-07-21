"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Vehicle } from "@/types"

interface VehicleFormProps {
  onSubmit: (vehicle: Vehicle) => void
  onCancel: () => void
}

export function VehicleForm({ onSubmit, onCancel }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    name: "", // これが「機種」になる
    model: "",
    base_location: "",
    machine_number: "", // これが「機械番号」になる
    manufacturer: "",
    acquisition_date: "",
    management_office: "",
    type_approval_number: "",
    type_approval_expiration_date: "",
    type_approval_conditions: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          acquisition_date: formData.acquisition_date || null,
          type_approval_expiration_date: formData.type_approval_expiration_date || null,
        }),
      })

      if (response.ok) {
        const newVehicle = await response.json()
        onSubmit(newVehicle)
      } else {
        console.error("Failed to create vehicle")
      }
    } catch (error) {
      console.error("Error creating vehicle:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>新規保守用車登録</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">機種</Label> {/* ラベル変更 */}
              <Select
                value={formData.name}
                onValueChange={(value) => setFormData({ ...formData, name: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="モータカー">モータカー</SelectItem>
                  <SelectItem value="鉄トロ">鉄トロ</SelectItem>
                  <SelectItem value="ホッパー">ホッパー</SelectItem>
                  <SelectItem value="その他">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="machine_number">機械番号</Label> {/* ラベル変更 */}
              <Input
                id="machine_number"
                value={formData.machine_number}
                onChange={(e) => setFormData({ ...formData, machine_number: e.target.value })}
                placeholder="例: モータカー001"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="model">型式</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="例: MC-100"
                required
              />
            </div>
            <div>
              <Label htmlFor="base_location">留置基地</Label>
              <Input
                id="base_location"
                value={formData.base_location}
                onChange={(e) => setFormData({ ...formData, base_location: e.target.value })}
                placeholder="例: 東京基地"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manufacturer">製造メーカー</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="例: A社"
              />
            </div>
            <div>
              <Label htmlFor="acquisition_date">取得年月日</Label>
              <Input
                id="acquisition_date"
                type="date"
                value={formData.acquisition_date}
                onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="management_office">管理事業所</Label>
              <Input
                id="management_office"
                value={formData.management_office}
                onChange={(e) => setFormData({ ...formData, management_office: e.target.value })}
                placeholder="例: 東京事業所"
              />
            </div>
            <div>
              <Label htmlFor="type_approval_number">型式認定番号</Label>
              <Input
                id="type_approval_number"
                value={formData.type_approval_number}
                onChange={(e) => setFormData({ ...formData, type_approval_number: e.target.value })}
                placeholder="例: TA001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type_approval_expiration_date">型式認定有効期限</Label>
              <Input
                id="type_approval_expiration_date"
                type="date"
                value={formData.type_approval_expiration_date}
                onChange={(e) => setFormData({ ...formData, type_approval_expiration_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="type_approval_conditions">型式認定条件</Label>
              <Textarea
                id="type_approval_conditions"
                value={formData.type_approval_conditions}
                onChange={(e) => setFormData({ ...formData, type_approval_conditions: e.target.value })}
                placeholder="例: 高速走行時要点検"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "登録中..." : "登録"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
