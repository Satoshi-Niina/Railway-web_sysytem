"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, Search, Building } from "lucide-react"
import type { ManagementOffice } from "@/types/database"
import { getManagementOffices, invalidateCache } from "@/lib/api-client"

// 静的生成を無効化
export const dynamic = 'force-dynamic'

interface OfficeFormData {
  office_name: string
  office_code: string
  station_1: string
  station_2: string
  station_3: string
  station_4: string
  station_5: string
  station_6: string
}

export default function OfficesPage() {
  const [offices, setOffices] = useState<ManagementOffice[]>([])
  const [filteredOffices, setFilteredOffices] = useState<ManagementOffice[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOffice, setEditingOffice] = useState<ManagementOffice | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [formData, setFormData] = useState<OfficeFormData>({
    office_name: "",
    office_code: "",
    station_1: "",
    station_2: "",
    station_3: "",
    station_4: "",
    station_5: "",
    station_6: "",
  })

  // メモ化された検索フィルター
  const filteredOfficesMemo = useMemo(() => {
    return offices.filter(
      (office) =>
        office.office_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        office.office_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        office.station_1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        office.station_2?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        office.station_3?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        office.station_4?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        office.station_5?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        office.station_6?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [offices, searchTerm])

  useEffect(() => {
    setFilteredOffices(filteredOfficesMemo)
  }, [filteredOfficesMemo])

  // メモ化されたデータ取得関数
  const fetchOffices = useCallback(async () => {
    try {
      const data = await getManagementOffices()
      setOffices(data)
    } catch (error) {
      console.error('事業所データの取得に失敗:', error)
      toast({
        title: "エラー",
        description: "事業所データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchOffices()
  }, [fetchOffices])

  // 自動採番で事業所コードを生成
  const generateOfficeCode = useCallback(() => {
    const maxCode = offices.reduce((max, office) => {
      const codeNum = parseInt(office.office_code.replace(/\D/g, '')) || 0
      return Math.max(max, codeNum)
    }, 0)
    return `OFF${String(maxCode + 1).padStart(3, '0')}`
  }, [offices])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const submitData = {
        ...formData,
        office_code: editingOffice ? formData.office_code : generateOfficeCode()
      }

      if (editingOffice) {
        // 更新
        const response = await fetch(`/api/management-offices/${editingOffice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        })

        if (response.ok) {
          const updatedOffice = await response.json()
          setOffices(prev => prev.map(office => 
            office.id === editingOffice.id ? updatedOffice : office
          ))
          await invalidateCache() // キャッシュをクリア
          toast({
            title: "更新完了",
            description: "事業所情報を更新しました",
          })
        } else {
          throw new Error('更新に失敗しました')
        }
      } else {
        // 新規作成
        const response = await fetch('/api/management-offices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        })

        if (response.ok) {
          const newOffice = await response.json()
          setOffices(prev => [...prev, newOffice])
          await invalidateCache() // キャッシュをクリア
          toast({
            title: "作成完了",
            description: "事業所を新規作成しました",
          })
        } else {
          throw new Error('作成に失敗しました')
        }
      }

      setIsFormOpen(false)
      setEditingOffice(null)
      resetForm()
    } catch (error) {
      console.error('事業所の保存に失敗:', error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "事業所の保存に失敗しました",
        variant: "destructive",
      })
    }
  }, [formData, editingOffice, toast, generateOfficeCode])

  const handleEdit = useCallback((office: ManagementOffice) => {
    setEditingOffice(office)
    setFormData({
      office_name: office.office_name,
      office_code: office.office_code,
      station_1: office.station_1 || "",
      station_2: office.station_2 || "",
      station_3: office.station_3 || "",
      station_4: office.station_4 || "",
      station_5: office.station_5 || "",
      station_6: office.station_6 || "",
    })
    setIsFormOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('この事業所を削除しますか？')) return

    try {
      const response = await fetch(`/api/management-offices/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setOffices(prev => prev.filter(office => office.id !== id))
        await invalidateCache() // キャッシュをクリア
        toast({
          title: "削除完了",
          description: "事業所を削除しました",
        })
      } else {
        throw new Error('削除に失敗しました')
      }
    } catch (error) {
      console.error('事業所の削除に失敗:', error)
      toast({
        title: "エラー",
        description: "事業所の削除に失敗しました",
        variant: "destructive",
      })
    }
  }, [toast])

  const resetForm = useCallback(() => {
    setFormData({
      office_name: "",
      office_code: "",
      station_1: "",
      station_2: "",
      station_3: "",
      station_4: "",
      station_5: "",
      station_6: "",
    })
  }, [])

  const handleNewOffice = useCallback(() => {
    setEditingOffice(null)
    resetForm()
    setFormData(prev => ({
      ...prev,
      office_code: generateOfficeCode()
    }))
    setIsFormOpen(true)
  }, [resetForm, generateOfficeCode])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>事業所データを読み込み中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">事業所マスタ</h1>
          <p className="text-gray-600 mt-2">保守事業所の情報を管理します</p>
        </div>
        <Button onClick={handleNewOffice} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          新規事業所追加
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
                  placeholder="事業所名、コード、駅名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingOffice ? "事業所情報編集" : "新規事業所登録"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="office_name">事業所名 *</Label>
                  <Input
                    id="office_name"
                    value={formData.office_name}
                    onChange={(e) => setFormData({ ...formData, office_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="office_code">事業所コード</Label>
                  <Input
                    id="office_code"
                    value={formData.office_code}
                    onChange={(e) => setFormData({ ...formData, office_code: e.target.value })}
                    readOnly={!editingOffice}
                    className={!editingOffice ? "bg-gray-100" : ""}
                    required
                  />
                  {!editingOffice && (
                    <p className="text-xs text-gray-500 mt-1">自動採番されます</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">エリア（駅間）</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="station_1">エリア1</Label>
                    <Input
                      id="station_1"
                      value={formData.station_1}
                      onChange={(e) => setFormData({ ...formData, station_1: e.target.value })}
                      placeholder="例: 東京駅～品川駅"
                    />
                  </div>
                  <div>
                    <Label htmlFor="station_2">エリア2</Label>
                    <Input
                      id="station_2"
                      value={formData.station_2}
                      onChange={(e) => setFormData({ ...formData, station_2: e.target.value })}
                      placeholder="例: 新宿駅～渋谷駅"
                    />
                  </div>
                  <div>
                    <Label htmlFor="station_3">エリア3</Label>
                    <Input
                      id="station_3"
                      value={formData.station_3}
                      onChange={(e) => setFormData({ ...formData, station_3: e.target.value })}
                      placeholder="例: 池袋駅～上野駅"
                    />
                  </div>
                  <div>
                    <Label htmlFor="station_4">エリア4</Label>
                    <Input
                      id="station_4"
                      value={formData.station_4}
                      onChange={(e) => setFormData({ ...formData, station_4: e.target.value })}
                      placeholder="例: 秋葉原駅～浅草駅"
                    />
                  </div>
                  <div>
                    <Label htmlFor="station_5">エリア5</Label>
                    <Input
                      id="station_5"
                      value={formData.station_5}
                      onChange={(e) => setFormData({ ...formData, station_5: e.target.value })}
                      placeholder="例: 銀座駅～有楽町駅"
                    />
                  </div>
                  <div>
                    <Label htmlFor="station_6">エリア6</Label>
                    <Input
                      id="station_6"
                      value={formData.station_6}
                      onChange={(e) => setFormData({ ...formData, station_6: e.target.value })}
                      placeholder="例: 原宿駅～表参道駅"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingOffice ? "更新" : "登録"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false)
                    setEditingOffice(null)
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
          <CardTitle>事業所一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">事業所コード</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">事業所名</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">エリア（駅間）</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredOffices.map((office) => (
                  <tr key={office.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">{office.office_code}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-blue-600" />
                        <span>{office.office_name}</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="space-y-1">
                        {office.station_1 && <div className="text-sm">{office.station_1}</div>}
                        {office.station_2 && <div className="text-sm">{office.station_2}</div>}
                        {office.station_3 && <div className="text-sm">{office.station_3}</div>}
                        {office.station_4 && <div className="text-sm">{office.station_4}</div>}
                        {office.station_5 && <div className="text-sm">{office.station_5}</div>}
                        {office.station_6 && <div className="text-sm">{office.station_6}</div>}
                        {!office.station_1 && !office.station_2 && !office.station_3 && 
                         !office.station_4 && !office.station_5 && !office.station_6 && "-"}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(office)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(office.id)}>
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