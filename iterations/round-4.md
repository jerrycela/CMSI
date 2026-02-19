# Round 4 — 壓力測試報告

審查日期：2026-02-19
審查角色：壓力測試員（Sonnet 4.6）
審查對象：Round 3 改進版完整計畫（B 部分）
方法：實地查驗本機檔案系統，以六個角度逐一尋找漏洞

---

## 重要前言

本輪採用「實際動手查」的壓力測試方法，而非純粹邏輯推理。每個發現都有真實的檔案系統數據作為依據。這讓 Round 4 與前三輪有本質區別：前三輪的問題是「假設性問題」，本輪的問題是「實際存在的問題」。

---

## 角度 1：scan.js 腳本的邊界情況

### 1-1. SCAN_ROOTS 有兩個目錄根本不存在（高嚴重度）

Round 3 計畫的 SCAN_ROOTS：
```javascript
const SCAN_ROOTS = [
  '/Users/admin/Documents',
  '/Users/admin/Developer',
  '/Users/admin/Projects'
];
```

實際查驗結果：
- `/Users/admin/Documents` — 存在，有 3 個專案 CLAUDE.md
- `/Users/admin/Developer` — **不存在**
- `/Users/admin/Projects` — **不存在**

Round 3 在風險表裡提到「找不到目錄就略過，不影響整體執行」，這句話技術上成立，但問題更根本：**使用者真正的專案 CLAUDE.md 有一半不在 SCAN_ROOTS 裡**。

實際上有 CLAUDE.md 但被遺漏的目錄：
- `/Users/admin/openclaw/` — 有最大的 CLAUDE.md（17,762 bytes），完全遺漏
- `/Users/admin/openclawfortest/` — 10,412 bytes，完全遺漏
- `/Users/admin/Cursor/` — 有 2 個 CLAUDE.md，完全遺漏
- `/Users/admin/Downloads/` — 有 1 個，完全遺漏

**修正建議：** 把 SCAN_ROOTS 改為更廣的根目錄，從 `~` 開始掃，但用精確的排除清單代替不存在的根目錄硬編碼。

```javascript
const SCAN_ROOTS = [
  '/Users/admin'  // 從 home 開始掃，靠 EXCLUDE 過濾雜訊
];
```

---

### 1-2. EXCLUDE_DIRS 遺漏大量雜訊來源（高嚴重度）

Round 3 的 EXCLUDE_DIRS：
```javascript
const EXCLUDE_DIRS = ['node_modules', '.git', 'Library', '.Trash'];
```

實際查驗結果：系統中有大量 IDE 擴充和 plugin 緩存裡的 CLAUDE.md，如果不排除，allProjects 會塞滿無意義的條目：

| 雜訊來源 | 數量 | 舉例 |
|---------|------|------|
| `.cursor/extensions` | 6 個 | claude-dev 擴充各版本 |
| `.vscode/extensions` | 6 個 | 同上 |
| `.claude/plugins/cache` | 7 個 | plugin 下載緩存 |
| `.claude/plugins/marketplaces` | 4 個 | plugin 來源倉庫 |
| **雜訊合計** | **23 個** | 佔全部 33 個的 70% |

使用者真正的專案 CLAUDE.md 只有 9 個（不含全域），但如果不排除這些雜訊，掃描結果裡有 70% 是沒用的。

**修正建議：** EXCLUDE_DIRS 需要補充：

```javascript
const EXCLUDE_DIRS = [
  'node_modules', '.git', 'Library', '.Trash',
  '.cursor', '.vscode',        // IDE 擴充目錄
  'extensions',                 // .cursor/extensions, .vscode/extensions
  'cache'                       // .claude/plugins/cache
];

// 或更精確，用完整路徑排除
const EXCLUDE_PATHS = [
  '/Users/admin/.cursor',
  '/Users/admin/.vscode',
  '/Users/admin/.claude/plugins/cache',
  '/Users/admin/.claude/plugins/marketplaces'
];
```

---

### 1-3. Skills 掃描目錄的型態比計畫複雜三倍（中嚴重度）

