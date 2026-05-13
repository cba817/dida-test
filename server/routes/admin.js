/**
 * admin.js — 管理后台 API 路由
 * 需 JWT 认证
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const auth = require('../middleware/auth');
const { readJSON, writeJSON } = require('../utils/fileDb');

// =============================================
// multer 文件上传配置
// =============================================

const uploadDir = config.upload.dir;
// 确保上传目录存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
['logo', 'cases'].forEach(sub => {
  const subDir = path.join(uploadDir, sub);
  if (!fs.existsSync(subDir)) {
    fs.mkdirSync(subDir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'cases';
    if (file.fieldname === 'logo') subDir = 'logo';
    else if (file.fieldname === 'image' || file.fieldname === 'images') subDir = 'cases';
    cb(null, path.join(uploadDir, subDir));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${file.fieldname}_${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型，请上传 JPEG/PNG/GIF/WebP 格式'));
    }
  }
});

// =============================================
// 认证
// =============================================

/** POST /api/admin/login — 登录 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: '请输入用户名和密码' });
  }
  if (username === config.admin.username && password === config.admin.password) {
    const token = jwt.sign({ username }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    return res.json({ success: true, token });
  }
  return res.status(401).json({ message: '用户名或密码错误' });
});

/** GET /api/admin/check — 验证 token */
router.get('/check', auth, (req, res) => {
  res.json({ success: true, username: req.admin.username });
});

// =============================================
// 站点设置（需认证）
// =============================================

/** GET /api/admin/site — 获取站点设置 */
router.get('/site', auth, (req, res) => {
  const site = readJSON('site.json', {});
  res.json({ success: true, data: site });
});

/** PUT /api/admin/site — 更新站点设置 */
router.put('/site', auth, (req, res) => {
  const { siteName, siteDescription, logoText, logoAccent } = req.body;
  const site = readJSON('site.json', {});
  if (siteName !== undefined) site.siteName = siteName;
  if (siteDescription !== undefined) site.siteDescription = siteDescription;
  if (logoText !== undefined) site.logoText = logoText;
  if (logoAccent !== undefined) site.logoAccent = logoAccent;
  site.updatedAt = new Date().toISOString();
  writeJSON('site.json', site);
  res.json({ success: true, data: site });
});

/** POST /api/admin/site/logo — 上传 Logo */
router.post('/site/logo', auth, upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '请选择要上传的图片' });
  }
  const site = readJSON('site.json', {});
  const logoPath = '/uploads/logo/' + req.file.filename;
  site.logoPath = logoPath;
  site.updatedAt = new Date().toISOString();
  writeJSON('site.json', site);
  res.json({ success: true, data: { logoPath } });
}, (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小不能超过 5MB' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

// =============================================
// 痛点管理（需认证）
// =============================================

/** GET /api/admin/pains — 获取全部驱动+痛点 */
router.get('/pains', auth, (req, res) => {
  const data = readJSON('pains.json', { drivers: [] });
  res.json({ success: true, data });
});

/** POST /api/admin/pains — 新增痛点 */
router.post('/pains', auth, (req, res) => {
  const { driverId, text } = req.body;
  if (!driverId || !text) {
    return res.status(400).json({ message: '缺少参数：driverId 和 text 为必填' });
  }
  const data = readJSON('pains.json', { drivers: [] });
  const driver = data.drivers.find(d => d.id === driverId);
  if (!driver) {
    return res.status(404).json({ message: `驱动类型 ${driverId} 不存在` });
  }
  // 生成新 ID
  const prefixMap = { PRODUCT: 'p1', CHANNEL: 'p2', USER: 'p3' };
  const prefix = prefixMap[driverId] || 'p0';
  let maxNum = 0;
  driver.pains.forEach(p => {
    const match = p.id.match(/_(\d+)$/);
    if (match) {
      const num = parseInt(match[1]);
      if (num > maxNum) maxNum = num;
    }
  });
  const newId = `${prefix}_${maxNum + 1}`;
  const newPain = { id: newId, text };
  driver.pains.push(newPain);
  writeJSON('pains.json', data);
  res.json({ success: true, data: newPain });
});

/** PUT /api/admin/pains/:painId — 编辑痛点 */
router.put('/pains/:painId', auth, (req, res) => {
  const { painId } = req.params;
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ message: '请提供痛点内容 text' });
  }
  const data = readJSON('pains.json', { drivers: [] });
  let found = false;
  for (const driver of data.drivers) {
    const pain = driver.pains.find(p => p.id === painId);
    if (pain) {
      pain.text = text;
      found = true;
      break;
    }
  }
  if (!found) {
    return res.status(404).json({ message: '痛点不存在' });
  }
  writeJSON('pains.json', data);
  res.json({ success: true, message: '更新成功' });
});

