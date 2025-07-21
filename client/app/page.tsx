import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, Route, ClipboardCheck, AlertTriangle, BarChart3, Calendar, FileText, Wrench } from "lucide-react"

export default function HomePage() {
  return (
    <div className="space-y-12 p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">鉄道保守管理システム</h1>
        <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
          鉄道保守用車両の**運用管理チャート**を中心に、走行計画・実績、検査計画、故障・修繕記録を一元管理するシステムです。
          効率的な車両管理と保守業務の最適化を支援します。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {/* 運用管理チャート */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl">
              <BarChart3 className="w-8 h-8 mr-4 text-blue-600" />
              運用管理チャート
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-base mb-6 leading-relaxed">
              車両の運用計画、運用実績、検査計画を日単位で統合的に表示・管理します。
            </p>
            <Link href="/operations">
              <Button className="w-full text-lg py-3">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 運用計画 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl">
              <Route className="w-8 h-8 mr-4 text-green-600" />
              運用計画
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-base mb-6 leading-relaxed">
              走行運用計画と実績距離を記録し、ガントチャート風に月単位で表示します。
            </p>
            <Link href="/travel">
              <Button className="w-full text-lg py-3">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 検査計画 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl">
              <ClipboardCheck className="w-8 h-8 mr-4 text-purple-600" />
              検査計画
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-base mb-6 leading-relaxed">
              点検種別・計画実施日・PDF添付ファイルを記録し、検査計画を一元管理します。
            </p>
            <Link href="/inspections">
              <Button className="w-full text-lg py-3">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 車両管理 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl">
              <Car className="w-8 h-8 mr-4 text-blue-600" />
              車両管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-base mb-6 leading-relaxed">
              モータカー・鉄トロ・ホッパーなどの機械を名称・型式・区分・留置基地で管理します。
            </p>
            <Link href="/vehicles">
              <Button className="w-full text-lg py-3">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 故障・修繕 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl">
              <AlertTriangle className="w-8 h-8 mr-4 text-red-600" />
              故障・修繕
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-base mb-6 leading-relaxed">
              故障日・内容・修繕内容・画像を記録し、故障対応履歴を管理します。
            </p>
            <Link href="/failures">
              <Button className="w-full text-lg py-3">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <BarChart3 className="w-7 h-7 mr-3" />
              システムの特徴
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-6">
              <li className="flex items-start">
                <Calendar className="w-7 h-7 mr-4 text-blue-500 mt-1" />
                <div>
                  <strong className="text-lg">運用管理チャート</strong>
                  <p className="text-base text-gray-600 leading-relaxed">運用計画、実績、検査計画を統合的に可視化・管理</p>
                </div>
              </li>
              <li className="flex items-start">
                <FileText className="w-7 h-7 mr-4 text-green-500 mt-1" />
                <div>
                  <strong className="text-lg">文書管理</strong>
                  <p className="text-base text-gray-600 leading-relaxed">検査報告書や画像ファイルの添付・管理</p>
                </div>
              </li>
              <li className="flex items-start">
                <Wrench className="w-7 h-7 mr-4 text-purple-500 mt-1" />
                <div>
                  <strong className="text-lg">保守履歴</strong>
                  <p className="text-base text-gray-600 leading-relaxed">故障から修繕まで一連の履歴を追跡</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">システム概要</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 text-lg">対象車両</h4>
                <p className="text-base text-gray-600 leading-relaxed">モータカー、鉄トロ、ホッパーなどの鉄道保守用車両</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-lg">管理項目</h4>
                <p className="text-base text-gray-600 leading-relaxed">車両情報、運用計画・実績、検査計画、故障・修繕記録</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-lg">利用環境</h4>
                <p className="text-base text-gray-600 leading-relaxed">PC、タブレット、スマートフォンに対応したレスポンシブデザイン</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
