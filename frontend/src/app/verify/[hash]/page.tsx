'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

interface StampRecord {
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

interface VerifyResult {
  verified: boolean
  message: string
  count: number
  stamps: StampRecord[]
}

export default function VerifyPage({
  params,
}: {
  params: Promise<{ hash: string }>
}) {
  const { hash } = use(params)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!hash) return
    fetchVerify(hash)
  }, [hash])

  async function fetchVerify(hash: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/verify/${hash}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '验证失败')
      } else {
        setResult(data)
      }
    } catch (e: any) {
      setError(e.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  function copyHash(h: string) {
    navigator.clipboard.writeText(h)
  }

  function shortenHash(h: string, len = 16) {
    if (!h) return ''
    return h.length > len * 2 ? `${h.slice(0, len)}...${h.slice(-len)}` : h
  }

  function formatTime(ts: string | null) {
    if (!ts) return '未知'
    return new Date(ts).toLocaleString('zh-CN')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← 首页
          </button>
          <span className="text-xl">🔏</span>
          <h1 className="text-lg font-semibold">内容存证验证</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* 哈希输入 */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
          <label className="block text-sm text-gray-400 mb-2">内容哈希（SHA256）</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={hash || ''}
              onChange={(e) => {
                const val = e.target.value.trim()
                if (val) router.push(`/verify/${val}`)
              }}
              placeholder="0x..."
              className="flex-1 px-4 py-2.5 bg-black border border-gray-800 rounded-lg 
                         text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono text-sm"
            />
            <button
              onClick={() => hash && fetchVerify(hash)}
              disabled={!hash || loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 
                         disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? '验证中...' : '验证'}
            </button>
          </div>
        </div>

        {/* 加载中 */}
        {loading && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-3 animate-pulse">🔍</div>
            正在查询链上数据...
          </div>
        )}

        {/* 错误 */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">❌</div>
            <div className="text-red-400 mb-2">验证失败</div>
            <div className="text-sm text-red-300/70">{error}</div>
          </div>
        )}

        {/* 验证结果 */}
        {result && !loading && (
          <>
            {/* 状态卡片 */}
            <div className={`rounded-xl p-6 mb-6 border ${
              result.verified
                ? 'bg-green-900/10 border-green-800/50'
                : 'bg-yellow-900/10 border-yellow-800/50'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{result.verified ? '✅' : '⚠️'}</span>
                <div>
                  <div className="text-lg font-semibold">
                    {result.verified ? '已存证' : '未找到存证记录'}
                  </div>
                  <div className="text-sm text-gray-400">{result.message}</div>
                </div>
              </div>
              {result.verified && (
                <div className="mt-3 text-sm text-gray-400">
                  共 <span className="text-indigo-400 font-medium">{result.count}</span> 条存证记录
                </div>
              )}
            </div>

            {/* 存证记录列表 */}
            {result.stamps.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold mb-4">存证记录明细</h2>
                {result.stamps.map((stamp, index) => (
                  <div
                    key={stamp.id}
                    className="bg-gray-900 rounded-xl p-5 border border-gray-800"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-400">
                        记录 #{index + 1}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400">
                        {stamp.network || 'base'}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 shrink-0 w-16">哈希</span>
                        <code className="text-indigo-300 font-mono text-xs break-all">
                          {stamp.content_hash}
                        </code>
                        <button
                          onClick={() => copyHash(stamp.content_hash)}
                          className="text-gray-500 hover:text-white shrink-0"
                          title="复制"
                        >
                          📋
                        </button>
                      </div>

                      {stamp.uri && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 shrink-0 w-16">来源</span>
                          <a
                            href={stamp.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 truncate"
                          >
                            {stamp.uri}
                          </a>
                        </div>
                      )}

                      {stamp.author_name && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 shrink-0 w-16">作者</span>
                          <span>{stamp.author_name}</span>
                        </div>
                      )}

                      {stamp.author_address && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 shrink-0 w-16">钱包</span>
                          <code className="text-gray-300 font-mono text-xs">
                            {shortenHash(stamp.author_address, 20)}
                          </code>
                        </div>
                      )}

                      {stamp.tx_hash && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 shrink-0 w-16">交易</span>
                          <code className="text-gray-300 font-mono text-xs break-all">
                            {stamp.tx_hash}
                          </code>
                        </div>
                      )}

                      {stamp.block_number && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 shrink-0 w-16">区块</span>
                          <span>#{stamp.block_number.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 shrink-0 w-16">时间</span>
                        <span>{formatTime(stamp.block_timestamp || stamp.created_at)}</span>
                      </div>
                    </div>

                    {/* 链上验证链接 */}
                    {stamp.tx_hash && stamp.network === 'base' && (
                      <div className="mt-3 pt-3 border-t border-gray-800">
                        <a
                          href={`https://basescan.org/tx/${stamp.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-500 hover:text-indigo-400"
                        >
                          在 BaseScan 上查看交易 →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
