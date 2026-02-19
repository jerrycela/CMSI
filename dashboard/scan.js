import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Scan boundary constants
const SCAN_ROOTS = ['/Users/admin'];
const MAX_DEPTH = 5;
const EXCLUDE_DIRS = ['node_modules', '.git', 'Library', '.Trash', '.cursor', '.vscode', 'extensions'];
const EXCLUDE_PATHS = [
  '/Users/admin/.claude/plugins/cache',
  '/Users/admin/.claude/plugins/marketplaces',
  '/Users/admin/.claude/cache',
  '/Users/admin/Library'
];
const SKILLS_MANUAL_DIR = '/Users/admin/.claude/skills';
const SKILLS_PLUGIN_BASE = '/Users/admin/.claude/plugins/marketplaces';
const GLOBAL_CLAUDE_MD = '/Users/admin/.claude/CLAUDE.md';
const DOCS_DIR = '/Users/admin/.claude/docs';

// Output path
const OUTPUT_PATH = path.join(__dirname, 'public', 'data.json');

/**
 * Count words in a string (split by whitespace)
 */
function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Estimate tokens from word count
 */
function estimateTokens(wordCount) {
  return Math.round(wordCount * 1.3);
}

/**
 * Extract description snippet: strip markdown marks and take first 30 words
 */
function extractDescriptionSnippet(content) {
  const cleaned = content
    .replace(/^#{1,6}\s+/gm, '')       // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')   // bold
    .replace(/\*(.+?)\*/g, '$1')       // italic
    .replace(/`([^`]+)`/g, '$1')       // inline code
    .replace(/```[\s\S]*?```/g, '')     // code blocks
    .replace(/^\s*[-*+]\s+/gm, '')     // list markers
    .replace(/^\s*\d+\.\s+/gm, '')     // numbered list markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/\n+/g, ' ')              // newlines to spaces
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.slice(0, 30).join(' ');
}

/**
 * Read file content; truncate if over 10000 bytes
 */
function processContent(filePath) {
  try {
    const raw = fs.readFileSync(filePath);
    const byteSize = raw.byteLength;
    let content;
    let isTruncated = false;

    if (byteSize > 10000) {
      content = raw.toString('utf8').slice(0, 8000);
      isTruncated = true;
    } else {
      content = raw.toString('utf8');
    }

    const totalWordCount = countWords(content);
    return { content, isTruncated, totalWordCount };
  } catch (err) {
    console.warn(`[processContent] Cannot read ${filePath}: ${err.message}`);
    return { content: null, isTruncated: false, totalWordCount: 0 };
  }
}

/**
 * Scan global CLAUDE.md and parse sections
 */
function scanGlobalConfig() {
  try {
    const stat = fs.statSync(GLOBAL_CLAUDE_MD);
    const byteSize = stat.size;
    const { content, isTruncated, totalWordCount } = processContent(GLOBAL_CLAUDE_MD);

    if (content === null) {
      return {
        claudeMdPath: GLOBAL_CLAUDE_MD,
        wordCount: 0,
        byteSize,
        estimatedTokens: 0,
        content: null,
        isTruncated: false,
        totalWordCount: 0,
        sections: []
      };
    }

    // Parse sections by ## headings
    const sectionRegex = /^## (.+)$/gm;
    const sections = [];
    let match;
    const matches = [];

    while ((match = sectionRegex.exec(content)) !== null) {
      matches.push({ heading: match[1].trim(), index: match.index });
    }

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
      const sectionText = content.slice(start, end);
      // Skip the heading line itself when counting words
      const bodyText = sectionText.replace(/^## .+$/m, '').trim();
      const wordCount = countWords(bodyText);
      sections.push({ heading: matches[i].heading, wordCount });
    }

    const wordCount = countWords(content);

    return {
      claudeMdPath: GLOBAL_CLAUDE_MD,
      wordCount,
      byteSize,
      estimatedTokens: estimateTokens(wordCount),
      content,
      isTruncated,
      totalWordCount,
      sections
    };
  } catch (err) {
    console.warn(`[scanGlobalConfig] Error: ${err.message}`);
    return {
      claudeMdPath: GLOBAL_CLAUDE_MD,
      wordCount: 0,
      byteSize: 0,
      estimatedTokens: 0,
      content: null,
      isTruncated: false,
      totalWordCount: 0,
      sections: []
    };
  }
}

/**
 * Scan docs directory
 */
function scanDocs() {
  const files = [];
  let totalWordCount = 0;

  try {
    const entries = fs.readdirSync(DOCS_DIR);
    for (const entry of entries) {
      if (!entry.endsWith('.md')) continue;
      const filePath = path.join(DOCS_DIR, entry);
      try {
        const stat = fs.statSync(filePath);
        const byteSize = stat.size;
        const { content, totalWordCount: wc } = processContent(filePath);
        const wordCount = wc;
        const descriptionSnippet = content ? extractDescriptionSnippet(content) : '';

        totalWordCount += wordCount;

        files.push({
          path: filePath,
          name: entry,
          wordCount,
          byteSize,
          estimatedTokens: estimateTokens(wordCount),
          descriptionSnippet
        });
      } catch (err) {
        console.warn(`[scanDocs] Cannot process ${filePath}: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`[scanDocs] Cannot read docs dir: ${err.message}`);
  }

  // Sort alphabetically by name
  files.sort((a, b) => a.name.localeCompare(b.name));

  return {
    totalWordCount,
    totalEstimatedTokens: estimateTokens(totalWordCount),
    files
  };
}

