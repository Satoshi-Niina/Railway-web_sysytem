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
    if (pathname?.startsWith('/login') || pathname?.startsWith('/unauthorized')) {
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
      console.log('🔍 認証チェック開始...')
      
      // 1. URLパラメータからユーザー情報を取得（ダッシュボードからの遷移）
      let user = getUserFromURL()
      
      // 2. ストレージからユーザー情報を取得
      if (!user) {
        user = getUserFromStorage()
      }

      console.log('📋 ユーザー情報:', user)

      // 3. ユーザー情報がない場合 → 開発環境では許可、本番環境ではダッシュボードへ
      if (!user) {
        console.warn('⚠️ ユーザー情報が見つかりません。')
        
        // 開発環境では認証なしでアクセス許可（ローカルテスト用）
        if (process.env.NODE_ENV === 'development') {
          console.log('🔓 開発環境: トークンなしで直接起動を許可')
          setIsAuthorized(true)
          setIsLoading(false)
          return
        }
        
        // 本番環境ではダッシュボードへリダイレクト（トークン取得のため）
        console.log('🔒 本番環境: ダッシュボードへリダイレクト')
        redirectToDashboard()
        return
      }

      // 4. 一般ユーザー（viewer）の場合 → アクセス拒否
      if (isGeneralUser(user)) {
        console.warn('❌ 一般ユーザーはアクセスできません:', user.role)
        localStorage.setItem('userName', user.username)
        localStorage.setItem('userRole', user.role)
        router.push('/unauthorized?reason=role')
        return
      }

      // 5. 管理者・運用者の場合 → 直接アクセス許可
      if (canAccessSystem(user)) {
        console.log('✅ ダッシュボードから認証成功:', user.username, user.role)
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('userName', user.username)
        localStorage.setItem('userRole', user.role)
        setIsAuthorized(true)
      } else {
        console.warn('⚠️ アクセス権限がありません:', user.role)
        localStorage.setItem('userName', user.username)
        localStorage.setItem('userRole', user.role)
        router.push('/unauthorized?reason=role')
      }
    } catch (error) {
      console.error('❌ 認証チェックエラー:', error)
      
      // 開発環境ではエラー時もアクセス許可
      if (process.env.NODE_ENV === 'development') {
        console.log('🔓 開発環境: エラーが発生しましたがアクセスを許可')
        setIsAuthorized(true)
      } else {
        // 本番環境ではダッシュボードへリダイレクト
        console.log('🔒 本番環境: エラー発生のためダッシュボードへリダイレクト')
        redirectToDashboard()
      }
    } finally {
      setIsLoading(false)
    }
  }

  function redirectToDashboard() {
    const dashboardURL = getDashboardURL()
    console.log('🔄 ダッシュボードにリダイレクト:', dashboardURL)
    clearUserInfo()
    
    // ダッシュボードURLへリダイレクト
    window.location.href = dashboardURL
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
