// content.js - 内容脚本，核心筛选逻辑

// 筛选器状态
let filterState = {
  active: false,
  settings: null,
  stats: {
    matched: 0,
    unmatched: 0,
    total: 0
  }
};

// 初始化
(function init() {
  loadSettings();
  setupMessageListener();
  observePageChanges();
})();

// 加载设置
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get([
      'filterEnabled',
      'hideUnmatched',
      'highlightMatched',
      'education',
      'experience',
      'keywordsInclude',
      'keywordsExclude'
    ]);
    
    filterState.settings = {
      enabled: result.filterEnabled || false,
      hideUnmatched: result.hideUnmatched !== false,
      highlightMatched: result.highlightMatched !== false,
      education: result.education || '',
      experience: result.experience || '',
      keywordsInclude: result.keywordsInclude ? result.keywordsInclude.split(',').map(k => k.trim()).filter(k => k) : [],
      keywordsExclude: result.keywordsExclude ? result.keywordsExclude.split(',').map(k => k.trim()).filter(k => k) : []
    };
    
    if (filterState.settings.enabled) {
      applyFilter();
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
}

// 监听设置变化
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    loadSettings();
  }
});

// 设置消息监听
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'apply') {
      applyFilter();
      sendResponse({ success: true });
    } else if (message.action === 'clear') {
      clearFilter();
      sendResponse({ success: true });
    } else if (message.action === 'getStatus') {
      sendResponse({
        active: filterState.active,
        stats: filterState.stats
      });
    }
    return true;
  });
}

// 应用筛选
function applyFilter() {
  if (!filterState.settings || !filterState.settings.enabled) {
    clearFilter();
    return;
  }

  filterState.active = true;
  const resumes = findResumeElements();
  filterState.stats.total = resumes.length;
  filterState.stats.matched = 0;
  filterState.stats.unmatched = 0;

  resumes.forEach((resume, index) => {
    const resumeData = extractResumeData(resume);
    const matches = checkResumeMatch(resumeData);

    if (matches) {
      filterState.stats.matched++;
      markAsMatched(resume);
    } else {
      filterState.stats.unmatched++;
      markAsUnmatched(resume);
    }
  });

  showStatsBar();
}

// 清除筛选
function clearFilter() {
  filterState.active = false;
  const resumes = findResumeElements();
  
  resumes.forEach(resume => {
    resume.classList.remove('resume-filter-matched', 'resume-filter-unmatched', 'resume-filter-hidden');
    const badge = resume.querySelector('.resume-filter-badge');
    if (badge) {
      badge.remove();
    }
  });

  hideStatsBar();
}

// 查找简历元素（需要根据实际网站结构调整）
function findResumeElements() {
  // 尝试多种常见的简历列表选择器
  const selectors = [
    // BOSS 直聘
    '.resume-card',
    '.job-card-wrapper',
    '[data-resume-id]',
    // 通用选择器
    '.resume-item',
    '.candidate-item',
    '[class*="resume"]',
    '[class*="candidate"]'
  ];

  let elements = [];
  for (const selector of selectors) {
    elements = Array.from(document.querySelectorAll(selector));
    if (elements.length > 0) {
      break;
    }
  }

  // 如果没有找到，尝试查找包含关键信息的元素
  if (elements.length === 0) {
    elements = Array.from(document.querySelectorAll('div, li, article')).filter(el => {
      const text = el.textContent || '';
      return text.includes('年经验') || text.includes('学历') || text.includes('期望薪资');
    });
  }

  return elements;
}

// 提取简历数据
function extractResumeData(element) {
  const text = (element.textContent || '').toLowerCase();
  const html = element.innerHTML || '';

  // 提取学历信息
  const educationPatterns = {
    '博士': /博士|phd|doctor/i,
    '硕士': /硕士|研究生|master|mba/i,
    '本科': /本科|学士|bachelor|大学/i,
    '大专': /大专|专科|college/i
  };

  let education = '';
  for (const [key, pattern] of Object.entries(educationPatterns)) {
    if (pattern.test(text)) {
      education = key;
      break;
    }
  }

  // 提取工作经验
  const experienceMatch = text.match(/(\d+)[年]?\s*经验/);
  const experience = experienceMatch ? parseInt(experienceMatch[1]) : 0;

  // 提取薪资信息
  const salaryMatch = text.match(/(\d+)[kK万]/);
  const salary = salaryMatch ? parseInt(salaryMatch[1]) : 0;

  // 提取年龄
  const ageMatch = text.match(/(\d+)\s*岁/);
  const age = ageMatch ? parseInt(ageMatch[1]) : 0;

  return {
    text,
    html,
    education,
    experience,
    salary,
    age,
    element
  };
}

