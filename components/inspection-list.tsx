"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, FileText, Plus, Search, Filter, Download } from "lucide-react"
import type { Inspection, Vehicle } from "@/types"

interface InspectionListProps {
  vehicles: Vehicle[]
}

export function InspectionList({ vehicles }: InspectionListProps) {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [filteredInspections, setFilteredInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all")
  const [selectedInspectionType, setSelectedInspectionType] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // 新規検査フォーム
  const [newInspection, setNewInspection] = useState({
    vehicle_id: "",
    inspection_type: "",
    inspection_date: "",
    notes: "",
  })

  const inspectionTypes = ["月次検査", "3ヶ月検査", "年次検査", "臨時検査", "法定検査"]

  useEffect(() => {
    fetchInspections()
  }, [])

  useEffect(() => {
    filterInspections()
  }, [inspections, searchTerm, selectedVehicleId, selectedInspectionType])

  const fetchInspections = async () => {
    try {
      // モックデータ
      const mockInspections: Inspection[] = [
        {
          id: 1,
          vehicle_id: 1,
          inspection_type: "月次検査",
          inspection_date: "2024-01-15",
          notes: "正常",
          vehicle: vehicles.find((v) => v.id === 1),
          created_at: "2024-01-15T00:00:00Z",
          updated_at: "2024-01-15T00:00:00Z",
        },
        {
          id: 2,
          vehicle_id: 2,
          inspection_type: "3ヶ月検査",
          inspection_date: "2024-01-10",
          notes: "軽微な修理が必要",
          vehicle: vehicles.find((v) => v.id === 2),
          created_at: "2024-01-10T00:00:00Z",
          updated_at: "2024-01-10T00:00:00Z",
        },
        {
          id: 3,
          vehicle_id: 3,
          inspection_type: "年次検査",
          inspection_date: "2024-01-05",
          notes: "部品交換実施",
          vehicle: vehicles.find((v) => v.id === 3),
          created_at: "2024-01-05T00:00:00Z",
          updated_at: "2024-01-05T00:00:00Z",
        },
      ]

      setInspections(mockInspections)
    } catch (error) {
      console.error("Error fetching inspections:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterInspections = () => {
    let filtered = inspections

    if (searchTerm) {
      filtered = filtered.filter(
        (inspection) =>
          inspection.vehicle?.machine_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inspection.inspection_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inspection.notes?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedVehicleId !== "all") {
      filtered = filtered.filter((inspection) => inspection.vehicle_id === Number.parseInt(selectedVehicleId))
    }

    if (selectedInspectionType !== "all") {
      filtered = filtered.filter((inspection) => inspection.inspection_type === selectedInspectionType)
    }

    setFilteredInspections(filtered)
  }

  const handleAddInspection = async () => {
    try {
      const inspection: Inspection = {
        id: Date.now(),
        vehicle_id: Number.parseInt(newInspection.vehicle_id),
        inspection_type: newInspection.inspection_type,
        inspection_date: newInspection.inspection_date,
        notes: newInspection.notes,
        vehicle: vehicles.find((v) => v.id === Number.parseInt(newInspection.vehicle_id)),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setInspections([inspection, ...inspections])
      setIsAddDialogOpen(false)
      setNewInspection({
        vehicle_id: "",
        inspection_type: "",
        inspection_date: "",
        notes: "",
      })
    } catch (error) {
      console.error("Error adding inspection:", error)
    }
  }

  const getInspectionTypeColor = (type: string) => {
    switch (type) {
      case "月次検査":
        return "bg-blue-100 text-blue-800"
      case "3ヶ月検査":
        return "bg-green-100 text-green-800"
      case "年次検査":
        return "bg-purple-100 text-purple-800"
      case "臨時検査":
        return "bg-yellow-100 text-yellow-800"
      case "法定検査":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      {/* フィルターとアクション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>検索・フィルター</span>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  検査記録追加
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新規検査記録</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>車両</Label>
                    <Select
                      value={newInspection.vehicle_id}
                      onValueChange={(value) => setNewInspection({ ...newInspection, vehicle_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="車両を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.machine_number} - {vehicle.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>検査種別</Label>
                    <Select
                      value={newInspection.inspection_type}
                      onValueChange={(value) => setNewInspection({ ...newInspection, inspection_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="検査種別を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {inspectionTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>検査日</Label>
                    <Input
                      type="date"
                      value={newInspection.inspection_date}
                      onChange={(e) => setNewInspection({ ...newInspection, inspection_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>備考</Label>
                    <Textarea
                      value={newInspection.notes}
                      onChange={(e) => setNewInspection({ ...newInspection, notes: e.target.value })}
                      placeholder="検査結果や備考を入力"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      キャンセル
                    </Button>
                    <Button onClick={handleAddInspection}>追加</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>検索</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="機械番号、検査種別、備考で検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>車両</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="車両を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ての車両</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.machine_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>検査種別</Label>
              <Select value={selectedInspectionType} onValueChange={setSelectedInspectionType}>
                <SelectTrigger>
                  <SelectValue placeholder="検査種別を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ての検査種別</SelectItem>
                  {inspectionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                エクスポート
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 検査記録一覧 */}
      <div className="grid gap-4">
        {filteredInspections.map((inspection) => (
          <Card key={inspection.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{inspection.inspection_date}</span>
                  </div>
                  <Badge className={getInspectionTypeColor(inspection.inspection_type)}>
                    {inspection.inspection_type}
                  </Badge>
                  <div className="text-sm text-gray-600">
                    {inspection.vehicle?.machine_number} - {inspection.vehicle?.name}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {inspection.pdf_file_url && (
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    編集
                  </Button>
                </div>
              </div>
              {inspection.notes && <div className="mt-2 text-sm text-gray-600">備考: {inspection.notes}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInspections.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">検査記録が見つかりません</CardContent>
        </Card>
      )}
    </div>
  )
}
