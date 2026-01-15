"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, AlertCircle, CheckCircle } from "lucide-react"
import { apiCall } from "@/lib/api-client"
import type { MaintenancePlan } from "@/types"

interface MaintenancePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: MaintenancePlan | null
  vehicleId: string
  machineNumber: string
  inspectionTypeId: number
  inspectionTypeName: string
  scheduledStartDate?: string
  scheduledEndDate?: string
  onSaved?: () => void
}

export function MaintenancePlanDialog({
  open,
  onOpenChange,
  plan,
  vehicleId,
  machineNumber,
  inspectionTypeId,
  inspectionTypeName,
  scheduledStartDate,
  scheduledEndDate,
  onSaved
}: MaintenancePlanDialogProps) {
  const [formData, setFormData] = useState({
    planned_start_date: plan?.planned_start_date || scheduledStartDate || '',
    planned_end_date: plan?.planned_end_date || scheduledEndDate || '',
    actual_start_date: plan?.actual_start_date || '',
    actual_end_date: plan?.actual_end_date || '',
    status: plan?.status || 'scheduled',
    notes: plan?.notes || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (!formData.planned_start_date || !formData.planned_end_date) {
        setError('開始日と終了日は必須です')
        setSaving(false)
        return
      }

      const endpoint = plan?.id 
        ? `maintenance-plans/${plan.id}`
        : 'maintenance-plans'

      const method = plan?.id ? 'PUT' : 'POST'

      await apiCall(endpoint, {
        method,
        body: JSON.stringify({
          vehicle_id: vehicleId,
          inspection_type_id: inspectionTypeId,
          ...formData
        })
      })

      setSuccess('検修計画を保存しました')
      setTimeout(() => {
        onOpenChange(false)
        onSaved?.()
      }, 1000)

    } catch (err: any) {
      setError(err.message || '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (!formData.actual_end_date) {
        setError('完了日を入力してください')
        setSaving(false)
        return
      }

      // 検修完了処理（起算日を自動更新）
      await apiCall('maintenance-plans/complete', {
        method: 'POST',
        body: JSON.stringify({
          vehicle_id: vehicleId,
          inspection_type_id: inspectionTypeId,
          completion_date: formData.actual_end_date,
          notes: formData.notes
        })
      })

      setSuccess('検修完了処理が完了しました。次回の起算日が更新されました。')
      setTimeout(() => {
        onOpenChange(false)
        onSaved?.()
      }, 1500)

    } catch (err: any) {
      setError(err.message || '完了処理に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            検修計画の編集
          </DialogTitle>
          <DialogDescription>
            機械番号: {machineNumber} | 検修種別: {inspectionTypeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planned_start_date">
                計画開始日 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="planned_start_date"
                type="date"
                value={formData.planned_start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, planned_start_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planned_end_date">
                計画終了日 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="planned_end_date"
                type="date"
                value={formData.planned_end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, planned_end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actual_start_date">実績開始日</Label>
              <Input
                id="actual_start_date"
                type="date"
                value={formData.actual_start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, actual_start_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_end_date">実績終了日（完了日）</Label>
              <Input
                id="actual_end_date"
                type="date"
                value={formData.actual_end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, actual_end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">ステータス</Label>
            <select
              id="status"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
            >
              <option value="scheduled">予定</option>
              <option value="in_progress">実施中</option>
              <option value="completed">完了</option>
              <option value="cancelled">キャンセル</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="備考を入力..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 検修完了時の処理</h4>
            <p className="text-sm text-blue-800">
              実績終了日（完了日）を入力して「検修完了」ボタンを押すと、<br />
              その日付が次回の起算日として自動的に更新されます。
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            キャンセル
          </Button>
          
          {formData.actual_end_date && (
            <Button
              onClick={handleComplete}
              disabled={saving}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {saving ? '処理中...' : '検修完了'}
            </Button>
          )}
          
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
