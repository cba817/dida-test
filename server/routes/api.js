/**
 * API 路由 - /api/*
 * 处理诊断提交、线索捕获、案例/文章返回
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// === 数据库路径 ===
const DB_PATH = path.join(__dirname, '..', 'db', 'leads.json');
const CASES = [
  {
    id: 1,
    tag: '企业服务',
    title: '某SaaS企业总部空间升级',
    desc: '通过空间动线设计，将客户参访转化率从12%提升至45%',
    stat: '275%',
    statLabel: '转化提升',
    image: '📊'
  },
  {
    id: 2,
    tag: '零售消费',
    title: '某连锁品牌旗舰店重塑',
    desc: '沉浸式体验空间设计，单店月均客流增长300%',
    stat: '300%',
    statLabel: '客流增长',
    image: '🛍️'
  },
  {
    id: 3,
    tag: 'B2B制造',
    title: '某工业设备企业展厅改造',
    desc: '展厅升级后，大客户签约周期从6个月缩短至45天',
    stat: '75%',
    statLabel: '周期缩短',
    image: '🏭'
  }
];

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
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** 写入 leads 数据库 */
function writeLeads(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// === 路由定义 ===

/** POST /api/diagnose — 提交诊断结果 */
router.post('/diagnose', (req, res) => {
  const { driver, driverId, pains } = req.body;

  if (!driver || !driverId) {
    return res.status(400).json({ message: '缺少诊断数据' });
  }

  // 简单记录到数据库
  const leads = readLeads();
  // 诊断记录不单独存储，关联到线索中
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

/** GET /api/cases — 获取成功案例 */
router.get('/cases', (req, res) => {
  res.json({ success: true, data: CASES });
});

/** GET /api/articles — 获取文章列表 */
router.get('/articles', (req, res) => {
  res.json({ success: true, data: ARTICLES });
});

/** GET /api/health — 健康检查 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

module.exports = router;
