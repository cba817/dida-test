/**
 * 空间增长系统 — 后端 API 服务入口
 * 基于 Express.js
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// === 中间件 ===

// CORS — 允许前端跨域访问
app.use(cors({
  origin: ['http://localhost:5500', 'http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:8000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON 请求体解析
app.use(express.json({ limit: '1mb' }));

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// === 静态文件服务 ===
// 托管前端页面
app.use(express.static(path.join(__dirname, '..')));
// 托管管理后台页面
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
// 托管上传文件
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// === API 路由 ===
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

// === 404 处理 ===
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

// === 全局错误处理 ===
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({ message: '服务器内部错误' });
});

// === 启动服务 ===
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  空间增长系统 服务已启动');
  console.log(`  前台: http://localhost:${PORT}`);
  console.log(`  管理后台: http://localhost:${PORT}/admin`);
  console.log(`  API: http://localhost:${PORT}/api/health`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
