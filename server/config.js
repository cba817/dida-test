/**
 * config.js — 服务器配置
 * 管理员账号 + JWT 配置 + 上传配置
 */

const path = require('path');

module.exports = {
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'space-growth-jwt-secret-2025',
    expiresIn: '24h'
  },
  upload: {
    dir: path.join(__dirname, '..', 'uploads'),
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  }
};
