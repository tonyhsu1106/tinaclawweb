// js/main.js
// 首页渲染逻辑 + 汉堡菜单
// 依赖: js/lang.js 在此之前加载

// 难度标签映射
const DIFFICULTY_LABEL = {
  beginner:     { zh: '入门', en: 'Beginner', cls: 'tag-difficulty-beginner' },
  intermediate: { zh: '中级', en: 'Intermediate', cls: 'tag-difficulty-intermediate' },
  advanced:     { zh: '高级', en: 'Advanced', cls: 'tag-difficulty-advanced' },
};

// 类别中英文名映射
const CATEGORY_LABEL = {
  social:       { zh: '社交媒体', en: 'Social' },
  creative:     { zh: '创意与构建', en: 'Creative' },
  devops:       { zh: '基础设施', en: 'DevOps' },
  productivity: { zh: '生产力', en: 'Productivity' },
  research:     { zh: '研究与学习', en: 'Research' },
  finance:      { zh: '金融与交易', en: 'Finance' },
};

function getCurrentLang() {
  return localStorage.getItem('lang') || 'zh';
}

function renderCard(c) {
  const lang = getCurrentLang();
  const d = DIFFICULTY_LABEL[c.difficulty] || DIFFICULTY_LABEL.intermediate;
  const cat = CATEGORY_LABEL[c.category] || { zh: c.category, en: c.category };

  const card = document.createElement('a');
  card.className = 'card';
  card.href = `case.html?id=${c.id}`;

  card.innerHTML = `
    <div class="card-cover" style="background: linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})">
      ${c.icon}
    </div>
    <div class="card-body">
      <div class="card-name-zh" data-zh="${escHtml(c.name.zh)}" data-en="${escHtml(c.name.en)}">${escHtml(c.name[lang])}</div>
      <div class="card-name-en" style="display:${lang==='zh'?'block':'none'}">${escHtml(c.name.en)}</div>
      <div class="card-summary" data-zh="${escHtml(c.summary.zh)}" data-en="${escHtml(c.summary.en)}">${escHtml(c.summary[lang])}</div>
      <div class="card-tags">
        <span class="tag" data-zh="${escHtml(cat.zh)}" data-en="${escHtml(cat.en)}">${escHtml(cat[lang])}</span>
        <span class="tag ${d.cls}" data-zh="${d.zh}" data-en="${d.en}">${d[lang]}</span>
      </div>
    </div>
  `;
  return card;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 渲染所有卡片
async function init() {
  let cases;
  try {
    const res = await fetch('data/cases.json');
    if (!res.ok) throw new Error('fetch failed');
    cases = await res.json();
  } catch {
    const container = document.getElementById('sections-container');
    if (container) container.innerHTML = '<p style="text-align:center;padding:40px;color:#6e6e73">加载失败，请刷新页面重试。</p>';
    return;
  }

  // 更新 Hero 计数
  document.getElementById('case-count').textContent = cases.length;

  // 按类别分组渲染
  const byCategory = {};
  cases.forEach(c => {
    if (!byCategory[c.category]) byCategory[c.category] = [];
    byCategory[c.category].push(c);
  });

  Object.entries(byCategory).forEach(([cat, items]) => {
    const grid = document.getElementById(`grid-${cat}`);
    if (!grid) return;
    items.forEach(c => grid.appendChild(renderCard(c)));
  });

  // 隐藏空 Section
  document.querySelectorAll('.cases-section').forEach(sec => {
    const grid = sec.querySelector('.cards-grid');
    if (grid && grid.children.length === 0) {
      sec.style.display = 'none';
    }
  });
}

// 汉堡菜单
function toggleMenu() {
  document.getElementById('navbar').classList.toggle('nav-open');
}

function closeMenu() {
  document.getElementById('navbar').classList.remove('nav-open');
}

// Extend setLang to also update card-name-en visibility
const _origSetLang = window.setLang;
window.setLang = function(lang) {
  _origSetLang(lang);
  document.querySelectorAll('.card-name-en').forEach(el => {
    el.style.display = lang === 'zh' ? 'block' : 'none';
  });
};

document.addEventListener('DOMContentLoaded', init);
