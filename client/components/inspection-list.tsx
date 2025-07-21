"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Wrench, 
  AlertCircle, 
  Calendar, 
  Car, 
  FileText, 
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { Inspection, Vehicle, Base } from "@/types"

// データベース設定の確認
const isDatabaseConfigured = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_DATABASE_URL || process.env.DATABASE_URL)
}

// 固定の機種表示順
const VEHICLE_TYPE_ORDER = ["モータカー", "MCR", "鉄トロ（10t）", "鉄トロ（15t）", "箱トロ", "ホッパー車"]

export function InspectionList() {
  const searchParams = useSearchParams()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bases, setBases] = useState<Base[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // フィルター状態
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>(
    searchParams.get("vehicle_type") || "all"
  )
  const [selectedDate, setSelectedDate] = useState<string>(
    searchParams.get("date") || new Date().toISOString().slice(0, 10)
  )

  useEffect(() => {
    fetchData()
  }, [])

  // URLパラメータが変更されたときにフィルターを更新
  useEffect(() => {
    const vehicleType = searchParams.get("vehicle_type")
    const date = searchParams.get("date")
    
    if (vehicleType) {
      setSelectedVehicleType(vehicleType)
    }
    if (date) {
      setSelectedDate(date)
    }
  }, [searchParams])

  const fetchData = async () => {
    try {
      setError(null)
      
      // モックデータ（実際のAPIコールに置き換える）
      const mockVehicles: Vehicle[] = [
        {
          id: 1,
          name: "モータカー",
          model: "MC-100",
          base_location: "本社基地",
          machine_number: "M001",
          manufacturer: "メーカーA",
          acquisition_date: "2020-04-01",
          management_office: "本社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          name: "モータカー",
          model: "MC-100",
          base_location: "本社基地",
          machine_number: "M002",
          manufacturer: "メーカーA",
          acquisition_date: "2020-05-01",
          management_office: "本社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 3,
          name: "MCR",
          model: "MCR-200",
          base_location: "本社基地",
          machine_number: "MCR001",
          manufacturer: "メーカーB",
          acquisition_date: "2019-06-01",
          management_office: "本社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]

      const mockBases: Base[] = [
        {
          id: 1,
          base_name: "本社基地",
          location: "東京",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          base_name: "関西保守基地",
          location: "大阪",
          created_at: "2024-01-01T00:00:00Z",
        },
      ]

      const mockInspections: Inspection[] = [
        {
          id: 1,
          vehicle_id: 1,
          inspection_type: "出発前点検",
          inspection_date: selectedDate,
          priority: "normal",
          status: "completed",
          notes: "通常の出発前点検を実施。異常なし。",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          vehicle_id: 1,
          inspection_type: "到着後点検",
          inspection_date: selectedDate,
          priority: "normal",
          status: "scheduled",
          notes: "到着後の点検予定",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 3,
          vehicle_id: 2,
          inspection_type: "定期点検",
          inspection_date: selectedDate,
          priority: "high",
          status: "in_progress",
          notes: "月次定期点検実施中",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 4,
          vehicle_id: 3,
          inspection_type: "緊急点検",
          inspection_date: selectedDate,
          priority: "urgent",
          status: "scheduled",
          notes: "異常発見のため緊急点検が必要",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]

      setVehicles(mockVehicles)
      setBases(mockBases)
      setInspections(mockInspections)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("データの取得に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  // フィルタリングされた検査データを取得
  const filteredInspections = inspections.filter((inspection) => {
    const vehicle = vehicles.find((v) => v.id === inspection.vehicle_id)
    
    // 機種フィルター
    if (selectedVehicleType !== "all" && vehicle?.name !== selectedVehicleType) {
      return false
    }
    
    // 日付フィルター
    if (selectedDate && inspection.inspection_date !== selectedDate) {
      return false
    }
    
    return true
  })

  // 機種別にグループ化
  const inspectionsByVehicleType = filteredInspections.reduce((acc, inspection) => {
    const vehicle = vehicles.find((v) => v.id === inspection.vehicle_id)
    if (!vehicle) return acc
    
    if (!acc[vehicle.name]) {
      acc[vehicle.name] = []
    }
    acc[vehicle.name].push({ ...inspection, vehicle })
    return acc
  }, {} as Record<string, Array<Inspection & { vehicle: Vehicle }>>)

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "normal":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "in_progress":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "scheduled":
        return <Calendar className="w-4 h-4 text-blue-600" />
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "完了"
      case "in_progress":
        return "実施中"
      case "scheduled":
        return "予定"
      case "cancelled":
        return "中止"
      default:
        return "不明"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "緊急"
      case "high":
        return "高"
      case "normal":
        return "通常"
      case "low":
        return "低"
      default:
        return "不明"
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
            データベースが設定されていません。モックデータを表示しています。実際のデータを使用するには、データベースの設定を完了してください。
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
        <div className="flex items-center space-x-4">
          <Link href="/management">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              運用管理に戻る
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              仕業点検簿
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedDate} - {selectedVehicleType !== "all" ? selectedVehicleType : "全機種"}
            </p>
          </div>
        </div>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleTypeFilter">機種</Label>
              <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
                <SelectTrigger>
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ての機種</SelectItem>
                  {VEHICLE_TYPE_ORDER.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4" />
                        <span>{type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFilter">日付</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 検査リスト */}
      <div className="space-y-6">
        {Object.entries(inspectionsByVehicleType).map(([vehicleType, vehicleInspections]) => (
          <Card key={vehicleType}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="w-5 h-5 text-blue-600" />
                <span>{vehicleType}</span>
                <Badge variant="outline">{vehicleInspections.length}件</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vehicleInspections.map((inspection) => (
                  <div key={inspection.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Wrench className="w-4 h-4 text-purple-600" />
                        <div>
                          <div className="font-medium">
                            {inspection.vehicle.machine_number} - {inspection.inspection_type}
                          </div>
                          <div className="text-sm text-gray-600">
                            {inspection.vehicle.base_location}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityBadgeColor(inspection.priority)}>
                          {getPriorityLabel(inspection.priority)}
                        </Badge>
                        <Badge className={getStatusBadgeColor(inspection.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(inspection.status)}
                            <span>{getStatusLabel(inspection.status)}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>

                    {inspection.notes && (
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        <strong>備考:</strong> {inspection.notes}
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      点検日: {new Date(inspection.inspection_date).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {Object.keys(inspectionsByVehicleType).length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>指定された条件の点検記録がありません。</p>
            <p className="text-sm mt-2">フィルターを変更して再度お試しください。</p>
          </div>
        )}
      </div>
    </div>
  )
}
