"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react"
import type { TravelPlan, TravelRecord, Vehicle } from "@/types"

interface TravelChartProps {
  vehicles: Vehicle[]
  currentMonth: string
  onMonthChange: (month: string) => void
}

export function TravelChart({ vehicles, currentMonth, onMonthChange }: TravelChartProps) {
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([])
  const [travelRecords, setTravelRecords] = useState<TravelRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTravelData()
  }, [currentMonth])

  const fetchTravelData = async () => {
    try {
      // モックデータ
      const mockTravelPlans: TravelPlan[] = [
        {
          id: 1,
          vehicle_id: 1,
          plan_date: `${currentMonth}-15`,
          departure_time: "08:00",
          arrival_time: "17:00",
          departure_location: "東京基地",
          arrival_location: "大阪基地",
          distance: 500,
          purpose: "定期点検",
          vehicle: vehicles.find((v) => v.id === 1),
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          vehicle_id: 2,
          plan_date: `${currentMonth}-20`,
          departure_time: "09:00",
          arrival_time: "16:00",
          departure_location: "大阪基地",
          arrival_location: "福岡基地",
          distance: 300,
          purpose: "緊急対応",
          vehicle: vehicles.find((v) => v.id === 2),
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]

      const mockTravelRecords: TravelRecord[] = [
        {
          id: 1,
          vehicle_id: 1,
          record_date: `${currentMonth}-15`,
          departure_time: "08:15",
          arrival_time: "17:30",
          departure_location: "東京基地",
          arrival_location: "大阪基地",
          distance: 520,
          fuel_consumption: 45.2,
          vehicle: vehicles.find((v) => v.id === 1),
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]

      setTravelPlans(mockTravelPlans)
      setTravelRecords(mockTravelRecords)
    } catch (error) {
      console.error("Error fetching travel data:", error)
    } finally {
      setLoading(false)
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const [year, month] = currentMonth.split("-").map(Number)
    const newDate = new Date(year, month - 1, 1)

    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }

    onMonthChange(newDate.toISOString().slice(0, 7))
  }

  const getDaysInMonth = (dateString: string) => {
    const [year, month] = dateString.split("-").map(Number)
    return new Date(year, month, 0).getDate()
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const getTravelForDay = (day: number, vehicleId: number) => {
    const dateString = `${currentMonth}-${day.toString().padStart(2, "0")}`
    const plan = travelPlans.find((p) => p.plan_date === dateString && p.vehicle_id === vehicleId)
    const record = travelRecords.find((r) => r.record_date === dateString && r.vehicle_id === vehicleId)
    return { plan, record }
  }

  if (loading) {
    return <div className="flex justify-center p-8">読み込み中...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>走行計画・実績</span>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2 min-w-32">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{currentMonth}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border p-2 bg-gray-50 text-center min-w-20">車両</th>
                {days.map((day) => (
                  <th key={day} className="border p-2 bg-gray-50 text-center min-w-16">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.slice(0, 5).map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="border p-2 text-center font-medium bg-blue-50">
                    <div className="text-sm">{vehicle.machine_number}</div>
                    <div className="text-xs text-gray-600">{vehicle.name}</div>
                  </td>
                  {days.map((day) => {
                    const { plan, record } = getTravelForDay(day, vehicle.id)
                    const hasData = plan || record

                    return (
                      <td key={day} className="border p-1">
                        {hasData && (
                          <div className="space-y-1">
                            {plan && (
                              <div className="bg-blue-50 p-1 rounded">
                                <Badge variant="outline" className="text-xs mb-1">
                                  計画
                                </Badge>
                                <div className="flex items-center space-x-1 text-xs">
                                  <MapPin className="w-3 h-3" />
                                  <span>
                                    {plan.departure_location.slice(0, 2)}→{plan.arrival_location.slice(0, 2)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-gray-600">
                                  <Clock className="w-3 h-3" />
                                  <span>{plan.departure_time}</span>
                                </div>
                              </div>
                            )}
                            {record && (
                              <div className="bg-green-50 p-1 rounded">
                                <Badge variant="outline" className="text-xs mb-1 bg-green-100">
                                  実績
                                </Badge>
                                <div className="flex items-center space-x-1 text-xs">
                                  <MapPin className="w-3 h-3" />
                                  <span>
                                    {record.departure_location.slice(0, 2)}→{record.arrival_location.slice(0, 2)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600">{record.distance}km</div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
