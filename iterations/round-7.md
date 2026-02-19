# Round 7 — 整合修正版完整計畫（UX 強化版）

文件日期：2026-02-19
文件角色：最終整合員（Claude Sonnet 4.6）
文件性質：**獨立完整計畫文件，整合 Round 5 技術規格與 Round 6 UX 修正**

> 本文件是目前唯一有效的計畫。前六輪的報告均已歸檔為歷史紀錄，閱讀本文件不需要參照任何其他文件。

---

## 1. 專案目標（一句話）

**讓我在 30 秒內看到自己電腦上所有指令設定的健康狀況、知道 68 個 Skills 各自是什麼，然後立刻知道下一步該做什麼——不需要自己看數字判斷，Dashboard 幫我判斷好了。**

---

## 2. 設計原則

### 技術原則（源自 Round 1-5）

- **單機、無後端**：所有資料由本地腳本掃描產生，瀏覽器直接讀取靜態 JSON，沒有伺服器、沒有資料庫
- **掃描一次，多次查閱**：跑一次 `npm run scan`，結果存進 data.json，前端直接讀取，不需要即時執行
- **真實路徑優於假設**：所有設定以本機實際發現的目錄為準，不依賴不確定存在的路徑
- **漸進式建置**：先讓管線通（掃描 → JSON → 畫面），再完善每個功能頁面

### UX 原則（源自 Round 6 整合）

- **顯示判斷，而非顯示數據**：Dashboard 先幫使用者判斷狀態好壞，給出結論（健康燈號），再呈現細節數字
- **視線路徑有設計**：使用者打開 Dashboard 的前 30 秒，視線依序落在：健康狀態 → 三個關鍵數字 → 需要注意的細節，不需要四處找資訊
- **語言對應使用者，不對應技術**：按鈕名稱對應使用者想做的事（「前往資料夾」），Tab 名稱對應使用者的問題（「指令設定」），不使用技術術語（tokens、symlink、CLAUDE.md）
- **空狀態是設計的一部分**：每個可能出現空資料的地方，都要主動說明「為什麼空」和「要怎麼填滿」，不能只顯示空白或 null
- **分類邏輯來自使用者的問題，不是資料的結構**：使用者找 Skill 時是「找跟 Vue 有關的」，不是「找手動安裝的」，因此 UI 分類不照資料結構走

---

## 3. 使用者故事 + 行動指引

這個 Dashboard 的使用者只有一個人，以第一人稱描述。

### 故事 1：我想立刻知道現在設定狀況好不好

「當我打開 Dashboard，我最先看到一個大色塊告訴我現在是『正常』、『注意』還是『警告』，不需要自己看數字判斷。」

**健康狀態判斷邏輯（Dashboard 自動計算）：**

| 狀態 | 顯示顏色 | 觸發條件 |
|------|---------|---------|
| 正常 | 綠色 | 所有數字在合理範圍內，資料在 24 小時內 |
| 注意 | 黃色 | 全域指令檔超過 6,000 字，或資料超過 24 小時未更新 |
| 警告 | 紅色 | 總字數超過 40,000 字（佔用 80% 以上的對話額度），或某個專案的設定比全域還大 |

| 看到什麼 | 做什麼 |
|---------|--------|
| 狀態：警告（紅色） | 立刻往下看三個數字卡片，找出哪個數字超標，點進對應 Tab 查看詳情 |
| 狀態：注意（黃色） | 不緊急但需要留意，可趁這次查看哪個區塊佔比最大 |
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
| 想找到這個資料夾 | 點「前往資料夾」按鈕，跟著提示框的步驟操作（自動複製路徑 + 說明圖） |

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

## 4. data.json 結構

