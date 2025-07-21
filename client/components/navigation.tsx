"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Car, Route, ClipboardCheck, AlertTriangle, Menu, Train, BarChart3, Settings, Database, Users } from "lucide-react"

const navigation = [
  {
    name: "運用管理",
    href: "/operations",
    icon: BarChart3,
  },
  {
    name: "運用計画",
    href: "/travel",
    icon: Route,
  },
  {
    name: "故障・修繕",
    href: "/failures",
    icon: AlertTriangle,
  },
]

const settingsMenu = [
  {
    name: "データベース管理",
    href: "/settings/database",
    icon: Database,
    description: "データベースの接続・バックアップ・復元"
  },
  {
    name: "保守用車マスタ",
    href: "/vehicles",
    icon: Car,
    description: "保守用車両の基本情報管理"
  },
  {
    name: "検査計画管理",
    href: "/inspections",
    icon: ClipboardCheck,
    description: "車両検査計画の作成・管理"
  },
  {
    name: "検修周期マスタ",
    href: "/maintenance/cycles",
    icon: Settings,
    description: "機種ごとに定期点検・乙A検査・甲検査・臨修の周期を設定・管理"
  },
  {
    name: "ユーザー管理",
    href: "/settings/users",
    icon: Users,
    description: "ユーザーアカウントの管理"
  },
]

export function Navigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center space-x-12">
          <Link href="/" className="flex items-center space-x-3">
            <Train className="w-10 h-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">保守用車管理システム</span>
          </Link>

          <div className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-md text-base font-medium transition-colors ${
                    isActive ? item.name === "運用管理" 
                      ? "bg-blue-100 text-blue-700 border-2 border-blue-300 rounded-full"
                      : "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span>{item.name}</span>
                </Link>
              )
            })}

            {/* 設定ドロップダウンメニュー */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-md text-base font-medium transition-colors ${
                    pathname.startsWith('/settings') || pathname === '/vehicles' || pathname === '/inspections' || pathname === '/maintenance/cycles' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Settings className="w-6 h-6" />
                  <span>設定</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {settingsMenu.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link
                        href={item.href}
                        className={`flex items-start space-x-3 p-3 rounded-md transition-colors ${
                          isActive ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Train className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">保守用車管理</span>
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-3">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-6 mt-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center space-x-4 px-4 py-3 rounded-md text-base font-medium transition-colors ${
                        isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}

                {/* 設定セクション */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    設定
                  </div>
                  {settingsMenu.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center space-x-4 px-4 py-3 rounded-md text-base font-medium transition-colors ${
                          isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  )
}
