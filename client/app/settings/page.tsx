import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Building2, Database, Wrench, Car } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* ヘッダーセクション */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">設定</h1>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto">
          システムの各種設定とマスタデータの管理を行います。事業所、保守基地、車両情報、データベース設定などを管理できます。
        </p>
      </div>

      {/* 設定カードセクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 事業所マスタ */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              <CardTitle>事業所マスタ</CardTitle>
            </div>
            <CardDescription>保守事業所の情報を管理します。</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/offices">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 保守基地マスタ */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Building2 className="w-6 h-6 text-green-600" />
              <CardTitle>保守基地マスタ</CardTitle>
            </div>
            <CardDescription>保守基地の情報を管理します。</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/maintenance-bases">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 保守用車マスタ */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Car className="w-6 h-6 text-purple-600" />
              <CardTitle>保守用車マスタ</CardTitle>
            </div>
            <CardDescription>保守用車の種類を管理します。</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/vehicles">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 検修管理 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Wrench className="w-6 h-6 text-orange-600" />
              <CardTitle>検修管理</CardTitle>
            </div>
            <CardDescription>機種ごとに定期点検・乙A検査・甲検査・臨修の周期を設定・管理します。</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/maintenance/cycles">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>

        {/* データベース管理 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Database className="w-6 h-6 text-red-600" />
              <CardTitle>データベース管理</CardTitle>
            </div>
            <CardDescription>データベースのバックアップ・復元・設定を管理します。</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/database">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 