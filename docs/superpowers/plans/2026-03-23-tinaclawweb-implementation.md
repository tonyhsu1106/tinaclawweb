# Tinaclawweb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 Tina-OpenClaw Use Cases 静态网站，汇集 OpenClaw 应用案例，中英文双语，苹果风格 UI，部署至 Vercel。

**Architecture:** 纯静态多页面（index.html + case.html），无构建工具，`scripts/fetch-cases.js` 从 GitHub API 拉取案例数据并生成 `data/cases.json`，前端 JS 读取 JSON 渲染页面。语言切换通过 `data-zh` / `data-en` 属性 + `localStorage` 实现，无页面刷新。

**Tech Stack:** HTML5, CSS3, Vanilla JS (ES6+), Node.js 18+ (构建脚本), Vercel (部署)

**Working Directory:** `E:/cursor_workspace/claudeproject/tinaclawweb/`

---

## File Map

| 文件 | 职责 |
|------|------|
| `package.json` | Node 项目配置，`npm run fetch` 触发构建 |
| `scripts/fetch-cases.js` | 从 GitHub API 拉取 .md 文件，解析并写入 cases.json |
| `scripts/translations.js` | 案例内容中文翻译字典 |
| `data/cases.json` | 构建产物，前端读取 |
| `css/style.css` | 苹果风全局样式 |
| `js/lang.js` | 语言切换逻辑（两页面共用） |
| `js/main.js` | 首页：卡片渲染 + 汉堡菜单 |
| `js/case.js` | 详情页：从 URL ?id= 渲染案例详情 |
| `index.html` | 首页：导航 + Hero + 6个Section |
| `case.html` | 详情页：面包屑 + 封面 + 内容区 |

---

### Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `data/.gitkeep`（占位，后续 cases.json 会覆盖）

- [ ] **Step 1: 创建目录结构**

```bash
cd E:/cursor_workspace/claudeproject/tinaclawweb
mkdir -p css js data scripts
```

- [ ] **Step 2: 创建 package.json**

```json
{
  "name": "tinaclawweb",
  "version": "1.0.0",
  "description": "Tina-OpenClaw Use Cases Website",
  "scripts": {
    "fetch": "node scripts/fetch-cases.js"
  },
  "dependencies": {},
  "devDependencies": {},
  "engines": { "node": ">=18" }
}
```

- [ ] **Step 3: 验证**

```bash
node --version   # 应 >= 18
cat package.json  # 确认内容正确
```

---

### Task 2: 翻译字典（scripts/translations.js）

**Files:**
- Create: `scripts/translations.js`

> 这个文件在构建脚本运行前需存在。先用空字典，后续补全翻译。

- [ ] **Step 1: 创建 translations.js（空字典骨架）**

```javascript
// scripts/translations.js
// 案例内容中文翻译。键 = case id（.md 文件名去扩展名）
// 缺失字段自动回退显示英文原文
module.exports = {
  // 示例结构（实际运行 fetch-cases.js 后按需补充）:
  // "multi-agent-team": {
  //   name: "多代理协作团队",
  //   summary: "设置多个专业化代理协同工作，每个代理专精不同领域",
  //   description: "通过 MCP 配置多个专业化 OpenClaw 代理...",
  //   skills: ["MCP 配置", "Agent 编排", "Telegram Bot 搭建"],
  //   howto: "1. 克隆仓库\n2. 配置各代理的 MCP 工具...",
  // },
};
```

- [ ] **Step 2: 验证语法**

```bash
node -e "const t = require('./scripts/translations'); console.log('OK', typeof t)"
# Expected: OK object
```

---

### Task 3: 数据构建脚本（scripts/fetch-cases.js）

**Files:**
- Create: `scripts/fetch-cases.js`

- [ ] **Step 1: 创建 fetch-cases.js**

