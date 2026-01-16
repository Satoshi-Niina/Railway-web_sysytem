"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getUserFromStorage, getUserFromURL, canAccessSystem, isGeneralUser, clearUserInfo, getDashboardURL } from "@/lib/auth-guard"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // ログインページとアンオーソライズドページは認証チェックをスキップ
    if (pathname === '/login' || pathname === '/unauthorized') {
      setIsAuthorized(true)
      setIsLoading(false)
      return
    }

    checkAuth()
  }, [pathname, router])

  async function checkAuth() {
    try {
      // 1. URLパラメータからユーザー情報を取得（ダッシュボードからの遷移）
      let user = getUserFromURL()
      
      // 2. ストレージからユーザー情報を取得
      if (!user) {
        user = getUserFromStorage()
      }

      // 3. ユーザー情報がない場合
      if (!user) {
        console.warn('ユーザー情報が見つかりません。ダッシュボードにリダイレクトします。')
        redirectToDashboard()
        return
      }

      // 4. 一般ユーザー（viewer）の場合はアクセス拒否
      if (isGeneralUser(user)) {
        console.warn('一般ユーザーはアクセスできません:', user.role)
        localStorage.setItem('userName', user.username)
        localStorage.setItem('userRole', user.role)
        router.push('/unauthorized?reason=role')
        return
      }

      // 5. システムへのアクセス権限チェック
      if (!canAccessSystem(user)) {
        console.warn('アクセス権限がありません:', user.role)
        localStorage.setItem('userName', user.username)
        localStorage.setItem('userRole', user.role)
        router.push('/unauthorized?reason=role')
        return
      }

      // 6. 認証成功
      console.log('✅ 認証成功:', user.username, user.role)
      localStorage.setItem('userName', user.username)
      localStorage.setItem('userRole', user.role)
      setIsAuthorized(true)
    } catch (error) {
      console.error('認証チェックエラー:', error)
      redirectToDashboard()
    } finally {
      setIsLoading(false)
    }
  }

  function redirectToDashboard() {
    const dashboardURL = getDashboardURL()
    console.log('ダッシュボードにリダイレクト:', dashboardURL)
    clearUserInfo()
    
    // ダッシュボードURLが設定されている場合はリダイレクト
    if (dashboardURL && dashboardURL !== 'http://localhost:3002') {
      window.location.href = dashboardURL
    } else {
      // 開発環境ではログインページへ
      router.push('/login')
    }
  }

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-600 font-medium">認証確認中...</p>
        </div>
      </div>
    )
  }

  // 認証失敗
  if (isAuthorized === false) {
    return null
  }

  // 認証成功
  return <>{children}</>
}
