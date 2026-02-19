# Round 9 — 最終定版計畫（完整獨立版）

文件日期：2026-02-19
文件角色：最終整合員（Claude Sonnet 4.6）
文件性質：**本文件是唯一有效的計畫定版。前八輪均已歸檔為歷史紀錄。工程師拿到本文件可以直接開始實作，無需參照任何其他文件。**

---

## 1. 專案概述

### 一句話定義

**讓我在 30 秒內看到電腦上所有 Claude Code 設定的健康狀況、知道 68 個 Skills 各自是什麼，然後立刻知道下一步該做什麼——Dashboard 幫我判斷好了，不需要自己看數字。**

### 工具性質

- 個人本地工具，單一使用者
- 無後端、無資料庫、無伺服器
- 跑一次掃描腳本，結果存成 JSON，瀏覽器直接讀取
- 定位：偶爾健康檢查，而非每天必開

### 架構總覽

```
本地檔案系統
  ↓
scan.js（Node.js 掃描腳本）
  ↓
public/data.json（靜態資料）
  ↓
Vue 3 SPA（瀏覽器讀取）
  ↓
瀏覽器畫面
```

scan.js 執行完畢後，還會在終端機直接輸出 5-8 行狀態摘要，讓使用者不開瀏覽器也能快速確認狀態。

---

## 2. 設計原則

### 技術原則

- **單機、無後端**：所有資料由本地腳本掃描產生，瀏覽器直接讀取靜態 JSON，沒有伺服器、沒有資料庫
- **掃描一次，多次查閱**：跑一次 `npm run scan`，結果存進 data.json，前端直接讀取，不需要即時執行
- **真實路徑優於假設**：所有設定以本機實際發現的目錄為準，不依賴不確定存在的路徑
- **漸進式建置**：先讓管線通（掃描 → JSON → 畫面），再完善每個功能頁面
- **ESM 一致性**：scan.js 和 Vue 元件統一使用 ES Module 語法（import/export），package.json 加 `"type": "module"`

### UX 原則

- **顯示判斷，而非顯示數據**：Dashboard 先幫使用者判斷狀態好壞，給出結論（健康燈號），再呈現細節數字
- **警告必須附帶原因**：紅色燈號不能只顯示「警告」，必須明確說「為什麼紅」和「下一步做什麼」，例如「openclaw 設定（2441 字）比全域（633 字）大 3.8 倍，可能有重複規則」
- **視線路徑有設計**：使用者打開 Dashboard 的前 30 秒，視線依序：健康狀態 → 三個關鍵數字 → 需要注意的細節
- **語言對應使用者，不對應技術**：按鈕名稱對應使用者想做的事（「前往資料夾」），Tab 名稱對應使用者的問題（「指令設定」），不使用技術術語（tokens、symlink、CLAUDE.md）
- **空狀態是設計的一部分**：每個可能出現空資料的地方，都要主動說明「為什麼空」和「要怎麼填滿」，不能只顯示空白或 null
- **分類邏輯來自使用者的問題，不是資料的結構**：使用者找 Skill 時是「找跟 Vue 有關的」，不是「找手動安裝的」

---

## 3. 使用者故事 + 行動指引

### 故事 1：我想立刻知道現在設定狀況好不好

「當我打開 Dashboard，我最先看到一個大色塊告訴我現在是『正常』、『注意』還是『警告』，不需要自己看數字判斷。每個狀態都清楚說明原因。」

**健康狀態判斷邏輯：**

| 狀態 | 顯示顏色 | 觸發條件 |
|------|---------|---------|
| 正常 | 綠色 | 所有數字在合理範圍內，資料在 24 小時內 |
| 注意 | 黃色 | 全域指令檔超過 6,000 字，或資料超過 24 小時未更新 |
| 警告 | 紅色 | 總字數超過 40,000 字，或某個專案的設定比全域還大 |

**警告燈號的原因說明範例（必須在 UI 顯示，不能只有紅色）：**

| 觸發條件 | 顯示文字 |
|---------|---------|
| openclaw 設定 > 全域設定 | 「openclaw 設定（2,441 字）比全域（633 字）大 3.8 倍，可能有重複規則——建議打開「指令設定」Tab 比對」 |
| 總字數超過 40,000 | 「所有設定合計超過 40,000 字，佔對話額度 80% 以上，建議刪減不常用的規則」 |
| 全域超過 6,000 字（注意） | 「全域指令檔超過 6,000 字，可考慮將部分規則移到按需載入的參考文件」 |

**行動指引：**

| 看到什麼 | 做什麼 |
|---------|--------|
| 狀態：警告（紅色）+ 原因說明 | 讀原因說明，點進對應 Tab 查看詳情，按說明指引採取行動 |
| 狀態：注意（黃色）+ 原因說明 | 不緊急但需要留意，可趁這次查看哪個區塊佔比最大 |
| 狀態：正常（綠色） | 安心查閱細節，不需要採取緊急行動 |
| 資料已超過 24 小時 | 看到橫幅警告，在 dashboard/ 目錄跑 `npm run scan` 後重整頁面 |

---

### 故事 2：我想知道我的設定有多重

「當我打開 Dashboard，我能立刻看到全域指令檔有多少字、佔每次對話額度的百分比，以及一個直覺的進度條。」

| 看到什麼 | 做什麼 |
|---------|--------|
| 全域指令檔超過 6,000 字（黃色注意） | 查看下方「最重的三個區塊」，找最大的區塊考慮移到參考文件區 |
| 總字數超過 40,000（進度條接近全滿） | 立刻查看，對話上下文快用完了，考慮刪減不必要的規則 |
| 字數顯示「尚未設定」 | 跑一次 `/context` 指令後手動填入 data.json 的 tokenBudget 區塊 |
| 某個參考文件超過 3,000 字 | 點進「參考文件」Tab，考慮拆成更小的子文件，或刪除沒在用的部分 |

---

### 故事 3：我想看所有專案的設定長什麼樣

「當我打開『指令設定』Tab，我能看到電腦上所有找到的 CLAUDE.md 在哪裡、它的內容是什麼、有多大。」

| 看到什麼 | 做什麼 |
|---------|--------|
| 某個專案的設定很久沒更新 | 點開看內容，判斷是否仍然相關 |
| 某個專案的設定比全域還大 | 考慮是否有多餘的重複內容可以刪 |
| 看到一個忘記它存在的設定 | 複查確認內容、決定是否保留 |
| 想找到這個資料夾 | 點「前往資料夾」按鈕，跟著提示框的步驟操作（自動複製路徑 + 說明） |

