// js/case.js
// 详情页渲染逻辑
// 依赖: js/lang.js 在此之前加载

const DIFFICULTY_LABEL = {
  beginner:     { zh: '入门', en: 'Beginner', cls: 'tag-difficulty-beginner' },
  intermediate: { zh: '中级', en: 'Intermediate', cls: 'tag-difficulty-intermediate' },
  advanced:     { zh: '高级', en: 'Advanced', cls: 'tag-difficulty-advanced' },
};

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

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeUrl(url) {
  try {
    const u = new URL(url);
    return (u.protocol === 'https:' || u.protocol === 'http:') ? escHtml(url) : '#';
  } catch { return '#'; }
}

function renderCase(c) {
  const lang = getCurrentLang();
  const d = DIFFICULTY_LABEL[c.difficulty] || DIFFICULTY_LABEL.intermediate;
  const cat = CATEGORY_LABEL[c.category] || { zh: c.category, en: c.category };

  // 封面
  const cover = document.getElementById('case-cover');
  cover.style.background = `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})`;
  cover.className = 'case-cover';
  cover.innerHTML = `
    <div class="case-cover-emoji">${escHtml(c.icon)}</div>
    <div class="case-cover-name-zh" data-zh="${escHtml(c.name.zh)}" data-en="${escHtml(c.name.en)}">${escHtml(c.name[lang])}</div>
    <div class="case-cover-name-en" style="display:${lang==='zh'?'block':'none'}">${escHtml(c.name.en)}</div>
  `;

  // 面包屑
  document.getElementById('breadcrumb').innerHTML = `
    <a href="index.html" data-zh="首页" data-en="Home">首页</a>
    <span>›</span>
    <a href="index.html#${c.category}" data-zh="${escHtml(cat.zh)}" data-en="${escHtml(cat.en)}">${escHtml(cat[lang])}</a>
    <span>›</span>
    <a href="case.html?id=${encodeURIComponent(c.id)}" data-zh="${escHtml(c.name.zh)}" data-en="${escHtml(c.name.en)}">${escHtml(c.name[lang])}</a>
  `;

  // 技能标签 HTML
  const skillsZh = (c.skills.zh || []).map(s => `<span class="skill-tag">${escHtml(s)}</span>`).join('');
  const skillsEn = (c.skills.en || []).map(s => `<span class="skill-tag">${escHtml(s)}</span>`).join('');

  // 内容主体
  document.getElementById('case-body').innerHTML = `
    <div class="content-section">
      <h3 data-zh="功能说明" data-en="Overview">功能说明</h3>
      <p data-zh="${escHtml(c.description.zh)}" data-en="${escHtml(c.description.en)}">${escHtml(c.description[lang])}</p>
    </div>

    <div class="content-section">
      <h3 data-zh="所需技能" data-en="Required Skills">所需技能</h3>
      <div class="skills-tags" id="skills-container">
        ${lang === 'zh' ? skillsZh : skillsEn}
      </div>
    </div>

    <div class="content-section">
      <h3 data-zh="使用方法" data-en="How to Use">使用方法</h3>
      <p class="howto-text" data-zh="${escHtml(c.howto.zh)}" data-en="${escHtml(c.howto.en)}">${escHtml(c.howto[lang])}</p>
    </div>

    <div class="content-section">
      <h3 data-zh="难度等级" data-en="Difficulty">难度等级</h3>
      <span class="difficulty-badge ${d.cls}" data-zh="${d.zh}" data-en="${d.en}">${d[lang]}</span>
    </div>

    <div class="case-actions">
      <a href="${safeUrl(c.githubUrl)}" target="_blank" rel="noopener" class="btn-primary"
         data-zh="在 GitHub 查看完整方案 ↗" data-en="View Full Solution on GitHub ↗">
        在 GitHub 查看完整方案 ↗
      </a>
      <a href="index.html#${c.category}" class="btn-secondary"
         data-zh="← 返回案例列表" data-en="← Back to List">
        ← 返回案例列表
      </a>
    </div>
  `;

  // 重新应用当前语言（覆盖 JS 直接写入的文字）
  setLang(getCurrentLang());

  // 技能标签需特殊处理（data-zh/data-en 在容器上，而非内部 span）
  // 改为监听语言变化时重渲染技能
  window._caseSkills = c.skills;
}

// 覆盖 setLang，附加技能重渲染
const _origSetLang = window.setLang;
window.setLang = function(lang) {
  _origSetLang(lang);
  if (window._caseSkills) {
    const container = document.getElementById('skills-container');
    if (container) {
      const skills = window._caseSkills[lang] || [];
      container.innerHTML = skills.map(s => `<span class="skill-tag">${escHtml(s)}</span>`).join('');
    }
  }
  // Also update case-cover-name-en visibility
  const coverNameEn = document.querySelector('.case-cover-name-en');
  if (coverNameEn) {
    coverNameEn.style.display = lang === 'zh' ? 'block' : 'none';
  }
};

async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    showError();
    return;
  }

  let cases;
  try {
    const res = await fetch('data/cases.json');
    if (!res.ok) throw new Error('fetch failed');
    cases = await res.json();
  } catch {
    showError();
    return;
  }
  const caseData = cases.find(c => c.id === id);

  if (!caseData) {
    showError();
    return;
  }

  // 设置页面标题
  document.title = `${caseData.name.zh} — Tina-OpenClaw`;
  renderCase(caseData);
}

function showError() {
  document.getElementById('case-cover').style.display = 'none';
  document.getElementById('case-body').innerHTML = `
    <div class="error-page">
      <h2 data-zh="找不到该案例" data-en="Case not found">找不到该案例</h2>
      <a href="index.html" class="btn-primary" style="margin-top:24px;display:inline-flex"
         data-zh="返回首页" data-en="Back to Home">返回首页</a>
    </div>
  `;
  setLang(getCurrentLang());
}

document.addEventListener('DOMContentLoaded', init);
