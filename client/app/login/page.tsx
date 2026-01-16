"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Train, Lock, User, AlertCircle, Loader2 } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [dashboardUserInfo, setDashboardUserInfo] = useState<string | null>(null)

  useEffect(() => {
    const dashboardUser = localStorage.getItem("dashboardUser")
    if (dashboardUser) {
      try {
        const user = JSON.parse(dashboardUser)
        setDashboardUserInfo(`ダッシュボードでログイン中: ${user.username} (${user.role})`)
      } catch (e) {
        console.error("Failed to parse dashboard user:", e)
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || "ログインに失敗しました")
        setIsLoading(false)
        return
      }

      const userInfo = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
        isActive: data.user.is_active,
        managementOfficeId: data.user.management_office_id,
      }

      localStorage.setItem("user", JSON.stringify(userInfo))
      localStorage.setItem("userName", data.user.username)
      localStorage.setItem("userRole", data.user.role)
      localStorage.removeItem("dashboardUser")

      console.log("✅ DB認証成功:", data.user.username, data.user.role)

      setIsLoading(false)
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
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm">
              <Train className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">鉄道保守システム</h1>
          <p className="text-blue-200">Railway Maintenance System</p>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">ログイン</CardTitle>
            <CardDescription className="text-center">システム管理者・運用管理者専用</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {dashboardUserInfo && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-800">
                    {dashboardUserInfo}
                    <br />
                    <span className="text-xs">管理者権限でログインする場合は、管理者アカウントでログインしてください。</span>
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">ユーザー名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="username" type="text" placeholder="ユーザー名を入力" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-9" required disabled={isLoading} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="password" type="password" placeholder="パスワードを入力" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" required disabled={isLoading} />
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" size="lg" disabled={isLoading}>
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />認証中...</>) : ("ログイン")}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-slate-600 text-center">
                master_data.usersテーブルに登録された管理者アカウントでログインしてください。
                <br />
                本番環境ではダッシュボードから管理者は自動ログインされます。
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-white/70">
          <p>© 2026 Railway Maintenance System v2.0.0</p>
        </div>
      </div>
    </div>
  )
}