---

### 故事 4：我想知道裝了哪些 Skills

「當我打開『Skills』Tab，我能在一個清單裡看到全部 68 個已安裝的 Skills，可以輸入關鍵字即時篩選，每個 Skill 有名稱、一句話說明和大小。」

| 看到什麼 | 做什麼 |
|---------|--------|
| 某個 Skill 的字數比預期大很多 | 評估這個 Skill 是否值得保留，或能否精簡 |
| 發現安裝了一個完全忘記的 Skill | 讀描述確認用途，決定是否保留 |
| 想找 Vue 相關的 Skill | 在篩選框輸入「vue」，即時顯示匹配的 Skills |
| 某個 Skill 標示為「Plugin 安裝」 | 知道這個是透過哪個 plugin 安裝的 |

---

### 故事 5：我想知道這份資料有多舊

「當我打開 Dashboard，我能一眼看到這份資料是什麼時候掃描的，以及如何更新它。」

| 看到什麼 | 做什麼 |
|---------|--------|
| 資料已是三天前的（橫幅警告） | 點選說明或手動在終端機貼上更新指令，再重整頁面 |
| 資料是剛才更新的（狀態欄顯示） | 直接信任數字，開始看內容 |

---

### 故事 6：我在終端機工作，不想開瀏覽器

「當我跑 `npm run scan`，終端機直接顯示 5-8 行摘要，我在這裡就能看到現在的狀態。」

**終端機摘要範例輸出：**

```
CMSI 掃描完成 — 2026-02-19 14:30

狀態：警告  openclaw 設定（2441 字）比全域（633 字）大 3.8 倍
全域指令檔：633 字（佔對話額度約 1.6%）
Skills：68 個（手動 25 + Plugin 43）
指令設定：10 個 CLAUDE.md（最大：openclaw 2,441 字）
最重章節：Skill 路由表 > 模型分工原則 > 核心品質規則

查看詳���：open "public/index.html"
```

| 看到什麼 | 做什麼 |
|---------|--------|
| 狀態行顯示警告 + 原因 | 決定是否需要開瀏覽器查詳情 |
| 狀態行顯示正常 | 繼續工作，無需開瀏覽器 |

---

## 4. data.json 完整結構

```json
{
  "meta": {
    "generatedAt": "2026-02-19T14:30:00+08:00",
    "scanVersion": "1.0.0"
  },

  "healthThresholds": {
    "_note": "健康狀態判定閾值。前端依此計算燈號，不需要硬編碼在元件裡。",
    "globalWordCountWarning": 6000,
    "globalWordCountAlert": 8000,
    "totalWordCountWarning": 32000,
    "totalWordCountAlert": 40000,
    "dataStaleHoursWarning": 24,
    "dataStaleHoursAlert": 72
  },

  "globalConfig": {
    "claudeMdPath": "/Users/admin/.claude/CLAUDE.md",
    "wordCount": 633,
    "byteSize": 6304,
    "estimatedTokens": 823,
    "content": "...（完整原始內容）...",
    "isTruncated": false,
    "totalWordCount": 633,
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
    "totalWordCount": 1408,
    "totalEstimatedTokens": 1830,
    "files": [
      {
        "name": "agents.md",
        "path": "/Users/admin/.claude/docs/agents.md",
        "wordCount": 229,
        "byteSize": 2233,
        "estimatedTokens": 298,
        "lastModified": "2026-01-15T10:00:00+08:00",
        "descriptionSnippet": "說明如何建立和管理 Agent 團隊（多工協作）"
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
        "descriptionSnippet": "在適當場合套用 VueUse composables...",
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
    "_note": "此區塊由使用者手動填寫，scan.js 不會覆寫已存在的值。初次掃描時所有值為 null，請在 Claude Code 執行 /context 後手動更新。",
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

### 欄位設計說明

| 欄位 | 設計意圖 |
|------|---------|
| `healthThresholds` | 健康判定閾值集中在 JSON 裡，前端讀取後判斷燈號，未來調整只改這裡，不改程式碼 |
| `docs[].descriptionSnippet` | scan.js 自動取文件第一段前 30 個詞，讓「參考文件」Tab 每個條目有意義 |
| `skills[].descriptionSnippet` | 同上，讓 Skills Tab 每個 Skill 有一句話摘要 |
| `globalConfig.content` | 存完整原始文字，前端用等寬字體呈現 |
| `isTruncated` | 布林值，前端用來判斷是否顯示「內容已截斷」提示 |
| `totalWordCount` | 截斷後 content 不能反映真實字數，需獨立欄位記錄 |
| `estimatedTokens` | 統一用 `wordCount × 1.3` 計算，腳本端計算，前端直接讀取 |
| `skills[].type` | `"symlink"` / `"directory"` / `"file"`，UI 上不顯示此欄位 |
| `skills[].path` | 永遠是 Claude Code 讀到的路徑（symlink 本身），非 target |
| `skills[].symlinkTarget` | 只有 type 為 symlink 時才有值，其他為 null，UI 上不顯示 |
| `skills[].source` | `"manual"` 或 `"plugin"`，UI 顯示為小標籤 |
| `skills[].pluginName` | source 為 plugin 時填入，作為 Skills Tab 裡的分組標題 |
| `tokenBudget` | scan.js 初次掃描填 null；如果已有值，保留不覆寫 |
| 所有 `path` | 全部用絕對路徑，避免相對路徑在不同啟動方式下出錯 |

---

## 5. 專案目錄結構

```
/Users/admin/Documents/Claude md 自我迭代專案/
├── dashboard/                   ← Vue 專案根目錄（所有 npm run 都在這裡執行）
│   ├── src/
│   │   ├── App.vue              ← Tab 列 + 切換邏輯
│   │   ├── main.ts
│   │   ├── components/
│   │   │   ├── HealthBanner.vue     ← 健康狀態燈號 + 原因說明 + 資料新鮮度
│   │   │   ├── SummaryCards.vue     ← 三個數字卡片
│   │   │   ├── SectionsRanking.vue  ← 最重區塊排行
│   │   │   ├── OverviewTab.vue      ← 組合以上三個元件（總覽 Tab）
│   │   │   ├── ProjectsTab.vue      ← 指令設定 Tab
│   │   │   ├── SkillsTab.vue        ← Skills Tab（含即時篩選）
│   │   │   └── DocsTab.vue          ← 參考文件 Tab
│   │   └── types/
│   │       └── data.ts          ← data.json 的 TypeScript 型別定義
│   ├── public/
│   │   ├── data.json            ← scan.js 的輸出（不進版控）
│   │   └── data.sample.json     ← 手工範例（進版控，作為格式參考）
│   ├── scan.js                  ← 掃描腳本（ESM 格式）
│   ├── package.json             ← 含 "type": "module"
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .gitignore               ← 排除 node_modules/ 和 public/data.json
├── findings.md                  ← Phase 1 Discovery 紀錄（已完成）
├── iterations/
│   ├── round-2.md ~ round-8.md ← 歷史報告（已歸檔）
│   └── round-9.md              ← 本文件（當前有效計畫）
└── task_plan.md                 ← 已過時，保留作歷史參考
```

### 資料流圖

```
本地檔案系統
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  [npm run scan]  或  [npm run dashboard]                   │
│       │                                                    │
│       ├─→ [Node.js 掃描腳本 scan.js（ESM）]                │
│       │        │                                           │
│       │        ├─ 讀取 ~/.claude/CLAUDE.md                 │
│       │        ├─ 讀取 ~/.claude/docs/*.md（含描述摘要）    │
│       │        ├─ 掃描 ~/.claude/skills/（三種型態）        │
│       │        ├─ 掃描 ~/.claude/plugins/marketplaces/     │
│       │        │   */skills/                               │
│       │        ├─ 遍歷 /Users/admin（排除雜訊）             │
│       │        │   找 CLAUDE.md                            │
│       │        ├─ 保留現有 tokenBudget（如已填寫）          │
│       │        ├─ 寫入固定 healthThresholds                │
│       │        ├─ 輸出 → public/data.json                  │
│       │        └─ 終端機輸出 5-8 行狀態摘要                │
│       │                                                    │
│       └─→ [Vite Dev Server --open]（只在 dashboard 指令時）│
│                │                                           │
│                └─→ 讀取 public/data.json（靜態資源）        │
│                         │                                  │
│                    [Vue 3 SPA]                             │
│                    ├─ 計算健康燈號 + 原因說明               │
│                    ├─ 計算資料新鮮度                        │
│                    └─ 渲染 4 個 Tab                        │
│                                                            │
└────────────────────────────────────────────────────────────┘

