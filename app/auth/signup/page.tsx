'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

// 表單驗證 Schema - 新增確認密碼驗證
const signupSchema = z.object({
  email: z.string().email('請輸入有效的 Email 地址'),
  password: z.string().min(6, '密碼至少需要 6 個字元'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '密碼不一致',
  path: ['confirmPassword'],
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Task 4 - 整合 Supabase Auth
      console.log('註冊資料:', data)
      
      // 模擬 API 呼叫
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 成功後跳轉（Task 4 會實作真實邏輯）
      // router.push('/dashboard')
      
      setError('此功能將在 Task 4 實作')
    } catch (err) {
      setError('註冊失敗，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <div className="p-1 bg-gradient-to-br from-purple-400 via-blue-400 to-indigo-500 rounded-lg shadow-xl">
          <Card className="w-full shadow-none border-0 bg-white">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-3xl font-bold text-blue-900">註冊</CardTitle>
              <CardDescription className="text-gray-600">
                建立新帳號開始使用錯題收集系統
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-900">Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="example@email.com"
                            type="email"
                            disabled={isLoading}
                            className="border-blue-200 focus:border-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-900">密碼</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="至少 6 個字元"
                            type="password"
                            disabled={isLoading}
                            className="border-blue-200 focus:border-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-900">確認密碼</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="再次輸入密碼"
                            type="password"
                            disabled={isLoading}
                            className="border-blue-200 focus:border-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? '註冊中...' : '註冊'}
                  </Button>

                  <div className="text-center text-sm text-gray-600 pt-2">
                    已有帳號？{' '}
                    <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                      前往登入
                    </Link>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
