"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, Search, Download, Upload, FileSpreadsheet, FileText, AlertCircle, CheckCircle } from "lucide-react"
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { saveAs } from 'file-saver'
import { VehicleForm } from "@/components/vehicle-form"

interface Vehicle {
  id: number
  machine_number: string
  vehicle_type: string
  model?: string
  manufacturer?: string
  acquisition_date?: string
  type_approval_start_date?: string
  type_approval_duration?: number
  special_notes?: string
  management_office_id: number
  status: string
  created_at: string
  updated_at: string
  office_name?: string
  office_code?: string
}

interface ManagementOffice {
  id: number
  office_name: string
  office_code: string
  created_at: string
  updated_at: string
}

interface ImportResult {
  success: number
  failed: number
  errors: string[]
  newVehicles: Vehicle[]
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [offices, setOffices] = useState<ManagementOffice[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    vehicle_type: "",
    machine_number: "",
    management_office_code: "",
  })

  // 車両データを取得する関数を外部化
  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      if (response.ok) {
        const vehiclesData = await response.json()
        setVehicles(vehiclesData)
        setFilteredVehicles(vehiclesData)
      }
    } catch (error) {
      console.error('車両データの取得に失敗:', error)
      toast({
        title: "エラー",
        description: "車両データの取得に失敗しました",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchVehicles()

    // 事業所データを取得
    const fetchOffices = async () => {
      try {
        const response = await fetch('/api/management-offices')
        if (response.ok) {
          const officesData = await response.json()
          setOffices(officesData)
        }
      } catch (error) {
        console.error('事業所データの取得に失敗:', error)
        // モックデータをフォールバックとして使用
        const mockOffices: ManagementOffice[] = [
          {
            id: 1,
            office_name: "本社保守事業所",
            office_code: "HQ001",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          {
            id: 2,
            office_name: "関西支社保守事業所",
            office_code: "KS001",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ]
        setOffices(mockOffices)
      }
    }
    fetchOffices()
  }, [])

  useEffect(() => {
    let filtered = vehicles.filter(
      (vehicle) =>
        vehicle.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.machine_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.management_office_code.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (filterType !== "all") {
      filtered = filtered.filter((vehicle) => vehicle.vehicle_type === filterType)
    }

    setFilteredVehicles(filtered)
  }, [vehicles, searchTerm, filterType])

  const generateVehicleId = (vehicleType: string) => {
    const typeMap: { [key: string]: string } = {
      'MC-100': 'MC',
      'MC-150': 'MC',
      'TT-200': 'TT',
      'TT-250': 'TT',
      'HP-300': 'HP',
      'HP-350': 'HP'
    }

    const prefix = typeMap[vehicleType] || 'XX'
    const maxId = vehicles.reduce((max, vehicle) => {
      const idNum = parseInt(vehicle.id.toString().replace(/\D/g, '')) || 0
      return Math.max(max, idNum)
    }, 0)
    return maxId + 1
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingVehicle) {
      const updatedVehicles = vehicles.map((vehicle) =>
        vehicle.id === editingVehicle.id ? { ...vehicle, ...formData } : vehicle,
      )
      setVehicles(updatedVehicles)
      setEditingVehicle(null)
    } else {
      const newVehicle: Vehicle = {
        id: generateVehicleId(formData.vehicle_type),
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setVehicles([...vehicles, newVehicle])
    }

    setFormData({
      vehicle_type: "",
      machine_number: "",
      management_office_code: "",
    })
    setIsFormOpen(false)
  }

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('この車両を削除しますか？')) return

    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // サーバーから最新データを再取得
        await fetchVehicles()
        toast({
          title: "削除完了",
          description: "車両を削除しました",
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error("Delete error response:", errorData)
        console.error("Response status:", response.status)
        toast({
          title: "削除エラー",
          description: errorData.details || errorData.error || "車両の削除に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('車両の削除に失敗:', error)
      toast({
        title: "エラー",
        description: "車両の削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  // エクスポート機能


  const exportToCSV = () => {
    const csvData = filteredVehicles.map((vehicle) => ({
      "ID": vehicle.id,
      "機種": vehicle.vehicle_type,
      "機械番号": vehicle.machine_number,
      "型式": vehicle.model || "",
      "製造メーカー": vehicle.manufacturer || "",
      "取得年月": vehicle.acquisition_date || "",
      "型式認定有効起算日": vehicle.type_approval_start_date || "",
      "型式認定有効期間（月数）": vehicle.type_approval_duration || "",
      "特記事項": vehicle.special_notes || "",
      "管理事業所": vehicle.office_name || "",
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    saveAs(blob, `保守用車マスタ_${new Date().toISOString().split("T")[0]}.csv`)
  }

  // インポート機能
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        let parsedData: any[] = []

        if (file.name.endsWith('.csv')) {
          // CSVファイルの処理
          const result = Papa.parse(content, { header: true, skipEmptyLines: true })
          parsedData = result.data
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Excelファイルの処理
          const workbook = XLSX.read(content, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          parsedData = XLSX.utils.sheet_to_json(worksheet)
        }

        const importResult = processImportData(parsedData)
        setImportResult(importResult)
        
        if (importResult.success > 0) {
          toast({
            title: "インポート完了",
            description: `${importResult.success}件の車両データをインポートしました`,
          })
        }
      } catch (error) {
        console.error('Import error:', error)
        setImportResult({
          success: 0,
          failed: 0,
          errors: ['ファイルの読み込みに失敗しました']
        })
        toast({
          title: "インポートエラー",
          description: "ファイルの読み込みに失敗しました",
          variant: "destructive",
        })
      } finally {
        setIsImporting(false)
      }
    }

    reader.readAsBinaryString(file)
  }

  const processImportData = (data: any[]): ImportResult => {
    const errors: string[] = []
    let success = 0
    let failed = 0

    const newVehicles: Vehicle[] = []
    const existingIds = new Set(vehicles.map(v => v.id))
    const existingMachineNumbers = new Set(vehicles.map(v => v.machine_number))

    data.forEach((row, index) => {
      try {
        // 必須フィールドのチェック
        if (!row['機種'] || !row['機械番号']) {
          errors.push(`行${index + 1}: 必須フィールド（機種、機械番号）が不足しています`)
          failed++
          return
        }

        // 機械番号の重複チェック
        if (existingMachineNumbers.has(row['機械番号'])) {
          errors.push(`行${index + 1}: 機械番号「${row['機械番号']}」は既に存在します`)
          failed++
          return
        }

        // 機種の検証
        const validTypes = ['MC-100', 'MC-150', 'TT-200', 'TT-250', 'HP-300', 'HP-350']
        if (!validTypes.includes(row['機種'])) {
          errors.push(`行${index + 1}: 無効な機種「${row['機種']}」です。有効な機種: ${validTypes.join(', ')}`)
          failed++
          return
        }

        // 新しい車両を作成
        const newVehicle: Vehicle = {
          id: Math.floor(Math.random() * 1000) + 1,
          vehicle_type: row['機種'],
          machine_number: row['機械番号'],
          model: row['型式'] || "",
          manufacturer: row['製造メーカー'] || "",
                      acquisition_date: row['取得年月'] || null,
          type_approval_start_date: row['型式認定有効起算日'] || null,
          type_approval_duration: row['型式認定有効期間（月数）'] ? parseInt(row['型式認定有効期間（月数）']) : 12,
          special_notes: row['特記事項'] || "",
                      management_office_id: 1, // デフォルト値
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        newVehicles.push(newVehicle)
        existingMachineNumbers.add(row['機械番号'])
        success++
      } catch (error) {
        errors.push(`行${index + 1}: データ処理エラー`)
        failed++
      }
    })

    return { success, failed, errors, newVehicles }
  }

  const confirmImport = () => {
    setVehicles([...vehicles, ...importResult?.newVehicles || []])
    setImportDialogOpen(false)
    setImportResult(null)
    toast({
      title: "インポート完了",
      description: `${importResult?.success || 0}件の保守用車データをインポートしました`,
    })
  }

  // テンプレートダウンロード機能
  const downloadTemplate = () => {
    try {
      const templateData = [
        {
          'ID': '1',
          '機種': 'MC-100',
          '機械番号': 'MC001',
          '型式': 'MC-100A',
          '製造メーカー': '鉄道車両製造株式会社',
          '取得年月': '2020-01',
          '型式認定有効起算日': '2020-01',
          '型式認定有効期間（月数）': '12',
          '特記事項': '特になし',
          '管理事業所': '本社保守事業所'
        },
        {
          'ID': '2',
          '機種': 'TT-200',
          '機械番号': 'TT001',
          '型式': 'TT-200A',
          '製造メーカー': '鉄道車両製造株式会社',
          '取得年月': '2021-03',
          '型式認定有効起算日': '2021-03',
          '型式認定有効期間（月数）': '12',
          '特記事項': '特になし',
          '管理事業所': '関西支社保守事業所'
        },
        {
          'ID': '3',
          '機種': 'HP-300',
          '機械番号': 'HP001',
          '型式': 'HP-300A',
          '製造メーカー': '鉄道車両製造株式会社',
          '取得年月': '2022-06',
          '型式認定有効起算日': '2022-06',
          '型式認定有効期間（月数）': '12',
          '特記事項': '特になし',
          '管理事業所': '本社保守事業所'
        }
      ]

      const ws = XLSX.utils.json_to_sheet(templateData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "保守用車マスタ")
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      saveAs(data, "保守用車マスタ_テンプレート.xlsx")
      
      toast({
        title: "テンプレートダウンロード完了",
        description: "保守用車マスタのインポートテンプレートをダウンロードしました",
      })
    } catch (error) {
      console.error('Template download error:', error)
      toast({
        title: "ダウンロードエラー",
        description: "テンプレートのダウンロードに失敗しました",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">保守用車マスタ</h1>
          <p className="text-gray-600 mt-2">保守用車の基本情報を管理します</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            新規車両追加
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            CSV出力
          </Button>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                インポート
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>インポート確認</DialogTitle>
                <DialogDescription>
                  {importResult?.success}件の保守用車データをインポートします。
                  {importResult?.failed > 0 && (
                    <span className="text-red-600"> {importResult.failed}件のエラーがあります。</span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <Label htmlFor="file-upload">ファイルを選択</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      ref={fileInputRef}
                      disabled={isImporting}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      対応形式: Excel (.xlsx, .xls), CSV (.csv)
                    </p>
                  </div>
                  <div className="ml-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                      className="whitespace-nowrap"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      テンプレート
                    </Button>
                  </div>
                </div>

                {isImporting && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>インポート中...</span>
                  </div>
                )}

                {importResult && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">インポート結果</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p>成功: {importResult.success}件</p>
                      <p>失敗: {importResult.failed}件</p>
                      {importResult.errors.length > 0 && (
                        <div>
                          <p className="font-medium text-red-600">エラー詳細:</p>
                          <ul className="list-disc list-inside text-red-600 space-y-1">
                            {importResult.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importResult.errors.length > 5 && (
                              <li>...他{importResult.errors.length - 5}件</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={confirmImport} disabled={isImporting}>
                  {isImporting ? "インポート中..." : "インポート実行"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>検索・フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="保守用車ID、機種、機械番号、管理事業所コードで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="機種で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ての機種</SelectItem>
                <SelectItem value="モータカー">モータカー</SelectItem>
                <SelectItem value="鉄トロ">鉄トロ</SelectItem>
                <SelectItem value="ホッパー">ホッパー</SelectItem>
                <SelectItem value="MCR">MCR</SelectItem>
                <SelectItem value="箱トロ">箱トロ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isFormOpen && (
        <VehicleForm
          onSubmit={async (vehicle) => {
            // サーバーから最新データを再取得
            await fetchVehicles()
            setIsFormOpen(false)
            setEditingVehicle(null)
            toast({
              title: editingVehicle ? "更新完了" : "作成完了",
              description: editingVehicle ? "車両情報を更新しました" : "車両を新規作成しました",
            })
          }}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingVehicle(null)
          }}
          editingVehicle={editingVehicle}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>車両一覧</CardTitle>
                      <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <FileText className="w-4 h-4 mr-2" />
              CSV出力
            </Button>
          </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">機種</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">機械番号</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">型式</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">製造メーカー</th>
                                      <th className="border border-gray-300 px-4 py-2 text-left">取得年月</th>
                                      <th className="border border-gray-300 px-4 py-2 text-left">型式認定有効起算日（年月）</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">型式認定有効期間（月）</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">管理事業所</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">{vehicle.id}</td>
                    <td className="border border-gray-300 px-4 py-2">{vehicle.vehicle_type}</td>
                    <td className="border border-gray-300 px-4 py-2">{vehicle.machine_number}</td>
                    <td className="border border-gray-300 px-4 py-2">{vehicle.model || "-"}</td>
                    <td className="border border-gray-300 px-4 py-2">{vehicle.manufacturer || "-"}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {vehicle.acquisition_date ? vehicle.acquisition_date : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {vehicle.type_approval_start_date || "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {vehicle.type_approval_duration ? `${vehicle.type_approval_duration}ヶ月` : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{vehicle.office_name || "-"}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(vehicle)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(vehicle.id.toString())}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
