import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { message?: string }
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <div className="p-1 bg-gradient-to-br from-red-400 via-orange-400 to-pink-500 rounded-lg shadow-xl">
          <Card className="w-full shadow-none border-0 bg-white">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-red-900">驗證錯誤</CardTitle>
              <CardDescription className="text-gray-600">
                {searchParams.message || '發生未知錯誤'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  ⚠️ Email 驗證過程中發生問題
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">可能的原因：</p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>驗證連結已過期</li>
                  <li>驗證連結已被使用</li>
                  <li>驗證連結無效</li>
                </ul>
              </div>

              <div className="pt-4 space-y-2">
                <Link href="/auth/signup" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    重新註冊
                  </Button>
                </Link>
                <Link href="/auth/login" className="block">
                  <Button variant="outline" className="w-full">
                    返回登入
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
