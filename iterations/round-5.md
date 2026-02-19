# Round 5 — 修正版完整計畫（整合壓力測試結果）

文件日期：2026-02-19
文件角色：計畫整合員（Sonnet 4.6）
文件性質：**獨立完整計畫文件，整合 Round 2-4 的所有修正**

> 本文件是唯一有效的當前計畫。前四輪的報告（round-2.md、round-3.md、round-4.md）均已歸檔為歷史紀錄，閱讀本文件不需要參照任何其他文件。

---

## 1. 專案目標（一句話）

**讓我在 30 秒內看到自己電腦上所有 CLAUDE.md 的狀況、知道 68 個 Skills 各自是什麼，以及設定有多重，然後知道下一步該做什麼。**

---

## 2. 使用者故事 + 行動指引

這個 Dashboard 的使用者只有一個人，以第一人稱描述：

### 故事 1：我想知道我的設定有多重

「當我打開 Dashboard，我能立刻看到全域 CLAUDE.md 有多少 token、docs/ 裡每個檔案各佔多少、整個設定包在每次對話開始時消耗多少預算。」

| 看到什麼 | 做什麼 |
|---------|--------|
| CLAUDE.md 超過 8,000 tokens | 查看 sections 排行前 3，找最大區塊移到 docs/ 變成按需載入 |
| docs/ 裡某個檔案超過 3,000 tokens | 考慮拆成更小的子文件，或刪除沒在用的部分 |
| 整體自動載入超過 40,000 tokens | 警戒，對話上下文快到 autocompact buffer |
| Token 預算顯示 null | 執行 `/context` 指令後手動填入 tokenBudget 區塊 |

---

### 故事 2：我想看所有專案的設定長什麼樣

「當我打開 Dashboard，我能看到電腦上所有找到的 CLAUDE.md 在哪裡、它的內容是什麼、有多大。」

| 看到什麼 | 做什麼 |
|---------|--------|
| 某個專案的 CLAUDE.md 很久沒更新 | 點開看內容，判斷是否仍然相關 |
| 某個專案的 CLAUDE.md 比全域還大 | 考慮是否有多餘的重複內容可以刪 |
| 某個路徑的 CLAUDE.md 自己忘了它存在 | 複查確認內容、決定是否保留 |
| 看到路徑，想找到這個資料夾 | 點「複製路徑」按鈕，在 Finder 按 Cmd+Shift+G 貼上路徑即可前往 |

---

### 故事 3：我想知道裝了哪些 Skills

「當我打開 Dashboard，我能看到所有 68 個已安裝的 Skills（包含手動安裝的 25 個和透過 plugin 安裝的 43 個）、每個 Skill 有多大、以及它的用途摘要。」

| 看到什麼 | 做什麼 |
|---------|--------|
| 某個 Skill 的 token 比預期大很多 | 評估這個 Skill 是否值得保留，或能否精簡 |
| 發現安裝了一個完全忘記的 Skill | 讀摘要確認用途，決定是否保留 |
| 某個 plugin Skill 出現在清單裡 | 知道這個是透過哪個 plugin 安裝的 |

---

### 故事 4：我想知道這份資料有多舊

「當我打開 Dashboard，我能看到這份資料是什麼時候掃描的，以及如何更新它。」

| 看到什麼 | 做什麼 |
|---------|--------|
| 資料已是三天前的 | 在 dashboard/ 目錄下跑 `npm run scan` 更新，再重整頁面 |
| 資料是剛才更新的 | 直接信任數字，開始看內容 |

---

## 3. 修正後的 data.json 結構

> 整合 Round 4 壓力測試的所有修正（isTruncated 欄位、skills 三種型態、path vs symlinkTarget 修正、plugin skills 來源區分、tokenBudget 保留邏輯）

