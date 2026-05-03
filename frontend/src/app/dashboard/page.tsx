import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 获取用户存证记录
  const { data: stamps } = await supabase
    .from('stamps')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  // 获取用户资料
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <DashboardClient
      user={{
        id: user.id,
        email: user.email || '',
      }}
      profile={profile}
      stamps={stamps || []}
    />
  )
}
