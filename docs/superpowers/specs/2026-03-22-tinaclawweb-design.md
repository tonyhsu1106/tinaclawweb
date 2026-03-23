# Tina-OpenClaw Use Cases 网站设计文档

**日期：** 2026-03-22
**项目名称：** Tina-龙虾应用案例 / Tina-OpenClaw Use Cases
**技术栈：** 纯静态（HTML + CSS + JS），部署至 Vercel
**数据来源：** https://github.com/hesamsheikh/awesome-openclaw-usecases

---

## 1. 项目目标

汇总展示 OpenClaw 真实应用案例，按 6 大类别组织，中英文双语，支持卡片交互与独立详情页，风格对标苹果官网（白底浅灰，简洁高端）。

---

## 2. 目录结构

```
tinaclawweb/
├── index.html              # 首页
├── case.html               # 详情页模板（?id=xxx）
├── css/
│   └── style.css           # 苹果风主题样式
├── js/
│   ├── lang.js             # 语言切换（setLang），两个页面共用
│   ├── main.js             # 首页渲染逻辑 + 汉堡菜单
│   └── case.js             # 详情页渲染逻辑
├── data/
│   └── cases.json          # 预生成案例数据（含中英文内容）
├── scripts/
│   ├── fetch-cases.js      # Node.js 构建脚本
│   └── translations.js     # 手动维护的中文翻译数据（案例内容）
├── package.json            # Node >=18，无外部依赖
└── docs/
    └── superpowers/specs/
        └── 2026-03-22-tinaclawweb-design.md
```

---

## 3. 视觉风格

- **背景色：** `#f5f5f7`（苹果浅灰）
- **卡片/导航背景：** `#ffffff`
- **主文字色：** `#1d1d1f`
- **次要文字色：** `#6e6e73`
- **强调色：** `#0071e3`（苹果蓝）
- **字体：** `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif`
- **卡片封面：** 每个类别独特渐变色 + 大 emoji 图标
- **圆角：** `12px`（卡片），`20px`（胶囊按钮）
- **阴影：** `0 2px 8px rgba(0,0,0,0.08)`

### 6 类别渐变色方案

| 类别 ID | 中文名 | 渐变色 | Emoji |
|---------|--------|--------|-------|
| social | 社交媒体 | `#ff375f → #ff6b6b` | 📱 |
| creative | 创意与构建 | `#5856d6 → #7c3aed` | 🎨 |
| devops | 基础设施与 DevOps | `#0071e3 → #00b4d8` | ⚙️ |
| productivity | 生产力工具 | `#34c759 → #30d158` | 📋 |
| research | 研究与学习 | `#ff9500 → #ffcc00` | 🔬 |
| finance | 金融与交易 | `#00b894 → #00cec9` | 💰 |

> 注：每个类别渐变色均不同，视觉可区分。

---

## 4. 数据结构

### 4.1 cases.json 格式

```json
[
  {
    "id": "multi-agent-team",
    "category": "productivity",
    "icon": "🤖",
    "gradient": ["#34c759", "#30d158"],
    "name": {
      "zh": "多代理协作团队",
      "en": "Multi-Agent Team"
    },
    "summary": {
      "zh": "设置多个专业化代理协同工作，每个代理专精不同领域",
      "en": "Set up multiple specialized agents working together, each expert in a domain"
    },
    "description": {
      "zh": "详细功能说明（中文）...",
      "en": "Full description (English)..."
    },
    "skills": {
      "zh": ["MCP 配置", "Agent 编排", "Telegram Bot 搭建"],
      "en": ["MCP setup", "Agent orchestration", "Telegram Bot"]
    },
    "howto": {
      "zh": "使用方法（中文）...",
      "en": "How to use (English)..."
    },
    "difficulty": "intermediate",
    "githubUrl": "https://github.com/hesamsheikh/awesome-openclaw-usecases/blob/main/usecases/multi-agent-team.md"
  }
]
```

### 4.2 id 生成规则

