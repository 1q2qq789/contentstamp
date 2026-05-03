// popup.js - ContentStamp Chrome Extension
// 链上内容存证的核心逻辑

// ─── 配置 ───
// ⚠️ 合约部署后替换这里
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // 待部署后更新
const CONTRACT_ABI = [
  "function stamp(bytes32 contentHash, string metadataURI) returns (uint256)",
  "function totalStamps() view returns (uint256)",
  "function getStamp(uint256 stampId) view returns (tuple(address,bytes32,string,uint256))",
  "function verify(bytes32 contentHash) view returns (bool,uint256,uint256)",
  "event ContentStamped(uint256 indexed stampId, address indexed author, bytes32 indexed contentHash, string metadataURI, uint256 timestamp)"
];
const NETWORK = {
  chainId: "0x14A34", // Base Sepolia: 84532
  chainName: "Base Sepolia",
  rpcUrl: "https://sepolia.base.org",
  blockExplorer: "https://sepolia.basescan.org",
};
const VERIFY_PAGE_URL = "https://contentstamp.vercel.app"; // 验证页地址
const API_BASE_URL = "https://contentstamp.vercel.app"; // 后端 API 地址

let provider = null;
let signer = null;
let contract = null;
let currentPageContent = null;

// ─── DOM 元素 ───
const noWallet = document.getElementById("noWallet");
const walletInfo = document.getElementById("walletInfo");
const walletAddress = document.getElementById("walletAddress");
const connectBtn = document.getElementById("connectBtn");
const stampBtn = document.getElementById("stampBtn");
const verifyBtn = document.getElementById("verifyBtn");
const statusArea = document.getElementById("statusArea");
const stampHistory = document.getElementById("stampHistory");
const pageTitle = document.getElementById("pageTitle");
const pageUrl = document.getElementById("pageUrl");

// ─── 初始化 ───
document.addEventListener("DOMContentLoaded", async () => {
  // 获取当前页面内容
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      pageTitle.textContent = tab.title || "无标题";
      pageUrl.textContent = tab.url || "";
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: "getPageContent" });
    currentPageContent = response;
    pageTitle.textContent = response.title || "无标题";
    pageUrl.textContent = response.url || "";
  } catch (e) {
    pageTitle.textContent = "无法获取页面内容";
    pageUrl.textContent = "请刷新后重试";
    console.error("获取页面内容失败:", e);
  }

  // 检查是否有右键菜单触发的待存证内容
  try {
    const pending = await chrome.runtime.sendMessage({ action: "getPendingStamp" });
    if (pending) {
      currentPageContent = {
        title: pending.title,
        url: pending.url,
        text: pending.text,
        timestamp: pending.timestamp,
        type: pending.type,
      };
      pageTitle.textContent = `🔏 ${pending.title || "右键存证"}`;
      pageUrl.textContent = pending.url || "";
      showStatus("📋 右键菜单内容已加载，请连接钱包完成存证", "info");
      // 自动触发存证（如果已连接钱包）
      if (contract) {
        setTimeout(() => doStamp(), 500);
      }
    }
  } catch (e) {
    // 没有待处理内容，正常流程
  }

  // 检查钱包
  if (typeof window.ethereum !== "undefined") {
    await checkWallet();
  } else {
    noWallet.style.display = "block";
    noWallet.querySelector(".no-wallet").innerHTML = `
      <div style="font-size:24px;margin-bottom:8px">🦊</div>
      <div style="font-size:13px;margin-bottom:12px">请安装 MetaMask 钱包</div>
      <a href="https://metamask.io" target="_blank" style="color:#818cf8;font-size:12px">下载 MetaMask →</a>
    `;
  }
});

connectBtn.addEventListener("click", connectWallet);

stampBtn.addEventListener("click", async () => {
  if (!contract || !currentPageContent) return;
  await doStamp();
});

verifyBtn.addEventListener("click", () => {
  const lastStamp = getLastStamp();
  if (lastStamp) {
    window.open(`${VERIFY_PAGE_URL}?hash=${lastStamp.hash}`, "_blank");
  }
});

// ─── 钱包连接 ───
async function checkWallet() {
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      await setupProvider(accounts[0]);
    } else {
      noWallet.style.display = "block";
      walletInfo.style.display = "none";
    }
    stampBtn.disabled = !contract;
  } catch (e) {
    console.error("检查钱包失败:", e);
  }
}

async function connectWallet() {
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    await setupProvider(accounts[0]);
    // 切换到 Base Sepolia
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORK.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [NETWORK],
        });
      }
    }
  } catch (e) {
    showStatus(`连接失败: ${e.message}`, "error");
  }
}

async function setupProvider(account) {
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  
  noWallet.style.display = "none";
  walletInfo.style.display = "block";
  walletAddress.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
  
  try {
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    stampBtn.disabled = false;
    showStatus("✅ 钱包已连接，可以存证了", "info");
  } catch (e) {
    showStatus("合约未部署，请先部署合约", "error");
  }

  // 加载历史
  loadHistory();
}

