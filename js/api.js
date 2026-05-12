/**
 * api.js — API 交互模块
 * 负责与后端 Express 服务通信
 */

const apiService = (() => {
  // 根据环境判断 API 基础 URL
  const BASE_URL = (() => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;

    // file:// 协议下（直接打开 HTML），必须使用完整 URL
    if (protocol === 'file:') {
      return 'http://localhost:3001/api';
    }
    // 本地开发服务器
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }
    // 部署时的 API 地址（可配置）
    return '/api';
  })();

  /** 通用请求封装 */
  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `请求失败 (${response.status})`);
      }

      return { success: true, data };
    } catch (error) {
      // 如果是网络错误（后端未启动）
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.warn('[API] 后端服务不可用，使用本地降级模式');
        return { success: false, error: '服务暂不可用，请稍后再试', offline: true };
      }
      console.error('[API Error]', error);
      return { success: false, error: error.message };
    }
  }

  /** 提交诊断结果 */
  async function submitDiagnosis(diagnosisData) {
    return request('/diagnose', {
      method: 'POST',
      body: JSON.stringify(diagnosisData),
    });
  }

  /** 提交客户线索 */
  async function captureLead(leadData) {
    return request('/lead/submit', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  /** 获取成功案例 */
  async function getCases() {
    return request('/cases');
  }

  /** 获取文章列表 */
  async function getArticles() {
    return request('/articles');
  }

  return {
    submitDiagnosis,
    captureLead,
    getCases,
    getArticles,
  };
})();

// 暴露为全局变量
window.apiService = apiService;
