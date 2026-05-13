/**
 * admin.js — 管理后台核心逻辑
 * 处理 Tab 切换、CRUD 操作、弹窗等
 */

// =============================================
// 初始化
// =============================================

let currentPainDriver = 'PRODUCT';
let currentTab = 'site';
let selectedFile = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 先尝试验证 token
  if (AdminAuth.isLoggedIn()) {
    const valid = await AdminAuth.checkToken();
    if (valid) {
      showPanel();
      return;
    }
  }
  showLogin();
});

// =============================================
// 登录管理
// =============================================

function showLogin() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('adminPanel').classList.add('hidden');
}

function showPanel() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminPanel').classList.remove('hidden');
  document.getElementById('sidebarUser').textContent = AdminAuth.getUsername() || '管理员';
  loadSiteSettings();
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');

  if (!username || !password) {
    errorEl.textContent = '请输入用户名和密码';
    errorEl.classList.add('visible');
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = '登录中...';

  const result = await AdminAuth.login(username, password);
  if (result.success) {
    errorEl.classList.remove('visible');
    showPanel();
  } else {
    errorEl.textContent = result.message || '用户名或密码错误';
    errorEl.classList.add('visible');
  }
  btn.disabled = false;
  btn.textContent = '登 录';
});

function handleLogout() {
  AdminAuth.logout();
  showLogin();
}

// =============================================
// Tab 切换
// =============================================

function switchTab(tab) {
  currentTab = tab;
  // 导航高亮
  document.querySelectorAll('.admin-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  // 内容切换
  document.querySelectorAll('.admin-section').forEach(el => {
    el.classList.toggle('active', el.id === `tab-${tab}`);
  });
  // 加载数据
  if (tab === 'site') loadSiteSettings();
  else if (tab === 'pains') loadPains();
  else if (tab === 'packages') loadPackages();
  else if (tab === 'cases') loadCases();
  else if (tab === 'leads') loadLeads();
}

// =============================================
// Toast 消息
// =============================================

function showToast(message, type = 'info') {
  const existing = document.querySelector('.admin-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// =============================================
// Modal 弹窗
// =============================================

function openModal(title, html) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

// =============================================
// 1. 站点设置
// =============================================

async function loadSiteSettings() {
  const result = await AdminApi.getSite();
  if (!result.success) {
    showToast('加载站点设置失败', 'error');
    return;
  }
  const site = result.data;
  document.getElementById('siteName').value = site.siteName || '';
  document.getElementById('siteDescription').value = site.siteDescription || '';
  document.getElementById('logoText').value = site.logoText || '';
  document.getElementById('logoAccent').value = site.logoAccent || '';

  // 更新 Logo 预览
  updateLogoPreview(site.logoPath);
}

function updateLogoPreview(path) {
  const preview = document.getElementById('logoPreview');
  if (path) {
    preview.innerHTML = `<img src="${path}" alt="Logo" onerror="this.parentElement.innerHTML='<span class=\\'placeholder\\'>⬡</span>'">`;
  } else {
    preview.innerHTML = '<span class="placeholder">⬡</span>';
  }
}

// Logo 选择
document.getElementById('logoInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) {
    document.getElementById('uploadLogoBtn').disabled = true;
    return;
  }
  selectedFile = file;
  document.getElementById('uploadLogoBtn').disabled = false;

  // 本地预览
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById('logoPreview').innerHTML = `<img src="${ev.target.result}" alt="Logo 预览">`;
  };
  reader.readAsDataURL(file);
});

async function uploadLogo() {
  if (!selectedFile) {
    showToast('请先选择图片', 'error');
    return;
  }
  const btn = document.getElementById('uploadLogoBtn');
  btn.disabled = true;
  btn.textContent = '上传中...';

  const result = await AdminApi.uploadLogo(selectedFile);
  if (result.success) {
    showToast('Logo 上传成功', 'success');
    updateLogoPreview(result.data.logoPath);
    selectedFile = null;
    document.getElementById('logoInput').value = '';
  } else {
    showToast(result.message || '上传失败', 'error');
  }
  btn.disabled = false;
  btn.textContent = '上传';
}

// 站点设置表单提交
document.getElementById('siteForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    siteName: document.getElementById('siteName').value.trim(),
    siteDescription: document.getElementById('siteDescription').value.trim(),
    logoText: document.getElementById('logoText').value.trim(),
    logoAccent: document.getElementById('logoAccent').value.trim()
  };
  if (!data.siteName) {
    showToast('请输入网站名称', 'error');
    return;
  }
  const result = await AdminApi.updateSite(data);
  if (result.success) {
    showToast('站点设置已保存', 'success');
  } else {
    showToast(result.message || '保存失败', 'error');
  }
});

// =============================================
// 2. 痛点管理
// =============================================

function switchPainDriver(driverId) {
  currentPainDriver = driverId;
  document.querySelectorAll('.pain-driver-tab').forEach(el => {
    el.classList.toggle('active', el.dataset.driver === driverId);
  });
  renderPainList();
}

async function loadPains() {
  const result = await AdminApi.getPains();
  if (!result.success) {
    document.getElementById('painListContainer').innerHTML = '<div class="admin-empty"><p>加载失败</p></div>';
    return;
  }
  window._painsData = result.data;
  renderPainList();
}