/**
 * Scan manual skills from SKILLS_MANUAL_DIR
 * Three types: symlink / directory / file
 */
function scanManualSkills() {
  const skills = [];

  try {
    const entries = fs.readdirSync(SKILLS_MANUAL_DIR);

    for (const entry of entries) {
      const entryPath = path.join(SKILLS_MANUAL_DIR, entry);

      try {
        const lstat = fs.lstatSync(entryPath);

        if (lstat.isSymbolicLink()) {
          // Symlink type
          let realPath = entryPath;
          try {
            realPath = fs.realpathSync(entryPath);
          } catch {
            // symlink target may not exist, use as-is
          }

          const name = entry;
          skills.push({
            name,
            path: entryPath,
            source: 'manual',
            type: 'symlink',
            wordCount: null,
            byteSize: null,
            descriptionSnippet: ''
          });
        } else if (lstat.isDirectory()) {
          // Directory type — look for SKILL.md inside
          const skillMdPath = path.join(entryPath, 'SKILL.md');
          const name = entry;

          try {
            const stat = fs.statSync(skillMdPath);
            const byteSize = stat.size;
            const { content, totalWordCount: wc } = processContent(skillMdPath);
            const wordCount = wc;
            const descriptionSnippet = content ? extractDescriptionSnippet(content) : '';

            skills.push({
              name,
              path: skillMdPath,
              source: 'manual',
              type: 'directory',
              wordCount,
              byteSize,
              descriptionSnippet
            });
          } catch {
            skills.push({
              name,
              path: entryPath,
              source: 'manual',
              type: 'directory',
              wordCount: null,
              byteSize: null,
              descriptionSnippet: ''
            });
          }
        } else if (lstat.isFile() && entry.endsWith('.md')) {
          // File type
          const name = path.basename(entry, '.md');
          const byteSize = lstat.size;
          const { content, totalWordCount: wc } = processContent(entryPath);
          const wordCount = wc;
          const descriptionSnippet = content ? extractDescriptionSnippet(content) : '';

          skills.push({
            name,
            path: entryPath,
            source: 'manual',
            type: 'file',
            wordCount,
            byteSize,
            descriptionSnippet
          });
        }
      } catch (err) {
        console.warn(`[scanManualSkills] Cannot process ${entryPath}: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`[scanManualSkills] Cannot read skills dir: ${err.message}`);
  }

  return skills;
}

/**
 * Scan plugin skills from SKILLS_PLUGIN_BASE
 */
function scanPluginSkills() {
  const skills = [];

  try {
    const pluginDirs = fs.readdirSync(SKILLS_PLUGIN_BASE);

    for (const pluginName of pluginDirs) {
      const pluginPath = path.join(SKILLS_PLUGIN_BASE, pluginName);
      try {
        const pluginStat = fs.lstatSync(pluginPath);
        if (!pluginStat.isDirectory()) continue;

        const skillsDir = path.join(pluginPath, 'skills');
        if (!fs.existsSync(skillsDir)) continue;

        const skillEntries = fs.readdirSync(skillsDir);
        for (const skillEntry of skillEntries) {
          const skillPath = path.join(skillsDir, skillEntry);
          try {
            const skillStat = fs.lstatSync(skillPath);
            if (!skillStat.isDirectory()) continue;

            const skillMdPath = path.join(skillPath, 'SKILL.md');
            const name = skillEntry;

            try {
              const stat = fs.statSync(skillMdPath);
              const byteSize = stat.size;
              const { content, totalWordCount: wc } = processContent(skillMdPath);
              const wordCount = wc;
              const descriptionSnippet = content ? extractDescriptionSnippet(content) : '';

              skills.push({
                name,
                path: skillMdPath,
                source: `plugin:${pluginName}`,
                type: 'file',
                wordCount,
                byteSize,
                descriptionSnippet
              });
            } catch {
              skills.push({
                name,
                path: skillPath,
                source: `plugin:${pluginName}`,
                type: 'file',
                wordCount: null,
                byteSize: null,
                descriptionSnippet: ''
              });
            }
          } catch (err) {
            console.warn(`[scanPluginSkills] Cannot process ${skillPath}: ${err.message}`);
          }
        }
      } catch (err) {
        console.warn(`[scanPluginSkills] Cannot process plugin ${pluginName}: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`[scanPluginSkills] Cannot read plugin base: ${err.message}`);
  }

  return skills;
}

/**
 * Combine manual + plugin skills
 */
function scanAllSkills() {
  const manualSkills = scanManualSkills();
  const pluginSkills = scanPluginSkills();
  const allFiles = [...manualSkills, ...pluginSkills];

  return {
    totalCount: allFiles.length,
    manualCount: manualSkills.length,
    pluginCount: pluginSkills.length,
    files: allFiles
  };
}

/**
 * Recursively find CLAUDE.md files, respecting exclusions
 */
function scanForClaudeMd(rootDir, depth) {
  const results = [];

  if (depth > MAX_DEPTH) return results;

  let entries;
  try {
    entries = fs.readdirSync(rootDir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    // Skip excluded directories
    if (EXCLUDE_DIRS.includes(entry)) continue;

    const fullPath = path.join(rootDir, entry);

    // Skip excluded paths
    if (EXCLUDE_PATHS.some(ep => fullPath.startsWith(ep))) continue;

    try {
      const stat = fs.lstatSync(fullPath);

      if (stat.isSymbolicLink()) continue; // skip symlinks to avoid loops

      if (stat.isDirectory()) {
        const subResults = scanForClaudeMd(fullPath, depth + 1);
        results.push(...subResults);
      } else if (stat.isFile() && entry === 'CLAUDE.md') {
        results.push(fullPath);
      }
    } catch {
      // ignore permission errors etc.
    }
  }

  return results;
}

/**
 * Return fixed health thresholds
 */
function getHealthThresholds() {
  return {
    _note: '健康狀態判定閾值',
    globalWordCountWarning: 6000,
    globalWordCountAlert: 8000,
    totalWordCountWarning: 32000,
    totalWordCountAlert: 40000,
    dataStaleHoursWarning: 24,
    dataStaleHoursAlert: 72
  };
}

/**
 * Preserve tokenBudget from existing data.json if autoLoadedTotal is non-null
 */
function preserveTokenBudget(outputPath) {
  try {
    if (!fs.existsSync(outputPath)) return null;
    const raw = fs.readFileSync(outputPath, 'utf8');
    const existing = JSON.parse(raw);
    if (existing.tokenBudget && existing.tokenBudget.autoLoadedTotal !== null) {
      return existing.tokenBudget;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Print a 5-8 line summary to terminal
 */
function printSummary(data) {
  const thresholds = data.healthThresholds;
  const globalWC = data.globalConfig.wordCount;
  const totalWC = data.globalConfig.wordCount + data.docs.totalWordCount;

  // Health status determination
  let status = '正常';
  const reasons = [];

  if (globalWC >= thresholds.globalWordCountAlert) {
    status = '警告';
    reasons.push(`全域 CLAUDE.md 字數 ${globalWC} 已超過警告閾值 ${thresholds.globalWordCountAlert}`);
  } else if (globalWC >= thresholds.globalWordCountWarning) {
    status = '注意';
    reasons.push(`全域 CLAUDE.md 字數 ${globalWC} 接近上限 ${thresholds.globalWordCountWarning}`);
  }

  if (totalWC >= thresholds.totalWordCountAlert) {
    status = '警告';
    reasons.push(`總字數 ${totalWC} 已超過警告閾值 ${thresholds.totalWordCountAlert}`);
  } else if (totalWC >= thresholds.totalWordCountWarning) {
    if (status !== '警告') status = '注意';
    reasons.push(`總字數 ${totalWC} 接近上限 ${thresholds.totalWordCountWarning}`);
  }

  // Check if any project CLAUDE.md is larger than global
  const largerProjects = data.allProjects.filter(p =>
    p.path !== GLOBAL_CLAUDE_MD &&
    p.wordCount !== null &&
    p.wordCount > globalWC
  );
  if (largerProjects.length > 0) {
    status = '警告';
    const biggest = largerProjects.sort((a, b) => b.wordCount - a.wordCount)[0];
    const ratio = (biggest.wordCount / globalWC).toFixed(1);
    reasons.push(`${biggest.projectName} 設定（${biggest.wordCount} 字）比全域（${globalWC} 字）大 ${ratio} 倍`);
  }

  const reasonStr = reasons.length > 0 ? `原因：${reasons.join('；')}` : '';

  console.log('');
  console.log('====== CMSI 掃描完成 ======');
  console.log(`掃描時間：${new Date(data.meta.generatedAt).toLocaleString('zh-TW')}`);
  console.log(`全域 CLAUDE.md：${globalWC} 字 / ${data.globalConfig.estimatedTokens} tokens`);
  console.log(`Docs：${data.docs.files.length} 個檔案，${data.docs.totalWordCount} 字`);
  console.log(`Skills：${data.skills.totalCount} 個（手動 ${data.skills.manualCount} + Plugin ${data.skills.pluginCount}）`);
  console.log(`專案 CLAUDE.md：${data.allProjects.length} 個`);
  console.log(`健康狀態：${status}${reasonStr ? '　' + reasonStr : ''}`);
  console.log('===========================');
  console.log('');
}

/**
 * Main function
 */
async function main() {
  console.log('CMSI 掃描開始...');

  // 1. Preserve existing tokenBudget
  const existingTokenBudget = preserveTokenBudget(OUTPUT_PATH);

  // 2. Scan all components
  const globalConfig = scanGlobalConfig();
  const docs = scanDocs();
  const skills = scanAllSkills();

  // 3. Scan all CLAUDE.md files
  const allClaudeMdPaths = [];
  for (const root of SCAN_ROOTS) {
    const found = scanForClaudeMd(root, 0);
    allClaudeMdPaths.push(...found);
  }

  // Remove global CLAUDE.md from project list, deduplicate
  const projectPaths = [...new Set(allClaudeMdPaths)].filter(p => p !== GLOBAL_CLAUDE_MD);

  // Process each project CLAUDE.md
  const allProjects = projectPaths.map(claudeMdPath => {
    const projectDir = path.dirname(claudeMdPath);
    const projectName = path.basename(projectDir);

    try {
      const stat = fs.statSync(claudeMdPath);
      const byteSize = stat.size;
      const { totalWordCount: wordCount } = processContent(claudeMdPath);

      return {
        path: claudeMdPath,
        projectDir,
        projectName,
        wordCount,
        byteSize
      };
    } catch {
      return {
        path: claudeMdPath,
        projectDir,
        projectName,
        wordCount: null,
        byteSize: null
      };
    }
  });

  // 4. Assemble output
  const defaultTokenBudget = {
    _note: '此區塊由使用者手動填寫',
    autoLoadedTotal: null,
    breakdown: {
      globalConfig: null,
      docs: null,
      skills: null,
      projectClaude: null,
      conversationHistory: null
    },
    warningThreshold: 40000,
    lastManualUpdate: null
  };

  const data = {
    meta: {
      generatedAt: new Date().toISOString(),
      scanVersion: '1.0.0'
    },
    healthThresholds: getHealthThresholds(),
    globalConfig,
    docs,
    skills,
    allProjects,
    tokenBudget: existingTokenBudget || defaultTokenBudget
  };

  // 5. Write output
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`已寫入：${OUTPUT_PATH}`);

  // 6. Print summary
  printSummary(data);
}

main().catch(err => {
  console.error('掃描失敗：', err);
  process.exit(1);
});
