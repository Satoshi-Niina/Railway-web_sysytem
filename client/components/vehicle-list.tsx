"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Car, Plus, Search, Edit, Trash2, Building, MapPin, AlertCircle, Filter, Download, Upload } from "lucide-react"

import type { Vehicle, ManagementOffice, Base, VehicleFormData } from "@/types/database"
import { apiCall, isDatabaseConfigured } from "@/lib/api-client"

export function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [managementOffices, setManagementOffices] = useState<ManagementOffice[]>([])
  const [bases, setBases] = useState<Base[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // フィルター状態
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("all")
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  // フォーム状態
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState<VehicleFormData>({
    machine_number: "",
    vehicle_type: "",
    model: "",
    manufacturer: "",
    acquisition_date: "",
    management_office_id: undefined,
    home_base_id: undefined,
    status: "active",
  })

  // 車種リスト
  const vehicleTypes = ["モータカー", "MCR", "鉄トロ（10t）", "鉄トロ（15t）", "箱トロ", "ホッパー車"]

  useEffect(() => {
    fetchData()
  }, [selectedOfficeId, selectedVehicleType, selectedStatus])

  const fetchData = async () => {
    setLoading(true)
    try {
      setError(null)

      const params = new URLSearchParams()
      if (selectedOfficeId !== "all") params.append("management_office_id", selectedOfficeId)
      if (selectedVehicleType !== "all") params.append("vehicle_type", selectedVehicleType)
      if (selectedStatus !== "all") params.append("status", selectedStatus)

      const [vehiclesData, officesData, basesData] = await Promise.all([
        apiCall<Vehicle[]>(`/api/vehicles?${params.toString()}`),
        apiCall<ManagementOffice[]>("/api/management-offices"),
        apiCall<Base[]>("/api/bases"),
      ])

      setVehicles(vehiclesData)
      setManagementOffices(officesData)
      setBases(basesData)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("データの取得に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  // フィルタリングされた車両リスト
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.machine_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.model && vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.manufacturer && vehicle.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesSearch
  })

  // フォームリセット
  const resetForm = () => {
    setFormData({
      machine_number: "",
      vehicle_type: "",
      model: "",
      manufacturer: "",
      acquisition_date: "",
      management_office_id: undefined,
      home_base_id: undefined,
      status: "active",
    })
    setEditingVehicle(null)
  }

  // 車両追加・編集
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingVehicle) {
        // 編集
        await apiCall(`/api/vehicles`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingVehicle.id, ...formData }),
        })
      } else {
        // 新規追加
        await apiCall("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
      }

      setIsFormOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error("Error saving vehicle:", error)
      setError("車両の保存に失敗しました。")
    }
  }

  // 車両削除
  const handleDelete = async (vehicle: Vehicle) => {
    if (!confirm(`車両 ${vehicle.machine_number} を削除しますか？`)) return

    try {
      await apiCall(`/api/vehicles?id=${vehicle.id}`, {
        method: "DELETE",
      })
      fetchData()
    } catch (error) {
      console.error("Error deleting vehicle:", error)
      setError("車両の削除に失敗しました。")
    }
  }

  // 編集開始
  const startEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      machine_number: vehicle.machine_number,
      vehicle_type: vehicle.vehicle_type,
      model: vehicle.model || "",
      manufacturer: vehicle.manufacturer || "",
      acquisition_date: vehicle.acquisition_date || "",
      management_office_id: vehicle.management_office_id,
      home_base_id: vehicle.home_base_id,
      status: vehicle.status,
    })
    setIsFormOpen(true)
  }

  // ステータスバッジの色
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "retired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // ステータス表示名
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "稼働中"
      case "maintenance":
        return "整備中"
      case "retired":
        return "廃車"
      default:
        return status
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
            データベースが設定されていません。モックデータを表示しています。実際のデータを使用するには、Supabaseの設定を完了してください。
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
          <h2 className="text-2xl font-bold">車両管理</h2>
          <Badge variant="outline">{filteredVehicles.length}台</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            エクスポート
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            インポート
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                車両追加
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingVehicle ? "車両編集" : "車両追加"}</DialogTitle>
                <DialogDescription>
                  {editingVehicle ? "車両情報を編集します。" : "新しい車両を追加します。"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="machine_number">機械番号 *</Label>
                    <Input
                      id="machine_number"
                      value={formData.machine_number}
                      onChange={(e) => setFormData({ ...formData, machine_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_type">車種 *</Label>
                    <Select
                      value={formData.vehicle_type}
                      onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="車種を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">型式</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">製造者</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="acquisition_date">取得年月日</Label>
                    <Input
                      id="acquisition_date"
                      type="date"
                      value={formData.acquisition_date}
                      onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">状態</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">稼働中</SelectItem>
                        <SelectItem value="maintenance">整備中</SelectItem>
                        <SelectItem value="retired">廃車</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="management_office_id">管理箇所</Label>
                    <Select
                      value={formData.management_office_id?.toString() || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, management_office_id: value ? Number.parseInt(value) : undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="管理箇所を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {managementOffices.map((office) => (
                          <SelectItem key={office.id} value={office.id.toString()}>
                            {office.office_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="home_base_id">所属基地</Label>
                    <Select
                      value={formData.home_base_id?.toString() || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, home_base_id: value ? Number.parseInt(value) : undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="所属基地を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {bases
                          .filter((base) =>
                            formData.management_office_id
                              ? base.management_office_id === formData.management_office_id
                              : true,
                          )
                          .map((base) => (
                            <SelectItem key={base.id} value={base.id.toString()}>
                              {base.base_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit">{editingVehicle ? "更新" : "追加"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
              <Label htmlFor="search">検索</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="機械番号、車種、型式で検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="officeFilter">管理箇所</Label>
              <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
                <SelectTrigger>
                  <SelectValue placeholder="管理箇所を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ての管理箇所</SelectItem>
                  {managementOffices.map((office) => (
                    <SelectItem key={office.id} value={office.id.toString()}>
                      {office.office_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleTypeFilter">車種</Label>
              <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
                <SelectTrigger>
                  <SelectValue placeholder="車種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ての車種</SelectItem>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusFilter">状態</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="状態を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ての状態</SelectItem>
                  <SelectItem value="active">稼働中</SelectItem>
                  <SelectItem value="maintenance">整備中</SelectItem>
                  <SelectItem value="retired">廃車</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 車両一覧テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>車両一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>機械番号</TableHead>
                <TableHead>車種</TableHead>
                <TableHead>型式</TableHead>
                <TableHead>製造者</TableHead>
                <TableHead>管理箇所</TableHead>
                <TableHead>所属基地</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>取得年月日</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    該当する車両がありません。
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.machine_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4 text-blue-600" />
                        <span>{vehicle.vehicle_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{vehicle.model || "-"}</TableCell>
                    <TableCell>{vehicle.manufacturer || "-"}</TableCell>
                    <TableCell>
                      {vehicle.management_office ? (
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-600" />
                          <span>{vehicle.management_office.office_name}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {vehicle.home_base ? (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-600" />
                          <span>{vehicle.home_base.base_name}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(vehicle.status)}>{getStatusLabel(vehicle.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      {vehicle.acquisition_date ? new Date(vehicle.acquisition_date).toLocaleDateString("ja-JP") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(vehicle)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(vehicle)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
