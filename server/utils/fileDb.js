/**
 * fileDb.js — JSON 文件读写工具函数
 * 用于管理 server/db/ 目录下的数据文件
 */

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'db');

/** 确保 db 目录存在 */
function ensureDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

/** 读取 JSON 文件，若不存在或解析失败返回默认值 */
function readJSON(filename, defaultVal = null) {
  ensureDir();
  const filePath = path.join(DB_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      return defaultVal;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`[fileDb] 读取 ${filename} 失败:`, e.message);
    return defaultVal;
  }
}

/** 写入 JSON 文件 */
function writeJSON(filename, data) {
  ensureDir();
  const filePath = path.join(DB_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error(`[fileDb] 写入 ${filename} 失败:`, e.message);
    return false;
  }
}

module.exports = { readJSON, writeJSON, ensureDir };
