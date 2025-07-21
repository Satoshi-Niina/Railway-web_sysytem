"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  {
    name: "故障・修繕",
    href: "/failures",
    icon: "⚠️",
    description: "故障日・内容・修繕内容・画像を記録し、故障対応履歴を管理"
  },
]

const settingsItems: NavigationItem[] = [
  {
    name: "事業所マスタ",
    href: "/settings/offices",
    icon: "🏢",
    description: "保守事業所の情報管理"
  },
  {
    name: "保守基地マスタ",
    href: "/settings/maintenance-bases",
    icon: "🏢",
    description: "保守基地の情報管理"
  },
  {
    name: "保守用車マスタ",
    href: "/vehicles",
    icon: "🚗",
    description: "保守用車の種類管理"
  },
  {
    name: "検修周期マスタ",
    href: "/maintenance/cycles",
    icon: "⚙️",
    description: "機種ごとに定期点検・乙A検査・甲検査・臨修の周期を設定・管理"
  },
]

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // メモ化されたナビゲーションアイテム
  const memoizedNavigationItems = useMemo(() => navigationItems, [])
  const memoizedSettingsItems = useMemo(() => settingsItems, [])

  // 現在のパスがアクティブかどうかを判定する関数
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* デスクトップナビゲーション */}
          <div className="hidden md:flex items-center space-x-8">
            {memoizedNavigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors",
                  isActive(item.href)
                    ? item.name === "運用管理" 
                      ? "bg-blue-100 text-blue-700 border-2 border-blue-300 rounded-full"
                      : "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                )}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
            
            {/* 設定ドロップダウン */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  <span>⚙️</span>
                  <span>設定</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {memoizedSettingsItems.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link
                      href={item.href}
                      className="flex items-center space-x-2 px-3 py-2 text-sm"
                    >
                      <span>{item.icon}</span>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* モバイルメニューボタン */}
          <div className="md:hidden flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  {memoizedNavigationItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      )}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </Link>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      設定
                    </div>
                    {memoizedSettingsItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive(item.href)
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                        )}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.description}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
