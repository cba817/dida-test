/**
 * API 路由 - /api/*
 * 处理诊断提交、线索捕获、案例/站点/套餐/痛点数据返回
 * 数据从 db JSON 文件读取，支持管理后台动态更新
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { readJSON } = require('../utils/fileDb');

// === 数据库路径 ===
const DB_PATH = path.join(__dirname, '..', 'db', 'leads.json');

// 保留硬编码的文章数据（非管理需求，保持现状）
const ARTICLES = [
  {
    id: 1,
    title: '空间增长：为什么"卖空间"比"卖产品"更赚钱？',
    summary: '从商战思维角度解析空间作为销售第一触点的底层逻辑，以及如何通过空间设计重构交易结构。',
    date: '2025-03-15'
  },
  {
    id: 2,
    title: '如何用空间设计降低50%的获客成本？',
    summary: '本文分享了3个真实案例，展示企业如何通过空间体验优化实现获客成本大幅下降。',
    date: '2025-04-02'
  },
  {
    id: 3,
    title: 'B2B企业展厅升级指南：从"好看"到"好卖"',
    summary: '一份帮助企业从空间规划到销售转化的完整实操指南，涵盖动线设计、话术嵌入等关键环节。',
    date: '2025-04-20'
  }
];

// === 辅助函数 ===

/** 读取 leads 数据库 */
function readLeads() {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** 写入 leads 数据库 */
function writeLeads(data) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// === 公开数据API（无需认证，用于前台展示） ===

/** GET /api/site — 获取站点设置 */
router.get('/site', (req, res) => {
  const site = readJSON('site.json', {
    siteName: '空间增长系统',
    siteDescription: '基于《商战思维》方法论，在线诊断您的企业增长破局点。',
    logoPath: '',
    logoText: '空间增长',
    logoAccent: '系统'
  });
  res.json({ success: true, data: site });
});

/** GET /api/pains — 获取全部驱动及其痛点 */
router.get('/pains', (req, res) => {
  const data = readJSON('pains.json', { drivers: [] });
  res.json({ success: true, data });
});

/** GET /api/packages — 获取套餐列表 */
router.get('/packages', (req, res) => {
  const data = readJSON('packages.json', { packages: [] });
  // 按 sortOrder 排序
  data.packages.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json({ success: true, data });
});

/** GET /api/cases — 获取成功案例（从 db 读取） */
router.get('/cases', (req, res) => {
  const data = readJSON('cases.json', { cases: [] });
  // 按 sortOrder 排序
  data.cases.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json({ success: true, data: data.cases });
});

/** GET /api/articles — 获取文章列表（保留硬编码） */
router.get('/articles', (req, res) => {
  res.json({ success: true, data: ARTICLES });
});

// === 诊断 & 线索 ===

/** POST /api/diagnose — 提交诊断结果 */
router.post('/diagnose', (req, res) => {
  const { driver, driverId, pains } = req.body;

  if (!driver || !driverId) {
    return res.status(400).json({ message: '缺少诊断数据' });
  }

  console.log(`[诊断] 驱动=${driver} 痛点=${pains?.join(',') || '无'}`);

  res.json({ success: true, message: '诊断数据已记录' });
});

/** POST /api/lead/submit — 提交客户线索 */
router.post('/lead/submit', (req, res) => {
  const { name, phone, company, note, driver, driverId, pains, selectedPackage, timestamp } = req.body;

  // 基本验证
  if (!name || !phone) {
    return res.status(400).json({ message: '姓名和手机号为必填项' });
  }

  // 手机号格式验证（中国大陆）
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ message: '手机号格式不正确' });
  }

  // 构建线索记录
  const lead = {
    id: Date.now(),
    name,
    phone,
    company: company || '',
    note: note || '',
    driver: driver || '',
    driverId: driverId || '',
    pains: pains || [],
    selectedPackage: selectedPackage || '',
    timestamp: timestamp || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  // 保存到数据库
  const leads = readLeads();
  leads.push(lead);
  writeLeads(leads);

  console.log(`[线索] 新线索: ${name} | ${phone} | ${company || '无公司'}`);

  res.json({ success: true, message: '线索提交成功', leadId: lead.id });
});

/** GET /api/health — 健康检查 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

module.exports = router;