資料流：本地檔案 → scan.js → data.json → Vue 3 → 瀏覽器
        同時：scan.js → 終端機摘要（5-8 行，立即可讀）
```

**沒有：** 後端伺服器、資料庫、WebSocket、Express、API 端點

---

## 6. scan.js 設計規格

### 6-1. 模組格式（CRITICAL — 第零步必須確認）

scan.js 使用 **ES Module 格式**，和 Vue 元件的 import 語法保持一致。

`package.json` 必須加入：
```json
{
  "type": "module"
}
```

加入後，scan.js 第一行就能寫：
```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
```

不加這行直接用 `const fs = require('fs')` 會導致 `ERR_REQUIRE_ESM` 錯誤。

### 6-2. 掃描邊界常數

```javascript
// ============================================================
// 掃描邊界設定（硬編碼在腳本開頭，方便日後修改）
// ============================================================

const SCAN_ROOTS = ['/Users/admin'];
const MAX_DEPTH = 5;

// 遇到這些目錄名稱時，整個目錄跳過（不遞迴進入）
const EXCLUDE_DIRS = [
  'node_modules', '.git', 'Library', '.Trash',
  '.cursor',      // Cursor IDE 設定目錄（含大量 extensions CLAUDE.md）
  '.vscode',      // VS Code 設定目錄
  'extensions'    // .cursor/extensions 等子目錄
];

// 遇到這些完整路徑時，整個路徑跳過
const EXCLUDE_PATHS = [
  '/Users/admin/.claude/plugins/cache',
  '/Users/admin/.claude/plugins/marketplaces',
  '/Users/admin/.claude/cache',
  '/Users/admin/Library'
];

// Skills 的兩個掃描來源
const SKILLS_MANUAL_DIR = '/Users/admin/.claude/skills';
const SKILLS_PLUGIN_BASE = '/Users/admin/.claude/plugins/marketplaces';

// 輸出路徑（相對於 scan.js 所在位置）
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, 'public', 'data.json');
```

### 6-3. 主函式骨架（建議第一步先讓骨架能執行）

```javascript
async function main() {
  const existingTokenBudget = preserveTokenBudget(OUTPUT_PATH);

  const data = {
    meta: {
      generatedAt: new Date().toISOString(),
      scanVersion: '1.0.0'
    },
    healthThresholds: getHealthThresholds(),
    globalConfig: scanGlobalConfig(),
    docs: scanDocs(),
    skills: scanAllSkills(),
    allProjects: scanForClaudeMd(SCAN_ROOTS[0]),
    tokenBudget: existingTokenBudget
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf8');
  printSummary(data);  // 終端機摘要輸出
  process.exit(0);
}

main().catch(err => {
  console.error('掃描失敗:', err.message);
  process.exit(1);
});
```

### 6-4. CLAUDE.md 掃描邏輯

```javascript
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
      if (EXCLUDE_DIRS.includes(entry.name)) continue;
      if (EXCLUDE_PATHS.some(p => fullPath.startsWith(p))) continue;
      results.push(...scanForClaudeMd(fullPath, currentDepth + 1));
    } else if (entry.name === 'CLAUDE.md') {
      results.push(fullPath);
    }
  }

  return results;
}
```

### 6-5. Skills 掃描邏輯（三種型態）

```javascript
// 每個 skill 可能是：1. symlink（指向目錄）  2. 普通目錄  3. 單一 .md 檔案

function scanManualSkills(skillsDir) {
  const skills = [];
  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(skillsDir, entry.name);
      const lstat = fs.lstatSync(entryPath);

      if (lstat.isSymbolicLink()) {
        const target = fs.realpathSync(entryPath);
        skills.push(readSkillFromDir(entry.name, entryPath, 'symlink', target, 'manual', null));
      } else if (lstat.isDirectory()) {
        skills.push(readSkillFromDir(entry.name, entryPath, 'directory', null, 'manual', null));
      } else if (entry.name.endsWith('.md')) {
        const skillName = entry.name.replace('.md', '');
        skills.push(readSkillFromFile(skillName, entryPath, 'manual', null));
      }
    }
  } catch (err) {
    console.warn(`無法讀取 skills 目錄: ${skillsDir}`, err.message);
  }
  return skills;
}

