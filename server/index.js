/**
 * 空间增长系统 — 后端 API 服务入口
 * 基于 Express.js
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// === 中间件 ===

// CORS — 允许前端跨域访问
app.use(cors({
  origin: ['http://localhost:5500', 'http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:8000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
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

// === 静态文件服务（生产环境可直接托管前端） ===
// 开发时前端通过 Live Server 或其他方式运行
// 生产时取消注释以下行，并将前端文件放在 ../ 目录
// app.use(express.static(path.join(__dirname, '..')));

// === API 路由 ===
app.use('/api', apiRoutes);

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
  console.log('  空间增长系统 API 服务已启动');
  console.log(`  地址: http://localhost:${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
