"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, Search, Building, MapPin, ExternalLink } from "lucide-react"
import type { Base, ManagementOffice } from "@/types/database"

// 静的生成を無効化
export const dynamic = 'force-dynamic'

interface BaseFormData {
  base_name: string
  base_type: string
  management_office_id: number | null
  location: string
  address: string
}

export default function MaintenanceBasesPage() {
  const [bases, setBases] = useState<Base[]>([])
  const [offices, setOffices] = useState<ManagementOffice[]>([])
  const [filteredBases, setFilteredBases] = useState<Base[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBase, setEditingBase] = useState<Base | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [filterOffice, setFilterOffice] = useState("all")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [formData, setFormData] = useState<BaseFormData>({
    base_name: "",
    base_type: "maintenance",
    management_office_id: null,
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
        (base.base_code && base.base_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
      console.log("Fetching data...")
      
      // 保守基地データの取得
      const basesResponse = await fetch('/api/bases')
      console.log("Bases response status:", basesResponse.status)
      if (basesResponse.ok) {
        const basesData = await basesResponse.json()
        console.log("Bases data:", basesData)
        console.log("First base structure:", basesData[0])
        // データ構造を修正: office_name, office_codeをmanagement_officeオブジェクトに変換
        const transformedData = basesData.map((base: any) => ({
          ...base,
          management_office: base.office_name ? {
            office_name: base.office_name,
            office_code: base.office_code,
            responsible_area: base.responsible_area
          } : null
        }))
        console.log("Transformed data:", transformedData[0])
        setBases(transformedData)
      } else {
        console.error("Failed to fetch bases:", basesResponse.statusText)
      }

      // 事業所データの取得
      const officesResponse = await fetch('/api/offices')
      console.log("Offices response status:", officesResponse.status)
      if (officesResponse.ok) {
        const officesData = await officesResponse.json()
        console.log("Offices data:", officesData)
        setOffices(officesData)
      } else {
        console.error("Failed to fetch offices:", officesResponse.statusText)
        console.error("Failed to fetch offices:", officesResponse.statusText)
        const errorData = await officesResponse.json().catch(() => ({}))
        toast({
          title: "エラー",
          description: errorData.error || "事業所データの取得に失敗しました",
          variant: "destructive",
        })
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

    console.log("Form submission started with data:", formData)

    // バリデーション
    if (!formData.base_name.trim()) {
      toast({
        title: "エラー",
        description: "基地名を入力してください",
        variant: "destructive",
      })
      return
    }

    if (!formData.management_office_id) {
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
        console.log("Updating base with formData:", formData)
        const response = await fetch(`/api/bases/${editingBase.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (response.ok) {
          const updatedBase = await response.json()
          // サーバーから最新データを再取得
          await fetchData()
          toast({
            title: "更新完了",
            description: "保守基地情報を更新しました",
          })
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }
      } else {
        // 新規作成
        console.log("Creating new base with data:", formData)
        
        const requestBody = {
          ...formData,
          management_office_id: formData.management_office_id || null
        }
        
        console.log("Request body to send:", requestBody)
        
        const response = await fetch('/api/bases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        console.log("Response status:", response.status)
        console.log("Response ok:", response.ok)

        if (response.ok) {
          const newBase = await response.json()
          console.log("Created base:", newBase)
          // サーバーから最新データを再取得
          await fetchData()
          toast({
            title: "作成完了",
            description: "保守基地を新規作成しました",
          })
        } else {
          let errorData = {}
          try {
            errorData = await response.json()
          } catch (parseError) {
            console.error("Failed to parse error response:", parseError)
            errorData = { error: "レスポンスの解析に失敗しました" }
          }
          
          console.error("Error response:", errorData)
          console.error("Response status:", response.status)
          console.error("Response statusText:", response.statusText)
          
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }
      }

      setIsFormOpen(false)
      setEditingBase(null)
      resetForm()
    } catch (error) {
      console.error('保守基地の保存に失敗:', error)
      
      // エラーの詳細をログに出力
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }
      
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "保守基地の保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (base: Base) => {
    setEditingBase(base)
    setFormData({
      base_name: base.base_name,
      base_type: base.base_type,
      management_office_id: base.management_office_id || null,
      location: base.location || "",
      address: base.address || "",
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('この保守基地を削除しますか？')) return

    try {
              const response = await fetch(`/api/bases/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setBases(prev => prev.filter(base => base.id !== id))
        toast({
          title: "削除完了",
          description: "保守基地を削除しました",
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
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
      base_type: "maintenance",
      management_office_id: null,
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

  // 基地タイプの表示名を取得
  const getBaseTypeLabel = (baseType: string) => {
    switch (baseType) {
      case 'maintenance':
        return '保守基地'
      case 'material':
        return '保線材料線'
      case 'crossover':
        return '横取り'
      default:
        return baseType
    }
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
          <p className="text-gray-600 mt-2">保守基地の情報を管理します（基地コードは自動採番）</p>
        </div>
        <Button onClick={() => {
          setEditingBase(null)
          resetForm()
          setIsFormOpen(true)
        }} className="bg-blue-600 hover:bg-blue-700">
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
                  <Label htmlFor="base_type">基地タイプ *</Label>
                  <Select
                    value={formData.base_type}
                    onValueChange={(value) => setFormData({ ...formData, base_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="基地タイプを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">{getBaseTypeLabel('maintenance')}</SelectItem>
                      <SelectItem value="material">{getBaseTypeLabel('material')}</SelectItem>
                      <SelectItem value="crossover">{getBaseTypeLabel('crossover')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="base_code">基地コード</Label>
                  <div className="p-2 bg-gray-50 rounded border text-sm text-gray-600">
                    {editingBase ? (editingBase.base_code || `BASE${String(editingBase.id).padStart(3, '0')}`) : "自動採番されます"}
                  </div>
                </div>
                <div>
                  <Label htmlFor="management_office_id">管理事業所 *</Label>
                  <Select
                    value={formData.management_office_id?.toString() || "none"}
                    onValueChange={(value) => {
                      console.log("Selected office ID:", value)
                      const officeId = (value && value !== "none") ? parseInt(value) : null
                      console.log("Parsed office ID:", officeId)
                      setFormData({ ...formData, management_office_id: officeId })
                      console.log("Updated formData:", { ...formData, management_office_id: officeId })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="管理事業所を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">選択してください</SelectItem>
                      {offices.length > 0 ? (
                        offices.map((office) => (
                          <SelectItem key={office.id} value={office.id.toString()}>
                            {office.office_code} - {office.office_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-data" disabled>
                          事業所データがありません
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {offices.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      事業所データが読み込まれていません。ページを再読み込みしてください。
                    </p>
                  )}
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
              
              {/* デバッグ情報 */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                  <p><strong>デバッグ情報:</strong></p>
                  <p>フォームデータ: {JSON.stringify(formData)}</p>
                  <p>事業所数: {offices.length}</p>
                  <p>選択中の事業所ID: {formData.management_office_id}</p>
                </div>
              )}
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
                  <th className="border border-gray-300 px-4 py-2 text-left">基地タイプ</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">管理事業所</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">所在地</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredBases.map((base) => (
                  <tr key={base.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">{base.base_code || `BASE${String(base.id).padStart(3, '0')}`}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-blue-600" />
                        <span>{base.base_name}</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Badge variant="outline">
                        {getBaseTypeLabel(base.base_type)}
                      </Badge>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {base.management_office?.office_name ? (
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
                          onClick={() => handleOfficeClick(base.management_office!.office_code)}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{base.management_office.office_name}</span>
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