```json
{
  "meta": {
    "generatedAt": "2026-02-19T14:30:00+08:00",
    "scanVersion": "1.0.0"
  },

  "globalConfig": {
    "claudeMdPath": "/Users/admin/.claude/CLAUDE.md",
    "wordCount": 597,
    "byteSize": 6304,
    "estimatedTokens": 5600,
    "content": "...（完整原始內容）...",
    "isTruncated": false,
    "totalWordCount": 597,
    "sections": [
      {
        "heading": "語言與報告",
        "wordCount": 45,
        "estimatedTokens": 59
      },
      {
        "heading": "開發哲學",
        "wordCount": 89,
        "estimatedTokens": 116
      }
    ]
  },

  "docs": {
    "totalEstimatedTokens": 1830,
    "files": [
      {
        "name": "agents.md",
        "path": "/Users/admin/.claude/docs/agents.md",
        "wordCount": 229,
        "byteSize": 2233,
        "estimatedTokens": 298
      }
    ]
  },

  "skills": {
    "totalCount": 68,
    "manualCount": 25,
    "pluginCount": 43,
    "files": [
      {
        "name": "vueuse-functions",
        "path": "/Users/admin/.claude/skills/vueuse-functions",
        "type": "symlink",
        "symlinkTarget": "/Users/admin/.agents/skills/vueuse-functions",
        "source": "manual",
        "pluginName": null,
        "wordCount": 3659,
        "estimatedTokens": 4757,
        "descriptionSnippet": "Apply VueUse composables where appropriate...",
        "attachments": []
      },
      {
        "name": "fetch-slack-messages",
        "path": "/Users/admin/.claude/skills/fetch-slack-messages.md",
        "type": "file",
        "symlinkTarget": null,
        "source": "manual",
        "pluginName": null,
        "wordCount": 312,
        "estimatedTokens": 406,
        "descriptionSnippet": "...",
        "attachments": []
      },
      {
        "name": "excalidraw-mcp",
        "path": "/Users/admin/.claude/skills/excalidraw-mcp",
        "type": "directory",
        "symlinkTarget": null,
        "source": "manual",
        "pluginName": null,
        "wordCount": 445,
        "estimatedTokens": 579,
        "descriptionSnippet": "...",
        "attachments": []
      },
      {
        "name": "brainstorming",
        "path": "/Users/admin/.claude/plugins/marketplaces/superpowers-dev/skills/brainstorming",
        "type": "directory",
        "symlinkTarget": null,
        "source": "plugin",
        "pluginName": "superpowers",
        "wordCount": 892,
        "estimatedTokens": 1160,
        "descriptionSnippet": "...",
        "attachments": []
      }
    ]
  },

  "allProjects": [
    {
      "path": "/Users/admin/openclaw/CLAUDE.md",
      "projectName": "openclaw",
      "wordCount": 2441,
      "byteSize": 17762,
      "estimatedTokens": 3173,
      "lastModified": "2026-01-15T10:00:00+08:00",
      "content": "...（完整或截斷後的內容）...",
      "isTruncated": false,
      "totalWordCount": 2441
    }
  ],

  "tokenBudget": {
    "_note": "此區塊由使用者手動填寫，scan.js 不會覆寫已存在的值。初次掃描時所有值為 null，請執行 /context 後手動更新。",
    "autoLoadedTotal": null,
    "breakdown": {
      "memoryFiles": null,
      "skillsFrontmatter": null,
      "systemPrompt": null,
      "systemTools": null,
      "mcpTools": null,
      "customAgents": null
    },
    "warningThreshold": 40000,
    "lastManualUpdate": null
  }
}
```

### 設計說明

| 欄位 | 設計意圖 |
|------|---------|
| `content` | 存完整原始文字，前端用等寬字體呈現，不需要後端 API |
| `isTruncated` | 布林值，前端用來判斷是否顯示「內容已截斷」提示 |
| `totalWordCount` | 截斷後 content 不能反映真實字數，需獨立欄位記錄 |
| `estimatedTokens` | 統一用 `wordCount × 1.3` 計算，腳本端計算，前端直接讀取 |
| `skills[].type` | `"symlink"` / `"directory"` / `"file"`，對應三種實際存在的型態 |
| `skills[].path` | 永遠是 Claude Code 讀到的路徑（symlink 本身），非 target |
| `skills[].symlinkTarget` | 只有 type 為 symlink 時才有值，其他為 null |
| `skills[].source` | `"manual"` 或 `"plugin"`，區分安裝來源 |
| `skills[].pluginName` | source 為 plugin 時填入，方便���端分組顯示 |
| `tokenBudget` | scan.js 初次掃描填 null；如果已有值，保留不覆寫 |
| 所有 `path` | 全部用絕對路徑，避免相對路徑在不同啟動方式下出錯 |

---

## 4. 修正後的架構圖

### 目錄結構

