"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Plus, Edit, Trash2, AlertCircle, CheckCircle } from "lucide-react"
import { apiCall } from "@/lib/api-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Office {
  id: number
  office_id: number
  office_name: string
  office_code?: string
  responsible_area?: string
}

export function OfficeManagement() {
  const [offices, setOffices] = useState<Office[]>([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Office | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    office_name: '',
    office_code: '',
    responsible_area: ''
  })

  useEffect(() => {
    fetchOffices()
  }, [])

  const fetchOffices = async () => {
    setLoading(true)
    try {
      const data = await apiCall('offices')
      setOffices(data)
    } catch (err: any) {
      setMessage({ type: 'error', text: `取得に失敗: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await apiCall(`offices/${editing.office_id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        })
        setMessage({ type: 'success', text: '事業所を更新しました' })
      } else {
        await apiCall('offices', {
          method: 'POST',
          body: JSON.stringify(formData)
        })
        setMessage({ type: 'success', text: '事業所を追加しました' })
      }
      setShowDialog(false)
      setEditing(null)
      setFormData({ office_name: '', office_code: '', responsible_area: '' })
      fetchOffices()
    } catch (err: any) {
      setMessage({ type: 'error', text: `保存に失敗: ${err.message}` })
    }
  }

  const handleDelete = async (officeId: number) => {
    if (!confirm('この事業所を削除しますか？')) return
    
    try {
      await apiCall(`offices/${officeId}`, { method: 'DELETE' })
      setMessage({ type: 'success', text: '事業所を削除しました' })
      fetchOffices()
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
              <Building2 className="w-5 h-5" />
              事業所マスタ管理
            </CardTitle>
            <CardDescription>
              事業所の追加・編集・削除
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditing(null)
              setFormData({ office_name: '', office_code: '', responsible_area: '' })
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
                <th className="px-4 py-2 text-left">事業所名</th>
                <th className="px-4 py-2 text-left">事業所コード</th>
                <th className="px-4 py-2 text-left">担当エリア</th>
                <th className="px-4 py-2 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {offices.map(office => (
                <tr key={office.office_id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{office.office_name}</td>
                  <td className="px-4 py-2">{office.office_code || '-'}</td>
                  <td className="px-4 py-2">{office.responsible_area || '-'}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(office)
                          setFormData({
                            office_name: office.office_name,
                            office_code: office.office_code || '',
                            responsible_area: office.responsible_area || ''
                          })
                          setShowDialog(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(office.office_id)}
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
              <DialogTitle>{editing ? '事業所編集' : '事業所追加'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="office_name">事業所名 *</Label>
                <Input
                  id="office_name"
                  value={formData.office_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, office_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office_code">事業所コード</Label>
                <Input
                  id="office_code"
                  value={formData.office_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, office_code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsible_area">担当エリア</Label>
                <Input
                  id="responsible_area"
                  value={formData.responsible_area}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsible_area: e.target.value }))}
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