function renderPainList() {
  if (!window._painsData) return;
  const driver = window._painsData.drivers.find(d => d.id === currentPainDriver);
  if (!driver) {
    document.getElementById('painListContainer').innerHTML = '<div class="admin-empty"><p>无数据</p></div>';
    return;
  }
  if (driver.pains.length === 0) {
    document.getElementById('painListContainer').innerHTML = `
      <div class="admin-empty">
        <div class="empty-icon">📋</div>
        <p>暂无痛点数据，点击右上角"新增痛点"添加</p>
      </div>`;
    return;
  }

  let html = `<div class="admin-table-wrap"><table class="admin-table">
    <thead><tr>
      <th style="width:60px">序号</th>
      <th>痛点 ID</th>
      <th>痛<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="82cb4014">[email&#160;protected]</a>容</th>
      <th style="width:140px">操作</th>
    </tr></thead><tbody>`;

  driver.pains.forEach((p, idx) => {
    const escapedText = p.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html += `<tr>
      <td>${idx + 1}</td>
      <td><code style="font-size:0.8rem;color:#888">${p.id}</code></td>
      <td>${escapedText}</td>
      <td class="admin-actions">
        <button class="admin-btn admin-btn-sm" onclick="openEditPainModal('${p.id}')">✏️ 编辑</button>
        <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deletePain('${p.id}')">🗑️ 删除</button>
      </td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  document.getElementById('painListContainer').innerHTML = html;
}

function openAddPainModal() {
  const drivers = window._painsData?.drivers || [];
  const options = drivers.map(d =>
    `<option value="${d.id}" ${d.id === currentPainDriver ? 'selected' : ''}>${d.icon} ${d.title}</option>`
  ).join('');

  openModal('新增痛点', `
    <form id="painForm">
      <div class="admin-form-group">
        <label>驱动类型 <span class="required">*</span></label>
        <select class="admin-select" id="painDriverSelect">${options}</select>
      </div>
      <div class="admin-form-group">
        <label>痛点内容 <span class="required">*</span></label>
        <textarea class="admin-textarea" id="painText" rows="3" placeholder="请输入痛点描述"></textarea>
      </div>
      <div class="admin-modal-footer">
        <button type="button" class="admin-btn" onclick="closeModal()">取消</button>
        <button type="submit" class="admin-btn admin-btn-primary">✅ 添加</button>
      </div>
    </form>
  `);

  document.getElementById('painForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const driverId = document.getElementById('painDriverSelect').value;
    const text = document.getElementById('painText').value.trim();
    if (!text) { showToast('请输入痛点内容', 'error'); return; }
    const result = await AdminApi.addPain(driverId, text);
    if (result.success) {
      showToast('痛点已添加', 'success');
      closeModal();
      await loadPains();
    } else {
      showToast(result.message || '添加失败', 'error');
    }
  });
}

function openEditPainModal(painId) {
  const driver = window._painsData?.drivers.find(d =>
    d.pains.some(p => p.id === painId)
  );
  const pain = driver?.pains.find(p => p.id === painId);
  if (!pain) return;

  openModal('编辑痛点', `
    <form id="editPainForm">
      <div class="admin-form-group">
        <label>痛点 ID</label>
        <input type="text" class="admin-input" value="${pain.id}" disabled>
      </div>
      <div class="admin-form-group">
        <label>痛点内容 <span class="required">*</span></label>
        <textarea class="admin-textarea" id="editPainText" rows="3">${pain.text}</textarea>
      </div>
      <div class="admin-modal-footer">
        <button type="button" class="admin-btn" onclick="closeModal()">取消</button>
        <button type="submit" class="admin-btn admin-btn-primary">💾 保存</button>
      </div>
    </form>
  `);

  document.getElementById('editPainForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = document.getElementById('editPainText').value.trim();
    if (!text) { showToast('请输入痛点内容', 'error'); return; }
    const result = await AdminApi.updatePain(painId, text);
    if (result.success) {
      showToast('痛点已更新', 'success');
      closeModal();
      await loadPains();
    } else {
      showToast(result.message || '更新失败', 'error');
    }
  });
}

async function deletePain(painId) {
  if (!confirm('确定要删除这个痛点吗？')) return;
  const result = await AdminApi.deletePain(painId);
  if (result.success) {
    showToast('痛点已删除', 'success');
    await loadPains();
  } else {
    showToast(result.message || '删除失败', 'error');
  }
}

// =============================================
// 3. 套餐管理
// =============================================

async function loadPackages() {
  const result = await AdminApi.getPackages();
  if (!result.success) {
    document.getElementById('packageListContainer').innerHTML = '<div class="admin-empty"><p>加载失败</p></div>';
    return;
  }
  window._packagesData = result.data.packages || [];
  renderPackageList();
}

function renderPackageList() {
  const pkgs = window._packagesData;
  if (!pkgs || pkgs.length === 0) {
    document.getElementById('packageListContainer').innerHTML = `
      <div class="admin-empty">
        <div class="empty-icon">📦</div>
        <p>暂无套餐数据，点击右上角"新增套餐"添加</p>
      </div>`;
    return;
  }

  let html = `<div class="admin-table-wrap"><table class="admin-table">
    <thead><tr>
      <th style="width:50px">排序</th>
      <th>标题</th>
      <th>价格</th>
      <th>推荐阈值</th>
      <th>功能项</th>
      <th style="width:130px">操作</th>
    </tr></thead><tbody>`;

  pkgs.forEach(pkg => {
    html += `<tr>
      <td>${pkg.sortOrder || '-'}</td>
      <td><strong>${pkg.title || ''}</strong></td>
      <td>${pkg.price || ''} ${pkg.priceNote || ''}</td>
      <td>${pkg.featuredThreshold?.minPains || '-'} ~ ${pkg.featuredThreshold?.maxPains || '-'} 个痛点</td>
      <td>${(pkg.features || []).length} 项</td>
      <td class="admin-actions">
        <button class="admin-btn admin-btn-sm" onclick="openEditPackageModal('${pkg.id}')">✏️ 编辑</button>
        <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deletePackage('${pkg.id}')">🗑️ 删除</button>
      </td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  document.getElementById('packageListContainer').innerHTML = html;
}

function openAddPackageModal() {
  openModal('新增套餐', `
    <form id="packageForm">
      <div class="admin-form-group">
        <label>套餐标题 <span class="required">*</span></label>
        <input type="text" class="admin-input" id="pkgTitle" placeholder="例如：🔵 成交转化系统" required>
      </div>
      <div class="admin-form-row">
        <div class="admin-form-group">
          <label>价格 <span class="required">*</span></label>
          <input type="text" class="admin-input" id="pkgPrice" placeholder="例如：¥18,800" required>
        </div>
        <div class="admin-form-group">
          <label>价格备注</label>
          <input type="text" class="admin-input" id="pkgPriceNote" placeholder="例如：起 / +">
        </div>
      </div>
      <div class="admin-form-row-3">
        <div class="admin-form-group">
          <label>图标</label>
          <input type="text" class="admin-input" id="pkgIcon" placeholder="🟢">
        </div>
        <div class="admin-form-group">
          <label>推荐最小痛点数</label>
          <input type="number" class="admin-input" id="pkgMinPains" value="1" min="1" max="99">
        </div>
        <div class="admin-form-group">
          <label>推荐最大痛点数</label>
          <input type="number" class="admin-input" id="pkgMaxPains" value="99" min="1" max="99">
        </div>
      </div>
      <div class="admin-form-group">
        <label>交付结果标题</label>
        <input type="text" class="admin-input" id="pkgResultTitle" placeholder="例如：核心增长结果">
      </div>
      <div class="admin-form-group">
        <label>交付结果（每行一个）</label>
        <textarea class="admin-textarea" id="pkgResultItems" rows="3" placeholder="转化率提升 10%-40%&#10;降低沟通成本，缩短成交周期"></textarea>
      </div>
      <div class="admin-form-group">
        <label>功能列表（每行一个）</label>
        <textarea class="admin-textarea" id="pkgFeatures" rows="4" placeholder="<strong>品牌故事墙：</strong>建立信任背书&#10;业务可视化"></textarea>
      </div>
      <div class="admin-modal-footer">
        <button type="button" class="admin-btn" onclick="closeModal()">取消</button>
        <button type="submit" class="admin-btn admin-btn-primary">✅ 添加</button>
      </div>
    </form>
  `);

  document.getElementById('packageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('pkgTitle').value.trim();
    const price = document.getElementById('pkgPrice').value.trim();
    if (!title || !price) { showToast('标题和价格为必填项', 'error'); return; }

    const resultItems = document.getElementById('pkgResultItems').value.split('\n').map(s => s.trim()).filter(Boolean);
    const features = document.getElementById('pkgFeatures').value.split('\n').map(s => s.trim()).filter(Boolean);

    const data = {
      title,
      icon: document.getElementById('pkgIcon').value.trim() || '📦',
      price,
      priceNote: document.getElementById('pkgPriceNote').value.trim(),
      featuredThreshold: {
        minPains: parseInt(document.getElementById('pkgMinPains').value) || 1,
        maxPains: parseInt(document.getElementById('pkgMaxPains').value) || 99
      },
      resultTitle: document.getElementById('pkgResultTitle').value.trim() || '交付结果',
      resultItems,
      features
    };

    const result = await AdminApi.addPackage(data);
    if (result.success) {
      showToast('套餐已添加', 'success');
      closeModal();
      await loadPackages();
    } else {
      showToast(result.message || '添加失败', 'error');
    }
  });
}

function openEditPackageModal(pkgId) {
  const pkg = window._packagesData.find(p => p.id === pkgId);
  if (!pkg) return;

  openModal('编辑套餐', `
    <form id="editPackageForm">
      <div class="admin-form-group">
        <label>套餐标题 <span class="required">*</span></label>
        <input type="text" class="admin-input" id="epTitle" value="${pkg.title || ''}">
      </div>
      <div class="admin-form-row">
        <div class="admin-form-group">
          <label>价格 <span class="required">*</span></label>
          <input type="text" class="admin-input" id="epPrice" value="${pkg.price || ''}">
        </div>
        <div class="admin-form-group">
          <label>价格备注</label>
          <input type="text" class="admin-input" id="epPriceNote" value="${pkg.priceNote || ''}">
        </div>
      </div>
      <div class="admin-form-row-3">
        <div class="admin-form-group">
          <label>图标</label>
          <input type="text" class="admin-input" id="epIcon" value="${pkg.icon || '📦'}">
        </div>
        <div class="admin-form-group">
          <label>推荐最小痛点</label>
          <input type="number" class="admin-input" id="epMinPains" value="${pkg.featuredThreshold?.minPains || 1}">
        </div>
        <div class="admin-form-group">
          <label>推荐最大痛点</label>
          <input type="number" class="admin-input" id="epMaxPains" value="${pkg.featuredThreshold?.maxPains || 99}">
        </div>
      </div>
      <div class="admin-form-group">
        <label>交付结果标题</label>
        <input type="text" class="admin-input" id="epResultTitle" value="${pkg.resultTitle || '交付结果'}">
      </div>
      <div class="admin-form-group">
        <label>交付结果（每行一个）</label>
        <textarea class="admin-textarea" id="epResultItems" rows="3">${(pkg.resultItems || []).join('\n')}</textarea>
      </div>
      <div class="admin-form-group">
        <label>功能列表（每行一个）</label>
        <textarea class="admin-textarea" id="epFeatures" rows="4">${(pkg.features || []).join('\n')}</textarea>
      </div>
      <div class="admin-form-group">
        <label>排序</label>
        <input type="number" class="admin-input" id="epSortOrder" value="${pkg.sortOrder || 1}">
      </div>
      <div class="admin-modal-footer">
        <button type="button" class="admin-btn" onclick="closeModal()">取消</button>
        <button type="submit" class="admin-btn admin-btn-primary">💾 保存</button>
      </div>
    </form>
  `);

  document.getElementById('editPackageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('epTitle').value.trim();
    const price = document.getElementById('epPrice').value.trim();
    if (!title || !price) { showToast('标题和价格为必填项', 'error'); return; }

    const resultItems = document.getElementById('epResultItems').value.split('\n').map(s => s.trim()).filter(Boolean);
    const features = document.getElementById('epFeatures').value.split('\n').map(s => s.trim()).filter(Boolean);

    const data = {
      title,
      icon: document.getElementById('epIcon').value.trim() || '📦',
      price,
      priceNote: document.getElementById('epPriceNote').value.trim(),
      featuredThreshold: {
        minPains: parseInt(document.getElementById('epMinPains').value) || 1,
        maxPains: parseInt(document.getElementById('epMaxPains').value) || 99
      },
      resultTitle: document.getElementById('epResultTitle').value.trim() || '交付结果',
      resultItems,
      features,
      sortOrder: parseInt(document.getElementById('epSortOrder').value) || 1
    };

    const result = await AdminApi.updatePackage(pkgId, data);
    if (result.success) {
      showToast('套餐已更新', 'success');
      closeModal();
      await loadPackages();
    } else {
      showToast(result.message || '更新失败', 'error');
    }
  });
}