```
/Users/admin/Documents/Claude md 自我迭代專案/
├── dashboard/                   ← Vue 專案根目錄（npm run 都在這執行）
│   ├── src/
│   │   ├── App.vue
│   │   ├── main.ts
│   │   ├── components/
│   │   │   ├── OverviewTab.vue
│   │   │   ├── ProjectsTab.vue
│   │   │   ├── SkillsTab.vue
│   │   │   └── DocsTab.vue
│   │   └── types/
│   │       └── data.ts          ← data.json 的 TypeScript 型別定義
│   ├── public/
│   │   ├── data.json            ← scan.js 的輸出（不進版控）
│   │   └── data.sample.json    ← 手工範例（進版控，作為格式參考）
│   ├── scan.js                  ← 掃描腳本
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .gitignore               ← 排除 node_modules/ 和 public/data.json
├── findings.md                  ← Phase 1 Discovery 紀錄（已完成）
├── iterations/
│   ├── round-2.md              ← 歷史報告
│   ├── round-3.md              ← 歷史報告
│   ├── round-4.md              ← 歷史報告
│   └── round-5.md              ← 本文件（當前有效計畫）
└── task_plan.md                 ← 已過時，保留作歷史參考
```

### 資料流圖

```
本地檔案系統
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [cd dashboard && npm run dashboard]                            │
│       │                                                         │
│       ├─→ [Node.js 掃描腳本 scan.js]                            │
│       │        │                                                │
│       │        ├─ 讀取 ~/.claude/CLAUDE.md                     │
│       │        ├─ 讀取 ~/.claude/docs/*.md                     │
│       │        ├─ 掃描 ~/.claude/skills/（三種型態）             │
│       │        ├─ 掃描 ~/.claude/plugins/marketplaces/*/skills/ │
│       │        ├─ 遍歷 /Users/admin（排除雜訊）找 CLAUDE.md      │
│       │        ├─ 保留現有 tokenBudget（如已填寫）               │
│       │        └─ 輸出 → public/data.json                      │
│       │                                                         │
│       └─→ [Vite Dev Server --open]                              │
│                │                                                │
│                └─→ 讀取 public/data.json（靜態資源）             │
│                         │                                       │
│                    [Vue 3 SPA]                                  │
│                         │                                       │
│                    瀏覽器自動開啟                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

資料流：本地檔案系統 → scan.js → data.json → Vue 3 → 瀏覽器
更新方式：手動跑 npm run scan，或重新跑 npm run dashboard
```

**沒有：**
- 後端伺服器（scan.js 只在掃描時執行，不常駐）
- 資料庫
- WebSocket
- Express
- API 端點
- 任何需要「保持運行」的程序

---

## 5. 修正後的 scan.js 設計

### 5-1. 掃描策略

**整體原則：** 從 `/Users/admin` 開始掃，靠精確的排除清單過濾雜訊，不依賴不確定存在的子目錄。

```javascript
// ============================================================
// 掃描邊界設定（硬編碼在腳本開頭，清晰可見，方便日後修改）
// ============================================================

const SCAN_ROOTS = [
  '/Users/admin'  // 從 home 目錄開始掃，靠 EXCLUDE 過濾雜訊
];

const MAX_DEPTH = 5;

// 遇到這些目錄名稱時，整個目錄跳過（不遞迴進入）
const EXCLUDE_DIRS = [
  'node_modules', '.git', 'Library', '.Trash',
  '.cursor',      // Cursor IDE 設定目錄（含大量 extensions CLAUDE.md）
  '.vscode',      // VS Code 設定目錄（同上）
  'extensions'    // .cursor/extensions, .vscode/extensions 的子目錄名稱
];

// 遇到這些完整路徑時，整個路徑跳過（處理上面 EXCLUDE_DIRS 無法涵蓋的特殊路徑）
const EXCLUDE_PATHS = [
  '/Users/admin/.claude/plugins/cache',
  '/Users/admin/.claude/plugins/marketplaces',
  '/Users/admin/.claude/cache',
  '/Users/admin/Library'
];

// Skills 的兩個掃描來源
const SKILLS_MANUAL_DIR = '/Users/admin/.claude/skills';
const SKILLS_PLUGIN_GLOB = '/Users/admin/.claude/plugins/marketplaces/*/skills';
```

### 5-2. CLAUDE.md 掃描邏輯

```javascript
// 遞迴掃描，遇到 EXCLUDE_DIRS 或 EXCLUDE_PATHS 就跳過整個子樹
// 每次進入新目錄前先檢查：
// 1. 目錄名稱是否在 EXCLUDE_DIRS
// 2. 目錄完整路徑是否以任一 EXCLUDE_PATH 開頭
// 3. 當前深度是否超過 MAX_DEPTH

function scanForClaudeMd(rootDir, currentDepth = 0) {
  if (currentDepth > MAX_DEPTH) return [];

  const results = [];
  let entries;

  try {
    entries = fs.readdirSync(rootDir, { withFileTypes: true });
  } catch (err) {
    return []; // 無權限讀取的目錄，靜默跳過
  }

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      // 排除規則 1：目錄名稱
      if (EXCLUDE_DIRS.includes(entry.name)) continue;
      // 排除規則 2：完整路徑
      if (EXCLUDE_PATHS.some(p => fullPath.startsWith(p))) continue;

      results.push(...scanForClaudeMd(fullPath, currentDepth + 1));
    } else if (entry.name === 'CLAUDE.md') {
      results.push(fullPath);
    }
  }

  return results;
}
```

