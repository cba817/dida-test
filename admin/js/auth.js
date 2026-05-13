/**
 * auth.js — 管理后台登录认证模块
 */

const AdminAuth = (() => {
  const TOKEN_KEY = 'admin_token';
  const USERNAME_KEY = 'admin_username';

  /** 获取存储的 token */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** 获取存储的用户名 */
  function getUsername() {
    return localStorage.getItem(USERNAME_KEY);
  }

  /** 判断是否已登录 */
  function isLoggedIn() {
    return !!getToken();
  }

  /** 登录 */
  async function login(username, password) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USERNAME_KEY, username);
      return { success: true };
    }
    return { success: false, message: data.message || '登录失败' };
  }

  /** 登出 */
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    window.location.hash = '#login';
  }

  /** 验证 token 是否有效 */
  async function checkToken() {
    const token = getToken();
    if (!token) return false;
    try {
      const res = await fetch('/api/admin/check', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      return data.success;
    } catch {
      return false;
    }
  }

  /** 获取带认证头的请求配置 */
  function authHeader() {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  return { getToken, getUsername, isLoggedIn, login, logout, checkToken, authHeader };
})();
