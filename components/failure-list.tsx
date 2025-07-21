"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, AlertTriangle, Wrench, ImageIcon, AlertCircle } from "lucide-react"
import type { Failure, Vehicle, Repair } from "@/types"
import { apiCall, isDatabaseConfigured } from "@/lib/api-client"

export function FailureList() {
  const [failures, setFailures] = useState<Failure[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFailureForm, setShowFailureForm] = useState(false)
  const [showRepairForm, setShowRepairForm] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setError(null)
      const [failuresData, vehiclesData] = await Promise.all([
        apiCall<Failure[]>("/api/failures"),
        apiCall<Vehicle[]>("/api/vehicles"),
      ])

      setFailures(failuresData)
      setVehicles(vehiclesData)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("データの取得に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  const handleFailureAdded = (newFailure: Failure) => {
    setFailures([newFailure, ...failures])
    setShowFailureForm(false)
  }

  const handleRepairAdded = (failureId: number, newRepair: Repair) => {
    setFailures(
      failures.map((failure) =>
        failure.id === failureId ? { ...failure, repairs: [...(failure.repairs || []), newRepair] } : failure,
      ),
    )
    setShowRepairForm(null)
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
        <h2 className="text-2xl font-bold">故障・修繕記録</h2>
        <Button onClick={() => setShowFailureForm(true)} disabled={!isDatabaseConfigured()}>
          <Plus className="w-4 h-4 mr-2" />
          故障記録追加
        </Button>
      </div>

      {showFailureForm && (
        <FailureForm vehicles={vehicles} onSubmit={handleFailureAdded} onCancel={() => setShowFailureForm(false)} />
      )}

      <div className="grid grid-cols-1 gap-4">
        {failures.map((failure) => (
          <Card key={failure.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                    {failure.vehicle?.name} - 故障記録
                  </CardTitle>
                  <div className="text-sm text-gray-600 mt-1">
                    故障日: {new Date(failure.failure_date).toLocaleDateString("ja-JP")}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Badge variant="destructive">故障</Badge>
                  {failure.repairs && failure.repairs.length > 0 && <Badge variant="default">修繕済み</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong className="text-sm">故障内容:</strong>
                  <p className="text-sm text-gray-700 mt-1">{failure.failure_content}</p>
                </div>

                {failure.image_urls && failure.image_urls.length > 0 && (
                  <div>
                    <strong className="text-sm">添付画像:</strong>
                    <div className="flex items-center space-x-2 mt-1">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-sm text-gray-600">
                        {failure.image_urls.length}件の画像が添付されています
                      </span>
                    </div>
                  </div>
                )}

                {failure.repairs && failure.repairs.length > 0 && (
                  <div>
                    <strong className="text-sm">修繕履歴:</strong>
                    <div className="mt-2 space-y-2">
                      {failure.repairs.map((repair) => (
                        <div key={repair.id} className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <Wrench className="w-4 h-4 mr-2 text-green-600" />
                              <span className="text-sm font-medium">
                                修繕日: {new Date(repair.repair_date).toLocaleDateString("ja-JP")}
                              </span>
                            </div>
                            {repair.repair_cost && (
                              <Badge variant="outline">¥{repair.repair_cost.toLocaleString()}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{repair.repair_content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowRepairForm(failure.id)}
                    disabled={!isDatabaseConfigured()}
                  >
                    <Wrench className="w-4 h-4 mr-2" />
                    修繕記録追加
                  </Button>
                </div>

                {showRepairForm === failure.id && (
                  <RepairForm
                    failureId={failure.id}
                    onSubmit={(repair) => handleRepairAdded(failure.id, repair)}
                    onCancel={() => setShowRepairForm(null)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {failures.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">故障記録がありません。</div>
      )}
    </div>
  )
}

function FailureForm({
  vehicles,
  onSubmit,
  onCancel,
}: {
  vehicles: Vehicle[]
  onSubmit: (failure: Failure) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    vehicle_id: "",
    failure_date: "",
    failure_content: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/failures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: Number.parseInt(formData.vehicle_id),
          failure_date: formData.failure_date,
          failure_content: formData.failure_content,
        }),
      })

      if (response.ok) {
        const newFailure = await response.json()
        onSubmit(newFailure)
      }
    } catch (error) {
      console.error("Error creating failure:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>故障記録追加</CardTitle>
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
              <Label>故障日</Label>
              <Input
                type="date"
                value={formData.failure_date}
                onChange={(e) => setFormData({ ...formData, failure_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>故障内容</Label>
            <Textarea
              value={formData.failure_content}
              onChange={(e) => setFormData({ ...formData, failure_content: e.target.value })}
              placeholder="故障の詳細を入力してください"
              rows={4}
              required
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

function RepairForm({
  failureId,
  onSubmit,
  onCancel,
}: {
  failureId: number
  onSubmit: (repair: Repair) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    repair_date: "",
    repair_content: "",
    repair_cost: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          failure_id: failureId,
          repair_date: formData.repair_date,
          repair_content: formData.repair_content,
          repair_cost: formData.repair_cost ? Number.parseFloat(formData.repair_cost) : null,
        }),
      })

      if (response.ok) {
        const newRepair = await response.json()
        onSubmit(newRepair)
      }
    } catch (error) {
      console.error("Error creating repair:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 p-4 rounded border">
      <h4 className="font-medium mb-4">修繕記録追加</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>修繕日</Label>
            <Input
              type="date"
              value={formData.repair_date}
              onChange={(e) => setFormData({ ...formData, repair_date: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>修繕費用 (円)</Label>
            <Input
              type="number"
              value={formData.repair_cost}
              onChange={(e) => setFormData({ ...formData, repair_cost: e.target.value })}
              placeholder="15000"
            />
          </div>
        </div>

        <div>
          <Label>修繕内容</Label>
          <Textarea
            value={formData.repair_content}
            onChange={(e) => setFormData({ ...formData, repair_content: e.target.value })}
            placeholder="実施した修繕内容を入力してください"
            rows={3}
            required
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            キャンセル
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "追加中..." : "追加"}
          </Button>
        </div>
      </form>
    </div>
  )
}
