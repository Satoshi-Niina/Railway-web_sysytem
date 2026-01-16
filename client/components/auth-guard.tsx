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
      console.log('現在のURL:', window.location.href)
      
      // ローカル開発環境では認証をスキップ
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔓 ローカル環境: 認証スキップ')
        setIsAuthorized(true)
        setIsLoading(false)
        return
      }
      
      console.log('URLパラメータ:', window.location.search)
      
      // 1. URLパラメータからユーザー情報を取得（ダッシュボードからの遷移）
      let user = getUserFromURL()
      
      // 2. URLにない場合はストレージから取得
      if (!user) {
        user = getUserFromStorage()
        console.log('📋 ストレージからユーザー情報:', user)
      } else {
        console.log('🔗 URLからユーザー情報:', user)
      }

      // 3. ユーザー情報がない場合 → ダッシュボードへリダイレクト
      if (!user) {
        console.warn('⚠️ ユーザー情報がありません - ダッシュボードへリダイレクト')
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
      // エラー時はダッシュボードへリダイレクト
      redirectToDashboard()
    } finally {
      setIsLoading(false)
    }
  }

  function redirectToDashboard() {
    const dashboardURL = getDashboardURL()
    console.log('🔄 ダッシュボードにリダイレクト:', dashboardURL)
    
    // 本番環境では自動的にリダイレクトせず、メッセージを表示
    // （デバッグのため）
    console.log('⚠️ リダイレクトは実行しません。コンソールログを確認してください。')
    setIsAuthorized(false)
    setIsLoading(false)
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">認証エラー</h1>
          <p className="text-slate-700 mb-4">ユーザー情報を取得できませんでした。</p>
          <div className="bg-slate-100 p-4 rounded-lg mb-4 overflow-auto max-h-96">
            <p className="text-sm font-mono">コンソールログを確認してください（F12キーで開発者ツールを開く）</p>
            <pre className="text-xs mt-2">URL: {typeof window !== 'undefined' ? window.location.href : ''}</pre>
          </div>
          <button 
            onClick={() => {
              const dashboardURL = getDashboardURL()
              window.location.href = dashboardURL
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    )
  }

  // 認証成功
  return <>{children}</>
}