Round 3 的假設：skills 都是 symlink，統一指向 `.agents/skills/`。

實際的 `.claude/skills/` 有三種截然不同的型態：

| 型態 | 數量 | 代表 | scan.js 的處理方式 |
|------|------|------|------------------|
| symlink（指向目錄） | 22 個 | `pdf -> ../../.agents/skills/pdf` | 需要 `fs.lstatSync` 判斷，再 `fs.readlinkSync` 解析目標 |
| 普通目錄 | 1 個 | `excalidraw-mcp/` | 直接讀取 SKILL.md |
| 單一 .md 檔案 | 2 個 | `fetch-slack-messages.md`, `weekly-report-auto.md` | 直接讀取該 .md 的 YAML frontmatter |

Round 3 的計畫完全沒提到後兩種型態。scan.js 如果只處理 symlink，會遺漏這 3 個 skills（12%）。

另外，Round 3 在 data.json 範例裡，`path` 寫的是 `.agents/skills/vueuse-functions`，但正確的掃描路徑是 `.claude/skills/vueuse-functions`（symlink 本身），target 才是 `.agents/skills/vueuse-functions`。

**修正建議：** scan.js 的 skills 掃描邏輯需要處理三種型態，並修正 `path` vs `symlinkTarget` 的定義：
- `path`：`.claude/skills/` 下的項目路徑（symlink 本身）
- `symlinkTarget`：symlink 解析後的絕對路徑（對普通目錄/檔案此欄位為 null）

---

### 1-4. Plugins 裡的 Skills 完全被遺漏（高嚴重度）

這是本輪最大的發現。

Round 3 假設 skills 全部在 `.claude/skills/`（25 個）。但實際上，使用者安裝了 8 個 plugins，這些 plugins 各自包含大量 skills：

| Plugin | Skills 數量 |
|--------|------------|
| `everything-claude-code` | 28 個 |
| `superpowers-dev` | 14 個 |
| `planning-with-files` | 1 個 |
| **合計** | **43 個** |

加上 `.claude/skills/` 的 25 個，實際 skills 總數是 **68 個，而不是 25 個**。

Round 3 的使用者故事 3（「我想知道裝了哪些 Skills」）如果只掃 `.claude/skills/`，呈現出來的數字是 25，但實際有 68 個。這個誤差會讓 Dashboard 的核心功能產生根本性的錯誤資訊。

**修正建議：** skills 掃描需要涵蓋兩個來源：
1. `.claude/skills/`：使用者手動安裝或建立的 skills（含三種型態）
2. `.claude/plugins/marketplaces/*/skills/`：透過 plugin 安裝的 skills

可以用 `installed_plugins.json` 作為 plugin skills 的索引來源，因為它記錄了每個 plugin 的安裝路徑和版本。

---

### 1-5. 截斷邏輯的「字」的單位不明確（低嚴重度）

Round 3 說 content 截斷到「前 5,000 字」，但 JavaScript 裡「字」可能是：
- `content.substring(0, 5000)`：按 UTF-16 碼元計算，中文每字 1 個碼元，沒問題
- `content.split(' ').slice(0, 5000).join(' ')`：按空白分隔的詞，中文沒有空白，整段不截斷

實際上目前最大的 CLAUDE.md 只有 2,441 個字（openclaw），不會觸發截斷。但建議統一用字節數（bytes）而非「字」來定義截斷點，例如截斷到 10,000 bytes（約 3,000-5,000 中文字），更直覺且不依賴語言。

**修正建議：** 改為 `byteSize > 10000 ? content.substring(0, 8000) : content`，同時加入 `isTruncated: boolean` 欄位。

---

## 角度 2：data.json 結構的完整性

### 2-1. 缺少 `isTruncated` 欄位（中嚴重度）

Round 3 說 content 截斷到 5,000 字，但 data.json 結構裡沒有標記「這個 content 是被截斷的」。前端展示時需要知道：

- 如果 `isTruncated: false`，展示完整內容
- 如果 `isTruncated: true`，在底部加「內容已截斷，完整版有 X 字」的提示

