export interface UserInfo {
  id: number
  username: string
  displayName?: string
  role: string
  department?: string
  iat?: number
  email?: string
  isActive?: boolean
}

export function getUserFromStorage(): UserInfo | null {
  if (typeof window === 'undefined') return null
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (!userStr) return null
    return JSON.parse(userStr)
  } catch (error) {
    console.error('Failed to parse user info:', error)
    return null
  }
}

export function getUserFromURL(): UserInfo | null {
  if (typeof window === 'undefined') return null
  try {
    const params = new URLSearchParams(window.location.search)
    
    // JWT Token (auth_token)
    const authToken = params.get('auth_token')
    if (authToken) {
      try {
        const parts = authToken.split('.')
        if (parts.length !== 3) return null
        
        const payload = parts[1]
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
        const decoded = JSON.parse(atob(base64))
        
        const user: UserInfo = {
          id: decoded.id,
          username: decoded.username,
          displayName: decoded.displayName,
          role: decoded.role,
          department: decoded.department,
          iat: decoded.iat
        }
        
        localStorage.setItem('user', JSON.stringify(user))
        
        // Clean URL
        const url = new URL(window.location.href)
        url.searchParams.delete('auth_token')
        window.history.replaceState({}, '', url.toString())
        
        return user
      } catch (e) {
        console.error('JWT decode error:', e)
      }
    }

    // Legacy param (user)
    const userParam = params.get('user')
    if (userParam) {
      const user = JSON.parse(decodeURIComponent(userParam))
      localStorage.setItem('user', JSON.stringify(user))
      
      const url = new URL(window.location.href)
      url.searchParams.delete('user')
      window.history.replaceState({}, '', url.toString())
      return user
    }
    
    return null
  } catch (error) {
    console.error('URL parse error:', error)
    return null
  }
}

export function canAccessSystem(user: UserInfo | null): boolean {
  if (!user) return false
  if (user.isActive !== undefined && !user.isActive) return false
  const allowedRoles = ['admin', 'operator', 'system_admin', 'operation_manager']
  return allowedRoles.includes(user.role.toLowerCase())
}

export function isGeneralUser(user: UserInfo | null): boolean {
  if (!user) return false
  const generalRoles = ['viewer', 'user', 'guest', 'readonly']
  return generalRoles.includes(user.role.toLowerCase())
}

export function clearUserInfo(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('user')
  localStorage.removeItem('authToken')
  localStorage.removeItem('userName')
  localStorage.removeItem('userRole')
  sessionStorage.removeItem('user')
}

export function getDashboardURL(): string {
  return process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3002'
}

export function isAuthEnabled(): boolean {
  return true
}
