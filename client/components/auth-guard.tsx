"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getUserFromStorage, getUserFromURL, canAccessSystem, isGeneralUser, getDashboardURL } from "@/lib/auth-guard"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // ログインページとアンオーソライズドページは認証チェックをスキップ
    if (pathname?.startsWith('/unauthorized')) {
      console.log('認証スキップ:', pathname)
      setIsAuthorized(true)
      setIsLoading(false)
      return
    }

    console.log('認証チェック開始:', pathname)
    checkAuth()
  }, [pathname])

  async function checkAuth() {
    try {
      console.log(' 認証チェック開始...')
      
      // ローカル開発環境では認証をスキップ (localhost または IPv4 loopback)
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        console.log(' ローカル環境: 認証スキップ')
        setIsAuthorized(true)
        setIsLoading(false)
        return
      }
      
      // 1. URLパラメータからユーザー情報を取得
      let user = getUserFromURL()
      
      // 2. なければストレージから取得
      if (!user) {
        user = getUserFromStorage()
        if (user) console.log(' ストレージからユーザー情報:', user)
      } else {
        console.log(' URLからユーザー情報:', user)
      }

      // 3. ユーザー情報がない場合
      if (!user) {
        console.warn(' ユーザー情報がありません')
        setIsAuthorized(false)
        setIsLoading(false)
        // デバッグモード：自動リダイレクトしない
        return
      }

      // 4. 一般ユーザーの場合
      if (isGeneralUser(user)) {
        console.warn(' 一般ユーザーはアクセスできません:', user.role)
        localStorage.setItem('userName', user.displayName || user.username)
        localStorage.setItem('userRole', user.role)
        setIsAuthorized(false)
        setIsLoading(false)
        router.push('/unauthorized?reason=role')
        return
      }

      // 5. アクセス許可
      if (canAccessSystem(user)) {
        console.log(' 認証成功:', user.username)
        
        const userInfo = {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          department: user.department,
          iat: user.iat
        }
        localStorage.setItem('user', JSON.stringify(userInfo))
        
        setIsAuthorized(true)
        setIsLoading(false)
      } else {
        console.warn(' 権限なし:', user.role)
        setIsAuthorized(false)
        setIsLoading(false)
        router.push('/unauthorized?reason=role')
      }
    } catch (error) {
      console.error(' 認証チェックエラー:', error)
      setIsAuthorized(false)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">認証確認中...</p>
        </div>
      </div>
    )
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-red-600 mb-2">認証エラー</h2>
          <p className="text-gray-700 mb-4">ユーザー情報を取得できませんでした。</p>
          <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-auto mb-4">
            Details in console logs (F12)
          </div>
          <button
            onClick={() => window.location.href = getDashboardURL()}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