/** DELETE /api/admin/pains/:painId — 删除痛点 */
router.delete('/pains/:painId', auth, (req, res) => {
  const { painId } = req.params;
  const data = readJSON('pains.json', { drivers: [] });
  let found = false;
  for (const driver of data.drivers) {
    const idx = driver.pains.findIndex(p => p.id === painId);
    if (idx > -1) {
      driver.pains.splice(idx, 1);
      found = true;
      break;
    }
  }
  if (!found) {
    return res.status(404).json({ message: '痛点不存在' });
  }
  writeJSON('pains.json', data);
  res.json({ success: true, message: '删除成功' });
});

// =============================================
// 套餐管理（需认证）
// =============================================

/** GET /api/admin/packages — 获取全部套餐 */
router.get('/packages', auth, (req, res) => {
  const data = readJSON('packages.json', { packages: [] });
  res.json({ success: true, data });
});

/** POST /api/admin/packages — 新增套餐 */
router.post('/packages', auth, (req, res) => {
  const { title, icon, price, priceNote, featuredThreshold, resultTitle, resultItems, features } = req.body;
  if (!title || !price) {
    return res.status(400).json({ message: '标题和价格为必填项' });
  }
  const data = readJSON('packages.json', { packages: [] });
  const newId = 'pkg_' + Date.now();
  const maxOrder = data.packages.reduce((max, p) => Math.max(max, p.sortOrder || 0), 0);
  const newPkg = {
    id: newId,
    title: title || '',
    icon: icon || '📦',
    price: price || '¥0',
    priceNote: priceNote || '',
    featuredThreshold: featuredThreshold || { minPains: 1, maxPains: 99 },
    resultTitle: resultTitle || '交付结果',
    resultItems: resultItems || [],
    features: features || [],
    sortOrder: maxOrder + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.packages.push(newPkg);
  writeJSON('packages.json', data);
  res.json({ success: true, data: newPkg });
});

/** PUT /api/admin/packages/:pkgId — 编辑套餐 */
router.put('/packages/:pkgId', auth, (req, res) => {
  const { pkgId } = req.params;
  const data = readJSON('packages.json', { packages: [] });
  const pkg = data.packages.find(p => p.id === pkgId);
  if (!pkg) {
    return res.status(404).json({ message: '套餐不存在' });
  }
  // 只更新提供的字段
  const updatable = ['title', 'icon', 'price', 'priceNote', 'featuredThreshold', 'resultTitle', 'resultItems', 'features', 'sortOrder'];
  updatable.forEach(key => {
    if (req.body[key] !== undefined) {
      pkg[key] = req.body[key];
    }
  });
  pkg.updatedAt = new Date().toISOString();
  writeJSON('packages.json', data);
  res.json({ success: true, data: pkg });
});

/** DELETE /api/admin/packages/:pkgId — 删除套餐 */
router.delete('/packages/:pkgId', auth, (req, res) => {
  const { pkgId } = req.params;
  const data = readJSON('packages.json', { packages: [] });
  const idx = data.packages.findIndex(p => p.id === pkgId);
  if (idx === -1) {
    return res.status(404).json({ message: '套餐不存在' });
  }
  data.packages.splice(idx, 1);
  writeJSON('packages.json', data);
  res.json({ success: true, message: '删除成功' });
});

// =============================================
// 案例管理（需认证）
// =============================================

/** GET /api/admin/cases — 获取全部案例 */
router.get('/cases', auth, (req, res) => {
  const data = readJSON('cases.json', { cases: [] });
  res.json({ success: true, data });
});

/** POST /api/admin/cases — 新增案例 */
router.post('/cases', auth, (req, res) => {
  const { tag, title, desc, description, stat, statLabel, imageEmoji } = req.body;
  if (!title || !tag) {
    return res.status(400).json({ message: '标题和标签为必填项' });
  }
  const data = readJSON('cases.json', { cases: [] });
  const maxId = data.cases.reduce((max, c) => Math.max(max, c.id || 0), 0);
  const maxOrder = data.cases.reduce((max, c) => Math.max(max, c.sortOrder || 0), 0);
  const newCase = {
    id: maxId + 1,
    tag: tag || '',
    title: title || '',
    desc: desc || '',
    description: description || '',
    stat: stat || '',
    statLabel: statLabel || '',
    imagePath: '',
    imageEmoji: imageEmoji || '📊',
    images: [],
    sortOrder: maxOrder + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.cases.push(newCase);
  writeJSON('cases.json', data);
  res.json({ success: true, data: newCase });
});

/** PUT /api/admin/cases/:caseId — 编辑案例 */
router.put('/cases/:caseId', auth, (req, res) => {
  const { caseId } = req.params;
  const id = parseInt(caseId);
  const data = readJSON('cases.json', { cases: [] });
  const c = data.cases.find(item => item.id === id);
  if (!c) {
    return res.status(404).json({ message: '案例不存在' });
  }
  const updatable = ['tag', 'title', 'desc', 'description', 'stat', 'statLabel', 'imageEmoji', 'sortOrder'];
  updatable.forEach(key => {
    if (req.body[key] !== undefined) {
      c[key] = req.body[key];
    }
  });
  c.updatedAt = new Date().toISOString();
  writeJSON('cases.json', data);
  res.json({ success: true, data: c });
});

/** DELETE /api/admin/cases/:caseId — 删除案例 */
router.delete('/cases/:caseId', auth, (req, res) => {
  const { caseId } = req.params;
  const id = parseInt(caseId);
  const data = readJSON('cases.json', { cases: [] });
  const idx = data.cases.findIndex(item => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: '案例不存在' });
  }
  data.cases.splice(idx, 1);
  writeJSON('cases.json', data);
  res.json({ success: true, message: '删除成功' });
});

