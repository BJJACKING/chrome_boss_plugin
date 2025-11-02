// options.js - 选项页面逻辑

// DOM 元素
const educationSelect = document.getElementById('education');
const experienceInput = document.getElementById('experience');
const salaryMinInput = document.getElementById('salaryMin');
const salaryMaxInput = document.getElementById('salaryMax');
const ageMinInput = document.getElementById('ageMin');
const ageMaxInput = document.getElementById('ageMax');
const keywordsIncludeTextarea = document.getElementById('keywordsInclude');
const keywordsExcludeTextarea = document.getElementById('keywordsExclude');
const hideUnmatchedCheckbox = document.getElementById('hideUnmatched');
const highlightMatchedCheckbox = document.getElementById('highlightMatched');
const showStatsBarCheckbox = document.getElementById('showStatsBar');
const presetSelect = document.getElementById('presetSelect');
const savePresetBtn = document.getElementById('savePreset');
const loadPresetBtn = document.getElementById('loadPreset');
const deletePresetBtn = document.getElementById('deletePreset');
const exportSettingsBtn = document.getElementById('exportSettings');
const importSettingsBtn = document.getElementById('importSettings');
const importFileInput = document.getElementById('importFile');
const resetSettingsBtn = document.getElementById('resetSettings');
const saveSettingsBtn = document.getElementById('saveSettings');
const cancelSettingsBtn = document.getElementById('cancelSettings');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadPresets();
  setupEventListeners();
});

// 加载设置
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get([
      'education',
      'experience',
      'salaryMin',
      'salaryMax',
      'ageMin',
      'ageMax',
      'keywordsInclude',
      'keywordsExclude',
      'hideUnmatched',
      'highlightMatched',
      'showStatsBar'
    ]);

    educationSelect.value = result.education || '';
    experienceInput.value = result.experience || '';
    salaryMinInput.value = result.salaryMin || '';
    salaryMaxInput.value = result.salaryMax || '';
    ageMinInput.value = result.ageMin || '';
    ageMaxInput.value = result.ageMax || '';
    keywordsIncludeTextarea.value = result.keywordsInclude || '';
    keywordsExcludeTextarea.value = result.keywordsExclude || '';
    hideUnmatchedCheckbox.checked = result.hideUnmatched !== false;
    highlightMatchedCheckbox.checked = result.highlightMatched !== false;
    showStatsBarCheckbox.checked = result.showStatsBar !== false;
  } catch (error) {
    console.error('加载设置失败:', error);
    showNotification('加载设置失败', 'error');
  }
}

// 保存设置
async function saveSettings() {
  try {
    const settings = {
      education: educationSelect.value,
      experience: experienceInput.value,
      salaryMin: salaryMinInput.value,
      salaryMax: salaryMaxInput.value,
      ageMin: ageMinInput.value,
      ageMax: ageMaxInput.value,
      keywordsInclude: keywordsIncludeTextarea.value.trim(),
      keywordsExclude: keywordsExcludeTextarea.value.trim(),
      hideUnmatched: hideUnmatchedCheckbox.checked,
      highlightMatched: highlightMatchedCheckbox.checked,
      showStatsBar: showStatsBarCheckbox.checked
    };

    await chrome.storage.sync.set(settings);
    showNotification('设置已保存', 'success');
    
    // 通知 content script 重新加载
    const [tab] = await chrome.tabs.query({ active: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'reloadSettings' });
    }
  } catch (error) {
    console.error('保存设置失败:', error);
    showNotification('保存设置失败', 'error');
  }
}

// 加载预设列表
async function loadPresets() {
  try {
    const result = await chrome.storage.sync.get(['presets']);
    const presets = result.presets || {};
    
    // 清空并重新填充预设选择器
    presetSelect.innerHTML = '<option value="">选择预设...</option>';
    
    for (const [key, value] of Object.entries(presets)) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = value.name || key;
      presetSelect.appendChild(option);
    }
  } catch (error) {
    console.error('加载预设失败:', error);
  }
}