function scanPluginSkills(pluginBaseDir) {
  const skills = [];
  try {
    const marketplaceDirs = fs.readdirSync(pluginBaseDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => path.join(pluginBaseDir, e.name));

    for (const marketplaceDir of marketplaceDirs) {
      const pluginName = path.basename(marketplaceDir);
      const skillsDir = path.join(marketplaceDir, 'skills');
      if (!fs.existsSync(skillsDir)) continue; // 有些 plugin 沒有 skills/ 子目錄，跳過

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

### 6-6. 描述摘要擷取

```javascript
function extractDescriptionSnippet(rawContent) {
  const cleaned = rawContent
    .replace(/^#+\s+/gm, '')      // 移除標題 #
    .replace(/\*\*/g, '')          // 移除粗體 **
    .replace(/`[^`]+`/g, '')       // 移除行內程式碼
    .replace(/^[-*]\s+/gm, '')     // 移除列表符號
    .replace(/\n+/g, ' ')          // 換行變空格
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.slice(0, 30).join(' ') + (words.length > 30 ? '...' : '');
}
```

### 6-7. content 截斷邏輯

```javascript
// 截斷條件：byteSize > 10,000 bytes
// 截斷方式：取前 8,000 字元

function processContent(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const byteSize = Buffer.byteLength(raw, 'utf8');
  const totalWordCount = raw.split(/\s+/).filter(Boolean).length;

  if (byteSize > 10000) {
    return { content: raw.substring(0, 8000), isTruncated: true, totalWordCount };
  }
  return { content: raw, isTruncated: false, totalWordCount };
}
```

### 6-8. token 估算公式

```javascript
// 全腳本統一公式，前端不用再計算
function estimateTokens(wordCount) {
  return Math.round(wordCount * 1.3);
}
```

### 6-9. tokenBudget 保留邏輯

```javascript
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
    _note: "此區塊由使用者手動填寫，scan.js 不會覆寫已存在的值。初次掃描時所有值為 null，請在 Claude Code 執行 /context 後手動更新。",
    autoLoadedTotal: null,
    breakdown: {
      memoryFiles: null, skillsFrontmatter: null,
      systemPrompt: null, systemTools: null,
      mcpTools: null, customAgents: null
    },
    warningThreshold: 40000,
    lastManualUpdate: null
  };
}
```

### 6-10. 健康閾值常數

```javascript
function getHealthThresholds() {
  return {
    _note: "健康狀態判定閾值。前端依此計算燈號，不需要硬編碼在元件裡。",
    globalWordCountWarning: 6000,
    globalWordCountAlert: 8000,
    totalWordCountWarning: 32000,
    totalWordCountAlert: 40000,
    dataStaleHoursWarning: 24,
    dataStaleHoursAlert: 72
  };
}
```

### 6-11. 終端機摘要輸出（MVP 功能）

```javascript
function printSummary(data) {
  const { globalConfig, skills, allProjects, healthThresholds } = data;

  // 計算健康狀態
  const totalWordCount = globalConfig.totalWordCount +
    (data.docs?.totalWordCount || 0) +
    allProjects.reduce((sum, p) => sum + p.wordCount, 0);

  const hasProjectBiggerThanGlobal = allProjects.some(
    p => p.wordCount > globalConfig.wordCount
  );

  let status = '正常';
  let reason = '';

  if (totalWordCount > healthThresholds.totalWordCountAlert || hasProjectBiggerThanGlobal) {
    status = '警告';
    if (hasProjectBiggerThanGlobal) {
      const biggest = allProjects
        .filter(p => p.wordCount > globalConfig.wordCount)
        .sort((a, b) => b.wordCount - a.wordCount)[0];
      const ratio = (biggest.wordCount / globalConfig.wordCount).toFixed(1);
      reason = `  ${biggest.projectName} 設定（${biggest.wordCount} 字）比全域（${globalConfig.wordCount} 字）大 ${ratio} 倍`;
    }
  } else if (globalConfig.wordCount > healthThresholds.globalWordCountWarning) {
    status = '注意';
    reason = `  全域指令檔超過 ${healthThresholds.globalWordCountWarning} 字`;
  }

  const topSections = (globalConfig.sections || [])
    .sort((a, b) => b.wordCount - a.wordCount)
    .slice(0, 3)
    .map(s => s.heading)
    .join(' > ');

  const now = new Date().toLocaleString('zh-TW', { hour12: false });

  console.log('');
  console.log(`CMSI 掃描完成 — ${now}`);
  console.log('');
  console.log(`狀態：${status}${reason ? '\n' + reason : ''}`);
  console.log(`全域指令檔：${globalConfig.wordCount} 字（佔對話額度約 ${(globalConfig.estimatedTokens / 400).toFixed(1)}%）`);
  console.log(`Skills：${skills.totalCount} 個（手動 ${skills.manualCount} + Plugin ${skills.pluginCount}）`);
  console.log(`指令設定：${allProjects.length} 個 CLAUDE.md`);
  if (topSections) {
    console.log(`最重章節：${topSections}`);
  }
  console.log('');
}
```

### 6-12. package.json scripts

```json
{
  "type": "module",
  "scripts": {
    "scan": "node scan.js",
    "dev": "vite",
    "dashboard": "node scan.js && vite --open"
  },
  "engines": {
    "node": ">=18"
  }
}
```

`&&` 語意是「scan.js 成功後才啟動 vite」。scan.js 正常結束時執行 `process.exit(0)`，失敗時執行 `process.exit(1)`，確保 vite 只在掃描成功後啟動。

---

## 7. 前端設計規格

### 7-1. 技術選型

| 技術 | 決定 | 理由 |
|------|------|------|
| Vue 3 + Composition API | 使用 | 已明確 |
| TypeScript | 使用 | 為 data.json 定義型別，防止欄位拼錯 |
| Vite | 使用 | 開發伺服器 + 建置 |
| Pinia | 不用 | 資料是靜態的，一次載入不需要狀態管理 |
| Vue Router | 不用 | 單頁，用 Tab 切換不用路由 |
| Chart.js | 不用 | 用進度條 + 表格，比圖表更直接 |
| ESLint/Prettier | v1 跳過 | 個人工具 v1 可接受 |

### 7-2. Vue 專案初始化

執行 `npm create vue@latest dashboard`（不需要 mkdir，create-vue 自動建目錄）：

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

初始化完成後，立刻在 package.json 加入 `"type": "module"`。

**最小可用的 vite.config.ts（Vite 7 格式）：**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

### 7-3. Tab 結構（4 個 Tab）

| Tab 名稱 | 預設 | 內容 | 使用頻率 |
|---------|------|------|---------|
| 總覽 | 是 | 健康燈號 + 三個數字卡片 + sections 排行 | 每次開啟 |
| 指令設定 | 否 | 所有找到的 CLAUDE.md 列表 + 展開看內容 + 前往資料夾 | 定期檢查 |
| Skills | 否 | 68 個 Skills 統一清單 + 即時篩選框 + Plugin 分組標題 | 偶爾 |
| 參考文件 | 否 | docs/ 檔案列表 + 一句話摘要 + 大小 | 偶爾 |

### 7-4. 第一個畫面的三層設計

打開 Dashboard，畫面分三個層次，視線依序從上往下：

**第一層：健康燈號區（上方約 20% 高度）**

一個橫跨整個視窗的色塊（綠/黃/紅）：
- 左側大字：「現在狀態：正常」（或注意、警告）
- 右側小字：「掃描於 3 分鐘前」
- 若非正常狀態：色塊下方加一行原因說明（例如「openclaw 設定（2,441 字）比全域（633 字）大 3.8 倍，可能有重複規則——建議打開「指令設定」Tab 比對」）
- 若超過 24 小時：追加橫幅警告「資料已過時，建議重新掃描」+ 複製按鈕

**健康狀態計算邏輯（Vue 元件，讀取 healthThresholds 後計算）：**

```
設 totalWordCount = globalConfig.totalWordCount + docs.totalWordCount +
                   allProjects 所有 wordCount 之和

