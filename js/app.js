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

  /** 汉堡菜单切换 */
  function setupNav() {
    const hamburger = document.getElementById('hamburgerBtn');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
      });
      // 点击导航链接后关闭菜单
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('active');
          navLinks.classList.remove('open');
        });
      });
    }

    // 主题切换
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', state.toggleTheme);
    }

    // 回到顶部按钮
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

  // 记录上一次的 step，用于判断是否需要滚动
  let lastStep = null;

  function render() {
    const s = state.get();
    const config = state.getConfig();

    // 保存当前滚动位置，防止同一步骤内 DOM 替换导致的跳动
    const scrollPos = window.scrollY;
    const scrollHeightBefore = document.documentElement.scrollHeight;

    let html = '';

    if (s.step === 1) {
      html = renderStep1(config);
    } else if (s.step === 2) {
      html = renderStep2(config, s);
    } else if (s.step === 3) {
      html = renderStep3(s);
    }

    app.innerHTML = html;
    
    // 只有在步骤切换时（step 值变化）才平滑滚动到顶部
    if (lastStep !== null && s.step !== lastStep) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (lastStep !== null && s.step === lastStep) {
      // 同一步骤内：恢复滚动位置，防止 DOM 替换导致的跳动
      // 如果内容高度变化，按比例恢复位置
      const scrollHeightAfter = document.documentElement.scrollHeight;
      const ratio = scrollHeightBefore > 0 ? scrollHeightAfter / scrollHeightBefore : 1;
      window.scrollTo(0, Math.min(scrollPos * ratio, scrollHeightAfter));
    }
    lastStep = s.step;
  }

  // ==========================================
  // 3. 第1步：选择驱动
  // ==========================================

  // 三排错落滚动痛点关键词列表
  const painKeywordsRow1 = ['获客成本高', '产品同质化', '渠道冲突', '用户流失', '成交周期长', '品牌势能弱'];
  const painKeywordsRow2 = ['团队执行力差', '私域运营难', '差异化不足', '复购率低', '招商困难', '转化效率低'];
  const painKeywordsRow3 = ['价格战泥潭', '库存积压', '会员活跃度低', '口碑传播弱', '获客成本高', '产品同质化'];

  // 生成一排关键词的HTML
  function renderKeywordRow(keywords, rowClass) {
    // 复制一份用于无缝滚动
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
    return `
      <section class="hero container">
        <h1>让空间成为第一位销售</h1>
        <p class="subtitle">基于《商战思维》方法论，诊断您的企业增长破局点</p>
        <div class="grid">
          ${config.drivers.map(d => `
            <div class="card" onclick="AppState.selectDriver('${d.id}')">
              <div class="card-icon">${d.icon}</div>
              <h3>${d.title}</h3>
              <p>${d.desc}</p>
            </div>
          `).join('')}
        </div>
        
        <!-- 三排错落滚动痛点关键词展示 -->
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
    // 获取当前驱动类型的专属痛点列表
    const driverPains = state.getDriverPains(s.driverId) || [];
    
    // 如果有专属痛点，使用专属痛点；否则回退到通用痛点
    const painsToRender = driverPains.length > 0 ? driverPains : config.pains.map(text => ({ id: text, text }));
    
    // 驱动类型标题映射
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
            // 检查是否已选中（支持对象格式和字符串格式）
            const isChecked = s.pains.some(selected => {
              if (typeof selected === 'object') {
                return selected.id === painId || selected.text === painText;
              }
              return selected === painText;
            });
            const checkedClass = isChecked ? 'checked' : '';
            // 传递完整对象给 togglePain
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
            ${renderPackages()}
          </div>
        </div>

        <!-- 成功案例 -->
        ${renderCaseStudiesPlaceholder()}

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
  // 6. 套餐渲染
  // ==========================================

  function renderPackages() {
    const pkgs = [
      {
        title: '🟢 基础信任系统',
        price: '¥6,800',
        priceNote: '起',
        featured: false,
        result: { title: '交付结果', items: ['品牌正规化感官提升', '消除初访客户的基本不信任感'] },
        features: ['LOGO立体视觉系统', '品牌主色调标准应用', '超级标语墙设计', '基础灯光氛围方案']
      },
      {
        title: '🔵 成交转化系统',
        price: '¥18,800',
        priceNote: '',
        featured: true,
        badge: '🏆 主推方案',
        result: { title: '核心增长结果', items: ['转化率提升 10%-40%', '降低沟通成本，缩短成交周期'] },
        features: [
          '<strong>品牌故事墙：</strong>建立信任背书',
          '<strong>业务可视化：</strong>降低解释成本',
          '<strong>成交话术嵌入：</strong>墙面即销售辅助',
          '<strong>客户案例墙：</strong>自动化说服逻辑'
        ]
      },
      {
        title: '🔴 空间增长全案',
        price: '¥58,000',
        priceNote: '+',
        featured: false,
        result: { title: '核心增长结果', items: ['空间自带流量，成为内容工厂', '品牌溢价倍增，招商利器'] },
        features: [
          '<strong>客户参观动线：</strong>剧场版路径设计',
          '<strong>沉浸式体验区：</strong>应用场景模拟',
          '<strong>短视频场景墙：</strong>自带抖音传播基因',
          '<strong>IP化视觉全案：</strong>品牌人格化打造'
        ]
      }
    ];

    return pkgs.map(p => `
      <div class="pkg-card ${p.featured ? 'featured' : ''}">
        ${p.badge ? `<div class="pkg-badge">${p.badge}</div>` : ''}
        <h3>${p.title}</h3>
        <div class="pkg-price">${p.price}${p.priceNote ? `<span> ${p.priceNote}</span>` : ''}</div>
        <div class="pkg-result">
          <strong>${p.result.title}：</strong>
          <p>${p.result.items.map(i => `✔ ${i}`).join('<br>')}</p>
        </div>
        <ul class="feature-list">
          ${p.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
        <button class="btn btn-primary" onclick="window.openContactModal('${p.title}')">立即预约诊断</button>
      </div>
    `).join('');
  }

  // ==========================================
  // 7. 成功案例占位
  // ==========================================

  function renderCaseStudiesPlaceholder() {
    const cases = [
      { tag: '企业服务', title: '某SaaS企业总部空间升级', desc: '通过空间动线设计，将客户参访转化率从12%提升至45%', stat: '275%', statLabel: '转化提升' },
      { tag: '零售消费', title: '某连锁品牌旗舰店重塑', desc: '沉浸式体验空间设计，单店月均客流增长300%', stat: '300%', statLabel: '客流增长' },
      { tag: 'B2B制造', title: '某工业设备企业展厅改造', desc: '展厅升级后，大客户签约周期从6个月缩短至45天', stat: '75%', statLabel: '周期缩短' }
    ];

    return `
      <section id="case-studies" style="margin-top:80px">
        <h2 class="section-title">成功案例</h2>
        <p class="section-subtitle">我们用空间思维帮助了众多企业实现增长突破</p>
        <div class="case-grid">
          ${cases.map(c => `
            <div class="case-card">
              <div class="case-image">
                <span style="opacity:0.3">📊</span>
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
              </div>
            </div>
          `).join('')}
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

    // 关闭
    const closeModal = () => {
      overlay.classList.remove('open');
      if (form) form.style.display = 'block';
      if (success) success.classList.remove('open');
      // 重置表单
      if (form) form.reset();
      // 清除错误
      overlay.querySelectorAll('.form-error').forEach(el => el.classList.remove('visible'));
      overlay.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    };

    closeBtn?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    // 表单提交
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let valid = true;

        // 校验
        const name = form.querySelector('#leadName');
        const phone = form.querySelector('#leadPhone');
        const nameError = form.querySelector('#nameError');
        const phoneError = form.querySelector('#phoneError');

        // 姓名
        if (!name.value.trim()) {
          name.classList.add('error');
          nameError.textContent = '请填写您的姓名';
          nameError.classList.add('visible');
          valid = false;
        } else {
          name.classList.remove('error');
          nameError.classList.remove('visible');
        }

        // 手机
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

        // 构建数据
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

        // 保存联系信息到状态
        state.setContactInfo({
          name: leadData.name,
          phone: leadData.phone,
          company: leadData.company,
          note: leadData.note
        });

        // 提交到后端
        const result = await api.captureLead(leadData);

        // 无论后端是否成功，都显示成功
        if (form) form.style.display = 'none';
        if (success) {
          success.classList.add('open');
          success.querySelector('h4').textContent = '🎉 预约成功！';
          success.querySelector('p').textContent = '感谢您的信任！我们的专业顾问将在24小时内与您联系，为您定制专属增长方案。';
        }

        // 也提交诊断数据
        api.submitDiagnosis({
          driver: leadData.driver,
          driverId: leadData.driverId,
          pains: leadData.pains
        });
      });
    }
  }

  // 打开 modal（供全局调用）
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
      // 更新标题
      const title = overlay.querySelector('.modal-header h3');
      if (title) {
        title.textContent = pkgName ? `预约咨询：${pkgName}` : '获取专属增长方案';
      }
    }
  };

  // 跳转到第3步（供全局调用）
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

  function init() {
    setupNav();
    setupContactModal();

    // 订阅状态变化，自动重新渲染
    state.subscribe(() => {
      render();
    });
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