/** POST /api/admin/cases/:caseId/image — 上传案例主图（同时加入多图列表） */
router.post('/cases/:caseId/image', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '请选择要上传的图片' });
  }
  const { caseId } = req.params;
  const id = parseInt(caseId);
  const data = readJSON('cases.json', { cases: [] });
  const c = data.cases.find(item => item.id === id);
  if (!c) {
    return res.status(404).json({ message: '案例不存在' });
  }
  const imagePath = '/uploads/cases/' + req.file.filename;
  c.imagePath = imagePath;
  if (!c.images) c.images = [];
  // 如果主图不在多图列表中则加入
  if (!c.images.includes(imagePath)) {
    c.images.push(imagePath);
  }
  c.updatedAt = new Date().toISOString();
  writeJSON('cases.json', data);
  res.json({ success: true, data: { imagePath, images: c.images } });
}, (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小不能超过 5MB' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

/** POST /api/admin/cases/:caseId/images — 上传案例多图（附加到 images 数组） */
router.post('/cases/:caseId/images', auth, upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: '请选择要上传的图片' });
  }
  const { caseId } = req.params;
  const id = parseInt(caseId);
  const data = readJSON('cases.json', { cases: [] });
  const c = data.cases.find(item => item.id === id);
  if (!c) {
    return res.status(404).json({ message: '案例不存在' });
  }
  if (!c.images) c.images = [];
  const newPaths = [];
  req.files.forEach(file => {
    const imagePath = '/uploads/cases/' + file.filename;
    c.images.push(imagePath);
    newPaths.push(imagePath);
  });
  // 如果没有主图，自动设第一张为主图
  if (!c.imagePath && newPaths.length > 0) {
    c.imagePath = newPaths[0];
  }
  c.updatedAt = new Date().toISOString();
  writeJSON('cases.json', data);
  res.json({ success: true, data: { images: c.images, newImages: newPaths } });
}, (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小不能超过 5MB' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

/** DELETE /api/admin/cases/:caseId/images — 删除案例中某张图 */
router.delete('/cases/:caseId/images', auth, (req, res) => {
  const { caseId } = req.params;
  const { imagePath } = req.body;
  if (!imagePath) {
    return res.status(400).json({ message: '请指定要删除的图片路径' });
  }
  const id = parseInt(caseId);
  const data = readJSON('cases.json', { cases: [] });
  const c = data.cases.find(item => item.id === id);
  if (!c) {
    return res.status(404).json({ message: '案例不存在' });
  }
  if (!c.images) c.images = [];
  c.images = c.images.filter(p => p !== imagePath);
  if (c.imagePath === imagePath) {
    c.imagePath = c.images.length > 0 ? c.images[0] : '';
  }
  c.updatedAt = new Date().toISOString();
  writeJSON('cases.json', data);
  res.json({ success: true, data: { images: c.images, imagePath: c.imagePath } });
});

// =============================================
// 客户线索管理（需认证）
// =============================================

/** GET /api/admin/leads — 获取所有客户线索 */
router.get('/leads', auth, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const dbPath = path.join(__dirname, '..', 'db', 'leads.json');
  let leads = [];
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf-8');
      leads = JSON.parse(raw);
    }
  } catch (e) {
    console.error('[admin] 读取 leads.json 失败:', e.message);
  }
  // 按提交时间倒序
  leads.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json({ success: true, data: leads });
});

module.exports = router;