沒有這個欄位，前端無法判斷是否需要顯示提示。

**修正建議：** 在每個有 `content` 欄位的項目中加入：
```json
"isTruncated": false,
"totalWordCount": 2441
```

---

### 2-2. Skills 的 `path` 欄位定義有誤（中嚴重度）

Round 3 的 data.json 範例：
```json
{
  "name": "vueuse-functions",
  "path": "/Users/admin/.agents/skills/vueuse-functions",
  "isSymlink": true,
  "symlinkTarget": "/Users/admin/.agents/skills/vueuse-functions"
}
```

問題：`path` 和 `symlinkTarget` 值完全相同，這沒有意義。

正確定義：
- `path`：Claude Code 讀取的 skill 路徑，即 `/Users/admin/.claude/skills/vueuse-functions`（symlink 本身的位置）
- `symlinkTarget`：symlink 指向的實際目標，即 `/Users/admin/.agents/skills/vueuse-functions`

**修正建議：**
```json
{
  "name": "vueuse-functions",
  "path": "/Users/admin/.claude/skills/vueuse-functions",
  "type": "symlink",
  "symlinkTarget": "/Users/admin/.agents/skills/vueuse-functions",
  ...
}
```

並加入 `type` 欄位：`"symlink"` / `"directory"` / `"file"`，對應三種 skill 型態。

---

### 2-3. Skills 結構需要區分來源（中嚴重度）

發現 plugins 的 43 個 skills 完全沒在計畫中，`skills` 區塊的結構需要反映兩個來源：

```json
"skills": {
  "totalCount": 68,
  "sources": {
    "manual": {
      "path": "/Users/admin/.claude/skills/",
      "count": 25,
      "files": [...]
    },
    "plugins": {
      "count": 43,
      "files": [...]
    }
  }
}
```

或更簡單，在每個 skill 項目加 `source: "manual" | "plugin"`，以及 `pluginName: string | null`。

---

### 2-4. tokenBudget 是手動填寫的估算值，但沒有說明如何更新（低嚴重度）

Round 3 的設計說明指出 `tokenBudget` 是「手動填寫的估算值（來自 /context 指令輸出）」，但：

1. data.json 是由 scan.js 自動產生的
2. scan.js 沒辦法自動取得 `/context` 的輸出（那是 Claude Code 的內部指令）
3. 每次跑 `npm run scan` 都會覆寫 data.json，手動填的 tokenBudget 會被清空

**修正建議：** 兩個選項：
- 選項 A：tokenBudget 欄位的值 scan.js 只填 `null`，說明文字改為「需要在跑 scan 後手動更新此區塊」
- 選項 B：scan.js 讀取現有 data.json 的 tokenBudget，如果存在就保留，不覆寫

選項 B 更好，因為它讓「手動更新的數字」在重新掃描後仍然保留。

---

### 2-5. `docs` 區塊沒有 `content` 欄位，但前端可能需要（低嚴重度）

Round 3 的 `docs.files` 只有 metadata（name, path, wordCount, byteSize, estimatedTokens），沒有 `content`。

但使用者故事 2（「我想看所有 CLAUDE.md 的內容」）只針對 allProjects，不針對 docs/。

如果使用者想在 Dashboard 上看某個 docs/planning.md 的內容，就做不到。這在 v1 可以接受，但需要明確說「docs 只顯示 metadata，不顯示內容」。

---

## 角度 3：前端 UX 的實際體驗

### 3-1. 使用者看到路徑後不知道怎麼開啟檔案（高嚴重度，UX）

Round 3 的行動指引：「看到忘記的 CLAUDE.md → 決定保留或刪除」

但使用者是非工程師背景，看到路徑 `/Users/admin/openclaw/CLAUDE.md` 後：
- 不知道怎麼在 Finder 打開
- 不知道這個「openclaw」資料夾在哪裡
- 更不知道怎麼刪除它

純靜態 Vue 做不到「Reveal in Finder」（需要 Electron 或後端），但可以提供：

