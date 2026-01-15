"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tag, Plus, Edit, Trash2, AlertCircle, CheckCircle } from "lucide-react"
import { apiCall } from "@/lib/api-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface InspectionType {
  id: number
  type_name: string
  category: string
  interval_months?: number
  description?: string
}

export function InspectionTypeManagement() {
  const [inspectionTypes, setInspectionTypes] = useState<InspectionType[]>([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<InspectionType | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    type_name: '',
    category: '',
    interval_months: '',
    description: ''
  })

  useEffect(() => {
    fetchInspectionTypes()
  }, [])

  const fetchInspectionTypes = async () => {
    setLoading(true)
    try {
      const data = await apiCall('inspection-types')
      setInspectionTypes(data)
    } catch (err: any) {
      setMessage({ type: 'error', text: `取得に失敗: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        interval_months: formData.interval_months ? parseInt(formData.interval_months) : null
      }

      if (editing) {
        await apiCall(`inspection-types/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
        setMessage({ type: 'success', text: '検修種別を更新しました' })
      } else {
        await apiCall('inspection-types', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        setMessage({ type: 'success', text: '検修種別を追加しました' })
      }
      setShowDialog(false)
      setEditing(null)
      setFormData({ type_name: '', category: '', interval_months: '', description: '' })
      fetchInspectionTypes()
    } catch (err: any) {
      setMessage({ type: 'error', text: `保存に失敗: ${err.message}` })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('この検修種別を削除しますか？')) return
    
    try {
      await apiCall(`inspection-types/${id}`, { method: 'DELETE' })
      setMessage({ type: 'success', text: '検修種別を削除しました' })
      fetchInspectionTypes()
    } catch (err: any) {
      setMessage({ type: 'error', text: `削除に失敗: ${err.message}` })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              検修種別マスタ管理
            </CardTitle>
            <CardDescription>
              検修種別の追加・編集・削除
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditing(null)
              setFormData({ type_name: '', category: '', interval_months: '', description: '' })
              setShowDialog(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            新規追加
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">検修種別名</th>
                <th className="px-4 py-2 text-left">カテゴリ</th>
                <th className="px-4 py-2 text-left">周期（月）</th>
                <th className="px-4 py-2 text-left">説明</th>
                <th className="px-4 py-2 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {inspectionTypes.map(type => (
                <tr key={type.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{type.type_name}</td>
                  <td className="px-4 py-2">{type.category}</td>
                  <td className="px-4 py-2">{type.interval_months || '-'}</td>
                  <td className="px-4 py-2">{type.description || '-'}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(type)
                          setFormData({
                            type_name: type.type_name,
                            category: type.category,
                            interval_months: type.interval_months?.toString() || '',
                            description: type.description || ''
                          })
                          setShowDialog(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(type.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 検修種別について</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 定期点検、乙A検査、乙B検査、甲A検査、甲B検査などを登録します</li>
            <li>• 周期（月）は検修スケジュール計算に使用されます</li>
            <li>• カテゴリで検修の分類を管理できます</li>
          </ul>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? '検修種別編集' : '検修種別追加'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type_name">検修種別名 *</Label>
                <Input
                  id="type_name"
                  value={formData.type_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, type_name: e.target.value }))}
                  placeholder="例: 乙A検査（全般検査）"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">カテゴリ *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="例: 定期検査"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval_months">周期（月）</Label>
                  <Input
                    id="interval_months"
                    type="number"
                    value={formData.interval_months}
                    onChange={(e) => setFormData(prev => ({ ...prev, interval_months: e.target.value }))}
                    placeholder="例: 12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="検修の詳細説明"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>キャンセル</Button>
              <Button onClick={handleSave}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
