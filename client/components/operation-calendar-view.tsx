"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react"
import type { OperationPlan, Base } from "@/types"

interface OperationCalendarViewProps {
  operationPlans: OperationPlan[]
  currentMonth: string
  allBases: Base[]
  onMonthChange: (direction: "prev" | "next") => void
  onPlanClick?: (plan: OperationPlan) => void
}

interface DayEvent {
  plan: OperationPlan
  color: string
  label: string
  isContinuation: boolean
}

export function OperationCalendarView({
  operationPlans,
  currentMonth,
  allBases,
  onMonthChange,
  onPlanClick,
}: OperationCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // 月の日数を取得
  const getDaysInMonth = (dateString: string) => {
    const [year, month] = dateString.split("-").map(Number)
    if (!year || !month) return 31
    return new Date(year, month, 0).getDate()
  }

  // 月の最初の日の曜日を取得（0: 日曜日, 1: 月曜日, ...）
  const getFirstDayOfWeek = (dateString: string) => {
    const [year, month] = dateString.split("-").map(Number)
    if (!year || !month) return 0
    return new Date(year, month - 1, 1).getDay()
  }

  // 日付の配列を生成
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDayOfWeek = getFirstDayOfWeek(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // 特定の日付のイベントを取得
  const getEventsForDate = (day: number): DayEvent[] => {
    const dateString = `${currentMonth}-${day.toString().padStart(2, "0")}`
    const events: DayEvent[] = []

    operationPlans.forEach((plan) => {
      const planDate = plan.plan_date?.split("T")[0]
      const endDate = plan.end_date ? plan.end_date.split("T")[0] : planDate

      // 期間内の日付かチェック
      if (planDate && dateString >= planDate && dateString <= endDate) {
        const isContinuation = dateString > planDate
        let color = "bg-blue-100 border-blue-400 text-blue-800"
        let label = ""

        if (isContinuation) {
          color = "bg-blue-50 border-blue-200 text-blue-700"
          label = "前日継続"
        } else {
          switch (plan.shift_type) {
            case "day":
              color = "bg-yellow-100 border-yellow-400 text-yellow-800"
              label = "昼間"
              break
            case "night":
              color = "bg-blue-700 border-blue-900 text-white"
              label = "夜間"
              break
            case "day_night":
              color = "bg-purple-100 border-purple-400 text-purple-800"
              label = "昼夜"
              break
            case "maintenance":
              color = "bg-red-100 border-red-400 text-red-800"
              label = "検修"
              break
            default:
              label = "運用"
          }
        }

        events.push({ plan, color, label, isContinuation })
      }
    })

    return events
  }

  // 選択された日付のイベント
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return []
    const dateParts = selectedDate.split("-")
    if (dateParts.length < 3 || !dateParts[2]) return []
    const day = parseInt(dateParts[2], 10)
    return getEventsForDate(day)
  }, [selectedDate, operationPlans])

  // カレンダーグリッドの生成（空白セルを含む）
  const calendarGrid = useMemo(() => {
    const grid: (number | null)[] = []
    
    // 最初の週の空白セルを追加
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null)
    }
    
    // 日付を追加
    days.forEach((day) => {
      grid.push(day)
    })
    
    return grid
  }, [firstDayOfWeek, days])

  // 基地名を取得
  const getBaseName = (baseId: number | string | undefined) => {
    if (!baseId) return "未設定"
    const base = allBases.find((b) => b.id?.toString() === baseId.toString())
    return base?.base_name || "不明"
  }

  // 日付をクリックしたときの処理
  const handleDateClick = (day: number) => {
    const dateString = `${currentMonth}-${day.toString().padStart(2, "0")}`
    setSelectedDate(dateString)
    const events = getEventsForDate(day)
    if (events.length > 0) {
      setShowDetailModal(true)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>運用計画カレンダー</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMonthChange("prev")}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-lg font-semibold min-w-[120px] text-center">
              {currentMonth}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMonthChange("next")}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-1">
          {/* 曜日ヘッダー */}
          {["日", "月", "火", "水", "木", "金", "土"].map((day, idx) => (
            <div
              key={day}
              className={`text-center font-semibold py-2 text-sm ${
                idx === 0 ? "text-red-600" : idx === 6 ? "text-blue-600" : "text-gray-700"
              }`}
            >
              {day}
            </div>
          ))}

          {/* 日付セル */}
          {calendarGrid.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[100px] border border-gray-200 bg-gray-50" />
            }

            const events = getEventsForDate(day)
            const isWeekend = idx % 7 === 0 || idx % 7 === 6
            const isToday = (() => {
              const today = new Date()
              const [year, month] = currentMonth.split("-").map(Number)
              return (
                today.getFullYear() === year &&
                today.getMonth() + 1 === month &&
                today.getDate() === day
              )
            })()

            return (
              <div
                key={day}
                className={`min-h-[100px] border border-gray-300 p-1 cursor-pointer transition-colors ${
                  isWeekend ? "bg-red-50" : "bg-white"
                } ${isToday ? "ring-2 ring-blue-500" : ""} hover:bg-blue-50`}
                onClick={() => handleDateClick(day)}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  idx % 7 === 0 ? "text-red-600" : idx % 7 === 6 ? "text-blue-600" : "text-gray-700"
                }`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {events.slice(0, 3).map((event, eventIdx) => (
                    <div
                      key={eventIdx}
                      className={`p-1.5 rounded border ${event.color} transition-all hover:brightness-95 mb-1`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onPlanClick) {
                          onPlanClick(event.plan)
                        }
                      }}
                    >
                      <div className="flex justify-between items-start font-bold text-[13px]">
                        <span>{event.label}</span>
                        <span className="text-[11px] opacity-90">
                          {event.plan.start_time?.slice(0, 5)} - {event.plan.end_time?.slice(0, 5)}
                        </span>
                      </div>
                      <div className="text-[12px] mt-0.5 space-y-0.5 leading-tight">
                        <div className="truncate font-medium">
                          {event.plan.machine_number || `車両${event.plan.vehicle_id}`}
                        </div>
                        {(event.plan.departure_base_id || event.plan.arrival_base_id) && (
                          <div className={`text-[11px] opacity-90 truncate flex items-center gap-0.5 ${event.plan.shift_type === 'night' ? 'text-white/90' : 'text-gray-600'}`}>
                            <MapPin className="w-3 h-3" />
                            <span>
                              {getBaseName(event.plan.departure_base_id)} → {getBaseName(event.plan.arrival_base_id)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="text-xs text-gray-600 text-center">
                      +{events.length - 3}件
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 凡例 */}
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-400" />
            <span>昼間</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded bg-blue-700 border border-blue-900" />
            <span>夜間</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded bg-purple-100 border border-purple-400" />
            <span>昼夜</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-400" />
            <span>検修</span>
          </div>
        </div>
      </CardContent>

      {/* 詳細モーダル */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate} の運用計画
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedDayEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">運用計画はありません</p>
            ) : (
              selectedDayEvents.map((event, idx) => (
                <Card key={idx} className="border-l-4" style={{ borderLeftColor: event.color.split(" ")[1]?.replace("border-", "") || "#3b82f6" }}>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={event.color}>
                          {event.label}
                        </Badge>
                        <span className="text-sm font-semibold">
                          {event.plan.machine_number || `車両 ${event.plan.vehicle_id}`}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>
                            {event.plan.start_time || "未設定"} 〜 {event.plan.end_time || "未設定"}
                          </span>
                        </div>
                        {event.plan.planned_distance && (
                          <div>
                            <span className="text-gray-600">走行距離:</span> {event.plan.planned_distance}km
                          </div>
                        )}
                      </div>

                      {(event.plan.departure_base_id || event.plan.arrival_base_id) && (
                        <div className="flex items-start space-x-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <span className="text-gray-600">出発:</span> {getBaseName(event.plan.departure_base_id)}
                            <span className="mx-2">→</span>
                            <span className="text-gray-600">到着:</span> {getBaseName(event.plan.arrival_base_id)}
                          </div>
                        </div>
                      )}

                      {event.plan.notes && (
                        <div className="text-sm">
                          <span className="text-gray-600">備考:</span> {event.plan.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