> 整合 Round 4-5 的所有修正，加入 Round 6 所需的健康判定閾值欄位。

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
    "wordCount": 597,
    "byteSize": 6304,
    "estimatedTokens": 776,
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
| `healthThresholds` | 健康判定閾值集中在 JSON 裡，前端讀取後判斷燈號，不需要在程式碼裡硬編碼數字，未來要調整只改 JSON |
| `docs[].descriptionSnippet` | Round 6 新增：scan.js 讀取文件時自動取第一段文字（約 50-100 字），讓「參考文件」Tab 每個條目有意義 |
| `globalConfig.content` | 存完整原始文字，前端用等寬字體呈現，不需要後端 API |
| `isTruncated` | 布林值，前端用來判斷是否顯示「內容已截斷」提示 |
| `totalWordCount` | 截斷後 content 不能反映真實字數，需獨立欄位記錄 |
| `estimatedTokens` | 統一用 `wordCount × 1.3` 計算，腳本端計算，前端直接讀取 |
| `skills[].type` | `"symlink"` / `"directory"` / `"file"`，對應三種實際存在的型態（UI 上不顯示此欄位） |
| `skills[].path` | 永遠是 Claude Code 讀到的路徑（symlink 本身），非 target |
| `skills[].symlinkTarget` | 只有 type 為 symlink 時才有值，其他為 null（UI 上不顯示） |
| `skills[].source` | `"manual"` 或 `"plugin"`，UI 上顯示為小標籤（手動安裝 / Plugin 安裝） |
| `skills[].pluginName` | source 為 plugin 時填入，作為 Skills Tab 裡的分組標題 |
| `tokenBudget` | scan.js 初次掃描填 null；如果已有值，保留不覆寫 |
| 所有 `path` | 全部用絕對路徑，避免相對路徑在不同啟動方式下出錯 |

---

## 5. 架構圖 + 專案目錄結構

### 目錄結構

```
/Users/admin/Documents/Claude md 自我迭代專案/
├── dashboard/                   ← Vue 專案根目錄（npm run 都在這執行）
│   ├── src/
│   │   ├── App.vue              ← Tab 列 + 路由切換
│   │   ├── main.ts
│   │   ├── components/
│   │   │   ├── HealthBanner.vue     ← 健康狀態燈號 + 資料新鮮度（第一層）
│   │   │   ├── SummaryCards.vue     ← 三個數字卡片（第二層）
│   │   │   ├── SectionsRanking.vue  ← 最重區塊排行（第三層）
│   │   │   ├── OverviewTab.vue      ← 組合以上三個元件
│   │   │   ├── ProjectsTab.vue      ← 指令設定 Tab
│   │   │   ├── SkillsTab.vue        ← Skills Tab（合併，含即時篩選）
│   │   │   └── DocsTab.vue          ← 參考文件 Tab
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
│   ├── round-5.md              ← 技術規格（已歸檔）
│   ├── round-6.md              ← UX 審查（已歸檔）
│   └── round-7.md              ← 本文件（當前有效計畫）
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
│       │        ├─ 讀取 ~/.claude/docs/*.md（含描述摘要）         │
│       │        ├─ 掃描 ~/.claude/skills/（三種型態）             │
│       │        ├─ 掃描 ~/.claude/plugins/marketplaces/*/skills/ │
│       │        ├─ 遍歷 /Users/admin（排除雜訊）找 CLAUDE.md      │
│       │        ├─ 保留現有 tokenBudget（如已填寫）               │
│       │        ├─ 計算健康閾值（寫入 healthThresholds）          │
│       │        └─ 輸出 → public/data.json                      │
│       │                                                         │
│       └─→ [Vite Dev Server --open]                              │
│                │                                                │
│                └─→ 讀取 public/data.json（靜態資源）             │
│                         │                                       │
│                    [Vue 3 SPA]                                  │
│                    ├─ 計算健康燈號（比對 healthThresholds）      │
│                    ├─ 計算資料新鮮度（比對 meta.generatedAt）    │
│                    └─ 渲染 4 個 Tab                             │
│                         │                                       │
│                    瀏覽器自動開啟                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

資料流：本地檔案系統 → scan.js → data.json → Vue 3 → 瀏覽器
更新方式：手動跑 npm run scan，或重新跑 npm run dashboard
```