若 totalWordCount > healthThresholds.totalWordCountAlert
  或 allProjects 中有任何 project.wordCount > globalConfig.wordCount
  → 狀態：警告（紅）
  → 同時計算原因說明文字

否則若 globalConfig.wordCount > healthThresholds.globalWordCountWarning
  或 資料超過 healthThresholds.dataStaleHoursWarning 小時
  → 狀態：注意（黃）
  → 同時計算原因說明文字

否則
  → 狀態：正常（綠）
```

**第二層：三個數字卡片（中間約 50% 高度）**

三個並排卡片：

- 卡片 1「全域指令檔」：大數字字數 + 副文字「佔對話額度約 X%」 + 進度條（顏色對應健康狀態）
- 卡片 2「已安裝 Skills」：大數字 68 + 副文字「手動 25 個 + Plugin 43 個」
- 卡片 3「指令設定檔」：大數字找到的 CLAUDE.md 數量 + 副文字「最大的：openclaw（2,441 字）」

**第三層：最重區塊排行（下方約 30% 高度）**

全域指令檔裡最大的三個章節：
- 「第 1 名：Skill 路由表 — 1,200 字（佔全域指令檔 21%）」
- 每個項目旁有 tooltip：「這個區塊很大，考慮移到參考文件，改為按需載入」

### 7-5. Skills Tab 設計

- 頁面頂部：即時篩選框（輸入關鍵字即時過濾，不需要按 Enter）
- 所有 68 個 Skills 在同一個列表
- Plugin 來源的 Skills 用分組標題（例如「superpowers plugin」）區隔
- 每個 Skill 卡片顯示：名稱（加粗）、一句話摘要（`descriptionSnippet`）、字數、來源標籤（手動安裝 / Plugin 安裝）
- 不顯示 `type` 欄位（symlink/directory/file 是技術細節）

### 7-6. 指令設定 Tab 設計

- 列表顯示所有找到的 CLAUDE.md，每個條目：
  - 專案名稱（從路徑擷取）
  - 字數 + 最後更新時間
  - 若 wordCount > globalConfig.wordCount：顯示橙色標籤「比全域還大」
  - 「前往資料夾」按鈕：點擊後自動複製父目錄路徑到剪貼簿，出現提示框「路徑已複製！在 Finder 選單列點『前往 > 前往檔案夾』，貼上即可。」
- 點擊條目後展開顯示前 100 字內容（等寬字體），標示「部分內容，共 N 字」
- 「展開全部」按鈕顯示完整 `content`
- 若 `isTruncated: true`，底部加「內容已截斷，完整版有 N 字」

### 7-7. 參考文件 Tab 設計

每個條目顯示：檔案名稱、一句話用途（`descriptionSnippet`）、字數 + 最後更新時間

不顯示內容（v2 再加）。

若 docs.files 為空，顯示：「目前沒有參考文件。docs/ 目錄為空。」

### 7-8. 空狀態設計

| 場景 | 顯示內容 |
|------|---------|
| tokenBudget 全為 null | 灰色虛線方框「對話額度明細尚未設定」+ 三步驟說明（執行 /context → 找數字 → 填入 data.json）+ 複製說明按鈕 |
| allProjects 掃描結果為空 | 「沒有找到任何專案設定檔。」+ 說明掃描範圍 |
| docs.files 為空 | 「目前沒有參考文件。」 |
| Skills 篩選無結果 | 「找不到符合「XXX」的 Skill。」 |

### 7-9. 更新指令的非工程師友善設計

```
要更新資料，請在終端機貼上以下指令：
[複製指令按鈕]
貼上後按 Enter，等指令跑完後重新整理這個頁面。
```

複製按鈕複製的內容：
```
cd "/Users/admin/Documents/Claude md 自我迭代專案/dashboard" && npm run scan
```

---

## 8. MVP 功能清單（明確邊界）

### 在 MVP 範圍內（v1 必做）

| 功能 | 具體內容 | 對應 UX |
|------|---------|---------|
| 健康燈號 + 原因說明 | 三色狀態，依 healthThresholds 計算，每個非正常狀態附上原因文字 | 打開即知狀態好壞，而且知道為什麼 |
| 終端機摘要輸出 | scan.js 執行後輸出 5-8 行，含狀態、原因、字數、Skills 數、最重章節 | 不開瀏覽器也能快速確認 |
| 資料新鮮度 | 狀態欄顯示「掃描於 X 分鐘前」；超過 24 小時觸發橫幅警告 | 知道數字是否可信 |
| 全域指令分析 | 字數 + 佔比百分比 + 進度條；sections 排行前 3 | 知道設定有多重 |
| 指令設定 Tab | 所有 CLAUDE.md 路徑列表；點擊展開前 100 字；「前往資料夾」按鈕；比全域大的標示 | 管理所有設定檔 |
| Skills Tab | 68 個統一清單 + 即時篩選框；Plugin 分組標題；每個 Skill 有摘要 | 快速找到特定 Skill |
| 參考文件 Tab | docs/ 列表 + 一句話摘要 + 大小 | 瞭解按需載入文件 |
| 空狀態設計 | 各 Tab 空狀態：主動說明 + 引導步驟 | 不讓使用者困惑 |
| 更新指令 | 白話說明 + 複製按鈕 | 知道如何更新資料 |

### 明確不在 MVP 範圍（v2 以後）

| 功能 | 原因 |
|------|------|
| 重複規則偵測 | 需要語意分析，複雜度高 |
| 規則使用頻率 | 需要 JSONL 解析 |
| Skills 使用頻率 | 同上 |
| 優化歷史追蹤 | 需要備份 diff 邏輯 |
| CLAUDE.md 編輯功能 | 使用者明確說「只看不編輯」，永遠不做 |
| 圖表視覺化 | 進度條 + 表格就夠清楚 |
| 即時監控/WebSocket | 個人工具不需要即時性，永遠不做 |
| macOS 系統通知 | v1 跳過，v2 可加（scan.js 執行後一行 osascript） |
| docs 內容全文展示 | v1 只顯示摘要 |
| ESLint + Prettier | v1 跳過 |

---

## 9. 開發階段 + 驗收標準

### Phase 1（已完成）：Discovery

目標：了解工具基礎設施的實際狀況。
產出：findings.md（三個關鍵發現）+ Round 4 壓力測試報告。
狀態：完成。

已確認環境資訊：
- Node.js v22.14.0（符合 `"node": ">=18"` 要求）
- create-vue 版本 3.21.1
- Vite 7.x（注意：Vite 7 與 Vite 5 有 breaking changes，以上 vite.config.ts 為 Vite 7 格式）
- Skills 總數 68 個（手動 25 + Plugin 43）
- allProjects 掃描結果 10 個 CLAUDE.md
- 全域 CLAUDE.md 實際字數 633 字
- openclaw/CLAUDE.md 字數 2441 字
- Git remote：`https://github.com/jerrycela/CMSI.git`

