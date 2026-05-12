/**
 * state.js — 状态管理模块
 * "空间增长系统" 应用核心状态
 * 三种驱动类型，各10条专属痛点
 */

const AppState = (() => {
  const STORAGE_KEY = 'space_growth_state';

  // === 应用配置 ===
  const config = {
    drivers: [
      { id: 'PRODUCT', title: '产品驱动型', desc: '依靠功能迭代与性价比竞争', icon: '💎' },
      { id: 'CHANNEL', title: '渠道依赖型', desc: '依靠流量入口与合作伙伴渗透', icon: '🌐' },
      { id: 'USER', title: '关系网络型', desc: '依靠用户资产与生命周期经营', icon: '❤️' }
    ],
    // 通用痛点（向后兼容）
    pains: [
      '获客成本太高/增长乏力',
      '产品同质化严重/利润薄',
      '团队执行力差/目标难达',
      '过度依赖单一渠道',
      '客户成交周期太长',
      '缺乏差异化爆品'
    ],
    // 各驱动类型专属痛点（各10条）
    driverPains: {
      PRODUCT: [
        { id: 'p1_1', text: '产品功能同质化，陷入价格战泥潭' },
        { id: 'p1_2', text: '技术迭代快，研发投入产出比低' },
        { id: 'p1_3', text: '产品卖点不清晰，客户感知价值弱' },
        { id: 'p1_4', text: '新品上市推广难，市场教育成本高' },
        { id: 'p1_5', text: '竞品抄袭快，差异化优势难以维持' },
        { id: 'p1_6', text: '产品演示体验差，成交转化率低' },
        { id: 'p1_7', text: '售后服务口碑差，复购率持续下滑' },
        { id: 'p1_8', text: '产品线混乱，客户选择困难' },
        { id: 'p1_9', text: '供应链成本高，利润空间被压缩' },
        { id: 'p1_10', text: '产品包装展示土，品牌调性上不去' }
      ],
      CHANNEL: [
        { id: 'p2_1', text: '渠道商忠诚度低，频繁被竞品挖角' },
        { id: 'p2_2', text: '渠道拓展成本高，招商难度大' },
        { id: 'p2_3', text: '渠道冲突严重，线上线下价格体系混乱' },
        { id: 'p2_4', text: '渠道商能力参差不齐，品牌执行走样' },
        { id: 'p2_5', text: '头部渠道商议价能力强，利润被压榨' },
        { id: 'p2_6', text: '渠道库存积压严重，动销速度慢' },
        { id: 'p2_7', text: '渠道数据不透明，市场反馈滞后' },
        { id: 'p2_8', text: '新兴渠道（直播/社群）布局滞后' },
        { id: 'p2_9', text: '渠道培训支持不足，销售话术不统一' },
        { id: 'p2_10', text: '渠道形象展示差，品牌势能不足' }
      ],
      USER: [
        { id: 'p3_1', text: '用户活跃度低，沉默用户占比高' },
        { id: 'p3_2', text: '用户流失率高，留存成本持续攀升' },
        { id: 'p3_3', text: '用户LTV（生命周期价值）增长停滞' },
        { id: 'p3_4', text: '会员体系吸引力弱，付费转化率低' },
        { id: 'p3_5', text: '用户口碑传播弱，转介绍率极低' },
        { id: 'p3_6', text: '私域流量运营粗放，用户触达效率低' },
        { id: 'p3_7', text: '用户分层不精准，营销资源浪费严重' },
        { id: 'p3_8', text: '社群运营死气沉沉，用户参与度差' },
        { id: 'p3_9', text: '用户数据分散，无法形成统一画像' },
        { id: 'p3_10', text: '用户体验断层，线上线下服务不一致' }
      ]
    }
  };

  // === 诊断建议引擎（三种驱动类型，各10条痛点专属建议） ===
  const diagnosisAdvice = {
    PRODUCT: {
      generic: '您当前的核心瓶颈在于产品竞争力与价值感知。建议从"卖产品"转向"品牌空间叙事"，通过沉浸式体验空间重塑产品价值感知，降低客户比价心理，让产品自己会说话。',
      pains: {
        '产品功能同质化，陷入价格战泥潭': '打造"产品价值可视化空间"，用场景化展示突出差异化卖点，让客户为价值买单而非为价格比较。',
        '技术迭代快，研发投入产出比低': '建立"技术成果展示墙"，将研发实力转化为品牌信任资产，让客户感知技术溢价。',
        '产品卖点不清晰，客户感知价值弱': '设计"卖点体验动线"，把产品核心优势拆解为可触摸、可感知的体验节点。',
        '新品上市推广难，市场教育成本高': '打造"新品发布体验中心"，让新品自带传播属性，降低市场教育成本。',
        '竞品抄袭快，差异化优势难以维持': '构建"品牌文化沉浸空间"，用故事和情感建立难以复制的品牌护城河。',
        '产品演示体验差，成交转化率低': '优化"产品演示动线设计"，把销售话术嵌入空间体验，让墙面成为最强销售。',
        '售后服务口碑差，复购率持续下滑': '建立"服务承诺可视化系统"，用空间语言传递服务标准，重建客户信任。',
        '产品线混乱，客户选择困难': '设计"产品导航空间系统"，用清晰的视觉层级帮助客户快速找到适合的产品。',
        '供应链成本高，利润空间被压缩': '通过空间体验提升品牌溢价能力，用感知价值提升对冲成本压力。',
        '产品包装展示土，品牌调性上不去': '全面升级"产品展示美学系统"，用空间高级感拉升品牌调性，支撑溢价策略。'
      }
    },
    CHANNEL: {
      generic: '您当前的核心瓶颈在于渠道效能与合作伙伴管理。建议将渠道合作伙伴的参观动线升级为"招商转化系统"，让每一次参观都成为品牌签约的催化剂，同时构建可复制的渠道赋能体系。',
      pains: {
        '渠道商忠诚度低，频繁被竞品挖角': '打造"渠道商荣誉殿堂"，用空间仪式感强化身份认同，提升渠道归属感和忠诚度。',
        '渠道拓展成本高，招商难度大': '构建"渠道招商体验中心"，让潜在渠道商在参观中自发产生合作意愿，降低招商说服成本。',
        '渠道冲突严重，线上线下价格体系混乱': '建立"渠道秩序可视化系统"，用空间语言传递价格管控决心，维护渠道生态健康。',
        '渠道商能力参差不齐，品牌执行走样': '设计"标准化渠道形象模板"，让不同能力的渠道商都能按标准呈现品牌形象。',
        '头部渠道商议价能力强，利润被压榨': '通过品牌空间升级提升品牌势能，增强对渠道商的话语权和议价能力。',
        '渠道库存积压严重，动销速度慢': '打造"动销场景体验空间"，向渠道商展示终端动销方法，提升销售信心。',
        '渠道数据不透明，市场反馈滞后': '建立"渠道数据可视化中心"，用空间大屏实时展示市场动态，增强渠道掌控力。',
        '新兴渠道（直播/社群）布局滞后': '设计"新零售体验实验室"，展示直播、社群等新渠道玩法，引领渠道创新。',
        '渠道培训支持不足，销售话术不统一': '构建"渠道赋能培训中心"，用空间载体固化销售SOP，降低培训成本。',
        '渠道形象展示差，品牌势能不足': '全面升级"渠道形象识别系统"，用统一的空间语言提升品牌整体势能。'
      }
    },
    USER: {
      generic: '您当前的核心瓶颈在于用户资产运营与生命周期管理。建议将空间升级为"用户关系管理中心"，用空间体验提升用户生命周期价值（LTV），让用户从消费者转变为品牌传播者。',
      pains: {
        '用户活跃度低，沉默用户占比高': '打造"用户唤醒体验空间"，用沉浸式活动场景重新激活沉默用户，提升回访频次。',
        '用户流失率高，留存成本持续攀升': '构建"会员专属体验空间"，用专属感和特权感提升用户粘性，降低流失率。',
        '用户LTV（生命周期价值）增长停滞': '设计"用户成长路径空间"，用可视化方式展示会员权益升级，激励用户持续消费。',
        '会员体系吸引力弱，付费转化率低': '建立"会员权益体验中心"，让用户在空间中提前感知会员价值，提升付费意愿。',
        '用户口碑传播弱，转介绍率极低': '打造"用户打卡传播场景"，设计自带传播属性的空间亮点，激发用户自发分享。',
        '私域流量运营粗放，用户触达效率低': '构建"私域运营体验空间"，展示社群活动、内容运营等玩法，提升用户参与度。',
        '用户分层不精准，营销资源浪费严重': '设计"用户分层服务空间"，针对不同层级用户提供差异化空间体验，精准运营。',
        '社群运营死气沉沉，用户参与度差': '建立"社群活动体验中心"，用空间活动激活社群氛围，提升用户互动频次。',
        '用户数据分散，无法形成统一画像': '打造"用户数据中心展示墙"，用可视化方式呈现用户洞察，指导运营决策。',
        '用户体验断层，线上线下服务不一致': '构建"全渠道体验一致性系统"，让线上线下空间语言统一，消除体验断层。'
      }
    }
  };

  // === 默认状态 ===
  const defaults = {
    step: 1,
    driver: '',
    driverId: '',
    pains: [],
    isDarkMode: true,
    contactInfo: { name: '', phone: '', company: '', note: '' }
  };

  // === 当前状态 ===
  let _state = load();

  // === 订阅者 ===
  const listeners = [];

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // 合并默认值，防止新增字段缺失
        return { ...defaults, ...saved };
      }
    } catch (e) {
      // ignore
    }
    return { ...defaults };
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
    } catch (e) {
      // ignore
    }
  }

  function notify() {
    listeners.forEach(fn => fn({ ..._state }));
  }

  // === 公开 API ===

  /** 获取当前状态的只读副本 */
  function get() {
    return { ..._state };
  }

  /** 获取配置 */
  function getConfig() {
    return config;
  }

  /** 获取当前驱动类型的专属痛点列表 */
  function getDriverPains(driverId) {
    if (!driverId || !config.driverPains[driverId]) {
      return [];
    }
    return config.driverPains[driverId];
  }

  /** 设置单个状态值 */
  function set(key, value) {
    if (key in _state) {
      _state[key] = value;
      save();
      notify();
    }
  }

  /** 设置多个状态值 */
  function patch(updates) {
    Object.keys(updates).forEach(key => {
      if (key in _state) {
        _state[key] = updates[key];
      }
    });
    save();
    notify();
  }

  /** 订阅状态变化 */
  function subscribe(fn) {
    listeners.push(fn);
    // 立即调用一次
    fn({ ..._state });
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }

  /** 重置到初始状态 */
  function reset() {
    _state = { ...defaults };
    save();
    notify();
  }

  /** 切换主题 */
  function toggleTheme() {
    _state.isDarkMode = !_state.isDarkMode;
    document.body.classList.toggle('light-mode');
    save();
    notify();
  }

  /** 选择驱动 */
  function selectDriver(driverId) {
    const driver = config.drivers.find(d => d.id === driverId);
    if (driver) {
      _state.driver = driver.title;
      _state.driverId = driverId;
      _state.step = 2;
      // 切换驱动时清空已选痛点（因为痛点列表变了）
      _state.pains = [];
      save();
      notify();
    }
  }

  /** 切换痛点（支持新旧两种格式） */
  function togglePain(pain) {
    // pain 可能是字符串（旧格式）或对象（新格式）
    const painText = typeof pain === 'object' ? pain.text : pain;
    const painId = typeof pain === 'object' ? pain.id : pain;
    
    const idx = _state.pains.findIndex(p => {
      if (typeof p === 'object') {
        return p.id === painId || p.text === painText;
      }
      return p === painText;
    });
    
    if (idx > -1) {
      _state.pains.splice(idx, 1);
    } else {
      // 存储完整对象以便后续使用
      _state.pains.push(typeof pain === 'object' ? pain : { text: pain });
    }
    save();
    notify();
  }

  /** 生成诊断建议 */
  function generateAdvice() {
    const { driverId, pains } = _state;
    if (!driverId) return '请先选择您的企业增长驱动类型。';

    const driverData = diagnosisAdvice[driverId];
    if (!driverData) return '诊断数据暂不可用，请重新选择。';

    let advice = driverData.generic;

    // 如果有选中的痛点，拼入个性化建议
    if (pains.length > 0) {
      advice += '\n\n**针对性建议：**\n';
      pains.forEach(pain => {
        const painText = typeof pain === 'object' ? pain.text : pain;
        const specificAdvice = driverData.pains[painText];
        if (specificAdvice) {
          advice += `\n- **${painText}**：${specificAdvice}`;
        }
      });
    }

    return advice;
  }

  /** 设置联系人信息 */
  function setContactInfo(info) {
    _state.contactInfo = { ..._state.contactInfo, ...info };
    save();
  }

  // 初始化：确保主题状态与 body class 一致
  (function init() {
    if (!_state.isDarkMode) {
      document.body.classList.add('light-mode');
    }
  })();

  return {
    get,
    getConfig,
    getDriverPains,
    set,
    patch,
    subscribe,
    reset,
    toggleTheme,
    selectDriver,
    togglePain,
    generateAdvice,
    setContactInfo
  };
})();

// 暴露为全局变量供内联调用
window.AppState = AppState;
