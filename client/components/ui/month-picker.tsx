"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MonthPickerProps {
  value?: string // YYYY-MM形式
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function MonthPicker({ value, onValueChange, placeholder = "年月を選択", disabled = false }: MonthPickerProps) {
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = React.useState<number>(new Date().getMonth() + 1)
  const [isOpen, setIsOpen] = React.useState(false)

  // 現在の年と月を取得
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  // 年リスト（現在の年から25年前まで）
  const years = Array.from({ length: 26 }, (_, i) => currentYear - i)

  // 月リスト
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  // 初期化時にvalueから年と月を設定
  React.useEffect(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number)
      if (year && month) {
        setSelectedYear(year)
        setSelectedMonth(month)
      }
    }
  }, [value])

  // 年または月が変更されたときにvalueを更新
  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    const newValue = `${year}-${String(selectedMonth).padStart(2, '0')}`
    onValueChange?.(newValue)
  }

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month)
    const newValue = `${selectedYear}-${String(month).padStart(2, '0')}`
    onValueChange?.(newValue)
  }

  // 表示用のテキスト
  const displayText = value 
    ? `${selectedYear}年${selectedMonth}月`
    : placeholder

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          📅 {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">年:</span>
            <Select value={selectedYear.toString()} onValueChange={(value) => handleYearChange(Number(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">月:</span>
            <Select value={selectedMonth.toString()} onValueChange={(value) => handleMonthChange(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {month}月
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedYear(currentYear)
                setSelectedMonth(currentMonth)
                const newValue = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
                onValueChange?.(newValue)
              }}
            >
              現在
            </Button>
            <Button 
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              確定
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 