**替代方案：**
- 顯示「父目錄路徑」按鈕，點擊複製 `/Users/admin/openclaw/`
- 旁邊加說明文字：「Finder 中按 Cmd+Shift+G，貼上路徑即可前往」

這個 UX 缺口如果不處理，「看到路徑 → 採取行動」的整個迴路就斷掉了，Dashboard 的核心價值消失。

---

### 3-2. 第一眼看到什麼？Tab 結構未定義（中嚴重度，UX）

Round 3 沒有定義前端的 Tab 結構，只說「後續畫面」。但開啟 Dashboard 的第一眼決定了使用者對這個工具的第一印象。

建議的 Tab 結構（依使用頻率排序）：

| Tab | 內容 | 使用頻率 |
|-----|------|---------|
| 概覽（預設開啟） | Token 總量 + 資料新鮮度 + 關鍵警告 | 每次開啟 |
| CLAUDE.md 普查 | allProjects 列表 + 展開看內容 | 定期檢查 |
| Skills | .claude/skills/ 的 skills 清單 | 偶爾 |
| Plugins Skills | plugins 裡的 skills 清單 | 偶爾 |
| Docs | docs/ 檔案列表 | 偶爾 |

「概覽」頁應該是預設顯示，因為使用者最常需要的是「快速確認 token 健康狀態」。

---

### 3-3. 長文字展示缺少具體 UX 設計（低嚴重度，UX）

Round 3 說「展開看完整內容」，但沒定義展開後的呈現方式。

建議：
- 預設顯示前 300 字（約半個螢幕）
- 「展開全部」按鈕顯示 `content`
- 用等寬字體（`font-family: monospace`）保留 CLAUDE.md 的 markdown 原始格式
- 在顯示區上方顯示「字數：N 字 | 估計 Token：N」

---

## 角度 4：開發流程的可行性

### 4-1. Phase 2 的「上午/下午/晚上」時程對新環境設置太樂觀（中嚴重度）

Round 3 說「目標 1-2 天」，並分成上午/下午/晚上三個區塊。但遺漏了環境設置的時間：

**被遺漏的前置步驟（估計 0.5-1 小時）：**
1. 決定 Vue 專案放在哪個目錄（根目錄？子目錄？）
2. `npm create vue@latest` 的互動式設定（要回答 8-10 個問題）
3. 確認 `.gitignore` 覆蓋 `node_modules/` 和 `public/data.json`

Node.js 版本確認：系統有 v22.14.0，符合 package.json 的 `"node": ">=18"` 要求，這個沒問題。

---

### 4-2. `npm run dashboard` 的具體 scripts 寫法未定義（中嚴重度）

Round 3 說「npm run dashboard 要同時做掃描和啟動 dev server」，但沒給 package.json 的具體寫法。

可行的寫法：
```json
{
  "scripts": {
    "scan": "node scan.js",
    "dev": "vite",
    "dashboard": "node scan.js && vite --open"
  }
}
```

`&&` 的語意：scan.js 成功後才啟動 vite。如果 scan.js 失敗（exit code 非 0），vite 不會啟動。這個行為是正確的，但 scan.js 需要在正常結束時顯式 `process.exit(0)`，並在錯誤時 `process.exit(1)`。

不需要 `concurrently`，因為掃描是一次性的（不需要持續運行），完成後 vite 啟動即可。

---

### 4-3. Vue 專案初始化的互動式問題需要預先決定答案（低嚴重度）

`npm create vue@latest` 會詢問：

| 問題 | Round 3 的決定 | 說明 |
|------|--------------|------|
| TypeScript? | Yes | 已明確 |
| JSX Support? | No | 不需要 |
| Vue Router? | No | 單頁，不需要路由 |
| Pinia? | No | 已明確說不用 |
| Vitest? | No | v1 跳過測試 |
| E2E Testing? | No | 同上 |
| ESLint? | No | 已明確說 v1 跳過 |
| Prettier? | No | 同上 |

這些決定大部分能從 Round 3 推導，但沒有在一個地方明確列出，實作時還需要思考。建議在計畫中以表格形式列出。