### 5-3. Skills 掃描邏輯（三種型態）

```javascript
// 掃描 ~/.claude/skills/ 目錄
// 每個項目可能是以下三種型態之一：
// 1. symlink（指向目錄）：大部分 skills，如 vueuse-functions -> ../../.agents/skills/vueuse-functions
// 2. 普通目錄：如 excalidraw-mcp/
// 3. 單一 .md 檔案：如 fetch-slack-messages.md

function scanManualSkills(skillsDir) {
  const skills = [];

  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(skillsDir, entry.name);
      const lstat = fs.lstatSync(entryPath);

      if (lstat.isSymbolicLink()) {
        // 型態 1：symlink
        const target = fs.realpathSync(entryPath);
        const skillName = entry.name;
        skills.push(readSkillFromDir(skillName, entryPath, 'symlink', target, 'manual', null));

      } else if (lstat.isDirectory()) {
        // 型態 2：普通目錄
        const skillName = entry.name;
        skills.push(readSkillFromDir(skillName, entryPath, 'directory', null, 'manual', null));

      } else if (entry.name.endsWith('.md')) {
        // 型態 3：單一 .md 檔案
        const skillName = entry.name.replace('.md', '');
        skills.push(readSkillFromFile(skillName, entryPath, 'manual', null));
      }
    }
  } catch (err) {
    console.warn(`無法讀取 skills 目錄: ${skillsDir}`, err.message);
  }

  return skills;
}

// 掃描 plugin 安裝的 skills（~/.claude/plugins/marketplaces/*/skills/）
function scanPluginSkills(pluginBaseDir) {
  const skills = [];

  try {
    const marketplaceDirs = fs.readdirSync(pluginBaseDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => path.join(pluginBaseDir, e.name));

    for (const marketplaceDir of marketplaceDirs) {
      const pluginName = path.basename(marketplaceDir);
      const skillsDir = path.join(marketplaceDir, 'skills');

      if (!fs.existsSync(skillsDir)) continue;

      const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const skillPath = path.join(skillsDir, entry.name);
        skills.push(readSkillFromDir(entry.name, skillPath, 'directory', null, 'plugin', pluginName));
      }
    }
  } catch (err) {
    console.warn(`無法讀取 plugin skills: ${pluginBaseDir}`, err.message);
  }

  return skills;
}
```

### 5-4. tokenBudget 保留邏輯

```javascript
// scan.js 執行時：
// 1. 先讀取現有的 data.json（如果存在）
// 2. 如果 tokenBudget 有非 null 的值，保留它
// 3. 重新生成所有其他欄位
// 4. 輸出合併後的 data.json

function preserveTokenBudget(existingDataPath) {
  try {
    const existing = JSON.parse(fs.readFileSync(existingDataPath, 'utf8'));
    if (existing.tokenBudget && existing.tokenBudget.autoLoadedTotal !== null) {
      return existing.tokenBudget;
    }
  } catch {
    // 檔案不存在或格式錯誤，使用預設空值
  }

  return {
    _note: "此區塊由使用者手動填寫，scan.js 不會覆寫已存在的值。初次掃描時所有值為 null，請執行 /context 後手動更新。",
    autoLoadedTotal: null,
    breakdown: {
      memoryFiles: null,
      skillsFrontmatter: null,
      systemPrompt: null,
      systemTools: null,
      mcpTools: null,
      customAgents: null
    },
    warningThreshold: 40000,
    lastManualUpdate: null
  };
}
```

### 5-5. content 截斷邏輯

```javascript
// 截斷條件：byteSize > 10,000 bytes
// 截斷方式：取前 8,000 字元（UTF-16，對中英文都安全）
// 一定要填寫 isTruncated 和 totalWordCount

function processContent(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const byteSize = Buffer.byteLength(raw, 'utf8');
  const totalWordCount = raw.split(/\s+/).filter(Boolean).length;

  if (byteSize > 10000) {
    return {
      content: raw.substring(0, 8000),
      isTruncated: true,
      totalWordCount
    };
  }

  return {
    content: raw,
    isTruncated: false,
    totalWordCount
  };
}
```

### 5-6. token 估算公式

