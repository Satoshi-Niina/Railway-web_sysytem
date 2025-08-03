import { NextRequest, NextResponse } from 'next/server'
import { getStorageUsage, listFiles, STORAGE_FOLDERS, StorageFolder } from '@/lib/cloud-storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'usage':
        // ストレージ使用量の取得
        const usage = await getStorageUsage()
        return NextResponse.json({
          success: true,
          data: {
            ...usage,
            failuresMB: Math.round((usage.failures / (1024 * 1024)) * 100) / 100,
            repairsMB: Math.round((usage.repairs / (1024 * 1024)) * 100) / 100,
            inspectionsMB: Math.round((usage.inspections / (1024 * 1024)) * 100) / 100,
            documentsMB: Math.round((usage.documents / (1024 * 1024)) * 100) / 100,
            totalMB: Math.round((usage.total / (1024 * 1024)) * 100) / 100,
          }
        })

      case 'list':
        // 特定フォルダのファイル一覧取得
        const folder = searchParams.get('folder') as StorageFolder
        if (!folder || !Object.values(STORAGE_FOLDERS).includes(folder)) {
          return NextResponse.json(
            { error: '無効なフォルダが指定されました' },
            { status: 400 }
          )
        }

        const files = await listFiles(folder)
        return NextResponse.json({
          success: true,
          data: {
            folder,
            files,
            count: files.length
          }
        })

      case 'overview':
        // 全フォルダの概要取得
        const overview = await Promise.all(
          Object.values(STORAGE_FOLDERS).map(async (folder) => {
            const files = await listFiles(folder)
            return {
              folder,
              fileCount: files.length,
              files: files.slice(0, 10) // 最新10件のみ
            }
          })
        )

        const totalUsage = await getStorageUsage()

        return NextResponse.json({
          success: true,
          data: {
            folders: overview,
            totalUsage: {
              ...totalUsage,
              totalMB: Math.round((totalUsage.total / (1024 * 1024)) * 100) / 100,
            }
          }
        })

      default:
        return NextResponse.json(
          { error: '無効なアクションが指定されました' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Storage API error:', error)
    return NextResponse.json(
      { error: 'ストレージ情報の取得でエラーが発生しました' },
      { status: 500 }
    )
  }
} 