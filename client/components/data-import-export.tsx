"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Database } from "lucide-react"
import { apiCall } from "@/lib/api-client"
import * as XLSX from 'xlsx'

export function DataImportExport() {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Excelエクスポート
  const handleExportBaseDates = async () => {
    setExporting(true)
    setMessage(null)
    
    try {
      const data = await apiCall('maintenance-base-dates')
      
      // データを整形
      const exportData = data.map((item: any) => ({
        '機械番号': item.machine_number,
        '機種': item.machine_type,
        '検修種別': item.inspection_type,
        '起算日': item.base_date,
        'ソース': item.source === 'manual' ? '手動' :
                 item.source === 'purchase' ? '購入日' :
                 item.source === 'completion' ? '検修完了' : 'システム',
        '備考': item.notes || ''
      }))

      // Excelファイル作成
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '起算日一覧')
      
      // ダウンロード
      XLSX.writeFile(wb, `起算日一覧_${new Date().toISOString().split('T')[0]}.xlsx`)
      
      setMessage({ type: 'success', text: 'Excelファイルをダウンロードしました' })
    } catch (err: any) {
      setMessage({ type: 'error', text: `エクスポートに失敗しました: ${err.message}` })
    } finally {
      setExporting(false)
    }
  }

  const handleExportOperationPlans = async () => {
    setExporting(true)
    setMessage(null)
    
    try {
      // 現在月の運用計画を取得
      const currentMonth = new Date().toISOString().slice(0, 7)
      const data = await apiCall(`operation-plans?month=${currentMonth}`)
      
      const exportData = data.map((item: any) => ({
        '機械番号': item.machine_number,
        '計画日': item.plan_date,
        '終了日': item.end_date || '',
        '勤務区分': item.shift_type === 'day' ? '昼間' :
                   item.shift_type === 'night' ? '夜間' :
                   item.shift_type === 'day_night' ? '昼夜' : '検修',
        '開始時刻': item.start_time || '',
        '終了時刻': item.end_time || '',
        '出発拠点': item.departure_base || '',
        '到着拠点': item.arrival_base || '',
        '予定距離': item.planned_distance || '',
        '備考': item.notes || ''
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '運用計画')
      
      XLSX.writeFile(wb, `運用計画_${currentMonth}.xlsx`)
      
      setMessage({ type: 'success', text: 'Excelファイルをダウンロードしました' })
    } catch (err: any) {
      setMessage({ type: 'error', text: `エクスポートに失敗しました: ${err.message}` })
    } finally {
      setExporting(false)
    }
  }

  // Excelインポート（起算日）
  const handleImportBaseDates = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setMessage(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // データを変換
      const baseDates: any[] = []
      
      for (const row of jsonData as any[]) {
        // 機械番号から車両IDを取得
        const vehicles = await apiCall(`machines?machine_number=${row['機械番号']}`)
        if (vehicles.length === 0) continue
        
        const vehicle = vehicles[0]
        
        // 検修種別からIDを取得
        const inspectionTypes = await apiCall('inspection-types')
        const inspectionType = inspectionTypes.find((t: any) => t.type_name === row['検修種別'])
        if (!inspectionType) continue

        baseDates.push({
          vehicle_id: vehicle.id,
          inspection_type_id: inspectionType.id,
          base_date: row['起算日'],
          source: 'manual',
          notes: row['備考'] || null
        })
      }

      // 一括更新
      await apiCall('maintenance-base-dates/bulk-update', {
        method: 'POST',
        body: JSON.stringify({ base_dates: baseDates })
      })

      setMessage({ type: 'success', text: `${baseDates.length}件の起算日をインポートしました` })
      
      // ファイル入力をリセット
      event.target.value = ''
    } catch (err: any) {
      setMessage({ type: 'error', text: `インポートに失敗しました: ${err.message}` })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* エクスポート */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            データエクスポート
          </CardTitle>
          <CardDescription>
            データをExcelファイルとしてダウンロードします
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleExportBaseDates}
              disabled={exporting}
              variant="outline"
              className="h-20"
            >
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="w-6 h-6" />
                <span>起算日一覧をエクスポート</span>
              </div>
            </Button>

            <Button
              onClick={handleExportOperationPlans}
              disabled={exporting}
              variant="outline"
              className="h-20"
            >
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="w-6 h-6" />
                <span>運用計画をエクスポート</span>
              </div>
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 エクスポート形式</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Excel形式（.xlsx）でダウンロードされます</li>
              <li>• 日本語のカラム名で出力されます</li>
              <li>• Excelで編集後、再インポート可能です</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* インポート */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            データインポート
          </CardTitle>
          <CardDescription>
            Excelファイルからデータを一括登録します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="border-2 border-dashed rounded-lg p-6">
              <label htmlFor="import-base-dates" className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <Upload className="w-12 h-12 text-gray-400" />
                  <div className="text-center">
                    <p className="font-medium">起算日一覧をインポート</p>
                    <p className="text-sm text-gray-500">Excelファイル（.xlsx）を選択</p>
                  </div>
                  <Button type="button" variant="outline" disabled={importing}>
                    {importing ? 'インポート中...' : 'ファイルを選択'}
                  </Button>
                </div>
              </label>
              <input
                id="import-base-dates"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportBaseDates}
                disabled={importing}
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ インポート時の注意</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• エクスポートした形式と同じカラム名を使用してください</li>
              <li>• 機械番号と検修種別が正確に一致している必要があります</li>
              <li>• 既存データは上書きされます（バックアップ推奨）</li>
              <li>• 日付は「YYYY-MM-DD」形式で入力してください</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* データベースバックアップ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            データベース管理
          </CardTitle>
          <CardDescription>
            データベース全体のバックアップと復元
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 border rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              データベースの完全バックアップは、サーバー管理者に依頼してください。
            </p>
            <p className="text-xs text-gray-500 mt-2">
              コマンド: <code className="bg-gray-200 px-2 py-1 rounded">node scripts/backup-database.js</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
