"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MonthPicker } from "@/components/ui/month-picker"
import type { Vehicle } from "@/types/database"

interface ManagementOffice {
  id: number
  office_name: string
  office_code: string
}

interface VehicleFormProps {
  onSubmit: (vehicle: Vehicle) => void
  onCancel: () => void
  editingVehicle?: Vehicle | null
}

export function VehicleForm({ onSubmit, onCancel, editingVehicle }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    vehicle_type: editingVehicle?.vehicle_type || "",
    machine_number: editingVehicle?.machine_number || "",
    model: editingVehicle?.model || "",
    manufacturer: editingVehicle?.manufacturer || "",
    acquisition_date: editingVehicle?.acquisition_date || "",
    type_approval_start_date: editingVehicle?.type_approval_start_date || "",
    type_approval_duration: editingVehicle?.type_approval_duration || 12,
    special_notes: editingVehicle?.special_notes || "",
    management_office_id: editingVehicle?.management_office_id || null,
  })
  const [loading, setLoading] = useState(false)
  const [offices, setOffices] = useState<ManagementOffice[]>([])

  // 事業所のデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching management offices...')
        // 事業所データを取得
        const officesResponse = await fetch('/api/management-offices')
        console.log('Offices response status:', officesResponse.status)
        
        if (officesResponse.ok) {
          const officesData = await officesResponse.json()
          console.log('Offices data received:', officesData)
          setOffices(officesData)
        } else {
          console.error('Failed to fetch offices:', officesResponse.status, officesResponse.statusText)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingVehicle 
        ? `/api/vehicles/${editingVehicle.id}`
        : "/api/vehicles"
      
      const method = editingVehicle ? "PUT" : "POST"

      const requestBody = {
        ...formData,
        acquisition_date: formData.acquisition_date || null,
        type_approval_start_date: formData.type_approval_start_date || null,
        type_approval_duration: formData.type_approval_duration || null,
        management_office_id: formData.management_office_id || null,
      }

      console.log("Sending request to:", url)
      console.log("Request method:", method)
      console.log("Request body:", requestBody)

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const vehicle = await response.json()
        console.log("Response received:", vehicle)
        onSubmit(vehicle)
      } else {
        const errorData = await response.json()
        console.error("Failed to save vehicle:", errorData)
        alert(`保存に失敗しました: ${errorData.error || '不明なエラー'}`)
      }
    } catch (error) {
      console.error("Error saving vehicle:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingVehicle ? "保守用車編集" : "新規保守用車登録"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle_type">機種 *</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MC-100">MC-100（モータカー）</SelectItem>
                  <SelectItem value="MC-150">MC-150（モータカー）</SelectItem>
                  <SelectItem value="TT-200">TT-200（鉄トロ）</SelectItem>
                  <SelectItem value="TT-250">TT-250（鉄トロ）</SelectItem>
                  <SelectItem value="HP-300">HP-300（ホッパー）</SelectItem>
                  <SelectItem value="HP-350">HP-350（ホッパー）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="machine_number">機械番号 *</Label>
              <Input
                id="machine_number"
                value={formData.machine_number}
                onChange={(e) => setFormData({ ...formData, machine_number: e.target.value })}
                placeholder="例: MC001"
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
                placeholder="例: MC-100A"
              />
            </div>
            <div>
              <Label htmlFor="manufacturer">製造メーカー</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="例: 鉄道車両製造株式会社"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="acquisition_date">取得年月</Label>
              <MonthPicker
                value={formData.acquisition_date}
                onValueChange={(value) => setFormData({ ...formData, acquisition_date: value })}
                placeholder="取得年月を選択"
              />
            </div>
            <div>
              <Label htmlFor="type_approval_start_date">型式認定有効起算日</Label>
              <MonthPicker
                value={formData.type_approval_start_date}
                onValueChange={(value) => setFormData({ ...formData, type_approval_start_date: value })}
                placeholder="型式認定有効起算日を選択"
              />
            </div>
            <div>
              <Label htmlFor="type_approval_duration">型式認定有効期間（月数）</Label>
              <Input
                id="type_approval_duration"
                type="number"
                min="1"
                max="120"
                value={formData.type_approval_duration}
                onChange={(e) => setFormData({ ...formData, type_approval_duration: parseInt(e.target.value) || 12 })}
                placeholder="12"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="management_office_id">管理事業所</Label>
            <div className="text-sm text-gray-500 mb-2">
              取得済み事業所数: {offices.length}
            </div>
            <Select
              value={formData.management_office_id?.toString() || ""}
              onValueChange={(value) => {
                console.log('Selected management office:', value)
                setFormData({ 
                  ...formData, 
                  management_office_id: value ? parseInt(value) : null
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="管理事業所を選択" />
              </SelectTrigger>
              <SelectContent>
                {offices.length === 0 ? (
                  <SelectItem value="no-data" disabled>
                    事業所データがありません
                  </SelectItem>
                ) : (
                  offices.map((office) => (
                    <SelectItem key={office.id} value={office.id.toString()}>
                      {office.office_code} - {office.office_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="special_notes">特記事項</Label>
            <Textarea
              id="special_notes"
              value={formData.special_notes}
              onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
              placeholder="特記事項があれば入力してください"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (editingVehicle ? "更新中..." : "登録中...") : (editingVehicle ? "更新" : "登録")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
