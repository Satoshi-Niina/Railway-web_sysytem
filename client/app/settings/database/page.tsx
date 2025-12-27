"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { 
  Database, 
  Server, 
  HardDrive, 
  Activity, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Settings,
  Shield,
  Trash2,
  FileText
} from "lucide-react"

interface DatabaseStatus {
  status: "connected" | "disconnected" | "error"
  message: string
  timestamp: string
  version?: string
  uptime?: string
  connections?: number
  size?: string
  diskUsagePercent?: string
  tableSizes?: Array<{
    schema: string
    table: string
    size: string
    sizeBytes: number
  }>
}

interface BackupInfo {
  id: string
  filename: string
  size: string
  created_at: string
  status: "completed" | "in_progress" | "failed"
}

export default function DatabaseManagementPage() {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null)
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDatabaseStatus()
    fetchBackups()
  }, [])

  const fetchDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      
      setDbStatus({
        status: data.database === "connected" ? "connected" : "disconnected",
        message: data.database === "connected" ? "データベースに正常に接続されています" : "データベースに接続できません",
        timestamp: data.timestamp,
        version: data.databaseInfo?.version || "PostgreSQL (バージョン不明)",
        uptime: data.databaseInfo?.uptime || "不明",
        connections: data.databaseInfo?.connections || 0,
        size: data.databaseInfo?.size || "不明",
        diskUsagePercent: data.databaseInfo?.diskUsagePercent || "0",
        tableSizes: data.databaseInfo?.tableSizes || []
      })
    } catch (error) {
      setDbStatus({
        status: "error",
        message: "データベース接続でエラーが発生しました",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/database/backup')
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups || [])
      } else {
        // APIが利用できない場合はモックデータを使用
        setBackups([
          {
            id: "backup_2024-01-15-12-00-00",
            filename: "backup_2024-01-15-12-00-00.sql",
            size: "1.2 MB",
            created_at: "2024-01-15T12:00:00.000Z",
            status: "completed"
          },
          {
            id: "backup_2024-01-14-12-00-00",
            filename: "backup_2024-01-14-12-00-00.sql",
            size: "1.1 MB",
            created_at: "2024-01-14T12:00:00.000Z",
            status: "completed"
          }
        ])
      }
    } catch (error) {
      console.error('バックアップ一覧の取得に失敗:', error)
      toast({
        title: "エラー",
        description: "バックアップ一覧の取得に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleBackup = async () => {
    setBackupLoading(true)
    try {
      const response = await fetch('/api/database/backup', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "成功",
          description: `バックアップが完了しました: ${data.filename}`,
        })
        await fetchBackups()
      } else {
        throw new Error(data.error || 'バックアップに失敗しました')
      }
    } catch (error) {
      console.error('バックアップエラー:', error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "バックアップに失敗しました",
        variant: "destructive",
      })
    } finally {
      setBackupLoading(false)
    }
  }

  const handleRestore = async (backup: BackupInfo) => {
    setSelectedBackup(backup)
    setShowRestoreDialog(true)
  }

  const confirmRestore = async () => {
    if (!selectedBackup) return

    setRestoreLoading(true)
    try {
      const response = await fetch(`/api/database/restore/${selectedBackup.id}?confirm=true`, { 
        method: 'POST' 
      })
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "成功",
          description: "データベースの復元が完了しました",
        })
        setShowRestoreDialog(false)
        setSelectedBackup(null)
      } else {
        throw new Error(data.error || '復元に失敗しました')
      }
    } catch (error) {
      console.error('復元エラー:', error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "復元に失敗しました",
        variant: "destructive",
      })
    } finally {
      setRestoreLoading(false)
    }
  }

  // データベース全データエクスポート
  const handleDatabaseExport = async (format: 'json' | 'sql', destination: 'download' | 'storage') => {
    try {
      const response = await fetch('/api/database/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, destination })
      })

      if (destination === 'download') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `database_export_${new Date().toISOString().replace(/[:.]/g, '-')}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "成功",
          description: `データベースのエクスポートが完了しました（${format.toUpperCase()}形式）`,
        })
      } else {
        const data = await response.json()
        toast({
          title: "成功",
          description: `ストレージにエクスポートしました: ${data.fileName}`,
        })
      }
    } catch (error) {
      console.error('エクスポートエラー:', error)
      toast({
        title: "エラー",
        description: "エクスポートに失敗しました",
        variant: "destructive",
      })
    }
  }

  // データベース全データインポート
  const handleDatabaseImport = async (event: React.ChangeEvent<HTMLInputElement>, format: 'json' | 'sql') => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('format', format)

    try {
      const response = await fetch('/api/database/import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "成功",
          description: data.message || "データのインポートが完了しました",
        })
        // データベース状態を更新
        await fetchDatabaseStatus()
      } else {
        throw new Error(data.error || 'インポートに失敗しました')
      }
    } catch (error) {
      console.error('インポートエラー:', error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "インポートに失敗しました",
        variant: "destructive",
      })
    }
    
    // ファイル入力をリセット
    event.target.value = ''
  }

  // ストレージファイルエクスポート
  const handleStorageExport = async () => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked')
    const folders = Array.from(checkboxes).map((cb: any) => cb.value)

    if (folders.length === 0) {
      toast({
        title: "警告",
        description: "エクスポートするフォルダを選択してください",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/storage/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folders, destination: 'download' })
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `storage_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "成功",
        description: "ストレージファイルのエクスポートが完了しました",
      })
    } catch (error) {
      console.error('エクスポートエラー:', error)
      toast({
        title: "エラー",
        description: "エクスポートに失敗しました",
        variant: "destructive",
      })
    }
  }

  // ストレージファイルを外部ストレージにエクスポート
  const handleStorageExportToExternal = async () => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked')
    const folders = Array.from(checkboxes).map((cb: any) => cb.value)

    if (folders.length === 0) {
      toast({
        title: "警告",
        description: "エクスポートするフォルダを選択してください",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/storage/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folders, destination: 'external-storage' })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "成功",
          description: `外部ストレージにエクスポートしました: ${data.fileName}`,
        })
      } else {
        throw new Error(data.error || 'エクスポートに失敗しました')
      }
    } catch (error) {
      console.error('エクスポートエラー:', error)
      toast({
        title: "エラー",
        description: "外部ストレージへのエクスポートに失敗しました",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-green-100 text-green-800"
      case "disconnected": return "bg-yellow-100 text-yellow-800"
      case "error": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected": return <CheckCircle className="w-4 h-4" />
      case "disconnected": return <AlertCircle className="w-4 h-4" />
      case "error": return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>データベース情報を読み込み中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">データベース管理</h1>
          <p className="text-gray-600 mt-2">
            データベースの接続状態、バックアップ、復元を管理します
          </p>
        </div>
        <Button onClick={fetchDatabaseStatus} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          更新
        </Button>
      </div>

      <Tabs defaultValue="status" className="space-y-6">
        <TabsList>
          <TabsTrigger value="status">接続状態</TabsTrigger>
          <TabsTrigger value="backup">バックアップ</TabsTrigger>
          <TabsTrigger value="storage">ストレージ</TabsTrigger>
          <TabsTrigger value="settings">設定</TabsTrigger>
        </TabsList>

        {/* 接続状態タブ */}
        <TabsContent value="status" className="space-y-6">
          {/* 接続状態カード */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>データベース接続状態</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dbStatus && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(dbStatus.status)}
                      <Badge className={getStatusColor(dbStatus.status)}>
                        {dbStatus.status === "connected" ? "接続中" : 
                         dbStatus.status === "disconnected" ? "未接続" : "エラー"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">バージョン</div>
                    <div className="font-medium">{dbStatus.version || "不明"}</div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">稼働時間</div>
                    <div className="font-medium">{dbStatus.uptime || "不明"}</div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">接続数</div>
                    <div className="font-medium">{dbStatus.connections || "不明"}</div>
                  </div>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {dbStatus?.message}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* パフォーマンスカード */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>パフォーマンス</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>ディスク使用率（実測値）</span>
                    <span>{dbStatus?.diskUsagePercent || "0"}%</span>
                  </div>
                  <Progress value={parseFloat(dbStatus?.diskUsagePercent || "0")} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>データベースサイズ（実測値）</span>
                    <span>{dbStatus?.size || "不明"}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${dbStatus?.diskUsagePercent || 0}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>接続数</span>
                    <span>{dbStatus?.connections || 0}</span>
                  </div>
                  <Progress value={Math.min(100, (dbStatus?.connections || 0) * 10)} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>稼働時間</span>
                    <span>{dbStatus?.uptime || "不明"}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    バージョン: {dbStatus?.version || "不明"}
                  </div>
                </div>
              </div>

              {/* テーブルサイズトップ10 */}
              {dbStatus?.tableSizes && dbStatus.tableSizes.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-3">テーブルサイズ（実測値・上位10件）</h3>
                  <div className="space-y-2">
                    {dbStatus.tableSizes.map((table, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="font-mono text-xs">
                          {table.schema}.{table.table}
                        </span>
                        <span className="font-medium">{table.size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* バックアップタブ */}
        <TabsContent value="backup" className="space-y-6">
          {/* データベース全データエクスポート/インポート */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>データベース全データ エクスポート/インポート</span>
              </CardTitle>
              <CardDescription>
                全データを外部で編集可能な形式でエクスポート・インポートします（システム障害時の退避にも使用）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* エクスポート */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>エクスポート</span>
                  </h3>
                  <p className="text-sm text-gray-600">
                    全テーブルのデータを外部編集可能な形式で出力
                  </p>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => handleDatabaseExport('json', 'download')} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      JSON形式でダウンロード
                    </Button>
                    <Button 
                      onClick={() => handleDatabaseExport('json', 'storage')} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      JSON形式でストレージに保存
                    </Button>
                    <Button 
                      onClick={() => handleDatabaseExport('sql', 'download')} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      SQL形式でダウンロード
                    </Button>
                    <Button 
                      onClick={() => handleDatabaseExport('sql', 'storage')} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      SQL形式でストレージに保存
                    </Button>
                  </div>
                </div>

                {/* インポート */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>インポート</span>
                  </h3>
                  <p className="text-sm text-gray-600">
                    外部で編集したデータを取り込み
                  </p>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        JSONファイルを選択
                      </label>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => handleDatabaseImport(e, 'json')}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        SQLファイルを選択
                      </label>
                      <input
                        type="file"
                        accept=".sql"
                        onChange={(e) => handleDatabaseImport(e, 'sql')}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  エクスポートしたファイルは外部のツール（Excel、テキストエディタなど）で編集できます。
                  インポート時は既存データに上書き・追加されます。
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* 従来のバックアップ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5" />
                <span>スナップショット バックアップ</span>
              </CardTitle>
              <CardDescription>
                データベースのスナップショットを作成、復元、管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <Button onClick={handleBackup} disabled={backupLoading}>
                  {backupLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      バックアップ中...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      スナップショット作成
                    </>
                  )}
                </Button>
                <Button onClick={fetchBackups} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  一覧更新
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">バックアップ履歴</h3>
                {backups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>バックアップがありません</p>
                    <p className="text-sm">バックアップを作成してください</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {backups.map((backup) => (
                      <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{backup.filename}</div>
                          <div className="text-sm text-gray-500">
                            サイズ: {backup.size} | 作成日時: {formatDate(backup.created_at)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={backup.status === "completed" ? "default" : "secondary"}>
                            {backup.status === "completed" ? "完了" : 
                             backup.status === "in_progress" ? "実行中" : "失敗"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(backup)}
                            disabled={restoreLoading || backup.status !== "completed"}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            復元
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ストレージタブ */}
        <TabsContent value="storage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5" />
                <span>クラウドストレージ管理</span>
              </CardTitle>
              <CardDescription>
                故障画像、修繕画像、検査画像、文書類をクラウドストレージで管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">📸</span>
                    <span className="font-medium">故障画像</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    フォルダ: /failures
                  </div>
                  <div className="text-sm text-gray-600">
                    用途: 故障時の写真・動画
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🔧</span>
                    <span className="font-medium">修繕画像</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    フォルダ: /repairs
                  </div>
                  <div className="text-sm text-gray-600">
                    用途: 修繕作業の写真・動画
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">📋</span>
                    <span className="font-medium">検査画像</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    フォルダ: /inspections
                  </div>
                  <div className="text-sm text-gray-600">
                    用途: 検査時の写真・動画
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">📄</span>
                    <span className="font-medium">文書類</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    フォルダ: /documents
                  </div>
                  <div className="text-sm text-gray-600">
                    用途: PDF・Excel等の文書
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">💾</span>
                  <span className="font-medium">バックアップ</span>
                </div>
                <div className="text-sm text-gray-600">
                  フォルダ: /backups
                </div>
                <div className="text-sm text-gray-600">
                  用途: データベースバックアップファイル
                </div>
              </div>

              {/* ストレージファイルのエクスポート */}
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>ストレージファイル一括エクスポート</span>
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  選択したフォルダのファイルを、フォルダ構造を維持したまま外部ストレージにエクスポートします
                </p>
                
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="failures" className="rounded" />
                      <span>故障画像</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="repairs" className="rounded" />
                      <span>修繕画像</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="inspections" className="rounded" />
                      <span>検査画像</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="documents" className="rounded" />
                      <span>文書類</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" value="backups" className="rounded" />
                      <span>バックアップ</span>
                    </label>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button onClick={handleStorageExport} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      ZIPでダウンロード
                    </Button>
                    <Button onClick={handleStorageExportToExternal} variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      外部ストレージにエクスポート
                    </Button>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  クラウドストレージを使用して画像・文書・バックアップを安全に保存します。
                  環境変数 STORAGE_TYPE で使用するストレージサービスを選択できます（local, aws-s3, azure-blob, gcp-storage）。
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 設定タブ */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>データベース設定</span>
              </CardTitle>
              <CardDescription>
                データベース接続設定とセキュリティ設定を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Server className="w-4 h-4" />
                    <span className="font-medium">接続設定</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>ホスト: localhost</div>
                    <div>ポート: 5432</div>
                    <div>データベース: railway_maintenance</div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">セキュリティ</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>SSL: 有効</div>
                    <div>接続プール: 20</div>
                    <div>タイムアウト: 30秒</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 復元確認ダイアログ */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>データベース復元の確認</DialogTitle>
            <DialogDescription>
              この操作は現在のデータベースを上書きします。復元を実行しますか？
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedBackup && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-medium text-yellow-800">復元対象:</div>
                <div className="text-sm text-yellow-700 mt-1">
                  {selectedBackup.filename}
                </div>
                <div className="text-sm text-yellow-700">
                  サイズ: {selectedBackup.size} | 作成日時: {formatDate(selectedBackup.created_at)}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
              disabled={restoreLoading}
            >
              キャンセル
            </Button>
            <Button
              onClick={confirmRestore}
              disabled={restoreLoading}
              variant="destructive"
            >
              {restoreLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  復元中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  復元を実行
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 