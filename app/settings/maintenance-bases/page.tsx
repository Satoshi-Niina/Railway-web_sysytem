"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Search, Building, MapPin, ExternalLink } from "lucide-react"
import type { MaintenanceBase, ManagementOffice } from "@/types/database"

// 静的生成を無効化
export const dynamic = 'force-dynamic'

interface BaseFormData {
  base_name: string
  base_code: string
  management_office_id: number
  location: string
  address: string
}

export default function MaintenanceBasesPage() {
  const [bases, setBases] = useState<MaintenanceBase[]>([])
  const [offices, setOffices] = useState<ManagementOffice[]>([])
  const [filteredBases, setFilteredBases] = useState<MaintenanceBase[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBase, setEditingBase] = useState<MaintenanceBase | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [filterOffice, setFilterOffice] = useState("all")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [formData, setFormData] = useState<BaseFormData>({
    base_name: "",
    base_code: "",
    management_office_id: 0,
    location: "",
    address: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = bases.filter(
      (base) =>
        base.base_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        base.base_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        base.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        base.management_office?.office_code?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (filterOffice !== "all") {
      filtered = filtered.filter((base) => 
        base.management_office_id === parseInt(filterOffice)
      )
    }

    setFilteredBases(filtered)
  }, [bases, searchTerm, filterOffice])

  const fetchData = async () => {
    try {
      // 保守基地データの取得
      const basesResponse = await fetch('/api/maintenance-bases')
      if (basesResponse.ok) {
        const basesData = await basesResponse.json()
        setBases(basesData)
      }

      // 事業所データの取得
      const officesResponse = await fetch('/api/management-offices')
      if (officesResponse.ok) {
        const officesData = await officesResponse.json()
        setOffices(officesData)
      }
    } catch (error) {
      console.error('データの取得に失敗:', error)
      toast({
        title: "エラー",
        description: "データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.management_office_id === 0) {
      toast({
        title: "エラー",
        description: "管理事業所を選択してください",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingBase) {
        // 更新
        const response = await fetch(`/api/maintenance-bases/${editingBase.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (response.ok) {
          const updatedBase = await response.json()
          setBases(prev => prev.map(base => 
            base.id === editingBase.id ? updatedBase : base
          ))
          toast({
            title: "更新完了",
            description: "保守基地情報を更新しました",
          })
        } else {
          throw new Error('更新に失敗しました')
        }
      } else {
        // 新規作成
        const response = await fetch('/api/maintenance-bases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (response.ok) {
          const newBase = await response.json()
          setBases(prev => [...prev, newBase])
          toast({
            title: "作成完了",
            description: "保守基地を新規作成しました",
          })
        } else {
          throw new Error('作成に失敗しました')
        }
      }

      setIsFormOpen(false)
      setEditingBase(null)
      resetForm()
    } catch (error) {
      console.error('保守基地の保存に失敗:', error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "保守基地の保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (base: MaintenanceBase) => {
    setEditingBase(base)
    setFormData({
      base_name: base.base_name,
      base_code: base.base_code,
      management_office_id: base.management_office_id,
      location: base.location || "",
      address: base.address || "",
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('この保守基地を削除しますか？')) return

    try {
      const response = await fetch(`/api/maintenance-bases/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setBases(prev => prev.filter(base => base.id !== id))
        toast({
          title: "削除完了",
          description: "保守基地を削除しました",
        })
      } else {
        throw new Error('削除に失敗しました')
      }
    } catch (error) {
      console.error('保守基地の削除に失敗:', error)
      toast({
        title: "エラー",
        description: "保守基地の削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      base_name: "",
      base_code: "",
      management_office_id: 0,
      location: "",
      address: "",
    })
  }

  const handleOfficeClick = (officeCode: string) => {
    // 事業所マスタページに遷移（将来的に実装）
    toast({
      title: "事業所マスタ",
      description: `${officeCode}の詳細を表示します`,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>保守基地データを読み込み中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">保守基地マスタ</h1>
          <p className="text-gray-600 mt-2">保守基地の情報を管理します</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          新規保守基地登録
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
                  placeholder="基地名、コード、所在地、事業所コードで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterOffice} onValueChange={setFilterOffice}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="管理事業所で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ての事業所</SelectItem>
                {offices.map((office) => (
                  <SelectItem key={office.id} value={office.id.toString()}>
                    {office.office_code} - {office.office_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingBase ? "保守基地情報編集" : "新規保守基地登録"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base_name">基地名 *</Label>
                  <Input
                    id="base_name"
                    value={formData.base_name}
                    onChange={(e) => setFormData({ ...formData, base_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="base_code">基地コード *</Label>
                  <Input
                    id="base_code"
                    value={formData.base_code}
                    onChange={(e) => setFormData({ ...formData, base_code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="management_office_id">管理事業所 *</Label>
                  <Select
                    value={formData.management_office_id.toString()}
                    onValueChange={(value) => setFormData({ ...formData, management_office_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="管理事業所を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {offices.map((office) => (
                        <SelectItem key={office.id} value={office.id.toString()}>
                          {office.office_code} - {office.office_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">所在地</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">住所</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingBase ? "更新" : "登録"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false)
                    setEditingBase(null)
                    resetForm()
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
          <CardTitle>保守基地一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">基地コード</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">基地名</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">管理事業所</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">所在地</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredBases.map((base) => (
                  <tr key={base.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">{base.base_code}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-blue-600" />
                        <span>{base.base_name}</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {base.management_office?.office_code ? (
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
                          onClick={() => handleOfficeClick(base.management_office!.office_code)}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{base.management_office.office_code}</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </Button>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        <span>{base.location || "-"}</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(base)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(base.id)}>
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