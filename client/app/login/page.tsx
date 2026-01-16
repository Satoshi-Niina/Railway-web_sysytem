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
      // 開発環境用：簡易ログイン（実際にはダッシュボードから来る想定）
      // デモ用の管理者アカウント
      const demoUsers: Record<string, { username: string; role: string; password: string }> = {
        admin: { username: "admin", role: "admin", password: "admin123" },
        operator: { username: "operator", role: "operator", password: "operator123" },
        viewer: { username: "viewer", role: "viewer", password: "viewer123" },
      }

      const user = demoUsers[username]

      if (!user || user.password !== password) {
        setError("ユーザー名またはパスワードが正しくありません")
        setIsLoading(false)
        return
      }

      // ユーザー情報をストレージに保存
      const userInfo = {
        id: username === "admin" ? 1 : username === "operator" ? 2 : 3,
        username: user.username,
        email: `${user.username}@example.com`,
        role: user.role,
        isActive: true,
      }

      localStorage.setItem("user", JSON.stringify(userInfo))
      localStorage.setItem("userName", user.username)
      localStorage.setItem("userRole", user.role)

      // 一般ユーザーの場合は即座にunauthorizedへ
      if (user.role === "viewer") {
        setIsLoading(false)
        router.push("/unauthorized?reason=role")
        return
      }

      // 管理者・運用者の場合はホームへ
      setIsLoading(false)
      router.push("/")
    } catch (error) {
      console.error("Login error:", error)
      setError("ログイン処理でエラーが発生しました")
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

            {/* デモアカウント情報 */}
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800 font-semibold mb-2">開発環境用デモアカウント：</p>
              <div className="text-xs text-amber-700 space-y-1">
                <p>• 管理者: admin / admin123</p>
                <p>• 運用者: operator / operator123</p>
                <p>• 閲覧者: viewer / viewer123 (アクセス拒否)</p>
              </div>
            </div>
            
            {/* 注意事項 */}
            <div className="mt-3 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-slate-600 text-center">
                このシステムは認可されたユーザーのみがアクセス可能です。
                <br />
                本番環境ではダッシュボードから自動ログインされます。
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