**沒有：**
- 後端伺服器
- 資料庫
- WebSocket
- Express
- API 端點
- 任何需要「保持運行」的程序

---

## 6. 前端設計規格

### 6-1. 技術選型

| 技術 | 決定 | 理由 |
|------|------|------|
| Vue 3 + Composition API | 使用 | 已明確 |
| TypeScript | 使用 | 為 data.json 定義型別，防止欄位拼錯 |
| Vite | 使用 | 開發伺服器 + 建置 |
| Pinia | 不用 | 資料是靜態的，一次載入不需要狀態管理 |
| Vue Router | 不用 | 單頁，用 Tab 切換不用路由 |
| Chart.js | 不用 | 用進度條 + 表格，比圖表更直接 |
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

### 6-3. Tab 結構（4 個 Tab）

| Tab 名稱 | 預設 | 內容 | 使用頻率 |
|---------|------|------|---------|
| 總覽 | 是 | 健康燈號 + 三個數字卡片 + sections 排行 | 每次開啟 |
| 指令設定 | 否 | 所有找到的 CLAUDE.md 列表 + 展開看內容 + 前往資料夾 | 定期檢查 |
| Skills | 否 | 68 個 Skills 統一清單 + 即時篩選框 + Plugin 分組標題 | 偶爾 |
| 參考文件 | 否 | docs/ 檔案列表 + 一句話摘要 + 大小 | 偶爾 |

**Tab 名稱選擇原則：** 對應使用者的問題，不使用技術術語。

### 6-4. 第一個畫面的三層設計

打開 Dashboard，畫面分三個層次，視線依序從上往下：

**第一層：健康燈號區（上方約 20% 高度）**

一個橫跨整個視窗的色塊（綠/黃/紅）：
- 左側大字：「現在狀態：正常」（或注意、警告）
- 右側小字：「掃描於 3 分鐘前」
- 若超過 24 小時，色塊下方追加橫幅警告：「資料已過時，建議重新掃描 — 在終端機貼上以下指令：[複製按鈕]」

健康狀態計算邏輯（Vue 元件裡，讀取 healthThresholds 後計算）：

```
若 totalWordCount > healthThresholds.totalWordCountAlert
  或 某個 project.wordCount > globalConfig.wordCount
  → 狀態：警告（紅）

否則若 globalConfig.wordCount > healthThresholds.globalWordCountWarning
  或 資料超過 healthThresholds.dataStaleHoursWarning 小時
  → 狀態：注意（黃）

否則
  → 狀態：正常（綠）
```

**第二層：三個數字卡片（中間約 50% 高度）**

三個並排卡片，每個卡片有大數字 + 說明文字：

- 卡片 1：「全域指令檔」
  - 大數字：字數（例如「5,600 字」）
  - 副文字：「佔對話額度約 14%」
  - 進度條：視覺化佔比（顏色對應健康狀態）

- 卡片 2：「已安裝 Skills」
  - 大數字：68
  - 副文字：「手動 25 個 + Plugin 43 個」

- 卡片 3：「指令設定檔」
  - 大數字：找到幾個 CLAUDE.md
  - 副文字：「最大的：openclaw（2,441 字）」

**第三層：最重區塊排行（下方約 30% 高度）**

全域指令檔裡最大的三個章節，格式：
- 「第 1 名：Skill 路由表 — 1,200 字（佔全域指令檔 21%）」
- 每個項目旁有 tooltip（滑鼠移上去顯示：「這個區塊很大，考慮移到參考文件，改為按需載入」）

### 6-5. Skills Tab 設計

