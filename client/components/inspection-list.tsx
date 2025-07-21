"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, FileText, Download } from "lucide-react"
import type { Inspection, Vehicle } from "@/types"

export function InspectionList() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [inspectionsRes, vehiclesRes] = await Promise.all([fetch("/api/inspections"), fetch("/api/vehicles")])

      const [inspectionsData, vehiclesData] = await Promise.all([inspectionsRes.json(), vehiclesRes.json()])

      setInspections(inspectionsData)
      setVehicles(vehiclesData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInspectionAdded = (newInspection: Inspection) => {
    setInspections([newInspection, ...inspections])
    setShowForm(false)
  }

  if (loading) {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">検査履歴管理</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          検査記録追加
        </Button>
      </div>

      {showForm && (
        <InspectionForm vehicles={vehicles} onSubmit={handleInspectionAdded} onCancel={() => setShowForm(false)} />
      )}

      <div className="grid grid-cols-1 gap-4">
        {inspections.map((inspection) => (
          <Card key={inspection.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {inspection.vehicle?.name} - {inspection.inspection_type}
                  </CardTitle>
                  <div className="text-sm text-gray-600 mt-1">
                    実施日: {new Date(inspection.inspection_date).toLocaleDateString("ja-JP")}
                  </div>
                </div>
                <Badge variant="outline">{inspection.inspection_type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <strong>車両:</strong> {inspection.vehicle?.name} ({inspection.vehicle?.model})
                  </div>
                  <div className="text-sm text-gray-500">
                    {inspection.vehicle?.category} - {inspection.vehicle?.base_location}
                  </div>
                </div>

                {inspection.notes && (
                  <div>
                    <strong className="text-sm">備考:</strong>
                    <p className="text-sm text-gray-700 mt-1">{inspection.notes}</p>
                  </div>
                )}

                {/* PDFファイルのダウンロード機能は後で実装 */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {inspections.length === 0 && (
        <div className="text-center py-12 text-gray-500">検査記録がありません。新しい検査記録を追加してください。</div>
      )}
    </div>
  )
}

function InspectionForm({
  vehicles,
  onSubmit,
  onCancel,
}: {
  vehicles: Vehicle[]
  onSubmit: (inspection: Inspection) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    vehicle_id: "",
    inspection_type: "",
    inspection_date: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: Number.parseInt(formData.vehicle_id),
          inspection_type: formData.inspection_type,
          inspection_date: formData.inspection_date,
          notes: formData.notes || null,
        }),
      })

      if (response.ok) {
        const newInspection = await response.json()
        onSubmit(newInspection)
      }
    } catch (error) {
      console.error("Error creating inspection:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>検査記録追加</CardTitle>
      </CardHeader>
      <CardContent>
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
              <Label>検査種別</Label>
              <Select
                value={formData.inspection_type}
                onValueChange={(value) => setFormData({ ...formData, inspection_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="検査種別を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="中間検査">中間検査</SelectItem>
                  <SelectItem value="年次検査">年次検査</SelectItem>
                  <SelectItem value="臨時検査">臨時検査</SelectItem>
                  <SelectItem value="定期検査">定期検査</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>実施日</Label>
            <Input
              type="date"
              value={formData.inspection_date}
              onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>備考</Label>
            <Textarea
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
            <Button type="submit" disabled={loading}>
              {loading ? "追加中..." : "追加"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
