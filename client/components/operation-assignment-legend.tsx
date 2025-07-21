import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Calendar, Home } from "lucide-react"

export function OperationAssignmentLegend() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">運用区分の説明</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">運用区分</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">昼間</Badge>
                <span className="text-sm">日中の運用（当日完結）</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">夜間</Badge>
                <span className="text-sm">夜間の運用（翌日まで継続）</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-purple-100 text-purple-800 border-purple-300">昼夜</Badge>
                <span className="text-sm">昼夜連続運用（翌日まで継続）</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-orange-100 text-orange-800 border-orange-300">留置</Badge>
                <span className="text-sm">前日運用からの留置状態</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">表示例</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-blue-50 p-2 rounded">
                <div className="font-medium">1日 東京基地 (MC-100)</div>
                <div className="flex items-center space-x-1 mt-1">
                  <Badge className="bg-blue-100 text-blue-800 text-xs">夜間</Badge>
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <MapPin className="w-3 h-3" />
                    <span>→大阪</span>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <div className="font-medium">2日 大阪基地 (MC-100)</div>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center space-x-1">
                    <Badge className="bg-orange-100 text-orange-800 text-xs">留置</Badge>
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <Home className="w-3 h-3" />
                      <span>前日から</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">+ 追加運用選択可能</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-3">
          <h4 className="font-medium text-sm mb-2">操作方法</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>セルをクリックして運用区分を選択</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>帰着基地を選択（全ての運用区分で必須）</span>
            </div>
            <div className="flex items-center space-x-2">
              <Home className="w-4 h-4" />
              <span>留置状態でも追加の運用を選択できます</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>夜間・昼夜の場合、翌日に自動で留置状態が追加されます</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