- 頁面頂部：即時篩選框（使用者輸入關鍵字，即時過濾清單，不需要按 Enter）
- 所有 68 個 Skills 在同一個列表
- Plugin 來源的 Skills 用分組標題（例如「superpowers plugin」）區隔
- 每個 Skill 卡片顯示：
  - 名稱（加粗）
  - 一句話摘要（`descriptionSnippet`）
  - 字數
  - 來源標籤（手動安裝 / Plugin 安裝）
- 不顯示 `type` 欄位（symlink/directory/file 是技術細節，使用者不需要知道）

### 6-6. 指令設定 Tab 設計（原 CLAUDE.md 普查）

- 列表顯示所有找到的 CLAUDE.md，每個條目：
  - 專案名稱（從路徑擷取）
  - 字數 + 最後更新時間
  - 「前往資料夾」按鈕：點擊後自動複製父目錄路徑到剪貼簿，出現提示框「路徑已複製！在 Finder 選單列點『前往 > 前往檔案夾』，貼上即可。」
- 點擊條目後展開顯示前 100 字內容（等寬字體），標示「部分內容，共 N 字」
- 「展開全部」按鈕顯示完整 `content`
- 若 `isTruncated: true`，底部加「內容已截斷，完整版有 N 字」

### 6-7. 參考文件 Tab 設計（原 Docs）

每個條目顯示：
- 檔案名稱
- 一句話用途（`descriptionSnippet`）
- 字數 + 最後更新時間

不顯示內容（v2 再加）。

若 docs/ 為空，顯示空狀態：「目前沒有參考文件。docs/ 目錄為空。」

### 6-8. 空狀態設計（各 Tab 的空/null 場景）

| 場景 | 顯示內容 |
|------|---------|
| tokenBudget 全為 null | 灰色虛線方框：「對話額度明細尚未設定」+ 三步驟說明（執行 /context → 找數字 → 填入 data.json）+ 複製說明按鈕 |
| allProjects 掃描結果為空 | 「沒有找到任何專案設定檔。」+ 說明掃描範圍 |
| docs/ 目錄為空 | 「目前沒有參考文件。」 |
| Skills 篩選無結果 | 「找不到符合「XXX」的 Skill。」 |

### 6-9. 更新指令的非工程師友善設計

不直接顯示 shell 指令，改為：

```
要更新資料，請在終端機貼上以下指令：
[複製指令按鈕]
貼上後按 Enter，等指令跑完後重新整理這個頁面。
```

（複製按鈕複製的內容：`cd "/Users/admin/Documents/Claude md 自我迭代專案/dashboard" && npm run scan`）

---

## 7. scan.js 設計

### 7-1. 掃描策略

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
```

### 7-2. CLAUDE.md 掃描邏輯

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

### 7-3. Skills 掃描邏輯（三種型態）

```javascript
// 每個 skill 可能是：
// 1. symlink（指向目錄）
// 2. 普通目錄
// 3. 單一 .md 檔案

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

### 7-4. 描述摘要擷取邏輯（Round 6 新增）

```javascript
// 從文件或 Skill 的內容取前 100 字作為 descriptionSnippet
// 去除 markdown 標記（#、**、-、`）後取純文字
// 適用於 docs[].descriptionSnippet 和 skills[].descriptionSnippet

