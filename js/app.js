/**
 * app.js — 核心应用逻辑
 * 负责渲染三步诊断流程、报告页、成功案例等
 */

(function () {
  'use strict';

  const state = window.AppState;
  const api = window.apiService;

  // === DOM 引用 ===
  const $ = (sel) => document.querySelector(sel);
  const app = document.getElementById('app');

  // ==========================================
  // 1. 导航栏与主题
  // ==========================================

  /** 更新 Logo 和站点名称 */
  function updateSiteBranding() {
    const site = state.getSite();
    const logoText = document.querySelector('.logo-text');
    const logoIcon = document.querySelector('.logo-icon');
    if (logoText && site) {
      logoText.innerHTML = `${site.logoText || '空间增长'}<span class="logo-accent">${site.logoAccent || '系统'}</span>`;
    }
    // 如果有上传的logo图片，替换图标
    if (logoIcon && site && site.logoPath) {
      logoIcon.innerHTML = `<img src="${site.logoPath}" alt="Logo" style="width:100%;height:100%;object-fit:contain;border-radius:6px">`;
      logoIcon.style.background = 'none';
    }
    // 更新页面标题
    if (site && site.siteName) {
      document.title = site.siteName + ' | 全案诊断';
    }
  }

  /** 汉堡菜单切换 */
  function setupNav() {
    const hamburger = document.getElementById('hamburgerBtn');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
      });
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('active');
          navLinks.classList.remove('open');
        });
      });
    }

    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', state.toggleTheme);
    }

    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
          backToTop.classList.add('visible');
        } else {
          backToTop.classList.remove('visible');
        }
      });
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // ==========================================
  // 2. 渲染引擎
  // ==========================================

  let lastStep = null;

  function render() {
    const s = state.get();
    const config = state.getConfig();

    let html = '';

    if (s.step === 1) {
      html = renderStep1(config);
    } else if (s.step === 2) {
      html = renderStep2(config, s);
    } else if (s.step === 3) {
      html = renderStep3(s);
    }

    app.innerHTML = html;

    if (lastStep !== null && s.step !== lastStep) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    lastStep = s.step;
  }

  // ==========================================
  // 2.1 痛点勾选局部更新（不触发全量render）
  // ==========================================

  function updatePainItemUI(painId, isSelected) {
    const items = document.querySelectorAll('.check-item');
    items.forEach(item => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (!checkbox) return;
      const onclickAttr = item.getAttribute('onclick') || '';
      const escapedId = painId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const exactMatchPattern = new RegExp(`&quot;id&quot;:&quot;${escapedId}&quot;`);
      if (exactMatchPattern.test(onclickAttr)) {
        if (isSelected) {
          item.classList.add('checked');
          checkbox.checked = true;
        } else {
          item.classList.remove('checked');
          checkbox.checked = false;
        }
      }
    });
    const countEl = document.getElementById('selectedCount');
    if (countEl) {
      countEl.textContent = state.get().pains.length;
    }
  }

  const originalTogglePain = state.togglePain;
  let skipNextRender = false;

  state.togglePain = function(pain) {
    const s = state.get();
    const painId = typeof pain === 'object' ? pain.id : pain;
    const painText = typeof pain === 'object' ? pain.text : pain;

    const wasSelected = s.pains.some(p => {
      if (typeof p === 'object') return p.id === painId || p.text === painText;
      return p === painText;
    });

    if (s.step === 2) {
      skipNextRender = true;
    }

    originalTogglePain(pain);

    if (s.step === 2) {
      updatePainItemUI(painId, !wasSelected);
    }
  };

  // ==========================================
  // 3. 第1步：选择驱动
  // ==========================================

  const painKeywordsRow1 = ['获客成本高', '产品同质化', '渠道冲突', '用户流失', '成交周期长', '品牌势能弱'];
  const painKeywordsRow2 = ['团队执行力差', '私域运营难', '差异化不足', '复购率低', '招商困难', '转化效率低'];
  const painKeywordsRow3 = ['价格战泥潭', '库存积压', '会员活跃度低', '口碑传播弱', '获客成本高', '产品同质化'];

  function renderKeywordRow(keywords, rowClass) {
    const allKeywords = [...keywords, ...keywords];
    return `
      <div class="pain-tags-row ${rowClass}">
        ${allKeywords.map(keyword => `
          <span class="pain-tag-flow">${keyword}</span>
        `).join('')}
      </div>
    `;
  }

  function renderStep1(config) {
    const site = state.getSite();
    return `
      <section class="hero container">
        <h1>${site.siteName || '让空间成为第一位销售'}</h1>
        <p class="subtitle">${site.siteDescription || '基于《商战思维》方法论，诊断您的企业增长破局点'}</p>
        <div class="grid">
          ${config.drivers.map(d => `
            <div class="card" onclick="AppState.selectDriver('${d.id}')">
              <div class="card-icon">${d.icon}</div>
              <h3>${d.title}</h3>
              <p>${d.desc}</p>
            </div>
          `).join('')}
        </div>
        <div class="pain-tags-3d-container">
          <div class="pain-tags-3d-title">💡 我们将帮您解决这些增长难题</div>
          <div class="pain-tags-marquee-wrapper">
            ${renderKeywordRow(painKeywordsRow1, 'row-1')}
            ${renderKeywordRow(painKeywordsRow2, 'row-2')}
            ${renderKeywordRow(painKeywordsRow3, 'row-3')}
          </div>
        </div>
      </section>
    `;
  }

  // ==========================================
  // 4. 第2步：选择痛点
  // ==========================================

  function renderStep2(config, s) {
    const driverPains = state.getDriverPains(s.driverId) || [];
    const painsToRender = driverPains.length > 0 ? driverPains : config.pains.map(text => ({ id: text, text }));

    const driverTitles = {
      'PRODUCT': '产品驱动型企业',
      'CHANNEL': '渠道依赖型企业',
      'USER': '关系网络型企业'
    };

    const driverTitle = driverTitles[s.driverId] || '企业';

    return `
      <section class="container">
        <div style="text-align:center">
          <h2 class="section-title">识别核心痛点</h2>
          <p class="section-subtitle">${driverTitle}专属诊断 — 请勾选您当前最急需解决的增长难题（可多选）</p>
        </div>

        <div class="checkbox-group">
          ${painsToRender.map(p => {
            const painText = p.text;
            const painId = p.id;
            const isChecked = s.pains.some(selected => {
              if (typeof selected === 'object') {
                return selected.id === painId || selected.text === painText;
              }
              return selected === painText;
            });
            const checkedClass = isChecked ? 'checked' : '';
            const painObj = JSON.stringify(p).replace(/"/g, '&quot;');
            return `
              <label class="check-item ${checkedClass}" onclick="AppState.togglePain(${painObj})">
                <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="event.stopPropagation(); AppState.togglePain(${painObj})">
                <span>${painText}</span>
              </label>
            `;
          }).join('')}
        </div>

        <div class="pain-count" id="painCount">
          已选择 <strong id="selectedCount">${s.pains.length}</strong> 个痛点
        </div>

        <div style="text-align:center; margin-top:40px; display:flex; flex-direction:column; align-items:center; gap:12px">
          <button class="btn btn-primary" onclick="window.appGoToStep3()">生成增长方案报告 🚀</button>
          <button class="btn btn-secondary btn-sm" onclick="AppState.reset()">← 重新选择驱动</button>
        </div>

        <div style="text-align:center; margin-top:16px; color:var(--text-dim); font-size:0.8rem" id="painReminder"></div>
      </section>
    `;
  }

  // ==========================================
  // 5. 第3步：诊断报告 + 套餐
  // ==========================================

  function renderStep3(s) {
    const advice = state.generateAdvice();

    return `
      <section class="container">
        <!-- 诊断报告 -->
        <div class="report-card">
          <h2>📋 您的空间增长诊断报告</h2>
          <div class="report-meta">
            <span class="report-tag">🎯 驱动类型：${s.driver}</span>
            ${s.pains.map(p => {
              const painText = typeof p === 'object' ? p.text : p;
              return `<span class="report-tag">🔴 ${painText}</span>`;
            }).join('')}
          </div>
          <div class="report-body">
            ${advice.split('\n').map(line => {
              if (line.startsWith('**')) {
                return `<p style="margin-top:16px;font-weight:600;color:var(--text-main)">${line.replace(/\*\*/g, '')}</p>`;
              }
              if (line.startsWith('- **')) {
                const match = line.match(/- \*\*(.+?)\*\*：(.+)/);
                if (match) {
                  return `<p style="margin:8px 0;padding-left:16px;border-left:2px solid var(--color-accent)"><strong>${match[1]}</strong>：${match[2]}</p>`;
                }
              }
              return line ? `<p style="margin:8px 0">${line}</p>` : '';
            }).join('')}
          </div>
          <div class="report-cta">
            <button class="btn btn-primary" onclick="window.openContactModal()">🚀 获取专属增长方案</button>
          </div>
        </div>

        <!-- 套餐系统 -->
        <div id="packages">
          <h2 class="section-title">把钱赚清楚：针对性落地套餐</h2>
          <p class="section-subtitle">我们不设计一面墙，我们设计您的商业增长路径</p>

          <div class="package-grid">
            ${renderPackages(s.pains.length)}
          </div>
        </div>

        <!-- 成功案例 -->
        ${renderCaseStudies()}

        <!-- 方法论 -->
        ${renderMethodology()}

        <!-- 信任标识 -->
        ${renderTrustSection()}

        <!-- 导航按钮 -->
        <div style="text-align:center; margin-top:60px; display:flex; flex-direction:column; align-items:center; gap:12px">
          <button class="btn btn-secondary" onclick="AppState.patch({ step: 2, pains: [] })">← 重新选择痛点</button>
          <button class="btn btn-outline btn-sm" onclick="AppState.reset()">🔄 重新开始诊断</button>
        </div>
      </section>
    `;
  }

  // ==========================================
  // 6. 套餐渲染（动态数据 + fallback）
  // ==========================================

  // 硬编码的 fallback 套餐数据
  const FALLBACK_PACKAGES = [
    {
      id: 'pkg_basic', title: '🟢 基础信任系统', icon: '🟢',
      price: '¥6,800', priceNote: '起',
      featuredThreshold: { minPains: 1, maxPains: 3 },
      resultTitle: '交付结果',
      resultItems: ['品牌正规化感官提升', '消除初访客户的基本不信任感'],
      features: ['LOGO立体视觉系统', '品牌主色调标准应用', '超级标语墙设计', '基础灯光氛围方案']
    },
    {
      id: 'pkg_conversion', title: '🔵 成交转化系统', icon: '🔵',
      price: '¥18,800', priceNote: '',
      featuredThreshold: { minPains: 4, maxPains: 6 },
      resultTitle: '核心增长结果',
      resultItems: ['转化率提升 10%-40%', '降低沟通成本，缩短成交周期'],
      features: [
        '<strong>品牌故事墙：</strong>建立信任背书',
        '<strong>业务可视化：</strong>降低解释成本',
        '<strong>成交话术嵌入：</strong>墙面即销售辅助',
        '<strong>客户案例墙：</strong>自动化说服逻辑'
      ]
    },
    {
      id: 'pkg_premium', title: '🔴 空间增长全案', icon: '🔴',
      price: '¥58,000', priceNote: '+',
      featuredThreshold: { minPains: 7, maxPains: 10 },
      resultTitle: '核心增长结果',
      resultItems: ['空间自带流量，成为内容工厂', '品牌溢价倍增，招商利器'],
      features: [
        '<strong>客户参观动线：</strong>剧场版路径设计',
        '<strong>沉浸式体验区：</strong>应用场景模拟',
        '<strong>短视频场景墙：</strong>自带抖音传播基因',
        '<strong>IP化视觉全案：</strong>品牌人格化打造'
      ]
    }
  ];

  function renderPackages(painCount) {
    // 尝试从远程数据获取套餐
    let pkgs = state.getPackages();
    // fallback 到硬编码
    if (!pkgs || pkgs.length === 0) {
      pkgs = FALLBACK_PACKAGES;
    }

    // 根据痛点数量确定主推套餐
    let featuredPkg = null;
    for (const pkg of pkgs) {
      const th = pkg.featuredThreshold || { minPains: 1, maxPains: 99 };
      if (painCount >= th.minPains && painCount <= th.maxPains) {
        featuredPkg = pkg;
        break;
      }
    }
    // 如果没匹配到，默认推荐第一个
    if (!featuredPkg && pkgs.length > 0) {
      featuredPkg = pkgs[0];
    }

    return pkgs.map(p => {
      const isFeatured = featuredPkg && p.id === featuredPkg.id;
      const pkgTitle = p.title || '';
      const pkgPrice = p.price || '¥0';
      const pkgPriceNote = p.priceNote || '';
      const resultTitle = p.resultTitle || '交付结果';
      const resultItems = p.resultItems || [];
      const features = p.features || [];

      return `
      <div class="pkg-card ${isFeatured ? 'featured' : ''}">
        ${isFeatured ? '<div class="pkg-badge">🏆 主推方案</div>' : ''}
        <h3>${pkgTitle}</h3>
        <div class="pkg-price">${pkgPrice}${pkgPriceNote ? `<span> ${pkgPriceNote}</span>` : ''}</div>
        <div class="pkg-result">
          <strong>${resultTitle}：</strong>
          <p>${resultItems.map(i => `✔ ${i}`).join('<br>')}</p>
        </div>
        <ul class="feature-list">
          ${features.map(f => `<li>${f}</li>`).join('')}
        </ul>
        <button class="btn btn-primary" onclick="window.openContactModal('${pkgTitle.replace(/['"]/g, '')}')">立即预约诊断</button>
      </div>`;
    }).join('');
  }

  // ==========================================
  // 7. 成功案例渲染（动态数据 + fallback）
  // ==========================================

  // 硬编码的 fallback 案例数据
  const FALLBACK_CASES = [
    { tag: '企业服务', title: '某SaaS企业总部空间升级', desc: '通过空间动线设计，将客户参访转化率从12%提升至45%', stat: '275%', statLabel: '转化提升', imagePath: '', imageEmoji: '📊' },
    { tag: '零售消费', title: '某连锁品牌旗舰店重塑', desc: '沉浸式体验空间设计，单店月均客流增长300%', stat: '300%', statLabel: '客流增长', imagePath: '', imageEmoji: '🛍️' },
    { tag: 'B2B制造', title: '某工业设备企业展厅改造', desc: '展厅升级后，大客户签约周期从6个月缩短至45天', stat: '75%', statLabel: '周期缩短', imagePath: '', imageEmoji: '🏭' }
  ];

  function renderCaseStudies() {
    // 尝试从远程数据获取案例
    let cases = state.getCases();
    // fallback 到硬编码
    if (!cases || cases.length === 0) {
      cases = FALLBACK_CASES;
    }
    // 存储到全局供弹窗使用
    window._homeCasesData = cases;

    return `
      <section id="case-studies" style="margin-top:80px">
        <h2 class="section-title">成功案例</h2>
        <p class="section-subtitle">我们用空间思维帮助了众多企业实现增长突破</p>
        <div class="case-grid">
          ${cases.map(c => `
            <div class="case-card" style="cursor:default">
              <div class="case-image">
                ${c.imagePath
                  ? `<img src="${c.imagePath}" alt="${c.title}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span style="opacity:0.3;display:none">${c.imageEmoji || '📊'}</span>`
                  : `<span style="opacity:0.3">${c.imageEmoji || '📊'}</span>`
                }
              </div>
              <div class="case-body">
                <span class="case-tag">${c.tag}</span>
                <h4>${c.title}</h4>
                <p>${c.desc}</p>
                <div class="case-result">
                  <div class="case-stat">
                    <div class="case-stat-value">${c.stat}</div>
                    <div class="case-stat-label">${c.statLabel}</div>
                  </div>
                </div>
                <button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="window._openHomeCaseDetail(${c.id})">查看详情 →</button>
              </div>
            </div>`).join('')}
        </div>
      </section>
    `;
  }

  // ==========================================
  // 8. 方法论
  // ==========================================

  function renderMethodology() {
    const items = [
      { num: '01', title: '诊断调研', desc: '深入分析企业增长瓶颈，精准定位空间策略的切入点' },
      { num: '02', title: '空间策略设计', desc: '基于商战思维，设计从"好看"到"好卖"的空间增长路径' },
      { num: '03', title: '落地实施', desc: '专业施工团队保障方案100%还原，配套销售话术培训' }
    ];

    return `
      <section id="methodology" style="margin-top:80px">
        <h2 class="section-title">我们的方法论</h2>
        <p class="section-subtitle">基于《商战思维》的三大核心步骤</p>
        <div class="methodology-grid">
          ${items.map(item => `
            <div class="methodology-card">
              <div class="methodology-num">${item.num}</div>
              <h4>${item.title}</h4>
              <p>${item.desc}</p>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  // ==========================================
  // 9. 信任标识
  // ==========================================

  function renderTrustSection() {
    return `
      <div class="trust-banner">
        <h3>合作品牌</h3>
        <div class="trust-logos">
          <span class="trust-logo">华为云</span>
          <span class="trust-logo">腾讯云</span>
          <span class="trust-logo">阿里巴巴</span>
          <span class="trust-logo">字节跳动</span>
          <span class="trust-logo">美团</span>
        </div>

        <div class="testimonial-card">
          <div class="testimonial-text">空间增长系统帮我们把展厅变成了最强的销售团队，客单价提升了60%。</div>
          <div class="testimonial-author">
            <div class="testimonial-avatar">张</div>
            <div>
              <div class="testimonial-name">张伟</div>
              <div class="testimonial-role">某科技公司 CEO</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // 10. 联系人 Modal
  // ==========================================

  function setupContactModal() {
    const overlay = document.getElementById('contactModal');
    const closeBtn = overlay?.querySelector('.modal-close');
    const form = overlay?.querySelector('#leadForm');
    const success = overlay?.querySelector('.form-success');

    if (!overlay) return;

    const closeModal = () => {
      overlay.classList.remove('open');
      if (form) form.style.display = 'block';
      if (success) success.classList.remove('open');
      if (form) form.reset();
      overlay.querySelectorAll('.form-error').forEach(el => el.classList.remove('visible'));
      overlay.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    };

    closeBtn?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let valid = true;

        const name = form.querySelector('#leadName');
        const phone = form.querySelector('#leadPhone');
        const nameError = form.querySelector('#nameError');
        const phoneError = form.querySelector('#phoneError');

        if (!name.value.trim()) {
          name.classList.add('error');
          nameError.textContent = '请填写您的姓名';
          nameError.classList.add('visible');
          valid = false;
        } else {
          name.classList.remove('error');
          nameError.classList.remove('visible');
        }

        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phone.value.trim()) {
          phone.classList.add('error');
          phoneError.textContent = '请填写您的手机号';
          phoneError.classList.add('visible');
          valid = false;
        } else if (!phoneRegex.test(phone.value.trim())) {
          phone.classList.add('error');
          phoneError.textContent = '请填写正确的11位手机号';
          phoneError.classList.add('visible');
          valid = false;
        } else {
          phone.classList.remove('error');
          phoneError.classList.remove('visible');
        }

        if (!valid) return;

        const s = state.get();
        const leadData = {
          name: name.value.trim(),
          phone: phone.value.trim(),
          company: form.querySelector('#leadCompany')?.value?.trim() || '',
          note: form.querySelector('#leadNote')?.value?.trim() || '',
          driver: s.driver,
          driverId: s.driverId,
          pains: s.pains,
          selectedPackage: form.dataset.selectedPkg || '',
          timestamp: new Date().toISOString()
        };

        state.setContactInfo({
          name: leadData.name,
          phone: leadData.phone,
          company: leadData.company,
          note: leadData.note
        });

        const result = await api.captureLead(leadData);

        if (form) form.style.display = 'none';
        if (success) {
          success.classList.add('open');
          success.querySelector('h4').textContent = '🎉 预约成功！';
          success.querySelector('p').textContent = '感谢您的信任！我们的专业顾问将在24小时内与您联系，为您定制专属增长方案。';
        }

        api.submitDiagnosis({
          driver: leadData.driver,
          driverId: leadData.driverId,
          pains: leadData.pains
        });
      });
    }
  }

  window.openContactModal = (pkgName) => {
    const overlay = document.getElementById('contactModal');
    if (overlay) {
      overlay.classList.add('open');
      const form = overlay.querySelector('#leadForm');
      const success = overlay.querySelector('.form-success');
      if (form) {
        form.style.display = 'block';
        form.dataset.selectedPkg = pkgName || '';
      }
      if (success) success.classList.remove('open');
      const title = overlay.querySelector('.modal-header h3');
      if (title) {
        title.textContent = pkgName ? `预约咨询：${pkgName}` : '获取专属增长方案';
      }
    }
  };

  window.appGoToStep3 = () => {
    const s = state.get();
    if (s.pains.length === 0) {
      const reminder = document.getElementById('painReminder');
      if (reminder) {
        reminder.textContent = '⚠️ 请至少选择一个痛点进行诊断';
        reminder.style.color = 'var(--color-danger)';
        setTimeout(() => { reminder.textContent = ''; }, 2500);
      }
      return;
    }
    state.set('step', 3);
  };

  // ==========================================
  // 11. 初始化
  // ==========================================

  async function init() {
    setupNav();
    setupContactModal();

    // 加载远程数据（等待完成后更新品牌标识）
    try {
      await state.initRemoteData();
    } catch (e) {
      console.warn('[App] 远程数据加载失败，使用本地数据', e);
    }
    updateSiteBranding();

    // 订阅状态变化，自动重新渲染
    state.subscribe(() => {
      if (skipNextRender) {
        skipNextRender = false;
        return;
      }
      render();
    });
  }

  // ==========================================
  // 案例详情弹窗（首页内联展示）
  // ==========================================

  function renderMd(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li class="md-li">$1</li>')
      .replace(/\n\n/g, '</p><p class="md-p">')
      .replace(/\n(?!<[hl])/g, '<br>');
    html = html.replace(/((?:<li[^>]*>.*?<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>');
    html = '<p class="md-p">' + html + '</p>';
    html = html.replace(/<p class="md-p"><br><\/p>/g, '');
    return html;
  }

  window._openHomeCaseDetail = function (id) {
    const cases = window._homeCasesData || [];
    const c = cases.find(item => item.id === id);
    if (!c) return;

    const hasImage = c.imagePath && c.imagePath.trim();
    const images = c.images || [];
    const galleryHtml = images.length > 0 ? `
      <div class="cases-detail-gallery" style="margin:16px 0">
        <h3 class="gallery-title">📸 案例展示</h3>
        <div class="gallery-carousel">
          <button class="carousel-btn carousel-prev" onclick="window._carouselPrev()" aria-label="上一张">‹</button>
          <div class="carousel-track" id="_carouselTrack">
            ${images.map((img, idx) => `
              <div class="carousel-slide${idx === 0 ? ' active' : ''}" data-index="${idx}">
                <img src="${img}" alt="展示图 ${idx + 1}" onclick="window._openCaseLightbox(${idx})" loading="lazy" onerror="this.outerHTML='<div class=\\'carousel-fallback\\'>📷</div>'">
              </div>`).join('')}
          </div>
          <button class="carousel-btn carousel-next" onclick="window._carouselNext()" aria-label="下一张">›</button>
        </div>
        <div class="carousel-dots">
          ${images.map((_, idx) => `<span class="carousel-dot${idx === 0 ? ' active' : ''}" onclick="window._carouselGoTo(${idx})"></span>`).join('')}
        </div>
      </div>` : '';

    const descriptionHtml = c.description ? `
      <div class="cases-detail-section">
        <h3 class="section-title-inline">📋 设计方案说明</h3>
        <div class="design-plan-content">${renderMd(c.description)}</div>
      </div>` : '';

    const overlay = document.getElementById('homeCasesDetailOverlay');
    const content = document.getElementById('homeCasesDetailContent');

    content.innerHTML = `
      <button class="cases-detail-close" onclick="window._closeHomeCaseDetail()">✕</button>
      <div class="cases-detail-image">
        ${hasImage
          ? `<img src="${c.imagePath}" alt="${c.title}" onerror="this.outerHTML='<span class=\\"img-fallback\\">${c.imageEmoji || '📊'}</span>'"><span class="cases-detail-tag">${c.tag || '案例'}</span>`
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
          <button class="btn btn-primary" onclick="window.openContactModal('${c.title}')">🚀 获取同款方案</button>
          <button class="btn btn-outline" onclick="window._closeHomeCaseDetail()">关闭</button>
        </div>
      </div>
    `;

    // 存储轮播图片数据
    window._galleryImages = c.images || [];
    window._galleryCurrent = 0;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  // 轮播导航
  window._carouselPrev = function () {
    const imgs = window._galleryImages || [];
    if (imgs.length < 2) return;
    window._galleryCurrent = (window._galleryCurrent - 1 + imgs.length) % imgs.length;
    _updateCarousel();
  };

  window._carouselNext = function () {
    const imgs = window._galleryImages || [];
    if (imgs.length < 2) return;
    window._galleryCurrent = (window._galleryCurrent + 1) % imgs.length;
    _updateCarousel();
  };

  window._carouselGoTo = function (idx) {
    window._galleryCurrent = idx;
    _updateCarousel();
  };

  function _updateCarousel() {
    const track = document.getElementById('_carouselTrack');
    if (!track) return;
    const slides = track.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    slides.forEach((s, i) => s.classList.toggle('active', i === window._galleryCurrent));
    dots.forEach((d, i) => d.classList.toggle('active', i === window._galleryCurrent));
  }

  window._closeHomeCaseDetail = function () {
    const overlay = document.getElementById('homeCasesDetailOverlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  // 案例 Lightbox（支持左右导航）
  window._openCaseLightbox = function (idx) {
    const images = window._galleryImages || [];
    if (images.length === 0) return;

    let lb = document.getElementById('_homeCaseLightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = '_homeCaseLightbox';
      lb.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.92);z-index:5000;cursor:zoom-out';
      lb.innerHTML = `
        <button class="lb-close" id="_homeCaseLbClose">&times;</button>
        <button class="lb-nav lb-prev" id="_homeCaseLbPrev" aria-label="上一张">‹</button>
        <div class="lb-content" id="_homeCaseLbContent">
          <img src="" alt="大图" id="_homeCaseLbImg">
          <div class="lb-counter" id="_homeCaseLbCounter"></div>
        </div>
        <button class="lb-nav lb-next" id="_homeCaseLbNext" aria-label="下一张">›</button>
      `;
      lb.addEventListener('click', (e) => {
        if (e.target === lb || e.target.id === '_homeCaseLbClose') {
          lb.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
      document.body.appendChild(lb);

      // 键盘支持
      document.addEventListener('keydown', (e) => {
        if (lb.style.display !== 'flex') return;
        if (e.key === 'Escape') { lb.style.display = 'none'; document.body.style.overflow = ''; }
        if (e.key === 'ArrowLeft') document.getElementById('_homeCaseLbPrev').click();
        if (e.key === 'ArrowRight') document.getElementById('_homeCaseLbNext').click();
      });
    }

    window._lbCurrent = idx;
    _updateLightbox();
    lb.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  function _updateLightbox() {
    const images = window._galleryImages || [];
    const idx = window._lbCurrent || 0;
    const img = document.getElementById('_homeCaseLbImg');
    const counter = document.getElementById('_homeCaseLbCounter');
    const prev = document.getElementById('_homeCaseLbPrev');
    const next = document.getElementById('_homeCaseLbNext');

    if (!img) return;
    img.src = images[idx];

    if (counter) counter.textContent = `${idx + 1} / ${images.length}`;
    if (prev) prev.style.display = images.length > 1 ? '' : 'none';
    if (next) next.style.display = images.length > 1 ? '' : 'none';

    // 重新绑定导航点击
    if (prev) {
      prev.onclick = (e) => {
        e.stopPropagation();
        window._lbCurrent = (window._lbCurrent - 1 + images.length) % images.length;
        _updateLightbox();
      };
    }
    if (next) {
      next.onclick = (e) => {
        e.stopPropagation();
        window._lbCurrent = (window._lbCurrent + 1) % images.length;
        _updateLightbox();
      };
    }
  };

  // 点击遮罩关闭
  document.addEventListener('click', (e) => {
    if (e.target.id === 'homeCasesDetailOverlay') {
      window._closeHomeCaseDetail();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
