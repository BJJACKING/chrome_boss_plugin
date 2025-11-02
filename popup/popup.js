// popup.js - 弹窗页面逻辑

// 获取 DOM 元素
const enableFilter = document.getElementById('enableFilter');
const hideUnmatched = document.getElementById('hideUnmatched');
const highlightMatched = document.getElementById('highlightMatched');
const educationFilter = document.getElementById('educationFilter');
const experienceFilter = document.getElementById('experienceFilter');
const keywordsInclude = document.getElementById('keywordsInclude');
const keywordsExclude = document.getElementById('keywordsExclude');
const applyFilterBtn = document.getElementById('applyFilter');
const clearFilterBtn = document.getElementById('clearFilter');
const openOptionsBtn = document.getElementById('openOptions');
const statusText = document.getElementById('statusText');
const statusDot = document.querySelector('.status-dot');
const matchedCount = document.getElementById('matchedCount');
const unmatchedCount = document.getElementById('unmatchedCount');
const stats = document.getElementById('stats');
const currentPage = document.getElementById('currentPage');

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await updateStatus();
  await updateCurrentPage();
  
  // 设置事件监听
  setupEventListeners();
});

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

    enableFilter.checked = result.filterEnabled || false;
    hideUnmatched.checked = result.hideUnmatched !== false; // 默认 true
    highlightMatched.checked = result.highlightMatched !== false; // 默认 true
    educationFilter.value = result.education || '';
    experienceFilter.value = result.experience || '';
    keywordsInclude.value = result.keywordsInclude || '';
    keywordsExclude.value = result.keywordsExclude || '';
  } catch (error) {
    console.error('加载设置失败:', error);
  }
}

// 保存设置
async function saveSettings() {
  try {
    await chrome.storage.sync.set({
      filterEnabled: enableFilter.checked,
      hideUnmatched: hideUnmatched.checked,
      highlightMatched: highlightMatched.checked,
      education: educationFilter.value,
      experience: experienceFilter.value,
      keywordsInclude: keywordsInclude.value.trim(),
      keywordsExclude: keywordsExclude.value.trim()
    });
  } catch (error) {
    console.error('保存设置失败:', error);
  }
}

// 更新状态
async function updateStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
    
    if (response) {
      statusText.textContent = response.active ? '已激活' : '未激活';
      statusDot.className = `status-dot ${response.active ? 'active' : 'inactive'}`;
      
      if (response.stats) {
        matchedCount.textContent = response.stats.matched || 0;
        unmatchedCount.textContent = response.stats.unmatched || 0;
        stats.style.display = 'flex';
      } else {
        stats.style.display = 'none';
      }
    } else {
      statusText.textContent = '未在当前页面运行';
      statusDot.className = 'status-dot inactive';
      stats.style.display = 'none';
    }
  } catch (error) {
    statusText.textContent = '未在当前页面运行';
    statusDot.className = 'status-dot inactive';
    stats.style.display = 'none';
  }
}

// 更新当前页面信息
async function updateCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      currentPage.textContent = url.hostname;
    }
  } catch (error) {
    currentPage.textContent = '-';
  }
}

// 设置事件监听
function setupEventListeners() {
  // 应用筛选
  applyFilterBtn.addEventListener('click', async () => {
    await saveSettings();
    await sendFilterCommand('apply');
    setTimeout(updateStatus, 500);
  });

  // 清除筛选
  clearFilterBtn.addEventListener('click', async () => {
    await chrome.storage.sync.set({ filterEnabled: false });
    enableFilter.checked = false;
    await sendFilterCommand('clear');
    setTimeout(updateStatus, 500);
  });

  // 开关切换自动保存
  enableFilter.addEventListener('change', async () => {
    await saveSettings();
    await sendFilterCommand(enableFilter.checked ? 'apply' : 'clear');
    setTimeout(updateStatus, 500);
  });

  hideUnmatched.addEventListener('change', async () => {
    await saveSettings();
    await sendFilterCommand('apply');
  });

  highlightMatched.addEventListener('change', async () => {
    await saveSettings();
    await sendFilterCommand('apply');
  });

  // 打开选项页面
  openOptionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// 发送筛选命令到 content script
async function sendFilterCommand(action) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { action });
  } catch (error) {
    console.error('发送命令失败:', error);
  }
}

// 定期更新状态
setInterval(updateStatus, 2000);

