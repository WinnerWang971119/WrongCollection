import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LogoutButton from './LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 取得當前使用者
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 如果沒有使用者（理論上不會發生，因為 middleware 會攔截）
  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      {/* 頂部導航列 */}
      <nav className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-900">錯題收集</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {/* 歡迎卡片 */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-3xl text-blue-900">
                歡迎回來！👋
              </CardTitle>
              <CardDescription className="text-lg">
                您已成功登入錯題收集系統
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  <span className="font-semibold">帳號：</span>
                  {user.email}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">使用者 ID：</span>
                  {user.id}
                </p>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    ✅ 認證系統測試成功！
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    接下來將開發資料夾管理和錯題管理功能...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 功能預覽卡片 */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-900">📁 資料夾管理</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  支援最多 4 層的階層結構，輕鬆組織您的錯題
                </p>
                <p className="text-xs text-gray-400 mt-2">即將推出</p>
              </CardContent>
            </Card>

            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-900">📝 錯題記錄</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  詳細記錄題目、答案、詳解，支援圖片上傳
                </p>
                <p className="text-xs text-gray-400 mt-2">即將推出</p>
              </CardContent>
            </Card>

            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-900">🎯 智能練習</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  根據錯誤次數和複習時間，智能推薦練習題目
                </p>
                <p className="text-xs text-gray-400 mt-2">即將推出</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
