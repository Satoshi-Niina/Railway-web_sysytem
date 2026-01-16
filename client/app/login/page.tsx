"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Train, Lock, User, AlertCircle, Loader2 } from "lucide-react"

// 動的レンダリングを強制
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "ログインに失敗しました")
        setIsLoading(false)
        return
      }

      // トークンとユーザー情報を保存
      localStorage.setItem("authToken", data.token)
      localStorage.setItem("userName", data.user.username)
      localStorage.setItem("userRole", data.user.role)

      // 一般ユーザーの場合は即座にunauthorizedへ
      if (data.user.role === "viewer") {
        router.push("/unauthorized?reason=role")
        return
      }

      // 管理者・運用者の場合はホームへ
      router.push("/")
    } catch (error) {
      console.error("Login error:", error)
      setError("サーバーとの通信に失敗しました")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* ヘッダー */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm">
              <Train className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">鉄道保守システム</h1>
          <p className="text-blue-200">Railway Maintenance System</p>
        </div>

        {/* ログインカード */}
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">ログイン</CardTitle>
            <CardDescription className="text-center">
              システム管理者・運用管理者専用
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* エラー表示 */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* ユーザー名 */}
              <div className="space-y-2">
                <Label htmlFor="username">ユーザー名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="ユーザー名を入力"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* パスワード */}
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="パスワードを入力"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* ログインボタン */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    認証中...
                  </>
                ) : (
                  "ログイン"
                )}
              </Button>
            </form>

            {/* 注意事項 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-slate-600 text-center">
                このシステムは認可されたユーザーのみがアクセス可能です。
                <br />
                アクセス権限が必要な場合は管理者にお問い合わせください。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* フッター */}
        <div className="text-center text-sm text-white/70">
          <p>© 2026 Railway Maintenance System v2.0.0</p>
        </div>
      </div>
    </div>
  )
}