```javascript
// scripts/fetch-cases.js
// 从 GitHub API 拉取 awesome-openclaw-usecases 案例，生成 data/cases.json
// 运行: node scripts/fetch-cases.js

const fs = require('fs');
const path = require('path');
const translations = require('./translations');

const REPO_API = 'https://api.github.com/repos/hesamsheikh/awesome-openclaw-usecases/contents/usecases';
const RAW_BASE = 'https://raw.githubusercontent.com/hesamsheikh/awesome-openclaw-usecases/main/usecases/';

const CATEGORY_META = {
  social:       { gradient: ['#ff375f', '#ff6b6b'], icon: '📱' },
  creative:     { gradient: ['#5856d6', '#7c3aed'], icon: '🎨' },
  devops:       { gradient: ['#0071e3', '#00b4d8'], icon: '⚙️' },
  productivity: { gradient: ['#34c759', '#30d158'], icon: '📋' },
  research:     { gradient: ['#ff9500', '#ffcc00'], icon: '🔬' },
  finance:      { gradient: ['#00b894', '#00cec9'], icon: '💰' },
};

// 按文件名关键词归类
function detectCategory(filename) {
  const f = filename.toLowerCase();
  if (/social|post|twitter|instagram|reddit|youtube|digest/.test(f)) return 'social';
  if (/game|build|app|creative|design|overnight/.test(f)) return 'creative';
  if (/server|deploy|infra|devops|docker|k8s|self.heal/.test(f)) return 'devops';
  if (/meeting|crm|task|brief|morning|family|hub/.test(f)) return 'productivity';
  if (/research|paper|arxiv|latex|knowledge|rag|brain|memory|semantic/.test(f)) return 'research';
  if (/finance|trading|earnings|market|stock|mvp/.test(f)) return 'finance';
  return 'productivity';
}

// 文件名转可读名称（回退用）
function filenameToTitle(filename) {
  return filename
    .replace(/\.md$/, '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// 从 Markdown 提取各字段
function parseMarkdown(content, filename) {
  const lines = content.split('\n');

  // name: 第一个 # 标题
  const nameMatch = lines.find(l => l.startsWith('# '));
  const name = nameMatch ? nameMatch.replace(/^# /, '').trim() : filenameToTitle(filename);

  // 提取章节内容
  function getSection(...headings) {
    const pattern = headings.map(h => h.toLowerCase()).join('|');
    const re = new RegExp(`^## (${pattern})\\s*$`, 'i');
    let inSection = false;
    let result = [];
    for (const line of lines) {
      if (/^## /.test(line)) {
        if (re.test(line)) { inSection = true; continue; }
        else { inSection = false; }
      }
      if (inSection) result.push(line);
    }
    return result.join('\n').trim();
  }

  const descSection = getSection('overview', 'description', 'about');
  const description = descSection || content.substring(0, 200).trim();

  const skillsSection = getSection('required skills', 'skills', 'skills needed');
  const skills = skillsSection
    ? skillsSection.split('\n')
        .filter(l => /^[-*]\s/.test(l))
        .map(l => l.replace(/^[-*]\s+/, '').trim())
        .filter(Boolean)
    : [];

  const howto = getSection('how to use', 'setup', 'how it works');

  const diffSection = getSection('difficulty');
  let difficulty = 'intermediate';
  if (diffSection) {
    const d = diffSection.toLowerCase();
    if (d.includes('beginner') || d.includes('easy')) difficulty = 'beginner';
    else if (d.includes('advanced') || d.includes('expert')) difficulty = 'advanced';
    else difficulty = 'intermediate';
  } else {
    if (skills.length <= 2) difficulty = 'beginner';
    else if (skills.length >= 5) difficulty = 'advanced';
    else difficulty = 'intermediate';
  }

  // summary: description 前 100 字
  const summary = description.substring(0, 120).replace(/\n/g, ' ').trim();

  return { name, description, skills, howto, difficulty, summary };
}