```javascript
// 統一公式，全腳本一致，前端不用再計算
function estimateTokens(wordCount) {
  return Math.round(wordCount * 1.3);
}
```

### 5-7. package.json scripts

```json
{
  "scripts": {
    "scan": "node scan.js",
    "dev": "vite",
    "dashboard": "node scan.js && vite --open"
  }
}
```

**說明：** `&&` 語意是「scan.js 成功後才啟動 vite」。scan.js 需要在正常結束時顯式 `process.exit(0)`，失敗時 `process.exit(1)`，確保 vite 只在掃描成功後啟動。

---

## 6. Vue 3 前端設計

### 6-1. 技術選型

| 技術 | 決定 | 理由 |
|------|------|------|
| Vue 3 + Composition API | 使用 | 已明確 |
| TypeScript | 使用 | 為 data.json 定義型別，防止欄位拼錯 |
| Vite | 使用 | 開發伺服器 + 建置 |
| Pinia | 不用 | 資料是靜態的，一次載入不需要狀態管理 |
| Vue Router | 不用 | 單頁，用 Tab 切換不用路由 |
| Chart.js | 不用 | 表格比圖表更直接 |
| ESLint/Prettier | v1 跳過 | 個人工具 v1 可接受，v2 補上 |

### 6-2. Vue 專案初始化答案

執行 `npm create vue@latest` 時：

| 問題 | 答案 |
|------|------|
| TypeScript? | Yes |
| JSX Support? | No |
| Vue Router? | No |
| Pinia? | No |
| Vitest? | No |
| E2E Testing? | No |
| ESLint? | No |
| Prettier? | No |

### 6-3. Tab 結構

| Tab | 預設 | 內容 | 使用頻率 |
|-----|------|------|---------|
| 概覽 | 是 | Token 總量 + 資料新鮮度 + 關鍵警告 + sections 排行 | 每次開啟 |
| CLAUDE.md 普查 | 否 | allProjects 列表 + 展開看內容 + 複製路徑 | 定期檢查 |
| Skills（手動）| 否 | .claude/skills/ 的 25 個 skills 清單 | 偶爾 |
| Skills（Plugin）| 否 | plugins 裡的 43 個 skills，依 pluginName 分組 | 偶爾 |
| Docs | 否 | docs/ 檔案列表（只顯示 metadata，不顯示內容）| 偶爾 |

### 6-4. 路徑 UX 設計（非工程師使用者）

對每個顯示路徑的地方，提供「複製路徑」按鈕，點擊後：
1. 複製父目錄路徑到剪貼簿（例如 `/Users/admin/openclaw/`）
2. 旁邊顯示說明：「Finder 中按 Cmd+Shift+G，貼上路徑即可前往」

純靜態 Vue 做不到「Reveal in Finder」，此為最佳替代方案，確保「看到路徑 → 採取行動」的迴路閉合。

### 6-5. 內容展示設計

- 預設顯示前 300 字（約半個螢幕）
- 「展開全部」按鈕顯示完整 `content`
- 等寬字體（`font-family: monospace`）保留 CLAUDE.md 的 markdown 原始格式
- 顯示區上方顯示「字數：N 字 | 估計 Token：N」
- 若 `isTruncated: true`，底部加「內容已截斷，完整版有 N 字（約 N tokens）」

---

## 7. MVP 功能清單（明確邊界）

### 在 MVP 範圍內（v1 必做）

| 功能 | 具體內容 | 行動指引 |
|------|---------|---------|
| 全域 Token 分析 | CLAUDE.md 字數/token 數；sections 排行前 3；docs/ 每個檔案的 token 數；token 預算分佈表（含 null 狀態說明） | 超過 8k tokens → 查 sections 排行，考慮移到 docs/ |
| 所有 CLAUDE.md 普查 | 掃描結果路徑列表；點擊展開看內容；檔案大小和最後修改時間；複製路徑 + Finder 操作說明 | 看到忘記的 CLAUDE.md → 決定保留或刪除 |
| Skills 清單（手動）| 25 個，含型態標示（symlink/目錄/檔案）；token 數；描述摘要；附加檔案加總 | 某 Skill 太大 → 評估是否保留 |
| Skills 清單（Plugin）| 43 個，依 pluginName 分組顯示；token 數；描述摘要 | 瞭解哪個 plugin 帶來了哪些 skills |
| Docs 列表 | docs/ 的所有 .md 檔 metadata（不顯示內容）| 瞭解按需載入的文件有多重 |
| 資料新鮮度 | 頁首顯示「掃描於 X 分鐘前」；顯示更新指令說明 | 資料太舊 → 跑 npm run scan |