function extractDescriptionSnippet(rawContent) {
  const cleaned = rawContent
    .replace(/^#+\s+/gm, '')      // 移除標題 #
    .replace(/\*\*/g, '')          // 移除粗體 **
    .replace(/`[^`]+`/g, '')       // 移除行內程式碼 `code`
    .replace(/^[-*]\s+/gm, '')     // 移除列表符號 -、*
    .replace(/\n+/g, ' ')          // 換行變空格
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.slice(0, 30).join(' ') + (words.length > 30 ? '...' : '');
}
```

### 7-5. 健康閾值寫入邏輯

```javascript
// healthThresholds 是固定值，每次掃描都寫入（不需要保留）
// 未來要調整閾值只需改這裡，前端不用改

const HEALTH_THRESHOLDS = {
  _note: "健康狀態判定閾值。前端依此計算燈號，不需要硬編碼在元件裡。",
  globalWordCountWarning: 6000,
  globalWordCountAlert: 8000,
  totalWordCountWarning: 32000,
  totalWordCountAlert: 40000,
  dataStaleHoursWarning: 24,
  dataStaleHoursAlert: 72
};
```

### 7-6. tokenBudget 保留邏輯

```javascript
// scan.js 執行時：
// 1. 先讀取現有的 data.json（如果存在）
// 2. 如果 tokenBudget 有非 null 的值，保留它
// 3. 重新生成所有其他欄位

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

### 7-7. content 截斷邏輯

```javascript
// 截斷條件：byteSize > 10,000 bytes
// 截斷方式：取前 8,000 字元（UTF-16，對中英文都安全）

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

### 7-8. token 估算公式

```javascript
// 統一公式，全腳本一致，前端不用再計算
function estimateTokens(wordCount) {
  return Math.round(wordCount * 1.3);
}
```

### 7-9. package.json scripts

```json
{
  "scripts": {
    "scan": "node scan.js",
    "dev": "vite",
    "dashboard": "node scan.js && vite --open"
  }
}
```

`&&` 語意是「scan.js 成功後才啟動 vite」。scan.js 需要在正常結束時顯式 `process.exit(0)`，失敗時 `process.exit(1)`，確保 vite 只在掃描成功後啟動。

---

## 8. MVP 功能清單（明確邊界）

### 在 MVP 範圍內（v1 必做）

| 功能 | 具體內容 | 對應 UX |
|------|---------|---------|
| 健康燈號 | 三色狀態（正常/注意/警告），依 healthThresholds 計算 | 打開即知狀態好壞 |
| 資料新鮮度 | 狀態欄顯示「掃描於 X 分鐘前」；超過 24 小時觸發橫幅警告 | 知道數字是否可信 |
| 全域指令分析 | 字數 + 佔比百分比 + 進度條；sections 排行前 3（含排名視覺） | 知道設定有多重 |
| 指令設定 Tab | 所有 CLAUDE.md 路徑列表；點擊展開前 100 字；「前往資料夾」按鈕 | 管理所有設定檔 |
| Skills Tab | 68 個統一清單 + 即時篩選框；Plugin 用分組標題；每個 Skill 有摘要 | 快速找到特定 Skill |
| 參考文件 Tab | docs/ 列表 + 一句話摘要 + 大小 | 瞭解按需載入文件 |
| 空狀態設計 | tokenBudget null / 各 Tab 空狀態：主動說明 + 引導步驟 | 不讓使用者困惑 |
| 更新指令 | 白話說明 + 複製按鈕（非工程師友善） | 知道如何更新資料 |

### 明確不在 MVP 範圍（v2 以後）

| 功能 | 原因 |
|------|------|
| 規則使用頻率 | 需要 JSONL 解析，複雜度高 |
| Skills 使用頻率 | 同上 |
| 優化歷史追蹤 | 需要備份 diff 邏輯 |
| CLAUDE.md 編輯功能 | 使用者明確說「只看不編輯」，永遠不做 |
| 圖表視覺化 | 進度條 + 表格就夠清楚 |
| 即時監控/WebSocket | 個人工具不需要即時性，永遠不做 |
| ESLint + Prettier | v1 跳過，v2 加回來 |
| docs 內容全文展示 | v1 只顯示摘要 |

---

## 9. 開發階段

**原則：三個階段，第一階段必須在一天內能展示。Phase 1 已完成。**

---

### Phase 1（已完成）：Discovery

目標：了解工具基礎設施的實際狀況。
產出：findings.md（三個關鍵發現）+ Round 4 壓力測試報告。
狀態：完成。

追加確認（Round 4 已查驗）：
- rules/ 目錄為空，無殘留問題
- Node.js v22.14.0 符合 `"node": ">=18"` 要求
- Git repo 存在，remote 為 `https://github.com/jerrycela/CMSI.git`
- .gitignore 尚不存在，需在 Phase 2 建立

---

### Phase 2：腳本 + 靜態資料（目標：1.5-2 天）

#### 第零步（30 分鐘，動工前必做）

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

#### 第一步（上午）：手寫 data.sample.json

不跑任何程式，用真實的本地資料手動填寫一份 `public/data.sample.json`。
參照本文件第 4 節的結構，用真實的路徑和字數填寫，並加入 `healthThresholds` 和 `docs[].descriptionSnippet`。
這份手工版本是腳本和前端的合約，完成後才開始寫程式碼。
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

實作第 7 節描述的掃描邏輯：
1. 讀取 `~/.claude/CLAUDE.md` → 填充 `globalConfig`（含 sections 解析）
2. 讀取 `~/.claude/docs/*.md` → 填充 `docs`（含 `descriptionSnippet`）
3. 掃描 `~/.claude/skills/`（三種型態）→ 填充 `skills.files`（manual 部分）
4. 掃描 `~/.claude/plugins/marketplaces/*/skills/` → 填充 `skills.files`（plugin 部分）
5. 遍歷 `/Users/admin` 找 CLAUDE.md（排除雜訊）→ 填充 `allProjects`
6. 保留現有 `tokenBudget`（如已填寫）
7. 寫入固定的 `healthThresholds`
8. 輸出到 `public/data.json`，記錄 `meta.generatedAt`
9. 正常結束 `process.exit(0)`，失敗 `process.exit(1)`

#### 第三步（晚上）：驗證腳本輸出

對比手工版 `data.sample.json` 和腳本產出 `data.json`，確認：
- 結構一致，`healthThresholds` 和 `descriptionSnippet` 欄位存在
- `allProjects` 包含 openclaw、openclawfortest、Cursor 下的專案
- `skills.totalCount` 為 68（而非 25）
- 無非預期的雜訊路徑混入 `allProjects`

---

### Phase 3：Vue 3 前端（目標：2-3 天）

#### 第一個畫面（第一天，必須完成）

實作 `HealthBanner.vue`：顯示健康燈號 + 資料新鮮度。
這是「最小可展示版本」，完成這個就代表整個管線通了。

具體顯示：
- 讀取 `meta.generatedAt` 計算資料新鮮度
- 讀取 `healthThresholds` + 各欄位數字，計算燈號顏色
- 顯示「現在狀態：正常 / 注意 / 警告」（對應顏色）
- 超過 24 小時：追加橫幅警告

#### 後續畫面（第二天之後）

依優先級實作：

1. `SummaryCards.vue`：三個數字卡片（字數 + 百分比 + 進度條）
2. `SectionsRanking.vue`：最重區塊排行（含排名視覺）
3. `ProjectsTab.vue`：指令設定 Tab（路徑列表 + 展開 + 前往資料夾 UX）
4. `SkillsTab.vue`：Skills Tab（合併 + 即時篩選 + 分組標題）
5. `DocsTab.vue`：參考文件 Tab（摘要 + metadata）
6. 空狀態設計（各 Tab）

---

## 10. 已知風險與應對

| 風險 | 發生機率 | 影響 | 應對策略 |
|------|---------|------|---------|
| Symlink 讀取失敗 | 中 | Skills 清單不完整 | `fs.lstatSync` 判斷，失敗時標注「無法讀取」而非崩潰 |
| 掃描發現新的雜訊路徑 | 高 | allProjects 含無意義項目 | EXCLUDE_PATHS 是陣列，隨時可加新排除項；首次執行後人工確認輸出 |
| data.json 太大 | 中 | 頁面載入慢 | content 超過 10,000 bytes 截斷，isTruncated 標注 |
| scan.js 在某些目錄沒有讀取權限 | 中 | 掃描不完整 | try/catch 包每次 readdirSync，無權限就靜默跳過 |
| plugin skills 目錄結構改變 | 低 | 掃描遺漏 | 使用 glob 動態掃描 `marketplaces/*/skills/`，不硬編碼 plugin 名稱 |
| tokenBudget 被誤覆蓋 | 低 | 手動填寫的數字消失 | preserveTokenBudget() 函式確保保留，v2 補單元測試 |
| Node.js 版本相容問題 | 低 | 無法執行 | package.json 加 `"engines": {"node": ">=18"}`，已確認 v22.14.0 |
| healthThresholds 閾值設定不適合 | 低 | 燈號誤判 | 閾值集中在 data.json 裡，無需改程式碼即可調整 |
| Skills 篩選效能 | 低 | 篩選延遲 | 68 個項目純前端過濾，Vue computed 處理綽綽有餘 |
| descriptionSnippet 擷取品質差 | 低 | 摘要不準確 | 擷取邏輯取前 30 個詞，品質依賴文件本身寫法，可接受 |

---

## 11. 本輪 Insight + 與 Round 5 差異總結

### 本輪 Insight 1：「顯示判斷」比「顯示數據」更有價值

Round 5 的計畫是一個完整的技術規格，但它的 UX 假設是「使用者看到數字後自己判斷好壞」。Round 6 點出了這個假設的問題：好的 Dashboard 設計的核心工作是**代替使用者做判斷**，把結論呈現出來，而不是把原始數據給使用者自己算。

健康燈號系統是這個洞察的實現：不是顯示「5,600 字」，而是先給「正常」的結論，讓使用者在 0.5 秒內知道「現在不需要擔心」。

### 本輪 Insight 2：UI 結構不應照著資料結構走

Skills 按安裝來源分成兩個 Tab（手動/Plugin），是因為資料結構裡有 `source` 欄位。但使用者找 Skill 時的問題是「找跟 Vue 有關的」，不是「找手動安裝的」。資料結構有 `source` 欄位是合理的（用來顯示小標籤），但 UI 不必照資料結構來分 Tab。

合併後加即時篩選，是更符合使用者心智模型的設計。

### 本輪 Insight 3：空狀態設計是被低估的 UX 場景

計畫裡最薄弱的 UX 場景是「第一次打開 Dashboard，tokenBudget 全是 null」。這個場景使用者一定會遇到，但計畫的處理方式是「顯示 null」，使用者會以為是程式出錯。空狀態設計（主動說明「為什麼空」和「怎麼填滿」）是 UX 基本功，適用於所有可能出現空資料的地方。

### 與 Round 5 的差異總結

| 面向 | Round 5 | Round 7 整合修正 | 修正來源 |
|------|---------|----------------|---------|
| 健康狀態 | 使用者看數字自己判斷（tooltip 提示） | 系統先判斷，給整體燈號（顏色 + 文字） | Round 6 H2 |
| Token 單位 | 顯示 tokens 數字 | 字數 + 佔比百分比 + 進度條 | Round 6 H1 |
| 路徑操作 | 「複製路徑」按鈕 + 旁邊文字說明 | 「前往資料夾」按鈕 + 點後提示框引導 | Round 6 H3 |
| Skills Tab 數量 | 2 個 Tab（手動/Plugin） | 1 個 Tab（合併）+ 即時篩選框 | Round 6 H4、M1 |
| Skills 搜尋 | v2 範圍 | v1 必做（即時篩選） | Round 6 H4 |
| Docs Tab 名稱 | 「Docs」 | 「參考文件」 | Round 6 Tab 結構修訂 |
| Docs Tab 內容 | 只有 metadata（名稱 + 大小） | 加一句話摘要（descriptionSnippet） | Round 6 M2 |
| CLAUDE.md 普查 Tab 名稱 | 「CLAUDE.md 普查」 | 「指令設定」 | Round 6 Tab 結構修訂 |
| tokenBudget null 處理 | 顯示 null | 空狀態設計（說明 + 三步驟引導 + 複製按鈕） | Round 6 M3 |
| 資料過時警告 | 頁首靜態文字 | 橫幅警告（醒目），超過 24 小時才觸發 | Round 6 M4 |
| CLAUDE.md 預覽預設字數 | 前 300 字 | 前 100 字，明確標示「部分內容，共 N 字」 | Round 6 M5 |
| symlink 顯示 | UI 顯示 symlink 型態 | 不顯示（技術細節，使用者不需要知道） | Round 6 L2 |
| 更新指令 | 直接顯示 shell 指令 | 白話說明 + 複製按鈕 | Round 6 L3 |
| 第一屏設計 | 未明確描述視線路徑 | 三層結構：健康燈號 → 三個數字卡片 → 區塊排行 | Round 6 第 4 節 |
| data.json 新欄位 | 無 healthThresholds | 新增 healthThresholds 物件（集中管理閾值） | Round 6 整合需求 |
| scan.js 新功能 | 無 descriptionSnippet 擷取 | 新增 extractDescriptionSnippet() ��式 | Round 6 M2 整合需求 |
| Vue 元件結構 | App + 4 個 Tab 元件 | 新增 HealthBanner、SummaryCards、SectionsRanking 獨立元件 | Round 6 三層設計 |
| Tab 總數 | 5 個 Tab | 4 個 Tab（Skills 合併後減少一個） | Round 6 H4、M1 |

### 哪些 Round 5 決定 Round 7 維持不動

- 技術架構（Vue 3、scan.js、data.json 靜態讀取方式）：完全沿用
- 掃描邏輯（EXCLUDE_DIRS、EXCLUDE_PATHS、三種 skills 型態）：完全沿用
- tokenBudget 保留邏輯：完全沿用
- content 截斷邏輯（10,000 bytes 截斷，取前 8,000 字元）：完全沿用
- 開發階段結構（Phase 1-3）：完全沿用
- 不做後端、不做資料庫、不做 WebSocket：維持不做

---

## 附錄 A：計畫演進脈絡（供歷史參考）

| 輪次 | 主要貢獻 |
|------|---------|
| Round 1 | 把 Express + monorepo 的過度工程化計畫收斂到 Node 腳本 + Vite + JSON |
| Round 2 | 審查 Round 1，補上 data.json 結構需求、行動指引需求、掃描邊界需求 |
| Round 3 | 整合 Round 2 建議，產出第一份「完整可讀計畫」，含 data.json 初稿和具體程式碼片段 |
| Round 4 | 實地查驗本機環境，發現 3 個高嚴重度問題（SCAN_ROOTS 不存在、skills 實際 68 個、Vue 專案位置未定義）和多個中低嚴重度問題 |
| Round 5 | 整合 Round 4 所有修正，產出修正版完整計畫，消除所有已知高嚴重度問題 |
| Round 6 | UX 審查，發現 7 個需修正的 UX 問題（4 個高嚴重度、3 個中嚴重度），提出健康燈號、合併 Skills Tab、非工程師友善改善等建議 |
| Round 7（本文件）| 整合 Round 5 技術規格 + Round 6 UX 修正，產出最終整合版完整計畫 |

---

## 附錄 B：本文件的邊界

本文件覆蓋：v1 MVP 的所有設計決策、技術規格和 UX 規格。

本文件不覆蓋：
- v2 功能（JSONL 解析、規則使用頻率、Skills 使用頻率、docs 全文展示）
- 部署/發布（這是個人本地工具，無需部署）
- 協作工作流程（單一使用者）

---

*本文件由 Claude Sonnet 4.6 整合撰寫，2026-02-19*
*Round 7 是最終整合版計畫。下一個輸出必須是 dashboard/scan.js 的程式碼。*