// 设置事件监听
function setupEventListeners() {
  saveSettingsBtn.addEventListener('click', saveSettings);
  cancelSettingsBtn.addEventListener('click', () => {
    window.close();
  });

  // 预设管理
  savePresetBtn.addEventListener('click', async () => {
    const presetName = prompt('请输入预设名称:');
    if (!presetName) return;

    const preset = {
      name: presetName,
      education: educationSelect.value,
      experience: experienceInput.value,
      salaryMin: salaryMinInput.value,
      salaryMax: salaryMaxInput.value,
      ageMin: ageMinInput.value,
      ageMax: ageMaxInput.value,
      keywordsInclude: keywordsIncludeTextarea.value.trim(),
      keywordsExclude: keywordsExcludeTextarea.value.trim(),
      hideUnmatched: hideUnmatchedCheckbox.checked,
      highlightMatched: highlightMatchedCheckbox.checked,
      showStatsBar: showStatsBarCheckbox.checked
    };

    try {
      const result = await chrome.storage.sync.get(['presets']);
      const presets = result.presets || {};
      presets[presetName] = preset;
      await chrome.storage.sync.set({ presets });
      await loadPresets();
      showNotification('预设已保存', 'success');
    } catch (error) {
      console.error('保存预设失败:', error);
      showNotification('保存预设失败', 'error');
    }
  });

  loadPresetBtn.addEventListener('click', async () => {
    const presetKey = presetSelect.value;
    if (!presetKey) {
      showNotification('请选择预设', 'warning');
      return;
    }

    try {
      const result = await chrome.storage.sync.get(['presets']);
      const presets = result.presets || {};
      const preset = presets[presetKey];
      
      if (!preset) {
        showNotification('预设不存在', 'error');
        return;
      }

      educationSelect.value = preset.education || '';
      experienceInput.value = preset.experience || '';
      salaryMinInput.value = preset.salaryMin || '';
      salaryMaxInput.value = preset.salaryMax || '';
      ageMinInput.value = preset.ageMin || '';
      ageMaxInput.value = preset.ageMax || '';
      keywordsIncludeTextarea.value = preset.keywordsInclude || '';
      keywordsExcludeTextarea.value = preset.keywordsExclude || '';
      hideUnmatchedCheckbox.checked = preset.hideUnmatched !== false;
      highlightMatchedCheckbox.checked = preset.highlightMatched !== false;
      showStatsBarCheckbox.checked = preset.showStatsBar !== false;

      showNotification('预设已加载', 'success');
    } catch (error) {
      console.error('加载预设失败:', error);
      showNotification('加载预设失败', 'error');
    }
  });

  deletePresetBtn.addEventListener('click', async () => {
    const presetKey = presetSelect.value;
    if (!presetKey) {
      showNotification('请选择预设', 'warning');
      return;
    }

    if (!confirm('确定要删除这个预设吗？')) {
      return;
    }

    try {
      const result = await chrome.storage.sync.get(['presets']);
      const presets = result.presets || {};
      delete presets[presetKey];
      await chrome.storage.sync.set({ presets });
      await loadPresets();
      showNotification('预设已删除', 'success');
    } catch (error) {
      console.error('删除预设失败:', error);
      showNotification('删除预设失败', 'error');
    }
  });

  // 导入/导出
  exportSettingsBtn.addEventListener('click', async () => {
    try {
      const allSettings = await chrome.storage.sync.get(null);
      const dataStr = JSON.stringify(allSettings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume-filter-settings-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showNotification('配置已导出', 'success');
    } catch (error) {
      console.error('导出配置失败:', error);
      showNotification('导出配置失败', 'error');
    }
  });

  importSettingsBtn.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const settings = JSON.parse(text);
      await chrome.storage.sync.set(settings);
      await loadSettings();
      await loadPresets();
      showNotification('配置已导入', 'success');
    } catch (error) {
      console.error('导入配置失败:', error);
      showNotification('导入配置失败，请检查文件格式', 'error');
    }

    event.target.value = '';
  });

  resetSettingsBtn.addEventListener('click', async () => {
    if (!confirm('确定要重置所有设置为默认值吗？此操作不可撤销。')) {
      return;
    }

    try {
      await chrome.storage.sync.clear();
      await chrome.storage.sync.set({
        filterEnabled: false,
        hideUnmatched: true,
        highlightMatched: true,
        education: '',
        experience: '',
        keywordsInclude: '',
        keywordsExclude: ''
      });
      await loadSettings();
      showNotification('设置已重置', 'success');
    } catch (error) {
      console.error('重置设置失败:', error);
      showNotification('重置设置失败', 'error');
    }
  });
}

// 显示通知
function showNotification(message, type = 'info') {
  // 简单的通知实现
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;

  const colors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };

  notification.style.background = colors[type] || colors.info;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