- `id` = Markdown 文件名去掉 `.md` 扩展名（例：`multi-agent-team.md` → `multi-agent-team`）
- id 全局唯一，由文件名保证（GitHub 仓库中文件名不重复）
- 若 `case.html?id=xxx` 中 id 在 cases.json 中不存在，`case.js` 显示错误提示并提供跳回首页链接

### 4.3 难度级别枚举

- `beginner` — 入门
- `intermediate` — 中级
- `advanced` — 高级

---

## 5. 首页设计（index.html）

### 5.1 导航栏

- **左侧：** Logo「Tina-OpenClaw」
- **中间：** 6 类别锚点链接（点击滚动到对应 Section）
- **右侧：** 语言切换按钮「中 / EN」
- **样式：** 白底，底部 `1px solid #d2d2d7`，`position: sticky; top: 0; z-index: 100`
- **移动端（≤767px）：** 中间类别链接收起为汉堡菜单（见 5.5）

### 5.2 Hero 区

- 大标题：`汇集 OpenClaw 真实应用案例`（`data-zh`）/ `Discover Real OpenClaw Use Cases`（`data-en`）
- 副标题：`探索 AI 改变工作与生活的 <span id="case-count"></span> 种方式`，`case-count` 由 `main.js` 加载 cases.json 后填入 `cases.length`
- 背景：`#f5f5f7`，无图片

### 5.3 案例 Section

6 个 Section，顺序固定：社交媒体 → 创意与构建 → DevOps → 生产力 → 研究与学习 → 金融与交易

每个 Section：
```html
<section id="{category-id}">
  <h2 data-zh="{中文类别名}" data-en="{英文类别名}">{中文类别名}</h2>
  <div class="cards-grid"><!-- 卡片动态渲染 --></div>
</section>
```

### 5.4 案例卡片

```
┌────────────────────────┐
│  渐变色封面（高120px）  │  ← emoji 居中，64px
├────────────────────────┤
│  中文名称（16px 粗体）  │
│  English Name（12px）  │
│  功能摘要（14px，2行）  │  ← overflow: ellipsis
│  [类别] [难度标签]      │
└────────────────────────┘
```

点击整张卡片跳转：`case.html?id={id}`

### 5.5 汉堡菜单（移动端）

- 触发：导航栏右侧汉堡图标（三横线），点击展开/收起
- 样式：从导航栏下方向下滑出（`slideDown`），白色背景，每个类别链接占一行，点击后自动收起
- JS 逻辑：在 `main.js` 中处理，toggle `nav-open` class

---

## 6. 详情页设计（case.html）

### 6.1 面包屑
```
首页 > {类别名} > {案例名}
```
均为 `<a>` 链接，首页链接到 `index.html`，类别链接到 `index.html#{category-id}`

### 6.2 封面区

- 全宽渐变色背景（与该案例的 gradient 字段一致）
- emoji（64px）+ 中文名称（32px 白色粗体）+ 英文名称（16px 白色半透明）

### 6.3 语言切换

- 位置：内容区顶部右侧固定胶囊按钮「🇨🇳 中文 / 🇬🇧 English」
- 默认语言：中文
- 切换逻辑（**`js/lang.js`** 定义，`index.html` 和 `case.html` 均引入）：
  ```javascript
  // js/lang.js
  function setLang(lang) {
    localStorage.setItem('lang', lang);
    document.querySelectorAll('[data-zh][data-en]').forEach(el => {
      el.textContent = el.dataset[lang];
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }
  const lang = localStorage.getItem('lang') || 'zh';
  setLang(lang);
  ```
- `main.js` 仅负责首页渲染和汉堡菜单，**不包含** `setLang`
- `case.js` 仅负责详情页渲染，**不包含** `setLang`
- 两页均在 `<head>` 中先加载 `<script src="js/lang.js">`，再加载各自的 JS

### 6.4 内容区（结构化）

| 区块 | 内容 |
|------|------|
| 功能说明 | `description.zh` / `description.en` |
| 所需技能 | `skills.zh[]` / `skills.en[]` 渲染为标签 |
| 使用方法 | `howto.zh` / `howto.en` |
| 难度等级 | 根据 `difficulty` 显示「入门 / 中级 / 高级」 |