async function main() {
  console.log('Fetching file list from GitHub...');
  const listRes = await fetch(REPO_API, {
    headers: { 'User-Agent': 'tinaclawweb-builder' }
  });

  if (!listRes.ok) {
    console.error(`GitHub API error: ${listRes.status} ${listRes.statusText}`);
    if (listRes.status === 403) console.error('Rate limited. Wait and retry.');
    process.exit(1);
  }

  const files = await listRes.json();
  const mdFiles = files.filter(f => f.name.endsWith('.md'));
  console.log(`Found ${mdFiles.length} markdown files.`);

  const cases = [];

  for (const file of mdFiles) {
    const id = file.name.replace(/\.md$/, '');
    console.log(`  Processing: ${file.name}`);

    const rawRes = await fetch(RAW_BASE + file.name, {
      headers: { 'User-Agent': 'tinaclawweb-builder' }
    });

    if (!rawRes.ok) {
      console.warn(`  WARN: Failed to fetch ${file.name}, skipping.`);
      continue;
    }

    const content = await rawRes.text();
    const parsed = parseMarkdown(content, file.name);
    const category = detectCategory(file.name);
    const meta = CATEGORY_META[category];
    const t = translations[id] || {};

    cases.push({
      id,
      category,
      icon: meta.icon,
      gradient: meta.gradient,
      name: { en: parsed.name, zh: t.name || parsed.name },
      summary: { en: parsed.summary, zh: t.summary || parsed.summary },
      description: { en: parsed.description, zh: t.description || parsed.description },
      skills: { en: parsed.skills, zh: t.skills || parsed.skills },
      howto: { en: parsed.howto, zh: t.howto || parsed.howto },
      difficulty: parsed.difficulty,
      githubUrl: `https://github.com/hesamsheikh/awesome-openclaw-usecases/blob/main/usecases/${file.name}`
    });
  }

  // 按类别顺序排序
  const CATEGORY_ORDER = ['social', 'creative', 'devops', 'productivity', 'research', 'finance'];
  cases.sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));

  const outPath = path.join(__dirname, '..', 'data', 'cases.json');
  fs.writeFileSync(outPath, JSON.stringify(cases, null, 2), 'utf-8');
  console.log(`\nDone! Written ${cases.length} cases to data/cases.json`);
}

main().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: 运行脚本生成 cases.json**

```bash
cd E:/cursor_workspace/claudeproject/tinaclawweb
node scripts/fetch-cases.js
```

Expected 输出类似:
```
Fetching file list from GitHub...
Found 20 markdown files.
  Processing: multi-agent-team.md
  ...
Done! Written 20 cases to data/cases.json
```

- [ ] **Step 3: 验证 cases.json 格式**

```bash
node -e "
const c = require('./data/cases.json');
console.log('Total cases:', c.length);
console.log('First case id:', c[0].id);
console.log('Fields:', Object.keys(c[0]).join(', '));
"
```

Expected: 输出案例数量 ≥ 5，字段包含 id, category, name, summary, description, skills, howto, difficulty, githubUrl

---

### Task 4: 全局样式（css/style.css）

**Files:**
- Create: `css/style.css`

- [ ] **Step 1: 创建 style.css**