---

### Phase 2：腳本 + 靜態資料（目標：1.5-2 天）

#### 第零步（30 分鐘，動工前必做）

```bash
cd "/Users/admin/Documents/Claude md 自我迭代專案"
npm create vue@latest dashboard
# create-vue 自動建立 dashboard/ 目錄，不需要先 mkdir
```

安裝完依賴後，立刻修改 `dashboard/package.json`：

```json
{
  "type": "module",
  "engines": { "node": ">=18" },
  "scripts": {
    "scan": "node scan.js",
    "dev": "vite",
    "dashboard": "node scan.js && vite --open"
  }
}
```

建立 `dashboard/.gitignore`：
```
node_modules/
dist/
public/data.json
```

**第零步驗收標準：**
- `cat dashboard/package.json` 能看到 `"type": "module"`
- `node --version` 輸出 v18 以上
- `dashboard/.gitignore` 存在且含 `public/data.json`

#### 第一步（上午）：手寫 data.sample.json

不跑任何程式，用真實的本地資料手動填寫 `dashboard/public/data.sample.json`，照第 4 節的結構，用真實路徑和字數填寫，包含 `healthThresholds` 和 `descriptionSnippet` 欄位。
這份手工版本是腳本和前端的合約，完成後才開始寫程式碼。
這份檔案提交進 git（作為格式參考）。

快速取得真實 CLAUDE.md 清單：
```bash
find /Users/admin -name "CLAUDE.md" \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/.cursor/*" \
  -not -path "*/.vscode/*" \
  -not -path "*/.claude/plugins/*" \
  2>/dev/null
```

**第一步驗收標準：**
- `dashboard/public/data.sample.json` 存在
- 用 `node -e "JSON.parse(require('fs').readFileSync('dashboard/public/data.sample.json','utf8'))"` 確認 JSON 語法正確
- 包含 `healthThresholds` 物件
- 包含至少一個有 `descriptionSnippet` 的 docs 條目
- 包含至少一個有 `descriptionSnippet` 的 skills 條目

#### 第二步（下午）：寫 scan.js 腳本

按第 6 節的設計，建立 `dashboard/scan.js`，以骨架為起點，依序填入各掃描函式：

1. 讀取 `~/.claude/CLAUDE.md` → 填充 `globalConfig`（含 sections 解析）
2. 讀取 `~/.claude/docs/*.md` → 填充 `docs`（含 `descriptionSnippet`）
3. 掃描 `~/.claude/skills/`（三種型態）→ 填充 `skills.files`（manual 部分）
4. 掃描 `~/.claude/plugins/marketplaces/*/skills/` → 填充 `skills.files`（plugin 部分）
5. 遍歷 `/Users/admin` 找 CLAUDE.md（排除雜訊）→ 填充 `allProjects`
6. 保留現有 `tokenBudget`
7. 寫入固定的 `healthThresholds`
8. 輸出到 `public/data.json`
9. 呼叫 `printSummary(data)` 輸出終端機摘要
10. 正常結束 `process.exit(0)`，失敗 `process.exit(1)`

**第二步驗收標準：**
- `node dashboard/scan.js` 能成功執行，exit code 為 0
- 終端機輸出 5-8 行包含「CMSI 掃描完成」的摘要
- `dashboard/public/data.json` 被產生

#### 第三步（晚上）：驗證腳本輸出

對比 `data.sample.json` 和腳本產出 `data.json`：

**第三步驗���標準：**
- `data.json` 的 JSON 語法合法（`node -e "JSON.parse(require('fs').readFileSync('dashboard/public/data.json','utf8'))"` 無錯誤）
- `healthThresholds` 物件存在且有正確的六個欄位
- `skills.totalCount === 68`（而非 25）
- `allProjects.length === 10`（實際掃描到的數量）
- `globalConfig.wordCount` 約為 633
- 無非預期的雜訊路徑（`.cursor/extensions`、`node_modules` 等）混入 `allProjects`
- `docs.files` 含 `descriptionSnippet` 欄位

---

### Phase 3：Vue 3 前端（目標：2-3 天）

#### 第一個畫面（第一天，必須完成）

實作 `HealthBanner.vue`：顯示健康燈號 + 原因說明 + 資料新鮮度。
這是「最小可展示版本」，完成這個就代表整個管線通了。

具體顯示：
- 讀取 `meta.generatedAt` 計算資料新鮮度
- 讀取 `healthThresholds` + 各欄位數字，計算燈號顏色
- 非正常狀態時，計算並顯示原因說明文字（見第 7-4 節）
- 超過 24 小時：追加橫幅警告

**第一個畫面驗收標準：**
- `npm run dashboard` 能啟動，瀏覽器自動打開
- 頁面頂部顯示有顏色的健康燈號色塊
- 燈號右側顯示掃描時間（X 分鐘前）
- 若燈號非綠色，色塊下方顯示原因說明文字（不能只有顏色）
- 燈號顏色邏輯與 data.json 的 healthThresholds 一致

