import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// ストレージタイプの判定
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local'

// S3クライアントの初期化（STORAGE_TYPE=aws-s3の場合）
const s3Client = STORAGE_TYPE === 'aws-s3' ? new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
}) : null

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 
                    process.env.AZURE_STORAGE_CONTAINER_NAME || 
                    process.env.GCP_BUCKET_NAME || 
                    'railway-maintenance-storage'

// フォルダ構造の定義
export const STORAGE_FOLDERS = {
  FAILURES: 'failures',    // 故障画像
  REPAIRS: 'repairs',      // 修繕画像
  INSPECTIONS: 'inspections', // 検査画像
  DOCUMENTS: 'documents',  // 文書類
  BACKUPS: 'backups',      // データベースバックアップ
} as const

export type StorageFolder = typeof STORAGE_FOLDERS[keyof typeof STORAGE_FOLDERS]

// ファイルアップロード
export async function uploadFile(
  file: Buffer,
  fileName: string,
  folder: StorageFolder,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const key = `${folder}/${Date.now()}-${fileName}`
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read', // 公開読み取り可能
  })

  try {
    await s3Client.send(command)
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-northeast-1'}.amazonaws.com/${key}`
  } catch (error) {
    console.error('File upload failed:', error)
    throw new Error('ファイルのアップロードに失敗しました')
  }
}

// ファイル削除
export async function deleteFile(fileUrl: string): Promise<boolean> {
  try {
    // URLからキーを抽出
    const url = new URL(fileUrl)
    const key = url.pathname.substring(1) // 先頭のスラッシュを除去

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
    return true
  } catch (error) {
    console.error('File deletion failed:', error)
    return false
  }
}

// 署名付きURLの生成（一時的なアクセス用）
export async function generateSignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
  try {
    const url = new URL(fileUrl)
    const key = url.pathname.substring(1)

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    return await getSignedUrl(s3Client, command, { expiresIn })
  } catch (error) {
    console.error('Signed URL generation failed:', error)
    throw new Error('署名付きURLの生成に失敗しました')
  }
}

// フォルダ内のファイル一覧取得
export async function listFiles(folder: StorageFolder): Promise<string[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `${folder}/`,
    })

    const response = await s3Client.send(command)
    return response.Contents?.map(obj => obj.Key || '').filter(key => key) || []
  } catch (error) {
    console.error('File listing failed:', error)
    return []
  }
}

// ファイルサイズの取得
export async function getFileSize(fileUrl: string): Promise<number> {
  try {
    const url = new URL(fileUrl)
    const key = url.pathname.substring(1)

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const response = await s3Client.send(command)
    return response.ContentLength || 0
  } catch (error) {
    console.error('File size retrieval failed:', error)
    return 0
  }
}

// ストレージ使用量の取得
export async function getStorageUsage(): Promise<{
  failures: number
  repairs: number
  inspections: number
  documents: number
  total: number
}> {
  const folders = Object.values(STORAGE_FOLDERS)
  const usage: any = {}

  let total = 0

  for (const folder of folders) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `${folder}/`,
      })

      const response = await s3Client.send(command)
      const folderSize = response.Contents?.reduce((sum, obj) => sum + (obj.Size || 0), 0) || 0
      
      usage[folder] = folderSize
      total += folderSize
    } catch (error) {
      console.error(`Storage usage calculation failed for ${folder}:`, error)
      usage[folder] = 0
    }
  }

  return {
    failures: usage.failures || 0,
    repairs: usage.repairs || 0,
    inspections: usage.inspections || 0,
    documents: usage.documents || 0,
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