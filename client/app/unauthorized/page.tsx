"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldAlert, ArrowLeft, Lock, Users, Phone, Mail } from "lucide-react"

// 動的レンダリングを強制
export const dynamic = 'force-dynamic'

function UnauthorizedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason")
  const [userName, setUserName] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    // ローカルストレージからユーザー情報を取得
    const storedName = localStorage.getItem("userName")
    const storedRole = localStorage.getItem("userRole")
    if (storedName) setUserName(storedName)
    if (storedRole) setUserRole(storedRole)
  }, [])

  const getMessage = () => {
    switch (reason) {
      case "role":
        return {
          title: "アクセス権限が不足しています",
          description: "このシステムは管理者および運用管理者専用です",
          icon: <Lock className="h-16 w-16 text-amber-500" />,
        }
      case "session_expired":
        return {
          title: "セッションの有効期限が切れました",
          description: "再度ログインしてください",
          icon: <ShieldAlert className="h-16 w-16 text-blue-500" />,
        }
      default:
        return {
          title: "アクセスが制限されています",
          description: "このページへのアクセス権限がありません",
          icon: <ShieldAlert className="h-16 w-16 text-red-500" />,
        }
    }
  }

  const message = getMessage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* メインカード */}
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                {message.icon}
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-slate-800">
              {message.title}
            </CardTitle>
            <CardDescription className="text-lg text-slate-600">
              {message.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* ユーザー情報表示 */}
            {userName && (
              <Alert className="border-blue-200 bg-blue-50">
                <Users className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-slate-700">
                  <span className="font-semibold">ログイン中のユーザー：</span> {userName}
                  {userRole && (
                    <span className="ml-2 text-sm text-slate-500">
                      (権限: {userRole === "viewer" ? "閲覧者" : userRole})
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* 説明セクション */}
            <div className="bg-slate-50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                鉄道保守システムについて
              </h3>
              <div className="text-sm text-slate-600 space-y-2">
                <p>
                  このシステムは、鉄道車両の保守・点検・運用管理を行う専門システムです。
                </p>
                <p className="font-medium text-slate-700">
                  以下の権限を持つユーザーのみがアクセス可能です：
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>システム管理者（Admin）</li>
                  <li>運用管理者（Operator）</li>
                </ul>
              </div>
            </div>

            {/* お問い合わせセクション */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-slate-800">
                アクセス権限が必要な場合
              </h3>
              <p className="text-sm text-slate-600">
                システムへのアクセス権限が必要な場合は、所属部署の管理者にお問い合わせください。
              </p>
              <div className="flex flex-col sm:flex-row gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span>system-admin@example.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span>内線: 1234</span>
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => {
                  const dashboardURL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3002'
                  window.location.href = dashboardURL
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                ダッシュボードに戻る
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* フッター */}
        <div className="text-center text-sm text-slate-500">
          <p>Railway Maintenance System v2.0.0</p>
          <p className="mt-1">© 2026 All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-slate-600">読み込み中...</p>
        </div>
      </div>
    }>
      <UnauthorizedContent />
    </Suspense>
  )
}