### 明確不在 MVP 範圍（v2 以後）

| 功能 | 原因 | 依賴項 |
|------|------|--------|
| 規則使用頻率 | 需要 JSONL 解析，複雜度高 | JSONL 解析邏輯 |
| Skills 使用頻率 | 同上 | JSONL 解析邏輯 |
| 優化歷史追蹤 | 需要備份 diff 邏輯 | 備份快照比較 |
| CLAUDE.md 編輯功能 | 使用者明確說「只看不編輯」 | 永遠不做 |
| 圖表視覺化 | token 分佈用表格就夠清楚 | 無 Chart.js 依賴 |
| 即時監控/WebSocket | 個人工具不需要即時性 | 永遠不做 |
| ESLint + Prettier | v1 跳過，v2 加回來 | v2 計畫項目 |
| docs 內容展示 | v1 只顯示 metadata | v2 考慮加入 |

---

## 8. 開發階段

**原則：三個階段，第一階段必須在一天內能展示。Phase 1 已完成。**

---

### Phase 1（已完成）：Discovery

目標：了解工具基礎設施的實際狀況。
產出：findings.md（三個關鍵發現）+ Round 4 壓力測試報告。
狀態：完成。

追加確認（Round 4 已查驗）：
- rules/ 目錄為空，無殘留問題，無需清理
- Node.js v22.14.0 符合 `"node": ">=18"` 要求
- Git repo 存在，remote 為 `https://github.com/jerrycela/CMSI.git`
- .gitignore 尚不存在，需在 Phase 2 建立

---

### Phase 2：腳本 + 靜態資料（目標：1.5-2 天）

#### 第零步（30 分鐘，動工前必做）

確認並建立 dashboard/ 子目錄結構：

```bash
cd "/Users/admin/Documents/Claude md 自我迭代專案"
mkdir dashboard
cd dashboard
npm create vue@latest .   # 在當前目錄初始化（回答 6-2 節的問題）
```

建立 .gitignore：
```
node_modules/
dist/
public/data.json
```

#### 第一步（上午）：手寫 data.json 範例

不跑任何程式，用真實的本地資料手動填寫一份 `public/data.sample.json`。
參照本文件第 3 節的結構，用真實的路徑和字數填寫。
這份手工版本就是腳本和前端的合約，完成後才開始寫程式碼。
這份檔案提交進 git（作為格式參考）。

快速取得真實資料的方法：

```bash
find /Users/admin -name "CLAUDE.md" \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/.cursor/*" \
  -not -path "*/.vscode/*" \
  -not -path "*/.claude/plugins/*" \
  2>/dev/null
```

#### 第二步（下午）：寫 scan.js 腳本

實作第 5 節描述的掃描邏輯：
1. 讀取 `~/.claude/CLAUDE.md` → 填充 `globalConfig`（含 sections 解析）
2. 讀取 `~/.claude/docs/*.md` → 填充 `docs`
3. 掃描 `~/.claude/skills/`（三種型態）→ 填充 `skills.files`（manual 部分）
4. 掃描 `~/.claude/plugins/marketplaces/*/skills/` → 填充 `skills.files`（plugin 部分）
5. 遍歷 `/Users/admin` 找 CLAUDE.md（排除雜訊）→ 填充 `allProjects`
6. 保留現有 `tokenBudget`（如已填寫）
7. 輸出到 `public/data.json`，記錄 `meta.generatedAt`
8. 正常結束 `process.exit(0)`，失敗 `process.exit(1)`

#### 第三步（晚上）：驗證腳本輸出

對比手工版 `data.sample.json` 和腳本產出 `data.json`，確認：
- 結構一致
- allProjects 包含 openclaw、openclawfortest、Cursor 下的專案（Round 4 發現之前被遺漏的）
- skills.totalCount 為 68（而非 25）
- 無非預期的雜訊路徑混入 allProjects

---

### Phase 3：Vue 3 前端（目標：2-3 天）

#### 第一個畫面（第一天，必須完成）

單一頁面，顯示 globalConfig 的 token 數字，加上資料新鮮度。
這是「最小可展示版本」，完成這個就代表整個管線通了。

具體顯示：
- 「全域 CLAUDE.md：N tokens」（從 `globalConfig.estimatedTokens` 讀取）
- 「掃描於 X 分鐘前」（從 `meta.generatedAt` 計算）
- 「更新：cd dashboard && npm run scan」

#### 後續畫面（第二天之後）

