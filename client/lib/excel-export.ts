import ExcelJS from 'exceljs'

// 型定義をインライン化（循環参照を避けるため）
interface Vehicle {
  id: number
  vehicle_type: string
  machine_number: string
  management_office_id?: number
}

interface OperationPlan {
  id: number
  vehicle_id: number
  plan_date: string
  end_date?: string
  shift_type: string
  departure_base_id?: number
  arrival_base_id?: number
  start_time?: string
  end_time?: string
}

interface Inspection {
  id: number
  vehicle_id: number
  inspection_date: string
  inspection_type: string
}

interface Base {
  id: number
  base_name: string
}

interface FilterConditions {
  office?: string
  bases?: string[]
  vehicleType?: string
}

export async function exportOperationPlanToA3Excel(
  vehicles: Vehicle[],
  operationPlans: OperationPlan[],
  inspections: Inspection[],
  month: string,
  bases: Base[] = [],
  filterConditions?: FilterConditions
) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('運用計画表')

  // A3サイズ設定（横向き、1ページに収める）
  worksheet.pageSetup = {
    paperSize: 8 as ExcelJS.PaperSize, // A3
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    margins: {
      left: 0.4,
      right: 0.4,
      top: 0.5,
      bottom: 0.5,
      header: 0.3,
      footer: 0.3
    },
    printArea: undefined,
    horizontalCentered: true
  }

  const [yearStr, monthStr] = month.split('-')
  const year = yearStr || new Date().getFullYear().toString()
  const monthNum = parseInt(monthStr || '1')
  const daysInMonth = new Date(parseInt(year), monthNum, 0).getDate()

  // フォントサイズを車両数に応じて調整
  const baseFontSize = vehicles.length <= 30 ? 10 : vehicles.length <= 50 ? 9 : 8
  const headerFontSize = baseFontSize + 1

  let currentRow = 1

  // タイトル行
  worksheet.mergeCells(`A${currentRow}:${getColumnLetter(daysInMonth + 1)}${currentRow}`)
  const titleCell = worksheet.getCell(`A${currentRow}`)
  titleCell.value = `運用計画表 - ${year}年${monthNum}月`
  titleCell.font = { name: 'メイリオ', size: headerFontSize + 2, bold: true }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }
  worksheet.getRow(currentRow).height = 25
  currentRow++

  // フィルター条件表示
  if (filterConditions && (filterConditions.office || filterConditions.bases?.length || filterConditions.vehicleType)) {
    worksheet.mergeCells(`A${currentRow}:${getColumnLetter(daysInMonth + 1)}${currentRow}`)
    const filterHeaderCell = worksheet.getCell(`A${currentRow}`)
    filterHeaderCell.value = 'フィルター条件：'
    filterHeaderCell.font = { name: 'メイリオ', size: baseFontSize, bold: true }
    filterHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    worksheet.getRow(currentRow).height = 16
    currentRow++

    if (filterConditions.office) {
      worksheet.mergeCells(`A${currentRow}:${getColumnLetter(daysInMonth + 1)}${currentRow}`)
      const officeCell = worksheet.getCell(`A${currentRow}`)
      officeCell.value = `  管理所：${filterConditions.office}`
      officeCell.font = { name: 'メイリオ', size: baseFontSize - 1 }
      officeCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 2 }
      worksheet.getRow(currentRow).height = 15
      currentRow++
    }

    if (filterConditions.bases && filterConditions.bases.length > 0) {
      worksheet.mergeCells(`A${currentRow}:${getColumnLetter(daysInMonth + 1)}${currentRow}`)
      const baseCell = worksheet.getCell(`A${currentRow}`)
      baseCell.value = `  基地：${filterConditions.bases.join('、')}`
      baseCell.font = { name: 'メイリオ', size: baseFontSize - 1 }
      baseCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 2 }
      worksheet.getRow(currentRow).height = 15
      currentRow++
    }

    if (filterConditions.vehicleType && filterConditions.vehicleType !== 'all') {
      worksheet.mergeCells(`A${currentRow}:${getColumnLetter(daysInMonth + 1)}${currentRow}`)
      const typeCell = worksheet.getCell(`A${currentRow}`)
      typeCell.value = `  車両形式：${filterConditions.vehicleType}`
      typeCell.font = { name: 'メイリオ', size: baseFontSize - 1 }
      typeCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 2 }
      worksheet.getRow(currentRow).height = 15
      currentRow++
    }

    worksheet.mergeCells(`A${currentRow}:${getColumnLetter(daysInMonth + 1)}${currentRow}`)
    const countCell = worksheet.getCell(`A${currentRow}`)
    countCell.value = `対象車両数：${vehicles.length}両`
    countCell.font = { name: 'メイリオ', size: baseFontSize, bold: true }
    countCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    countCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF0C8' }
    }
    worksheet.getRow(currentRow).height = 16
    currentRow++
  }

  // 空行
  currentRow++

  // ヘッダー行（日付）
  const dateRow = worksheet.getRow(currentRow)
  dateRow.height = 18
  const vehicleHeaderCell = dateRow.getCell(1)
  vehicleHeaderCell.value = '車両'
  vehicleHeaderCell.font = { name: 'メイリオ', size: headerFontSize, bold: true }
  vehicleHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' }
  vehicleHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD0D0D0' }
  }
  vehicleHeaderCell.border = {
    top: { style: 'medium' },
    left: { style: 'medium' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = dateRow.getCell(day + 1)
    cell.value = day
    cell.font = { name: 'メイリオ', size: baseFontSize, bold: true }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD0D0D0' }
    }
    cell.border = {
      top: { style: 'medium' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: day === daysInMonth ? { style: 'medium' } : { style: 'thin' }
    }
  }
  currentRow++

  // 曜日行
  const dayOfWeekRow = worksheet.getRow(currentRow)
  dayOfWeekRow.height = 16
  const weekHeaderCell = dayOfWeekRow.getCell(1)
  weekHeaderCell.value = '曜日'
  weekHeaderCell.font = { name: 'メイリオ', size: baseFontSize, bold: true }
  weekHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' }
  weekHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }
  weekHeaderCell.border = {
    top: { style: 'thin' },
    left: { style: 'medium' },
    bottom: { style: 'medium' },
    right: { style: 'thin' }
  }

  const weekDays = ['日', '月', '火', '水', '木', '金', '土']
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(parseInt(year), monthNum - 1, day)
    const dayOfWeek = weekDays[date.getDay()]
    const cell = dayOfWeekRow.getCell(day + 1)
    cell.value = dayOfWeek
    cell.font = { 
      name: 'メイリオ', 
      size: baseFontSize, 
      bold: true,
      color: dayOfWeek === '日' ? { argb: 'FFFF0000' } : dayOfWeek === '土' ? { argb: 'FF0000FF' } : undefined
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: day === daysInMonth ? { style: 'medium' } : { style: 'thin' }
    }
  }
  currentRow++

  // データ行（基地名表示のため少し高めに設定）
  const rowHeight = Math.max(22, Math.min(30, 800 / vehicles.length))

  // ヘルパー関数：基地名の短縮表示
  const getShortBaseName = (baseId: number | undefined): string => {
    if (!baseId) return ''
    const base = bases.find(b => b.id === baseId)
    if (!base?.base_name) return ''
    return base.base_name.length > 3 ? base.base_name.substring(0, 2) : base.base_name
  }

  // ヘルパー関数：翌日またぎチェック
  const isOvernight = (p: OperationPlan): boolean => {
    if (!p?.plan_date) return false
    const planDate = p.plan_date.split('T')[0]
    const endDate = p.end_date ? p.end_date.split('T')[0] : planDate
    return endDate > planDate
  }

  // ヘルパー関数：検修期間中かチェック
  const isInMaintenancePeriod = (vehicleId: number, dateStr: string): boolean => {
    return operationPlans.some(p => {
      if (p.vehicle_id !== vehicleId || p.shift_type !== 'maintenance') return false
      const planDate = p.plan_date.split('T')[0]
      const endDate = p.end_date ? p.end_date.split('T')[0] : planDate
      return dateStr >= planDate && dateStr <= endDate
    })
  }

  // ヘルパー関数：当日の検修計画を取得
  const getMaintenancePlan = (vehicleId: number, dateStr: string): OperationPlan | undefined => {
    return operationPlans.find(p => {
      if (p.vehicle_id !== vehicleId || p.shift_type !== 'maintenance') return false
      const planDate = p.plan_date.split('T')[0]
      const endDate = p.end_date ? p.end_date.split('T')[0] : planDate
      return dateStr >= planDate && dateStr <= endDate
    })
  }
  
  vehicles.forEach((vehicle, idx) => {
    const dataRow = worksheet.getRow(currentRow)
    dataRow.height = rowHeight

    // 車両番号
    const vehicleCell = dataRow.getCell(1)
    vehicleCell.value = `${vehicle.vehicle_type || ''} ${vehicle.machine_number || ''}`
    vehicleCell.font = { name: 'メイリオ', size: baseFontSize }
    vehicleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    vehicleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' }
    }
    vehicleCell.border = {
      top: { style: 'thin' },
      left: { style: 'medium' },
      bottom: idx === vehicles.length - 1 ? { style: 'medium' } : { style: 'thin' },
      right: { style: 'thin' }
    }

    // この車両の運用計画を日付順にソート
    const vehiclePlans = operationPlans
      .filter(p => p.vehicle_id === vehicle.id)
      .sort((a, b) => a.plan_date.localeCompare(b.plan_date))

    // 最終留置基地を追跡（月初より前の計画からも取得）
    let lastStationBaseId: number | undefined = undefined

    // 月初より前の最後の運用から留置基地を取得
    const prevMonthPlans = vehiclePlans.filter(p => {
      const planDate = p.plan_date.split('T')[0]
      const endDate = p.end_date ? p.end_date.split('T')[0] : planDate
      const monthStart = `${year}-${String(monthNum).padStart(2, '0')}-01`
      return endDate < monthStart && p.shift_type !== 'maintenance'
    })
    if (prevMonthPlans.length > 0) {
      const lastPrevPlan = prevMonthPlans[prevMonthPlans.length - 1]
      lastStationBaseId = lastPrevPlan.arrival_base_id
    }

    // 各日のデータ
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const cell = dataRow.getCell(day + 1)

      // 当日開始の運用計画を取得（検修以外）
      const plan = operationPlans.find(
        p => p.vehicle_id === vehicle.id && 
             p.plan_date.split('T')[0] === dateStr && 
             p.shift_type !== 'maintenance'
      )

      // 前日からの継続計画を取得（end_dateが当日の計画、検修以外）
      const continuationPlan = operationPlans.find(p => {
        if (p.vehicle_id !== vehicle.id || p.shift_type === 'maintenance') return false
        const planDate = p.plan_date.split('T')[0]
        const endDate = p.end_date ? p.end_date.split('T')[0] : planDate
        return planDate < dateStr && endDate === dateStr
      })

      // 検修期間中かチェック
      const inMaintenance = isInMaintenancePeriod(vehicle.id, dateStr)

      let cellValue = ''
      let bgColor = 'FFFFFFFF'
      const cellParts: string[] = []

      // ① 検修期間中の場合
      if (inMaintenance) {
        cellParts.push('検修')
        bgColor = 'FFD6EAF8' // 薄い青色（検修）
      } else {
        // 前日からの継続を表示
        if (continuationPlan) {
          const depName = getShortBaseName(continuationPlan.departure_base_id)
          const arrName = getShortBaseName(continuationPlan.arrival_base_id)
          
          let contText = '継続'
          if (depName && arrName) {
            contText = `継続\n${depName}→${arrName}`
          }
          cellParts.push(contText)
          bgColor = 'FFFFEB3B' // 黄色（継続も運用）
          
          // 継続終了時の到着基地を記録
          if (continuationPlan.arrival_base_id) {
            lastStationBaseId = continuationPlan.arrival_base_id
          }
        }

        // 当日の運用がある場合
        if (plan) {
          const depName = getShortBaseName(plan.departure_base_id)
          const arrName = getShortBaseName(plan.arrival_base_id)
          const overnight = isOvernight(plan) ? ' →翌' : ''
          
          if (plan.shift_type === 'day' || plan.shift_type === 'daytime') {
            let planText = `昼${overnight}`
            if (depName && arrName) {
              planText = `昼${overnight}\n${depName}→${arrName}`
            }
            cellParts.push(planText)
            if (!continuationPlan) bgColor = 'FFFFEB3B' // 黄色（運用）
          } else if (plan.shift_type === 'night' || plan.shift_type === 'nighttime') {
            let planText = `夜${overnight}`
            if (depName && arrName) {
              planText = `夜${overnight}\n${depName}→${arrName}`
            }
            cellParts.push(planText)
            if (!continuationPlan) bgColor = 'FFFFEB3B' // 黄色（運用）
          } else if (plan.shift_type === 'day_night' || plan.shift_type === 'both') {
            let planText = `昼夜${overnight}`
            if (depName && arrName) {
              planText = `昼夜${overnight}\n${depName}→${arrName}`
            }
            cellParts.push(planText)
            if (!continuationPlan) bgColor = 'FFFFEB3B' // 黄色（運用）
          }
          
          // 翌日にまたがらない場合は到着基地を記録
          if (!isOvernight(plan) && plan.arrival_base_id) {
            lastStationBaseId = plan.arrival_base_id
          }
        }
        
        // ② 運用も継続もない場合：留置基地を表示
        if (!plan && !continuationPlan && lastStationBaseId) {
          const stationName = getShortBaseName(lastStationBaseId)
          if (stationName) {
            cellParts.push(`留置\n${stationName}`)
            bgColor = 'FFE8E8E8' // 薄い灰色（保留/留置）
          }
        }
      }

      cellValue = cellParts.join('\n')
      cell.value = cellValue
      cell.font = { name: 'メイリオ', size: cellValue.includes('\n') ? baseFontSize - 1 : baseFontSize }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: idx === vehicles.length - 1 ? { style: 'medium' } : { style: 'thin' },
        right: day === daysInMonth ? { style: 'medium' } : { style: 'thin' }
      }
    }

    currentRow++
  })

  // 列幅設定
  worksheet.getColumn(1).width = 18 // 車両列

  // 日付列の幅を計算（A3横幅に合わせて）
  const availableWidth = 150 // A3横幅から車両列を引いた残り
  const dateColumnWidth = Math.max(3.5, availableWidth / daysInMonth)
  for (let day = 1; day <= daysInMonth; day++) {
    worksheet.getColumn(day + 1).width = dateColumnWidth
  }

  // ファイル名生成
  let filenameParts = [`運用計画表_${year}年${monthNum}月`]
  if (filterConditions?.office) {
    filenameParts.push(filterConditions.office.replace(/\s/g, ''))
  }
  if (filterConditions?.bases && filterConditions.bases.length > 0 && filterConditions.bases.length <= 3) {
    filenameParts.push(filterConditions.bases.join('_').replace(/\s/g, ''))
  }
  const filename = filenameParts.join('_') + '.xlsx'

  // ファイルダウンロード
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  
  // File System Access APIをサポートしているブラウザの場合は保存先を選択
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'Excel files',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
        }]
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (err) {
      // ユーザーがキャンセルした場合やエラーの場合は通常のダウンロードにフォールバック
      console.log('保存がキャンセルされたか、通常のダウンロードを使用します')
    }
  }
  
  // 通常のダウンロード（フォールバック）
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

// 列番号からExcelの列文字を取得
function getColumnLetter(columnNumber: number): string {
  let letter = ''
  while (columnNumber > 0) {
    const remainder = (columnNumber - 1) % 26
    letter = String.fromCharCode(65 + remainder) + letter
    columnNumber = Math.floor((columnNumber - 1) / 26)
  }
  return letter
}
