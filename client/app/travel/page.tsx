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
  MapPin,
  Home,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import type { Vehicle, Base, ManagementOffice, OperationAssignment, VehicleStayover } from "@/types"
import { OperationAssignmentLegend } from "@/components/operation-assignment-legend"

// 静的生成を無効化
export const dynamic = 'force-dynamic'

// データベース設定の確認
const isDatabaseConfigured = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_DATABASE_URL || process.env.DATABASE_URL)
}

// 固定の機種表示順
const VEHICLE_TYPE_ORDER = ["モータカー", "MCR", "鉄トロ", "箱トロ", "ホッパー車"]

export default function TravelPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [allBases, setAllBases] = useState<Base[]>([])
  const [allOffices, setAllOffices] = useState<ManagementOffice[]>([])
  const [operationAssignments, setOperationAssignments] = useState<OperationAssignment[]>([])
  const [vehicleStayovers, setVehicleStayovers] = useState<VehicleStayover[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // フィルター状態
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("all")
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("all")
  const [selectedMachineNumber, setSelectedMachineNumber] = useState<string>("all")

  // ダイアログ状態
  const [isReturnBaseDialogOpen, setIsReturnBaseDialogOpen] = useState(false)
  const [pendingAssignment, setPendingAssignment] = useState<{
    date: string
    vehicleId: number
    baseId: number
    shiftType: "昼間" | "夜間" | "昼夜"
  } | null>(null)
  const [selectedReturnBaseId, setSelectedReturnBaseId] = useState<string>("")

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

      // モックデータ
      const mockVehicles: Vehicle[] = [
        // モータカー
        {
          id: 1,
          name: "モータカー",
          model: "MC-100",
          base_location: "本社基地",
          machine_number: "MC-100",
          manufacturer: "メーカーA",
          acquisition_date: "2020-04-01",
          management_office: "本社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          name: "モータカー",
          model: "MC-200",
          base_location: "本社基地",
          machine_number: "MC-200",
          manufacturer: "メーカーA",
          acquisition_date: "2020-05-01",
          management_office: "本社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 3,
          name: "モータカー",
          model: "MC-300",
          base_location: "関西基地",
          machine_number: "MC-300",
          manufacturer: "メーカーA",
          acquisition_date: "2020-06-01",
          management_office: "関西支社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 4,
          name: "モータカー",
          model: "MC-400",
          base_location: "関西基地",
          machine_number: "MC-400",
          manufacturer: "メーカーA",
          acquisition_date: "2020-07-01",
          management_office: "関西支社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        // 鉄トロ
        {
          id: 5,
          name: "鉄トロ",
          model: "T-001",
          base_location: "本社基地",
          machine_number: "T-001",
          manufacturer: "メーカーB",
          acquisition_date: "2021-03-01",
          management_office: "本社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 6,
          name: "鉄トロ",
          model: "T-002",
          base_location: "本社基地",
          machine_number: "T-002",
          manufacturer: "メーカーB",
          acquisition_date: "2021-04-01",
          management_office: "本社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 7,
          name: "鉄トロ",
          model: "T-003",
          base_location: "関西基地",
          machine_number: "T-003",
          manufacturer: "メーカーB",
          acquisition_date: "2021-05-01",
          management_office: "関西支社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 8,
          name: "鉄トロ",
          model: "T-004",
          base_location: "関西基地",
          machine_number: "T-004",
          manufacturer: "メーカーB",
          acquisition_date: "2021-06-01",
          management_office: "関西支社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        // 箱トロ
        {
          id: 9,
          name: "箱トロ",
          model: "BT-001",
          base_location: "本社基地",
          machine_number: "BT-001",
          manufacturer: "メーカーC",
          acquisition_date: "2022-01-01",
          management_office: "本社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 10,
          name: "箱トロ",
          model: "BT-002",
          base_location: "関西基地",
          machine_number: "BT-002",
          manufacturer: "メーカーC",
          acquisition_date: "2022-02-01",
          management_office: "関西支社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        // ホッパー車
        {
          id: 11,
          name: "ホッパー車",
          model: "HT-001",
          base_location: "本社基地",
          machine_number: "HT-001",
          manufacturer: "メーカーD",
          acquisition_date: "2022-03-01",
          management_office: "本社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 12,
          name: "ホッパー車",
          model: "HT-002",
          base_location: "関西基地",
          machine_number: "HT-002",
          manufacturer: "メーカーD",
          acquisition_date: "2022-04-01",
          management_office: "関西支社保守事業所",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]

      const mockBases: Base[] = [
        {
          id: 1,
          base_name: "○○基地",
          location: "東京",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          base_name: "○○基地",
          location: "大阪",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 3,
          base_name: "○○基地",
          location: "福岡",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 4,
          base_name: "○○基地",
          location: "札幌",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 5,
          base_name: "○○基地",
          location: "仙台",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 6,
          base_name: "○○基地",
          location: "名古屋",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 7,
          base_name: "○○基地",
          location: "広島",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 8,
          base_name: "○○基地",
          location: "金沢",
          created_at: "2024-01-01T00:00:00Z",
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

      // サンプル運用割り当てデータ
      const mockOperationAssignments: OperationAssignment[] = [
        // 例：1日に東京基地を出発し夜間に移動し、2日に大阪基地へ入る
        {
          id: 1,
          date: `${currentMonth}-01`,
          vehicle_id: 1, // MC-100
          base_id: 1, // 東京基地
          shift_type: "夜間",
          return_base_id: 2, // 大阪基地
        },
        // 2日の大阪基地での追加運用（昼間）
        {
          id: 3,
          date: `${currentMonth}-02`,
          vehicle_id: 1, // MC-100
          base_id: 2, // 大阪基地
          shift_type: "昼間",
          return_base_id: 2, // 同じ基地に戻る
        },
        // MC-200が1日に福岡基地で夜間運用（同じ基地に留置）
        {
          id: 6,
          date: `${currentMonth}-01`,
          vehicle_id: 2, // MC-200
          base_id: 3, // 福岡基地
          shift_type: "夜間",
          return_base_id: 3, // 同じ福岡基地に戻る
        },
        // その他のサンプルデータ
        {
          id: 5,
          date: `${currentMonth}-05`,
          vehicle_id: 3,
          base_id: 3,
          shift_type: "昼夜",
          return_base_id: 1,
        },
      ]

      // 留置状態データ
      const mockVehicleStayovers: VehicleStayover[] = [
        // MC-100が1日の夜間作業により2日に大阪基地に留置
        {
          id: 1,
          date: `${currentMonth}-02`,
          vehicle_id: 1, // MC-100
          base_id: 2, // 大阪基地
          from_date: `${currentMonth}-01`,
          from_shift_type: "夜間",
        },
        // MC-200が1日の夜間作業により2日に福岡基地に留置（同じ基地）
        {
          id: 2,
          date: `${currentMonth}-02`,
          vehicle_id: 2, // MC-200
          base_id: 3, // 福岡基地
          from_date: `${currentMonth}-01`,
          from_shift_type: "夜間",
        },
        // MC-300が5日の昼夜作業により6日に東京基地に留置
        {
          id: 3,
          date: `${currentMonth}-06`,
          vehicle_id: 3, // MC-300
          base_id: 1, // 東京基地
          from_date: `${currentMonth}-05`,
          from_shift_type: "昼夜",
        },
      ]

      setAllVehicles(mockVehicles)
      setAllBases(mockBases)
      setAllOffices(mockOffices)
      setOperationAssignments(mockOperationAssignments)
      setVehicleStayovers(mockVehicleStayovers)
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

  // 機械番号の選択肢を取得
  const machineNumberOptions = useMemo(() => {
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

    const machineNumbers = Array.from(new Set(vehicles.map((v) => v.machine_number))).sort()
    return machineNumbers
  }, [allVehicles, selectedOfficeId, selectedVehicleType, allOffices])

  // 特定の日付、車両、基地の運用割り当てを取得
  const getAssignment = (date: string, vehicleId: number, baseId: number) => {
    return operationAssignments.find(
      (assignment) => assignment.date === date && assignment.vehicle_id === vehicleId && assignment.base_id === baseId,
    )
  }

  // 特定の日付、車両、基地の留置状態を取得
  const getStayover = (date: string, vehicleId: number, baseId: number) => {
    return vehicleStayovers.find(
      (stayover) => stayover.date === date && stayover.vehicle_id === vehicleId && stayover.base_id === baseId,
    )
  }

  // 同じ基地への留置かどうかを判定
  const isSameBaseStayover = (stayover: VehicleStayover) => {
    const originalAssignment = operationAssignments.find(
      (assignment) =>
        assignment.date === stayover.from_date &&
        assignment.vehicle_id === stayover.vehicle_id &&
        assignment.return_base_id === stayover.base_id,
    )
    return originalAssignment && originalAssignment.base_id === originalAssignment.return_base_id
  }

  // 前回の運用での最終留置基地を取得する関数
  const getLastOperationFinalLocation = (date: string, vehicleId: number): number | null => {
    const currentDate = new Date(date)

    // 過去の運用を日付順で取得（降順）
    const pastAssignments = operationAssignments
      .filter((assignment) => {
        const assignmentDate = new Date(assignment.date)
        return assignmentDate < currentDate && assignment.vehicle_id === vehicleId
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (pastAssignments.length === 0) {
      return null
    }

    const lastAssignment = pastAssignments[0]

    // 夜間・昼夜の場合は帰着基地、それ以外は出発基地
    if (lastAssignment.shift_type === "夜間" || lastAssignment.shift_type === "昼夜") {
      return lastAssignment.return_base_id || lastAssignment.base_id
    } else {
      return lastAssignment.base_id
    }
  }

  // 基地移動の整合性をチェックする関数
  const checkLocationConsistency = (
    date: string,
    vehicleId: number,
    selectedBaseId: number,
  ): {
    isValid: boolean
    lastLocation?: string
  } => {
    const lastLocationId = getLastOperationFinalLocation(date, vehicleId)

    if (lastLocationId === null || lastLocationId === selectedBaseId) {
      return { isValid: true }
    }

    const lastBase = allBases.find((b) => b.id === lastLocationId)

    return {
      isValid: false,
      lastLocation: lastBase?.location || "不明",
    }
  }

  // 車両の現在位置を取得する関数
  const getVehicleCurrentLocation = (date: string, vehicleId: number): number | null => {
    const currentDate = new Date(date)

    // 当日の留置状態を確認
    const todayStayover = vehicleStayovers.find(
      (stayover) => stayover.date === date && stayover.vehicle_id === vehicleId,
    )
    if (todayStayover) {
      return todayStayover.base_id
    }

    // 過去の運用から最終位置を取得
    return getLastOperationFinalLocation(date, vehicleId)
  }

  // セルが車両の現在位置かどうかを判定
  const isVehicleCurrentLocation = (date: string, vehicleId: number, baseId: number): boolean => {
    const currentLocation = getVehicleCurrentLocation(date, vehicleId)
    return currentLocation === baseId
  }

  // 運用割り当てを更新
  const updateAssignment = (
    date: string,
    vehicleId: number,
    baseId: number,
    shiftType: "昼間" | "夜間" | "昼夜" | null,
  ) => {
    if (shiftType === null) {
      // 削除の場合は直接処理
      processAssignment(date, vehicleId, baseId, null, undefined)
      return
    }

    // 基地移動の整合性をチェック
    const consistencyCheck = checkLocationConsistency(date, vehicleId, baseId)

    if (!consistencyCheck.isValid) {
      // 整合性エラーがある場合は処理を中止
      return
    }

    // 昼間・夜間・昼夜すべてで帰着基地選択ダイアログを表示
    setPendingAssignment({ date, vehicleId, baseId, shiftType })
    setIsReturnBaseDialogOpen(true)
  }

  // 運用割り当てを実際に処理
  const processAssignment = (
    date: string,
    vehicleId: number,
    baseId: number,
    shiftType: "昼間" | "夜間" | "昼夜" | null,
    returnBaseId?: number,
  ) => {
    const existingIndex = operationAssignments.findIndex(
      (assignment) => assignment.date === date && assignment.vehicle_id === vehicleId && assignment.base_id === baseId,
    )

    const newAssignments = [...operationAssignments]
    const newStayovers = [...vehicleStayovers]

    if (shiftType === null) {
      // 削除
      if (existingIndex >= 0) {
        const assignment = newAssignments[existingIndex]
        newAssignments.splice(existingIndex, 1)

        // 夜間・昼夜の場合、翌日の留置状態も削除
        if ((assignment.shift_type === "夜間" || assignment.shift_type === "昼夜") && assignment.return_base_id) {
          const nextDate = getNextDate(date)
          if (nextDate) {
            const stayoverIndex = newStayovers.findIndex(
              (s) =>
                s.date === nextDate &&
                s.vehicle_id === vehicleId &&
                s.base_id === assignment.return_base_id &&
                s.from_date === date,
            )
            if (stayoverIndex >= 0) {
              newStayovers.splice(stayoverIndex, 1)
            }
          }
        }
      }
    } else {
      // 追加または更新
      const newAssignment: OperationAssignment = {
        id: existingIndex >= 0 ? newAssignments[existingIndex].id : Date.now(),
        date,
        vehicle_id: vehicleId,
        base_id: baseId,
        shift_type: shiftType,
        return_base_id: returnBaseId,
      }

      if (existingIndex >= 0) {
        newAssignments[existingIndex] = newAssignment
      } else {
        newAssignments.push(newAssignment)
      }

      // 夜間・昼夜の場合のみ、翌日に留置状態を追加
      if ((shiftType === "夜間" || shiftType === "昼夜") && returnBaseId) {
        const nextDate = getNextDate(date)
        if (nextDate) {
          // 既存の翌日留置エントリを削除
          const existingStayoverIndex = newStayovers.findIndex(
            (stayover) =>
              stayover.date === nextDate &&
              stayover.vehicle_id === vehicleId &&
              stayover.base_id === returnBaseId &&
              stayover.from_date === date,
          )

          const newStayover: VehicleStayover = {
            id: existingStayoverIndex >= 0 ? newStayovers[existingStayoverIndex].id : Date.now() + 1000,
            date: nextDate,
            vehicle_id: vehicleId,
            base_id: returnBaseId,
            from_date: date,
            from_shift_type: shiftType,
          }

          if (existingStayoverIndex >= 0) {
            newStayovers[existingStayoverIndex] = newStayover
          } else {
            newStayovers.push(newStayover)
          }
        }
      }
    }

    setOperationAssignments(newAssignments)
    setVehicleStayovers(newStayovers)
  }

  // 帰着基地選択の確定
  const handleReturnBaseConfirm = () => {
    if (pendingAssignment && selectedReturnBaseId) {
      processAssignment(
        pendingAssignment.date,
        pendingAssignment.vehicleId,
        pendingAssignment.baseId,
        pendingAssignment.shiftType,
        Number.parseInt(selectedReturnBaseId),
      )
    }
    setIsReturnBaseDialogOpen(false)
    setPendingAssignment(null)
    setSelectedReturnBaseId("")
  }

  // 翌日の日付を取得
  const getNextDate = (dateString: string) => {
    const date = new Date(dateString)
    date.setDate(date.getDate() + 1)

    // 月をまたぐ場合は null を返す（簡易版）
    if (date.getMonth() !== new Date(dateString).getMonth()) {
      return null
    }

    return date.toISOString().slice(0, 10)
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
      case "夜翌":
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
          <h2 className="text-2xl font-bold">運用計画</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  {machineNumberOptions.map((machineNumber) => (
                    <SelectItem key={machineNumber} value={machineNumber}>
                      {machineNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters} className="w-full bg-transparent">
                検索リセット
              </Button>
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
          </div>
        </CardContent>
      </Card>

      {/* 運用区分の説明 */}
      <OperationAssignmentLegend />

      {/* 運用計画マトリックス */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>{currentMonth} 運用計画</span>
            <Badge variant="outline" className={monthInfo.color}>
              {monthInfo.label}表示
            </Badge>
          </CardTitle>
          <div className="text-sm text-gray-600">
            日付×機種×機械番号×基地名のマトリックス形式で運用計画を管理します。セルをクリックして運用区分を選択できます。
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-50 text-center min-w-16 sticky left-0 z-20">日付</th>
                  <th className="border p-2 bg-gray-50 text-center min-w-12 sticky left-16 z-20">曜日</th>
                  <th className="border p-2 bg-blue-50 text-center min-w-20 sticky left-28 z-10">機種</th>
                  <th className="border p-2 bg-blue-50 text-center min-w-20 sticky left-48 z-10">機械番号</th>
                  {allBases.map((base, index) => (
                    <th key={`${base.id}-${index % 3}`} className="border p-2 bg-green-50 text-center min-w-24">
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
                          className={`border p-2 text-center font-medium sticky left-0 z-20 ${
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
                          className={`border p-2 text-center text-sm sticky left-16 z-20 ${
                            isWeekend ? "text-red-600 font-medium" : "text-gray-600"
                          } ${isToday ? "bg-yellow-100" : "bg-gray-50"}`}
                          rowSpan={vehicleRows.length}
                        >
                          {dayOfWeek}
                        </td>
                      )}

                      {/* 機種セル */}
                      {row.isFirstOfType && (
                        <td
                          className="border p-2 text-center font-medium bg-blue-50 sticky left-28 z-10"
                          rowSpan={row.typeCount}
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <Car className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold">{row.vehicleType}</span>
                          </div>
                        </td>
                      )}

                      {/* 機械番号セル */}
                      <td className="border p-2 text-center font-medium bg-blue-50 sticky left-48 z-10">
                        <div className="text-sm font-semibold">{row.vehicle.machine_number}</div>
                      </td>

                      {/* 基地セル（3列ずつ） */}
                      {allBases.map((base) => {
                        const assignment = getAssignment(dateString, row.vehicle.id, base.id)
                        const stayover = getStayover(dateString, row.vehicle.id, base.id)
                        const isSameBase = stayover && isSameBaseStayover(stayover)

                        // 位置整合性チェック（運用が選択されている場合のみ）
                        const consistencyCheck = checkLocationConsistency(dateString, row.vehicle.id, base.id)
                        const hasLocationWarning = assignment && !consistencyCheck.isValid

                        // 車両の現在位置かどうかを判定
                        const isCurrentLocation = isVehicleCurrentLocation(dateString, row.vehicle.id, base.id)

                        return (
                          <td key={base.id} className={`border p-1 ${isCurrentLocation ? "bg-cyan-50" : ""}`}>
                            {/* 位置整合性警告（運用が選択されている場合のみ） */}
                            {hasLocationWarning && (
                              <div className="bg-red-50 border border-red-200 rounded p-1 mb-1">
                                <div className="flex items-center justify-center">
                                  <AlertCircle className="w-3 h-3 text-red-600 mr-1" />
                                  <span className="text-xs text-red-600 font-medium">基地不整合</span>
                                </div>
                                <div className="text-xs text-red-600 text-center mt-1">
                                  前回: {consistencyCheck.lastLocation}
                                </div>
                              </div>
                            )}

                            {/* 留置状態がある場合は背景を薄いオレンジにする（同じ基地の場合は薄く） */}
                            <div
                              className={
                                stayover
                                  ? isSameBase
                                    ? "bg-orange-25 p-1 rounded mb-1"
                                    : "bg-orange-50 p-1 rounded mb-1"
                                  : ""
                              }
                            >
                              {/* 留置状態の表示 */}
                              {stayover && (
                                <div className="space-y-1 mb-2">
                                  {isSameBase ? (
                                    // 同じ基地への留置の場合はアイコンのみ
                                    <div className="flex items-center justify-center">
                                      <Home className="w-4 h-4 text-orange-600" />
                                    </div>
                                  ) : (
                                    // 異なる基地への留置の場合は従来通り
                                    <>
                                      <div className="flex items-center justify-center">
                                        <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-xs">
                                          留置
                                        </Badge>
                                      </div>
                                      <div className="flex items-center justify-center">
                                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                                          <Home className="w-3 h-3" />
                                          <span>前日から</span>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* 運用選択 */}
                              <Select
                                value={assignment?.shift_type || "none"}
                                onValueChange={(value) =>
                                  updateAssignment(
                                    dateString,
                                    row.vehicle.id,
                                    base.id,
                                    value === "none" ? null : (value as "昼間" | "夜間" | "昼夜"),
                                  )
                                }
                                disabled={hasLocationWarning}
                              >
                                <SelectTrigger
                                  className={`h-8 text-xs border-0 bg-transparent ${
                                    hasLocationWarning ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">なし</SelectItem>
                                  <SelectItem value="昼間">昼間</SelectItem>
                                  <SelectItem value="夜間">夜間</SelectItem>
                                  <SelectItem value="昼夜">昼夜</SelectItem>
                                </SelectContent>
                              </Select>

                              {/* 運用表示 */}
                              {assignment && (
                                <div className="space-y-1 mt-1">
                                  <div
                                    className={`text-xs px-2 py-1 rounded text-center font-medium ${getShiftTypeColor(assignment.shift_type || "")}`}
                                  >
                                    {assignment.shift_type}
                                  </div>
                                  {assignment.return_base_id &&
                                    assignment.shift_type !== "夜翌" &&
                                    assignment.base_id !== assignment.return_base_id && (
                                      <div className="flex items-center justify-center">
                                        <div className="flex items-center space-x-1 text-xs text-gray-600 bg-gray-50 px-1 py-0.5 rounded">
                                          <MapPin className="w-3 h-3" />
                                          <span>
                                            →{allBases.find((b) => b.id === assignment.return_base_id)?.location}
                                          </span>
                                        </div>
                                      </div>
                                    )}
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
        </CardContent>
      </Card>

      {/* 帰着基地選択ダイアログ */}
      <Dialog open={isReturnBaseDialogOpen} onOpenChange={setIsReturnBaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>帰着基地を選択してください</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {pendingAssignment && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="font-medium">選択中の運用区分: {pendingAssignment.shiftType}</div>
                  <div className="text-xs mt-1">
                    日付: {pendingAssignment.date} | 車両:{" "}
                    {allVehicles.find((v) => v.id === pendingAssignment.vehicleId)?.machine_number} | 基地:{" "}
                    {allBases.find((b) => b.id === pendingAssignment.baseId)?.location}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>帰着基地</Label>
              <Select value={selectedReturnBaseId} onValueChange={setSelectedReturnBaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="帰着基地を選択" />
                </SelectTrigger>
                <SelectContent>
                  {allBases.map((base) => (
                    <SelectItem key={base.id} value={base.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {base.base_name} ({base.location})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsReturnBaseDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleReturnBaseConfirm} disabled={!selectedReturnBaseId}>
                確定
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