// 检查简历是否符合条件
function checkResumeMatch(resumeData) {
  const settings = filterState.settings;

  // 学历筛选
  if (settings.education) {
    const educationLevels = ['大专', '本科', '硕士', '博士'];
    const requiredLevel = educationLevels.indexOf(settings.education);
    const resumeLevel = educationLevels.indexOf(resumeData.education);
    
    if (resumeLevel < requiredLevel) {
      return false;
    }
  }

  // 工作经验筛选
  if (settings.experience) {
    const requiredExperience = parseInt(settings.experience);
    if (resumeData.experience < requiredExperience) {
      return false;
    }
  }

  // 关键词包含筛选
  if (settings.keywordsInclude.length > 0) {
    const hasAllKeywords = settings.keywordsInclude.every(keyword => {
      return resumeData.text.includes(keyword.toLowerCase());
    });
    if (!hasAllKeywords) {
      return false;
    }
  }

  // 关键词排除筛选
  if (settings.keywordsExclude.length > 0) {
    const hasExcludedKeyword = settings.keywordsExclude.some(keyword => {
      return resumeData.text.includes(keyword.toLowerCase());
    });
    if (hasExcludedKeyword) {
      return false;
    }
  }

  return true;
}

// 标记为符合条件
function markAsMatched(element) {
  element.classList.remove('resume-filter-unmatched', 'resume-filter-hidden');
  element.classList.add('resume-filter-matched');

  if (filterState.settings.highlightMatched) {
    // 添加标记徽章
    if (!element.querySelector('.resume-filter-badge')) {
      const badge = document.createElement('span');
      badge.className = 'resume-filter-badge';
      badge.textContent = '✓ 匹配';
      element.style.position = 'relative';
      element.appendChild(badge);
    }
  }
}

// 标记为不符合条件
function markAsUnmatched(element) {
  element.classList.remove('resume-filter-matched');
  element.classList.add('resume-filter-unmatched');

  const badge = element.querySelector('.resume-filter-badge');
  if (badge) {
    badge.remove();
  }

  if (filterState.settings.hideUnmatched) {
    element.classList.add('resume-filter-hidden');
  }
}

// 显示统计信息条
function showStatsBar() {
  // 移除已存在的统计条
  const existingBar = document.getElementById('resume-filter-stats-bar');
  if (existingBar) {
    existingBar.remove();
  }

  const statsBar = document.createElement('div');
  statsBar.id = 'resume-filter-stats-bar';
  statsBar.className = 'resume-filter-stats-bar';
  statsBar.innerHTML = `
    <div class="stats-info">
      <div class="stat-item">
        <span class="stat-label">总计:</span>
        <span class="stat-value">${filterState.stats.total}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">匹配:</span>
        <span class="stat-value" style="color: #28a745;">${filterState.stats.matched}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">不匹配:</span>
        <span class="stat-value" style="color: #dc3545;">${filterState.stats.unmatched}</span>
      </div>
    </div>
    <button class="close-btn" onclick="this.parentElement.remove()">关闭</button>
  `;

  document.body.insertBefore(statsBar, document.body.firstChild);
}

// 隐藏统计信息条
function hideStatsBar() {
  const statsBar = document.getElementById('resume-filter-stats-bar');
  if (statsBar) {
    statsBar.remove();
  }
}

// 监听页面变化（动态加载的内容）
function observePageChanges() {
  const observer = new MutationObserver((mutations) => {
    let shouldReapply = false;
    
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        shouldReapply = true;
      }
    });

    if (shouldReapply && filterState.active && filterState.settings?.enabled) {
      // 防抖，避免频繁重新筛选
      clearTimeout(window.filterTimeout);
      window.filterTimeout = setTimeout(() => {
        applyFilter();
      }, 500);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

