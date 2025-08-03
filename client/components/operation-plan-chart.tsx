"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { Vehicle, Base, ManagementOffice, OperationAssignment } from "@/types"

// データベース設定の確認
const isDatabaseConfigured = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_DATABASE_URL || process.env.DATABASE_URL)
}

// 固定の機種表示順
const VEHICLE_TYPE_ORDER = ["モータカー", "MCR", "鉄トロ（10t）", "鉄トロ（15t）", "箱トロ", "ホッパー車"]

export function OperationPlanChart() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [allBases, setAllBases] = useState<Base[]>([])
  const [allOffices, setAllOffices] = useState<ManagementOffice[]>([])
  const [operationAssignments, setOperationAssignments] = useState<OperationAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // フィルター状態
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("all")
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("all")
  const [selectedMachineNumber, setSelectedMachineNumber] = useState<string>("all")

  const currentDate = new Date()
  const selectedDate = new Date(currentMonth + "-01")
  const isCurrentMonth = currentMonth === currentDate.toISOString().slice(0, 7)
  const isPastMonth = selectedDate < new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const isFutureMonth = selectedDate > new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      setError(null)

      // データベースから基地を読み込み
      let bases: any[] = []
      try {
        const basesResponse = await fetch("/api/maintenance-bases")
        if (basesResponse.ok) {
          const maintenanceBases = await basesResponse.json()
          const bases = maintenanceBases.map((base: any) => ({
            id: base.id,
            base_name: base.base_name,
            location: base.location || "",
            management_office_id: base.management_office_id,
            created_at: base.created_at,
          }))
        } else {
          console.error("基地の取得に失敗しました:", basesResponse.status, basesResponse.statusText)
          // モックデータを使用
          bases = [
            { id: 1, base_name: "東京基地", location: "東京都", management_office_id: 1, created_at: new Date().toISOString() },
            { id: 2, base_name: "大阪基地", location: "大阪府", management_office_id: 2, created_at: new Date().toISOString() },
            { id: 3, base_name: "名古屋基地", location: "愛知県", management_office_id: 1, created_at: new Date().toISOString() }
          ]
          setError("基地データの取得に失敗しました。モックデータを表示しています。")
        }
      } catch (error) {
        console.error("基地データの取得エラー:", error)
        // モックデータを使用
        bases = [
          { id: 1, base_name: "東京基地", location: "東京都", management_office_id: 1, created_at: new Date().toISOString() },
          { id: 2, base_name: "大阪基地", location: "大阪府", management_office_id: 2, created_at: new Date().toISOString() },
          { id: 3, base_name: "名古屋基地", location: "愛知県", management_office_id: 1, created_at: new Date().toISOString() }
        ]
        setError("基地データの取得に失敗しました。モックデータを表示しています。")
      }

      // データベースから事業所を読み込み
      let offices: any[] = []
      try {
        const officesResponse = await fetch("/api/management-offices")
        if (officesResponse.ok) {
          offices = await officesResponse.json()
        } else {
          console.error("事業所の取得に失敗しました:", officesResponse.status, officesResponse.statusText)
          // モックデータを使用
          offices = [
            { id: 1, office_name: "東京事業所", office_code: "OFF001", station_1: "東京駅", station_2: "新宿駅", station_3: "渋谷駅", station_4: "池袋駅", station_5: "上野駅", station_6: "品川駅" },
            { id: 2, office_name: "大阪事業所", office_code: "OFF002", station_1: "大阪駅", station_2: "梅田駅", station_3: "難波駅", station_4: "天王寺駅", station_5: "新大阪駅", station_6: "京橋駅" }
          ]
          setError("事業所データの取得に失敗しました。モックデータを表示しています。")
        }
      } catch (error) {
        console.error("事業所データの取得エラー:", error)
        // モックデータを使用
        offices = [
          { id: 1, office_name: "東京事業所", office_code: "OFF001", station_1: "東京駅", station_2: "新宿駅", station_3: "渋谷駅", station_4: "池袋駅", station_5: "上野駅", station_6: "品川駅" },
          { id: 2, office_name: "大阪事業所", office_code: "OFF002", station_1: "大阪駅", station_2: "梅田駅", station_3: "難波駅", station_4: "天王寺駅", station_5: "新大阪駅", station_6: "京橋駅" }
        ]
        setError("事業所データの取得に失敗しました。モックデータを表示しています。")
      }

      // データベースから車両を読み込み
      let vehicles: any[] = []
      try {
        const vehiclesResponse = await fetch("/api/vehicles")
        if (vehiclesResponse.ok) {
          const vehicleData = await vehiclesResponse.json()
          const vehicles = vehicleData.map((vehicle: any) => ({
            id: vehicle.id,
            name: vehicle.vehicle_type,
            model: vehicle.model,
            base_location: vehicle.base_location || vehicle.base_name || "",
            machine_number: vehicle.machine_number,
            manufacturer: vehicle.manufacturer,
            acquisition_date: vehicle.acquisition_date,
            management_office: vehicle.office_name || vehicle.management_office,
            management_office_id: vehicle.management_office_id,
            created_at: vehicle.created_at,
            updated_at: vehicle.updated_at,
          }))
        } else {
          console.error("車両の取得に失敗しました:", vehiclesResponse.status, vehiclesResponse.statusText)
          // モックデータを使用
          vehicles = [
            { id: 1, name: "モータカー", model: "MC-100", base_location: "東京基地", machine_number: "MC001", manufacturer: "日立", acquisition_date: "2020-01-01", management_office: "東京事業所", management_office_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: 2, name: "MCR", model: "MC-150", base_location: "東京基地", machine_number: "MC002", manufacturer: "日立", acquisition_date: "2020-02-01", management_office: "東京事業所", management_office_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: 3, name: "鉄トロ（10t）", model: "TT-200", base_location: "大阪基地", machine_number: "TT001", manufacturer: "川崎", acquisition_date: "2020-03-01", management_office: "大阪事業所", management_office_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: 4, name: "鉄トロ（15t）", model: "TT-250", base_location: "大阪基地", machine_number: "TT002", manufacturer: "川崎", acquisition_date: "2020-04-01", management_office: "大阪事業所", management_office_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: 5, name: "箱トロ", model: "HP-300", base_location: "名古屋基地", machine_number: "HP001", manufacturer: "三菱", acquisition_date: "2020-05-01", management_office: "東京事業所", management_office_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: 6, name: "ホッパー車", model: "HP-350", base_location: "名古屋基地", machine_number: "HP002", manufacturer: "三菱", acquisition_date: "2020-06-01", management_office: "東京事業所", management_office_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          ]
          setError("車両データの取得に失敗しました。モックデータを表示しています。")
        }
      } catch (error) {
        console.error("車両データの取得エラー:", error)
        // モックデータを使用
        vehicles = [
          { id: 1, name: "モータカー", model: "MC-100", base_location: "東京基地", machine_number: "MC001", manufacturer: "日立", acquisition_date: "2020-01-01", management_office: "東京事業所", management_office_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 2, name: "MCR", model: "MC-150", base_location: "東京基地", machine_number: "MC002", manufacturer: "日立", acquisition_date: "2020-02-01", management_office: "東京事業所", management_office_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 3, name: "鉄トロ（10t）", model: "TT-200", base_location: "大阪基地", machine_number: "TT001", manufacturer: "川崎", acquisition_date: "2020-03-01", management_office: "大阪事業所", management_office_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 4, name: "鉄トロ（15t）", model: "TT-250", base_location: "大阪基地", machine_number: "TT002", manufacturer: "川崎", acquisition_date: "2020-04-01", management_office: "大阪事業所", management_office_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 5, name: "箱トロ", model: "HP-300", base_location: "名古屋基地", machine_number: "HP001", manufacturer: "三菱", acquisition_date: "2020-05-01", management_office: "東京事業所", management_office_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 6, name: "ホッパー車", model: "HP-350", base_location: "名古屋基地", machine_number: "HP002", manufacturer: "三菱", acquisition_date: "2020-06-01", management_office: "東京事業所", management_office_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ]
        setError("車両データの取得に失敗しました。モックデータを表示しています。")
      }

      // データベースから運用計画を読み込み
      let operationPlans: any[] = []
      try {
        const plansResponse = await fetch(`/api/operation-plans?month=${currentMonth}`)
        if (plansResponse.ok) {
          operationPlans = await plansResponse.json()
        } else {
          console.error("運用計画の取得に失敗しました:", plansResponse.status, plansResponse.statusText)
          // 運用計画は必須ではないのでエラーを設定しない
        }
      } catch (error) {
        console.error("運用計画データの取得エラー:", error)
        // 運用計画は必須ではないのでエラーを設定しない
      }

      // データが取得できた場合のみ状態を更新
      if (bases.length > 0 || offices.length > 0 || vehicles.length > 0) {
        setAllVehicles(vehicles)
        setAllBases(bases)
        setAllOffices(offices)
        setOperationAssignments(operationPlans)
        
        // デバッグ情報を出力
        console.log("データ取得結果:", {
          bases: bases.length,
          offices: offices.length,
          vehicles: vehicles.length,
          operationPlans: operationPlans.length
        })
      } else {
        setError("マスタデータが取得できませんでした。データベース接続とデータの存在を確認してください。")
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("データの取得に失敗しました。")
    } finally {
      setLoading(false)
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
      const officeId = Number.parseInt(selectedOfficeId)
      vehicles = vehicles.filter((vehicle) => vehicle.management_office_id === officeId)
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
  }, [allVehicles, selectedOfficeId, selectedVehicleType, selectedMachineNumber])

  // 事業所でフィルタリングされた基地を取得
  const filteredBases = useMemo(() => {
    let bases = allBases

    // 事業所でフィルタリング
    if (selectedOfficeId !== "all") {
      const officeId = Number.parseInt(selectedOfficeId)
      bases = bases.filter((base) => base.management_office_id === officeId)
    }

    return bases
  }, [allBases, selectedOfficeId])

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

  // 特定の日付、車両、基地の運用割り当てを取得
  const getAssignment = (date: string, vehicleId: number, baseId: number): OperationAssignment | undefined => {
    return operationAssignments.find(
      (assignment) => assignment.date === date && assignment.vehicle_id === vehicleId && assignment.base_id === baseId,
    )
  }

  // 移動情報を取得（前日の移動による表示用）
  const getMovementInfo = (date: string, vehicleId: number, baseId: number) => {
    const prevDate = getPreviousDate(date)
    if (!prevDate) return null

    const prevAssignment = operationAssignments.find(
      (assignment) => assignment.date === prevDate && assignment.vehicle_id === vehicleId
    )

    if (prevAssignment && prevAssignment.arrival_base_id === baseId && prevAssignment.arrival_base_id !== prevAssignment.base_id) {
      return prevAssignment
    }

    return null
  }

  // 前日の日付を取得
  const getPreviousDate = (dateString: string) => {
    const date = new Date(dateString)
    date.setDate(date.getDate() - 1)

    // 月をまたぐ場合は null を返す（簡易版）
    if (date.getMonth() !== new Date(dateString).getMonth()) {
      return null
    }

    return date.toISOString().slice(0, 10)
  }

  // 留置期間かどうかをチェック
  const checkDetentionPeriod = (date: string, vehicleId: number, baseId: number): boolean => {
    const assignments = operationAssignments
      .filter(a => a.vehicle_id === vehicleId && a.date <= date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (assignments.length === 0) return false

    const lastAssignment = assignments[0]
    
    // 最後の運用が留置の場合、その後の運用がない期間を留置期間とする
    if (lastAssignment.is_detention && lastAssignment.base_id === baseId) {
      const nextOperation = operationAssignments
        .filter(a => a.vehicle_id === vehicleId && a.date > date && a.shift_type !== null && a.shift_type !== "none")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

      // 次の運用がない場合、または次の運用がまだ入力されていない場合
      return !nextOperation
    }

    return false
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
      case "昼間":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "夜間":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "昼夜":
        return "bg-purple-100 text-purple-800 border-purple-300"
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
          <h2 className="text-2xl font-bold">運用計画チャート</h2>
          <Badge className={`${monthInfo.bgColor} ${monthInfo.color} border-0`}>
            <MonthIcon className="w-4 h-4 mr-1" />
            {monthInfo.label}
          </Badge>
        </div>
        <div className="flex items-center space-x-4">
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

      {/* 運用計画マトリックスチャート（結果表示専用） */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>{currentMonth} 運用計画チャート</span>
            <Badge variant="outline" className={monthInfo.color}>
              {monthInfo.label}表示
            </Badge>
          </CardTitle>
          <div className="text-sm text-gray-600">
            運用計画の結果を表示します。水色は留置期間、矢印は移動先を示します。
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-50 text-center min-w-16 sticky left-0 z-10">日付</th>
                  <th className="border p-2 bg-gray-50 text-center min-w-12 sticky left-16 z-10">曜日</th>
                  <th className="border p-2 bg-blue-50 text-center min-w-20">機種</th>
                  <th className="border p-2 bg-blue-50 text-center min-w-20">機械番号</th>
                  {filteredBases.map((base) => (
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
                          className={`border p-2 text-center font-medium sticky left-0 z-10 ${
                            isToday ? "bg-yellow-100" : "bg-gray-50"
                          }`}
                          rowSpan={vehicleRows.length}
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

                      {/* 基地セル（結果表示専用） */}
                      {filteredBases.map((base) => {
                        const assignment = getAssignment(dateString, row.vehicle.id, base.id)
                        const isDetentionPeriod = checkDetentionPeriod(dateString, row.vehicle.id, base.id)
                        const hasMovement = assignment?.arrival_base_id && assignment.arrival_base_id !== assignment.base_id
                        const movementFromPrevDay = getMovementInfo(dateString, row.vehicle.id, base.id)

                        return (
                          <td 
                            key={base.id} 
                            className={`border p-1 ${
                              isDetentionPeriod ? 'bg-blue-100' : ''
                            }`}
                          >
                            {assignment ? (
                              <div className="space-y-1">
                                <div className={`text-xs px-1 py-0.5 rounded ${getShiftTypeColor(assignment.shift_type || "")}`}>
                                  {assignment.shift_type}
                                </div>
                                
                                {/* 移動矢印の表示（基地名のみ） */}
                                {hasMovement && (
                                  <div className="text-xs text-blue-600 font-medium">
                                    <div className="flex items-center space-x-1">
                                      <ArrowRight className="w-3 h-3" />
                                      <span>{allBases.find(b => b.id === assignment.arrival_base_id)?.base_name}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* 留置表示 */}
                                {assignment.is_detention && (
                                  <div className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                    留置
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                {/* 前日の移動による表示 */}
                                {movementFromPrevDay && (
                                  <div className="text-xs text-blue-600 font-medium">
                                    <div className="flex items-center space-x-1">
                                      <ArrowRight className="w-3 h-3" />
                                      <span>{allBases.find(b => b.id === movementFromPrevDay.arrival_base_id)?.base_name}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}