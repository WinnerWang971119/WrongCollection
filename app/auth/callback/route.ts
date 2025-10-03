import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // 輸出到 terminal
  console.log('\n========================================')
  console.log('🔗 Callback 收到請求:')
  console.log('   URL:', request.url)
  console.log('   token_hash:', token_hash ? `存在 (${token_hash.substring(0, 10)}...)` : '不存在')
  console.log('   token:', token ? `存在 (${token.substring(0, 10)}...)` : '不存在')
  console.log('   code:', code ? `存在 (${code.substring(0, 10)}...)` : '不存在')
  console.log('   type:', type)
  console.log('   next:', next)
  console.log('========================================\n')

  const supabase = await createClient()

  // 優先檢查：Supabase 是否已經在 /auth/v1/verify 處理完驗證
  // 如果是，session 已經存在於 cookies 中
  const { data: sessionData } = await supabase.auth.getSession()
  console.log('🔍 檢查現有 Session:', sessionData.session ? '存在' : '不存在')
  
  if (sessionData.session) {
    console.log('✅ Session 已存在（Supabase 已完成驗證）')
    console.log('   User:', sessionData.session.user.email)
    console.log('   準備跳轉到:', next, '\n')
    return NextResponse.redirect(`${origin}${next}`, { status: 303 })
  }

  // 如果沒有 session，嘗試使用參數驗證

  // 方法 1: PKCE code flow
  if (code) {
    console.log('🔄 使用 PKCE Code Flow...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('📦 exchangeCodeForSession 回應:')
    console.log('   hasSession:', !!data.session)
    console.log('   hasUser:', !!data.user)
    console.log('   error:', error?.message || 'none')
    
    if (!error && data.session) {
      console.log('✅ PKCE 驗證成功，準備跳轉到:', next, '\n')
      return NextResponse.redirect(`${origin}${next}`, { status: 303 })
    }
    
    console.error('❌ PKCE 驗證失敗:', error, '\n')
  }
  
  // 方法 2: Token Hash flow
  if (token_hash && type) {
    console.log('🔄 使用 Token Hash Flow (token_hash)...')
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })

    console.log('📦 verifyOtp 回應:', error?.message || 'success')

    if (!error) {
      console.log('✅ Token Hash 驗證成功，準備跳轉到:', next, '\n')
      return NextResponse.redirect(`${origin}${next}`, { status: 303 })
    }

    console.error('❌ Token Hash 驗證失敗:', error, '\n')
  }

  // 方法 3: Token flow
  if (token && type) {
    console.log('🔄 使用 Token Flow (token)...')
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as any,
    })

    console.log('📦 verifyOtp 回應:', error?.message || 'success')

    if (!error) {
      console.log('✅ Token 驗證成功，準備跳轉到:', next, '\n')
      return NextResponse.redirect(`${origin}${next}`, { status: 303 })
    }

    console.error('❌ Token 驗證失敗:', error, '\n')
  }

  // 所有方法都失敗
  console.error('❌ 所有驗證方式都失敗')
  console.error('   這可能表示：')
  console.error('   1. Token 已過期或無效')
  console.error('   2. Token 已被使用過')
  console.error('   3. Supabase 配置錯誤\n')
  
  return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent('驗證失敗，請重新註冊或聯繫支援')}`, { status: 303 })
}
