"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wrench, Plus, Edit, Trash2, AlertCircle, CheckCircle } from "lucide-react"
import { apiCall } from "@/lib/api-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface MachineType {
  id: number
  type_name: string
  model_name: string
  manufacturer?: string
  category?: string
  description?: string
}

export function MachineTypeManagement() {
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<MachineType | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    type_name: '',
    model_name: '',
    manufacturer: '',
    category: '',
    description: ''
  })

  useEffect(() => {
    fetchMachineTypes()
  }, [])

  const fetchMachineTypes = async () => {
    setLoading(true)
    try {
      const data = await apiCall('machine-types')
      setMachineTypes(data)
    } catch (err: any) {
      setMessage({ type: 'error', text: `取得に失敗: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await apiCall(`machine-types/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        })
        setMessage({ type: 'success', text: '機械タイプを更新しました' })
      } else {
        await apiCall('machine-types', {
          method: 'POST',
          body: JSON.stringify(formData)
        })
        setMessage({ type: 'success', text: '機械タイプを追加しました' })
      }
      setShowDialog(false)
      setEditing(null)
      setFormData({ type_name: '', model_name: '', manufacturer: '', category: '', description: '' })
      fetchMachineTypes()
    } catch (err: any) {
      setMessage({ type: 'error', text: `保存に失敗: ${err.message}` })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('この機械タイプを削除しますか？')) return
    
    try {
      await apiCall(`machine-types/${id}`, { method: 'DELETE' })
      setMessage({ type: 'success', text: '機械タイプを削除しました' })
      fetchMachineTypes()
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
              <Wrench className="w-5 h-5" />
              機械タイプマスタ管理
            </CardTitle>
            <CardDescription>
              機械タイプの追加・編集・削除
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditing(null)
              setFormData({ type_name: '', model_name: '', manufacturer: '', category: '', description: '' })
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
                <th className="px-4 py-2 text-left">型式名</th>
                <th className="px-4 py-2 text-left">モデル名</th>
                <th className="px-4 py-2 text-left">メーカー</th>
                <th className="px-4 py-2 text-left">カテゴリ</th>
                <th className="px-4 py-2 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {machineTypes.map(type => (
                <tr key={type.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{type.type_name}</td>
                  <td className="px-4 py-2">{type.model_name}</td>
                  <td className="px-4 py-2">{type.manufacturer || '-'}</td>
                  <td className="px-4 py-2">{type.category || '-'}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(type)
                          setFormData({
                            type_name: type.type_name,
                            model_name: type.model_name,
                            manufacturer: type.manufacturer || '',
                            category: type.category || '',
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

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? '機械タイプ編集' : '機械タイプ追加'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type_name">型式名 *</Label>
                  <Input
                    id="type_name"
                    value={formData.type_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, type_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model_name">モデル名 *</Label>
                  <Input
                    id="model_name"
                    value={formData.model_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, model_name: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">メーカー</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">カテゴリ</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="例: 軌道モータカー"
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
