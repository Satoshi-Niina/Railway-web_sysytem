import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "保守用車管理システム", // 名称変更
  description: "鉄道保守用車両の運用管理・走行管理・検査・故障記録を一元管理するシステム",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Navigation />
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-8 py-12 max-w-7xl">{children}</div>
        </main>
      </body>
    </html>
  )
}
