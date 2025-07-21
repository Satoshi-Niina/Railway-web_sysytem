import { createClient } from "@supabase/supabase-js"

// 環境変数の存在チェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Supabaseが設定されている場合のみクライアントを作成
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// サーバーサイド用のクライアント
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Supabase configuration is missing. Using mock mode.')
    return null
  }
  return createClient(supabaseUrl, serviceRoleKey)
}

// Supabaseが利用可能かチェック
export function isSupabaseAvailable() {
  return !!supabase
}

// 環境変数の設定状況をログ出力
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables are not set:')
  console.warn('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.warn('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseKey)
  console.warn('The application will run in mock mode.')
}
