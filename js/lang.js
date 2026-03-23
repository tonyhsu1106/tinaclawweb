// js/lang.js
// 语言切换模块，被 index.html 和 case.html 共用
// 必须在各自的 main.js / case.js 之前加载

function setLang(lang) {
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-zh][data-en]').forEach(el => {
    el.textContent = el.dataset[lang];
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

// 页面加载时恢复语言设置
(function () {
  const lang = localStorage.getItem('lang') || 'zh';
  // DOM 可能还未完全渲染，延迟到 DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setLang(lang));
  } else {
    setLang(lang);
  }
})();
