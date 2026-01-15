"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react"
import { STORAGE_FOLDERS, StorageFolder } from "@/lib/cloud-storage"
import { apiCall } from "@/lib/api-client"

interface FileUploadProps {
  folder: StorageFolder
  onUploadComplete?: (fileUrls: string[]) => void
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // MB
  acceptedTypes?: string[]
  className?: string
}

interface UploadedFile {
  name: string
  url: string
  size: number
}

export default function FileUpload({
  folder,
  onUploadComplete,
  multiple = true,
  maxFiles = 10,
  maxSize = 10,
  acceptedTypes = ['image/*', 'application/pdf'],
  className = ""
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    
    // ファイル数の制限チェック
    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "エラー",
        description: `最大${maxFiles}個のファイルまで選択できます`,
        variant: "destructive",
      })
      return
    }

    // ファイルサイズのチェック
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast({
        title: "エラー",
        description: `${oversizedFiles.map(f => f.name).join(', ')} が${maxSize}MBを超えています`,
        variant: "destructive",
      })
      return
    }

    setFiles(prev => [...prev, ...selectedFiles])
    setErrors([])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "エラー",
        description: "アップロードするファイルを選択してください",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setProgress(0)
    setErrors([])

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })
      formData.append('folder', folder)

      const result = await apiCall<any>('upload', {
        method: 'POST',
        body: formData,
      })

      if (result.success) {
        const newUploadedFiles: UploadedFile[] = result.uploadedFiles.map((url: string, index: number) => ({
          name: files[index].name,
          url,
          size: files[index].size
        }))

        setUploadedFiles(prev => [...prev, ...newUploadedFiles])
        setFiles([])
        
        toast({
          title: "成功",
          description: result.message,
        })

        if (onUploadComplete) {
          onUploadComplete(result.uploadedFiles)
        }
      } else {
        setErrors(result.errors || ['アップロードに失敗しました'])
        toast({
          title: "エラー",
          description: "アップロードに失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      setErrors(['アップロードでエラーが発生しました'])
      toast({
        title: "エラー",
        description: "アップロードでエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const removeUploadedFile = async (fileUrl: string) => {
    try {
      await apiCall(`upload?url=${encodeURIComponent(fileUrl)}`, {
        method: 'DELETE',
      })

      setUploadedFiles(prev => prev.filter(file => file.url !== fileUrl))
      toast({
        title: "成功",
        description: "ファイルを削除しました",
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "エラー",
        description: "ファイルの削除でエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ファイル選択エリア */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <Label htmlFor="file-upload" className="cursor-pointer">
          <span className="text-blue-600 hover:text-blue-700 font-medium">
            ファイルを選択
          </span>
          <span className="text-gray-500"> またはドラッグ&ドロップ</span>
        </Label>
        <Input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        <p className="text-sm text-gray-500 mt-2">
          最大{maxFiles}個のファイル、各{maxSize}MBまで
        </p>
      </div>

      {/* 選択されたファイル一覧 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">選択されたファイル</h4>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex-1">
                <div className="font-medium text-sm">{file.name}</div>
                <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* エラー表示 */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* アップロードボタン */}
      {files.length > 0 && (
        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              アップロード中...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              アップロード
            </>
          )}
        </Button>
      )}

      {/* プログレスバー */}
      {uploading && (
        <Progress value={progress} className="w-full" />
      )}

      {/* アップロード済みファイル一覧 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">アップロード済みファイル</h4>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <div className="font-medium text-sm">{file.name}</div>
                  <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(file.url, '_blank')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  表示
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUploadedFile(file.url)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 