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

function TimelineChart({ stamps }: { stamps: Stamp[] }) {
  // 按月份分组
  const monthMap: Record<string, number> = {}
  stamps.forEach((s) => {
    const d = new Date(s.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthMap[key] = (monthMap[key] || 0) + 1
  })

  const months = Object.keys(monthMap).sort()
  const maxCount = Math.max(...Object.values(monthMap), 1)
  const chartH = 160
  const chartW = 600
  const barW = Math.max(20, Math.min(60, (chartW - 40) / months.length))

  if (months.length === 0) return null

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h3 className="text-sm font-semibold mb-4">📈 月度存证趋势</h3>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ maxHeight: chartH }}>
        {/* Y 轴网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chartH - 20 - ratio * (chartH - 40)
          return (
            <g key={ratio}>
              <line x1={30} y1={y} x2={chartW - 10} y2={y} stroke="#1f2937" strokeWidth={1} />
              <text x={25} y={y + 4} textAnchor="end" fill="#6b7280" fontSize={10}>
                {Math.round(maxCount * ratio)}
              </text>
            </g>
          )
        })}
        {/* 柱子 */}
        {months.map((m, i) => {
          const count = monthMap[m]
          const barH = ((count / maxCount) * (chartH - 40))
          const x = 35 + i * (barW + 8)
          const y = chartH - 20 - barH
          return (
            <g key={m}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={3}
                fill="url(#barGrad)"
                opacity={0.8}
              />
              <text x={x + barW / 2} y={chartH - 5} textAnchor="middle" fill="#9ca3af" fontSize={9}>
                {m.slice(5)}
              </text>
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fill="#e5e7eb" fontSize={10}>
                {count}
              </text>
            </g>
          )
        })}
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

function NetworkPie({ stamps }: { stamps: Stamp[] }) {
  const networkMap: Record<string, number> = {}
  stamps.forEach((s) => {
    const net = s.network || 'base'
    networkMap[net] = (networkMap[net] || 0) + 1
  })

  const networks = Object.entries(networkMap)
  const total = stamps.length
  if (total === 0) return null

  const colors = ['#6366f1', '#a855f7', '#06b6d4', '#f59e0b', '#10b981']
  const cx = 80, cy = 80, r = 60
  let accAngle = -Math.PI / 2

  function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  function describeArc(startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h3 className="text-sm font-semibold mb-4">🌐 网络分布</h3>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 160 160" className="w-32 h-32 shrink-0">
          {networks.map(([net, count], i) => {
            const angle = (count / total) * 2 * Math.PI
            const startAngle = accAngle
            const endAngle = accAngle + angle
            accAngle = endAngle
            return (
              <path
                key={net}
                d={describeArc(startAngle, endAngle)}
                fill={colors[i % colors.length]}
                opacity={0.8}
              />
            )
          })}
          <circle cx={cx} cy={cy} r={r * 0.5} fill="#111827" />
        </svg>
        <div className="space-y-1.5">
          {networks.map(([net, count], i) => (
            <div key={net} className="flex items-center gap-2 text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="text-gray-300 capitalize">{net}</span>
              <span className="text-gray-500 ml-auto">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
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

  function shortenHash(h: string, len = 10) {
    return h.length > len * 2 ? `${h.slice(0, len)}...${h.slice(-len)}` : h
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔏</span>
            <h1 className="text-lg font-semibold">ContentStamp</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/batch')}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              📦 批量存证
            </button>
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
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">套餐</div>
            <div className="text-xl font-bold capitalize text-indigo-400">{plan}</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">存证总数</div>
            <div className="text-xl font-bold">{usage}</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">月配额</div>
            <div className="text-xl font-bold">
              {usage}/{limit}
              <span className="text-sm text-gray-400 ml-1">次</span>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">使用率</div>
            <div className="text-xl font-bold">
              {limit > 0 ? Math.round((usage / limit) * 100) : 0}%
            </div>
            {/* 进度条 */}
            <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${Math.min((usage / limit) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 统计图表 */}
        {stamps.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <TimelineChart stamps={stamps} />
            <NetworkPie stamps={stamps} />
          </div>
        )}

        {/* 存证记录 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">存证记录</h2>
            {stamps.length > 0 && (
              <span className="text-sm text-gray-500">{stamps.length} 条记录</span>
            )}
          </div>

          {stamps.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
              <div className="text-4xl mb-3">📝</div>
              <div className="text-gray-400 mb-2">还没有存证记录</div>
              <p className="text-gray-500 text-sm mb-4">
                安装 Chrome 插件后，右键点击任意网页即可存证
              </p>
              <button
                onClick={() => router.push('/batch')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm"
              >
                去批量存证 →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {stamps.map((stamp) => (
                <div
                  key={stamp.id}
                  className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
                  onClick={() => router.push(`/verify/${stamp.content_hash}`)}
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
                      {shortenHash(stamp.content_hash)}
                    </div>
                  </div>
                  {stamp.tx_hash && (
                    <div className="mt-2 text-xs text-gray-600 font-mono truncate">
                      Tx: {shortenHash(stamp.tx_hash, 16)}
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
