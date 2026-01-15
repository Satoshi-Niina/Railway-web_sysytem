import { NextRequest, NextResponse } from 'next/server'
import { getDatabaseType, executeQuery, getSupabaseClient } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    // ヘッダー行をスキップ
    const dataLines = lines.slice(1)
    
    const baseDates: Array<{
      vehicle_id: string
      inspection_type_id: number
      base_date: string
      source: string
    }> = []

    const dbType = getDatabaseType()

    if (dbType === 'postgresql') {
      // 機械番号と検修種別名からIDを取得するためのマッピングを構築
      const machinesResult = await executeQuery<{ id: string; machine_number: string }>(
        'SELECT id, machine_number FROM master_data.machines'
      )
      const machineMap = new Map(machinesResult.map(m => [m.machine_number, m.id]))

      const inspectionTypesResult = await executeQuery<{ id: number; type_name: string }>(
        'SELECT id, type_name FROM master_data.inspection_types'
      )
      const inspectionTypeMap = new Map(inspectionTypesResult.map(t => [t.type_name, t.id]))

      for (const line of dataLines) {
        // 例示行をスキップ
        if (line.startsWith('例:')) continue

        const parts = line.split(',').map(p => p.trim())
        if (parts.length < 4) continue

        const [machineNumber, , inspectionTypeName, baseDate, source] = parts
        
        const vehicleId = machineMap.get(machineNumber)
        const inspectionTypeId = inspectionTypeMap.get(inspectionTypeName)

        if (vehicleId && inspectionTypeId && baseDate) {
          baseDates.push({
            vehicle_id: vehicleId,
            inspection_type_id: inspectionTypeId,
            base_date: baseDate,
            source: source || 'import'
          })
        }
      }

      // 一括アップサート
      for (const bd of baseDates) {
        await executeQuery(
          `INSERT INTO master_data.maintenance_base_dates 
           (vehicle_id, inspection_type_id, base_date, source, updated_at)
           VALUES ($1, $2, $3::date, $4, CURRENT_TIMESTAMP)
           ON CONFLICT (vehicle_id, inspection_type_id) 
           DO UPDATE SET base_date = $3::date, source = $4, updated_at = CURRENT_TIMESTAMP`,
          [bd.vehicle_id, bd.inspection_type_id, bd.base_date, bd.source]
        )
      }

      return NextResponse.json({ 
        success: true, 
        imported: baseDates.length,
        message: `${baseDates.length}件のデータをインポートしました`
      })

    } else if (dbType === 'supabase') {
      // Supabaseの場合
      const supabase = getSupabaseClient()
      
      const { data: machines } = await supabase
        .from('machines')
        .select('id, machine_number')
      const machineMap = new Map((machines || []).map(m => [m.machine_number, m.id]))

      const { data: inspectionTypes } = await supabase
        .from('inspection_types')
        .select('id, type_name')
      const inspectionTypeMap = new Map((inspectionTypes || []).map(t => [t.type_name, t.id]))

      for (const line of dataLines) {
        if (line.startsWith('例:')) continue

        const parts = line.split(',').map(p => p.trim())
        if (parts.length < 4) continue

        const [machineNumber, , inspectionTypeName, baseDate, source] = parts
        
        const vehicleId = machineMap.get(machineNumber)
        const inspectionTypeId = inspectionTypeMap.get(inspectionTypeName)

        if (vehicleId && inspectionTypeId && baseDate) {
          baseDates.push({
            vehicle_id: vehicleId,
            inspection_type_id: inspectionTypeId,
            base_date: baseDate,
            source: source || 'import'
          })
        }
      }

      // 一括アップサート
      for (const bd of baseDates) {
        await supabase
          .from('maintenance_base_dates')
          .upsert(bd, { onConflict: 'vehicle_id,inspection_type_id' })
      }

      return NextResponse.json({ 
        success: true, 
        imported: baseDates.length,
        message: `${baseDates.length}件のデータをインポートしました`
      })

    } else {
      // モックモード
      return NextResponse.json({ 
        success: true, 
        imported: dataLines.length - 1, // 例示行を除く
        message: 'モックモード: インポートをシミュレートしました'
      })
    }

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'インポートに失敗しました', details: (error as Error).message },
      { status: 500 }
    )
  }
}
