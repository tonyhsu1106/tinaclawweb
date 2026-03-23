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
  if (/social|post|twitter|instagram|reddit|youtube|digest|podcast|content|x-account|newsletter|channel/.test(f)) return 'social';
  if (/game|build|app|creative|design|overnight|mvp|idea-validator/.test(f)) return 'creative';
  if (/server|deploy|infra|devops|docker|k8s|self[-_]?heal/.test(f)) return 'devops';
  if (/meeting|crm|task|brief|morning|family|hub|inbox|habit|health|symptom|phone|event|guest|calendar|project|dashboard|multi-agent|autonomous/.test(f)) return 'productivity';
  if (/research|paper|arxiv|latex|knowledge|rag|brain|memory|semantic|learning/.test(f)) return 'research';
  if (/finance|trading|earnings|market|stock|polymarket/.test(f)) return 'finance';
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

  function stripMarkdown(text) {
    return text
      .split('\n')
      .filter(l => !/^#+\s/.test(l))           // remove heading lines
      .map(l => l.replace(/^[-*]\s+/, ''))      // remove list prefixes per line
      .join(' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove markdown links, keep text
      .replace(/[*_`]/g, '')                    // remove emphasis markers
      .replace(/\s+/g, ' ')                     // collapse whitespace
      .trim();
  }

  const rawDesc = descSection || content.substring(0, 400);
  const description = stripMarkdown(rawDesc).substring(0, 200);

  const skillsSection = getSection('required skills', 'skills', 'skills needed');
  const skills = skillsSection
    ? skillsSection.split('\n')
        .filter(l => /^[-*]\s/.test(l))
        .map(l => {
          const raw = l.replace(/^[-*]\s+/, '').trim();
          // strip markdown links and emphasis
          return raw
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[*_`]/g, '')
            .trim();
        })
        .filter(Boolean)
    : [];

  const howto = getSection('how to set it up', 'how to set up', 'setup', 'how to use', 'detailed setup guide', 'how it works', 'getting started', 'prompts');

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

  // summary: description 前 120 字
  const summary = description.substring(0, 120).trim();

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