依 Tab 結構（6-3 節）逐一實作：
1. 概覽 Tab 完整版（sections 排行、token 預算分佈）
2. CLAUDE.md 普查 Tab（路徑列表 + 展開看內容 + 複製路徑 UX）
3. Skills 手動 Tab（25 個清單）
4. Skills Plugin Tab（43 個，依 pluginName 分組）
5. Docs Tab（metadata 列表）

---

## 9. 已知風險與應對

| 風險 | 發生機率 | 影響 | 應對策略 |
|------|---------|------|---------|
| Symlink 讀取失敗 | 中 | Skills 清單不完整 | `fs.lstatSync` 判斷，失敗時標注「symlink 無法讀取」而非崩潰 |
| 掃描發現新的雜訊路徑 | 高 | allProjects 含無意義項目 | EXCLUDE_PATHS 是陣列，隨時可加新排除項；首次執行後人工確認輸出 |
| data.json 太大 | 中 | 頁面載入慢 | content 超過 10,000 bytes 截斷，isTruncated 標注 |
| scan.js 在某些目錄沒有讀取權限 | 中 | 掃描不完整 | try/catch 包每次 readdirSync，無權限就靜默跳過 |
| plugin skills 目錄結構改變 | 低 | 掃描遺漏 | 使用 glob 動態掃描 `marketplaces/*/skills/`，不硬編碼 plugin 名稱 |
| tokenBudget 被誤覆蓋 | 低 | 手動填寫的數字消失 | preserveTokenBudget() 函式加單元測試（v2 補） |
| Node.js 版本相容問題 | 低 | 無法執行 | package.json 加 `"engines": {"node": ">=18"}`，已確認 v22.14.0 |
| 計畫繼續迭代而沒有開始動手 | 低（Round 5 後已降低）| 無任何實際成果 | Round 5 是最後一輪計畫整合，下一輪必須是 scan.js 的程式碼輸出 |

---

## 10. 本輪 Insight

### Insight 1：「真實環境查驗」是計畫迭代中最有效的一輪

Round 2 和 Round 3 做的是邏輯精煉——在假設環境裡找出設計上的矛盾和遺漏。Round 4 做的是實地查驗——實際跑命令、看真實的目錄結構。

兩者的效益差距很大。Round 2+3 合計找出了設計層面的問題，但 Round 4 的一次查驗就發現了「45 個 skills 不見了」和「2 個 SCAN_ROOTS 目錄不存在」這種等級的問題。

**這個 insight 對未來計畫流程的影響：** 在邏輯分析之後，花 30 分鐘做一次真實環境查驗，往往比再做一輪邏輯分析更有效。

### Insight 2：68 個 Skills 的發現改變了 Dashboard 的核心價值

Round 1-3 把 Skills 管理視為一個「次要功能」（25 個 skills，隨手管理）。Round 4 的發現把這個數字提升到 68 個，其中有 43 個是透過 plugin 安裝的。

68 個 Skills 的清單本身就是一個資訊密集的頁面。「我到底安裝了哪些 skills，每個值多少 token，是從哪個 plugin 來的」——這個問題在沒有 Dashboard 的情況下需要翻三個不同的目錄才能回答。

Skills 管理從「次要功能」升格為「Dashboard 核心價值之一」。

### Insight 3：計畫品質的上限是「準備好開始動手的信心」

Round 3 試圖用「宣告終止」強制停止計畫迭代，但 Round 4 的壓力測試發現了高嚴重度問題，所以又多了一輪。

回頭看，這是合理的——Round 3 的計畫有真實存在的嚴重錯誤（SCAN_ROOTS 不存在、skills 總數錯誤）。在這種情況下宣告「直接動手」，就是帶著已知的嚴重問題開始實作，後面的返工成本更高。

**真正的終止條件：** 沒有已知的高嚴重度問題，且能在一天內完成第一個可展示版本。Round 5 整合後，這兩個條件都已滿足。

---

## 11. 與 Round 3 的差異總結