#### 後續畫面（第二天之後）

依優先級實作：

1. `SummaryCards.vue`：三個數字卡片（字數 + 百分比 + 進度條）
2. `SectionsRanking.vue`：最重區塊排行
3. `ProjectsTab.vue`：指令設定 Tab（路徑列表 + 展開 + 前往資料夾）
4. `SkillsTab.vue`：Skills Tab（統一清單 + 即時篩選 + 分組標題）
5. `DocsTab.vue`：參考文件 Tab（摘要 + metadata）
6. 空狀態設計（各 Tab）

**Phase 3 整體驗收標準：**
- 4 個 Tab 都能切換
- Skills Tab 的即時篩選能過濾到正確結果，輸入「vue」只顯示含 vue 的 Skill
- 「前往資料夾」按鈕點擊後，剪貼簿含有正確路徑，出現說明提示框
- tokenBudget 全為 null 時，顯示空狀態設計（灰色虛線方框 + 三步驟說明）
- allProjects 為空時，顯示「沒有找到任何專案設定檔。」
- 頁面在 Safari 和 Chrome 都能正常顯示
- `npm run scan` 執行後，終端機輸出 5-8 行摘要

---

## 10. 已知風險與應對

| 風險 | 發生機率 | 影響 | 應對策略 |
|------|---------|------|---------|
| Symlink 讀取失敗 | 中 | Skills 清單不完整 | `fs.lstatSync` 判斷，失敗時標注「無法讀取」而非崩潰 |
| 掃描發現新的雜訊路徑 | 高 | allProjects 含無意義項目 | EXCLUDE_PATHS 是陣列，隨時可加新排除項；首次執行後人工確認輸出 |
| data.json 太大 | 中 | 頁面載入慢 | content 超過 10,000 bytes 截斷，isTruncated 標注；實測最大約 500KB，本地讀取不到 50ms |
| scan.js 在某些目錄沒有讀取權限 | 中 | 掃描不完整 | try/catch 包每次 readdirSync，無權限就靜默跳過 |
| plugin skills 目錄結構改變 | 低 | 掃描遺漏 | 動態掃描 `marketplaces/*/skills/`，不硬編碼 plugin 名稱；`if (!fs.existsSync(skillsDir)) continue` 已處理沒有 skills/ 的 plugin |
| tokenBudget 被誤覆蓋 | 低 | 手動填寫的數字消失 | `preserveTokenBudget()` 確保保留 |
| healthThresholds 閾值設定不適合 | 低 | 燈號誤判 | 閾值集中在 data.json 裡，無需改程式碼即可調整 |
| 第一次開啟 Dashboard 看到紅色警告讓使用者困惑 | 高（目前 openclaw 確實觸發警告條件） | 使用者以為程式壞了 | 警告必須附帶原因說明，不能只有紅色色塊（見第 3 節、第 7-4 節的原因說明設計） |
| 工程師第一步用 `require()` 寫 scan.js | 高 | `ERR_REQUIRE_ESM` 錯誤 | 第零步明確加 `"type": "module"` 到 package.json，本計畫第 6-1 節已說明 |
| Vite 7 設定格式與舊教學不符 | 中 | vite.config.ts 設定錯誤 | 第 7-2 節已提供最小可用 Vite 7 格式 |

---

## 11. 快速參考頁

### 所有指令

| 指令 | 執行位置 | 作用 |
|------|---------|------|
| `npm create vue@latest dashboard` | `/Users/admin/Documents/Claude md 自我迭代專案/` | 建立 Vue 專案（Phase 2 第零步） |
| `npm install` | `dashboard/` | 安裝依賴 |
| `npm run scan` | `dashboard/` | 只跑掃描腳本，輸出 data.json + 終端機摘要 |
| `npm run dev` | `dashboard/` | 只啟動 Vite 開發伺服器（不掃描） |
| `npm run dashboard` | `dashboard/` | 掃描 + 啟動瀏覽器（日常使用） |

### 所有路徑

| 用途 | 路徑 |
|------|------|
| 專案根目錄 | `/Users/admin/Documents/Claude md 自我迭代專案/` |
| Vue 專案 | `/Users/admin/Documents/Claude md 自我迭代專案/dashboard/` |
| 掃描腳本 | `/Users/admin/Documents/Claude md 自我迭代專案/dashboard/scan.js` |
| 掃描輸出（不進版控） | `/Users/admin/Documents/Claude md 自我迭代專案/dashboard/public/data.json` |
| 手工範例（進版控） | `/Users/admin/Documents/Claude md 自我迭代專案/dashboard/public/data.sample.json` |
| TypeScript 型別 | `/Users/admin/Documents/Claude md 自我迭代專案/dashboard/src/types/data.ts` |
| 全域 CLAUDE.md | `/Users/admin/.claude/CLAUDE.md` |
| 手動 Skills 目錄 | `/Users/admin/.claude/skills/` |
| Plugin Skills 目錄 | `/Users/admin/.claude/plugins/marketplaces/` |
| 參考文件目錄 | `/Users/admin/.claude/docs/` |
| Git remote | `https://github.com/jerrycela/CMSI.git` |

### 所有元件檔案

| 元件 | 檔名 | 所屬 Tab |
|------|------|---------|
| Tab 列 + 路由切換 | `src/App.vue` | 全頁面 |
| 健康燈號 + 原因說明 | `src/components/HealthBanner.vue` | 總覽 |
| 三個數字卡片 | `src/components/SummaryCards.vue` | 總覽 |
| 最重區塊排行 | `src/components/SectionsRanking.vue` | 總覽 |
| 總覽 Tab 容器 | `src/components/OverviewTab.vue` | 總覽 |
| 指令設定 Tab | `src/components/ProjectsTab.vue` | 指令設定 |
| Skills Tab | `src/components/SkillsTab.vue` | Skills |
| 參考文件 Tab | `src/components/DocsTab.vue` | 參考文件 |
| data.json 型別定義 | `src/types/data.ts` | 全部 |

### 已知實際數值（Phase 1 查驗結果）

| 項目 | 數值 |
|------|------|
| 手動 Skills 數量 | 25 |
| Plugin Skills 數量 | 43 |
| Skills 總數 | 68 |
| Docs 檔案數量 | 10 個 .md 檔 |
| 全域 CLAUDE.md 字數 | 633 字 |
| allProjects 掃描數量 | 10 個 CLAUDE.md |
| 最大的專案設定 | openclaw 2,441 字 |
| openclaw / 全域比值 | 3.8 倍（觸發警告，必須有原因說明） |
| Node.js 版本 | v22.14.0 |
| create-vue 版本 | 3.21.1 |
| Vite 版本 | 7.x |

