"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Wrench, AlertCircle } from "lucide-react"
import type { InspectionPlan, Vehicle, Base } from "@/types"
import { InspectionPlanForm } from "./inspection-plan-form"
import { apiCall } from "@/lib/api-client"

// データベース設定の確認
const isDatabaseConfigured = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_DATABASE_URL || process.env.DATABASE_URL)
}

export function InspectionPlanList() {
  const [inspectionPlans, setInspectionPlans] = useState<InspectionPlan[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bases, setBases] = useState<Base[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setError(null)
      const [inspectionPlansData, vehiclesData, basesData] = await Promise.all([
        apiCall<InspectionPlan[]>("/api/inspection-plans"),
        apiCall<Vehicle[]>("/api/vehicles"),
        apiCall<Base[]>("/api/bases"),
      ])

      setInspectionPlans(inspectionPlansData)
      setVehicles(vehiclesData)
      setBases(basesData)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("データの取得に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  const handleInspectionPlanAdded = (newPlans: InspectionPlan[]) => {
    setInspectionPlans([...newPlans, ...inspectionPlans])
    setShowForm(false)
  }

  const getInspectionCategoryColor = (category: string) => {
    switch (category) {
      case "臨修":
        return "bg-red-100 text-red-800"
      case "甲検":
        return "bg-orange-100 text-orange-800"
      case "乙検":
        return "bg-blue-100 text-blue-800"
      case "定検":
        return "bg-green-100 text-green-800"
      case "その他":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "planned":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "postponed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
        <h2 className="text-2xl font-bold">検査計画管理</h2>
        <Button onClick={() => setShowForm(true)} disabled={!isDatabaseConfigured()}>
          <Plus className="w-4 h-4 mr-2" />
          検査計画追加
        </Button>
      </div>

      {showForm && (
        <InspectionPlanForm
          vehicles={vehicles}
          bases={bases}
          onSubmit={handleInspectionPlanAdded}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="grid grid-cols-1 gap-4">
        {inspectionPlans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <Wrench className="w-5 h-5 mr-2 text-purple-600" />
                    {plan.vehicle?.name} ({plan.vehicle?.machine_number}) - {plan.inspection_type}
                  </CardTitle>
                  <div className="text-sm text-gray-600 mt-1">
                    施工予定: {new Date(plan.planned_start_date).toLocaleDateString("ja-JP")}
                    {plan.planned_end_date && ` 〜 ${new Date(plan.planned_end_date).toLocaleDateString("ja-JP")}`}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <Badge className={`text-xs ${getInspectionCategoryColor(plan.inspection_category)}`}>
                    {plan.inspection_category}
                  </Badge>
                  <Badge className={`text-xs ${getStatusBadgeColor(plan.status)}`}>
                    {plan.status === "planned"
                      ? "予定"
                      : plan.status === "in_progress"
                        ? "実施中"
                        : plan.status === "completed"
                          ? "完了"
                          : "延期"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <strong>車両:</strong> {plan.vehicle?.name} ({plan.vehicle?.model}) - {plan.vehicle?.machine_number}
                  </div>
                  <div className="text-sm text-gray-500">{plan.vehicle?.base_location}</div>
                </div>

                {plan.notes && (
                  <div>
                    <strong className="text-sm">備考:</strong>
                    <p className="text-sm text-gray-700 mt-1">{plan.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {inspectionPlans.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">検査計画がありません。新しい検査計画を追加してください。</div>
      )}
    </div>
  )
}