```css
/* css/style.css — 苹果风格全局样式 */

/* ===== Reset & Base ===== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
  background-color: #f5f5f7;
  color: #1d1d1f;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

a { color: #0071e3; text-decoration: none; }
a:hover { text-decoration: underline; }

/* ===== Navigation ===== */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  border-bottom: 1px solid #d2d2d7;
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 16px;
}

.navbar-logo {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1f;
  white-space: nowrap;
  flex-shrink: 0;
}

.navbar-categories {
  display: flex;
  gap: 4px;
  flex: 1;
  justify-content: center;
  overflow: hidden;
}

.navbar-categories a {
  font-size: 13px;
  color: #1d1d1f;
  padding: 6px 10px;
  border-radius: 8px;
  white-space: nowrap;
  transition: background 0.15s;
}

.navbar-categories a:hover {
  background: #f5f5f7;
  text-decoration: none;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 语言切换按钮 */
.lang-btn {
  font-size: 13px;
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid #d2d2d7;
  background: transparent;
  color: #1d1d1f;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.lang-btn.active {
  background: #1d1d1f;
  color: #ffffff;
  border-color: #1d1d1f;
}

.lang-btn:hover:not(.active) {
  background: #f5f5f7;
}

/* 汉堡菜单按钮 */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  padding: 4px;
  background: none;
  border: none;
}

.hamburger span {
  display: block;
  width: 22px;
  height: 2px;
  background: #1d1d1f;
  border-radius: 2px;
  transition: transform 0.2s, opacity 0.2s;
}

/* 移动端下拉菜单 */
.mobile-menu {
  display: none;
  position: absolute;
  top: 52px;
  left: 0;
  right: 0;
  background: #ffffff;
  border-bottom: 1px solid #d2d2d7;
  padding: 8px 0;
  z-index: 99;
  animation: slideDown 0.2s ease;
}

.mobile-menu a {
  display: block;
  padding: 12px 24px;
  font-size: 15px;
  color: #1d1d1f;
  border-bottom: 1px solid #f5f5f7;
}

.mobile-menu a:last-child { border-bottom: none; }
.mobile-menu a:hover { background: #f5f5f7; text-decoration: none; }

.nav-open .mobile-menu { display: block; }

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ===== Hero ===== */
.hero {
  text-align: center;
  padding: 64px 24px 48px;
  background: #f5f5f7;
}

.hero h1 {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: #1d1d1f;
  margin-bottom: 16px;
  line-height: 1.1;
}

.hero p {
  font-size: 19px;
  color: #6e6e73;
  max-width: 560px;
  margin: 0 auto;
}

/* ===== Section ===== */
.cases-section {
  padding: 48px 24px 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.cases-section h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 24px;
}

/* ===== Cards Grid ===== */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* ===== Card ===== */
.card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  text-decoration: none;
}

.card-cover {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  flex-shrink: 0;
}

.card-body {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-name-zh {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
  line-height: 1.3;
}

.card-name-en {
  font-size: 12px;
  color: #6e6e73;
}

.card-summary {
  font-size: 14px;
  color: #6e6e73;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.tag {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 20px;
  background: #f5f5f7;
  color: #6e6e73;
  font-weight: 500;
}

.tag-difficulty-beginner { background: #d1fae5; color: #065f46; }
.tag-difficulty-intermediate { background: #fef3c7; color: #92400e; }
.tag-difficulty-advanced { background: #fee2e2; color: #991b1b; }

/* ===== Detail Page ===== */
.case-cover {
  width: 100%;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.case-cover-emoji { font-size: 64px; }
.case-cover-name-zh { font-size: 32px; font-weight: 700; color: #ffffff; }
.case-cover-name-en { font-size: 16px; color: rgba(255,255,255,0.75); }

.case-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.breadcrumb {
  font-size: 14px;
  color: #6e6e73;
  margin-bottom: 32px;
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.breadcrumb a { color: #0071e3; }
.breadcrumb span { color: #6e6e73; }

.content-section {
  margin-bottom: 32px;
}

.content-section h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 12px;
}

.content-section p {
  font-size: 16px;
  color: #1d1d1f;
  line-height: 1.7;
  white-space: pre-wrap;
}

.skills-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.skill-tag {
  font-size: 13px;
  padding: 5px 12px;
  border-radius: 20px;
  background: #f0f0f5;
  color: #1d1d1f;
  font-weight: 500;
}

.howto-text {
  font-size: 16px;
  color: #1d1d1f;
  line-height: 1.8;
  white-space: pre-wrap;
}

.difficulty-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
}

.case-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 40px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  padding: 12px 24px;
  border-radius: 20px;
  background: #0071e3;
  color: #ffffff;
  font-weight: 500;
  transition: background 0.15s;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: #005bb5;
  text-decoration: none;
  color: #ffffff;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  padding: 12px 24px;
  border-radius: 20px;
  background: transparent;
  color: #0071e3;
  font-weight: 500;
  border: 1px solid #0071e3;
  transition: background 0.15s;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f0f7ff;
  text-decoration: none;
}

/* 语言切换浮动按钮（详情页） */
.lang-toggle-float {
  position: sticky;
  top: 60px;
  display: flex;
  justify-content: flex-end;
  margin-bottom: -32px;
  z-index: 10;
  padding: 0 24px;
}

/* 错误提示 */
.error-page {
  text-align: center;
  padding: 80px 24px;
}

.error-page h2 {
  font-size: 28px;
  color: #1d1d1f;
  margin-bottom: 16px;
}

/* ===== Footer ===== */
footer {
  text-align: center;
  padding: 32px 24px;
  font-size: 13px;
  color: #6e6e73;
  border-top: 1px solid #d2d2d7;
  margin-top: 32px;
}

/* ===== Responsive ===== */
@media (max-width: 1023px) {
  .cards-grid { grid-template-columns: repeat(2, 1fr); }
  .hero h1 { font-size: 36px; }
}

@media (max-width: 767px) {
  .cards-grid { grid-template-columns: 1fr; }
  .navbar-categories { display: none; }
  .hamburger { display: flex; }
  .hero h1 { font-size: 28px; }
  .hero p { font-size: 16px; }
  .hero { padding: 40px 16px 32px; }
  .cases-section { padding: 32px 16px 24px; }
  .case-content { padding: 24px 16px 60px; }
}
```

