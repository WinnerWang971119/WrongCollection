import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('🔗 Callback 收到請求:', { code: code ? '存在' : '不存在', next })

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('📦 exchangeCodeForSession 回應:', { 
      hasSession: !!data.session, 
      hasUser: !!data.user,
      error: error?.message 
    })
    
    if (!error) {
      // 確保 session 已同步
      const { data: sessionData } = await supabase.auth.getSession()
      console.log('✅ Session 確認:', { hasSession: !!sessionData.session })
      
      // 驗證成功，使用 303 狀態碼重定向到 dashboard
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      console.log('✅ 準備跳轉到:', next)
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`, { status: 303 })
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`, { status: 303 })
      } else {
        return NextResponse.redirect(`${origin}${next}`, { status: 303 })
      }
    }
    
    console.error('❌ 驗證失敗:', error)
  }

  // 如果驗證失敗，返回錯誤頁面
  console.log('❌ 跳轉到錯誤頁面')
  return NextResponse.redirect(`${origin}/auth/error?message=驗證失敗`, { status: 303 })
}
