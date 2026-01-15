"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Wrench, AlertTriangle } from "lucide-react"
import type { MaintenanceSchedule } from "@/types"

interface MaintenanceScheduleBadgeProps {
  schedule: MaintenanceSchedule
  compact?: boolean
}

export function MaintenanceScheduleBadge({ schedule, compact = false }: MaintenanceScheduleBadgeProps) {
  const getColor = () => {
    if (schedule.days_until <= 7) return "bg-red-100 text-red-800 border-red-300"
    if (schedule.days_until <= 30) return "bg-yellow-100 text-yellow-800 border-yellow-300"
    return "bg-blue-100 text-blue-800 border-blue-300"
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`text-xs cursor-help ${getColor()}`}>
              <Wrench className="w-3 h-3 mr-1" />
              {schedule.days_until <= 30 && <AlertTriangle className="w-3 h-3 mr-1" />}
              {schedule.inspection_type}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-semibold">{schedule.inspection_type}</div>
              <div className="text-sm">予定日: {new Date(schedule.next_scheduled_date).toLocaleDateString('ja-JP')}</div>
              <div className="text-sm">期間: {schedule.duration_days}日間</div>
              <div className="text-sm">残り: {schedule.days_until}日</div>
              {schedule.is_warning && (
                <div className="text-sm text-yellow-600 font-semibold">⚠️ 予定時期が近づいています</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-md border ${getColor()}`}>
      <Wrench className="w-4 h-4" />
      {schedule.is_warning && <AlertTriangle className="w-4 h-4" />}
      <div className="flex flex-col">
        <span className="text-xs font-semibold">{schedule.inspection_type}</span>
        <span className="text-xs">
          {new Date(schedule.next_scheduled_date).toLocaleDateString('ja-JP')} ({schedule.duration_days}日間)
        </span>
        <span className="text-xs">残り {schedule.days_until}日</span>
      </div>
    </div>
  )
}
