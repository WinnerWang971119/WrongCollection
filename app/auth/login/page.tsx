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
import { supabase } from '@/lib/supabase/client'

// 表單驗證 Schema
const loginSchema = z.object({
  email: z.string().email('請輸入有效的 Email 地址'),
  password: z.string().min(6, '密碼至少需要 6 個字元'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        // 處理不同類型的錯誤
        if (authError.message.includes('Invalid login credentials')) {
          setError('Email 或密碼錯誤')
        } else if (authError.message.includes('Email not confirmed')) {
          setError('請先驗證您的 Email')
        } else {
          setError(authError.message || '登入失敗，請稍後再試')
        }
        return
      }

      // 登入成功，跳轉到 Dashboard
      router.push('/dashboard')
      router.refresh() // 刷新以更新認證狀態
    } catch (err) {
      console.error('登入錯誤:', err)
      setError('發生未知錯誤，請稍後再試')
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
          <CardTitle className="text-3xl font-bold text-blue-900">登入</CardTitle>
          <CardDescription className="text-gray-600">
            使用您的帳號登入錯題收集系統
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
                        placeholder="請輸入密碼"
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
                {isLoading ? '登入中...' : '登入'}
              </Button>

              <div className="text-center text-sm text-gray-600 pt-2">
                還沒有帳號？{' '}
                <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
                  立即註冊
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
