/**
 * クライアントサイド認証ガード
 * ダッシュボードアプリからのユーザー情報を確認し、
 * 一般ユーザー（viewer）のアクセスを制限する
 */

export interface UserInfo {
  id: number
  username: string
  displayName?: string  // 表示名（Emergency-Assistanceで必要）
  role: string
  department?: string   // 所属部署（Emergency-Assistanceで必要）
  iat?: number         // 発行時刻
  // 互換性のために保持（古いダッシュボード対応）
  email?: string
  isActive?: boolean
}

/**
 * ローカルストレージまたはセッションストレージからユーザー情報を取得
 */
export function getUserFromStorage(): UserInfo | null {
  if (typeof window === 'undefined') return null

  try {
    // ダッシュボードアプリから渡されるユーザー情報を確認
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (!userStr) return null

    const user = JSON.parse(userStr)
    return user
  } catch (error) {
    console.error('Failed to parse user info:', error)
    return null
  }
}

/**
 * URLパラメータからユーザー情報を取得（ダッシュボードから遷移時）
 */
export function getUserFromURL(): UserInfo | null {
  if (typeof window === 'undefined') return null

  try {
    const params = new URLSearchParams(window.location.search)
    const userParam = params.get('user')
    
    if (!userParam) return null

    const user = JSON.parse(decodeURIComponent(userParam))
    
    // 取得したユーザー情報をストレージに保存
    localStorage.setItem('user', JSON.stringify(user))
    
    // URLからパラメータを削除（リロード時に再度チェックしないように）
    const url = new URL(window.location.href)
    url.searchParams.delete('user')
    window.history.replaceState({}, '', url.toString())
    
    return user
  } catch (error) {
    console.error('Failed to parse user from URL:', error)
    return null
  }
}

/**
 * ユーザーがこのシステムにアクセス可能かチェック
 * @returns true: アクセス可能, false: アクセス不可
 */
export function canAccessSystem(user: UserInfo | null): boolean {
  if (!user) return false
  
  // isActiveが存在する場合のみチェック（互換性保持）
  if (user.isActive !== undefined && !user.isActive) return false

  // 管理者（admin）と運用管理者（operator）のみアクセス可能
  const allowedRoles = ['admin', 'operator', 'system_admin', 'operation_manager']
  return allowedRoles.includes(user.role.toLowerCase())
}

/**
 * 一般ユーザー（viewer）かどうか判定
 */
export function isGeneralUser(user: UserInfo | null): boolean {
  if (!user) return false
  const generalRoles = ['viewer', 'user', 'guest', 'readonly']
  return generalRoles.includes(user.role.toLowerCase())
}

/**
 * ユーザー情報をクリア
 */
export function clearUserInfo(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('user')
  localStorage.removeItem('authToken')
  localStorage.removeItem('userName')
  localStorage.removeItem('userRole')
  sessionStorage.removeItem('user')
}

/**
 * ダッシュボードアプリのURLを取得
 */
export function getDashboardURL(): string {
  return process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3002'
}

/**
 * 認証が有効かどうかをチェック
 * - NEXT_PUBLIC_ENABLE_AUTH=false の場合は認証スキップ
 * - NEXT_PUBLIC_DASHBOARD_URL が未設定の場合は認証スキップ（開発環境）
 */
export function isAuthEnabled(): boolean {
  // 明示的に認証無効化されている場合
  if (process.env.NEXT_PUBLIC_ENABLE_AUTH === 'false') {
    return false
  }
  
  // ダッシュボードURLが未設定の場合は開発環境とみなして認証スキップ
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL
  if (!dashboardUrl || dashboardUrl === 'http://localhost:3002') {
    return false
  }
  
  return true
}
