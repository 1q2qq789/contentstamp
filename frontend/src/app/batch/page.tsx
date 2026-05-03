'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function BatchStampPage() {
  const [urls, setUrls] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ url: string; hash: string; status: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults([])

    const urlList = urls
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 50)

    if (urlList.length === 0) {
      setError('请至少输入一个 URL')
      setLoading(false)
      return
    }

    const batchResults: { url: string; hash: string; status: string }[] = []

    for (const url of urlList) {
      try {
        // 用内容本身生成哈希（简化版 — 用 URL + 时间戳模拟）
        const contentForHash = `${url}|${authorName || 'anonymous'}|${Date.now()}`
        const encoder = new TextEncoder()
        const data = encoder.encode(contentForHash)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const contentHash = '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

        // 生成模拟 tx_hash（需要用户用插件实际签名后才有效）
        const mockTxHash = `0x${Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`

        // 记录到后端（实际上链需要通过插件 + MetaMask）
        const res = await fetch('/api/stamps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_hash: contentHash,
            uri: url,
            author_name: authorName || 'anonymous',
            network: 'base',
            tx_hash: mockTxHash,
          }),
        })

        if (res.ok) {
          batchResults.push({ url, hash: contentHash, status: '✅ 已记录' })
        } else {
          const errData = await res.json()
          batchResults.push({ url, hash: contentHash, status: `❌ ${errData.error || '失败'}` })
        }
      } catch (e: any) {
        batchResults.push({ url, hash: '', status: `❌ ${e.message}` })
      }
    }

    setResults(batchResults)
    setLoading(false)
  }

  const successCount = results.filter((r) => r.status.includes('✅')).length

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Dashboard
          </button>
          <span className="text-xl">📦</span>
          <h1 className="text-lg font-semibold">批量存证</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <h2 className="text-base font-semibold mb-4">📝 批量提交内容存证</h2>
          <p className="text-sm text-gray-400 mb-6">
            输入需要存证的 URL 列表（每行一个），系统会自动计算哈希并记录。
            实际链上存证需要通过 Chrome 插件 + MetaMask 签名。
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                作者名称（可选）
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="你的名字或笔名"
                className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-lg 
                           text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                内容 URL 列表（每行一个，最多 50 个）
              </label>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://example.com/article-1&#10;https://example.com/article-2&#10;https://example.com/article-3"
                rows={8}
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg 
                           text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 
                           font-mono text-sm resize-y"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 
                           disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                {loading ? '处理中...' : '开始批量存证'}
              </button>
              <span className="text-xs text-gray-500">
                将生成内容哈希并记录到数据库
              </span>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-sm text-red-400 mb-6">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold">处理结果</h3>
              <span className="text-sm text-gray-400">
                成功 {successCount}/{results.length}
              </span>
            </div>
            <div className="divide-y divide-gray-800">
              {results.map((r, i) => (
                <div key={i} className="px-6 py-3 flex items-start gap-3 text-sm">
                  <span className="shrink-0">{r.status.split(' ')[0]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-gray-300 truncate">{r.url}</div>
                    {r.hash && (
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        {r.hash.slice(0, 20)}...
                      </div>
                    )}
                  </div>
                  <span className="text-xs shrink-0">{r.status.split(' ').slice(1).join(' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
