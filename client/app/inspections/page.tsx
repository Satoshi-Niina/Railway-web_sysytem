import { InspectionList } from "@/components/inspection-list"

// 静的生成を無効化
export const dynamic = 'force-dynamic'

export default function InspectionsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <InspectionList />
    </div>
  )
}
