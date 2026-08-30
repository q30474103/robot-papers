import { copyFile, cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const paperRoot = path.resolve(process.env.ROBOT_PAPERS_ROOT || 'D:\\paper');
const notesRoot = path.join(paperRoot, 'obsidian');
const pdfRoot = path.join(paperRoot, '原文');
const weeklyRoot = path.join(notesRoot, '研读周报');
const dailyRoot = path.join(notesRoot, '日报');
const publicRoot = path.resolve(process.env.ROBOT_PAPERS_PUBLIC_ROOT || path.join(projectRoot, 'public'));
const copyLibraryFiles = process.env.ROBOT_PAPERS_COPY_LIBRARY !== 'false';
const libraryRoot = path.join(publicRoot, 'library');
const weeklyPublic = path.join(libraryRoot, 'weekly');
const dailyPublic = path.join(libraryRoot, 'daily');
const dataRoot = path.join(publicRoot, 'data');

const DATE_FOLDER = /^\d{4}-\d{2}-\d{2}$/;
const clean = (value = '') => value.trim().replace(/^['"]|['"]$/g, '');

function yamlScalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return match ? clean(match[1]) : '';
}

function yamlList(frontmatter, key) {
  const inline = yamlScalar(frontmatter, key);
  if (inline.startsWith('[') && inline.endsWith(']')) {
    return inline
      .slice(1, -1)
      .split(',')
      .map(clean)
      .filter(Boolean);
  }

  const block = frontmatter.match(new RegExp(`^${key}:\\s*\\n((?:\\s+- .+(?:\\n|$))*)`, 'm'));
  return block
    ? block[1]
        .split(/\r?\n/)
        .map((line) => clean(line.replace(/^\s+-\s*/, '')))
        .filter(Boolean)
    : [];
}

function extractSection(markdown, acceptedNames) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => {
    if (!line.startsWith('## ')) return false;
    const heading = line.slice(3).trim();
    return acceptedNames.some((name) => heading.includes(name));
  });

  if (start === -1) return '';
  const result = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith('## ')) break;
    result.push(lines[index]);
  }
  return result.join('\n').trim();
}