- [ ] **Step 2: 不需要单独验证（Task 6 写 HTML 后一起在浏览器验证）**

---

### Task 5: 语言模块（js/lang.js）

**Files:**
- Create: `js/lang.js`

- [ ] **Step 1: 创建 lang.js**

```javascript
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
```

- [ ] **Step 2: 验证语法**

```bash
node -e "
// 简单语法检查
const fs = require('fs');
const code = fs.readFileSync('./js/lang.js', 'utf-8');
new Function(code);
console.log('lang.js syntax OK');
"
```

---

### Task 6: 首页 HTML（index.html）

**Files:**
- Create: `index.html`

- [ ] **Step 1: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title data-zh="Tina-OpenClaw 应用案例" data-en="Tina-OpenClaw Use Cases">Tina-OpenClaw 应用案例</title>
  <meta name="description" content="汇集 OpenClaw 真实应用案例，探索 AI 改变工作与生活的方式">
  <link rel="stylesheet" href="css/style.css">
  <script src="js/lang.js"></script>
</head>
<body>

<!-- 导航栏 -->
<nav class="navbar" id="navbar">
  <div class="navbar-logo">Tina-OpenClaw</div>
  <div class="navbar-categories">
    <a href="#social" data-zh="社交媒体" data-en="Social">社交媒体</a>
    <a href="#creative" data-zh="创意与构建" data-en="Creative">创意与构建</a>
    <a href="#devops" data-zh="基础设施" data-en="DevOps">基础设施</a>
    <a href="#productivity" data-zh="生产力" data-en="Productivity">生产力</a>
    <a href="#research" data-zh="研究与学习" data-en="Research">研究与学习</a>
    <a href="#finance" data-zh="金融与交易" data-en="Finance">金融与交易</a>
  </div>
  <div class="navbar-right">
    <button class="lang-btn active" data-lang="zh" onclick="setLang('zh')">中</button>
    <button class="lang-btn" data-lang="en" onclick="setLang('en')">EN</button>
    <button class="hamburger" id="hamburger-btn" aria-label="菜单" onclick="toggleMenu()">
      <span></span><span></span><span></span>
    </button>
  </div>
  <!-- 移动端下拉菜单 -->
  <div class="mobile-menu" id="mobile-menu">
    <a href="#social" data-zh="📱 社交媒体" data-en="📱 Social" onclick="closeMenu()">📱 社交媒体</a>
    <a href="#creative" data-zh="🎨 创意与构建" data-en="🎨 Creative" onclick="closeMenu()">🎨 创意与构建</a>
    <a href="#devops" data-zh="⚙️ 基础设施" data-en="⚙️ DevOps" onclick="closeMenu()">⚙️ 基础设施</a>
    <a href="#productivity" data-zh="📋 生产力" data-en="📋 Productivity" onclick="closeMenu()">📋 生产力</a>
    <a href="#research" data-zh="🔬 研究与学习" data-en="🔬 Research" onclick="closeMenu()">🔬 研究与学习</a>
    <a href="#finance" data-zh="💰 金融与交易" data-en="💰 Finance" onclick="closeMenu()">💰 金融与交易</a>
  </div>
</nav>

<!-- Hero -->
<section class="hero">
  <h1 data-zh="汇集 OpenClaw 真实应用案例" data-en="Discover Real OpenClaw Use Cases">汇集 OpenClaw 真实应用案例</h1>
  <p>
    <span data-zh="探索 AI 改变工作与生活的" data-en="Explore">探索 AI 改变工作与生活的</span>
    <strong id="case-count">...</strong>
    <span data-zh="种方式" data-en="ways AI transforms work and life"></span>
  </p>
</section>

