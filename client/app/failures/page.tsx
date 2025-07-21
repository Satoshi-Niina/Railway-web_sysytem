"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Edit, Trash2, Search } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

interface FailureRecord {
  id: string
  vehicleId: string
  vehicleName: string
  failureDate: Date
  description: string
  severity: "low" | "medium" | "high" | "critical"
  repairDescription?: string
  repairDate?: Date
  status: "reported" | "in_repair" | "completed"
  cost?: number
}

export default function FailuresPage() {
  const [failures, setFailures] = useState<FailureRecord[]>([])
  const [filteredFailures, setFilteredFailures] = useState<FailureRecord[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingFailure, setEditingFailure] = useState<FailureRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [formData, setFormData] = useState({
    vehicleId: "",
    vehicleName: "",
    failureDate: new Date(),
    description: "",
    severity: "medium" as const,
    repairDescription: "",
    repairDate: new Date(),
    status: "reported" as const,
    cost: 0,
  })

  useEffect(() => {
    // モックデータの読み込み
    const mockFailures: FailureRecord[] = [
      {
        id: "F001",
        vehicleId: "MC001",
        vehicleName: "モータカー1号",
        failureDate: new Date("2024-01-15"),
        description: "エンジンから異音が発生",
        severity: "high",
        repairDescription: "エンジンオイル交換とベルト調整",
        repairDate: new Date("2024-01-16"),
        status: "completed",
        cost: 25000,
      },
      {
        id: "F002",
        vehicleId: "TT001",
        vehicleName: "鉄トロ1号",
        failureDate: new Date("2024-01-18"),
        description: "ブレーキの効きが悪い",
        severity: "critical",
        status: "in_repair",
      },
    ]
    setFailures(mockFailures)
    setFilteredFailures(mockFailures)
  }, [])

  useEffect(() => {
    let filtered = failures.filter(
      (failure) =>
        failure.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        failure.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        failure.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (filterStatus !== "all") {
      filtered = filtered.filter((failure) => failure.status === filterStatus)
    }

    setFilteredFailures(filtered)
  }, [failures, searchTerm, filterStatus])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingFailure) {
      setFailures((failures) =>
        failures.map((failure) =>
          failure.id === editingFailure.id
            ? {
                ...failure,
                ...formData,
                repairDate: formData.repairDate || undefined,
              }
            : failure,
        ),
      )
    } else {
      const newFailure: FailureRecord = {
        id: `F${Date.now()}`,
        ...formData,
        repairDate: formData.repairDate || undefined,
      }
      setFailures((failures) => [...failures, newFailure])
    }

    setIsFormOpen(false)
    setEditingFailure(null)
    setFormData({
      vehicleId: "",
      vehicleName: "",
      failureDate: new Date(),
      description: "",
      severity: "medium",
      repairDescription: "",
      repairDate: new Date(),
      status: "reported",
      cost: 0,
    })
  }

  const handleEdit = (failure: FailureRecord) => {
    setEditingFailure(failure)
    setFormData({
      vehicleId: failure.vehicleId,
      vehicleName: failure.vehicleName,
      failureDate: failure.failureDate,
      description: failure.description,
      severity: failure.severity,
      repairDescription: failure.repairDescription || "",
      repairDate: failure.repairDate || new Date(),
      status: failure.status,
      cost: failure.cost || 0,
    })
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    setFailures((failures) => failures.filter((failure) => failure.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">故障・修繕管理</h1>
          <p className="text-gray-600 mt-2">車両の故障報告と修繕記録を管理します</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          新規故障報告
        </Button>
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
                  placeholder="車両名、ID、故障内容で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="ステータスで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全てのステータス</SelectItem>
                <SelectItem value="reported">報告済み</SelectItem>
                <SelectItem value="in_repair">修理中</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingFailure ? "故障記録編集" : "新規故障報告"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleId">車両ID</Label>
                  <Input
                    id="vehicleId"
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleName">車両名</Label>
                  <Input
                    id="vehicleName"
                    value={formData.vehicleName}
                    onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>故障発生日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.failureDate, "yyyy年MM月dd日", { locale: ja })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.failureDate}
                        onSelect={(date) => date && setFormData({ ...formData, failureDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="severity">重要度</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value: "low" | "medium" | "high" | "critical") =>
                      setFormData({ ...formData, severity: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">低</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                      <SelectItem value="critical">緊急</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">故障内容</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="status">ステータス</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "reported" | "in_repair" | "completed") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reported">報告済み</SelectItem>
                      <SelectItem value="in_repair">修理中</SelectItem>
                      <SelectItem value="completed">完了</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cost">修理費用 (円)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                  />
                </div>
                {(formData.status === "in_repair" || formData.status === "completed") && (
                  <>
                    <div>
                      <Label>修理日</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-transparent"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(formData.repairDate, "yyyy年MM月dd日", { locale: ja })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.repairDate}
                            onSelect={(date) => date && setFormData({ ...formData, repairDate: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="repairDescription">修理内容</Label>
                      <Textarea
                        id="repairDescription"
                        value={formData.repairDescription}
                        onChange={(e) => setFormData({ ...formData, repairDescription: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingFailure ? "更新" : "報告"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false)
                    setEditingFailure(null)
                  }}
                >
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>故障・修繕記録一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">車両</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">故障日</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">故障内容</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">重要度</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">ステータス</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">修理費用</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredFailures.map((failure) => (
                  <tr key={failure.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{failure.id}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {failure.vehicleName} ({failure.vehicleId})
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {format(failure.failureDate, "yyyy/MM/dd", { locale: ja })}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 max-w-xs truncate">{failure.description}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          failure.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : failure.severity === "high"
                              ? "bg-orange-100 text-orange-800"
                              : failure.severity === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                        }`}
                      >
                        {failure.severity === "critical"
                          ? "緊急"
                          : failure.severity === "high"
                            ? "高"
                            : failure.severity === "medium"
                              ? "中"
                              : "低"}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          failure.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : failure.status === "in_repair"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {failure.status === "completed"
                          ? "完了"
                          : failure.status === "in_repair"
                            ? "修理中"
                            : "報告済み"}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {failure.cost ? `¥${failure.cost.toLocaleString()}` : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(failure)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(failure.id)}>
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
