// verify.js - ContentStamp Verifier
// 验证页面逻辑

const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // 待部署后替换
const CONTRACT_ABI = [
  "function stamps(uint256) view returns (address author, bytes32 contentHash, string metadataURI, uint256 timestamp)",
  "function totalStamps() view returns (uint256)",
  "function getStamp(uint256 stampId) view returns (tuple(address,bytes32,string,uint256))",
  "function verify(bytes32 contentHash) view returns (bool exists, uint256 stampId, uint256 timestamp)",
  "function findByHash(bytes32 contentHash) view returns (uint256[] stampIds)"
];

const RPC_URL = "https://sepolia.base.org";
const BLOCK_EXPLORER = "https://sepolia.basescan.org";

let provider;
let contract;

async function initProvider() {
  if (provider) return;
  provider = new ethers.JsonRpcProvider(RPC_URL);
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

// URL 参数自动查询
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const hash = params.get("hash");
  if (hash) {
    document.getElementById("hashInput").value = hash;
    doVerify();
  }
  
  // Enter 键触发查询
  document.getElementById("hashInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") doVerify();
  });
});

async function doVerify() {
  const input = document.getElementById("hashInput").value.trim();
  if (!input) return;

  const loading = document.getElementById("loading");
  const result = document.getElementById("result");
  const empty = document.getElementById("empty");
  const features = document.getElementById("homeFeatures");
  
  loading.style.display = "block";
  result.style.display = "none";
  empty.style.display = "none";
  features.style.display = "none";
  
  try {
    await initProvider();
    
    // 判断输入是 stampId (#123) 还是哈希
    if (input.startsWith("#")) {
      const stampId = parseInt(input.slice(1));
      if (isNaN(stampId)) throw new Error("无效的存证ID");
      await showStampById(stampId);
    } else if (input.startsWith("0x") && input.length === 66) {
      await showStampByHash(input);
    } else {
      throw new Error("请输入有效的存证ID (如 #123) 或内容哈希 (0x...)");
    }
    
  } catch (e) {
    console.error("验证失败:", e);
    empty.style.display = "block";
    document.getElementById("empty").querySelector(".card").innerHTML = `
      <div style="font-size:48px;margin-bottom:12px">❌</div>
      <div style="font-size:16px;color:#888;margin-bottom:8px">查询失败</div>
      <div style="font-size:13px;color:#666">${e.message || "未知错误"}</div>
    `;
  } finally {
    loading.style.display = "none";
  }
}

async function showStampById(stampId) {
  try {
    const stamp = await contract.getStamp(stampId);
    renderStamp(stampId, stamp);
  } catch (e) {
    throw new Error("未找到存证记录 #" + stampId);
  }
}

async function showStampByHash(contentHash) {
  const result_ = await contract.verify(contentHash);
  if (!result_[0]) {
    throw new Error("该内容哈希尚未被存证");
  }
  
  const stampId = Number(result_[1]);
  const stamp = await contract.getStamp(stampId);
  renderStamp(stampId, stamp);
}

function renderStamp(stampId, stamp) {
  const author = stamp[0] || stamp.author;
  const contentHash = stamp[1] || stamp.contentHash;
  const metadataURI = stamp[2] || stamp.metadataURI;
  const timestamp = stamp[3] || stamp.timestamp;

  // 解析元数据
  let metadata = {};
  try {
    metadata = JSON.parse(metadataURI);
  } catch (e) {
    metadata = { raw: metadataURI };
  }

  const timeStr = new Date(Number(timestamp) * 1000).toLocaleString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });

  // 当前时间与存证时间的差距
  const now = Math.floor(Date.now() / 1000);
  const age = now - Number(timestamp);
  let ageStr;
  if (age < 60) ageStr = "刚刚";
  else if (age < 3600) ageStr = `${Math.floor(age/60)} 分钟前`;
  else if (age < 86400) ageStr = `${Math.floor(age/3600)} 小时前`;
  else if (age < 2592000) ageStr = `${Math.floor(age/86400)} 天前`;
  else ageStr = `${Math.floor(age/2592000)} 个月前`;

  // 显示结果
  document.getElementById("result").style.display = "block";
  document.getElementById("empty").style.display = "none";

  document.getElementById("badge").innerHTML = `
    <div class="verified-badge verified">✅ 已验证 · ${ageStr}前存证</div>
  `;

  document.getElementById("resultContent").innerHTML = `
    ${metadata.title ? `
    <div class="result-row">
      <span class="result-label">📄 标题</span>
      <span class="result-value">${escapeHtml(metadata.title)}</span>
    </div>` : ""}
    ${metadata.url ? `
    <div class="result-row">
      <span class="result-label">🔗 链接</span>
      <span class="result-value"><a href="${escapeHtml(metadata.url)}" target="_blank">${escapeHtml(metadata.url.slice(0, 50))}${metadata.url.length > 50 ? "..." : ""}</a></span>
    </div>` : ""}
    <div class="result-row">
      <span class="result-label">🕐 存证时间</span>
      <span class="result-value">${timeStr}</span>
    </div>
    <div class="result-row">
      <span class="result-label">👤 存证者</span>
      <span class="result-value"><a href="${BLOCK_EXPLORER}/address/${author}" target="_blank">${author.slice(0, 10)}...${author.slice(-6)}</a></span>
    </div>
  `;

  document.getElementById("chainInfo").innerHTML = `
    <div class="result-row">
      <span class="result-label">🆔 存证ID</span>
      <span class="result-value">#${stampId}</span>
    </div>
    <div class="result-row">
      <span class="result-label">📦 区块时间</span>
      <span class="result-value">${timestamp}</span>
    </div>
    <div class="result-row">
      <span class="result-label">🔑 内容哈希</span>
      <span class="result-value" style="font-family:monospace;font-size:12px">${contentHash}</span>
    </div>
    <div class="result-row">
      <span class="result-label">⛓️ 区块链</span>
      <span class="result-value">Base</span>
    </div>
    <div class="result-row">
      <span class="result-label">📜 合约地址</span>
      <span class="result-value"><a href="${BLOCK_EXPLORER}/address/${CONTRACT_ADDRESS}" target="_blank" style="font-family:monospace">${CONTRACT_ADDRESS.slice(0, 10)}...${CONTRACT_ADDRESS.slice(-6)}</a></span>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
