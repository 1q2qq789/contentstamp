// content.js - ContentStamp
// 在页面中提取内容，响应 popup 的请求

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    const content = {
      title: document.title,
      url: window.location.href,
      // 提取正文文本（优先 article/main，否则 body）
      text: (() => {
        const article = document.querySelector("article") || document.querySelector("main") || document.body;
        return article.innerText.substring(0, 5000); // 限制长度
      })(),
      // 提取 meta description
      description: (() => {
        const meta = document.querySelector('meta[name="description"]');
        return meta ? meta.getAttribute("content") : "";
      })(),
      // 提取 Open Graph 信息
      ogImage: (() => {
        const meta = document.querySelector('meta[property="og:image"]');
        return meta ? meta.getAttribute("content") : "";
      })(),
      timestamp: new Date().toISOString(),
    };
    sendResponse(content);
  }
  return true; // 异步响应
});
