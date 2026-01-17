import { Storage } from '@google-cloud/storage'

// ストレージタイプの判定
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'gcs'

// GCSクライアントの初期化
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE, // サービスアカウントキーのパス
})

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'railway-maintenance-storage'
const bucket = storage.bucket(BUCKET_NAME)

// フォルダ構造の定義
export const STORAGE_FOLDERS = {
  FAILURES: 'failures',    // 故障画像
  REPAIRS: 'repairs',      // 修繕画像
  INSPECTIONS: 'inspections', // 検査画像
  DOCUMENTS: 'documents',  // 文書類
  BACKUPS: 'backups',      // データベースバックアップ
} as const

export type StorageFolder = typeof STORAGE_FOLDERS[keyof typeof STORAGE_FOLDERS]

// ファイルアップロード（GCS）
export async function uploadFile(
  file: Buffer,
  fileName: string,
  folder: StorageFolder,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const timestamp = Date.now()
  const safeFileName = `${timestamp}-${fileName}`
  const filePath = `${folder}/${safeFileName}`

  const fileUpload = bucket.file(filePath)

  await fileUpload.save(file, {
    contentType,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  })

  // 公開URLを返す
  return `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`
}

// ファイル削除
export async function deleteFile(fileUrl: string): Promise<boolean> {
  try {
    // URLからファイルパスを抽出
    const filePath = fileUrl.replace(`https://storage.googleapis.com/${BUCKET_NAME}/`, '')
    
    await bucket.file(filePath).delete()
    return true
  } catch (error) {
    console.error('File deletion failed:', error)
    return false
  }
}

// 署名付きURLの生成（一時的なアクセス用）
export async function generateSignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
  try {
    const filePath = fileUrl.replace(`https://storage.googleapis.com/${BUCKET_NAME}/`, '')
    const file = bucket.file(filePath)

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    })

    return url
  } catch (error) {
    console.error('Signed URL generation failed:', error)
    throw new Error('署名付きURLの生成に失敗しました')
  }
}

// フォルダ内のファイル一覧取得（GCS）
export async function listFiles(folder: StorageFolder): Promise<string[]> {
  try {
    const [files] = await bucket.getFiles({
      prefix: `${folder}/`,
    })

    return files.map(file => `https://storage.googleapis.com/${BUCKET_NAME}/${file.name}`)
  } catch (error) {
    console.error('File listing failed:', error)
    return []
  }
}

// ファイルサイズの取得（GCS）
export async function getFileSize(fileUrl: string): Promise<number> {
  try {
    const filePath = fileUrl.replace(`https://storage.googleapis.com/${BUCKET_NAME}/`, '')
    const file = bucket.file(filePath)

    const [metadata] = await file.getMetadata()
    return parseInt(metadata.size || '0')
  } catch (error) {
    console.error('File size retrieval failed:', error)
    return 0
  }
}

// ストレージ使用量の取得（GCS）
export async function getStorageUsage(): Promise<{
  failures: number
  repairs: number
  inspections: number
  documents: number
  backups: number
  total: number
}> {
  const folders = Object.entries(STORAGE_FOLDERS)
  const usage: any = {}
  let total = 0

  for (const [key, folder] of folders) {
    try {
      const [files] = await bucket.getFiles({
        prefix: `${folder}/`,
      })

      let folderSize = 0
      for (const file of files) {
        const [metadata] = await file.getMetadata()
        folderSize += parseInt(metadata.size || '0')
      }
      usage[key.toLowerCase()] = folderSize
      total += folderSize
    } catch (error) {
      console.error(`Failed to get usage for ${folder}:`, error)
      usage[key.toLowerCase()] = 0
    }
  }

  return {
    failures: usage.failures || 0,
    repairs: usage.repairs || 0,
    inspections: usage.inspections || 0,
    documents: usage.documents || 0,
    backups: usage.backups || 0,
    total,
  }
}

// ファイル形式の検証
export function validateFileType(fileName: string, allowedTypes: string[] = ['jpg', 'jpeg', 'png', 'gif', 'pdf']): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? allowedTypes.includes(extension) : false
}

// ファイルサイズの検証（デフォルト10MB）
export function validateFileSize(fileSize: number, maxSize: number = 10 * 1024 * 1024): boolean {
  return fileSize <= maxSize
}

// ファイル名の正規化
export function normalizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // 特殊文字をアンダースコアに置換
    .replace(/_{2,}/g, '_') // 連続するアンダースコアを1つに
    .toLowerCase()
}