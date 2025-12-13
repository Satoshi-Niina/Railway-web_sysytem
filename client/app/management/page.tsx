"use client"

import { OperationManagementChart } from "@/components/operation-management-chart"

// 静的生成を無効化
export const dynamic = 'force-dynamic'

export default function ManagementPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">運用実績管理</h1>
        <p className="text-gray-600 mt-2">運用計画と実績を管理し、仕業点検簿へのアクセスを提供します</p>
      </div>

      <OperationManagementChart />
    </div>
  )
} 