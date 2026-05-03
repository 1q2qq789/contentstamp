'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

interface Stamp {
  id: number
  content_hash: string
  uri: string | null
  author_name: string | null
  author_address: string | null
  tx_hash: string | null
  block_number: number | null
  block_timestamp: string | null
  network: string | null
  created_at: string
}

interface Profile {
  id: string
  display_name: string | null
  wallet_address: string | null
  plan: string
  stamp_count: number
  monthly_stamp_limit: number
}

export default function DashboardClient({
  user,
  profile,
  stamps,
}: {
  user: { id: string; email: string }
  profile: Profile | null
  stamps: Stamp[]
}) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const plan = profile?.plan || 'free'
  const limit = profile?.monthly_stamp_limit || 50
  const usage = stamps.length

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔏</span>
            <h1 className="text-lg font-semibold">ContentStamp</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* 用量概览 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">套餐</div>
            <div className="text-xl font-bold capitalize">{plan}</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">本月存证</div>
            <div className="text-xl font-bold">{usage}</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">月配额</div>
            <div className="text-xl font-bold">
              {usage}/{limit}
              <span className="text-sm text-gray-400 ml-1">次</span>
            </div>
          </div>
        </div>

        {/* 存证记录 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">存证记录</h2>

          {stamps.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
              <div className="text-4xl mb-3">📝</div>
              <div className="text-gray-400 mb-2">还没有存证记录</div>
              <p className="text-gray-500 text-sm">
                安装 Chrome 插件后，右键点击任意网页即可存证
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {stamps.map((stamp) => (
                <div
                  key={stamp.id}
                  className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-300 truncate mb-1">
                        {stamp.uri || '未知来源'}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>#{stamp.id}</span>
                        {stamp.network && (
                          <span className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">
                            {stamp.network}
                          </span>
                        )}
                        <span>
                          {stamp.created_at
                            ? new Date(stamp.created_at).toLocaleDateString('zh-CN')
                            : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono shrink-0">
                      {stamp.content_hash.slice(0, 10)}...
                    </div>
                  </div>
                  {stamp.tx_hash && (
                    <div className="mt-2 text-xs text-gray-600 font-mono truncate">
                      Tx: {stamp.tx_hash}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
