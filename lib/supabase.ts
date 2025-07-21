import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Supabaseクライアントの作成
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and key are required')
  }

  return createSupabaseClient(supabaseUrl, supabaseKey)
}

// サービスロールキーを使用したクライアントの作成
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL and service role key are required')
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey)
}

// サーバーサイド用のクライアント
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and key are required')
  }

  return createSupabaseClient(supabaseUrl, supabaseKey)
}