<!-- 案例 Sections（卡片由 main.js 动态注入） -->
<div id="sections-container">
  <section id="social" class="cases-section">
    <h2 data-zh="📱 社交媒体" data-en="📱 Social Media">📱 社交媒体</h2>
    <div class="cards-grid" id="grid-social"></div>
  </section>

  <section id="creative" class="cases-section">
    <h2 data-zh="🎨 创意与构建" data-en="🎨 Creative & Building">🎨 创意与构建</h2>
    <div class="cards-grid" id="grid-creative"></div>
  </section>

  <section id="devops" class="cases-section">
    <h2 data-zh="⚙️ 基础设施与 DevOps" data-en="⚙️ Infrastructure & DevOps">⚙️ 基础设施与 DevOps</h2>
    <div class="cards-grid" id="grid-devops"></div>
  </section>

  <section id="productivity" class="cases-section">
    <h2 data-zh="📋 生产力工具" data-en="📋 Productivity">📋 生产力工具</h2>
    <div class="cards-grid" id="grid-productivity"></div>
  </section>

  <section id="research" class="cases-section">
    <h2 data-zh="🔬 研究与学习" data-en="🔬 Research & Learning">🔬 研究与学习</h2>
    <div class="cards-grid" id="grid-research"></div>
  </section>

  <section id="finance" class="cases-section">
    <h2 data-zh="💰 金融与交易" data-en="💰 Finance & Trading">💰 金融与交易</h2>
    <div class="cards-grid" id="grid-finance"></div>
  </section>
</div>

<footer>
  <p data-zh="数据来源：awesome-openclaw-usecases · 由 Tina 整理" data-en="Data source: awesome-openclaw-usecases · Curated by Tina">数据来源：awesome-openclaw-usecases · 由 Tina 整理</p>
</footer>

<script src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: 验证 HTML 结构（打开浏览器手动检查）**

用 VS Code Live Server 或直接打开文件确认：
- 导航栏显示正常
- Hero 区显示 "..."（等待 JS 加载后显示数字）
- 6 个空白 Section 存在

---

### Task 7: 首页 JS（js/main.js）

**Files:**
- Create: `js/main.js`

- [ ] **Step 1: 创建 main.js**

```javascript
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
  const res = await fetch('data/cases.json');
  const cases = await res.json();

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

document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 2: 在浏览器中验证首页**

用 VS Code Live Server（或 `python -m http.server 8080`）打开 index.html 确认：
- 卡片正确渲染（颜色、emoji、文字）
- Hero 区显示案例数量
- 点击「中 / EN」切换语言
- 移动端宽度（< 768px）下汉堡菜单可用

---

### Task 8: 详情页 HTML（case.html）

**Files:**
- Create: `case.html`

- [ ] **Step 1: 创建 case.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>案例详情 — Tina-OpenClaw</title>
  <link rel="stylesheet" href="css/style.css">
  <script src="js/lang.js"></script>
</head>
<body>

<!-- 导航栏（简化版，不含类别链接） -->
<nav class="navbar">
  <a class="navbar-logo" href="index.html">Tina-OpenClaw</a>
  <div style="flex:1"></div>
  <div class="navbar-right">
    <button class="lang-btn active" data-lang="zh" onclick="setLang('zh')">中</button>
    <button class="lang-btn" data-lang="en" onclick="setLang('en')">EN</button>
  </div>
</nav>

<!-- 封面区（由 case.js 动态填充） -->
<div id="case-cover"></div>

<!-- 内容区 -->
<div class="case-content">
  <!-- 面包屑（由 case.js 填充） -->
  <div class="breadcrumb" id="breadcrumb"></div>

  <!-- 语言切换浮动按钮 -->
  <div class="lang-toggle-float">
    <div style="display:flex;gap:8px">
      <button class="lang-btn active" data-lang="zh" onclick="setLang('zh')">🇨🇳 中文</button>
      <button class="lang-btn" data-lang="en" onclick="setLang('en')">🇬🇧 English</button>
    </div>
  </div>

  <!-- 内容主体（由 case.js 填充） -->
  <div id="case-body"></div>
</div>

<footer>
  <p data-zh="数据来源：awesome-openclaw-usecases · 由 Tina 整理" data-en="Data source: awesome-openclaw-usecases · Curated by Tina">数据来源：awesome-openclaw-usecases · 由 Tina 整理</p>
</footer>

<script src="js/case.js"></script>
</body>
</html>
```

---

### Task 9: 详情页 JS（js/case.js）

**Files:**
- Create: `js/case.js`

- [ ] **Step 1: 创建 case.js**

