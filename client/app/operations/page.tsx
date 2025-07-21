"use client"

import { OperationPlanningChart } from "@/components/operation-planning-chart"

// 静的生成を無効化
export const dynamic = 'force-dynamic'

export default function OperationsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">運用計画</h1>
        <p className="text-gray-600 mt-2">運用計画を作成・編集します</p>
      </div>

      <OperationPlanningChart />
    </div>
  )
}
