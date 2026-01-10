"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, ChevronDown } from "lucide-react"

// ナビゲーションアイテムの型定義
interface NavigationItem {
  name: string
  href: string
  icon: any
  description: string
}

// ナビゲーションアイテムの定義
const navigationItems: NavigationItem[] = [
  {
    name: "運用計画",
    href: "/operations",
    icon: "📋",
    description: "運用計画を作成・編集します"
  },
  {
    name: "運用管理",
    href: "/management",
    icon: "📊",
    description: "運用計画と実績を統合的に表示・管理します"
  },
]

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // メモ化されたナビゲーションアイテム
  const memoizedNavigationItems = useMemo(() => navigationItems, [])

  // 現在のパスがアクティブかどうかを判定する関数
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-[#2563eb] text-white shadow-md relative z-50">
      <div className="flex h-20 items-stretch">
        {/* 左側：システムタイトル */}
        <div className="flex items-center px-8 border-r border-blue-400">
          <h1 className="text-2xl font-bold tracking-tight select-none">
            鉄道保守管理システム
          </h1>
        </div>

        {/* 中央：ナビゲーションタブ */}
        <div className="flex-1 flex items-center px-8 space-x-6">
          {memoizedNavigationItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-6 py-2 rounded-md font-bold transition-all duration-200",
                  active
                    ? "bg-white text-[#2563eb] shadow-lg scale-105"
                    : "text-white/90 hover:bg-white/10"
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-lg">{item.name}</span>
              </Link>
            )
          })}
        </div>

        {/* 右側：シンプルな操作ボタンのみ表示 */}
        <div className="flex items-center px-6 space-x-2 border-l border-blue-400">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-10 w-10">
            <ChevronDown className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-10 w-10">
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* モバイル用メニュー（必要に応じて維持） */}
      <div className="md:hidden absolute top-4 right-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#2563eb] text-white border-blue-400">
            <div className="flex flex-col space-y-6 mt-12">
              {memoizedNavigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center space-x-4 px-4 py-3 rounded-lg text-lg font-bold transition-colors",
                    isActive(item.href) ? "bg-white text-[#2563eb]" : "hover:bg-white/10"
                  )}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