---

### 4-4. Vue 專案的根目錄位置沒有定義（高嚴重度）

Round 3 說 scan.js 輸出到 `public/data.json`，但沒說 Vue 專案放在哪裡。

目前的 CMSI 目錄結構：
```
/Users/admin/Documents/Claude md 自我迭代專案/
├── findings.md
├── iterations/
├── progress.md
└── task_plan.md
```

有兩個選擇：

**選項 A：把 Vue 專案建在 CMSI 根目錄**
```
/Users/admin/Documents/Claude md 自我迭代專案/
├── src/          （Vue 來源）
├── public/
│   └── data.json
├── scan.js
├── package.json
├── findings.md   （和專案文件混在一起）
└── ...
```
缺點：Vue 的 `src/`, `node_modules/`, `dist/` 會和計畫文件混在一起，很亂。

**選項 B（建議）：在 CMSI 根目錄下建子目錄 `dashboard/`**
```
/Users/admin/Documents/Claude md 自我迭代專案/
├── dashboard/
│   ├── src/
│   ├── public/
│   │   └── data.json
│   ├── scan.js
│   └── package.json
├── findings.md
├── iterations/
└── task_plan.md
```
優點：計畫文件和程式碼分離，`npm run dashboard` 要在 `dashboard/` 下執行。

這個決定需要在 Phase 2 開始之前明確，否則 scan.js 裡的 `public/data.json` 路徑寫法會不同。

---

## 角度 5：使用者行動指引的實際可操作性

### 5-1. 「超過 8k tokens → 考慮移到 docs/」太模糊（中嚴重度）

Round 3 的行動指引寫：
> CLAUDE.md 超過 8,000 tokens → 找最大的區塊，考慮把它移到 docs/ 變成按需載入

問題：
1. 8,000 tokens 的根據是什麼？（Round 3 沒解釋）
2. 「找最大的區塊」——Dashboard 上有顯示 sections 的 token 分佈嗎？

確認 Round 3 的 data.json 結構：`globalConfig.sections` 有每個段���的 token 數，但 Dashboard 的 UI 設計沒有說這個 sections 資料要怎麼呈現。如果 sections 資料收集了但沒有在 Dashboard 顯示，使用者還是找不到「最大的區塊」。

**修正建議：**
- 在行動指引旁邊顯示 sections 的 token 排行（前 3 名）
- 8,000 tokens 的閾值說明：因為全域 CLAUDE.md 每次對話都自動載入，超過 8k 佔 context 太重

---

### 5-2. 行動指引的位置：Dashboard 上顯示還是文件裡？（低嚴重度）

Round 3 的 B-2 節有詳細的「看到什麼→做什麼」對照表，但沒說這些指引要顯示在 Dashboard 哪個位置。

建議：
- 每個數字旁邊有一個「?」說明圖示
- 滑鼠移上去顯示 tooltip：「此數字超過 8,000 tokens 時，建議...」
- 而不是在 Dashboard 上直接顯示一大段說明文字（那樣版面會很擁擠）

---

## 角度 6：遺漏的第零步

### 6-1. Git 狀態確認（實際查驗結果：良好）

CMSI 專案已有 Git repo，狀態：
- Remote：`https://github.com/jerrycela/CMSI.git`
- Branch：`main`，與 remote 同步
- 1 個 commit：`docs: Phase 1 Discovery 完成，建立專案規劃與研究報告`
- 狀態：有 untracked files（round-3.md 等）

**待確認：**
1. `.gitignore` 是否存在？（查驗發現沒有 `.gitignore`）
2. `node_modules/` 和 `public/data.json` 是否需要排除？

`data.json` 是否應該加進 git：有爭議。加進去可以追蹤歷史變化，但每次掃描都會產生 diff。建議排除 `public/data.json`，但允許手工建立的 `public/data.sample.json` 加入版控作為格式參考。

---

### 6-2. Dashboard 的根目錄位置需要在動手前決定（高嚴重度）