### 6.5 底部操作区

- 主按钮：「在 GitHub 查看完整方案 ↗」（蓝色，`target="_blank"`，`rel="noopener"`）
- 次按钮：「← 返回案例列表」（跳回 `index.html#{category-id}`）

### 6.6 错误处理

若 URL 中 `id` 参数缺失或在 cases.json 中不存在：
```
找不到该案例
[返回首页]
```

---

## 7. 数据构建脚本（scripts/fetch-cases.js）

### 7.1 运行方式

```bash
node scripts/fetch-cases.js
# 生成 data/cases.json
```

依赖：`node-fetch`（在 `package.json` 中声明，Node 18+ 可用内置 fetch 无需安装）

### 7.2 GitHub 仓库结构（已确认）

```
awesome-openclaw-usecases/
└── usecases/
    ├── multi-agent-team.md
    ├── overnight-mini-app-builder.md
    ├── autonomous-game-dev-pipeline.md
    ├── second-brain.md
    ├── knowledge-base-rag.md
    ├── event-guest-confirmation.md
    └── ... （约 20+ 个文件）
```

API 调用方式（无需 token，public 仓库，速率限制 60次/小时 足够）：
```
GET https://api.github.com/repos/hesamsheikh/awesome-openclaw-usecases/contents/usecases
GET https://raw.githubusercontent.com/hesamsheikh/awesome-openclaw-usecases/main/usecases/{filename}
```

约 20 个文件 = 21 次 API 调用，远低于 60 次限制。若触发限流，脚本打印错误信息并退出，手动等待后重试即可（可接受行为，不做自动重试）。

Section HTML `id` 属性直接使用类别 ID 英文 key：
```html
<section id="social">...</section>
<section id="creative">...</section>
<section id="devops">...</section>
<section id="productivity">...</section>
<section id="research">...</section>
<section id="finance">...</section>
```
导航锚点和返回按钮均使用 `index.html#social` 等格式，与类别 key 保持一致。

### 7.3 Markdown 解析规则

仓库中每个 `.md` 文件为纯英文，仅包含英文内容。中文由 `translations.js` 单独提供（见 7.5）。

**示例文件结构（典型格式）：**
```markdown
# Multi-Agent Team

## Overview
Sets up multiple specialized OpenClaw agents...

## Required Skills
- MCP configuration
- Agent orchestration
- Telegram Bot setup

## How to Use
1. Clone the repo...
2. Configure agents...

## Difficulty
Intermediate
```

**提取规则（按优先级匹配章节标题，不区分大小写）：**

| 字段 | 匹配的章节标题 | 回退行为 |
|------|--------------|---------|
| `name.en` | 文件第一个 `# ` 标题 | 使用文件名（去连字符、首字母大写） |
| `description.en` | `## Overview` \| `## Description` \| `## About` | 取文件前 200 字符 |
| `skills.en[]` | `## Required Skills` \| `## Skills` \| `## Skills Needed` | 空数组 `[]` |
| `howto.en` | `## How to Use` \| `## Setup` \| `## How It Works` | 空字符串 |
| `difficulty` | `## Difficulty` 章节内容匹配 `beginner/intermediate/advanced` | 按 skills 数量推断：0-2=beginner, 3-4=intermediate, 5+=advanced |

`skills` 章节按 `- ` 或 `* ` 开头的列表项分割，每项去除前缀空白。

### 7.4 归类规则（关键词映射）

脚本按文件名关键词自动归类，无法匹配则归入 `productivity`（默认）：

| 关键词（文件名含） | 类别 |
|-------------------|------|
| social, post, twitter, instagram, reddit, youtube, digest | social |
| game, build, app, creative, design, overnight | creative |
| server, deploy, infra, devops, docker, k8s, self-heal | devops |
| meeting, crm, task, brief, morning, family, hub | productivity |
| research, paper, arxiv, latex, knowledge, rag, brain, memory, semantic | research |
| finance, trading, earnings, market, stock, mvp | finance |