function plainText(value = '') {
  return value
    .replace(/!\[\[[^\]]+\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^\)]+\)/g, '')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target)
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/[*_`>#]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function excerpt(value, length = 210) {
  const normalized = plainText(value).replace(/\s+/g, ' ');
  return normalized.length > length ? `${normalized.slice(0, length).trim()}…` : normalized;
}

const taxonomy = [
  ['VLA + RL', /reinforcement|强化学习|\bRL\b|RECAP|reward/i],
  ['WAM', /world.action|世界.动作|\bWAM\b|action.conditioned world/i],
  ['世界模型', /world model|世界模型|visual forecast|future frame|video prediction/i],
  ['模仿学习', /imitation|模仿学习|demonstration|示范|co-training/i],
  ['行为克隆', /behavior cloning|行为克隆|\bBC\b/i],
  ['Diffusion Policy', /diffusion policy|扩散策略|flow matching|flow policy/i],
  ['微调 / 适配', /fine.?tun|微调|adaptation|LoRA|OFT|adapter/i],
  ['持续学习', /continual|持续学习|long-lived/i],
  ['跨具身迁移', /cross.embodiment|跨具身|human.to.robot|retarget/i],
  ['长时程规划', /long.horizon|长时程|planning|reasoning|CoT|subtask/i],
  ['数据与预训练', /pretrain|预训练|dataset|data engine|数据/i],
  ['操作', /manipulation|操作|grasp|双臂|bimanual/i],
  ['导航', /navigation|导航|locomotion/i],
  ['部署与加速', /inference|throughput|latency|部署|加速|实时|streaming/i],
  ['评测与基准', /benchmark|评测|evaluation|LIBERO|CALVIN|SimplerEnv/i],
  ['安全与鲁棒性', /safety|robust|uncertainty|安全|鲁棒/i],
  ['纯 VLA', /vision.language.action|\bVLA\b/i],
];

function classify(frontmatter, markdown) {
  const declared = [...yamlList(frontmatter, 'directions'), ...yamlList(frontmatter, 'methods')];
  const haystack = `${frontmatter}\n${markdown}`;
  const inferred = taxonomy.filter(([, pattern]) => pattern.test(haystack)).map(([label]) => label);
  const result = [...new Set([...declared, ...inferred])];
  return result.length ? result : ['具身智能'];
}

function parseFigures(markdown, date) {
  const lines = markdown.split(/\r?\n/);
  const figures = [];
  let currentTitle = '';

  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+(.+)$/);
    if (heading) {
      currentTitle = heading[1].trim();
      continue;
    }

    const wikiImage = lines[index].match(/!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
    const markdownImage = lines[index].match(/!\[[^\]]*\]\(([^\)]+)\)/);
    const imagePath = wikiImage?.[1] || markdownImage?.[1];
    if (!imagePath || /^https?:/i.test(imagePath)) continue;

    const explanationLines = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (/^#{2,3}\s+/.test(lines[cursor]) || /!\[\[|!\[[^\]]*\]\(/.test(lines[cursor])) break;
      explanationLines.push(lines[cursor]);
    }

    const normalizedPath = imagePath.replace(/\\/g, '/').replace(/^\.\//, '');
    const title = currentTitle || `图 ${figures.length + 1}`;
    const resultSignal = `${title} ${normalizedPath}`;
    figures.push({
      url: `/library/${date}/${normalizedPath}`,
      title,
      explanation: plainText(explanationLines.join('\n')),
      kind: /结果|性能|对比|曲线|消融|评测|成功率|results?|benchmark|ablation/i.test(resultSignal)
        ? 'results'
        : 'method',
      order: figures.length + 1,
    });
  }

  return figures.filter((figure, index) => figures.findIndex((candidate) => candidate.url === figure.url) === index);
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadPaper(date, fileName) {
  const notePath = path.join(notesRoot, date, fileName);
  const markdown = await readFile(notePath, 'utf8');
  const frontmatterMatch = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  const frontmatter = frontmatterMatch?.[1] || '';
  const shortName = yamlScalar(frontmatter, 'short_name') || path.basename(fileName, '.md');
  const pdfPath = path.join(pdfRoot, date, `${shortName}.pdf`);
  const hasPdf = await exists(pdfPath);
  const title = yamlScalar(frontmatter, 'title') || markdown.match(/^#\s+(.+)$/m)?.[1] || shortName;
  const strengths = extractSection(markdown, ['优点', '优势', '为什么值得']);
  const limitations = extractSection(markdown, ['局限性', '局限']);
  const improvements = extractSection(markdown, ['可改进', '研究机会', '后续研究', '改进方向']);
  const figureDetails = parseFigures(markdown, date);

  return {
    id: `${date}/${shortName}`,
    shortName,
    title,
    authors: yamlList(frontmatter, 'authors'),
    paperDate: yamlScalar(frontmatter, 'date'),
    collectedDate: yamlScalar(frontmatter, 'collected_date') || date,
    venue: yamlScalar(frontmatter, 'venue') || '待核验',
    venueTier: yamlScalar(frontmatter, 'venue_tier'),
    status: yamlScalar(frontmatter, 'status'),
    source: yamlScalar(frontmatter, 'source'),
    url: yamlScalar(frontmatter, 'url'),
    arxivId: yamlScalar(frontmatter, 'arxiv_id'),
    tags: yamlList(frontmatter, 'tags'),
    directions: classify(frontmatter, markdown),
    summary: excerpt(extractSection(markdown, ['一句话结论', '核心结论']), 260),
    problem: plainText(extractSection(markdown, ['研究问题'])),
    method: plainText(extractSection(markdown, ['核心方法'])),
    results: plainText(extractSection(markdown, ['实验与主要结果', '关键结果'])),
    strengths: plainText(strengths),
    limitations: plainText(limitations),
    improvements: plainText(improvements),
    readingAdvice: plainText(extractSection(markdown, ['我的阅读建议', '阅读建议'])),
    figures: figureDetails.map((figure) => figure.url),
    figureDetails,
    markdownUrl: `/library/${date}/${fileName}`,
    pdfUrl: hasPdf ? `/library/${date}/${shortName}.pdf` : '',
  };
}

async function loadWeeklySummary(fileName) {
  const reportPath = path.join(weeklyRoot, fileName);
  const markdown = await readFile(reportPath, 'utf8');
  const frontmatterMatch = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  const frontmatter = frontmatterMatch?.[1] || '';
  const weekStart = yamlScalar(frontmatter, 'week_start');
  const weekEnd = yamlScalar(frontmatter, 'week_end');
  const shortNames = yamlList(frontmatter, 'paper_short_names');

  return {
    id: path.basename(fileName, '.md'),
    title: yamlScalar(frontmatter, 'title') || `研读周报｜${weekStart} — ${weekEnd}`,
    weekStart,
    weekEnd,
    generatedDate: yamlScalar(frontmatter, 'generated_date'),
    paperCount: Number(yamlScalar(frontmatter, 'paper_count')) || shortNames.length,
    paperShortNames: shortNames,
    directions: yamlList(frontmatter, 'directions'),
    summaryParagraph: plainText(extractSection(markdown, ['一段话总结'])) || excerpt(extractSection(markdown, ['本周阅读']), 620),
    overview: plainText(extractSection(markdown, ['本周阅读'])),
    learned: plainText(extractSection(markdown, ['我学到了什么'])),
    methodMap: plainText(extractSection(markdown, ['方法脉络'])),
    reflections: plainText(extractSection(markdown, ['我的思考'])),
    questions: plainText(extractSection(markdown, ['可延伸的研究问题'])),
    nextWeek: plainText(extractSection(markdown, ['下周建议'])),
    markdownUrl: `/library/weekly/${fileName}`,
  };
}

async function loadDailyReport(fileName) {
  const reportPath = path.join(dailyRoot, fileName);
  const markdown = await readFile(reportPath, 'utf8');
  const frontmatterMatch = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  const frontmatter = frontmatterMatch?.[1] || '';
  return {
    id: path.basename(fileName, '.md'),
    title: yamlScalar(frontmatter, 'title') || `晨间简报｜${path.basename(fileName, '.md')}`,
    generatedDate: yamlScalar(frontmatter, 'generated_date') || path.basename(fileName, '.md'),
    overview: plainText(extractSection(markdown, ['重点事项', '重点论文', '晨间简报'])) || excerpt(plainText(markdown.replace(/^---[\s\S]*?---/, '')), 620),
    markdownUrl: `/library/daily/${fileName}`,
  };
}

await mkdir(dataRoot, { recursive: true });
await mkdir(libraryRoot, { recursive: true });
await mkdir(weeklyRoot, { recursive: true });
await mkdir(dailyRoot, { recursive: true });
await mkdir(weeklyPublic, { recursive: true });
await mkdir(dailyPublic, { recursive: true });
await mkdir(notesRoot, { recursive: true });
await mkdir(pdfRoot, { recursive: true });

const dateEntries = (await readdir(notesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && DATE_FOLDER.test(entry.name))
  .map((entry) => entry.name)
  .sort();

const papers = [];
for (const date of dateEntries) {
  const dateNotes = path.join(notesRoot, date);
  const datePublic = path.join(libraryRoot, date);
  if (copyLibraryFiles) {
    await mkdir(datePublic, { recursive: true });
    await cp(dateNotes, datePublic, { recursive: true, force: true });
  }
  const noteFiles = (await readdir(dateNotes)).filter((file) => file.endsWith('.md')).sort();
  for (const file of noteFiles) {
    const paper = await loadPaper(date, file);
    const pdfSource = path.join(pdfRoot, date, `${paper.shortName}.pdf`);
    if (copyLibraryFiles && await exists(pdfSource)) {
      await copyFile(pdfSource, path.join(datePublic, `${paper.shortName}.pdf`));
    }
    papers.push(paper);
  }
}

papers.sort((a, b) => b.collectedDate.localeCompare(a.collectedDate) || a.shortName.localeCompare(b.shortName));

const weeklySummaries = [];
const weeklyFiles = (await readdir(weeklyRoot)).filter((file) => file.endsWith('.md')).sort();
for (const file of weeklyFiles) weeklySummaries.push(await loadWeeklySummary(file));
if (copyLibraryFiles && weeklyFiles.length) {
  await cp(weeklyRoot, weeklyPublic, { recursive: true, force: true });
}
weeklySummaries.sort(
  (a, b) => b.weekEnd.localeCompare(a.weekEnd) || b.generatedDate.localeCompare(a.generatedDate),
);

const dailyReports = [];
const dailyFiles = (await readdir(dailyRoot)).filter((file) => file.endsWith('.md')).sort();
for (const file of dailyFiles) dailyReports.push(await loadDailyReport(file));
if (copyLibraryFiles && dailyFiles.length) {
  await cp(dailyRoot, dailyPublic, { recursive: true, force: true });
}
dailyReports.sort((a, b) => b.generatedDate.localeCompare(a.generatedDate));

const categoryCounts = Object.entries(
  papers.flatMap((paper) => paper.directions).reduce((counts, category) => {
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {}),
)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
  .map(([name, count]) => ({ name, count }));

await writeFile(
  path.join(dataRoot, 'papers.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sourceRoot: paperRoot,
      papers,
      categories: categoryCounts,
      weeklySummaries,
      dailyReports,
    },
    null,
    2,
  ),
  'utf8',
);

console.log(
  `Robot Papers：已同步 ${papers.length} 篇论文、${weeklySummaries.length} 份研读周报，来自 ${dateEntries.length} 个日期目录。`,
);