這是比 git 狀態更緊迫的第零步。在 Phase 2 第一步「手寫 data.json 範例」之前，必須先知道：

1. Vue 專案放在 `dashboard/` 子目錄（建議 B），還是 CMSI 根目錄
2. `public/data.json` 的完整路徑是什麼
3. scan.js 的輸出路徑寫死還是設成環境變數

如果不先決定這個，Phase 2 的「手寫 data.json 範例」就不知道把檔案放在哪裡。

---

### 6-3. rules/ 目錄已確認為空（已解決，可從 findings.md 移除待確認）

Round 3 的「開始前一個小任務」（清理 rules/）實際上已無需執行：查驗結果顯示 `/Users/admin/.claude/rules/` 是完全空的目錄（0 bytes）。

findings.md 裡關於「rules/ 殘留問題」的待確認條目可以直接標為「已確認：rules/ 為空，無殘留」。

---

## Part B：data.json 結構修訂版

以下是針對角度 1-2 的修正，以具體差異呈現：

### 修訂 1：allProjects 加入 `isTruncated`

```json
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
```

### 修訂 2：skills 項目加入 `type` 和 `source`，修正 `path`

```json
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
}
```

plugin skills 的範例：
```json
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
```

### 修訂 3：skills 頂層結構

```json
"skills": {
  "totalCount": 68,
  "manualCount": 25,
  "pluginCount": 43,
  "files": [ ...所有 68 個混在一起... ]
}
```

### 修訂 4：tokenBudget 的保留邏輯說明

```json
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
```

### 修訂 5：SCAN_ROOTS 和 EXCLUDE_PATHS 的正確設定

```javascript
const SCAN_ROOTS = [
  '/Users/admin'  // 從 home 掃，靠 EXCLUDE_PATHS 過濾雜訊
];

const MAX_DEPTH = 5;

const EXCLUDE_DIRS = [
  'node_modules', '.git', 'Library', '.Trash',
  '.cursor', '.vscode', 'extensions'
];

const EXCLUDE_PATHS = [
  '/Users/admin/.claude/plugins/cache',
  '/Users/admin/.claude/plugins/marketplaces',
  '/Users/admin/.claude/cache',
  '/Users/admin/Library'
];
```

---

## Part C：本輪 Insight

### C-1. 「正確的設想」和「真實的環境」之間有一條鴻溝

前三輪的計畫都是在假設環境裡設計的。Round 3 的 SCAN_ROOTS 設計師可能以為 `~/Developer` 和 `~/Projects` 是常見的 macOS 開發目錄慣例，但實際上這台機器上這兩個目錄根本不存在，而真正有專案的 `~/Cursor` 和 `~/openclaw` 卻沒被包含。

這個發現說明：**計畫文件只有在接觸真實環境後才能被驗證**。前三輪的迭代做的是邏輯上的精煉，但沒有觸碰真實的硬碟。

從開發流程角度，Round 4 的壓力測試方法（實際跑命令、查看檔案）比純邏輯分析更有效地找出問題。

---

### C-2. Skills 的真實架構：三個層次，計畫只知道一個

Round 3 把 skills 想像成一個簡單清單（25 個，全在 `.claude/skills/`）。但實際上 skills 有三個層次：

1. **手動建立/安裝的 skills**（`.claude/skills/`）：25 個，混合三種型態
2. **透過 plugin 安裝的 skills**（`.claude/plugins/marketplaces/*/skills/`）：43 個
3. **commands**（`.claude/commands/`）：3 個，不算 skills 但功能類似

如果 Dashboard 的 skills 頁面只顯示層次 1 的 25 個，使用者會覺得有 43 個 skills 不見了。這不是技術問題，而是「對工具架構的認識缺口」。

這個 insight 在計畫過程中很難被發現，因為它需要實際查看 `.claude/plugins/` 目錄。

---

### C-3. 「計畫的最後一輪」和「實作的第一輪」之間需要一個橋接文件

Round 3 宣告「這是最後一輪計畫迭代，Round 4 必須是程式碼」。但實際上 Round 4 又是一輪計畫文件（壓力測試報告）。這不是失敗，而是計畫本身的必要修正。

