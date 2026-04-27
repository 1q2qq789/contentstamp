#!/usr/bin/env node
/**
 * 部署后更新所有文件中的合约地址
 * 用法: node update-address.js 0x你的合约地址
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const newAddress = process.argv[2];

if (!newAddress || !newAddress.startsWith("0x")) {
  console.error("用法: node update-address.js 0x你的合约地址");
  process.exit(1);
}

const files = [
  "extension/popup.js",
  "verify/verify.js",
];

for (const file of files) {
  const path = resolve(__dirname, file);
  let content = readFileSync(path, "utf8");
  const oldPattern = /const CONTRACT_ADDRESS = "0x[0-9a-fA-F]{40}"/;
  const replacement = `const CONTRACT_ADDRESS = "${newAddress}"`;
  
  if (content.match(oldPattern)) {
    content = content.replace(oldPattern, replacement);
    writeFileSync(path, content);
    console.log(`✅ 已更新 ${file}`);
  } else {
    console.log(`⚠️  未找到地址占位符: ${file}`);
  }
}

console.log(`\n📍 合约地址已更新为: ${newAddress}`);
console.log("可以加载 Chrome 插件测试了!");
