import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

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
const CRON_LOGS_DIR = '/Users/admin/_dev-tools/claude-code/claude-md-auto-update-logs';

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
 * Remove ANSI color/escape codes from a string
 */
function stripAnsi(str) {
  return str.replace(/\x1B\[[0-9;]*m/g, '');
}

/**
 * Generate AI insight for a cron run using Claude Haiku
 */
async function generateInsight(run) {
  // Skip failed runs or runs with no projects
  if (run.status === 'failed' || !run.projects || run.projects.length === 0) {
    return null;
  }

  try {
    const client = new Anthropic();

    const projectsSummary = run.projects.map(p =>
      `- ${p.name}: ${p.sessions} sessions, ${p.userMessages} 訊息, ${p.toolUses} 工具調用, ${p.repeatedReminders} 重複提醒, ${p.errors} 錯誤`
    ).join('\n');

    const globalSummary = run.globalStats
      ? `分析專案數：${run.globalStats.projectCount}, 總 Sessions：${run.globalStats.totalSessions}, 總工具調用：${run.globalStats.totalToolUses}`
      : '無全域統計';

    const prompt = `你是一位 DevOps 分析師。以下是一次 Claude Code 自動分析的執行結果。
請用繁體中文寫 2-3 句洞察，指出最值得注意的發現和建議。
不要重複數據本身，要給出解讀和可操作建議。

執行時間：${run.timestamp}
狀態：${run.status}

各專案統計：
${projectsSummary}

全域統計：
${globalSummary}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    return message.content[0].text;
  } catch (err) {
    console.warn(`[generateInsight] API call failed for run ${run.folderName}: ${err.message}`);
    return null;
  }
}

/**
 * Convert dir name like "20260219-030001" to ISO 8601 string with +08:00 offset
 */
function parseDateFromDirName(dirName) {
  const year = dirName.slice(0, 4);
  const month = dirName.slice(4, 6);
  const day = dirName.slice(6, 8);
  const hour = dirName.slice(9, 11);
  const minute = dirName.slice(11, 13);
  const second = dirName.slice(13, 15);
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+08:00`;
}

/**
 * Classify run type based on hour: 03 = scheduled, otherwise manual
 */
function classifyRunType(hour) {
  return hour === 3 ? 'scheduled' : 'manual';
}

/**
 * Detect run status from directory contents:
 * - summary.log exists AND contains "## 全域統計" → 'success'
 * - summary.log exists but no "## 全域統計" → 'success' (v2 partial / v1)
 * - no summary.log, main.log first line has ❌ → 'failed' with failReason
 * - no summary.log, main.log has more than 1 line → 'partial'
 */
function detectRunStatus(dirPath) {
  const summaryPath = path.join(dirPath, 'summary.log');
  const mainPath = path.join(dirPath, 'main.log');

  if (fs.existsSync(summaryPath)) {
    return { status: 'success' };
  }

  if (fs.existsSync(mainPath)) {
    try {
      const raw = fs.readFileSync(mainPath, 'utf8');
      const lines = raw.split('\n').filter(l => l.trim().length > 0);
      const firstLine = stripAnsi(lines[0] || '');

      if (lines.length <= 1 && firstLine.includes('❌')) {
        const failReason = firstLine.replace(/❌\s*/, '').trim();
        return { status: 'failed', failReason };
      }

      return { status: 'partial' };
    } catch (err) {
      console.warn(`[detectRunStatus] Cannot read main.log in ${dirPath}: ${err.message}`);
      return { status: 'partial' };
    }
  }

  return { status: 'partial' };
}

/**
 * Parse v2 format summary.log into projects array and globalStats
 */
function parseSummaryV2(content) {
  const projects = [];
  let globalStats = null;

  // Split into sections by "### " headings
  const parts = content.split(/(?=^### )/m);

  for (const block of parts) {
    const nameMatch = block.match(/^### (.+)$/m);
    if (!nameMatch) continue;

    const projectName = nameMatch[1].trim();

    // sessions and userMessages
    let sessions = 0;
    let userMessages = 0;
    const sessionsMatch = block.match(/\*\*Sessions\*\*[：:]\s*(\d+)\s+sessions[,，]\s*(\d+)\s+total user messages/);
    if (sessionsMatch) {
      sessions = parseInt(sessionsMatch[1], 10);
      userMessages = parseInt(sessionsMatch[2], 10);
    }

    // toolUses
    let toolUses = 0;
    const toolUsesMatch = block.match(/\*\*工具使用\*\*[：:]\s*(\d+)\s+total tool uses/);
    if (toolUsesMatch) {
      toolUses = parseInt(toolUsesMatch[1], 10);
    }

    // topTools — find the "Top 5 工具" section and parse lines like "- ToolName: 123"
    const topTools = [];
    const topToolsSection = block.match(/\*\*Top 5 工具\*\*[：:]?\s*\n([\s\S]*?)(?:\n\*\*|\n---|\n##|$)/);
    if (topToolsSection) {
      const toolLines = topToolsSection[1].split('\n');
      for (const line of toolLines) {
        const toolMatch = line.trim().match(/^- (.+?):\s*(\d+)$/);
        if (toolMatch) {
          topTools.push({ name: toolMatch[1].trim(), count: parseInt(toolMatch[2], 10) });
        }
      }
    }

    // repeatedReminders
    let repeatedReminders = 0;
    const remindersMatch = block.match(/\*\*重複提醒\*\*[：:]\s*發現\s*(\d+)\s*條/);
    if (remindersMatch) {
      repeatedReminders = parseInt(remindersMatch[1], 10);
    }

    // errors
    let errors = 0;
    const errorsMatch = block.match(/\*\*錯誤記錄\*\*[：:]\s*發現\s*(\d+)\s*條/);
    if (errorsMatch) {
      errors = parseInt(errorsMatch[1], 10);
    }

    projects.push({ name: projectName, sessions, userMessages, toolUses, topTools, repeatedReminders, errors });
  }

  // Parse "## 全域統計" section — this section is always last, so grab everything after it
  const globalSectionIdx = content.indexOf('## 全域統計');
  if (globalSectionIdx !== -1) {
    const globalText = content.slice(globalSectionIdx);

    const projectCountMatch = globalText.match(/分析專案數[：:]\s*(\d+)/);
    const totalSessionsMatch = globalText.match(/總\s*Sessions\s*數[：:]\s*(\d+)/);
    const totalToolUsesMatch = globalText.match(/總工具調用數[：:]\s*(\d+)/);

    if (projectCountMatch && totalSessionsMatch && totalToolUsesMatch) {
      globalStats = {
        projectCount: parseInt(projectCountMatch[1], 10),
        totalSessions: parseInt(totalSessionsMatch[1], 10),
        totalToolUses: parseInt(totalToolUsesMatch[1], 10)
      };
    }
  }

  return { projects, globalStats };
}

/**
 * Scan cron history from CRON_LOGS_DIR
 */
function scanCronHistory() {
  const runs = [];

  try {
    const entries = fs.readdirSync(CRON_LOGS_DIR);
    const dirNames = entries.filter(e => /^\d{8}-\d{6}$/.test(e));

    for (const dirName of dirNames) {
      try {
        const dirPath = path.join(CRON_LOGS_DIR, dirName);

        // Only process directories
        const stat = fs.statSync(dirPath);
        if (!stat.isDirectory()) continue;

        // Parse timestamp and runType from directory name
        const timestamp = parseDateFromDirName(dirName);
        const hour = parseInt(dirName.slice(9, 11), 10);
        const runType = classifyRunType(hour);

        // Detect status
        const { status, failReason } = detectRunStatus(dirPath);

        // Parse projects and globalStats
        let projects = [];
        let globalStats = null;

        const summaryPath = path.join(dirPath, 'summary.log');
        if (fs.existsSync(summaryPath) && status !== 'failed') {
          try {
            const content = fs.readFileSync(summaryPath, 'utf8');
            const isV2 = content.includes('## 各專案分析摘要');

            if (isV2) {
              const parsed = parseSummaryV2(content);
              projects = parsed.projects;
              globalStats = parsed.globalStats;
            }
            // v1 format: leave projects = [] and globalStats = null
          } catch (err) {
            console.warn(`[scanCronHistory] Cannot parse summary.log in ${dirPath}: ${err.message}`);
          }
        }

        const run = {
          folderName: dirName,
          timestamp,
          runType,
          status,
          projects,
          globalStats
        };

        if (failReason !== undefined) {
          run.failReason = failReason;
        }

        runs.push(run);
      } catch (err) {
        console.warn(`[scanCronHistory] Cannot process dir ${dirName}: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`[scanCronHistory] Cannot read CRON_LOGS_DIR: ${err.message}`);
  }

  // Sort newest first
  runs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return { runs, totalRuns: runs.length };
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

  const cronHistory = scanCronHistory();

  // Generate AI insights for cron runs
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  if (!hasApiKey) {
    console.warn('[insight] ANTHROPIC_API_KEY 未設定，跳過 AI insight 生成');
  }

  if (hasApiKey) {
    // Load existing insights from data.json cache
    let cachedInsights = {};
    try {
      if (fs.existsSync(OUTPUT_PATH)) {
        const existingData = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
        if (existingData.cronHistory && existingData.cronHistory.runs) {
          for (const run of existingData.cronHistory.runs) {
            if (run.insight) {
              cachedInsights[run.folderName] = run.insight;
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[insight] Cannot read cached insights: ${err.message}`);
    }

    // Generate insights for runs that don't have one yet
    for (const run of cronHistory.runs) {
      if (cachedInsights[run.folderName]) {
        run.insight = cachedInsights[run.folderName];
        continue;
      }

      const insight = await generateInsight(run);
      if (insight) {
        run.insight = insight;
        console.log(`[insight] Generated for ${run.folderName}`);
      }
    }
  }

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
    tokenBudget: existingTokenBudget || defaultTokenBudget,
    cronHistory
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
