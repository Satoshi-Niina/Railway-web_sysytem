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
    if (!userStr) {
      console.log('⚠️ ストレージにユーザー情報がありません')
      return null
    }

    const user = JSON.parse(userStr)
    console.log('✅ ストレージからユーザー情報を取得:', { 
      username: user.username, 
      role: user.role,
      displayName: user.displayName 
    })
    return user
  } catch (error) {
    console.error('❌ ユーザー情報の解析に失敗:', error)
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
    
    // auth_token パラメータを確認（JWTトークン）
    const authToken = params.get('auth_token')
    if (authToken) {
      console.log('🔑 auth_tokenパラメータを検出:', authToken.substring(0, 50) + '...')
      
      // JWTトークンをデコード（ペイロード部分を取得）
      try {
        const parts = authToken.split('.')
        if (parts.length !== 3) {
          console.error('❌ 不正なJWTトークン形式')
          return null
        }
        
        // Base64デコード（ペイロード部分）
        const payload = parts[1]
        if (!payload) {
          console.error('❌ JWTペイロードが空です')
          return null
        }
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
        const decoded = JSON.parse(atob(base64))
        console.log('✅ JWTデコード成功:', decoded)
        
        const user: UserInfo = {
          id: decoded.id,
          username: decoded.username,
          displayName: decoded.displayName,
          role: decoded.role,
          department: decoded.department,
          iat: decoded.iat
        }
        
        // 取得したユーザー情報をストレージに保存
        localStorage.setItem('user', JSON.stringify(user))
        console.log('💾 ユーザー情報をlocalStorageに保存しました')
        
        // URLからパラメータを削除
        const url = new URL(window.location.href)
        url.searchParams.delete('auth_token')
        window.history.replaceState({}, '', url.toString())
        console.log('🔗 auth_tokenパラメータを削除しました')
        
        return user
      } catch (decodeError) {
        console.error('❌ JWTデコードエラー:', decodeError)
        return null
      }
    }
    
    // 旧形式: user パラメータ（互換性のため）
    const userParam = params.get('user')
    if (userParam) {
      console.log('ℹ️ userパラメータを検出（旧形式）')
      const user = JSON.parse(decodeURIComponent(userParam))
      console.log('✅ URLからユーザー情報を取得:', { 
        username: user.username, 
        role: user.role,
        displayName: user.displayName 
      })
      
      // 取得したユーザー情報をストレージに保存
      localStorage.setItem('user', JSON.stringify(user))
      console.log('💾 ユーザー情報をlocalStorageに保存しました')
      
      // URLからパラメータを削除
      const url = new URL(window.location.href)
      url.searchParams.delete('user')
      window.history.replaceState({}, '', url.toString())
      console.log('🔗 URLパラメータを削除しました')
      
      return user
    }
    
    console.log('ℹ️ URLにauth_token/userパラメータがありません')
    return null
  } catch (error) {
    console.error('❌ URLからのユーザー情報取得に失敗:', error)
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
  // ダッシュボードからの認証を使用するため、常に有効
  // ユーザー情報の有無で制御する
  return true
}
