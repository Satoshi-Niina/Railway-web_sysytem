"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getUserFromStorage, getUserFromURL, canAccessSystem, isGeneralUser, clearUserInfo, getDashboardURL, isAuthEnabled } from "@/lib/auth-guard"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // ログインページとアンオーソライズドページは認証チェックをスキップ
    // ※ 管理者はログインページを使わず、ダッシュボードからの認証情報で直接アクセス
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
      console.log('🔍 認証チェック開始...')
      
      // 0. 認証が無効化されている場合はスキップ
      if (!isAuthEnabled()) {
        console.log('🔓 認証無効: 直接アクセスを許可')
        setIsAuthorized(true)
        setIsLoading(false)
        return
      }
      
      // 1. URLパラメータからユーザー情報を取得（ダッシュボードからの遷移）
      let user = getUserFromURL()
      
      // 2. URLにない場合はストレージから取得
      if (!user) {
        user = getUserFromStorage()
        console.log('📋 ストレージからユーザー情報取得:', user)
      } else {
        console.log('🔗 URLパラメータからユーザー情報取得:', user)
      }

      // 3. ユーザー情報がない場合 → ダッシュボードへリダイレクト
      if (!user) {
        console.warn('⚠️ ユーザー情報が見つかりません。ダッシュボードへリダイレクトします。')
        setIsAuthorized(false)
        setIsLoading(false)
        redirectToDashboard()
        return
      }

      // 4. 一般ユーザー（viewer）の場合 → アクセス拒否ページへ
      if (isGeneralUser(user)) {
        console.warn('❌ 一般ユーザーはアクセスできません:', user.role)
        // ユーザー名とロールを保存（unauthorized ページで表示）
        localStorage.setItem('userName', user.displayName || user.username)
        localStorage.setItem('userRole', user.role)
        setIsAuthorized(false)
        setIsLoading(false)
        router.push('/unauthorized?reason=role')
        return
      }

      // 5. 管理者・運用者の場合 → アクセス許可（ログインページをスキップ）
      if (canAccessSystem(user)) {
        console.log('✅ 認証成功 - アクセス許可:', user.username, `(${user.role})`)
        
        // ユーザー情報を確実にストレージに保存
        const userInfo = {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          department: user.department,
          iat: user.iat
        }
        localStorage.setItem('user', JSON.stringify(userInfo))
        localStorage.setItem('userName', user.displayName || user.username)
        localStorage.setItem('userRole', user.role)
        if (user.department) {
          localStorage.setItem('userDepartment', user.department)
        }
        
        setIsAuthorized(true)
        setIsLoading(false)
      } else {
        console.warn('⚠️ アクセス権限がありません:', user.role)
        localStorage.setItem('userName', user.displayName || user.username)
        localStorage.setItem('userRole', user.role)
        setIsAuthorized(false)
        setIsLoading(false)
        router.push('/unauthorized?reason=role')
      }
    } catch (error) {
      console.error('❌ 認証チェックエラー:', error)
      
      // 認証が無効の場合はエラー時もアクセス許可
      if (!isAuthEnabled()) {
        console.log('🔓 認証無効: エラーが発生しましたがアクセスを許可')
        setIsAuthorized(true)
      } else {
        // 認証有効時はダッシュボードへリダイレクト
        console.log('🔒 認証有効: エラー発生のためダッシュボードへリダイレクト')
        redirectToDashboard()
      }
    } finally {
      setIsLoading(false)
    }
  }

  function redirectToDashboard() {
    const dashboardURL = getDashboardURL()
    console.log('🔄 ダッシュボードにリダイレクト:', dashboardURL)
    
    // ユーザー情報はクリアしない（ダッシュボード側で管理）
    // clearUserInfo()
    
    // 現在のアプリを閉じて、ダッシュボードに戻る
    // window.openerがある場合は、ダッシュボードから開かれたウィンドウなので閉じる
    if (window.opener) {
      console.log('📱 ダッシュボードから開かれたウィンドウを閉じます')
      window.close()
    } else {
      // 直接アクセスの場合はダッシュボードにリダイレクト
      console.log('🌐 ダッシュボードにリダイレクトします')
      window.location.href = dashboardURL
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
