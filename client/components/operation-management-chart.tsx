"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  History,
  CalendarDays,
  Car,
  AlertCircle,
  Building,
  Filter,
  Home,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Wrench,
  Download,
  Upload,
  FileText,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

import type { Vehicle, Base, ManagementOffice, OperationPlan, OperationRecord, Inspection } from "@/types"

// データベース設定の確認
const isDatabaseConfigured = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_DATABASE_URL || process.env.DATABASE_URL)
}

// 固定の機種表示順
const VEHICLE_TYPE_ORDER = ["モータカー", "MCR", "鉄トロ（10t）", "鉄トロ（15t）", "箱トロ", "ホッパー車"]

export function OperationManagementChart() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [allBases, setAllBases] = useState<Base[]>([])
  const [allOffices, setAllOffices] = useState<ManagementOffice[]>([])
  const [operationPlans, setOperationPlans] = useState<OperationPlan[]>([])
  const [operationRecords, setOperationRecords] = useState<OperationRecord[]>([])
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoImportStatus, setAutoImportStatus] = useState<string>("")

  // フィルター状態
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("all")
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("all")
  const [selectedMachineNumber, setSelectedMachineNumber] = useState<string>("all")

  const currentDateObj = new Date()
  const selectedMonthDate = new Date(currentMonth + "-01")
  const isCurrentMonth = currentMonth === currentDateObj.toISOString().slice(0, 7)
  const isPastMonth = selectedMonthDate < new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), 1)
  const isFutureMonth = selectedMonthDate > new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), 1)

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      setError(null)

      // データベースから保守基地を読み込み
      let bases: Base[] = []
      try {
        const response = await fetch("/api/maintenance-bases")
        if (response.ok) {
          bases = await response.json()
        } else {
          throw new Error("保守基地の取得に失敗しました")
        }
      } catch (error) {
        console.error("Error fetching bases:", error)
        // フォールバック: モックデータ
        bases = [
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
          {
            id: 3,
            base_name: "九州基地",
            location: "福岡",
            created_at: "2024-01-01T00:00:00Z",
          },
          {
            id: 4,
            base_name: "北海道基地",
            location: "札幌",
            created_at: "2024-01-01T00:00:00Z",
          },
        ]
      }

      // モックデータ
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

      const mockOffices: ManagementOffice[] = [
        {
          id: 1,
          office_name: "本社保守事業所",
          location: "東京",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          office_name: "関西支社保守事業所",
          location: "大阪",
          created_at: "2024-01-01T00:00:00Z",
        },
      ]

      // サンプル運用計画データ
      const mockOperationPlans: OperationPlan[] = [
        {
          id: 1,
          vehicle_id: 1,
          plan_date: `${currentMonth}-01`,
          shift_type: "day",
          start_time: "08:00",
          end_time: "17:00",
          planned_distance: 50,
          departure_base_id: 1,
          arrival_base_id: 1,
          notes: "通常運用",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          vehicle_id: 1,
          plan_date: `${currentMonth}-02`,
          shift_type: "night",
          start_time: "20:00",
          end_time: "05:00",
          planned_distance: 80,
          departure_base_id: 1,
          arrival_base_id: 2,
          notes: "夜間運用",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]

      // サンプル運用実績データ
      const mockOperationRecords: OperationRecord[] = [
        {
          id: 1,
          vehicle_id: 1,
          record_date: `${currentMonth}-01`,
          shift_type: "day",
          start_time: "08:00",
          end_time: "17:00",
          actual_distance: 48,
          departure_base_id: 1,
          arrival_base_id: 1,
          status: "completed",
          notes: "計画通り完了",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]

      // サンプル検査データ
      const mockInspections: Inspection[] = [
        {
          id: 1,
          vehicle_id: 1,
          inspection_type: "定期点検",
          inspection_date: `${currentMonth}-15`,
          priority: "normal",
          status: "scheduled",
          notes: "月次定期点検",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]

      setAllVehicles(mockVehicles)
      setAllBases(bases)
      setAllOffices(mockOffices)
      setOperationPlans(mockOperationPlans)
      setOperationRecords(mockOperationRecords)
      setInspections(mockInspections)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("データの取得に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  // 実績データの自動インポート
  const handleAutoImport = async () => {
    setAutoImportStatus("実績データを自動インポート中...")
    try {
      // ここで実際の実績データをインポートする処理を実装
      // 例: ExcelファイルやCSVファイルからデータを読み込み
      
      // モック実績データを追加
      const newRecords: OperationRecord[] = [
        {
          id: Date.now() + 1,
          vehicle_id: 1,
          record_date: `${currentMonth}-02`,
          shift_type: "night",
          start_time: "20:00",
          end_time: "05:00",
          actual_distance: 82,
          departure_base_id: 1,
          arrival_base_id: 2,
          status: "completed",
          notes: "自動インポート",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: Date.now() + 2,
          vehicle_id: 2,
          record_date: `${currentMonth}-03`,
          shift_type: "day",
          start_time: "08:00",
          end_time: "17:00",
          actual_distance: 45,
          departure_base_id: 1,
          arrival_base_id: 1,
          status: "completed",
          notes: "自動インポート",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      setOperationRecords([...operationRecords, ...newRecords])
      setAutoImportStatus("実績データの自動インポートが完了しました")
      
      // 3秒後にステータスをクリア
      setTimeout(() => {
        setAutoImportStatus("")
      }, 3000)
    } catch (error) {
      console.error("Error auto importing records:", error)
      setAutoImportStatus("実績データの自動インポートに失敗しました")
    }
  }

  const getDaysInMonth = (dateString: string) => {
    const [year, month] = dateString.split("-").map(Number)
    return new Date(year, month, 0).getDate()
  }

  const getDateString = (day: number) => {
    return `${currentMonth}-${day.toString().padStart(2, "0")}`
  }

  // 事業所でフィルタリングされた車両を取得
  const filteredVehicles = useMemo(() => {
    let vehicles = allVehicles

    // 事業所でフィルタリング
    if (selectedOfficeId !== "all") {
      const officeName = allOffices.find((o) => o.id === Number.parseInt(selectedOfficeId))?.office_name
      vehicles = vehicles.filter((vehicle) => vehicle.management_office === officeName)
    }

    // 機種でフィルタリング
    if (selectedVehicleType !== "all") {
      vehicles = vehicles.filter((vehicle) => vehicle.name === selectedVehicleType)
    }

    // 機械番号でフィルタリング
    if (selectedMachineNumber !== "all") {
      vehicles = vehicles.filter((vehicle) => vehicle.machine_number === selectedMachineNumber)
    }

    return vehicles
  }, [allVehicles, selectedOfficeId, selectedVehicleType, selectedMachineNumber, allOffices])

  // 機種別にグループ化された車両を取得（固定順序）
  const vehiclesByType = useMemo(() => {
    const grouped: Record<string, Vehicle[]> = {}

    // 固定順序で初期化
    VEHICLE_TYPE_ORDER.forEach((type) => {
      grouped[type] = []
    })

    filteredVehicles.forEach((vehicle) => {
      if (grouped[vehicle.name]) {
        grouped[vehicle.name].push(vehicle)
      }
    })

    // 各機種内で機械番号順にソート
    Object.keys(grouped).forEach((type) => {
      grouped[type].sort((a, b) => (a.machine_number || "").localeCompare(b.machine_number || ""))
    })

    // 空の機種を除外
    const result: Record<string, Vehicle[]> = {}
    Object.entries(grouped).forEach(([type, vehicles]) => {
      if (vehicles.length > 0) {
        result[type] = vehicles
      }
    })

    return result
  }, [filteredVehicles])

  // 特定の日付、車両、基地の運用計画を取得
  const getPlanForVehicleDateAndBase = (vehicleId: number, date: string, baseId: number): OperationPlan | undefined => {
    return operationPlans.find((plan) => 
      plan.vehicle_id === vehicleId && 
      plan.plan_date === date && 
      (plan.departure_base_id === baseId || plan.arrival_base_id === baseId)
    )
  }

  // 特定の日付、車両、基地の運用実績を取得
  const getRecordForVehicleDateAndBase = (vehicleId: number, date: string, baseId: number): OperationRecord | undefined => {
    return operationRecords.find((record) => 
      record.vehicle_id === vehicleId && 
      record.record_date === date && 
      (record.departure_base_id === baseId || record.arrival_base_id === baseId)
    )
  }

  // 特定の日付と車両の検査を取得
  const getInspectionForVehicleAndDate = (vehicleId: number, date: string): Inspection | undefined => {
    return inspections.find((inspection) => inspection.vehicle_id === vehicleId && inspection.inspection_date === date)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const [year, month] = currentMonth.split("-").map(Number)
    const newDate = new Date(year, month - 1, 1)

    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }

    setCurrentMonth(newDate.toISOString().slice(0, 7))
  }

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date().toISOString().slice(0, 7))
  }

  const getShiftTypeColor = (shiftType: string) => {
    switch (shiftType) {
      case "day":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "night":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "both":
        return "bg-purple-100 text-purple-800 border-purple-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getShiftTypeLabel = (shiftType: string) => {
    switch (shiftType) {
      case "day":
        return "昼"
      case "night":
        return "夜"
      case "both":
        return "昼夜"
      default:
        return "不明"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300"
      case "partial":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "完了"
      case "partial":
        return "部分"
      case "cancelled":
        return "中止"
      default:
        return "不明"
    }
  }

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

  const getMonthTypeInfo = () => {
    if (isPastMonth) {
      return {
        icon: History,
        label: "履歴",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
      }
    } else if (isFutureMonth) {
      return {
        icon: CalendarDays,
        label: "計画",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      }
    } else {
      return {
        icon: Calendar,
        label: "当月",
        color: "text-green-600",
        bgColor: "bg-green-50",
      }
    }
  }

  const monthInfo = getMonthTypeInfo()
  const MonthIcon = monthInfo.icon

  const daysInMonth = getDaysInMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // フィルターリセット
  const resetFilters = () => {
    setSelectedOfficeId("all")
    setSelectedVehicleType("all")
    setSelectedMachineNumber("all")
  }

  // 仕業点検簿へのリンクを生成
  const getInspectionBookLink = (vehicleType: string, date: string) => {
    return `/inspections?vehicle_type=${encodeURIComponent(vehicleType)}&date=${date}`
  }

  // 機械番号の仕業点検へのリンクを生成（仮）
  const getMachineInspectionLink = (machineNumber: string, date: string) => {
    return `/machine-inspection?machine_number=${encodeURIComponent(machineNumber)}&date=${date}`
  }

  // 指定日の翌日を取得
  const getNextDay = (date: string) => {
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)
    return nextDay.toISOString().slice(0, 10)
  }

  // 今日の日付を取得
  const getTodayDate = () => {
    return new Date().toISOString().slice(0, 10)
  }

  // 明日の日付を取得
  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 10)
  }

  // 日付をクリックしたときの処理
  const handleDateClick = (date: string) => {
    setSelectedDate(date)
  }

  // 月表示に戻る
  const handleBackToMonth = () => {
    setSelectedDate(null)
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

      {autoImportStatus && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{autoImportStatus}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">運用管理表</h2>
          <Badge className={`${monthInfo.bgColor} ${monthInfo.color} border-0`}>
            <MonthIcon className="w-4 h-4 mr-1" />
            {monthInfo.label}
          </Badge>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={handleAutoImport} variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            実績自動インポート
          </Button>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2 min-w-40">
              <Calendar className="w-4 h-4" />
              <Input
                type="month"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="w-32"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          {!isCurrentMonth && (
            <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
              今月に戻る
            </Button>
          )}
        </div>
      </div>
      
      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>フィルター</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="officeFilter" className="text-sm font-medium">
                事業所
              </Label>
              <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
                <SelectTrigger>
                  <SelectValue placeholder="事業所を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ての事業所</SelectItem>
                  {allOffices.map((office) => (
                    <SelectItem key={office.id} value={office.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4" />
                        <span>{office.office_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleTypeFilter" className="text-sm font-medium">
                機種
              </Label>
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
              <Label htmlFor="machineNumberFilter" className="text-sm font-medium">
                機械番号
              </Label>
              <Select value={selectedMachineNumber} onValueChange={setSelectedMachineNumber}>
                <SelectTrigger>
                  <SelectValue placeholder="機械番号を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ての機械番号</SelectItem>
                  {filteredVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.machine_number} value={vehicle.machine_number}>
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4" />
                        <span>{vehicle.machine_number}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-gray-600">
              {selectedOfficeId !== "all" || selectedVehicleType !== "all" || selectedMachineNumber !== "all" ? (
                <div className="flex items-center space-x-2">
                  <span>フィルター適用中:</span>
                  {selectedOfficeId !== "all" && (
                    <Badge variant="secondary">
                      {allOffices.find((o) => o.id === Number.parseInt(selectedOfficeId))?.office_name}
                    </Badge>
                  )}
                  {selectedVehicleType !== "all" && <Badge variant="secondary">{selectedVehicleType}</Badge>}
                  {selectedMachineNumber !== "all" && <Badge variant="secondary">{selectedMachineNumber}</Badge>}
                </div>
              ) : (
                <span>全てのデータを表示中</span>
              )}
            </div>
            {(selectedOfficeId !== "all" || selectedVehicleType !== "all" || selectedMachineNumber !== "all") && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                フィルターをリセット
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 運用管理表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>{currentMonth} 運用管理表</span>
            <Badge variant="outline" className={monthInfo.color}>
              {monthInfo.label}表示
            </Badge>
          </CardTitle>
          <div className="text-sm text-gray-600">
            運用計画と実績を統合表示します。青色は計画、緑色は実績、紫色は検査を表示します。
          </div>
        </CardHeader>
        <CardContent>
          {selectedDate ? (
            // 選択された日付の詳細表示（当日と翌日）
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">選択日: {selectedDate}</h3>
                <Button variant="outline" size="sm" onClick={handleBackToMonth}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  月表示に戻る
                </Button>
              </div>

              {/* 当日 */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-blue-600">当日: {selectedDate}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="border p-2 bg-gray-50 text-center min-w-20">機種</th>
                        <th className="border p-2 bg-gray-50 text-center min-w-20">機械番号</th>
                        <th className="border p-2 bg-blue-50 text-center min-w-20">計画</th>
                        <th className="border p-2 bg-green-50 text-center min-w-20">実績</th>
                        {allBases.map((base) => (
                          <th key={base.id} className="border p-2 bg-green-50 text-center min-w-24">
                            <div className="space-y-1">
                              <div className="font-medium">{base.base_name}</div>
                              <div className="text-xs text-gray-600">{base.location}</div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(vehiclesByType).map(([vehicleType, vehicles]) =>
                        vehicles.map((vehicle, vehicleIndex) => {
                          const plan = getPlanForVehicleDateAndBase(vehicle.id, selectedDate, 1)
                          const record = getRecordForVehicleDateAndBase(vehicle.id, selectedDate, 1)
                          const inspection = getInspectionForVehicleAndDate(vehicle.id, selectedDate)

                          return (
                            <tr key={`${selectedDate}-${vehicle.id}`}>
                              {/* 機種セル */}
                              {vehicleIndex === 0 && (
                                <td className="border p-2 text-center font-medium bg-blue-50" rowSpan={vehicles.length}>
                                  <div className="flex flex-col items-center space-y-1">
                                    <Car className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs font-semibold">{vehicleType}</span>
                                  </div>
                                </td>
                              )}

                              {/* 機械番号セル */}
                              <td className="border p-2 text-center font-medium bg-blue-50">
                                <div className="text-sm font-semibold text-blue-600">
                                  {vehicle.machine_number}
                                </div>
                              </td>

                              {/* 計画セル */}
                              <td className="border p-2 text-center bg-blue-50">
                                {plan ? (
                                  <div className="space-y-1">
                                    <div className={`text-xs px-1 py-0.5 rounded ${getShiftTypeColor(plan.shift_type)}`}>
                                      {getShiftTypeLabel(plan.shift_type)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400">計画なし</div>
                                )}
                              </td>

                              {/* 実績セル */}
                              <td className="border p-2 text-center bg-green-50">
                                {record ? (
                                  <div className="space-y-1">
                                    <div className={`text-xs px-1 py-0.5 rounded ${getShiftTypeColor(record.shift_type)}`}>
                                      {getShiftTypeLabel(record.shift_type)}
                                    </div>
                                    <div className={`text-xs px-1 py-0.5 rounded ${getStatusBadgeColor(record.status)}`}>
                                      {getStatusLabel(record.status)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400">実績なし</div>
                                )}
                              </td>

                              {/* 保守基地セル */}
                              {allBases.map((base) => {
                                const basePlan = getPlanForVehicleDateAndBase(vehicle.id, selectedDate, base.id)
                                const baseRecord = getRecordForVehicleDateAndBase(vehicle.id, selectedDate, base.id)

                                return (
                                  <td key={base.id} className="border p-2">
                                    <div className="space-y-2">
                                      {/* 運用計画 */}
                                      {basePlan && (
                                        <div className="space-y-1">
                                          <div className={`text-xs px-1 py-0.5 rounded ${getShiftTypeColor(basePlan.shift_type)}`}>
                                            計画: {getShiftTypeLabel(basePlan.shift_type)}
                                          </div>
                                        </div>
                                      )}

                                      {/* 運用実績 */}
                                      {baseRecord && (
                                        <div className="space-y-1">
                                          <div className={`text-xs px-1 py-0.5 rounded ${getShiftTypeColor(baseRecord.shift_type)}`}>
                                            実績: {getShiftTypeLabel(baseRecord.shift_type)}
                                          </div>
                                          <div className={`text-xs px-1 py-0.5 rounded ${getStatusBadgeColor(baseRecord.status)}`}>
                                            {getStatusLabel(baseRecord.status)}
                                          </div>
                                        </div>
                                      )}

                                      {/* 検査 */}
                                      {inspection && (
                                        <div className="space-y-1">
                                          <div className="flex items-center space-x-1">
                                            <Wrench className="w-3 h-3 text-purple-600" />
                                            <div className={`text-xs px-1 py-0.5 rounded ${getPriorityBadgeColor(inspection.priority)}`}>
                                              {inspection.priority === "urgent"
                                                ? "緊急"
                                                : inspection.priority === "high"
                                                  ? "高"
                                                  : inspection.priority === "normal"
                                                    ? "通常"
                                                    : "低"}
                                            </div>
                                          </div>
                                          <div className="text-xs text-gray-600">{inspection.inspection_type}</div>
                                          <div className="text-xs text-gray-500">{inspection.notes}</div>
                                        </div>
                                      )}

                                      {/* データがない場合 */}
                                      {!basePlan && !baseRecord && !inspection && (
                                        <div className="text-xs text-gray-400 text-center py-2">
                                          データなし
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            // 月表示
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-50 text-center min-w-16 sticky left-0 z-10">日付</th>
                    <th className="border p-2 bg-gray-50 text-center min-w-12 sticky left-16 z-10">曜日</th>
                    <th className="border p-2 bg-blue-50 text-center min-w-20">機種</th>
                    <th className="border p-2 bg-blue-50 text-center min-w-20">機械番号</th>
                    {allBases.map((base) => (
                      <th key={base.id} className="border p-2 bg-green-50 text-center min-w-24">
                        <div className="space-y-1">
                          <div className="font-medium">{base.base_name}</div>
                          <div className="text-xs text-gray-600">{base.location}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => {
                    const dateString = getDateString(day)
                    const dayOfWeek = new Date(dateString).toLocaleDateString("ja-JP", { weekday: "short" })
                    const isWeekend = dayOfWeek === "土" || dayOfWeek === "日"
                    const isToday = dateString === new Date().toISOString().slice(0, 10)

                    // 各日付に対して、機種×機械番号の組み合わせごとに行を作成
                    const vehicleRows = Object.entries(vehiclesByType).flatMap(([vehicleType, vehicles]) =>
                      vehicles.map((vehicle, vehicleIndex) => ({
                        vehicleType,
                        vehicle,
                        isFirstOfType: vehicleIndex === 0,
                        typeCount: vehicles.length,
                      })),
                    )

                    return vehicleRows.map((row, rowIndex) => (
                      <tr key={`${day}-${row.vehicle.id}`} className={isWeekend ? "bg-red-25" : ""}>
                        {/* 日付セル（最初の車両行のみ表示） */}
                        {rowIndex === 0 && (
                          <td
                            className={`border p-2 text-center font-medium sticky left-0 z-10 cursor-pointer hover:bg-blue-100 transition-colors ${
                              isToday ? "bg-yellow-100" : "bg-gray-50"
                            }`}
                            rowSpan={vehicleRows.length}
                            onClick={() => handleDateClick(dateString)}
                          >
                            {day}
                          </td>
                        )}

                        {/* 曜日セル（最初の車両行のみ表示） */}
                        {rowIndex === 0 && (
                          <td
                            className={`border p-2 text-center text-sm sticky left-16 z-10 ${
                              isWeekend ? "text-red-600 font-medium" : "text-gray-600"
                            } ${isToday ? "bg-yellow-100" : "bg-gray-50"}`}
                            rowSpan={vehicleRows.length}
                          >
                            {dayOfWeek}
                          </td>
                        )}

                        {/* 機種セル */}
                        {row.isFirstOfType && (
                          <td className="border p-2 text-center font-medium bg-blue-50" rowSpan={row.typeCount}>
                            <div className="flex flex-col items-center space-y-1">
                              <Car className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-semibold">{row.vehicleType}</span>
                            </div>
                          </td>
                        )}

                        {/* 機械番号セル */}
                        <td className="border p-2 text-center font-medium bg-blue-50">
                          <div className="text-sm font-semibold">{row.vehicle.machine_number}</div>
                        </td>

                        {/* 保守基地セル（計画と実績の統合表示） */}
                        {allBases.map((base) => {
                          const plan = getPlanForVehicleDateAndBase(row.vehicle.id, dateString, base.id)
                          const record = getRecordForVehicleDateAndBase(row.vehicle.id, dateString, base.id)
                          const inspection = getInspectionForVehicleAndDate(row.vehicle.id, dateString)

                          return (
                            <td key={base.id} className="border p-2">
                              <div className="space-y-2">
                                {/* 運用計画 */}
                                {plan && (
                                  <div className="space-y-1">
                                    <div className={`text-xs px-1 py-0.5 rounded ${getShiftTypeColor(plan.shift_type)}`}>
                                      計画: {getShiftTypeLabel(plan.shift_type)}
                                    </div>
                                  </div>
                                )}

                                {/* 運用実績 */}
                                {record && (
                                  <div className="space-y-1">
                                    <div className={`text-xs px-1 py-0.5 rounded ${getShiftTypeColor(record.shift_type)}`}>
                                      実績: {getShiftTypeLabel(record.shift_type)}
                                    </div>
                                    <div className={`text-xs px-1 py-0.5 rounded ${getStatusBadgeColor(record.status)}`}>
                                      {getStatusLabel(record.status)}
                                    </div>
                                  </div>
                                )}

                                {/* 検査 */}
                                {inspection && (
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-1">
                                      <Wrench className="w-3 h-3 text-purple-600" />
                                      <div className={`text-xs px-1 py-0.5 rounded ${getPriorityBadgeColor(inspection.priority)}`}>
                                        {inspection.priority === "urgent"
                                          ? "緊急"
                                          : inspection.priority === "high"
                                            ? "高"
                                            : inspection.priority === "normal"
                                              ? "通常"
                                              : "低"}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-600">{inspection.inspection_type}</div>
                                    <div className="text-xs text-gray-500">{inspection.notes}</div>
                                  </div>
                                )}

                                {/* データがない場合 */}
                                {!plan && !record && !inspection && (
                                  <div className="text-xs text-gray-400 text-center py-2">
                                    データなし
                                  </div>
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 