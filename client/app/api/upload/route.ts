import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, validateFileType, validateFileSize, normalizeFileName, STORAG_FOLDRS, StorageFolder } from '@/lib/cloud-storage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const folder = formData.get('folder') as StorageFolder

    // フォルダの検証
    if (!folder || !Object.values(STORAG_FOLDRS).includes(folder)) {
      return NextResponse.json(
        { error: '無効なフォルダが指定されました' },
        { status: 400 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      )
    }

    const uploadedFiles: string[] = []
    const errors: string[] = []

    for (const file of files) {
      try {
        // ファイル形式の検証
        if (!validateFileType(file.name)) {
          errors.push(`${file.name}: サポートされていないファイル形式です`)
          continue
        }

        // ファイルサイズの検証（10MB制限）
        if (!validateFileSize(file.size)) {
          errors.push(`${file.name}: ファイルサイズが大きすぎます（最大10MB）`)
          continue
        }

        // ファイルをバッファに変換
        const buffer = Buffer.from(await file.arrayBuffer())
        const normalizedFileName = normalizeFileName(file.name)

        // クラウドストレージにアップロード
        const fileUrl = await uploadFile(
          buffer,
          normalizedFileName,
          folder,
          file.type
        )

        uploadedFiles.push(fileUrl)
      } catch (error: any) {
        console.error(`File upload error for ${file.name}:`, error)
        errors.push(`${file.name}: アップロードに失敗しました`)
      }
    }

    return NextResponse.json({
      success: uploadedFiles.length > 0,
      uploadedFiles,
      errors,
      message: uploadedFiles.length > 0 
        ? `${uploadedFiles.length}個のファイルをアップロードしました`
        : 'アップロードに失敗しました'
    })

  } catch (error: any) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'ファイルアップロードでエラーが発生しました' },
      { status: 500 }
    )
  }
}

// ファイル削除API
export async function DLT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get('url')

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'ファイルURLが指定されていません' },
        { status: 400 }
      )
    }

    const { deleteFile } = await import('@/lib/cloud-storage')
    const success = await deleteFile(fileUrl)

    if (success) {
      return NextResponse.json({ message: 'ファイルを削除しました' })
    } else {
      return NextResponse.json(
        { error: 'ファイルの削除に失敗しました' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('File deletion error:', error)
    return NextResponse.json(
      { error: 'ファイル削除でエラーが発生しました' },
      { status: 500 }
    )
  }
} 