**`gradient` 和 `icon` 字段**由构建脚本根据 `category` 自动填入，不来自 `.md` 文件：

```javascript
const CATEGORY_META = {
  social:       { gradient: ['#ff375f', '#ff6b6b'], icon: '📱' },
  creative:     { gradient: ['#5856d6', '#7c3aed'], icon: '🎨' },
  devops:       { gradient: ['#0071e3', '#00b4d8'], icon: '⚙️' },
  productivity: { gradient: ['#34c759', '#30d158'], icon: '📋' },
  research:     { gradient: ['#ff9500', '#ffcc00'], icon: '🔬' },
  finance:      { gradient: ['#00b894', '#00cec9'], icon: '💰' },
};
```

### 7.5 翻译方案

`scripts/translations.js` 维护**案例内容**的中文翻译（name/summary/description/skills/howto）。UI 固定文本（导航、按钮、标签）直接硬编码在 HTML 的 `data-zh` 属性中，不经过此文件。

```javascript
// scripts/translations.js — 案例内容中文翻译
module.exports = {
  "multi-agent-team": {
    name: "多代理协作团队",
    summary: "设置多个专业化代理协同工作...",
    description: "...",
    skills: ["MCP 配置", "Agent 编排", "Telegram Bot 搭建"],
    howto: "1. 克隆仓库...\n2. 配置代理..."
  },
  // ... 每个 case id 对应一条记录
};
```

**合并逻辑（fetch-cases.js 中）：**
```javascript
const translations = require('./translations');
const t = translations[id] || {};
cases.push({
  id,
  name: { en: parsedName, zh: t.name || parsedName },
  description: { en: parsedDesc, zh: t.description || parsedDesc },
  skills: { en: parsedSkills, zh: t.skills || parsedSkills },
  howto: { en: parsedHowto, zh: t.howto || parsedHowto },
  summary: { en: parsedSummary, zh: t.summary || parsedSummary },
  // ...
});
```

翻译缺失字段**回退显示英文原文**。初期约 20 条，手动编写可控。

---

## 8. 响应式断点

| 断点 | 卡片列数 | 导航 |
|------|----------|------|
| ≥ 1024px | 4 列 | 完整横向导航 |
| 768px–1023px | 2 列 | 横向导航（缩略，隐藏英文类别名） |
| ≤ 767px | 1 列 | 汉堡菜单 |

---

## 9. 语言切换实现

- **默认语言：** 中文（`zh`）
- **存储：** `localStorage` key = `lang`，值为 `'zh'` 或 `'en'`
- **机制：** 所有双语元素添加 `data-zh="..."` 和 `data-en="..."` 属性，`setLang()` 遍历并更新 `textContent`
- **共享：** `setLang` 定义在 `js/lang.js`，两个页面均独立引入，**`main.js` 和 `case.js` 不包含语言切换逻辑**
- **加载顺序：** `<script src="js/lang.js">` 先于 `<script src="js/main.js">` / `<script src="js/case.js">`
- **切换后：** 不刷新页面，纯 DOM 操作

---

## 10. 部署（Vercel）

- **类型：** 纯静态多页面（`index.html` + `case.html`）
- **无需 `vercel.json`：** 多页面静态网站不需要 SPA rewrite 规则，`case.html?id=xxx` 使用查询参数，Vercel 默认直接服务
- **构建命令：** 无（Output Directory 设置为 `./` 或留空）
- **部署流程：**
  1. 本地运行 `node scripts/fetch-cases.js` 生成 `data/cases.json`
  2. 提交所有文件到 Git（包括 `cases.json`）
  3. Push 到 GitHub，Vercel ��动部署

---

## 11. package.json

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

> Node 18+ 内置 `fetch`，无需额外依赖。

---

## 12. 不在范围内

- 用户注册/登录
- 评论/收藏功能
- 搜索功能
- CI 自动拉取 GitHub 更新（手动触发重建）
- 服务端渲染
