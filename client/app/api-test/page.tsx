"use client"

import { useState } from "react"

export default function ApiTestPage() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testApi = async (endpoint: string) => {
    setError(null)
    setResult(null)
    
    try {
      console.log("Testing endpoint:", endpoint)
      const url = `/api/${endpoint}`
      console.log("Full URL:", url)
      
      const response = await fetch(url)
      console.log("Response status:", response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("Response data:", data)
      setResult(data)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error"
      console.error("Error:", errorMsg)
      setError(errorMsg)
    }
  }

  return (
    <div className="max-w-[1920px] mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">API接続テスト</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button 
          onClick={() => testApi("vehicles")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          車両データ取得
        </button>
        <button 
          onClick={() => testApi("bases")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          基地データ取得
        </button>
        <button 
          onClick={() => testApi("offices")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          事業所データ取得
        </button>
        <button 
          onClick={() => testApi("operation-plans?month=2026-01")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          運用計画データ取得 (2026-01)
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 border-2 border-red-500 rounded bg-red-50">
          <h3 className="text-red-500 font-bold mb-2">エラー</h3>
          <pre className="text-red-500">{error}</pre>
        </div>
      )}

      {result && (
        <div className="p-4 border rounded bg-white">
          <h3 className="font-bold mb-2">取得結果</h3>
          <p className="mb-2">件数: {Array.isArray(result) ? result.length : 1}</p>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
