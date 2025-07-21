import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart3, Route, AlertTriangle, Settings } from "lucide-react"

// 静的生成を無効化
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* ヘッダーセクション */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">鉄道保守管理システム</h1>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto">
          鉄道保守用車両の**運用管理**を中心に、走行計画・実績、検査計画、故障・修繕記録を一元管理するシステムです。効率的な車両管理と保守業務の最適化を支援します。
        </p>
      </div>

      {/* メインカードセクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 運用管理 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <CardTitle>運用管理</CardTitle>
            </div>
            <CardDescription>基地別・機種別の運用状況を日単位で統合的に表示・管理します。</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/operations">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 運用計画 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Route className="w-6 h-6 text-blue-600" />
              <CardTitle>運用計画</CardTitle>
            </div>
            <CardDescription>
              走行運用計画と実績記録を設定し、運用管理チャート形式で月単位で表示します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/travel">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 故障・修繕 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <CardTitle>故障・修繕</CardTitle>
            </div>
            <CardDescription>故障日・内容・修繕内容・画像を記録し、故障対応履歴を管理します。</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/failures">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 検修周期マスタ */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-green-600" />
              <CardTitle>検修周期マスタ</CardTitle>
            </div>
            <CardDescription>機種ごとに定期点検・乙A検査・甲検査・臨修の周期を設定・管理します。</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/maintenance/cycles">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
