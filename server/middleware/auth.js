/**
 * auth.js — JWT 认证中间件
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未登录或登录已过期' });
  }
  try {
    const token = header.slice(7);
    req.admin = jwt.verify(token, config.jwt.secret);
    next();
  } catch (e) {
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }
};
