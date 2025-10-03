import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <div className="p-1 bg-gradient-to-br from-green-400 via-blue-400 to-purple-500 rounded-lg shadow-xl">
          <Card className="w-full shadow-none border-0 bg-white">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-blue-900">
                ✉️ 請驗證您的 Email
              </CardTitle>
              <CardDescription className="text-gray-600">
                註冊成功！請查看您的電子郵件
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-900 font-semibold mb-2">
                  📧 我們已發送驗證郵件到您的信箱
                </p>
                <p className="text-sm text-gray-600">
                  請點擊郵件中的驗證連結以完成註冊
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">接下來的步驟：</p>
                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-2">
                  <li>打開您的電子郵件收件箱</li>
                  <li>找到來自 Supabase 的驗證郵件</li>
                  <li>點擊「確認您的郵件地址」按鈕</li>
                  <li>驗證完成後，返回登入</li>
                </ol>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-800">
                  💡 提示：如果沒有收到郵件，請檢查垃圾郵件資料夾
                </p>
              </div>

              <div className="pt-4">
                <Link href="/auth/login">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    前往登入頁面
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