| 項目 | Round 3 的設計 | Round 5 的修正 | 修正原因 |
|------|--------------|--------------|---------|
| SCAN_ROOTS | `[Documents, Developer, Projects]`（2 個不存在） | `['/Users/admin']`（從 home 掃，靠 EXCLUDE 過濾）| Round 4 查驗發現 Developer/Projects 不存在，且真正的專案（openclaw、Cursor）在 home 根目錄 |
| EXCLUDE_DIRS | `[node_modules, .git, Library, .Trash]`（4 個） | 加入 `.cursor`, `.vscode`, `extensions`，新增 EXCLUDE_PATHS 陣列 | Round 4 發現 .cursor/.vscode/extensions 會帶來 23 個雜訊 CLAUDE.md，佔掃描結果的 70% |
| Skills 總數 | 假設 25 個 | 實際 68 個（25 手動 + 43 plugin）| Round 4 實地查驗 `.claude/plugins/marketplaces/*/skills/` |
| Skills 掃描邏輯 | 只處理 symlink | 三種型態（symlink/普通目錄/單一 .md 檔） | Round 4 發現 `.claude/skills/` 有 3 種型態，各自讀取方式不同 |
| Skills `path` 欄位 | 錯誤（和 symlinkTarget 相同）| 修正為 symlink 本身的路徑（`.claude/skills/xxx`） | Round 4 指出 path 和 symlinkTarget 值相同時沒有資訊意義 |
| Skills `type` 欄位 | 不存在（只有 isSymlink: boolean）| 新增 `type: "symlink" \| "directory" \| "file"` | 三種型態需要明確標示，boolean 無法表達三種狀態 |
| Skills `source` 欄位 | 不存在 | 新增 `source: "manual" \| "plugin"` 和 `pluginName` | 區分 25 個手動安裝和 43 個 plugin 安裝，前端用來分組顯示 |
| `isTruncated` 欄位 | 不存在 | 新增 `isTruncated: boolean` 和 `totalWordCount` | 前端需要知道 content 是否被截斷才能顯示提示 |
| 截斷條件 | 「前 5,000 字」（單位不明確）| `byteSize > 10,000` 截斷，取前 8,000 字元（UTF-16）| 字節數比「字」更明確，對中英文混合內容安全 |
| `tokenBudget` 更新行為 | 每次 scan 覆寫（手動填的數字會消失）| scan.js 保留已存在的非 null 值，不覆寫 | Round 4 指出 scan.js 自動生成但 tokenBudget 需手動填，每次覆寫會清空手動值 |
| Vue 專案位置 | 未定義 | 明確建立 `dashboard/` 子目錄 | Round 4 發現這�� Phase 2 開始前的第零步，不定義會造成後續路徑混亂 |
| `npm run dashboard` 寫法 | 只有描述，無具體代碼 | `"node scan.js && vite --open"` | Round 4 指出需要 `&&` 確保 scan 失敗時 vite 不啟動，並說明 process.exit 要求 |
| Vue 初始化問題 | 未列出所有答案 | 以表格列出全部 8 個問題的答案 | Round 4 發現這些答案分散在各處，實作時仍需思考 |
| Tab 結構 | 未定義 | 5 個 Tab，概覽為預設 | Round 4 指出「第一眼看到什麼」的 UX 缺口 |
| 路徑 UX | 使用者「複製路徑」（但不知道怎麼用） | 加入 Finder 操作說明（Cmd+Shift+G）| Round 4 指出非工程師使用者看到絕對路徑後不知道如何前往 |
| rules/ 狀態 | 待確認（開始前小任務）| 已確認為空，移除此任務 | Round 4 實地查驗確認 rules/ 為空，15 分鐘的「小任務」無需執行 |
| 行動指引位置 | 文件裡（未說明 Dashboard 上顯示方式）| 每個數字旁加 tooltip，滑鼠移上去顯示建議 | Round 4 指出行動指引如果直接顯示在版面會很擁擠 |

---

## 附錄 A：計畫演進脈絡（供歷史參考）

| 輪次 | 主要貢獻 |
|------|---------|
| Round 1 | 把 Express + monorepo 的過度工程化計畫收斂到 Node 腳本 + Vite + JSON |
| Round 2 | 審查 Round 1，補上 data.json 結構需求、行動指引需求、掃描邊界需求 |
| Round 3 | 整合 Round 2 建議，產出第一份「完整可讀計畫」，含 data.json 初稿和具體程式碼片段 |
| Round 4 | 實地查驗本機環境，發現 3 個高嚴重度問題（SCAN_ROOTS 不存在、skills 實際 68 個、Vue 專案位置未定義）和多個中低嚴重度問題 |
| Round 5（本文件）| 整合 Round 4 所有修正，產出修正版完整計畫，消除所有已知高嚴重度問題 |

---

## 附錄 B：本文件的邊界

本文件覆蓋：v1 MVP 的所有設計決策和實作細節。

本文件不覆蓋：
- v2 功能（JSONL 解析、規則使用頻率、skills 使用頻率）
- 部署/發布（這是個人本地工具，無需部署）
- 協作工作流程（單一使用者）

---

*本文件由 Claude Sonnet 4.6 整合撰寫，2026-02-19*
*Round 5 是最後一輪計畫整合。下一個輸出必須是 dashboard/scan.js 的程式碼。*
