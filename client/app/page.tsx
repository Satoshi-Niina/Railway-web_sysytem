import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart3, Route } from "lucide-react"

// 静的生成を無効化
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="py-12 space-y-8">
        {/* ヘッダーセクション */}
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">運用業務ポータル</h2>
          <p className="text-lg text-gray-600">
            鉄道保守用車両の**運用管理**を一元化。リアルタイムな計画共有と実績把握をサポートします。
          </p>
        </div>

        {/* メインカードセクション */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* 運用計画 */}
          <Card className="hover:shadow-xl transition-all border-t-4 border-blue-500 overflow-hidden group">
            <CardHeader className="bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Route className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl">運用計画</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 mb-6 min-h-[3rem]">
                走行運用計画の作成・編集および月単位のチャート表示を行います。
              </p>
              <Link href="/operations">
                <Button className="w-full bg-[#2563eb] hover:bg-blue-700 h-12 text-lg font-bold">
                  計画画面へ移動
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 運用実績管理 */}
          <Card className="hover:shadow-xl transition-all border-t-4 border-blue-500 overflow-hidden group">
            <CardHeader className="bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl">運用管理</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 mb-6 min-h-[3rem]">
                基地別・機種別の運用状況を日単位で統合管理します。
              </p>
              <Link href="/management">
                <Button className="w-full bg-[#2563eb] hover:bg-blue-700 h-12 text-lg font-bold">
                  管理画面へ移動
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