### data.json 頂層欄位速查

| 欄位 | 型別 | 說明 |
|------|------|------|
| `meta.generatedAt` | string (ISO 8601) | 掃描時間 |
| `meta.scanVersion` | string | 版本號 |
| `healthThresholds` | object | 健康判定閾值（6 個欄位） |
| `globalConfig` | object | 全域 CLAUDE.md 資料 |
| `globalConfig.sections` | array | 各章節字數分析 |
| `docs.files` | array | docs/ 目錄下的 .md 檔 |
| `skills.totalCount` | number | Skills 總數（應為 68） |
| `skills.files` | array | 所有 Skill 資料 |
| `allProjects` | array | 找到的所有 CLAUDE.md（排除全域） |
| `tokenBudget` | object | 手動填寫的對話額度明細 |

---

## 12. 本輪 Insight + 與 Round 7 差異總結

### 本輪 Insight 1：告警系統如果不解釋原因，會比沒有告警更糟糕

Round 8 用實際數值驗證後發現：第一次開啟 Dashboard，openclaw 的 2441 字就會觸發紅色警告。Round 7 計畫完全沒有討論這個場景。

解法不是把觸發條件改得更寬鬆（那是迴避問題），而是確保每個警告都附帶原因說明和下一步指引。紅色是對的，但紅色必須配合「因為 X，所以紅色，你應該做 Y」才有意義。這個設計原則已融入第 3 節的行動指引、第 7-4 節的 HealthBanner 設計。

### 本輪 Insight 2：終端機摘要是比瀏覽器更常被使用的入口

對於「偶爾健康檢查」的工具，使用者最可能的場景是在終端機工作時想順手確認一下。開瀏覽器、切分頁、等頁面載入的成本比看 8 行文字高得多。終端機摘要輸出讓這個工具的日常使用場景（快速確認）不需要開瀏覽器，Dashboard 變成「看詳情」的輔助工具。這個功能的成本是 scan.js 加一個 `printSummary()` 函式，約 30 行，已加入 MVP。

### 本輪 Insight 3：模組格式是第一行就會遇到的選擇，計畫必須說清楚

`const fs = require('fs')` 還是 `import fs from 'fs'`——這是工程師打開編輯器的第一行就要做的選擇，選錯了執行 `node scan.js` 會報 `ERR_REQUIRE_ESM`，訊息不直觀，新手可能花 30 分鐘卡在這裡。Round 9 在第 6-1 節明確指定 ESM，在第 9 節第零步驗收標準要求確認 `"type": "module"` 存在。

### 與 Round 7 的差異總結

| 面向 | Round 7 | Round 9 修正 | 來源 |
|------|---------|-------------|------|
| 健康燈號原因說明 | 只有燈號顏色 + 文字，無原因說明 | 每個非正常狀態必須附帶原因文字（「openclaw 設定比全域大 3.8 倍…」） | Round 8 關鍵發現一 |
| scan.js 模組格式 | 未明確指定（程式碼片段混用 require/import） | 明確指定 ESM，package.json 加 `"type": "module"`，第零步驗收標準要求確認 | Round 8 關鍵發現二 |
| 終端機摘要輸出 | 未列為功能 | 加入 MVP，第 3 節新增故事 6，第 6-11 節提供 `printSummary()` 完整程式碼，第 9 節 Phase 2/3 驗收標準包含終端機摘要 | Round 8 關鍵發現三 |
| Vue 專案初始化方式 | `mkdir dashboard && cd dashboard && npm create vue@latest .` | `npm create vue@latest dashboard`（避免空目錄問題） | Round 8 挑戰 3-A |
| vite.config.ts | 未提供範例（Vite 7 breaking changes 是真實卡關點） | 第 7-2 節提供 Vite 7 格式的最小可用範例 | Round 8 挑戰 3-B |
| 每個 Phase 的驗收標準 | 無 | 第 9 節每個步驟都有明確的「驗收標準」段落 | Round 9 精煉要求 |
| 快速參考頁 | 無 | 第 11 節：所有指令、路徑、元件、欄位的速查表 | Round 9 精煉要求 |
| 實際環境數值 | 部分用範例值（全域 597 字） | 全部更新為 Phase 1 查驗的實際值（全域 633 字、Vite 7.x 等） | Round 8 基準資料 |

### 哪些 Round 7 決定 Round 9 維持不動

- 技術架構（Vue 3 + scan.js + data.json 靜態讀取）：完全沿用
- 掃描邏輯（EXCLUDE_DIRS、EXCLUDE_PATHS、三種 skills 型態）：完全沿用
- tokenBudget 保留邏輯：完全沿用
- content 截斷邏輯（10,000 bytes 截斷，取前 8,000 字元）：完全沿用
- 4 個 Tab 結構（總覽、指令設定、Skills、參考文件）：完全沿用
- 三層畫面設計（健康燈號 → 數字卡片 → 區塊排行）：完全沿用
- 不做後端、不做資料庫、不做 WebSocket：維持不做

---

## 附錄：計畫演進脈絡（供歷史參考）

| 輪次 | 主要貢獻 |
|------|---------|
| Round 1 | 收斂過度工程化設計（Express + monorepo）為 Node 腳本 + Vite + JSON |
| Round 2 | 補上 data.json 結構需求、行動指引需求、掃描邊界需求 |
| Round 3 | 第一份完整可讀計畫，含 data.json 初稿和程式碼片段 |
| Round 4 | 實地查驗本機環境，發現 3 個高嚴重度問題（SCAN_ROOTS、skills 實際 68 個、Vue 位置未定義） |
| Round 5 | 整合 Round 4 所有修正，消除所有已知高嚴重度問題 |
| Round 6 | UX 審查，7 個問題（健康燈號、合併 Skills Tab、非工程師友善等） |
| Round 7 | 整合 Round 5 技術規格 + Round 6 UX 修正 |
| Round 8 | 魔鬼代言人壓力測試，發現三個修正點（警告原因說明、ESM 格式、終端機摘要） |
| Round 9（本文件）| 整合 Round 8 三個修正，加入驗收標準和快速參考頁，定版 |

---

*本文件由 Claude Sonnet 4.6 整合撰寫，2026-02-19*
*Round 9 是最終定版計畫。下一個輸出應為 `dashboard/scan.js` 的實際程式碼。*