async function deletePackage(pkgId) {
  if (!confirm('确定要删除这个套餐吗？')) return;
  const result = await AdminApi.deletePackage(pkgId);
  if (result.success) {
    showToast('套餐已删除', 'success');
    await loadPackages();
  } else {
    showToast(result.message || '删除失败', 'error');
  }
}

// =============================================
// 4. 案例管理
// =============================================

async function loadCases() {
  const result = await AdminApi.getCases();
  if (!result.success) {
    document.getElementById('caseListContainer').innerHTML = '<div class="admin-empty"><p>加载失败</p></div>';
    return;
  }
  window._casesData = result.data.cases || [];
  renderCaseList();
}

function renderCaseList() {
  const cases = window._casesData;
  if (!cases || cases.length === 0) {
    document.getElementById('caseListContainer').innerHTML = `
      <div class="admin-empty">
        <div class="empty-icon">🏆</div>
        <p>暂无案例数据，点击右上角"新增案例"添加</p>
      </div>`;
    return;
  }

  let html = `<div class="admin-table-wrap"><table class="admin-table">
    <thead><tr>
      <th style="width:60px">排序</th>
      <th>标题</th>
      <th>标签</th>
      <th>数据指标</th>
      <th>图片</th>
      <th style="width:150px">操作</th>
    </tr></thead><tbody>`;

  cases.forEach(c => {
    const hasImage = c.imagePath ? '✅ 有' : '❌ 无';
    html += `<tr>
      <td>${c.sortOrder || '-'}</td>
      <td><strong>${c.title || ''}</strong></td>
      <td><span class="admin-badge admin-badge-blue">${c.tag || ''}</span></td>
      <td>${c.stat || ''} ${c.statLabel || ''}</td>
      <td>${hasImage}</td>
      <td class="admin-actions">
        <button class="admin-btn admin-btn-sm" onclick="openEditCaseModal(${c.id})">✏️ 编辑</button>
        <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteCase(${c.id})">🗑️ 删除</button>
      </td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  document.getElementById('caseListContainer').innerHTML = html;
}

function openAddCaseModal() {
  // 重置文件变量
  window._addCaseMainImage = null;
  window._addCaseMultiImages = null;

  openModal('新增案例', `
    <form id="caseForm">
      <div class="admin-form-row">
        <div class="admin-form-group">
          <label>案例标题 <span class="required">*</span></label>
          <input type="text" class="admin-input" id="caseTitle" placeholder="例如：某SaaS企业总部空间升级">
        </div>
        <div class="admin-form-group">
          <label>标签 <span class="required">*</span></label>
          <input type="text" class="admin-input" id="caseTag" placeholder="例如：企业服务">
        </div>
      </div>
      <div class="admin-form-group">
        <label>简短描述</label>
        <textarea class="admin-textarea" id="caseDesc" rows="2" placeholder="案例一句话简介"></textarea>
      </div>
      <div class="admin-form-group">
        <label>设计方案说明</label>
        <textarea class="admin-textarea" id="caseDescription" rows="4" placeholder="## 项目背景&#10;&#10;详细的设计方案说明，支持 Markdown 格式，用 ## 分隔章节"></textarea>
        <p style="font-size:0.78rem;color:#999;margin-top:4px">支持 Markdown 格式（## 标题、**加粗**、- 列表等），详细描述设计策略和执行效果</p>
      </div>
      <div class="admin-form-row">
        <div class="admin-form-group">
          <label>数据指标</label>
          <input type="text" class="admin-input" id="caseStat" placeholder="例如：275%">
        </div>
        <div class="admin-form-group">
          <label>指标标签</label>
          <input type="text" class="admin-input" id="caseStatLabel" placeholder="例如：转化提升">
        </div>
      </div>
      <div class="admin-form-group">
        <label>占位图标（无图片时显示）</label>
        <input type="text" class="admin-input" id="caseEmoji" value="📊">
      </div>

      <!-- 主图上传 -->
      <div class="admin-card" style="padding:16px;margin-top:12px;box-shadow:none;border:1px solid #f0f0f0">
        <div class="admin-form-group">
          <label style="font-weight:600">🖼️ 案例主图（可选）</label>
          <div class="admin-upload-area">
            <div class="admin-upload-preview" id="addCaseImagePreview">
              <span class="placeholder">⬡</span>
            </div>
            <div>
              <input type="file" id="addCaseImageInput" accept="image/png,image/jpeg,image/gif,image/webp" style="display:none">
              <button type="button" class="admin-btn" onclick="document.getElementById('addCaseImageInput').click()">📁 选择主图</button>
              <p style="font-size:0.78rem;color:#999;margin-top:4px">JPEG/PNG/GIF/WebP，最大 5MB</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 多图上传 -->
      <div class="admin-card" style="padding:16px;margin-top:12px;box-shadow:none;border:1px solid #f0f0f0">
        <div class="admin-form-group">
          <label style="font-weight:600">🖼️ 更多展示图片（可选，可多选）</label>
          <div>
            <input type="file" id="addCaseMultiImageInput" multiple accept="image/png,image/jpeg,image/gif,image/webp" style="display:none">
            <button type="button" class="admin-btn" onclick="document.getElementById('addCaseMultiImageInput').click()">📁 选择多张图片</button>
            <span id="addCaseMultiImageCount" style="font-size:0.8rem;color:#999;margin-left:8px"></span>
            <p style="font-size:0.78rem;color:#999;margin-top:4px">可一次性选择多张图片，每张最大 5MB，最多 10 张</p>
          </div>
        </div>
      </div>

      <div class="admin-modal-footer">
        <button type="button" class="admin-btn" onclick="closeModal()">取消</button>
        <button type="submit" id="addCaseSubmitBtn" class="admin-btn admin-btn-primary">✅ 添加案例</button>
      </div>
    </form>
  `);

  // 主图文件选择
  document.getElementById('addCaseImageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      window._addCaseMainImage = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById('addCaseImagePreview').innerHTML = `<img src="${ev.target.result}" alt="预览">`;
      };
      reader.readAsDataURL(file);
    }
  });

  // 多图文件选择
  document.getElementById('addCaseMultiImageInput').addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      window._addCaseMultiImages = files;
      document.getElementById('addCaseMultiImageCount').textContent = `已选 ${files.length} 张`;
    }
  });

  document.getElementById('caseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('caseTitle').value.trim();
    const tag = document.getElementById('caseTag').value.trim();
    if (!title || !tag) { showToast('标题和标签为必填项', 'error'); return; }

    const btn = document.getElementById('addCaseSubmitBtn');
    btn.disabled = true;
    btn.textContent = '创建中...';

    // 1. 先创建案例获取 ID
    const data = {
      title,
      tag,
      desc: document.getElementById('caseDesc').value.trim(),
      description: document.getElementById('caseDescription').value.trim(),
      stat: document.getElementById('caseStat').value.trim(),
      statLabel: document.getElementById('caseStatLabel').value.trim(),
      imageEmoji: document.getElementById('caseEmoji').value.trim() || '📊'
    };

    const result = await AdminApi.addCase(data);
    if (!result.success) {
      showToast(result.message || '添加失败', 'error');
      btn.disabled = false;
      btn.textContent = '✅ 添加案例';
      return;
    }

    const newCaseId = result.data.id;

    // 2. 上传主图
    if (window._addCaseMainImage) {
      btn.textContent = '上传主图中...';
      const imgResult = await AdminApi.uploadCaseImage(newCaseId, window._addCaseMainImage);
      if (!imgResult.success) {
        showToast('案例已创建，但主图上传失败', 'error');
      }
    }

    // 3. 上传多图
    if (window._addCaseMultiImages && window._addCaseMultiImages.length > 0) {
      btn.textContent = '上传多图中...';
      const multiResult = await AdminApi.uploadCaseImages(newCaseId, window._addCaseMultiImages);
      if (!multiResult.success) {
        showToast('案例已创建，但多图上传失败', 'error');
      }
    }

    showToast('案例添加成功', 'success');
    closeModal();
    await loadCases();
  });
}

function openEditCaseModal(caseId) {
  const c = window._casesData.find(item => item.id === caseId);
  if (!c) return;

  // 生成多图预览 HTML
  const images = c.images || [];
  const imagesHtml = images.map((img, idx) => `
    <div class="admin-img-item" data-path="${img}" style="position:relative;display:inline-block;margin:4px;width:100px;height:100px;border-radius:8px;overflow:hidden;border:1px solid #e8e8e8;background:#fafafa">
      <img src="${img}" style="width:100%;height:100%;object-fit:cover" onerror="this.outerHTML='<span style=\\'font-size:2rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%\\'>📷</span>'">
      <button type="button" onclick="deleteCaseImageItem(${caseId},'${img}')" style="position:absolute;top:2px;right:2px;width:22px;height:22px;border-radius:50%;background:rgba(255,77,79,0.85);border:none;color:#fff;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
      ${idx === 0 && img === c.imagePath ? '<span style="position:absolute;bottom:2px;left:4px;background:rgba(82,196,26,0.85);color:#fff;font-size:10px;padding:1px 6px;border-radius:4px">主图</span>' : ''}
    </div>
  `).join('');

  const safeDesc = (c.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  openModal('编辑案例', `
    <form id="editCaseForm">
      <div class="admin-form-row">
        <div class="admin-form-group">
          <label>案例标题 <span class="required">*</span></label>
          <input type="text" class="admin-input" id="ecTitle" value="${c.title || ''}">
        </div>
        <div class="admin-form-group">
          <label>标签 <span class="required">*</span></label>
          <input type="text" class="admin-input" id="ecTag" value="${c.tag || ''}">
        </div>
      </div>
      <div class="admin-form-group">
        <label>简短描述</label>
        <textarea class="admin-textarea" id="ecDesc" rows="2">${c.desc || ''}</textarea>
      </div>

      <!-- 设计方案说明 -->
      <div class="admin-card" style="padding:16px;margin-bottom:16px;box-shadow:none;border:1px solid #f0f0f0">
        <div class="admin-form-group" style="margin-bottom:0">
          <label style="font-weight:600">📝 设计方案说明</label>
          <textarea class="admin-textarea" id="ecDescription" rows="6" placeholder="## 项目背景&#10;&#10;使用 Markdown 格式编写设计方案说明">${safeDesc}</textarea>
          <p style="font-size:0.78rem;color:#999;margin-top:4px">支持 Markdown：<strong>## 标题</strong> | <strong>**加粗**</strong> | <strong>- 列表</strong> | <strong>空行分段</strong></p>
        </div>
      </div>

      <div class="admin-form-row">
        <div class="admin-form-group">
          <label>数据指标</label>
          <input type="text" class="admin-input" id="ecStat" value="${c.stat || ''}">
        </div>
        <div class="admin-form-group">
          <label>指标标签</label>
          <input type="text" class="admin-input" id="ecStatLabel" value="${c.statLabel || ''}">
        </div>
      </div>
      <div class="admin-form-row">
        <div class="admin-form-group">
          <label>占位图标</label>
          <input type="text" class="admin-input" id="ecEmoji" value="${c.imageEmoji || '📊'}">
        </div>
        <div class="admin-form-group">
          <label>排序</label>
          <input type="number" class="admin-input" id="ecSortOrder" value="${c.sortOrder || 1}">
        </div>
      </div>

      <!-- 主图上传 -->
      <div class="admin-card" style="padding:16px;margin-top:12px;box-shadow:none;border:1px solid #f0f0f0">
        <div class="admin-form-group">
          <label style="font-weight:600">🖼️ 案例主图</label>
          <div class="admin-upload-area">
            <div class="admin-upload-preview" id="ecImagePreview">
              ${c.imagePath
                ? `<img src="${c.imagePath}" alt="案例图片" onerror="this.parentElement.innerHTML='<span class=\\'placeholder\\'>${c.imageEmoji || '📊'}</span>'">`
                : `<span class="placeholder">${c.imageEmoji || '📊'}</span>`
              }
            </div>
            <div>
              <input type="file" id="ecImageInput" accept="image/png,image/jpeg,image/gif,image/webp" style="display:none">
              <button type="button" class="admin-btn" onclick="document.getElementById('ecImageInput').click()">📁 选择主图</button>
              <button type="button" class="admin-btn admin-btn-primary" id="uploadCaseImageBtn" disabled>上传主图</button>
              <p style="font-size:0.78rem;color:#999;margin-top:4px">JPEG/PNG/GIF/WebP，最大 5MB</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 多图上传 -->
      <div class="admin-card" style="padding:16px;margin-top:12px;box-shadow:none;border:1px solid #f0f0f0">
        <div class="admin-form-group">
          <label style="font-weight:600">🖼️ 更多展示图片</label>
          <div id="multiImagePreview" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;min-height:60px">
            ${imagesHtml || '<p style="color:#bbb;font-size:0.85rem">暂无多图，请上传</p>'}
          </div>
          <div>
            <input type="file" id="ecMultiImageInput" multiple accept="image/png,image/jpeg,image/gif,image/webp" style="display:none">
            <button type="button" class="admin-btn" onclick="document.getElementById('ecMultiImageInput').click()">📁 选择多张图片</button>
            <button type="button" class="admin-btn admin-btn-primary" id="uploadMultiImageBtn" disabled>批量上传</button>
            <span id="multiImageCount" style="font-size:0.8rem;color:#999;margin-left:8px"></span>
            <p style="font-size:0.78rem;color:#999;margin-top:4px">可一次性选择多张图片，每张最大 5MB，最多 10 张</p>
          </div>
        </div>
      </div>

      <div class="admin-modal-footer">
        <button type="button" class="admin-btn" onclick="closeModal()">取消</button>
        <button type="submit" class="admin-btn admin-btn-primary">💾 保存案例信息</button>
      </div>
    </form>
  `);

  // 主图上传
  document.getElementById('ecImageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      window._caseImageFile = file;
      document.getElementById('uploadCaseImageBtn').disabled = false;
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById('ecImagePreview').innerHTML = `<img src="${ev.target.result}" alt="预览">`;
      };
      reader.readAsDataURL(file);
    }
  });
  // 上传主图按钮点击
  document.getElementById('uploadCaseImageBtn').addEventListener('click', () => {
    uploadCaseImage(caseId);
  });

  // 多图文件选择
  document.getElementById('ecMultiImageInput').addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      window._caseMultiImages = files;
      document.getElementById('uploadMultiImageBtn').disabled = false;
      document.getElementById('multiImageCount').textContent = `已选 ${files.length} 张`;
    }
  });
  // 批量上传按钮点击（也通过事件监听确保可靠）
  document.getElementById('uploadMultiImageBtn').addEventListener('click', () => {
    uploadCaseMultiImages(caseId);
  });

  document.getElementById('editCaseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('ecTitle').value.trim();
    const tag = document.getElementById('ecTag').value.trim();
    if (!title || !tag) { showToast('标题和标签为必填项', 'error'); return; }

    const data = {
      title,
      tag,
      desc: document.getElementById('ecDesc').value.trim(),
      description: document.getElementById('ecDescription').value.trim(),
      stat: document.getElementById('ecStat').value.trim(),
      statLabel: document.getElementById('ecStatLabel').value.trim(),
      imageEmoji: document.getElementById('ecEmoji').value.trim() || '📊',
      sortOrder: parseInt(document.getElementById('ecSortOrder').value) || 1
    };

    const result = await AdminApi.updateCase(caseId, data);
    if (result.success) {
      showToast('案例已更新', 'success');
      closeModal();
      await loadCases();
    } else {
      showToast(result.message || '更新失败', 'error');
    }
  });
}

async function uploadCaseImage(caseId) {
  const file = window._caseImageFile;
  if (!file) { showToast('请先选择图片', 'error'); return; }

  const btn = document.getElementById('uploadCaseImageBtn');
  btn.disabled = true;
  btn.textContent = '上传中...';

  const result = await AdminApi.uploadCaseImage(caseId, file);
  if (result.success) {
    showToast('主图上传成功', 'success');
    window._caseImageFile = null;
    document.getElementById('ecImageInput').value = '';
  } else {
    showToast(result.message || '上传失败', 'error');
  }
  btn.disabled = false;
  btn.textContent = '上传主图';
}

async function uploadCaseMultiImages(caseId) {
  const files = window._caseMultiImages;
  if (!files || files.length === 0) { showToast('请先选择图片', 'error'); return; }

  const btn = document.getElementById('uploadMultiImageBtn');
  btn.disabled = true;
  btn.textContent = '上传中...';

  const result = await AdminApi.uploadCaseImages(caseId, files);
  if (result.success) {
    showToast(`${files.length} 张图片上传成功`, 'success');
    window._caseMultiImages = null;
    document.getElementById('ecMultiImageInput').value = '';
    document.getElementById('multiImageCount').textContent = '';
    // 刷新多图预览（reload cases data）
    const casesRes = await AdminApi.getCases();
    if (casesRes.success) {
      window._casesData = casesRes.data.cases || [];
      const updated = window._casesData.find(item => item.id === caseId);
      if (updated && updated.images) {
        const imgs = updated.images;
        const newHtml = imgs.map((img, idx) => `
          <div style="position:relative;display:inline-block;margin:4px;width:100px;height:100px;border-radius:8px;overflow:hidden;border:1px solid #e8e8e8;background:#fafafa">
            <img src="${img}" style="width:100%;height:100%;object-fit:cover" onerror="this.outerHTML='<span style=\\'font-size:2rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%\\'>📷</span>'">
            <button type="button" onclick="deleteCaseImageItem(${caseId},'${img}')" style="position:absolute;top:2px;right:2px;width:22px;height:22px;border-radius:50%;background:rgba(255,77,79,0.85);border:none;color:#fff;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
          </div>
        `).join('');
        document.getElementById('multiImagePreview').innerHTML = newHtml || '<p style="color:#bbb;font-size:0.85rem">暂无多图</p>';
      }
    }
  } else {
    showToast(result.message || '上传失败', 'error');
  }
  btn.disabled = false;
  btn.textContent = '批量上传';
}

async function deleteCaseImageItem(caseId, imagePath) {
  if (!confirm('确定要删除这张图片吗？')) return;
  const result = await AdminApi.deleteCaseImage(caseId, imagePath);
  if (result.success) {
    showToast('图片已删除', 'success');
    // 刷新预览
    const item = document.querySelector(`.admin-img-item[data-path="${imagePath}"]`);
    if (item) item.remove();
    const container = document.getElementById('multiImagePreview');
    if (container && container.querySelectorAll('.admin-img-item').length === 0) {
      container.innerHTML = '<p style="color:#bbb;font-size:0.85rem">暂无多图，请上传</p>';
    }
  } else {
    showToast(result.message || '删除失败', 'error');
  }
}

async function deleteCase(caseId) {
  if (!confirm('确定要删除这个案例吗？')) return;
  const result = await AdminApi.deleteCase(caseId);
  if (result.success) {
    showToast('案例已删除', 'success');
    await loadCases();
  } else {
    showToast(result.message || '删除失败', 'error');
  }
}

// =============================================
// 5. 线索管理
// =============================================

async function loadLeads() {
  const container = document.getElementById('leadsListContainer');
  const countEl = document.getElementById('leadsCount');

  container.innerHTML = '<div class="admin-loading">加载中...</div>';

  const result = await AdminApi.getLeads();
  if (!result.success) {
    container.innerHTML = '<div class="admin-empty"><p>加载失败</p></div>';
    return;
  }

  const leads = result.data || [];
  countEl.textContent = `共 ${leads.length} 条线索`;

  if (leads.length === 0) {
    container.innerHTML = `
      <div class="admin-empty">
        <div class="empty-icon">📋</div>
        <p>暂无客户线索</p>
      </div>`;
    return;
  }

  let html = `<div class="admin-table-wrap"><table class="admin-table">
    <thead><tr>
      <th>提交时间</th>
      <th>姓名</th>
      <th>手机号</th>
      <th>公司</th>
      <th>驱动类型</th>
      <th>痛点数</th>
      <th>选填套餐</th>
      <th style="width:100px">操作</th>
    </tr></thead><tbody>`;

  leads.forEach(l => {
    const time = l.createdAt || l.timestamp || '';
    const timeStr = time ? new Date(time).toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }) : '-';
    const pains = l.pains || [];
    const painCount = Array.isArray(pains) ? pains.length : 0;
    const driver = l.driver || '-';
    const pkg = l.selectedPackage || '-';

    html += `<tr>
      <td style="white-space:nowrap;font-size:0.8rem;color:#888">${timeStr}</td>
      <td><strong>${escHtml(l.name)}</strong></td>
      <td>${escHtml(l.phone)}</td>
      <td>${escHtml(l.company || '-')}</td>
      <td>${escHtml(driver)}</td>
      <td style="text-align:center">${painCount}</td>
      <td style="font-size:0.85rem">${escHtml(pkg)}</td>
      <td class="admin-actions">
        <button class="admin-btn admin-btn-sm" onclick="viewLeadDetail(${l.id})">👁️ 详情</button>
      </td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function viewLeadDetail(leadId) {
  // 从 AdminApi 重新获取最新数据
  AdminApi.getLeads().then(result => {
    if (!result.success) return;
    const leads = result.data || [];
    const l = leads.find(item => item.id === leadId);
    if (!l) { showToast('线索不存在', 'error'); return; }

    const time = l.createdAt || l.timestamp || '';
    const timeStr = time ? new Date(time).toLocaleString('zh-CN') : '-';
    const pains = l.pains || [];
    const painList = Array.isArray(pains)
      ? pains.map(p => typeof p === 'object' ? (p.text || '') : p).filter(Boolean)
      : [];

    const html = `
      <div style="max-height:60vh;overflow-y:auto;line-height:1.8">
        <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
          <tr><td style="padding:6px 12px;font-weight:600;color:#888;width:80px">姓名</td><td>${escHtml(l.name)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#888">手机</td><td>${escHtml(l.phone)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#888">公司</td><td>${escHtml(l.company || '-')}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#888">备注</td><td>${escHtml(l.note || '-')}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#888">驱动类型</td><td>${escHtml(l.driver || '-')}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#888">选定套餐</td><td>${escHtml(l.selectedPackage || '-')}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#888">痛点</td><td>
            ${painList.length > 0
              ? painList.map(p => `<span class="admin-badge admin-badge-orange" style="margin:2px">${escHtml(p)}</span>`).join('')
              : '-'}
          </td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#888">提交时间</td><td style="font-size:0.85rem;color:#888">${timeStr}</td></tr>
        </table>
      </div>
      <div class="admin-modal-footer">
        <button type="button" class="admin-btn" onclick="closeModal()">关闭</button>
      </div>
    `;

    openModal('👁️ 线索详情', html);
  });
}
