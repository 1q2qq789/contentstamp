// background.js - ContentStamp Service Worker
// 处理右键菜单、钱包连接、存证操作

// 合约配置（部署后通过 update-address.js 更新）
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
const NETWORK = {
  chainId: "0x14A34",
  chainName: "Base Sepolia",
  rpcUrl: "https://sepolia.base.org",
  blockExplorer: "https://sepolia.basescan.org",
};

// ─── 右键菜单 ───
chrome.runtime.onInstalled.addListener(() => {
  // 页面右键菜单
  chrome.contextMenus.create({
    id: "stamp-page",
    title: "🔏 存证当前页面到 ContentStamp",
    contexts: ["page"],
  });
  // 选中文字右键菜单
  chrome.contextMenus.create({
    id: "stamp-selection",
    title: "🔏 存证选中文字到 ContentStamp",
    contexts: ["selection"],
  });
  // 链接右键菜单
  chrome.contextMenus.create({
    id: "stamp-link",
    title: "🔏 存证链接内容到 ContentStamp",
    contexts: ["link"],
  });
  // 图片右键菜单
  chrome.contextMenus.create({
    id: "stamp-image",
    title: "🔏 存证图片到 ContentStamp",
    contexts: ["image"],
  });
  
  console.log("✅ ContentStamp 右键菜单已就绪");
});

// ─── 处理右键菜单点击 ───
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;
  
  let content = null;
  
  switch (info.menuItemId) {
    case "stamp-page":
      // 获取页面内容
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: "getPageContent" });
        content = {
          type: "webpage",
          title: response.title,
          url: tab.url,
          text: response.text?.substring(0, 1000) || "",
          timestamp: new Date().toISOString(),
        };
      } catch (e) {
        content = {
          type: "webpage",
          title: tab.title || "",
          url: tab.url || "",
          text: "",
          timestamp: new Date().toISOString(),
        };
      }
      break;
      
    case "stamp-selection":
      content = {
        type: "text_selection",
        title: "选中文字存证",
        url: tab.url,
        text: info.selectionText?.substring(0, 2000) || "",
        timestamp: new Date().toISOString(),
      };
      break;
      
    case "stamp-link":
      content = {
        type: "link",
        title: "链接存证",
        url: info.linkUrl || "",
        text: `Link: ${info.linkUrl}`,
        timestamp: new Date().toISOString(),
      };
      break;
      
    case "stamp-image":
      content = {
        type: "image",
        title: "图片存证",
        url: info.srcUrl || tab.url,
        text: `Image URL: ${info.srcUrl}`,
        timestamp: new Date().toISOString(),
      };
      break;
  }
  
  if (!content) return;
  
  // 存储待存证内容，让 popup 处理
  await chrome.storage.local.set({ pendingStamp: content });
  
  // 提示用户打开插件完成存证
  chrome.action.setBadgeText({ text: "!", tabId: tab.id });
  chrome.action.setBadgeBackgroundColor({ color: "#6366f1", tabId: tab.id });
  
  // 发送通知
  chrome.notifications?.create?.({
    type: "basic",
    iconUrl: "icons/icon48.png",
    title: "ContentStamp",
    message: "内容已准备就绪，点击插件图标完成上链存证",
  });
});

// ─── 监听 popup 请求获取待存证内容 ───
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPendingStamp") {
    chrome.storage.local.get("pendingStamp", (result) => {
      sendResponse(result.pendingStamp || null);
      chrome.storage.local.remove("pendingStamp");
      // 清除 badge
      if (sender.tab) {
        chrome.action.setBadgeText({ text: "", tabId: sender.tab.id });
      }
    });
    return true; // 异步响应
  }
});
