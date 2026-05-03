import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔏</span>
            <span className="text-lg font-semibold">ContentStamp</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              登录
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              开始使用
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-3xl mx-auto px-6 text-center py-20">
          <div className="text-6xl mb-6">🔏</div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            链上内容存证
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl mb-8 max-w-xl mx-auto leading-relaxed">
            一键将内容哈希写入区块链，获得
            <br />
            <span className="text-indigo-400">不可篡改的创作时间戳</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-base font-medium transition-colors"
            >
              开始存证 →
            </Link>
            <a
              href="#how"
              className="px-8 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-base font-medium transition-colors"
            >
              了解原理
            </a>
          </div>

          {/* 特点 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-2xl mb-2">⛓️</div>
              <h3 className="font-semibold mb-1">链上存证</h3>
              <p className="text-sm text-gray-400">内容哈希写入区块链，数学证明不可篡改</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold mb-1">一键操作</h3>
              <p className="text-sm text-gray-400">Chrome 插件右键即存，几秒完成上链</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-2xl mb-2">🆓</div>
              <h3 className="font-semibold mb-1">免费开始</h3>
              <p className="text-sm text-gray-400">每月 50 次存证免费，Gas 费仅 ~$0.01</p>
            </div>
          </div>
        </div>
      </main>

      {/* How it works */}
      <section id="how" className="border-t border-gray-800 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10">如何工作</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: '安装插件', desc: '在 Chrome 商店安装 ContentStamp 扩展' },
              { step: '2', title: '连接钱包', desc: '一键连接 MetaMask，自动切换到 Base L2 网络' },
              { step: '3', title: '右键存证', desc: '在任意网页右键 → "存证此页面"，Gas 费 ~$0.01' },
              { step: '4', title: '随时验证', desc: '通过验证页查询存证记录，任何人可独立验证' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
        ContentStamp &copy; 2026 &middot; MIT License
      </footer>
    </div>
  )
}
