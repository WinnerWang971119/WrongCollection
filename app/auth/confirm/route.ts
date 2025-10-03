import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('\n========================================')
  console.log('🔗 Email 驗證請求 (/auth/confirm):')
  console.log('   URL:', request.url)
  console.log('   token_hash:', token_hash ? `存在 (${token_hash.substring(0, 15)}...)` : '不存在')
  console.log('   type:', type)
  console.log('   next:', next)
  console.log('========================================\n')

  if (!token_hash || !type) {
    console.error('❌ 缺少必要參數 token_hash 或 type\n')
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent('驗證連結無效，缺少必要參數')}`,
      { status: 303 }
    )
  }

  const supabase = await createClient()

  console.log('🔄 開始驗證 Email token...')

  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as any,
  })

  if (error) {
    console.error('❌ Email 驗證失敗:')
    console.error('   錯誤訊息:', error.message)
    console.error('   錯誤代碼:', error.status, '\n')

    let errorMessage = '驗證失敗'
    if (error.message.includes('expired')) {
      errorMessage = '驗證連結已過期，請重新註冊'
    } else if (error.message.includes('invalid')) {
      errorMessage = '驗證連結無效或已使用'
    }

    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(errorMessage)}`,
      { status: 303 }
    )
  }

  // 驗證成功，檢查 session
  const { data: sessionData } = await supabase.auth.getSession()
  
  console.log('✅ Email 驗證成功！')
  console.log('   Session:', sessionData.session ? '已建立' : '未建立（可能需要重新登入）')
  console.log('   User:', sessionData.session?.user.email || 'unknown')
  console.log('   準備跳轉到:', next, '\n')

  // 跳轉到目標頁面
  return NextResponse.redirect(`${origin}${next}`, { status: 303 })
}
