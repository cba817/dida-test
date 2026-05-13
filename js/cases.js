/**
 * cases.js — 案例展示页交互逻辑
 * 从 API 加载案例数据并渲染
 */

(function () {
  'use strict';

  const API_BASE = (() => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3001/api';
    return '/api';
  })();

  let allCases = [];
  let activeFilter = '全部';

  // =============================================
  // DOM 引用
  // =============================================

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const grid = document.getElementById('casesGrid');
  const filterBar = document.getElementById('filterBar');
  const heroStats = document.getElementById('heroStats');
  const loading = document.getElementById('casesLoading');
  const empty = document.getElementById('casesEmpty');

  // 详情弹窗
  const detailOverlay = document.getElementById('casesDetailOverlay');
  const detailContent = document.getElementById('casesDetailContent');

  // 联系表单
  const contactOverlay = document.getElementById('casesContactOverlay');
  const contactForm = document.getElementById('casesLeadForm');
  const contactSuccess = document.getElementById('casesFormSuccess');

  // =============================================
  // API 请求
  // =============================================

  async function fetchCases() {
    const res = await fetch(`${API_BASE}/cases`);
    const data = await res.json();
    return data.success ? (data.data || []) : [];
  }

  async function fetchSite() {
    try {
      const res = await fetch(`${API_BASE}/site`);
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  }

  async function submitLead(leadData) {
    try {
      await fetch(`${API_BASE}/lead/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
    } catch (e) {
      console.warn('[Cases] 提交线索失败:', e);
    }
  }

  // =============================================
  // 渲染
  // =============================================

  /** 提取所有标签用于筛选 */
  function extractTags(cases) {
    const tags = [...new Set(cases.map(c => c.tag).filter(Boolean))];
    return ['全部', ...tags];
  }

  /** 渲染筛选栏 */
  function renderFilters(tags) {
    filterBar.innerHTML = tags.map(tag => `
      <button class="cases-filter-btn ${tag === activeFilter ? 'active' : ''}"
              onclick="window._casesFilter('${tag}')">${tag}</button>
    `).join('');
  }

  /** 渲染案例卡片 */
  function renderCases(cases) {
    if (cases.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    grid.innerHTML = cases.map(c => {
      const hasImage = c.imagePath && c.imagePath.trim();
      return `
      <div class="cases-card" onclick="window._casesOpenDetail(${c.id})">
        <div class="cases-card-image">
          ${hasImage
            ? `<img src="${c.imagePath}" alt="${c.title}" loading="lazy" onerror="this.outerHTML='<span class=\\'img-fallback\\'>${c.imageEmoji || '📊'}</span>'">`
            : `<span class="img-fallback">${c.imageEmoji || '📊'}</span>`
          }
          <span class="cases-card-tag">${c.tag || '案例'}</span>
        </div>
        <div class="cases-card-body">
          <h3>${c.title}</h3>
          <p>${c.desc || ''}</p>
          <div class="cases-card-stats">
            ${c.stat ? `<div class="cases-card-stat"><div class="cases-card-stat-val">${c.stat}</div><div class="cases-card-stat-lbl">${c.statLabel || ''}</div></div>` : ''}
          </div>
          <div class="cases-card-footer">
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); window._casesOpenDetail(${c.id})">查看详情 →</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  /** 渲染 Hero 统计数据 */
  function renderHeroStats(cases) {
    const total = cases.length;
    const tags = [...new Set(cases.map(c => c.tag).filter(Boolean))];
    // 计算总转化提升平均
    const statsHtml = `
      <div class="cases-hero-stat">
        <div class="cases-hero-stat-value">${total}</div>
        <div class="cases-hero-stat-label">成功案例</div>
      </div>
      <div class="cases-hero-stat">
        <div class="cases-hero-stat-value">${tags.length}</div>
        <div class="cases-hero-stat-label">行业覆盖</div>
      </div>
      <div class="cases-hero-stat">
        <div class="cases-hero-stat-value">200%+</div>
        <div class="cases-hero-stat-label">平均增长提升</div>
      </div>
    `;
    heroStats.innerHTML = statsHtml;
  }

  // =============================================
  // Markdown 简易渲染
  // =============================================

  function renderMarkdown(text) {
    if (!text) return '';
    let html = text
      // 转义 HTML
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // ## 标题
      .replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
      // **加粗**
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // - 列表
      .replace(/^- (.+)$/gm, '<li class="md-li">$1</li>')
      // 数字 1. 列表
      .replace(/^\d+\. (.+)$/gm, '<li class="md-li-num">$1</li>')
      // 空行分段
      .replace(/\n\n/g, '</p><p class="md-p">')
      // 非列表行
      .replace(/\n(?!<[hl])/g, '<br>');

    // 包裹列表项
    html = html.replace(/((?:<li[^>]*>.*?<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>');
    html = '<p class="md-p">' + html + '</p>';
    // 清理空 <p> 标签内的 <br>
    html = html.replace(/<p class="md-p"><br><\/p>/g, '');
    return html;
  }

  /** 渲染详情弹窗（含设计方案说明+多图画廊） */
  function renderDetail(c) {
    const hasImage = c.imagePath && c.imagePath.trim();
    const images = c.images || [];
    const hasMultipleImages = images.length > 1;

    // 多图画廊 HTML
    const galleryHtml = images.length > 0 ? `
      <div class="cases-detail-gallery">
        <h3 class="gallery-title">📸 案例展示</h3>
        <div class="gallery-grid">
          ${images.map((img, idx) => `
            <div class="gallery-item" onclick="window._casesOpenLightbox('${img}')">
              <img src="${img}" alt="展示图 ${idx + 1}" loading="lazy"
                   onerror="this.outerHTML='<span class=\\'gallery-fallback\\'>📷</span>'">
            </div>
          `).join('')}
        </div>
      </div>` : '';

    // 设计方案说明 HTML
    const descriptionHtml = c.description ? `
      <div class="cases-detail-section">
        <h3 class="section-title-inline">📋 设计方案说明</h3>
        <div class="design-plan-content">
          ${renderMarkdown(c.description)}
        </div>
      </div>` : '';

    detailContent.innerHTML = `
      <button class="cases-detail-close" onclick="window._casesCloseDetail()">✕</button>
      <div class="cases-detail-image">
        ${hasImage
          ? `<img src="${c.imagePath}" alt="${c.title}" onerror="this.outerHTML='<span class=\\'img-fallback\\'>${c.imageEmoji || '📊'}</span>'"><span class="cases-detail-tag">${c.tag || '案例'}</span>`
          : `<span class="img-fallback">${c.imageEmoji || '📊'}</span><span class="cases-detail-tag">${c.tag || '案例'}</span>`
        }
      </div>
      <div class="cases-detail-body">
        <h2>${c.title}</h2>
        <p class="detail-desc">${c.desc || ''}</p>
        ${c.stat ? `
        <div class="cases-detail-stats">
          <div class="cases-detail-stat">
            <div class="cases-detail-stat-val">${c.stat}</div>
            <div class="cases-detail-stat-lbl">${c.statLabel || '提升'}</div>
          </div>
        </div>` : ''}

        ${descriptionHtml}

        ${galleryHtml}

        <div class="detail-cta">
          <button class="btn btn-primary" onclick="window._casesOpenContact('${c.title}')">🚀 获取同款方案</button>
          <button class="btn btn-outline" onclick="window._casesCloseDetail()">关闭</button>
        </div>
      </div>
    `;
    detailOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  // =============================================
  // 图片 Lightbox
  // =============================================

  let lightboxEl = null;

  window._casesOpenLightbox = function (src) {
    if (!lightboxEl) {
      lightboxEl = document.createElement('div');
      lightboxEl.className = 'cases-lightbox';
      lightboxEl.innerHTML = '<button class="cases-lightbox-close">&times;</button><div class="cases-lightbox-content"><img src="" alt="大图"></div>';
      lightboxEl.addEventListener('click', (e) => {
        if (e.target === lightboxEl || e.target.classList.contains('cases-lightbox-close')) {
          lightboxEl.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
      document.body.appendChild(lightboxEl);
    }
    const img = lightboxEl.querySelector('img');
    img.src = src;
    lightboxEl.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  // =============================================
  // 全局函数（供 onclick 调用）
  // =============================================

  /** 筛选 */
  window._casesFilter = function (tag) {
    activeFilter = tag;
    renderFilters(extractTags(allCases));

    const filtered = tag === '全部' ? allCases : allCases.filter(c => c.tag === tag);
    renderCases(filtered);
    // 滚动到网格区域
    document.querySelector('.cases-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /** 打开详情 */
  window._casesOpenDetail = function (id) {
    const c = allCases.find(item => item.id === id);
    if (c) renderDetail(c);
  };

  /** 关闭详情 */
  window._casesCloseDetail = function () {
    detailOverlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  /** 打开联系表单 */
  window._casesOpenContact = function (caseTitle) {
    const title = document.getElementById('casesContactTitle');
    if (title) title.textContent = caseTitle ? `预约咨询：${caseTitle}` : '获取增长方案';
    if (contactOverlay) {
      contactOverlay.classList.add('open');
      if (contactForm) contactForm.style.display = 'block';
      if (contactSuccess) contactSuccess.classList.remove('open');
    }
  };

  /** 关闭联系表单 */
  window._casesCloseContact = function () {
    if (contactOverlay) contactOverlay.classList.remove('open');
  };

  // =============================================
  // 初始化
  // =============================================

  async function init() {
    // 加载站点信息（页面标题等）
    const site = await fetchSite();
    if (site && site.siteName) {
      document.title = site.siteName + ' | 成功案例';
    }

    // 加载案例数据
    allCases = await fetchCases();

    // 按 sortOrder 排序
    allCases.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));

    // 隐藏加载状态
    if (loading) loading.style.display = 'none';

    // 渲染 Hero 统计
    renderHeroStats(allCases);

    // 渲染筛选栏
    const tags = extractTags(allCases);
    renderFilters(tags);

    // 渲染卡片
    renderCases(allCases);

    // 详情弹窗：点击遮罩关闭
    detailOverlay.addEventListener('click', (e) => {
      if (e.target === detailOverlay) window._casesCloseDetail();
    });

    // 联系弹窗
    if (contactOverlay) {
      contactOverlay.addEventListener('click', (e) => {
        if (e.target === contactOverlay) window._casesCloseContact();
      });
    }

    // 联系表单提交
    if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = contactForm.querySelector('#casesLeadName')?.value?.trim();
        const phone = contactForm.querySelector('#casesLeadPhone')?.value?.trim();
        const company = contactForm.querySelector('#casesLeadCompany')?.value?.trim() || '';
        const note = contactForm.querySelector('#casesLeadNote')?.value?.trim() || '';

        // 简单校验
        let valid = true;
        if (!name) { valid = false; showContactError('casesNameError', '请填写姓名'); }
        else { hideContactError('casesNameError'); }

        if (!phone) { valid = false; showContactError('casesPhoneError', '请填写手机号'); }
        else if (!/^1[3-9]\d{9}$/.test(phone)) { valid = false; showContactError('casesPhoneError', '请填写正确手机号'); }
        else { hideContactError('casesPhoneError'); }

        if (!valid) return;

        await submitLead({ name, phone, company, note, timestamp: new Date().toISOString() });

        contactForm.style.display = 'none';
        if (contactSuccess) contactSuccess.classList.add('open');
      });
    }
  }

  function showContactError(id, msg) {
    const el = document.getElementById(id);
    const input = el?.previousElementSibling;
    if (input) input.classList.add('error');
    if (el) { el.textContent = msg; el.classList.add('visible'); }
  }
  function hideContactError(id) {
    const el = document.getElementById(id);
    const input = el?.previousElementSibling;
    if (input) input.classList.remove('error');
    if (el) el.classList.remove('visible');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
