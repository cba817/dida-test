/**
 * admin-api.js — 管理后台 API 通信模块
 * 封装所有管理后台接口调用
 */

const AdminApi = (() => {
  const BASE = '/api/admin';

  /** 通用请求 */
  async function request(method, path, body = null) {
    const headers = { ...AdminAuth.authHeader() };
    const config = { method, headers };

    if (body !== null) {
      if (body instanceof FormData) {
        // FormData 不设置 Content-Type，让浏览器自动设置
        config.body = body;
      } else {
        headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(body);
      }
    }

    try {
      const res = await fetch(`${BASE}${path}`, config);
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || `请求失败 (${res.status})` };
      }
      return { success: true, ...data };
    } catch (err) {
      return { success: false, message: '网络错误，请检查服务是否运行' };
    }
  }

  // =============================================
  // 站点设置
  // =============================================

  function getSite() {
    return request('GET', '/site');
  }

  function updateSite(data) {
    return request('PUT', '/site', data);
  }

  function uploadLogo(file) {
    const fd = new FormData();
    fd.append('logo', file);
    return request('POST', '/site/logo', fd);
  }

  // =============================================
  // 痛点管理
  // =============================================

  function getPains() {
    return request('GET', '/pains');
  }

  function addPain(driverId, text) {
    return request('POST', '/pains', { driverId, text });
  }

  function updatePain(painId, text) {
    return request('PUT', `/pains/${painId}`, { text });
  }

  function deletePain(painId) {
    return request('DELETE', `/pains/${painId}`);
  }

  // =============================================
  // 套餐管理
  // =============================================

  function getPackages() {
    return request('GET', '/packages');
  }

  function addPackage(data) {
    return request('POST', '/packages', data);
  }

  function updatePackage(pkgId, data) {
    return request('PUT', `/packages/${pkgId}`, data);
  }

  function deletePackage(pkgId) {
    return request('DELETE', `/packages/${pkgId}`);
  }

  // =============================================
  // 案例管理
  // =============================================

  function getCases() {
    return request('GET', '/cases');
  }

  function addCase(data) {
    return request('POST', '/cases', data);
  }

  function updateCase(caseId, data) {
    return request('PUT', `/cases/${caseId}`, data);
  }

  function deleteCase(caseId) {
    return request('DELETE', `/cases/${caseId}`);
  }

  function uploadCaseImage(caseId, file) {
    const fd = new FormData();
    fd.append('image', file);
    return request('POST', `/cases/${caseId}/image`, fd);
  }

  function uploadCaseImages(caseId, files) {
    const fd = new FormData();
    // FileList 需要转成数组才能用 forEach
    Array.from(files).forEach(f => fd.append('images', f));
    return request('POST', `/cases/${caseId}/images`, fd);
  }

  function deleteCaseImage(caseId, imagePath) {
    return request('DELETE', `/cases/${caseId}/images`, { imagePath });
  }

  /** 获取客户线索列表 */
  function getLeads() {
    return request('GET', '/leads');
  }

  return {
    getSite, updateSite, uploadLogo,
    getPains, addPain, updatePain, deletePain,
    getPackages, addPackage, updatePackage, deletePackage,
    getCases, addCase, updateCase, deleteCase, uploadCaseImage,
    uploadCaseImages, deleteCaseImage,
    getLeads
  };
})();
