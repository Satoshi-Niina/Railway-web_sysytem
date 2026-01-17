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
  Edit,
  Save,
  Trash2,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import Link from "next/link"

import type { Vehicle, Base, ManagementOffice, OperationPlan, OperationRecord, Inspection, Office } from "@/types"
import { apiCall, isDatabaseConfigured } from "@/lib/api-client"
import { exportOperationPlanToA3Excel } from "@/lib/excel-export"

// 検修タイプの型定義
interface InspectionType {
  id: number
  type_name: string
  category: string
  interval_days?: number
  description?: string
}

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
  const [inspectionTypes, setInspectionTypes] = useState<InspectionType[]>([])
  const [masterMachineTypes, setMasterMachineTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 実績編集モーダル
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<OperationRecord | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<OperationPlan | null>(null)
  const [selectedBaseId, setSelectedBaseId] = useState<number | null>(null) // クリックしたセルの基地ID
  const [departureConflict, setDepartureConflict] = useState<string | null>(null)
  const [arrivalConflict, setArrivalConflict] = useState<string | null>(null)
  const [recordForm, setRecordForm] = useState({
    vehicle_id: "",
    record_date: "",
    shift_type: "day",
    start_time: "08:00",
    end_time: "17:00",
    actual_distance: 0,
    departure_base_id: "none",
    arrival_base_id: "none",
    status: "completed",
    notes: "",
    is_as_planned: false,
  })

  // 検修完了登録フォーム
  const [inspectionForm, setInspectionForm] = useState({
    vehicle_id: "",
    completion_date: new Date().toISOString().slice(0, 10),
  })

  // フィルター状態
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("all")
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([])
  const [selectedMachineNumbers, setSelectedMachineNumbers] = useState<string[]>([])
  const [selectedDates, setSelectedDates] = useState<string[]>([])

  const currentDateObj = new Date()
  const selectedMonthDate = new Date(currentMonth + "-01")
  const isCurrentMonth = currentMonth === currentDateObj.toISOString().slice(0, 7)
  const isPastMonth = selectedMonthDate < new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), 1)
  const isFutureMonth = selectedMonthDate > new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), 1)

  // 事業所フィルターが変更されたとき、機種と機械番号の選択をクリア
  useEffect(() => {
    setSelectedVehicleTypes([])
    setSelectedMachineNumbers([])
  }, [selectedOfficeId])

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  // ==================== 留置基地追跡関数 ====================
  
  // 車両の最終留置基地を取得（計画と実績の両方を考慮）
  const getLastDetentionBase = (vehicleId: number, beforeDate: string, excludeRecordId?: number): number | null => {
    // 実績データから最後の到着基地を取得（実績優先）
    const records = operationRecords
      .filter(r => {
        const rDate = typeof r.record_date === 'string' ? r.record_date.split('T')[0] : r.record_date
        // その日の最新の場所を知りたいため、指定日当日までの実績を考慮
        const isBeforeOrToday = rDate <= beforeDate
        // 編集中の実績は除外する
        const isNotCurrent = !excludeRecordId || r.id !== excludeRecordId
        return String(r.vehicle_id) === String(vehicleId) && isBeforeOrToday && isNotCurrent && r.arrival_base_id
      })
      .sort((a, b) => {
        const aDate = typeof a.record_date === 'string' ? a.record_date.split('T')[0] : a.record_date
        const bDate = typeof b.record_date === 'string' ? b.record_date.split('T')[0] : b.record_date
        
        if (aDate === bDate) {
          // 同日の場合は終了時刻でソート
          const aTime = a.actual_end_time || a.end_time || "00:00"
          const bTime = b.actual_end_time || b.end_time || "00:00"
          return bTime.localeCompare(aTime)
        }
        return bDate.localeCompare(aDate)
      })

    if (records.length > 0 && records[0].arrival_base_id) {
      return records[0].arrival_base_id
    }

    // 実績がない場合は計画から取得（翌日またぎを考慮）
    const plans = operationPlans
      .filter(p => {
        const pDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
        // その日の開始時点の場所を知りたいため、前日までに「開始」された計画を対象とする
        // これにより、前日開始・当日到着の夜間作業も含まれる
        return String(p.vehicle_id) === String(vehicleId) && pDate < beforeDate && p.arrival_base_id
      })
      .sort((a, b) => {
        // 実際の到着日でソート
        const aArrivalDate = a.end_date 
          ? (typeof a.end_date === 'string' ? a.end_date.split('T')[0] : a.end_date)
          : (typeof a.plan_date === 'string' ? a.plan_date.split('T')[0] : a.plan_date)
        const bArrivalDate = b.end_date 
          ? (typeof b.end_date === 'string' ? b.end_date.split('T')[0] : b.end_date)
          : (typeof b.plan_date === 'string' ? b.plan_date.split('T')[0] : b.plan_date)
        
        // 到着日が新しい順
        if (aArrivalDate === bArrivalDate) {
          const aTime = a.end_time || "00:00"
          const bTime = b.end_time || "00:00"
          return bTime.localeCompare(aTime)
        }
        return bArrivalDate.localeCompare(aArrivalDate)
      })

    // デバッグ: 候補の計画を全て表示
    if (plans.length > 0) {
      console.log(`[留置基地] 車両${vehicleId}, ${beforeDate}以前の計画候補:`, plans.map(p => {
        const pDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
        const arrivalDate = p.end_date 
          ? (typeof p.end_date === 'string' ? p.end_date.split('T')[0] : p.end_date)
          : pDate
        return `開始${pDate} 到着${arrivalDate} ${p.end_time}: 基地${p.arrival_base_id}`
      }))
    }

    if (plans.length > 0 && plans[0].arrival_base_id) {
      const pDate = typeof plans[0].plan_date === 'string' ? plans[0].plan_date.split('T')[0] : plans[0].plan_date
      const arrivalDate = plans[0].end_date 
        ? (typeof plans[0].end_date === 'string' ? plans[0].end_date.split('T')[0] : plans[0].end_date)
        : pDate
      const baseName = allBases.find(b => b.id === plans[0].arrival_base_id)?.base_name
      console.log(`[留置基地] 車両${vehicleId}, ${beforeDate}以前: 計画(開始${pDate} 到着${arrivalDate} ${plans[0].end_time})から基地${plans[0].arrival_base_id}(${baseName})`)
      return plans[0].arrival_base_id
    }

    console.log(`[留置基地] 車両${vehicleId}, ${beforeDate}以前: 留置基地なし（計画候補: ${plans.length}件）`)
    return null
  }

  // 次の運用（計画または実績）の日付を取得
  const getNextOperationDate = (vehicleId: number, afterDate: string): string | null => {
    // 計画
    const plans = operationPlans
      .filter(p => {
        const pDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
        return String(p.vehicle_id) === String(vehicleId) && pDate > afterDate
      })
    
    // 実績
    const records = operationRecords
      .filter(r => {
        const rDate = typeof r.record_date === 'string' ? r.record_date.split('T')[0] : r.record_date
        return String(r.vehicle_id) === String(vehicleId) && rDate > afterDate
      })

    const allDates = [
      ...plans.map(p => typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date),
      ...records.map(r => typeof r.record_date === 'string' ? r.record_date.split('T')[0] : r.record_date)
    ].filter(Boolean).sort()

    return allDates.length > 0 ? allDates[0] : null
  }

  // 指定日に車両が留置されている基地を判定
  const isVehicleDetainedAtBase = (vehicleId: number, date: string, baseId: number): boolean => {
    // その基地でその日に計画や実績がある場合は留置ではない
    const hasPlanAtBase = !!getPlanForVehicleDateAndBase(vehicleId, date, baseId)
    const hasRecordAtBase = !!getRecordForVehicleDateAndBase(vehicleId, date, baseId)
    if (hasPlanAtBase || hasRecordAtBase) {
      return false
    }

    const lastBase = getLastDetentionBase(vehicleId, date)
    
    if (String(lastBase) !== String(baseId)) {
      return false
    }

    // 次の運用計画があるかチェック
    const nextOpDate = getNextOperationDate(vehicleId, date)
    if (!nextOpDate) {
      // 次の運用がない場合は、月末まで留置と見なす
      return true
    }

    // 次の運用日よりも前の場合は留置状態
    return date < nextOpDate
  }

  // 実績入力時の基地不一致をチェック
  const checkBaseConflict = (vehicleId: number | string, recordDate: string, arrivalBaseId: number | null): string | null => {
    if (!arrivalBaseId) return null

    // 翌日以降の最初の実績または運用計画を取得
    const nextDayDate = new Date(recordDate)
    nextDayDate.setDate(nextDayDate.getDate() + 1)
    const nextDay = nextDayDate.toISOString().slice(0, 10)

    // 1. まずは「次回の実績」との整合性をチェック（実績同士の不整合は重要）
    const nextRecords = operationRecords
      .filter(r => {
        const rDate = typeof r.record_date === 'string' ? r.record_date.split('T')[0] : r.record_date
        return String(r.vehicle_id) === String(vehicleId) && rDate >= nextDay && r.departure_base_id
      })
      .sort((a, b) => {
        const aDate = typeof a.record_date === 'string' ? a.record_date.split('T')[0] : a.record_date
        const bDate = typeof b.record_date === 'string' ? b.record_date.split('T')[0] : b.record_date
        return aDate.localeCompare(bDate)
      })

    if (nextRecords.length > 0 && nextRecords[0].departure_base_id) {
      if (String(nextRecords[0].departure_base_id) !== String(arrivalBaseId)) {
        const arrivalBase = allBases.find(b => String(b.id) === String(arrivalBaseId))
        const departureBase = allBases.find(b => String(b.id) === String(nextRecords[0].departure_base_id))
        const nextRecordDate = typeof nextRecords[0].record_date === 'string' ? nextRecords[0].record_date.split('T')[0] : nextRecords[0].record_date
        return `⚠️ 整合性エラー: ${arrivalBase?.base_name}に到着しますが、${nextRecordDate}には既に ${departureBase?.base_name} から出発する実績が入力されています。`
      }
      return null // 実績との整合性が確認できれば終了
    }

    // 2. 次回の実績がなければ「次回の計画」との整合性をチェック（計画は参考扱い）
    const nextPlans = operationPlans
      .filter(p => {
        const pDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
        return String(p.vehicle_id) === String(vehicleId) && pDate >= nextDay && p.departure_base_id
      })
      .sort((a, b) => {
        const aDate = typeof a.plan_date === 'string' ? a.plan_date.split('T')[0] : a.plan_date
        const bDate = typeof b.plan_date === 'string' ? b.plan_date.split('T')[0] : b.plan_date
        return aDate.localeCompare(bDate)
      })

    if (nextPlans.length > 0 && nextPlans[0].departure_base_id) {
      const nextPlan = nextPlans[0]
      if (String(nextPlan.departure_base_id) !== String(arrivalBaseId)) {
        const arrivalBase = allBases.find(b => String(b.id) === String(arrivalBaseId))
        const departureBase = allBases.find(b => String(b.id) === String(nextPlan.departure_base_id))
        const nextPlanDate = typeof nextPlan.plan_date === 'string' ? nextPlan.plan_date.split('T')[0] : nextPlan.plan_date
        return `⚠️ 計画との不一致: ${arrivalBase?.base_name}に到着しますが、${nextPlanDate}の運用計画は ${departureBase?.base_name} から出発予定です。`
      }
    }

    return null
  }

  // その基地で実績を追加できるかチェック
  const canAddRecordAtBase = (vehicleId: number, date: string, baseId: number): boolean => {
    // 実績を確認して留置基地を判定
    const previousRecords = operationRecords
      .filter(r => {
        const rDate = typeof r.record_date === 'string' ? r.record_date.split('T')[0] : r.record_date
        return String(r.vehicle_id) === String(vehicleId) && rDate < date
      })
      .sort((a, b) => {
        const aDate = typeof a.record_date === 'string' ? a.record_date.split('T')[0] : a.record_date
        const bDate = typeof b.record_date === 'string' ? b.record_date.split('T')[0] : b.record_date
        return bDate.localeCompare(aDate)
      })
    
    // 実績がある場合は、最新の実績の到着基地をチェック
    if (previousRecords.length > 0 && previousRecords[0].arrival_base_id) {
      return String(previousRecords[0].arrival_base_id) === String(baseId)
    }
    
    // 実績がない場合は、計画から留置基地を判定
    const currentBase = getLastDetentionBase(vehicleId, date)
    if (currentBase) {
      return String(currentBase) === String(baseId)
    }
    
    // 留置基地が不明な場合はすべての基地で追加可能
    return true
  }

  // ==================== データ取得 ====================

  const fetchData = async () => {
    setLoading(true)
    try {
      setError(null)

      // 車両データの取得
      let vehiclesData: Vehicle[] = []
      try {
        console.log("車両データを取得中...")
        vehiclesData = await apiCall<Vehicle[]>("vehicles")
        console.log("車両データ取得成功:", vehiclesData.length, "件")
      } catch (error) {
        console.error("車両データの取得エラー:", error)
        console.error("エラー詳細:", error instanceof Error ? error.message : String(error))
        throw new Error("車両データの取得に失敗しました")
      }

      // 基地データの取得
      // 基地データの取得
      let basesData: Base[] = []
      try {
        basesData = await apiCall<Base[]>("bases")
        console.log("基地データ取得成功:", basesData.length, "件")
      } catch (error) {
        console.error("基地データの取得エラー:", error)
        // エラーがあっても空配列で続行
      }

      // 事業所データの取得
      let officesData: Office[] = []
      try {
        officesData = await apiCall<Office[]>("offices")
        console.log("事業所データ取得成功:", officesData.length, "件")
      } catch (error) {
        console.error("事業所データの取得エラー:", error)
        // エラーがあっても空配列で続行
      }

      // 運用計画データの取得
      let plansData: OperationPlan[] = []
      try {
        plansData = await apiCall<OperationPlan[]>(`operation-plans?month=${currentMonth}`)
        
        // 運用計画のvehicle_id（実際はmachine_id/UUID）を車両テーブルのvehicle_idに変換
        // これにより運用管理画面でplan.vehicle_idとvehicle.idを正しく比較できる
        if (vehiclesData.length > 0) {
          const machineToVehicleMap = new Map<string, number | string>()
          vehiclesData.forEach(v => {
            if (v.machine_id) {
              machineToVehicleMap.set(String(v.machine_id), v.id)
            }
          })
          
          plansData = plansData.map(plan => {
            const mappedVehicleId = machineToVehicleMap.get(String(plan.vehicle_id))
            if (mappedVehicleId !== undefined) {
              return { ...plan, vehicle_id: mappedVehicleId }
            }
            return plan
          })
          console.log(`[運用計画] vehicle_idマッピング完了: ${plansData.length}件`)
        }
      } catch (error) {
        console.error("運用計画データの取得エラー:", error)
        // 運用計画は必須ではないので空配列のまま
      }

      // 運用実績データの取得
      let recordsData: OperationRecord[] = []
      try {
        recordsData = await apiCall<OperationRecord[]>(`operation-records?month=${currentMonth}`)
        console.log(`[運用実績] 取得件数: ${recordsData.length}件`)
        
        // 運用実績のvehicle_id（実際はmachine_id/UUID）を車両テーブルのvehicle_idに変換
        if (vehiclesData.length > 0) {
          const machineToVehicleMap = new Map<string, number | string>()
          vehiclesData.forEach(v => {
            if (v.machine_id) {
              machineToVehicleMap.set(String(v.machine_id), v.id)
            }
          })
          
          recordsData = recordsData.map(record => {
            const mappedVehicleId = machineToVehicleMap.get(String(record.vehicle_id))
            // operation_date を record_date にもコピー（DBカラム名とフロントエンド型の互換性）
            const mappedRecord = {
              ...record,
              record_date: record.operation_date || record.record_date,
              id: record.record_id || record.id
            }
            if (mappedVehicleId !== undefined) {
              return { ...mappedRecord, vehicle_id: mappedVehicleId }
            }
            return mappedRecord
          })
          console.log(`[運用実績] vehicle_id/record_dateマッピング完了: ${recordsData.length}件`)
        }
        
        // デバッグ: 2月の実績をログ出力
        if (currentMonth === '2026-02') {
          const feb2Records = recordsData.filter(r => {
            const rDate = typeof r.record_date === 'string' ? r.record_date.split('T')[0] : r.record_date
            return rDate === '2026-02-02'
          })
          console.log(`[運用実績] 2月2日の実績:`, feb2Records)
        }
      } catch (error) {
        console.error("運用実績データの取得エラー:", error)
        // 運用実績は必須ではないので空配列のまま
      }

      // 検査データの取得
      let inspectionsData: Inspection[] = []
      try {
        inspectionsData = await apiCall<Inspection[]>(`inspections?month=${currentMonth}`)
      } catch (error) {
        console.error("検査データの取得エラー:", error)
        // 検査データは必須ではないので空配列のまま
      }

      // 検修タイプマスタの取得
      let inspectionTypesData: InspectionType[] = []
      try {
        inspectionTypesData = await apiCall<InspectionType[]>("inspection-types")
      } catch (error) {
        console.error("検修タイプマスタの取得エラー:", error)
        // 検修タイプは必須ではないので空配列のまま
      }

      // マスタ機種データの取得
      let masterTypesData: any[] = []
      try {
        masterTypesData = await apiCall<any[]>("machine-types")
        setMasterMachineTypes(masterTypesData)
      } catch (error) {
        console.error("マスタ機種データの取得エラー:", error)
        // マスタ機種データは必須ではないので空配列のまま
        setMasterMachineTypes([])
      }

      setAllVehicles(vehiclesData)
      setInspectionTypes(inspectionTypesData)
      setAllBases(basesData)
      setAllOffices(officesData as ManagementOffice[])
      setOperationPlans(plansData)
      setOperationRecords(recordsData)
      setInspections(inspectionsData)

      console.log("データ取得結果:", {
        vehicles: vehiclesData.length,
        bases: basesData.length,
        offices: officesData.length,
        plans: plansData.length,
        records: recordsData.length,
        inspections: inspectionsData.length
      })
      
      console.log("取得した基地データ:", basesData)
      console.log("取得した事業所データ:", officesData)

      // 全車両と運用計画の紐付けを確認
      console.log("=== 全車両データ ===")
      vehiclesData.forEach(v => {
        console.log(`車両: ${v.vehicle_type || v.model} ${v.machine_number}, ID: ${v.id}`)
        const vehiclePlans = plansData.filter(p => String(p.vehicle_id) === String(v.id))
        console.log(`  運用計画数: ${vehiclePlans.length}`)
        if (vehiclePlans.length > 0) {
          vehiclePlans.slice(0, 2).forEach(plan => {
            const planDate = typeof plan.plan_date === 'string' ? plan.plan_date.split('T')[0] : plan.plan_date
            console.log(`    - ${planDate}: ${plan.shift_type}`)
          })
        }
      })

      // 運用計画の詳細ログ（MC-100のみ）
      const mc100 = vehiclesData.find(v => v.machine_number === "100")
      if (mc100) {
        const mc100Plans = plansData
          .filter(p => String(p.vehicle_id) === String(mc100.id))
          .sort((a, b) => {
            const aDate = typeof a.plan_date === 'string' ? a.plan_date.split('T')[0] : a.plan_date
            const bDate = typeof b.plan_date === 'string' ? b.plan_date.split('T')[0] : b.plan_date
            if (aDate === bDate) {
              const aTime = a.start_time || "00:00"
              const bTime = b.start_time || "00:00"
              return aTime.localeCompare(bTime)
            }
            return aDate.localeCompare(bDate)
          })
        console.log("=== MC-100 運用計画詳細（時系列順） ===")
        mc100Plans.forEach(plan => {
          const planDate = typeof plan.plan_date === 'string' ? plan.plan_date.split('T')[0] : plan.plan_date
          const endDate = plan.end_date 
            ? (typeof plan.end_date === 'string' ? plan.end_date.split('T')[0] : plan.end_date)
            : planDate
          const depBase = basesData.find(b => b.id === plan.departure_base_id)
          const arrBase = basesData.find(b => b.id === plan.arrival_base_id)
          const timeRange = `${plan.start_time?.slice(0,5) || '??:??'}-${plan.end_time?.slice(0,5) || '??:??'}`
          const dateInfo = endDate !== planDate ? `${planDate}→${endDate}` : planDate
          console.log(`${dateInfo} ${timeRange}: ${plan.shift_type} | ${depBase?.base_name || 'なし'} → ${arrBase?.base_name || 'なし'}`)
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("データの取得に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  // セルクリック時の処理（運用実績の作成・編集、または運用計画の作成）
  const handleCellClick = (vehicleId: number, date: string, editRecord?: OperationRecord, baseId?: number) => {
    // クリックしたセルの基地IDを記録
    setSelectedBaseId(baseId || null)
    const plan = getPlanForVehicleAndDate(vehicleId, date)
    
    // 実績追加の場合、計画がない基地のみ留置基地チェック（計画がある基地は常に入力可能）
    if (!editRecord && baseId) {
      // その基地に計画があるかチェック
      const plansAtThisBase = operationPlans.filter((p) => {
        if (p.shift_type === 'maintenance') return false
        const planDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
        const arrivalDate = p.end_date 
          ? (typeof p.end_date === 'string' ? p.end_date.split('T')[0] : p.end_date)
          : planDate
        
        if (String(p.vehicle_id) !== String(vehicleId)) return false
        
        // 出発日がこの日で、この基地が出発基地
        if (planDate === date && String(p.departure_base_id) === String(baseId)) {
          return true
        }
        
        // 出発日と到着日が同じ日で、この基地が到着基地
        if (planDate === date && arrivalDate === date && String(p.arrival_base_id) === String(baseId)) {
          return true
        }
        
        return false
      })
      
      // 前日の夜間作業翌日もチェック
      const previousDayDate = new Date(date)
      previousDayDate.setDate(previousDayDate.getDate() - 1)
      const previousDay = previousDayDate.toISOString().slice(0, 10)
      
      const previousNightPlans = operationPlans.filter((p) => {
        if (p.shift_type !== 'night') return false
        const planDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
        const arrivalDate = p.end_date 
          ? (typeof p.end_date === 'string' ? p.end_date.split('T')[0] : p.end_date)
          : planDate
        
        return String(p.vehicle_id) === String(vehicleId) && 
               planDate === previousDay && 
               arrivalDate === date &&
               String(p.arrival_base_id) === String(baseId)
      })
      
      // 計画も前日夜間作業もない基地の場合のみ、留置基地チェック
      if (plansAtThisBase.length === 0 && previousNightPlans.length === 0) {
        // 実績から留置基地を優先的に判定
        const previousRecords = operationRecords
          .filter(r => {
            const rDate = typeof r.record_date === 'string' ? r.record_date.split('T')[0] : r.record_date
            return String(r.vehicle_id) === String(vehicleId) && rDate < date
          })
          .sort((a, b) => {
            const aDate = typeof a.record_date === 'string' ? a.record_date.split('T')[0] : a.record_date
            const bDate = typeof b.record_date === 'string' ? b.record_date.split('T')[0] : b.record_date
            return bDate.localeCompare(aDate)
          })
        
        let detentionBaseId: number | null = null
        
        // 実績がある場合は最新の実績の到着基地
        if (previousRecords.length > 0 && previousRecords[0].arrival_base_id) {
          detentionBaseId = previousRecords[0].arrival_base_id
        } else {
          // 実績がない場合は計画から判定
          detentionBaseId = getLastDetentionBase(vehicleId, date)
        }
        
        // 留置基地と異なる基地での実績入力は警告
        if (detentionBaseId && String(detentionBaseId) !== String(baseId)) {
          const baseName = allBases.find(b => String(b.id) === String(baseId))?.base_name
          const correctBaseName = allBases.find(b => String(b.id) === String(detentionBaseId))?.base_name
          setError(`⚠️ この基地では実績を入力できません。\n車両は「${correctBaseName}」に留置されています。\n実績は留置基地から入力してください。`)
          return
        }
      }
    }
    
    // 留置中セルからの実績作成（計画ではなく実績モーダルを開く）
    if (!editRecord && !plan && baseId) {
      const isDetained = isVehicleDetainedAtBase(vehicleId, date, baseId)
      if (isDetained) {
        const lastBase = getLastDetentionBase(vehicleId, date)
        if (lastBase === baseId) {
          // 実績作成モードで開く（計画モーダルではなく実績モーダル）
          setEditingRecord(null)
          setSelectedPlan(null)
          setRecordForm({
            vehicle_id: vehicleId.toString(),
            record_date: date,
            shift_type: "day",
            start_time: "08:00",
            end_time: "17:00",
            actual_distance: 0,
            departure_base_id: baseId.toString(),
            arrival_base_id: baseId.toString(),
            status: "completed",
            notes: "",
            is_as_planned: false,
          })
          setDepartureConflict(null)
          setShowRecordModal(true)
          return
        }
      }
    }
    
    // 既存実績の編集または新規作成時の状態リセット
    setArrivalConflict(null)
    
    // 最終留置基地を取得（実績優先、なければ計画）
    // 新規作成時はその日の最新の状態、編集時は自分自身を除いた状態を取得
    const determinedLastBaseId = getLastDetentionBase(vehicleId, date, editRecord?.id)
    const lastArrivalBaseId = determinedLastBaseId ? determinedLastBaseId.toString() : "none"
    
    // 不整合チェック関数（モーダル起動時用）
    const getInitialConflict = (depBase: string): string | null => {
      if (depBase !== "none" && determinedLastBaseId && String(determinedLastBaseId) !== String(depBase)) {
        const correctBaseName = allBases.find(b => String(b.id) === String(determinedLastBaseId))?.base_name
        const selectedBaseName = allBases.find(b => String(b.id) === String(depBase))?.base_name
        return `⚠️ 出発基地不一致: 推定される留置場所は「${correctBaseName}」ですが、「${selectedBaseName}」から出発しようとしています。`
      }
      return null
    }

    if (editRecord) {
      // 既存実績の編集
      const depBase = editRecord.departure_base_id?.toString() || "none"
      setEditingRecord(editRecord)
      setSelectedPlan(plan || null)
      setRecordForm({
        vehicle_id: editRecord.vehicle_id.toString(),
        record_date: editRecord.record_date,
        shift_type: editRecord.shift_type,
        start_time: (editRecord as any).actual_start_time || "08:00",
        end_time: (editRecord as any).actual_end_time || "17:00",
        actual_distance: editRecord.actual_distance || 0,
        departure_base_id: depBase,
        arrival_base_id: editRecord.arrival_base_id?.toString() || "none",
        status: editRecord.status,
        notes: editRecord.notes || "",
        is_as_planned: editRecord.is_as_planned || false,
      })
      setDepartureConflict(getInitialConflict(depBase))
    } else if (plan) {
      // 計画から実績を作成（新規）
      // ユーザーの意向：留置中の基地を出発基地とする（計画より現実を優先）
      const depBase = lastArrivalBaseId !== "none" ? lastArrivalBaseId : (plan.departure_base_id?.toString() || "none")
      
      const arrivalBase = baseId && String(plan.arrival_base_id) !== String(baseId) ? baseId.toString() : (plan.arrival_base_id?.toString() || "none")
      setEditingRecord(null)
      setSelectedPlan(plan)
      setRecordForm({
        vehicle_id: plan.vehicle_id.toString(),
        record_date: date,
        shift_type: plan.shift_type,
        start_time: plan.start_time || "08:00",
        end_time: plan.end_time || "17:00",
        actual_distance: plan.planned_distance || 0,
        departure_base_id: depBase,
        arrival_base_id: arrivalBase,
        status: "completed",
        notes: plan.notes || "",
        is_as_planned: depBase === (plan.departure_base_id?.toString() || "none") && arrivalBase === (plan.arrival_base_id?.toString() || "none"),
      })
      setDepartureConflict(getInitialConflict(depBase))
    } else {
      // 新規実績作成
      setEditingRecord(null)
      setSelectedPlan(null)
      setRecordForm({
        vehicle_id: vehicleId.toString(),
        record_date: date,
        shift_type: "day",
        start_time: "08:00",
        end_time: "17:00",
        actual_distance: 0,
        departure_base_id: lastArrivalBaseId,
        arrival_base_id: baseId ? baseId.toString() : "none",
        status: "completed",
        notes: "",
        is_as_planned: false,
      })
      setDepartureConflict(null) // デフォルトでlastArrivalBaseIdがセットされているため不整合なし
    }
    
    setShowRecordModal(true)
  }

  // 基地不一致警告の状態
  const [baseConflictWarning, setBaseConflictWarning] = useState<string | null>(null)
  
  // 運用計画作成モード（留置中から作成）
  const [isCreatingPlanFromDetention, setIsCreatingPlanFromDetention] = useState(false)
  const [detentionBaseId, setDetentionBaseId] = useState<number | null>(null)
  
  // 事業所でフィルタリングされた基地と、その他の基地を分類
  const { filteredBasesForModal, otherBasesForModal } = useMemo(() => {
    if (selectedOfficeId === "all") {
      // フィルターなしの場合、すべての基地を優先リストに表示
      return { filteredBasesForModal: allBases, otherBasesForModal: [] }
    }
    const officeId = Number.parseInt(selectedOfficeId)
    const filtered = allBases.filter((base) => base.management_office_id === officeId)
    const others = allBases.filter((base) => base.management_office_id !== officeId)
    return { filteredBasesForModal: filtered, otherBasesForModal: others }
  }, [allBases, selectedOfficeId])
  
  // 運用計画作成・編集モーダルの状態
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<OperationPlan | null>(null)
  const [planForm, setPlanForm] = useState({
    vehicle_id: "",
    plan_date: "",
    end_date: "",
    shift_type: "day",
    inspection_type_id: "", // 検修種別ID
    start_time: "08:00",
    end_time: "17:00",
    departure_base_id: "",
    arrival_base_id: "",
    planned_distance: 0,
    notes: "",
  })
  const [nextPlanConflictWarning, setNextPlanConflictWarning] = useState<string | null>(null)

  // 計画を編集モードで開く
  const handleEditPlan = (plan: OperationPlan) => {
    setEditingPlan(plan)
    setPlanForm({
      vehicle_id: plan.vehicle_id.toString(),
      plan_date: typeof plan.plan_date === 'string' ? plan.plan_date.split('T')[0] : plan.plan_date,
      end_date: plan.end_date ? (typeof plan.end_date === 'string' ? plan.end_date.split('T')[0] : plan.end_date) : "",
      shift_type: plan.shift_type,
      inspection_type_id: "",
      start_time: plan.start_time || "08:00",
      end_time: plan.end_time || "17:00",
      departure_base_id: plan.departure_base_id?.toString() || "",
      arrival_base_id: plan.arrival_base_id?.toString() || "",
      planned_distance: plan.planned_distance || 0,
      notes: plan.notes || "",
    })
    setShowPlanModal(true)
  }

  // 実績の保存
  const handleSaveRecord = async () => {
    try {
      if (departureConflict) {
        setError("⚠️ 出発基地が現在の留置場所と一致していません。正しい基地から出発するように修正してください。")
        return
      }

      // 到着基地のチェック（警告は出すが保存は可能にする）
      const arrivalBaseId = recordForm.arrival_base_id && recordForm.arrival_base_id !== "none" 
        ? Number.parseInt(recordForm.arrival_base_id) 
        : null
      
      if (arrivalBaseId) {
        const warning = checkBaseConflict(
          recordForm.vehicle_id,
          recordForm.record_date,
          arrivalBaseId
        )
        // 警告があればセットするが、保存はブロックしない
        if (warning) {
          setArrivalConflict(warning)
        }
      }

      // vehicle_id を machine_id に変換（DBはUUID/machine_idを期待）
      const vehicle = allVehicles.find(v => String(v.id) === String(recordForm.vehicle_id))
      const machineIdForDb = vehicle?.machine_id || recordForm.vehicle_id
      
      const recordData = {
        vehicle_id: machineIdForDb, // machine_id (UUID) を送信
        record_date: recordForm.record_date,
        shift_type: recordForm.shift_type,
        actual_start_time: recordForm.start_time,
        actual_end_time: recordForm.end_time,
        actual_distance: recordForm.actual_distance,
        departure_base_id: recordForm.departure_base_id && recordForm.departure_base_id !== "none" ? Number.parseInt(recordForm.departure_base_id) : null,
        arrival_base_id: arrivalBaseId,
        status: recordForm.status,
        notes: recordForm.notes,
      }

      console.log(`[実績保存] ${editingRecord ? '更新' : '新規作成'}:`, recordData)

      if (editingRecord) {
        // 更新
        const result = await apiCall(`operation-records/${editingRecord.id}`, {
          method: "PUT",
          body: JSON.stringify(recordData),
        })
        console.log('[実績保存] 更新成功:', result)
      } else {
        // 新規作成
        const result = await apiCall("operation-records", {
          method: "POST",
          body: JSON.stringify(recordData),
        })
        console.log('[実績保存] 新規作成成功:', result)
        console.log('[実績保存] 返却データ:', result)
      }

      console.log('[実績保存] データ再取得開始...')
      await fetchData()
      console.log('[実績保存] データ再取得完了')
      setShowRecordModal(false)
      setEditingRecord(null)
      setSelectedPlan(null)
      setBaseConflictWarning(null)
    } catch (error) {
      console.error("[実績保存エラー]", error)
      setError("実績の保存に失敗しました: " + (error instanceof Error ? error.message : String(error)))
    }
  }

  // 実績の削除
  const handleDeleteRecord = async () => {
    if (!editingRecord) return

    try {
      await apiCall(`operation-records/${editingRecord.id}`, {
        method: "DELETE",
      })

      fetchData()
      setShowRecordModal(false)
      setEditingRecord(null)
      setSelectedPlan(null)
    } catch (error) {
      console.error("Error deleting record:", error)
      setError("実績の削除に失敗しました。")
    }
  }

  // 検修完了の保存
  const handleSaveInspection = async () => {
    if (!inspectionForm.vehicle_id || !inspectionForm.completion_date) {
      setError("機械番号と完了日を選択してください。")
      return
    }

    try {
      await apiCall(`machines/${inspectionForm.vehicle_id}/inspection-completion`, {
        method: "PATCH",
        body: JSON.stringify({
          completion_date: inspectionForm.completion_date
        }),
      })

      setError(null)
      alert("検修完了日を登録しました。次回の検査予定はこの日付を起算日として計算されます。")
      
      fetchData()
    } catch (error) {
      console.error("Error saving inspection completion:", error)
      setError("検修完了日の登録に失敗しました。")
    }
  }

  // 運用計画の保存（新規作成または更新）
  const handleSavePlan = async () => {
    try {
      // 到着基地が次の計画と異なる場合は警告（新規作成時のみ）
      const arrivalBaseId = planForm.arrival_base_id ? Number.parseInt(planForm.arrival_base_id) : null
      
      if (arrivalBaseId && !editingPlan) {
        const warning = checkBaseConflict(
          Number.parseInt(planForm.vehicle_id),
          planForm.plan_date,
          arrivalBaseId
        )
        
        if (warning && !nextPlanConflictWarning) {
          setNextPlanConflictWarning(warning)
          return // 警告を表示して一旦停止
        }
      }

      // 検修の場合は検査テーブルに保存
      if (planForm.shift_type === "maintenance" && planForm.inspection_type_id) {
        const inspectionType = inspectionTypes.find(t => t.id.toString() === planForm.inspection_type_id)
        const inspectionData = {
          vehicle_id: Number.parseInt(planForm.vehicle_id),
          inspection_type: inspectionType?.type_name || "",
          inspection_category: inspectionType?.category || "定期検査",
          planned_start_date: planForm.plan_date,
          planned_end_date: planForm.end_date || planForm.plan_date,
          status: "planned",
          notes: planForm.notes
        }

        await apiCall("inspections", {
          method: "POST",
          body: JSON.stringify(inspectionData),
        })
      } else {
        // 運用の場合は運用計画テーブルに保存
        const planData = {
          vehicle_id: Number.parseInt(planForm.vehicle_id),
          plan_date: planForm.plan_date,
          end_date: planForm.end_date || null,
          shift_type: planForm.shift_type,
          start_time: planForm.start_time,
          end_time: planForm.end_time,
          departure_base_id: Number.parseInt(planForm.departure_base_id),
          arrival_base_id: arrivalBaseId,
          planned_distance: planForm.planned_distance,
          notes: planForm.notes,
          status: "planned",
        }

        if (editingPlan) {
          // 既存計画の更新
          await apiCall(`operation-plans/${editingPlan.id}`, {
            method: "PUT",
            body: JSON.stringify(planData),
          })
        } else {
          // 新規計画の作成
          await apiCall("operation-plans", {
            method: "POST",
            body: JSON.stringify(planData),
          })
        }
      }

      fetchData()
      setShowPlanModal(false)
      setEditingPlan(null)
      setIsCreatingPlanFromDetention(false)
      setDetentionBaseId(null)
      setNextPlanConflictWarning(null)
    } catch (error) {
      console.error("Error saving plan:", error)
      setError("運用計画の保存に失敗しました。")
    }
  }

  // 運用計画の削除
  const handleDeletePlan = async () => {
    if (!editingPlan) return
    
    if (!confirm("この運用計画を削除しますか？")) return

    try {
      await apiCall(`operation-plans/${editingPlan.id}`, {
        method: "DELETE",
      })

      fetchData()
      setShowPlanModal(false)
      setEditingPlan(null)
    } catch (error) {
      console.error("Error deleting plan:", error)
      setError("運用計画の削除に失敗しました。")
    }
  }

  const getDaysInMonth = (dateString: string) => {
    const [year, month] = dateString.split("-").map(Number)
    return new Date(year, month, 0).getDate()
  }

  const getDateString = (day: number) => {
    return `${currentMonth}-${day.toString().padStart(2, "0")}`
  }

  // 運用計画がある車両IDのセットを取得
  const vehiclesWithPlans = useMemo(() => {
    return new Set(operationPlans.map(plan => plan.vehicle_id))
  }, [operationPlans])

  // 各フィルターで利用可能な事業所リストを取得（全ての事業所を表示）
  const availableOffices = useMemo(() => {
    // 全ての事業所を返す
    return allOffices
  }, [allOffices])

  // 利用可能な機種を取得（machine_typesテーブルから）
  const availableVehicleTypes = useMemo(() => {
    // 事業所が「すべて」の場合：machine_typesテーブルの全機種を表示
    if (selectedOfficeId === "all") {
      const allModelNames = masterMachineTypes
        .map(mt => mt.model_name)
        .filter(Boolean)
      return Array.from(new Set(allModelNames)).sort()
    }
    
    // 事業所が選択されている場合：その事業所の機械が持つ機種のみを表示
    const vehiclesInOffice = allVehicles.filter(
      v => v.management_office_id === Number.parseInt(selectedOfficeId)
    )
    const vehicleTypes = vehiclesInOffice
      .map(v => v.model_name || v.vehicle_type)
      .filter(Boolean)
    
    // 重複を除去してソート
    return Array.from(new Set(vehicleTypes)).sort()
  }, [masterMachineTypes, allVehicles, selectedOfficeId])

  // 利用可能な機械番号を取得
  const availableMachineNumbers = useMemo(() => {
    let vehicles = allVehicles
    
    // 事業所でフィルタリング
    if (selectedOfficeId !== "all") {
      vehicles = vehicles.filter((vehicle) => vehicle.management_office_id === Number.parseInt(selectedOfficeId))
    }
    
    // 機種でフィルタリング（複数選択対応）
    if (selectedVehicleTypes.length > 0) {
      vehicles = vehicles.filter((vehicle) => selectedVehicleTypes.includes(vehicle.model_name || vehicle.vehicle_type))
    }
    
    // ユニークな機械番号を取得してソート
    const uniqueNumbers = Array.from(new Set(vehicles.map(v => v.machine_number).filter(Boolean)))
    return uniqueNumbers.sort((a, b) => a.localeCompare(b, 'ja', { numeric: true }))
  }, [allVehicles, selectedOfficeId, selectedVehicleTypes])

  // 機種フィルターが変更されたとき、無効な機械番号を除外
  useEffect(() => {
    if (selectedMachineNumbers.length > 0 && selectedVehicleTypes.length > 0) {
      const validMachineNumbers = selectedMachineNumbers.filter(num => 
        availableMachineNumbers.includes(num)
      )
      if (validMachineNumbers.length !== selectedMachineNumbers.length) {
        setSelectedMachineNumbers(validMachineNumbers)
      }
    }
  }, [selectedVehicleTypes, availableMachineNumbers])

  // 利用可能な日付リストを取得（現在の月の日付）
  const availableDates = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const dates: string[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(getDateString(day))
    }
    return dates
  }, [currentMonth])

  // 車両フィルタリング（事業所フィルターは除外、機種・機械番号のみ）
  const filteredVehicles = useMemo(() => {
    let vehicles = allVehicles

    // 機種でフィルタリング（複数選択対応）
    if (selectedVehicleTypes.length > 0) {
      vehicles = vehicles.filter((vehicle) => selectedVehicleTypes.includes(vehicle.model_name || vehicle.vehicle_type))
    }

    // 機械番号でフィルタリング（複数選択対応）
    if (selectedMachineNumbers.length > 0) {
      vehicles = vehicles.filter((vehicle) => selectedMachineNumbers.includes(vehicle.machine_number))
    }

    return vehicles
  }, [allVehicles, selectedVehicleTypes, selectedMachineNumbers])

  // 事業所フィルターに基づいて保守基地をフィルタリング
  const filteredBases = useMemo(() => {
    console.log('[filteredBases] selectedOfficeId:', selectedOfficeId)
    console.log('[filteredBases] allBases:', allBases)
    
    if (selectedOfficeId === "all") {
      // 全ての事業所が選択されている場合は全ての基地を表示
      console.log('[filteredBases] Showing all bases:', allBases.length)
      return allBases
    }
    // 選択された事業所に所属する基地のみを表示
    const filtered = allBases.filter(base => {
      const matches = base.management_office_id === Number.parseInt(selectedOfficeId)
      console.log(`[filteredBases] Base ${base.base_name} (office_id: ${base.management_office_id}) matches office ${selectedOfficeId}:`, matches)
      return matches
    })
    console.log('[filteredBases] Filtered bases:', filtered.length, filtered.map(b => b.base_name))
    return filtered
  }, [allBases, selectedOfficeId])

  // 機種別にグループ化された車両を取得
  const vehiclesByType = useMemo(() => {
    const grouped: Record<string, Vehicle[]> = {}

    filteredVehicles.forEach((vehicle) => {
      const type = vehicle.model_name || vehicle.vehicle_type
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type].push(vehicle)
    })

    // 各機種内で機械番号順にソート
    Object.keys(grouped).forEach((type) => {
      grouped[type].sort((a, b) => (a.machine_number || "").localeCompare(b.machine_number || "", 'ja', { numeric: true }))
    })

    return grouped
  }, [filteredVehicles])

  // 特定の日付と車両の運用計画を取得（出発日基準）※検修計画は除外
  // 特定の日付と車両の運用計画を取得※検修計画は除外
  const getPlanForVehicleAndDate = (vehicleId: number, date: string): OperationPlan | undefined => {
    const plan = operationPlans.find((plan) => {
      // 検修計画は除外
      if (plan.shift_type === 'maintenance') return false
      
      const planDate = typeof plan.plan_date === 'string' ? plan.plan_date.split('T')[0] : plan.plan_date
      // vehicle_idは文字列または数値の可能性があるため、文字列に統一して比較
      return String(plan.vehicle_id) === String(vehicleId) && planDate === date
    })
    
    if (plan && vehicleId === allVehicles.find(v => v.machine_number === "100")?.id) {
      const depBase = allBases.find(b => b.id === plan.departure_base_id)?.base_name
      const arrBase = allBases.find(b => b.id === plan.arrival_base_id)?.base_name
      console.log(`[計画取得] ${date}: ${depBase || 'なし'} → ${arrBase || 'なし'}`)
    }
    
    return plan
  }

  // 特定の日付に到着する運用計画を取得（到着日基準）※検修計画は除外
  const getPlanArrivingOnDate = (vehicleId: number, date: string): OperationPlan | undefined => {
    const plan = operationPlans.find((plan) => {
      // 検修計画は除外
      if (plan.shift_type === 'maintenance') return false
      
      const arrivalDate = plan.end_date 
        ? (typeof plan.end_date === 'string' ? plan.end_date.split('T')[0] : plan.end_date)
        : (typeof plan.plan_date === 'string' ? plan.plan_date.split('T')[0] : plan.plan_date)
      // vehicle_idは文字列または数値の可能性があるため、文字列に統一して比較
      return String(plan.vehicle_id) === String(vehicleId) && arrivalDate === date
    })
    
    if (plan && vehicleId === allVehicles.find(v => v.machine_number === "100")?.id) {
      const depBase = allBases.find(b => b.id === plan.departure_base_id)?.base_name
      const arrBase = allBases.find(b => b.id === plan.arrival_base_id)?.base_name
      const planDate = typeof plan.plan_date === 'string' ? plan.plan_date.split('T')[0] : plan.plan_date
      console.log(`[到着日計画取得] ${date}到着: 出発${planDate} ${depBase || 'なし'} → ${arrBase || 'なし'}`)
    }
    
    return plan
  }

  // 特定の日付と車両の運用実績を取得
  const getRecordForVehicleAndDate = (vehicleId: number, date: string): OperationRecord | undefined => {
    return operationRecords.find((record) => {
      const recordDate = typeof record.record_date === 'string' ? record.record_date.split('T')[0] : record.record_date
      // vehicle_idは文字列または数値の可能性があるため、文字列に統一して比較
      return String(record.vehicle_id) === String(vehicleId) && recordDate === date
    })
  }

  // 特定の日付、車両、基地の運用計画を取得※検修計画は除外
  const getPlanForVehicleDateAndBase = (vehicleId: number, date: string, baseId: number): OperationPlan | undefined => {
    const plan = operationPlans.find((plan) => {
      // 検修計画は除外
      if (plan.shift_type === 'maintenance') return false
      
      const planDate = typeof plan.plan_date === 'string' ? plan.plan_date.split('T')[0] : plan.plan_date
      const arrivalDate = plan.end_date 
        ? (typeof plan.end_date === 'string' ? plan.end_date.split('T')[0] : plan.end_date)
        : planDate
      
      // vehicle_idは文字列または数値の可能性があるため、文字列に統一して比較
      if (String(plan.vehicle_id) !== String(vehicleId)) return false
      
      // 出発日がこの日で、この基地が出発基地の場合
      if (planDate === date && String(plan.departure_base_id) === String(baseId)) {
        return true
      }
      
      // 出発日と到着日が同じ日で、この基地が到着基地の場合（基地間移動なし、または同一基地内）
      if (planDate === date && arrivalDate === date && String(plan.arrival_base_id) === String(baseId)) {
        return true
      }
      
      return false
    })
    
    // デバッグ: MC-100の計画取得をログ出力
    if (plan && vehicleId === allVehicles.find(v => v.machine_number === "100")?.id) {
      const depBase = allBases.find(b => b.id === plan.departure_base_id)?.base_name
      const arrBase = allBases.find(b => b.id === plan.arrival_base_id)?.base_name
      const currentBase = allBases.find(b => b.id === baseId)?.base_name
      console.log(`[計画取得:基地別] ${date} ${currentBase}: ${depBase || 'なし'} → ${arrBase || 'なし'} (${plan.shift_type})`)
    }
    
    return plan
  }

  // 特定の日付、車両、基地の運用実績を取得
  const getRecordForVehicleDateAndBase = (vehicleId: number, date: string, baseId: number): OperationRecord | undefined => {
    return operationRecords.find((record) => {
      const recordDate = typeof record.record_date === 'string' ? record.record_date.split('T')[0] : record.record_date
      // vehicle_idは文字列または数値の可能性があるため、文字列に統一して比較
      return String(record.vehicle_id) === String(vehicleId) && recordDate === date && 
        (String(record.departure_base_id) === String(baseId) || String(record.arrival_base_id) === String(baseId))
    })
  }

  // 特定の日付と車両の検査を取得（検修期間全体をチェック）
  const getInspectionForVehicleAndDate = (vehicleId: number, date: string): Inspection | undefined => {
    return inspections.find((inspection) => {
      const inspectionDate = typeof inspection.inspection_date === 'string' ? inspection.inspection_date.split('T')[0] : inspection.inspection_date
      // vehicle_idは文字列または数値の可能性があるため、文字列に統一して比較
      return String(inspection.vehicle_id) === String(vehicleId) && inspectionDate === date
    })
  }

  // 検修期間中かどうかを判定（plan_dateからend_dateまで）
  const isInMaintenancePeriod = (vehicleId: number, date: string): OperationPlan | undefined => {
    return operationPlans.find((plan) => {
      // vehicle_idは文字列または数値の可能性があるため、文字列に統一して比較
      if (String(plan.vehicle_id) !== String(vehicleId) || plan.shift_type !== 'maintenance') return false
      
      const planStartDate = typeof plan.plan_date === 'string' ? plan.plan_date.split('T')[0] : plan.plan_date
      const planEndDate = plan.end_date 
        ? (typeof plan.end_date === 'string' ? plan.end_date.split('T')[0] : plan.end_date)
        : planStartDate
      
      return date >= planStartDate && date <= planEndDate
    })
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
    // すべての計画を黄色で統一
    return "bg-yellow-100 text-yellow-800 border-yellow-300"
  }

  const getShiftTypeLabel = (shiftType: string) => {
    switch (shiftType) {
      case "day":
        return "昼間"
      case "night":
        return "夜間"
      case "both":
        return "昼夜"
      default:
        return "不明"
    }
  }

  // 実績の表示色を取得（計画通りの場合は青系、そうでない場合は緑系）
  const getRecordDisplayColor = (record: OperationRecord, shiftType: string) => {
    if (record.is_as_planned) {
      // 計画通りの実績は濃い青色背景に白文字
      switch (shiftType) {
        case "day":
          return "bg-blue-700 text-white border-blue-800"
        case "night":
          return "bg-blue-800 text-white border-blue-900"
        case "both":
          return "bg-blue-900 text-white border-blue-950"
        default:
          return "bg-blue-700 text-white border-blue-800"
      }
    } else {
      // 計画外の実績も濃い青色背景に白文字
      switch (shiftType) {
        case "day":
          return "bg-blue-600 text-white border-blue-700"
        case "night":
          return "bg-blue-700 text-white border-blue-800"
        case "both":
          return "bg-blue-800 text-white border-blue-900"
        default:
          return "bg-blue-600 text-white border-blue-700"
      }
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
  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  
  // 日付フィルターを適用
  const days = useMemo(() => {
    if (selectedDates.length === 0) {
      return allDays
    }
    // 選択された日付のみを返す
    return allDays.filter(day => {
      const dateString = getDateString(day)
      return selectedDates.includes(dateString)
    })
  }, [selectedDates, currentMonth, daysInMonth])

  // フィルターリセット
  const resetFilters = () => {
    setSelectedOfficeId("all")
    setSelectedVehicleTypes([])
    setSelectedMachineNumbers([])
    setSelectedDates([])
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

  // A3 Excelエクスポート
  const handleExportToExcel = async () => {
    try {
      // フィルター条件を収集
      const filterConditions = {
        office: selectedOfficeId !== "all" 
          ? allOffices.find(o => o.id === Number.parseInt(selectedOfficeId))?.office_name 
          : undefined,
        bases: undefined, // 基地フィルターは現在未実装
        vehicleType: selectedVehicleTypes.length > 0 
          ? selectedVehicleTypes.join('、') 
          : undefined
      }

      await exportOperationPlanToA3Excel(
        filteredVehicles,
        operationPlans,
        inspections,
        currentMonth,
        filterConditions
      )
    } catch (error) {
      console.error('Excelエクスポートエラー:', error)
      setError('Excelエクスポートに失敗しました。')
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">運用実績管理表</h2>
          <Badge className={`${monthInfo.bgColor} ${monthInfo.color} border-0`}>
            <MonthIcon className="w-4 h-4 mr-1" />
            {monthInfo.label}
          </Badge>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <Select 
              value={currentMonth.split('-')[0]} 
              onValueChange={(year) => {
                const month = currentMonth.split('-')[1]
                setCurrentMonth(`${year}-${month}`)
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 1 + i
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}年
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Select 
              value={currentMonth.split('-')[1]} 
              onValueChange={(month) => {
                const year = currentMonth.split('-')[0]
                setCurrentMonth(`${year}-${month}`)
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = (i + 1).toString().padStart(2, '0')
                  return (
                    <SelectItem key={month} value={month}>
                      {i + 1}月
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          {!isCurrentMonth && (
            <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
              今月に戻る
            </Button>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="chart">運用実績管理表</TabsTrigger>
          <TabsTrigger value="inspection">検修完了登録</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-6 mt-4">
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
                  {availableOffices.filter(office => office.id).map((office) => (
                    <SelectItem key={office.id} value={(office.id || "none").toString()}>
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
              <Label htmlFor="dateFilter" className="text-sm font-medium">
                日付（複数選択可）
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="w-4 h-4 mr-2" />
                    {selectedDates.length === 0 ? (
                      <span>全ての日付</span>
                    ) : (
                      <span>{selectedDates.length}件選択中</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandList className="max-h-[300px]">
                      <CommandGroup>
                        {availableDates.map((date) => {
                          const dateObj = new Date(date)
                          const dayOfWeek = dateObj.toLocaleDateString('ja-JP', { weekday: 'short' })
                          const day = dateObj.getDate()
                          return (
                            <CommandItem
                              key={date}
                              onSelect={() => {
                                setSelectedDates(prev => 
                                  prev.includes(date) 
                                    ? prev.filter(d => d !== date)
                                    : [...prev, date]
                                )
                              }}
                            >
                              <Checkbox
                                checked={selectedDates.includes(date)}
                                className="mr-2"
                              />
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>{day}日（{dayOfWeek}）</span>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleTypeFilter" className="text-sm font-medium">
                機種（複数選択可）
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Car className="w-4 h-4 mr-2" />
                    {selectedVehicleTypes.length === 0 ? (
                      <span>全ての機種</span>
                    ) : (
                      <span>{selectedVehicleTypes.length}件選択中</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {availableVehicleTypes.map((type) => (
                          <CommandItem
                            key={type}
                            onSelect={() => {
                              setSelectedVehicleTypes(prev => 
                                prev.includes(type) 
                                  ? prev.filter(t => t !== type)
                                  : [...prev, type]
                              )
                            }}
                          >
                            <Checkbox
                              checked={selectedVehicleTypes.includes(type)}
                              className="mr-2"
                            />
                            <Car className="w-4 h-4 mr-2" />
                            <span>{type}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="machineNumberFilter" className="text-sm font-medium">
                機械番号（複数選択可）
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Car className="w-4 h-4 mr-2" />
                    {selectedMachineNumbers.length === 0 ? (
                      <span>全ての機械番号</span>
                    ) : (
                      <span>{selectedMachineNumbers.length}件選択中</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {availableMachineNumbers.map((number) => (
                          <CommandItem
                            key={number}
                            onSelect={() => {
                              setSelectedMachineNumbers(prev => 
                                prev.includes(number) 
                                  ? prev.filter(n => n !== number)
                                  : [...prev, number]
                              )
                            }}
                          >
                            <Checkbox
                              checked={selectedMachineNumbers.includes(number)}
                              className="mr-2"
                            />
                            <Car className="w-4 h-4 mr-2" />
                            <span>{number}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-gray-600">
              {selectedOfficeId !== "all" || selectedVehicleTypes.length > 0 || selectedMachineNumbers.length > 0 || selectedDates.length > 0 ? (
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  <span>フィルター適用中:</span>
                  {selectedOfficeId !== "all" && (
                    <Badge variant="secondary">
                      {allOffices.find((o) => o.id === Number.parseInt(selectedOfficeId))?.office_name}
                    </Badge>
                  )}
                  {selectedVehicleTypes.map((type) => (
                    <Badge key={type} variant="secondary">{type}</Badge>
                  ))}
                  {selectedMachineNumbers.map((number) => (
                    <Badge key={number} variant="secondary">{number}</Badge>
                  ))}
                  {selectedDates.map((date) => {
                    const day = new Date(date).getDate()
                    return <Badge key={date} variant="secondary">{day}日</Badge>
                  })}
                </div>
              ) : (
                <span>全てのデータを表示中</span>
              )}
            </div>
            {(selectedOfficeId !== "all" || selectedVehicleTypes.length > 0 || selectedMachineNumbers.length > 0) && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                フィルターをリセット
              </Button>
            )}
          </div>
          
          {/* Excelエクスポートボタンと補足説明 */}
          <div className="mt-4 space-y-2">
            <Button variant="outline" size="sm" onClick={handleExportToExcel} className="w-full">
              <FileText className="w-4 h-4 mr-2" />
              A3 Excelエクスポート
            </Button>
            <div className="text-xs text-blue-600 font-medium text-center">
              ※ フィルターで絞り込んだデータがエクスポートされます。
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 運用実績管理表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>{currentMonth} 運用実績管理表</span>
              <Badge variant="outline" className={monthInfo.color}>
                {monthInfo.label}表示
              </Badge>
            </CardTitle>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <div>
              運用計画と実績を統合表示します。セルをクリックして実績を追加・編集できます（計画がない場合でも実績追加可能）。
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span>計画（昼間・夜間）</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-cyan-100 border border-cyan-400 rounded"></div>
                <span>実績（計画通り✓）</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span>実績（計画外）</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
                <span>検修</span>
              </div>
            </div>
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
                                    <div className={`text-[0.825rem] px-1 py-0.5 rounded border ${getRecordDisplayColor(record, record.shift_type)}`}>
                                      {getShiftTypeLabel(record.shift_type)}
                                      {record.is_as_planned && (
                                        <span className="ml-1 text-[0.825rem]">✓</span>
                                      )}
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
                                // 前日からの夜間作業（翌日到着）をチェック
                                const previousDayDate = new Date(selectedDate)
                                previousDayDate.setDate(previousDayDate.getDate() - 1)
                                const previousDay = previousDayDate.toISOString().slice(0, 10)
                                
                                const previousNightPlan = operationPlans.find((p) => {
                                  if (p.shift_type !== 'night') return false
                                  const planDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
                                  const arrivalDate = p.end_date 
                                    ? (typeof p.end_date === 'string' ? p.end_date.split('T')[0] : p.end_date)
                                    : planDate
                                  
                                  // 前日出発で当日到着、かつこの基地に到着
                                  return String(p.vehicle_id) === String(vehicle.id) && 
                                         planDate === previousDay && 
                                         arrivalDate === selectedDate &&
                                         String(p.arrival_base_id) === String(base.id)
                                })
                                
                                const basePlan = getPlanForVehicleDateAndBase(vehicle.id, selectedDate, base.id)
                                const baseRecord = getRecordForVehicleDateAndBase(vehicle.id, selectedDate, base.id)
                                
                                // 留置状態と実績追加可能性をチェック
                                const isDetained = isVehicleDetainedAtBase(vehicle.id, selectedDate, base.id)
                                const canAddRecord = canAddRecordAtBase(vehicle.id, selectedDate, base.id)

                                return (
                                  <td key={base.id} className="border p-2">
                                    <div className="space-y-2">
                                      {/* 前日夜間作業翌日の表示 */}
                                      {previousNightPlan && (
                                        <div className="space-y-1">
                                          <div className="text-xs px-1 py-0.5 rounded bg-orange-50 border border-orange-200">
                                            <div className="text-orange-700 font-semibold">前日作業翌日</div>
                                            <div className="text-orange-900">
                                              {allBases.find(b => String(b.id) === String(previousNightPlan.departure_base_id))?.base_name} から到着
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      
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
                                          <div className={`text-[0.825rem] px-1 py-0.5 rounded border ${getRecordDisplayColor(baseRecord, baseRecord.shift_type)}`}>
                                            <div className="font-semibold flex items-center flex-wrap">
                                              <span>{getShiftTypeLabel(baseRecord.shift_type)}</span>
                                              {baseRecord.arrival_base_id && String(baseRecord.arrival_base_id) !== String(base.id) && (
                                                <>
                                                  <span className="mx-1 text-gray-500">➞</span>
                                                  <span>{allBases.find(b => String(b.id) === String(baseRecord.arrival_base_id))?.base_name}</span>
                                                </>
                                              )}
                                              {baseRecord.is_as_planned && (
                                                <span className="ml-1 text-blue-600 font-bold">✓</span>
                                              )}
                                            </div>
                                          </div>
                                          <div className={`text-xs px-1 py-0.5 rounded ${getStatusBadgeColor(baseRecord.status)}`}>
                                            {getStatusLabel(baseRecord.status)}
                                          </div>
                                        </div>
                                      )}

                                      {/* 検修 */}
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
                                          <div className="text-xs text-gray-600">検修: {inspection.inspection_type}</div>
                                          <div className="text-xs text-gray-500">{inspection.notes}</div>
                                        </div>
                                      )}
                                      
                                      {/* 留置状態の表示（留置中、検修期間外のみ） */}
                                      {isDetained && !basePlan && !previousNightPlan && !baseRecord && !inspection && (
                                        <button
                                          onClick={() => handleCellClick(vehicle.id, selectedDate, undefined, base.id)}
                                          className="text-xs text-indigo-800 px-2 py-1 bg-indigo-100 rounded text-center w-full hover:bg-indigo-200 transition-colors cursor-pointer"
                                        >
                                          <Home className="w-3 h-3 inline-block mr-1" />
                                          {canAddRecord ? '留置中' : '留置外（他基地?)'}
                                        </button>
                                      )}

                                      {/* 実績追加ボタン（計画・留置に関わらず実績がなければ表示、検修期間外のみ） */}
                                      {!baseRecord && !inspection && (!isDetained || !canAddRecord) && (
                                        <button
                                          onClick={() => handleCellClick(vehicle.id, selectedDate, undefined, base.id)}
                                          className={`text-xs px-2 py-1 rounded w-full text-center transition-colors border border-dashed ${
                                            basePlan || previousNightPlan || canAddRecord 
                                              ? 'text-green-600 hover:text-green-700 hover:bg-green-100 border-green-300' 
                                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-gray-200'
                                          }`}
                                        >
                                          + 実績追加
                                        </button>
                                      )}

                                      {/* データがない場合（計画なしでも実績追加可能、検修期間外のみ） */}
                                      {!basePlan && !previousNightPlan && !baseRecord && !inspection && !isDetained && canAddRecord && (
                                        <button
                                          onClick={() => handleCellClick(vehicle.id, selectedDate, undefined, base.id)}
                                          className="text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 px-2 py-2 rounded w-full text-center transition-colors"
                                        >
                                          + 実績追加
                                        </button>
                                      )}

                                      {/* データがない場合（表示のみ） */}
                                      {!previousNightPlan && !basePlan && !baseRecord && !inspection && !canAddRecord && (
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
                    <th className="border p-2 bg-gray-50 text-center w-[5ch] sticky left-0 z-10">日付</th>
                    <th className="border p-2 bg-gray-50 text-center w-[4ch] sticky left-[5ch] z-10">曜日</th>
                    <th className="border p-2 bg-blue-50 text-center w-[9ch]">機種</th>
                    <th className="border p-2 bg-blue-50 text-center w-[16ch]">機械番号</th>
                    {(() => {
                      console.log('[レンダリング] filteredBases:', filteredBases.length, filteredBases)
                      return filteredBases.map((base) => (
                        <th key={base.id} className="border p-2 bg-green-50 text-center min-w-24">
                          <div className="space-y-1">
                            <div className="font-medium">{base.base_name}</div>
                            <div className="text-xs text-gray-600">{base.location}</div>
                          </div>
                        </th>
                      ))
                    })()}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => {
                    const dateString = getDateString(day)
                    const dayOfWeek = new Date(dateString + 'T00:00:00').toLocaleDateString("ja-JP", { weekday: "short" })
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
                            className={`border p-2 text-center font-medium w-[5ch] sticky left-0 z-10 cursor-pointer hover:bg-blue-100 transition-colors ${
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
                            className={`border p-2 text-center text-sm w-[4ch] sticky left-[5ch] z-10 ${
                              isWeekend ? "text-red-600 font-medium" : "text-gray-600"
                            } ${isToday ? "bg-yellow-100" : "bg-gray-50"}`}
                            rowSpan={vehicleRows.length}
                          >
                            {dayOfWeek}
                          </td>
                        )}

                        {/* 機種セル */}
                        {row.isFirstOfType && (
                          <td className="border p-2 text-center font-medium bg-blue-50 w-[9ch]" rowSpan={row.typeCount}>
                            <div className="flex flex-col items-center space-y-1">
                              <Car className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-semibold">{row.vehicleType}</span>
                            </div>
                          </td>
                        )}

                        {/* 機械番号セル */}
                        <td className="border p-2 text-center font-medium bg-blue-50 w-[16ch]">
                          <div className="text-sm font-semibold">{row.vehicle.machine_number}</div>
                        </td>

                        {/* 保守基地セル（計画と実績の統合表示） */}
                        {filteredBases.map((base) => {
                          // 前日からの夜間作業（翌日到着）をチェック
                          const previousDayDate = new Date(dateString)
                          previousDayDate.setDate(previousDayDate.getDate() - 1)
                          const previousDay = previousDayDate.toISOString().slice(0, 10)
                          
                          const previousNightPlans = operationPlans.filter((p) => {
                            if (p.shift_type !== 'night') return false
                            const planDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
                            const arrivalDate = p.end_date 
                              ? (typeof p.end_date === 'string' ? p.end_date.split('T')[0] : p.end_date)
                              : planDate
                            
                            // 前日出発で当日到着、かつこの基地に到着
                            return String(p.vehicle_id) === String(row.vehicle.id) && 
                                   planDate === previousDay && 
                                   arrivalDate === dateString &&
                                   String(p.arrival_base_id) === String(base.id)
                          })
                          
                          // この基地に関連する運用計画を全て取得
                          const plans = operationPlans.filter((p) => {
                            if (p.shift_type === 'maintenance') return false
                            
                            const planDate = typeof p.plan_date === 'string' ? p.plan_date.split('T')[0] : p.plan_date
                            const arrivalDate = p.end_date 
                              ? (typeof p.end_date === 'string' ? p.end_date.split('T')[0] : p.end_date)
                              : planDate
                            
                            // 車両が一致
                            if (String(p.vehicle_id) !== String(row.vehicle.id)) return false
                            
                            // 出発日がこの日で、この基地が出発基地の場合
                            if (planDate === dateString && String(p.departure_base_id) === String(base.id)) {
                              return true
                            }
                            
                            // 出発日と到着日が同じ日で、この基地が到着基地の場合（基地間移動なし、または同一基地内）
                            if (planDate === dateString && arrivalDate === dateString && String(p.arrival_base_id) === String(base.id)) {
                              return true
                            }
                            
                            return false
                          })
                          
                          // 時刻順にソート
                          plans.sort((a, b) => {
                            const aTime = a.start_time || "00:00"
                            const bTime = b.start_time || "00:00"
                            return aTime.localeCompare(bTime)
                          })
                          
                          // 実績：出発基地または到着基地がこの基地のものを表示
                          const records = operationRecords.filter(
                            r => {
                              const rDate = typeof r.record_date === 'string' ? r.record_date.split('T')[0] : r.record_date
                              const matchesVehicleAndDate = String(r.vehicle_id) === String(row.vehicle.id) && rDate === dateString
                              const matchesDeparture = r.departure_base_id && String(r.departure_base_id) === String(base.id)
                              const matchesArrival = r.arrival_base_id && String(r.arrival_base_id) === String(base.id)
                              
                              // デバッグ: 300Sの実績をログ出力
                              if (matchesVehicleAndDate && row.vehicle.machine_number === "300") {
                                console.log(`[実績フィルタ] ${dateString} ${base.base_name}: 出発=${r.departure_base_id}, 到着=${r.arrival_base_id}, 一致=${matchesDeparture || matchesArrival}`)
                              }
                              
                              return matchesVehicleAndDate && (matchesDeparture || matchesArrival)
                            }
                          )
                          const inspection = getInspectionForVehicleAndDate(row.vehicle.id, dateString)
                          
                          // 留置状態をチェック
                          const isDetained = isVehicleDetainedAtBase(row.vehicle.id, dateString, base.id)

                          return (
                            <td 
                              key={base.id} 
                              className={`border p-2 ${isDetained ? 'bg-gray-50' : ''}`}
                            >
                              <div className="space-y-2">
                                {/* 検修期間の表示 */}
                                {isInMaintenancePeriod(row.vehicle.id, dateString) && (
                                  <div 
                                    className="cursor-pointer hover:bg-purple-50 rounded p-1"
                                    onClick={() => {
                                      const maintenancePlan = isInMaintenancePeriod(row.vehicle.id, dateString)
                                      if (maintenancePlan) {
                                        handleEditPlan(maintenancePlan)
                                      }
                                    }}
                                  >
                                    <div className="bg-purple-100 text-purple-800 border border-purple-300 text-xs px-2 py-1 rounded text-center font-medium">
                                      検修
                                    </div>
                                  </div>
                                )}

                                {/* 前日夜間作業翌日の表示（昼間の上に表示） */}
                                {previousNightPlans.length > 0 && !isInMaintenancePeriod(row.vehicle.id, dateString) && (
                                  <div className="space-y-1">
                                    {previousNightPlans.map((plan) => (
                                      <div 
                                        key={`prev-${plan.id}`}
                                        className="cursor-pointer hover:bg-orange-50 rounded p-1 bg-orange-50 border border-orange-200"
                                        onClick={(e: React.MouseEvent) => {
                                          e.stopPropagation()
                                          handleEditPlan(plan)
                                        }}
                                      >
                                        <div className="space-y-1">
                                          <span className="text-xs text-orange-700 font-semibold">前日作業翌日</span>
                                          <div className="text-xs px-2 py-1 rounded font-medium bg-orange-100 text-orange-900">
                                            {allBases.find(b => String(b.id) === String(plan.departure_base_id))?.base_name} から到着
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* 運用計画（検修以外、検修期間外のみ表示） */}
                                {plans.length > 0 && !isInMaintenancePeriod(row.vehicle.id, dateString) && (
                                  <div className="space-y-1">
                                    {plans.map((plan) => (
                                      <div 
                                        key={plan.id}
                                        className="cursor-pointer hover:bg-yellow-50 rounded p-1 bg-yellow-50 border border-yellow-200"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleCellClick(row.vehicle.id, dateString, undefined, base.id)
                                        }}
                                      >
                                        <div className="space-y-1">
                                          <span className="text-xs text-yellow-700 font-semibold">計画</span>
                                          <div className={`text-xs px-2 py-1 rounded font-medium ${getShiftTypeColor(plan.shift_type)}`}>
                                            {plan.shift_type === "day" ? "昼間" : plan.shift_type === "night" ? "夜間" : "昼夜"}
                                            {/* 基地間移動の表示（計画表示内に統合） */}
                                            {plan.departure_base_id && plan.arrival_base_id && String(plan.departure_base_id) !== String(plan.arrival_base_id) && String(plan.departure_base_id) === String(base.id) && (
                                              <span className="ml-1 text-xs">
                                                → {allBases.find(b => String(b.id) === String(plan.arrival_base_id))?.base_name}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* 運用実績リスト（検修期間外のみ表示） */}
                                {records.length > 0 && !isInMaintenancePeriod(row.vehicle.id, dateString) && (
                                  <div className="space-y-1">
                                    {records.map((record) => (
                                      <div 
                                        key={record.id}
                                        className="cursor-pointer hover:opacity-80 rounded p-1 bg-green-50 border border-green-200"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleCellClick(row.vehicle.id, dateString, record, base.id)
                                        }}
                                      >
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="text-[0.825rem] text-green-700 font-semibold">運用実績</span>
                                          </div>
                                          <div className={`text-[0.825rem] px-1 py-0.5 rounded font-medium border ${getRecordDisplayColor(record, record.shift_type)}`}>
                                            <div className="flex items-center flex-wrap gap-x-1">
                                              <span>{getShiftTypeLabel(record.shift_type)}</span>
                                              {record.arrival_base_id && String(record.arrival_base_id) !== String(base.id) && (
                                                <>
                                                  <span className="text-gray-500 font-normal">➞</span>
                                                  <span className="truncate">{allBases.find(b => String(b.id) === String(record.arrival_base_id))?.base_name}</span>
                                                </>
                                              )}
                                              {record.is_as_planned && (
                                                <span className="ml-0.5 text-blue-600 font-bold">✓</span>
                                              )}
                                            </div>
                                          </div>
                                          {record.status !== 'completed' && (
                                            <div className={`text-[10px] px-1 py-0.25 rounded border-l-2 ${getStatusBadgeColor(record.status)}`}>
                                              {getStatusLabel(record.status)}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                 {/* 留置状態の表示（留置中、検修期間外のみ） */}
                                 {isDetained && plans.length === 0 && previousNightPlans.length === 0 && records.length === 0 && !isInMaintenancePeriod(row.vehicle.id, dateString) && (
                                   <button
                                     onClick={() => handleCellClick(row.vehicle.id, dateString, undefined, base.id)}
                                     className="text-xs text-indigo-800 px-2 py-1 bg-indigo-100 rounded text-center w-full hover:bg-indigo-200 transition-colors cursor-pointer"
                                   >
                                     <Home className="w-3 h-3 inline-block mr-1" />
                                     {canAddRecordAtBase(row.vehicle.id, dateString, base.id) ? '留置中' : '留置外?'}
                                   </button>
                                 )}

                                 {/* 実績追加ボタン（計画・留置に関わらず実績がなければ表示、検修期間外のみ） */}
                                 {records.length === 0 && !isInMaintenancePeriod(row.vehicle.id, dateString) && (!isDetained || !canAddRecordAtBase(row.vehicle.id, dateString, base.id)) && (
                                   <button
                                     onClick={() => handleCellClick(row.vehicle.id, dateString, undefined, base.id)}
                                     className={`text-xs px-2 py-1 rounded w-full text-center transition-colors border border-dashed ${
                                       plans.length > 0 || previousNightPlans.length > 0 || canAddRecordAtBase(row.vehicle.id, dateString, base.id)
                                         ? 'text-green-600 hover:text-green-700 hover:bg-green-100 border-green-300'
                                         : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-gray-200'
                                     }`}
                                   >
                                     + 実績追加
                                   </button>
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
      </TabsContent>

      <TabsContent value="inspection" className="mt-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              <span>検修完了の登録</span>
            </CardTitle>
            <div className="text-sm text-gray-600">
              機械が検修を完了した日を入力してください。この日付が次回の検査予定の新しい起算日となります。
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vis_vehicle_id">対象の機械番号</Label>
                <Select 
                  value={inspectionForm.vehicle_id} 
                  onValueChange={(value: string) => setInspectionForm({ ...inspectionForm, vehicle_id: value })}
                >
                  <SelectTrigger id="vis_vehicle_id">
                    <SelectValue placeholder="機械番号を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {allVehicles.sort((a,b) => a.machine_number.localeCompare(b.machine_number, 'ja', {numeric: true})).map((vehicle) => (
                      <SelectItem key={vehicle.id} value={(vehicle.id || "none").toString()}>
                        {vehicle.machine_number} ({vehicle.vehicle_type || '機種不明'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vis_completion_date">検修完了日</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="vis_completion_date"
                    type="date"
                    value={inspectionForm.completion_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInspectionForm({ ...inspectionForm, completion_date: e.target.value })}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setInspectionForm({ ...inspectionForm, completion_date: new Date().toISOString().slice(0, 10) })}
                  >
                    今日
                  </Button>
                </div>
              </div>

              {inspectionForm.vehicle_id && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-semibold">更新後の動作について：</p>
                    <p>この機械「{allVehicles.find(v => v.id.toString() === inspectionForm.vehicle_id)?.machine_number}」の次回の検査予定は、<strong>{inspectionForm.completion_date}</strong> を基準として、機種マスタで設定された周期（月数）を加算して計算されるようになります。</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button 
                onClick={handleSaveInspection}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!inspectionForm.vehicle_id}
              >
                <Save className="w-4 h-4 mr-2" />
                検修完了を登録する
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

      {/* 実績編集モーダル */}
      <Dialog open={showRecordModal} onOpenChange={(open: boolean) => {
        setShowRecordModal(open)
        // モーダルを閉じる時に警告をクリア
        if (!open) {
          setBaseConflictWarning(null)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? "運用実績を編集" : "新しい運用実績を作成"}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan 
                ? "運用計画を基に実績を入力します。必要に応じて修正してください。"
                : editingRecord 
                  ? "既存の運用実績を編集します。"
                  : "計画にはない実績を新規作成します。日付・機種・基地を入力してください。"}
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-1">
              <div className="text-sm font-medium text-blue-900">参照: 運用計画</div>
              <div className="text-xs text-blue-700">
                <div>勤務形態: {selectedPlan.shift_type === "day" ? "昼間" : selectedPlan.shift_type === "night" ? "夜間" : "昼夜"}</div>
                <div>時間: {selectedPlan.start_time?.slice(0, 5)} - {selectedPlan.end_time?.slice(0, 5)}</div>
                <div>予定距離: {selectedPlan.planned_distance} km</div>
                {selectedPlan.notes && <div>備考: {selectedPlan.notes}</div>}
              </div>
            </div>
          )}

          {!selectedPlan && !editingRecord && (
            <div className="bg-amber-50 p-3 rounded-lg space-y-1">
              <div className="text-sm font-medium text-amber-900">⚠️ 計画なしの実績追加</div>
              <div className="text-xs text-amber-700">
                運用計画が存在しない実績を追加します。日付、機種、基地を指定してください。
              </div>
            </div>
          )}

          {/* 基地不一致警告（出発基地：保存不可） */}
          {departureConflict && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{departureConflict}</AlertDescription>
            </Alert>
          )}

          {/* 基地不一致警告（到着基地：保存可能） */}
          {arrivalConflict && (
            <Alert className="bg-amber-50 border-amber-200 text-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription>{arrivalConflict}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">車両:</span>
                  <span className="ml-2 font-medium">
                    {allVehicles.find(v => String(v.id) === String(recordForm.vehicle_id))?.machine_number || '未設定'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">実績日:</span>
                  <span className="ml-2 font-medium">{recordForm.record_date}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift_type">勤務形態</Label>
                <Select 
                  value={recordForm.shift_type} 
                  onValueChange={(value: string) => setRecordForm({ ...recordForm, shift_type: value })}
                >
                  <SelectTrigger id="shift_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">昼間</SelectItem>
                    <SelectItem value="night">夜間</SelectItem>
                    <SelectItem value="day_night">昼夜</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time">開始時刻</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={recordForm.start_time}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecordForm({ ...recordForm, start_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">終了時刻</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={recordForm.end_time}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecordForm({ ...recordForm, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure_base">出発基地</Label>
                <Select 
                  value={recordForm.departure_base_id} 
                  onValueChange={(value: string) => {
                    const isAsPlanned = selectedPlan 
                      ? value === (selectedPlan.departure_base_id?.toString() || "none") && 
                        recordForm.arrival_base_id === (selectedPlan.arrival_base_id?.toString() || "none")
                      : false

                    setRecordForm({ 
                      ...recordForm, 
                      departure_base_id: value,
                      is_as_planned: isAsPlanned
                    })
                    
                    // 出発基地変更時に不整合を再チェック
                    if (value && value !== "none") {
                      const lastArrivalBaseId = getLastDetentionBase(recordForm.vehicle_id as any, recordForm.record_date)
                      
                      if (lastArrivalBaseId && String(lastArrivalBaseId) !== String(value)) {
                        const selectedBaseName = allBases.find(b => String(b.id) === String(value))?.base_name
                        const correctBaseName = allBases.find(b => String(b.id) === String(lastArrivalBaseId))?.base_name
                        setDepartureConflict(`⚠️ 出発基地不一致: 推定される留置場所は「${correctBaseName}」ですが、「${selectedBaseName}」から出発しようとしています。`)
                      } else {
                        setDepartureConflict(null)
                      }
                    } else {
                      setDepartureConflict(null)
                    }
                  }}
                >
                  <SelectTrigger id="departure_base">
                    <SelectValue placeholder="出発基地を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">なし</SelectItem>
                    {(() => {
                      // 実績・計画を統合的に考慮して現在の留置基地を取得
                      const currentDetentionBase = getLastDetentionBase(
                        recordForm.vehicle_id as any,
                        recordForm.record_date
                      )
                      
                      return (
                        <>
                          {filteredBasesForModal.length > 0 && (
                            <>
                              {filteredBasesForModal.filter(b => b.id).map((base) => {
                                const isDetentionBase = currentDetentionBase && String(base.id) === String(currentDetentionBase)
                                const isDisabled = currentDetentionBase && !isDetentionBase
                                
                                return (
                                  <SelectItem 
                                    key={base.id} 
                                    value={base.id.toString()}
                                    disabled={isDisabled}
                                    className={isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                                  >
                                    {base.base_name}
                                    {isDetentionBase && ' ✓ (留置中)'}
                                    {isDisabled && ' (選択不可)'}
                                  </SelectItem>
                                )
                              })}
                              {otherBasesForModal.length > 0 && (
                                <SelectItem disabled value="divider" className="text-xs text-gray-400 py-1">
                                  ──────────
                                </SelectItem>
                              )}
                            </>
                          )}
                          {otherBasesForModal.length > 0 && (
                            <>
                              {selectedOfficeId !== "all" && (
                                <SelectItem disabled value="other-label" className="text-xs text-gray-500 font-medium">
                                  その他の基地
                                </SelectItem>
                              )}
                              {otherBasesForModal.filter(b => b.id).map((base) => {
                                const isDetentionBase = currentDetentionBase && String(base.id) === String(currentDetentionBase)
                                const isDisabled = currentDetentionBase && !isDetentionBase
                                
                                return (
                                  <SelectItem 
                                    key={base.id} 
                                    value={base.id.toString()}
                                    disabled={isDisabled}
                                    className={isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                                  >
                                    {base.base_name}
                                    {isDetentionBase && ' ✓ (留置中)'}
                                    {isDisabled && ' (選択不可)'}
                                  </SelectItem>
                                )
                              })}
                            </>
                          )}
                        </>
                      )
                    })()}
                  </SelectContent>
                </Select>
                {!editingRecord && (() => {
                  // 実績優先で現在の留置基地を取得
                  const previousRecords = operationRecords
                    .filter(r => {
                      const rDate = typeof r.record_date === 'string' ? r.record_date.split('T')[0] : r.record_date
                      return String(r.vehicle_id) === String(recordForm.vehicle_id) && rDate < recordForm.record_date
                    })
                    .sort((a, b) => {
                      const aDate = typeof a.record_date === 'string' ? a.record_date.split('T')[0] : a.record_date
                      const bDate = typeof b.record_date === 'string' ? b.record_date.split('T')[0] : b.record_date
                      return bDate.localeCompare(aDate)
                    })
                  
                  let currentDetentionBase: number | null = null
                  let isFromRecord = false
                  
                  // 実績がある場合は最新の実績の到着基地
                  if (previousRecords.length > 0 && previousRecords[0].arrival_base_id) {
                    currentDetentionBase = previousRecords[0].arrival_base_id
                    isFromRecord = true
                  } else {
                    // 実績がない場合は計画から判定
                    currentDetentionBase = getLastDetentionBase(
                      recordForm.vehicle_id as any,
                      recordForm.record_date
                    )
                  }
                  
                  if (currentDetentionBase) {
                    const detentionBaseName = allBases.find(b => String(b.id) === String(currentDetentionBase))?.base_name
                    return (
                      <div className={`text-xs p-2 rounded flex items-start space-x-1 ${
                        isFromRecord ? 'text-green-700 bg-green-50' : 'text-blue-600 bg-blue-50'
                      }`}>
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>
                          現在の留置基地: <strong>{detentionBaseName}</strong>
                          {isFromRecord && <span className="ml-1">(実績より)</span>}
                        </span>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrival_base">到着基地</Label>
                <Select 
                  value={recordForm.arrival_base_id} 
                  onValueChange={(value: string) => {
                    const isAsPlanned = selectedPlan 
                      ? recordForm.departure_base_id === (selectedPlan.departure_base_id?.toString() || "none") && 
                        value === (selectedPlan.arrival_base_id?.toString() || "none")
                      : false

                    setRecordForm({ 
                      ...recordForm, 
                      arrival_base_id: value,
                      is_as_planned: isAsPlanned
                    })
                    
                    // 到着基地変更時に警告をチェック
                    if (value && value !== "none") {
                      const warning = checkBaseConflict(
                        recordForm.vehicle_id,
                        recordForm.record_date,
                        Number.parseInt(value)
                      )
                      setArrivalConflict(warning)
                    } else {
                      setArrivalConflict(null)
                    }
                  }}
                >
                  <SelectTrigger id="arrival_base">
                    <SelectValue placeholder="到着基地を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">なし</SelectItem>
                    {filteredBasesForModal.length > 0 && (
                      <>
                        {filteredBasesForModal.filter(b => b.id).map((base) => (
                          <SelectItem key={base.id} value={(base.id || "none").toString()}>
                            {base.base_name}
                          </SelectItem>
                        ))}
                        {otherBasesForModal.length > 0 && (
                          <SelectItem disabled value="divider" className="text-xs text-gray-400 py-1">
                            ──────────
                          </SelectItem>
                        )}
                      </>
                    )}
                    {otherBasesForModal.length > 0 && (
                      <>
                        {selectedOfficeId !== "all" && (
                          <SelectItem disabled value="other-label" className="text-xs text-gray-500 font-medium">
                            その他の基地
                          </SelectItem>
                        )}
                        {otherBasesForModal.filter(b => b.id).map((base) => (
                          <SelectItem key={base.id} value={(base.id || "none").toString()}>
                            {base.base_name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {/* 到着基地に関する警告表示のみ（クリック時チェックは削除） */}
                {arrivalConflict && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-1">
                    {arrivalConflict}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actual_distance">実績距離 (km)</Label>
                <Input
                  id="actual_distance"
                  type="number"
                  min="0"
                  step="0.1"
                  value={recordForm.actual_distance}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecordForm({ ...recordForm, actual_distance: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">ステータス</Label>
                <Select 
                  value={recordForm.status} 
                  onValueChange={(value: string) => setRecordForm({ ...recordForm, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">完了</SelectItem>
                    <SelectItem value="partial">部分実施</SelectItem>
                    <SelectItem value="cancelled">中止</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={recordForm.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRecordForm({ ...recordForm, notes: e.target.value })}
                placeholder="備考を入力してください"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <Checkbox
                id="is_as_planned"
                checked={recordForm.is_as_planned}
                onCheckedChange={(checked: boolean | 'indeterminate') => setRecordForm({ ...recordForm, is_as_planned: checked as boolean })}
              />
              <Label htmlFor="is_as_planned" className="text-sm font-medium cursor-pointer">
                計画通りの実績（チェックすると青系の色で表示されます）
              </Label>
            </div>
          </div>

          <DialogFooter>
            <div className="flex justify-between w-full">
              <div>
                {editingRecord && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteRecord}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    削除
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRecordModal(false)
                    setEditingRecord(null)
                    setSelectedPlan(null)
                    setBaseConflictWarning(null)
                  }}
                >
                  キャンセル
                </Button>
                <Button 
                  onClick={handleSaveRecord}
                  disabled={!!baseConflictWarning}
                  className={baseConflictWarning ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingRecord ? "更新" : "作成"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 運用計画作成モーダル */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "運用計画を編集" : isCreatingPlanFromDetention ? "留置中から新しい運用計画を作成" : "新しい運用計画を作成"}
            </DialogTitle>
            <DialogDescription>
              {editingPlan 
                ? "運用計画の内容を編集します。" 
                : isCreatingPlanFromDetention 
                  ? "最終留置基地から出発する運用計画を作成します。" 
                  : "新しい運用計画を作成します。"}
            </DialogDescription>
          </DialogHeader>

          {/* 基地不一致警告 */}
          {nextPlanConflictWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {nextPlanConflictWarning}
                <div className="mt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      // 警告を確認して保存を続行
                      handleSavePlan()
                    }}
                  >
                    確認しました。計画を作成する
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan_vehicle">車両</Label>
                <Select 
                  value={planForm.vehicle_id} 
                  onValueChange={(value: string) => setPlanForm({ ...planForm, vehicle_id: value })}
                  disabled={editingPlan !== null || isCreatingPlanFromDetention}
                >
                  <SelectTrigger id="plan_vehicle">
                    <SelectValue placeholder="車両を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {allVehicles.filter(v => v.id).map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id?.toString() || ""}>
                        {vehicle.name} - {vehicle.machine_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan_date">計画日</Label>
                <Input
                  id="plan_date"
                  type="date"
                  value={planForm.plan_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlanForm({ ...planForm, plan_date: e.target.value })}
                  disabled={editingPlan !== null}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan_end_date">終了日（検修期間用）</Label>
                <Input
                  id="plan_end_date"
                  type="date"
                  value={planForm.end_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlanForm({ ...planForm, end_date: e.target.value })}
                  placeholder="任意"
                />
                <div className="text-xs text-gray-500">
                  検修期間を設定する場合に入力してください
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan_shift_type">運用予定</Label>
                  <Select 
                    value={planForm.shift_type} 
                    onValueChange={(value: string) => {
                      setPlanForm({ 
                        ...planForm, 
                        shift_type: value,
                        inspection_type_id: value === "maintenance" ? planForm.inspection_type_id : ""
                      })
                    }}
                  >
                    <SelectTrigger id="plan_shift_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">昼間</SelectItem>
                      <SelectItem value="night">夜間</SelectItem>
                      <SelectItem value="maintenance">検修</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {planForm.shift_type === "maintenance" && (
                  <div className="space-y-2">
                    <Label htmlFor="plan_inspection_type">検修種別</Label>
                    <Select 
                      value={planForm.inspection_type_id} 
                      onValueChange={(value: string) => setPlanForm({ ...planForm, inspection_type_id: value })}
                    >
                      <SelectTrigger id="plan_inspection_type">
                        <SelectValue placeholder="検修種別を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {inspectionTypes.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            検修種別マスタにデータがありません
                          </div>
                        ) : (
                          inspectionTypes.map((type) => (
                            <SelectItem key={type.id} value={(type.id || "none").toString()}>
                              {type.type_name}・{type.interval_days ? `${type.interval_days}日` : '期間未設定'}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan_start_time">開始時刻</Label>
                  <Input
                    id="plan_start_time"
                    type="time"
                    value={planForm.start_time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlanForm({ ...planForm, start_time: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan_end_time">終了時刻</Label>
                  <Input
                    id="plan_end_time"
                    type="time"
                    value={planForm.end_time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlanForm({ ...planForm, end_time: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan_departure_base">出発基地</Label>
                <Select 
                  value={planForm.departure_base_id} 
                  onValueChange={(value: string) => setPlanForm({ ...planForm, departure_base_id: value })}
                  disabled={isCreatingPlanFromDetention}
                >
                  <SelectTrigger id="plan_departure_base">
                    <SelectValue placeholder="出発基地を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBasesForModal.length > 0 && (
                      <>
                        {filteredBasesForModal.filter(b => b.id).map((base) => (
                          <SelectItem key={base.id} value={(base.id || "none").toString()}>
                            {base.base_name}
                          </SelectItem>
                        ))}
                        {otherBasesForModal.length > 0 && (
                          <SelectItem disabled value="divider" className="text-xs text-gray-400 py-1">
                            ──────────
                          </SelectItem>
                        )}
                      </>
                    )}
                    {otherBasesForModal.length > 0 && (
                      <>
                        {selectedOfficeId !== "all" && (
                          <SelectItem disabled value="other-label" className="text-xs text-gray-500 font-medium">
                            その他の基地
                          </SelectItem>
                        )}
                        {otherBasesForModal.filter(b => b.id).map((base) => (
                          <SelectItem key={base.id} value={(base.id || "none").toString()}>
                            {base.base_name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {isCreatingPlanFromDetention && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    ℹ️ 最終留置基地から出発します（変更不可）
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan_arrival_base">到着基地</Label>
                <Select 
                  value={planForm.arrival_base_id} 
                  onValueChange={(value: string) => {
                    setPlanForm({ ...planForm, arrival_base_id: value })
                    // 到着基地変更時に警告をチェック
                    if (value) {
                      const warning = checkBaseConflict(
                        planForm.vehicle_id,
                        planForm.plan_date,
                        Number.parseInt(value)
                      )
                      setNextPlanConflictWarning(warning)
                    } else {
                      setNextPlanConflictWarning(null)
                    }
                  }}
                >
                  <SelectTrigger id="plan_arrival_base">
                    <SelectValue placeholder="到着基地を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBasesForModal.length > 0 && (
                      <>
                        {filteredBasesForModal.filter(b => b.id).map((base) => (
                          <SelectItem key={base.id} value={(base.id || "none").toString()}>
                            {base.base_name}
                          </SelectItem>
                        ))}
                        {otherBasesForModal.length > 0 && (
                          <SelectItem disabled value="divider" className="text-xs text-gray-400 py-1">
                            ──────────
                          </SelectItem>
                        )}
                      </>
                    )}
                    {otherBasesForModal.length > 0 && (
                      <>
                        {selectedOfficeId !== "all" && (
                          <SelectItem disabled value="other-label" className="text-xs text-gray-500 font-medium">
                            その他の基地
                          </SelectItem>
                        )}
                        {otherBasesForModal.filter(b => b.id).map((base) => (
                          <SelectItem key={base.id} value={(base.id || "none").toString()}>
                            {base.base_name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan_planned_distance">予定距離 (km)</Label>
              <Input
                id="plan_planned_distance"
                type="number"
                min="0"
                step="0.1"
                value={planForm.planned_distance}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlanForm({ ...planForm, planned_distance: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan_notes">備考</Label>
              <Textarea
                id="plan_notes"
                value={planForm.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPlanForm({ ...planForm, notes: e.target.value })}
                placeholder="備考を入力してください"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex space-x-2 w-full justify-between">
              <div>
                {editingPlan && (
                  <Button
                    variant="destructive"
                    onClick={handleDeletePlan}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    削除
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPlanModal(false)
                    setEditingPlan(null)
                    setIsCreatingPlanFromDetention(false)
                    setDetentionBaseId(null)
                    setNextPlanConflictWarning(null)
                  }}
                >
                  キャンセル
                </Button>
                <Button 
                  onClick={() => {
                    if (nextPlanConflictWarning) {
                      // 警告がある場合は何もしない（警告内のボタンで確認）
                      return
                    }
                    handleSavePlan()
                  }}
                  disabled={nextPlanConflictWarning !== null}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingPlan ? "更新" : "作成"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 