```javascript
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

function renderCase(c) {
  const lang = getCurrentLang();
  const d = DIFFICULTY_LABEL[c.difficulty] || DIFFICULTY_LABEL.intermediate;
  const cat = CATEGORY_LABEL[c.category] || { zh: c.category, en: c.category };

  // 封面
  const cover = document.getElementById('case-cover');
  cover.style.background = `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})`;
  cover.className = 'case-cover';
  cover.innerHTML = `
    <div class="case-cover-emoji">${c.icon}</div>
    <div class="case-cover-name-zh" data-zh="${escHtml(c.name.zh)}" data-en="${escHtml(c.name.en)}">${escHtml(c.name[lang])}</div>
    <div class="case-cover-name-en" style="display:${lang==='zh'?'block':'none'}">${escHtml(c.name.en)}</div>
  `;

  // 面包屑
  document.getElementById('breadcrumb').innerHTML = `
    <a href="index.html" data-zh="首页" data-en="Home">首页</a>
    <span>›</span>
    <a href="index.html#${c.category}" data-zh="${escHtml(cat.zh)}" data-en="${escHtml(cat.en)}">${escHtml(cat[lang])}</a>
    <span>›</span>
    <span data-zh="${escHtml(c.name.zh)}" data-en="${escHtml(c.name.en)}">${escHtml(c.name[lang])}</span>
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
      <a href="${escHtml(c.githubUrl)}" target="_blank" rel="noopener" class="btn-primary"
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
};

async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    showError();
    return;
  }

  const res = await fetch('data/cases.json');
  const cases = await res.json();
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
}

document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 2: 在浏览器中验证详情页**

打开 `case.html?id=<任意有效id>`（从 cases.json 取第一个 id），确认：
- 封面渐变色和 emoji 正确
- 面包屑链接正确
- 功能说明/所需技能/使用方法/难度 均正常渲染
- 语言切换正常
- 两个按钮链接正确
- 打开 `case.html?id=not-exist` 显示错误提示

---

### Task 10: Git 初始化与提交

**Files:** 所有文件

- [ ] **Step 1: 初始化 Git 仓库**

```bash
cd E:/cursor_workspace/claudeproject/tinaclawweb
git init
```

- [ ] **Step 2: 创建 .gitignore**

```
node_modules/
.DS_Store
*.log
```

- [ ] **Step 3: 首次提交**

```bash
git add .
git commit -m "feat: initial tinaclawweb implementation

- Static multi-page site (index.html + case.html)
- Apple-style UI with category cards
- Bilingual zh/en language switch
- Build script to fetch cases from GitHub API
- Responsive layout (4/2/1 column breakpoints)"
```

---

### Task 11: 翻译补充（可选但推荐）

**Files:**
- Modify: `scripts/translations.js`

> 运行 `node scripts/fetch-cases.js` 后，查看 `data/cases.json` 获取所有 case id，为每个 id 补充中文翻译。

- [ ] **Step 1: 查看所有 case id**

```bash
node -e "
const c = require('./data/cases.json');
c.forEach(x => console.log(x.id, '|', x.name.en));
"
```

- [ ] **Step 2: 在 translations.js 中为每个 case 添加翻译**

参考已有的注释示例格式，填入中文 name/summary/description/skills/howto。

- [ ] **Step 3: 重新运行构建脚本**

```bash
node scripts/fetch-cases.js
# 验证 cases.json 中 name.zh 已更新为中文
```

- [ ] **Step 4: 提交翻译**

```bash
git add scripts/translations.js data/cases.json
git commit -m "feat: add Chinese translations for all cases"
```

---

### Task 12: 部署至 Vercel

- [ ] **Step 1: 推送至 GitHub**

```bash
# 在 GitHub 创建新仓库 tinaclawweb，然后:
git remote add origin https://github.com/<username>/tinaclawweb.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: 在 Vercel 配置**

- Import GitHub 仓库
- Framework Preset: Other（静态）
- Build Command: 留空
- Output Directory: `./`（根目录）
- 点击 Deploy

- [ ] **Step 3: 验证线上版本**

打开 Vercel 提供的 URL，测试：
- 首页卡片加载
- 点击卡片跳转详情页
- 语言切换
- 移动端响应式布局
