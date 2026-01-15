"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Car,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react"
import { apiCall } from "@/lib/api-client"

interface MaintenanceCycle {
  id: number
  vehicle_type: string
  inspection_type: string
  cycle_days: number
  description: string
  is_active: boolean
  vehicle_count: number
  created_at: string
  updated_at: string
}

const VEHICLE_TYPES = ["モータカー", "MCR", "鉄トロ（10t）", "鉄トロ（15t）", "箱トロ", "ホッパー車"]
const INSPECTION_TYPES = ["甲A検査", "甲B検査", "乙A検査", "乙B検査", "定検", "臨修"]

export default function MaintenanceCyclesPage() {
  const [cycles, setCycles] = useState<MaintenanceCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCycle, setEditingCycle] = useState<MaintenanceCycle | null>(null)
  const [filterVehicleType, setFilterVehicleType] = useState<string>("all")
  const [filterActive, setFilterActive] = useState<boolean | null>(null)

  // フォーム状態
  const [formData, setFormData] = useState({
    vehicle_type: "",
    inspection_type: "",
    cycle_days: "",
    description: "",
    is_active: true,
  })

  useEffect(() => {
    fetchCycles()
  }, [filterVehicleType, filterActive])

  const fetchCycles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterVehicleType !== "all") {
        params.append("vehicle_type", filterVehicleType)
      }
      if (filterActive !== null) {
        params.append("is_active", filterActive.toString())
      }

      const data = await apiCall<MaintenanceCycle[]>(`maintenance-cycles?${params.toString()}`)
      setCycles(data)
    } catch (error) {
      console.error("Error fetching cycles:", error)
      setError("検修周期の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCycle = async () => {
    try {
      await apiCall("maintenance-cycles", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          cycle_days: parseInt(formData.cycle_days),
        }),
      })

      await fetchCycles()
      setShowCreateModal(false)
      resetForm()
    } catch (error) {
      console.error("Error creating cycle:", error)
      setError("検修周期の作成に失敗しました")
    }
  }

  const handleUpdateCycle = async (id: number, updates: Partial<MaintenanceCycle>) => {
    try {
      await apiCall(`maintenance-cycles/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      })

      await fetchCycles()
      setEditingCycle(null)
    } catch (error) {
      console.error("Error updating cycle:", error)
      setError("検修周期の更新に失敗しました")
    }
  }

  const handleDeleteCycle = async (id: number) => {
    if (!confirm("この検修周期を削除しますか？")) return

    try {
      await apiCall(`maintenance-cycles/${id}`, {
        method: "DELETE",
      })

      await fetchCycles()
    } catch (error) {
      console.error("Error deleting cycle:", error)
      setError("検修周期の削除に失敗しました")
    }
  }

  const resetForm = () => {
    setFormData({
      vehicle_type: "",
      inspection_type: "",
      cycle_days: "",
      description: "",
      is_active: true,
    })
  }

  const getStatusIcon = (cycle: MaintenanceCycle) => {
    if (!cycle.is_active) {
      return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
    if (cycle.vehicle_count === 0) {
      return <Clock className="w-4 h-4 text-yellow-500" />
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  const getStatusText = (cycle: MaintenanceCycle) => {
    if (!cycle.is_active) {
      return "無効"
    }
    if (cycle.vehicle_count === 0) {
      return "未使用"
    }
    return "使用中"
  }

  const getStatusColor = (cycle: MaintenanceCycle) => {
    if (!cycle.is_active) {
      return "bg-gray-100 text-gray-600"
    }
    if (cycle.vehicle_count === 0) {
      return "bg-yellow-100 text-yellow-800"
    }
    return "bg-green-100 text-green-800"
  }

  const filteredCycles = cycles.filter((cycle) => {
    if (filterVehicleType !== "all" && cycle.vehicle_type !== filterVehicleType) {
      return false
    }
    if (filterActive !== null && cycle.is_active !== filterActive) {
      return false
    }
    return true
  })

  if (loading) {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  return (
    <div className="max-w-[1920px] mx-auto py-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">検修周期マスタ</h1>
          <p className="text-gray-600 mt-2">車両種別ごとの検修周期を管理します</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新規作成
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>フィルター</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>車両種別</Label>
              <Select value={filterVehicleType} onValueChange={setFilterVehicleType}>
                <SelectTrigger>
                  <SelectValue placeholder="車両種別を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ての車両種別</SelectItem>
                  {VEHICLE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ステータス</Label>
              <Select 
                value={filterActive === null ? "all" : filterActive.toString()} 
                onValueChange={(value) => setFilterActive(value === "all" ? null : value === "true")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全てのステータス</SelectItem>
                  <SelectItem value="true">有効</SelectItem>
                  <SelectItem value="false">無効</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterVehicleType("all")
                  setFilterActive(null)
                }}
              >
                フィルターをリセット
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 検修周期一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>検修周期一覧</span>
            <Badge variant="secondary">{filteredCycles.length}件</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ステータス</TableHead>
                <TableHead>車両種別</TableHead>
                <TableHead>検修種別</TableHead>
                <TableHead>周期（日）</TableHead>
                <TableHead>説明</TableHead>
                <TableHead>対象車両数</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCycles.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(cycle)}
                      <Badge className={getStatusColor(cycle)}>
                        {getStatusText(cycle)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{cycle.vehicle_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{cycle.inspection_type}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-green-500" />
                      <span>{cycle.cycle_days}日</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{cycle.description}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{cycle.vehicle_count}台</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCycle(cycle)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateCycle(cycle.id, { is_active: !cycle.is_active })}
                      >
                        <Switch checked={cycle.is_active} />
                      </Button>
                      {cycle.vehicle_count === 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCycle(cycle.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新規作成モーダル */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>検修周期の新規作成</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>車両種別</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="車両種別を選択" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>検修種別</Label>
              <Select
                value={formData.inspection_type}
                onValueChange={(value) => setFormData({ ...formData, inspection_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="検修種別を選択" />
                </SelectTrigger>
                <SelectContent>
                  {INSPECTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>周期（日数）</Label>
              <Input
                type="number"
                value={formData.cycle_days}
                onChange={(e) => setFormData({ ...formData, cycle_days: e.target.value })}
                placeholder="例: 30"
              />
            </div>

            <div className="space-y-2">
              <Label>説明</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="検修内容の説明"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>有効</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreateCycle}>
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編集モーダル */}
      {editingCycle && (
        <Dialog open={!!editingCycle} onOpenChange={() => setEditingCycle(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>検修周期の編集</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>車両種別</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  {editingCycle.vehicle_type}
                </div>
              </div>

              <div className="space-y-2">
                <Label>検修種別</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  {editingCycle.inspection_type}
                </div>
              </div>

              <div className="space-y-2">
                <Label>周期（日数）</Label>
                <Input
                  type="number"
                  value={editingCycle.cycle_days}
                  onChange={(e) => setEditingCycle({
                    ...editingCycle,
                    cycle_days: parseInt(e.target.value)
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>説明</Label>
                <Input
                  value={editingCycle.description}
                  onChange={(e) => setEditingCycle({
                    ...editingCycle,
                    description: e.target.value
                  })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingCycle.is_active}
                  onCheckedChange={(checked) => setEditingCycle({
                    ...editingCycle,
                    is_active: checked
                  })}
                />
                <Label>有効</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCycle(null)}>
                キャンセル
              </Button>
              <Button onClick={() => handleUpdateCycle(editingCycle.id, editingCycle)}>
                更新
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
