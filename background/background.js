// background.js - 后台服务 Worker

// 插件安装时
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装，设置默认配置
    chrome.storage.sync.set({
      filterEnabled: false,
      hideUnmatched: true,
      highlightMatched: true,
      education: '',
      experience: '',
      keywordsInclude: '',
      keywordsExclude: ''
    }, () => {
      console.log('默认配置已设置');
      // 注意：首次安装时打开选项页面可能会失败，所以注释掉
      // chrome.runtime.openOptionsPage();
    });
  } else if (details.reason === 'update') {
    // 更新时，可以在这里处理迁移逻辑
    console.log('插件已更新到版本:', chrome.runtime.getManifest().version);
  }
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 当页面加载完成时，可以发送消息到 content script
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url);
      const supportedDomains = ['zhipin.com', 'boss.com', '58.com', 'liepin.com'];
      
      if (supportedDomains.some(domain => url.hostname.includes(domain))) {
        // 可以在这里执行一些初始化操作
        console.log('检测到支持的招聘网站:', url.hostname);
      }
    } catch (error) {
      // 忽略无效的 URL
      console.debug('无效的 URL:', tab.url);
    }
  }
});

// 处理来自 popup 或 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    chrome.storage.sync.get(null, (result) => {
      sendResponse(result);
    });
    return true; // 保持消息通道开放
  }
  
  if (message.action === 'saveSettings') {
    chrome.storage.sync.set(message.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// 监听快捷键（需要在 manifest.json 中声明 commands）
// 检查 chrome.commands API 是否可用
if (chrome.commands && chrome.commands.onCommand) {
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-filter') {
      // 切换筛选开关
      chrome.storage.sync.get(['filterEnabled'], (result) => {
        chrome.storage.sync.set({ filterEnabled: !result.filterEnabled });
      });
    }
  });
}

