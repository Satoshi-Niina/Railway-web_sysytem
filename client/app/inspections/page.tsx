import { InspectionList } from "@/components/inspection-list"

// 静的生成を無効化
export const dynamic = 'force-dynamic'

export default function InspectionsPage() {
  return (
    <div className="max-w-[1920px] mx-auto py-4 space-y-4">
      <InspectionList />
    </div>
  )
}
