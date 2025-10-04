import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardContent from './DashboardContent'

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

  return <DashboardContent userEmail={user.email || ''} />
}
