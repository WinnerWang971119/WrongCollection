import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('\n🔒 Middleware 檢查:')
  console.log('   路徑:', request.nextUrl.pathname)
  console.log('   使用者:', user ? `${user.email} (已登入)` : '未登入')

  // 受保護路由：需要登入才能訪問 /dashboard
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('   動作: 未登入訪問 Dashboard → 跳轉到登入頁\n')
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // 已登入用戶訪問登入頁，自動跳轉到 dashboard
  // 但允許訪問驗證相關頁面
  const authPages = ['/auth/login', '/auth/signup']
  const isAuthPage = authPages.some(page => request.nextUrl.pathname === page)
  
  if (user && isAuthPage) {
    console.log('   動作: 已登入訪問登入頁 → 跳轉到 Dashboard\n')
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  console.log('   動作: 允許通過\n')
  return supabaseResponse
}