// ─── 核心存证逻辑 ───
async function doStamp() {
  if (!currentPageContent || !currentPageContent.text) {
    showStatus("❌ 无法获取页面内容", "error");
    return;
  }

  stampBtn.disabled = true;
  stampBtn.textContent = "⏳ 正在上链...";

  try {
    // 1. 计算内容哈希
    const contentString = JSON.stringify({
      title: currentPageContent.title,
      url: currentPageContent.url,
      text: currentPageContent.text.substring(0, 1000), // 存前1000字摘要
      timestamp: currentPageContent.timestamp,
    });
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(contentString));

    // 2. 构建元数据
    const metadata = JSON.stringify({
      title: currentPageContent.title,
      url: currentPageContent.url,
      description: currentPageContent.description,
      contentType: "webpage",
    });

    // 3. 调用合约
    showStatus("⏳ 请在 MetaMask 中确认交易...", "info");
    const tx = await contract.stamp(contentHash, metadata);
    showStatus("⏳ 交易已提交，等待确认...", "info");
    
    const receipt = await tx.wait();
    
    // 4. 解析事件获取 stampId
    let stampId = "?";
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog({ topics: [...log.topics], data: log.data });
        if (parsed && parsed.name === "ContentStamped") {
          stampId = parsed.args.stampId.toString();
          break;
        }
      } catch (e) {}
    }

    // 5. 获取钱包地址
    const walletAddr = await signer.getAddress();

    // 6. 保存记录
    const record = {
      stampId,
      contentHash,
      hash: contentHash,
      title: currentPageContent.title,
      url: currentPageContent.url,
      txHash: tx.hash,
      timestamp: Date.now(),
      blockNumber: receipt.blockNumber,
      authorAddress: walletAddr,
    };
    saveStamp(record);
    addStampItem(record);

    // 同步到后端 API
    syncStampToBackend(record);

    showStatus(`✅ 存证成功! ID: #${stampId}`, "success");
    showResult(record);
    verifyBtn.style.display = "block";

  } catch (e) {
    console.error("存证失败:", e);
    let msg = e.message || "未知错误";
    if (msg.includes("user rejected")) msg = "用户取消了交易";
    else if (msg.length > 80) msg = msg.slice(0, 80) + "...";
    showStatus(`❌ ${msg}`, "error");
  } finally {
    stampBtn.disabled = false;
    stampBtn.textContent = "🔏 存证当前页面";
  }
}

// ─── UI 辅助 ───
function showStatus(msg, type) {
  statusArea.innerHTML = `<div class="status status-${type}">${msg}</div>`;
  setTimeout(() => { if (statusArea.textContent === msg) statusArea.innerHTML = ""; }, 5000);
}

function showResult(record) {
  const div = document.createElement("div");
  div.className = "result-box";
  div.innerHTML = `
    <div style="margin-bottom:6px">📍 存证ID: #${record.stampId}</div>
    <div style="margin-bottom:4px;color:#666">🔗 Tx: ${record.txHash.slice(0, 12)}...${record.txHash.slice(-8)}</div>
    <div style="margin-bottom:4px;color:#666">📦 Block: ${record.blockNumber}</div>
    <div style="color:#666;font-size:10px">🔍 Hash: ${record.hash.slice(0, 20)}...</div>
  `;
  statusArea.appendChild(div);
}

// ─── API 同步（将存证记录发送到后端）───
async function syncStampToBackend(record) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stamps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content_hash: record.contentHash,
        uri: record.url,
        author_name: record.authorName || "",
        author_address: record.authorAddress || "",
        tx_hash: record.txHash,
        block_number: record.blockNumber,
        block_timestamp: new Date(record.timestamp).toISOString(),
        network: "base-sepolia",
      }),
    });
    if (!response.ok) {
      console.warn("后同步到后端失败:", await response.text());
    } else {
      console.log("✅ 存证记录已同步到后端");
    }
  } catch (e) {
    console.warn("后端同步失败（开发环境可能未启动）:", e.message);
  }
}

// ─── 本地存储 ───
function saveStamp(record) {
  const stamps = JSON.parse(localStorage.getItem("contentstamp_records") || "[]");
  stamps.unshift(record);
  localStorage.setItem("contentstamp_records", JSON.stringify(stamps.slice(0, 50)));
}

function getLastStamp() {
  const stamps = JSON.parse(localStorage.getItem("contentstamp_records") || "[]");
  return stamps.length > 0 ? stamps[0] : null;
}

function loadHistory() {
  const stamps = JSON.parse(localStorage.getItem("contentstamp_records") || "[]");
  if (stamps.length === 0) return;
  
  stampHistory.innerHTML = "";
  stamps.slice(0, 10).forEach(record => {
    addStampItem(record);
  });
}

function addStampItem(record) {
  const div = document.createElement("div");
  div.className = "stamp-item";
  const time = new Date(record.timestamp).toLocaleString("zh-CN");
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between">
      <span>#${record.stampId}</span>
      <span class="time">${time}</span>
    </div>
    <div style="font-size:11px;margin-top:2px">${record.title?.slice(0, 30) || ""}</div>
    <div class="hash">${record.hash?.slice(0, 16)}...</div>
  `;
  div.onclick = () => {
    if (record.hash) {
      window.open(`${VERIFY_PAGE_URL}?hash=${record.hash}`, "_blank");
    }
  };
  stampHistory.insertBefore(div, stampHistory.firstChild);
}