但它暗示了一個結構問題：**計畫迭代沒有自然的終止條件**。Round 3 試圖用「宣告終止」來強制結束，但發現只要還有未解決的問題，計畫就會繼續。

真正的終止條件不是「計畫完美了」，而是「有足夠的信心開始第一步，遇到問題時能即時修正」。Round 4 提出的壓力測試已經找出了所有可預見的高嚴重度問題。現在唯一剩下的，就是開始打字寫 scan.js。

---

### C-4. 一個被忽視的快速驗證方法

在 Phase 2 正式開始之前，可以用 5 分鐘做一個最粗糙的驗證：

```bash
find /Users/admin -name "CLAUDE.md" \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/.cursor/*" \
  -not -path "*/.vscode/*" \
  -not -path "*/.claude/plugins/*" \
  2>/dev/null
```

這個命令的輸出就是 `allProjects` 的原始資料。把這個輸出貼到一個文字編輯器，手動整理成 JSON，就是 Phase 2 第一步「手寫 data.json 範例」最快的完成方式。

---

## Part D：與 Round 3 的差異��結

| 項目 | Round 3 的設計 | Round 4 的修正 |
|------|--------------|--------------|
| SCAN_ROOTS | 3 個目錄（2 個不存在） | 改從 `~` 掃，靠 EXCLUDE_PATHS 過濾 |
| EXCLUDE_DIRS | 4 個（遺漏 .cursor .vscode） | 加入 `.cursor`, `.vscode`, `extensions`，加 EXCLUDE_PATHS |
| Skills 總數 | 假設 25 個 | 實際 68 個（含 plugin skills） |
| Skills 型態 | 全部是 symlink | 三種型態（symlink/目錄/.md 檔） |
| Skills `path` | 錯誤（和 target 一樣） | 修正為 symlink 本身的路徑 |
| `isTruncated` | 不存在 | 加入此欄位 |
| `tokenBudget` 更新 | 每次 scan 會覆寫 | scan.js 保留已存在的值 |
| Vue 專案位置 | 未定義 | 明確建議放在 `dashboard/` 子目錄 |
| npm scripts | 未給具體寫法 | 給出 `"dashboard": "node scan.js && vite --open"` |
| Vue 初始化選項 | 未列出所有選項 | 以表格列出全部 8 個問題的答案 |
| 路徑的 UX | 使用者「複製路徑」 | 加入 Finder 操作說明的 tooltip |
| Tab 結構 | 未定義 | 給出 5 個 Tab 的具體建議 |
| rules/ 狀態 | 待確認 | 已確認為空，無需清理 |

---

## 附錄：Round 4 壓力測試執行摘要

本輪實際執行的查驗命令及關鍵發現：

| 查驗項目 | 命令 | 發現 |
|---------|------|------|
| SCAN_ROOTS 驗證 | `ls /Users/admin/Developer` | 不存在（exit 1） |
| 真實 CLAUDE.md 分佈 | `find /Users/admin -name CLAUDE.md ...` | 10 個（排除雜訊後） |
| 雜訊 CLAUDE.md 數量 | 同上但包含 .cursor .vscode | 33 個（雜訊 23 個） |
| Skills 型態 | `ls -la ~/.claude/skills/` | 三種型態（symlink/目錄/.md） |
| Plugin skills 數量 | `ls ~/.claude/plugins/marketplaces/*/skills/` | 43 個（額外的，未計畫） |
| rules/ 狀態 | `ls ~/.claude/rules/` | 空目錄，0 bytes |
| Node.js 版本 | `node --version` | v22.14.0（符合要求） |
| Git 狀態 | `git status` | main 分支，有 remote，無 .gitignore |

---

*本報告由 Claude Sonnet 4.6 撰寫，2026-02-19*
*Round 4 是壓力測試輪。Round 5 的輸出必須是程式碼，沒有例外。*
*所有高嚴重度問題已在本輪識別並提供修正方案。開始實作的障礙已清除。*
