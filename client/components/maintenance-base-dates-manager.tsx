"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Calendar, Save, AlertCircle, CheckCircle, Filter, Download, Upload, FileText, History, X } from "lucide-react"
import { apiCall } from "@/lib/api-client"
import type { Vehicle, InspectionType, MaintenanceBaseDate } from "@/types"

interface BaseDateForm {
  vehicle_id: string
  inspection_type_id: number
  base_date: string
  source: string
}

interface Office {
  id?: string
  office_id: string
  office_name: string
  area?: string
}

interface MachineType {
  id: number | string
  type_name: string
  model_name?: string
  manufacturer?: string
  category?: string
}

interface MaintenanceRecord {
  id: number
  vehicle_id: string
  machine_number: string
  machine_type: string
  inspection_type: string
  completion_date: string
  notes?: string
}

export function MaintenanceBaseDatesManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [inspectionTypes, setInspectionTypes] = useState<InspectionType[]>([])
  const [baseDates, setBaseDates] = useState<MaintenanceBaseDate[]>([])
  const [editingDates, setEditingDates] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // フィルター用の状態
  const [offices, setOffices] = useState<Office[]>([])
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([])
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("all")
  const [selectedMachineType, setSelectedMachineType] = useState<string>("all")
  const [selectedMachineNumber, setSelectedMachineNumber] = useState<string>("all")
  const [selectedInspectionTypes, setSelectedInspectionTypes] = useState<number[]>([])
  
  // 検修履歴表示用の状態
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)
  
  // インポート/エクスポート用の状態
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [exportStartDate, setExportStartDate] = useState("")
  const [exportEndDate, setExportEndDate] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  // 事業所フィルターが変更されたとき、機種と機械番号の選択をクリア
  useEffect(() => {
    setSelectedMachineType("all")
    setSelectedMachineNumber("all")
  }, [selectedOfficeId])

  // 機種フィルターが変更されたとき、機械番号の選択をクリア
  useEffect(() => {
    setSelectedMachineNumber("all")
  }, [selectedMachineType])

  // フィルター変更時に検修履歴を取得
  useEffect(() => {
    if (selectedMachineNumber !== "all" || selectedMachineType !== "all" || selectedOfficeId !== "all") {
      fetchMaintenanceRecords()
    } else {
      setMaintenanceRecords([])
    }
  }, [selectedOfficeId, selectedMachineType, selectedMachineNumber])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [vehiclesData, typesData, datesData, officesData, machineTypesData] = await Promise.all([
        apiCall<Vehicle[]>('machines'),
        apiCall<InspectionType[]>('inspection-types'),
        apiCall<MaintenanceBaseDate[]>('maintenance-base-dates'),
        apiCall<Office[]>('offices'),
        apiCall<MachineType[]>('machine-types')
      ])
      
      setVehicles(vehiclesData)
      setInspectionTypes(typesData)
      setBaseDates(datesData)
      setOffices(officesData)
      setMachineTypes(machineTypesData)
      
      // 既存の起算日を編集用フォームに設定
      const dateMap: Record<string, string> = {}
      datesData.forEach((date: MaintenanceBaseDate) => {
        const key = `${date.vehicle_id}_${date.inspection_type_id}`
        dateMap[key] = date.base_date
      })
      setEditingDates(dateMap)
      
    } catch (err) {
      setError('データの取得に失敗しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 検修履歴を取得
  const fetchMaintenanceRecords = async () => {
    try {
      // フィルター条件をクエリパラメータに変換
      const params = new URLSearchParams()
      if (selectedOfficeId !== "all") params.append("office_id", selectedOfficeId)
      if (selectedMachineType !== "all") params.append("machine_type_id", selectedMachineType)
      if (selectedMachineNumber !== "all") params.append("machine_number", selectedMachineNumber)
      
      // 運用管理の実績から検修完了情報を取得
      const records = await apiCall<MaintenanceRecord[]>(`operation-records/maintenance-history?${params.toString()}`)
      setMaintenanceRecords(records || [])
    } catch (err) {
      console.error('検修履歴取得エラー:', err)
      // エラーが発生しても空配列を設定
      setMaintenanceRecords([])
    }
  }

  const handleDateChange = (vehicleId: string, inspectionTypeId: number, date: string) => {
    const key = `${vehicleId}_${inspectionTypeId}`
    setEditingDates(prev => ({ ...prev, [key]: date }))
  }

  const handleSaveAll = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const updates: BaseDateForm[] = []
      
      // フィルターされた車両のみを対象にする
      filteredVehicles.forEach(vehicle => {
        filteredInspectionTypes.forEach(type => {
          const key = `${vehicle.id}_${type.id}`
          const date = editingDates[key]
          
          if (date) {
            updates.push({
              vehicle_id: vehicle.id,
              inspection_type_id: type.id,
              base_date: date,
              source: 'manual'
            })
          }
        })
      })
      
      await apiCall('maintenance-base-dates/bulk-update', {
        method: 'POST',
        body: JSON.stringify({ base_dates: updates })
      })
      
      setSuccess(`${updates.length}件の起算日を保存しました`)
      await fetchData()
      
    } catch (err) {
      setError('保存に失敗しました')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // インポート処理
  const handleImport = async () => {
    if (!importFile) {
      setError('ファイルを選択してください')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const result = await apiCall<{ imported: number }>('maintenance-base-dates/import', {
        method: 'POST',
        body: formData
      })

      setSuccess(`${result.imported}件の起算日をインポートしました`)
      setShowImportDialog(false)
      setImportFile(null)
      await fetchData()
    } catch (err) {
      setError('インポートに失敗しました')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // フォーマットダウンロード
  const handleDownloadFormat = () => {
    const headers = ['機械番号', '機種', '検修種別', '起算日(YYYY-MM-DD)', '設定元']
    const csvContent = headers.join(',') + '\n' + 
      '例: M001,モータカー,月例検査,2026-01-01,manual\n' +
      '例: M002,軌道検測車,3ヶ月点検,2026-01-15,purchase'
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '検修起算日インポートフォーマット.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // エクスポート処理
  const handleExport = async () => {
    setSaving(true)
    setError(null)

    try {
      // フィルターとエクスポート条件をクエリパラメータに変換
      const params = new URLSearchParams()
      if (selectedOfficeId !== "all") params.append("office_id", selectedOfficeId)
      if (selectedMachineType !== "all") params.append("machine_type_id", selectedMachineType)
      if (selectedMachineNumber !== "all") params.append("machine_number", selectedMachineNumber)
      if (exportStartDate) params.append("start_date", exportStartDate)
      if (exportEndDate) params.append("end_date", exportEndDate)

      // CSVデータを生成
      const headers = ['機械番号', '機種', '検修種別', '起算日', '設定元', '更新日時']
      const rows: string[][] = []

      filteredVehicles.forEach(vehicle => {
        filteredInspectionTypes.forEach(type => {
          const baseDate = getBaseDate(vehicle.id, type.id)
          const info = getBaseDateInfo(vehicle.id, type.id)
          
          if (baseDate) {
            // 期間フィルターを適用
            if (exportStartDate && baseDate < exportStartDate) return
            if (exportEndDate && baseDate > exportEndDate) return
            
            rows.push([
              vehicle.machine_number,
              vehicle.machine_type || vehicle.model_name || '',
              type.type_name,
              baseDate,
              info?.source || 'manual',
              info?.updated_at || ''
            ])
          }
        })
      })

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      
      // File System Access APIを使用（対応ブラウザの場合）
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: `検修起算日_${new Date().toISOString().slice(0, 10)}.csv`,
            types: [{
              description: 'CSV Files',
              accept: { 'text/csv': ['.csv'] }
            }]
          })
          const writable = await handle.createWritable()
          await writable.write('\uFEFF' + csvContent)
          await writable.close()
          setSuccess('エクスポートが完了しました')
        } catch (err) {
          // ユーザーがキャンセルした場合
          if ((err as Error).name !== 'AbortError') {
            throw err
          }
        }
      } else {
        // フォールバック: 通常のダウンロード
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `検修起算日_${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setSuccess('エクスポートが完了しました')
      }

      setShowExportDialog(false)
    } catch (err) {
      setError('エクスポートに失敗しました')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const getBaseDate = (vehicleId: string, inspectionTypeId: number): string => {
    const key = `${vehicleId}_${inspectionTypeId}`
    return editingDates[key] || ''
  }

  const getBaseDateInfo = (vehicleId: string, inspectionTypeId: number) => {
    return baseDates.find(
      d => d.vehicle_id === vehicleId && d.inspection_type_id === inspectionTypeId
    )
  }

  // フィルターされた機械リスト
  const filteredVehicles = vehicles.filter(vehicle => {
    // 事業所フィルター (office_id または management_office_id をチェック)
    if (selectedOfficeId !== "all") {
      const vehicleOfficeId = (vehicle as any).office_id?.toString() || vehicle.management_office_id?.toString()
      if (vehicleOfficeId !== selectedOfficeId) {
        return false
      }
    }
    
    // 機種フィルター (machine_type_id で比較)
    if (selectedMachineType !== "all") {
      const vehicleTypeId = vehicle.machine_type_id?.toString() || (vehicle as any).machine_type_id?.toString()
      if (vehicleTypeId !== selectedMachineType) {
        return false
      }
    }
    
    // 機械番号フィルター
    if (selectedMachineNumber !== "all" && vehicle.machine_number !== selectedMachineNumber) {
      return false
    }
    
    return true
  })

  // フィルターされた検修種別リスト
  const filteredInspectionTypes = inspectionTypes.filter(type => {
    if (selectedInspectionTypes.length === 0) return true
    return selectedInspectionTypes.includes(type.id)
  })

  // 機種リスト（現在の事業所フィルターに応じて）
  const availableMachineTypes = useMemo(() => {
    // 事業所が「すべて」の場合：全機種を表示
    if (selectedOfficeId === "all") {
      return machineTypes
    }
    
    // 事業所が選択されている場合：その事業所の機械が持つ機種のみを表示
    const vehiclesInOffice = vehicles.filter(v => {
      // APIから返されるoffice_idを使用（management_office_idにマッピングされる場合もある）
      const vehicleOfficeId = (v as any).office_id?.toString() || v.management_office_id?.toString()
      return vehicleOfficeId === selectedOfficeId
    })
    
    const typeIdsInOffice = vehiclesInOffice
      .map(v => (v as any).machine_type_id?.toString() || v.machine_type_id?.toString())
      .filter(Boolean)
    
    const uniqueTypeIds = new Set(typeIdsInOffice)
    return machineTypes.filter(mt => uniqueTypeIds.has(mt.id.toString()))
  }, [vehicles, machineTypes, selectedOfficeId])

  // 機械番号のリスト（現在の事業所・機種フィルター条件に応じて）
  const availableMachineNumbers = useMemo(() => {
    let filteredVehiclesList = vehicles
    
    // 事業所でフィルタリング
    if (selectedOfficeId !== "all") {
      filteredVehiclesList = filteredVehiclesList.filter(v => {
        const vehicleOfficeId = (v as any).office_id?.toString() || v.management_office_id?.toString()
        return vehicleOfficeId === selectedOfficeId
      })
    }
    
    // 機種でフィルタリング
    if (selectedMachineType !== "all") {
      filteredVehiclesList = filteredVehiclesList.filter(v => {
        const vehicleTypeId = (v as any).machine_type_id?.toString() || v.machine_type_id?.toString()
        return vehicleTypeId === selectedMachineType
      })
    }
    
    const machineNumbers = filteredVehiclesList
      .map(v => v.machine_number)
      .filter(Boolean)
    
    // 重複を除去してソート（日本語の数値ソート対応）
    return Array.from(new Set(machineNumbers)).sort((a, b) => a.localeCompare(b, 'ja', { numeric: true }))
  }, [vehicles, selectedOfficeId, selectedMachineType])

  // 機種に応じた検修種別のフィルタリング
  // モータカー・MCR・MTT系: 定期点検・乙検査・甲検査のみ
  // それ以外（鉄トロ・箱トロ・ホッパー等）: 全般検査・細密検査のみ
  const getApplicableInspectionTypes = (vehicle: Vehicle): InspectionType[] => {
    const machineType = machineTypes.find(mt => mt.id.toString() === vehicle.machine_type_id?.toString())
    const typeName = (machineType?.type_name || machineType?.model_name || vehicle.machine_type || '').toLowerCase()
    const machineNumber = (vehicle.machine_number || '').toLowerCase()
    
    // 機械番号から非モータカー系（鉄トロ・箱トロ・ホッパー等）を判定
    const isNonMotorCarByNumber = 
      machineNumber.includes('box') ||      // 箱トロ
      machineNumber.includes('hopper') ||   // ホッパー
      machineNumber.includes('trolley') ||  // 鉄トロ
      machineNumber.includes('tro') ||      // トロ系
      machineNumber.startsWith('t') && !machineNumber.startsWith('td')  // T始まり（TD以外）
    
    // 機種名からモータカー・MCR・MTT系かどうかを判定
    const isMotorCarByType = 
      typeName.includes('モータカー') || 
      typeName.includes('motorcar') ||
      typeName.includes('mcr') ||
      typeName.includes('mtt') ||
      typeName.includes('mc') ||
      typeName.includes('軌道モータカー')
    
    // 非モータカー系の機械番号の場合は、機種名に関係なく非モータカー系として扱う
    const isMotorCarType = isMotorCarByType && !isNonMotorCarByNumber
    
    if (isMotorCarType) {
      // モータカー系: 定期点検・乙検査・甲検査のみ（全般検査・細密検査は除外）
      return inspectionTypes.filter(type => {
        const name = type.type_name.toLowerCase()
        return !name.includes('全般') && !name.includes('細密')
      })
    } else {
      // 鉄トロ・箱トロ・ホッパー等: 全般検査・細密検査のみ（定期点検・乙検査・甲検査は除外）
      return inspectionTypes.filter(type => {
        const name = type.type_name.toLowerCase()
        return name.includes('全般') || name.includes('細密')
      })
    }
  }

  // 全検修種別のユニオン（ヘッダー表示用）
  const allApplicableInspectionTypes = (() => {
    const allTypes = new Map<number, InspectionType>()
    filteredVehicles.forEach(vehicle => {
      getApplicableInspectionTypes(vehicle).forEach(type => {
        allTypes.set(type.id, type)
      })
    })

    // 指定された順序でソート
    const order = ["定期点検", "乙A検査", "乙B検査", "甲A検査", "甲B検査", "全般検査", "細密検査"]
    
    return Array.from(allTypes.values()).sort((a, b) => {
      const indexA = order.indexOf(a.type_name)
      const indexB = order.indexOf(b.type_name)
      
      // リストにない場合は最後に配置
      if (indexA === -1 && indexB === -1) return a.id - b.id
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      
      return indexA - indexB
    })
  })()

  // 機種選択時に関連する検修種別を自動選択
  useEffect(() => {
    if (selectedMachineType !== "all") {
      // 選択された機種に応じた検修種別のみを表示
      const selectedType = machineTypes.find(mt => mt.id.toString() === selectedMachineType)
      const typeName = (selectedType?.type_name || selectedType?.model_name || '').toLowerCase()
      
      const isMotorCarType = 
        typeName.includes('モータカー') || 
        typeName.includes('motorcar') ||
        typeName.includes('mcr') ||
        typeName.includes('mtt') ||
        typeName.includes('mc') ||
        typeName.includes('軌道モータカー')
      
      if (isMotorCarType) {
        // モータカー系の検修種別のみ
        const applicableTypes = inspectionTypes.filter(type => {
          const name = type.type_name.toLowerCase()
          return !name.includes('全般') && !name.includes('細密')
        })
        setSelectedInspectionTypes(applicableTypes.map(t => t.id))
      } else {
        // 鉄トロ・箱トロ・ホッパー等の検修種別のみ
        const applicableTypes = inspectionTypes.filter(type => {
          const name = type.type_name.toLowerCase()
          return name.includes('全般') || name.includes('細密')
        })
        setSelectedInspectionTypes(applicableTypes.map(t => t.id))
      }
    } else {
      setSelectedInspectionTypes([])
    }
  }, [selectedMachineType, inspectionTypes, machineTypes])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2" />
            <span>読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            検修起算日設定
          </CardTitle>
          <CardDescription>
            各機械の検修種別ごとに起算日を設定します。検修終了後は自動的に更新されます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* フィルターセクション */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="w-4 h-4" />
                フィルター
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 事業所フィルター */}
                <div className="space-y-2">
                  <Label htmlFor="office-filter">事業所</Label>
                  <Select value={selectedOfficeId} onValueChange={(val: string) => {
                    setSelectedOfficeId(val)
                    setSelectedMachineType("all")
                    setSelectedMachineNumber("all")
                  }}>
                    <SelectTrigger id="office-filter">
                      <SelectValue placeholder="事業所を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {offices.map(office => (
                        <SelectItem key={office.office_id} value={office.office_id}>
                          {office.office_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 機種フィルター */}
                <div className="space-y-2">
                  <Label htmlFor="machine-type-filter">機種</Label>
                  <Select value={selectedMachineType} onValueChange={(val: string) => {
                    setSelectedMachineType(val)
                    setSelectedMachineNumber("all")
                  }}>
                    <SelectTrigger id="machine-type-filter">
                      <SelectValue placeholder="機種を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {availableMachineTypes.map((type: MachineType) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.model_name || type.type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 機械番号フィルター */}
                <div className="space-y-2">
                  <Label htmlFor="machine-number-filter">機械番号</Label>
                  <Select value={selectedMachineNumber} onValueChange={setSelectedMachineNumber}>
                    <SelectTrigger id="machine-number-filter">
                      <SelectValue placeholder="機械番号を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {availableMachineNumbers.map((number: string) => (
                        <SelectItem key={number} value={number}>
                          {number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 検修種別のリスト表示（機種選択時） */}
              {selectedMachineType !== "all" && (
                <div className="space-y-2 pt-4 border-t">
                  <Label>選択中の機種の検修種別</Label>
                  <div className="flex flex-wrap gap-2">
                    {inspectionTypes.map(type => (
                      <div
                        key={type.id}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                      >
                        {type.type_name}
                        {type.interval_months && (
                          <span className="ml-2 text-xs text-blue-600">
                            ({type.interval_months}ヶ月周期)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* フィルター結果表示 */}
              <div className="text-sm text-gray-600 pt-2 flex justify-between items-center">
                <span>表示中: {filteredVehicles.length}台 / {vehicles.length}台</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSelectedOfficeId("all")
                    setSelectedMachineType("all")
                    setSelectedMachineNumber("all")
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  フィルターリセット
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 検修履歴表示セクション */}
          {maintenanceRecords.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
                  <History className="w-4 h-4" />
                  前回の検修実績
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="ml-auto"
                  >
                    {showHistory ? <X className="w-4 h-4" /> : '詳細表示'}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showHistory && (
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-orange-100">
                        <tr>
                          <th className="px-3 py-2 text-left">機械番号</th>
                          <th className="px-3 py-2 text-left">機種</th>
                          <th className="px-3 py-2 text-left">検修種別</th>
                          <th className="px-3 py-2 text-left">完了日</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maintenanceRecords.map(record => (
                          <tr key={record.id} className="border-t border-orange-200">
                            <td className="px-3 py-2">{record.machine_number}</td>
                            <td className="px-3 py-2">{record.machine_type}</td>
                            <td className="px-3 py-2">{record.inspection_type}</td>
                            <td className="px-3 py-2">{record.completion_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* ボタン群 */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setShowImportDialog(true)}
              disabled={saving}
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              一括インポート
            </Button>
            
            <Button
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? '保存中...' : '保存'}
            </Button>
            
            <Button
              onClick={() => setShowExportDialog(true)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              エクスポート
            </Button>
          </div>

          {/* 起算日設定テーブル */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium sticky left-0 bg-gray-50 z-10">
                      機械番号
                    </th>
                    <th className="px-4 py-2 text-left font-medium">機種</th>
                    {allApplicableInspectionTypes.map(type => (
                      <th key={type.id} className="px-4 py-2 text-left font-medium min-w-[180px]">
                        {type.type_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map(vehicle => {
                    // この車両に適用可能な検修種別を取得
                    const applicableTypes = getApplicableInspectionTypes(vehicle)
                    const applicableTypeIds = new Set(applicableTypes.map(t => t.id))
                    
                    return (
                      <tr key={vehicle.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium sticky left-0 bg-white">
                          {vehicle.machine_number}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {vehicle.machine_type || vehicle.model_name}
                        </td>
                        {allApplicableInspectionTypes.map(type => {
                          // この車両にこの検修種別が適用可能かどうかをチェック
                          const isApplicable = applicableTypeIds.has(type.id)
                          
                          if (!isApplicable) {
                            // 適用対象外の場合はグレーのセルを表示
                            return (
                              <td key={`${vehicle.id}_${type.id}`} className="px-4 py-2 bg-gray-100 text-center">
                                <span className="text-gray-400 text-xs">-</span>
                              </td>
                            )
                          }
                          
                          const baseDate = getBaseDate(vehicle.id, type.id)
                          const info = getBaseDateInfo(vehicle.id, type.id)
                          
                          return (
                            <td key={`${vehicle.id}_${type.id}`} className="px-4 py-2">
                              <div className="space-y-1">
                                <Input
                                  type="date"
                                  value={baseDate}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateChange(vehicle.id, type.id, e.target.value)}
                                  className="text-sm"
                                />
                                {info && (
                                  <div className="text-xs text-gray-500">
                                    {info.source === 'manual' && '手動設定'}
                                    {info.source === 'purchase' && '購入日'}
                                    {info.source === 'completion' && '検修完了日'}
                                    {info.source === 'system' && 'システム'}
                                  </div>
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ヘルプ */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 使い方</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• フィルターで事業所・機種・機械番号を絞り込めます</li>
              <li>• フィルター選択時に前回の検修実績が表示されます</li>
              <li>• 「一括インポート」でCSV/Excelファイルから起算日を一括設定できます</li>
              <li>• 「保存」ボタンで表示中のデータを保存します</li>
              <li>• 「エクスポート」でCSV形式で出力（期間指定・保存先選択可能）</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* インポートダイアログ */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              一括インポート
            </DialogTitle>
            <DialogDescription>
              CSV または Excel ファイルから検修起算日を一括インポートします。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>インポートファイル</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImportFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
              </div>
              {importFile && (
                <p className="text-sm text-gray-600">
                  選択中: {importFile.name}
                </p>
              )}
            </div>
            
            <div className="border-t pt-4">
              <Button variant="outline" size="sm" onClick={handleDownloadFormat}>
                <FileText className="w-4 h-4 mr-2" />
                フォーマットをダウンロード
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                上記フォーマットに従ってデータを入力してください。
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? 'インポート中...' : 'インポート'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* エクスポートダイアログ */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              エクスポート
            </DialogTitle>
            <DialogDescription>
              検修起算日データをCSV形式でエクスポートします。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">現在のフィルター条件</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>事業所: {selectedOfficeId === "all" ? "すべて" : offices.find(o => o.office_id === selectedOfficeId)?.office_name}</p>
                <p>機種: {selectedMachineType === "all" ? "すべて" : machineTypes.find(t => t.id.toString() === selectedMachineType)?.model_name}</p>
                <p>機械番号: {selectedMachineNumber === "all" ? "すべて" : selectedMachineNumber}</p>
                <p>対象件数: {filteredVehicles.length}台</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="export-start-date">開始日（任意）</Label>
                <Input
                  id="export-start-date"
                  type="date"
                  value={exportStartDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExportStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="export-end-date">終了日（任意）</Label>
                <Input
                  id="export-end-date"
                  type="date"
                  value={exportEndDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExportEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <p className="text-xs text-gray-500">
              ※ 保存先はダイアログで選択できます（対応ブラウザの場合）。
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleExport}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? 'エクスポート中...' : 'エクスポート'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
