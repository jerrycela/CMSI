# Round 3 — 計畫改進版報告

審查日期：2026-02-19
審查角色：計畫迭代員（Sonnet 4.6）
審查對象：Round 1 + Round 2 的累積成果，產出改進版完整計畫

---

## Part A：Round 2 分析的 Meta-Review

### A-1. Round 2 的 9 條建議優先排序

重新審視這 9 條建議，依照「阻擋實作進展的程度」與「對使用者價值的貢獻」來排優先順序：

#### 第一梯隊：不做就無法動工（必做，P0）

**建議 1：先定義 data.json 的結構**
這是所有實作的地基。沒有這份契約，腳本和前端各自做假設，整合時一定返工。這條建議觸及的是工程根本——在設計之前動手寫程式碼，本質上是在沒有地基的情況下蓋房子。優先順序 1。

**建議 4：Skills 管理 MVP 明確只做已安裝列表，不做使用頻率**
功能範圍模糊是計畫最容易悄悄膨脹的地方。這條建議的本質是「設立邊界」，邊界不設就無法說「完成了」。優先順序 2。

**建議 9：最小可行版本重新定義——只做一個畫面，一個數字**
這條建議是 Round 2 最有執行力的洞察，但被放在最後，排序低估了它的重要性。「從一個數字開始」不只是開發策略，更是防止計畫繼續迭代而永遠停在「計畫中」狀態的唯一出路。優先順序 3。

#### 第二梯隊：讓 Dashboard 真正可用（重要，P1）

**建議 2：把「使用者要做什麼決策」寫進每個功能**
這條建議回答了 Round 2 最大的缺點。Dashboard 沒有行動指引就是一個「漂亮但沒用的面板」。優先順序 4。

**建議 5：加「資料新鮮度」顯示**
這是最小的 UX 補丁，但消除了使用者對資料可信度的疑慮。`generatedAt` 欄位幾乎零成本，效益卻很高。優先順序 5。

**建議 6：全專案 CLAUDE.md 掃描加邊界定義**
這是使用者明確提出的需求，沒有邊界條件就不能動手實作。但相比上面兩條，這條影響的是特定功能而非整體架構。優先順序 6。

#### 第三梯隊：品質補強（有益，P2）

**建議 7：處理 auto-analyze 重複計數 bug 並在 Dashboard 標注**
透明化很重要，但這是「數字是否準確」的問題，不是「能否展示」的問題。可以在第一個可展示版本之後再處理。優先順序 7。

**建議 8：驗證並清理 rules/ 目錄**
這是有實際 token 節省效益的行動項目，但和 Dashboard 本身的開發解耦。可以獨立做，不需要卡在 Dashboard 流程中。優先順序 8。

**建議 3：立刻更新 task_plan.md**
這條在 Round 2 強調了文件一致性的象徵意義。但從實用角度看，task_plan.md 在第 3 輪迭代後即將被新計畫取代，更新舊計畫的邊際效益接近零。優先順序 9。

---

### A-2. Round 2 分析的盲點與偏見

Round 2 的整體品質高，但有三個值得指出的偏見：

**偏見 1：過度強調文件一致性，低估了「開始動手」的急迫性**

Round 2 花了很多篇幅指出 task_plan.md 漂移的問題，並把這個現象類比為「Dashboard 要解決的問題在建 Dashboard 的過程中就在重現」。這個觀察本身很精準，但引出的結論（建議 3：更新 task_plan.md）卻是最低優先的行動。

這反映了一個分析者常見的偏見：**把問題診斷得越清楚，就越傾向要先「解決問題的象徵」，而不是「直接往前走」**。文件漂移是症狀，不是病因；在漂移的計畫上花力氣更新，不如直接用新計畫取代它。

**偏見 2：把「應該做」和「MVP 要做」混在同一層次**

Round 2 的 9 條建議把 P0（沒有就無法動工）和 P2（品質補強）放在同等重要的位置。建議 1（data.json 結構）和建議 8（清理 rules/）的重要性差距很大，但在報告中的呈現格式完全相同，讓讀者難以判斷從哪裡開始。

這是分析報告常見的排版偏見：清單格式暗示了等權重。

**偏見 3：對「JSONL 解析複雜度」的警告可能被高估了**

Round 2 在 3-2 節詳細列出了 JSONL 解析的四個複雜點，措辭謹慎。但考慮到：
- 使用者核心需求是「檢視所有專案的 CLAUDE.md 內容（只看 + 顯示路徑）」
- 這個需求完全不需要碰 JSONL
- 規則使用頻率功能已被確認放到 v2

Round 2 對 JSONL 複雜度的警告，在調整後的需求下，已經從「高風險問題」降級為「v2 再說的問題」。這個警告在當時是正確的，但可能無意間讓讀者對整個腳本開發感到畏懼，而實際上 MVP 的腳本完全不需要碰 JSONL。

---

### A-3. Round 2 的 4 個 Insight，是否還有更深層的洞察？

**Insight 1：「計畫的真正價值在發現，不在 Dashboard」**
Round 2 的原始版本：Phase 1 的三個發現本身有價值，就算 Dashboard 沒建好也不白費。

更深一層的洞察：**這個 Dashboard 專案本身就是一個 CLAUDE.md 的自我認識工具，而不只是一個管理工具**。Phase 1 Discovery 讓使用者第一次清楚知道自己的工具基礎設施長什麼樣子。這個「第一次清楚知道」本身就是一種進步，和 Dashboard 是否建成無關。

這暗示：Dashboard 的「成功」不應該只用「功能是否完成」衡量，而應該用「使用者對自己工具的認識是否增加」衡量。

**Insight 2：「簡化的邊際效益遞減」**
Round 2 的原始版本：每次說「不需要這個」都需要論證，論證成本可能比實作更高。

更深一層的洞察：這個 insight 其實有一個隱藏的矛盾——**迭代計畫本身也在消耗原本應該用來實作的時間**。Round 1 優化了 20 點，Round 2 提了 9 條建議，Round 3 正在做 meta-review。每一輪迭代的品質都在提升，但「開始實作」的時刻也在不斷後移。計畫迭代是一種非常文明的拖延。

如果這個計畫有一個「結束迭代，開始動手」的觸發條件，它應該是什麼？答案可能就在 Round 2 的建議 9：**能在一天內完成第一個可展示版本，就是停止迭代的訊號**。

**Insight 3：「使用者就是建造者」**
Round 2 的原始版本：UI 不需要直覺易用，需要建造者自己覺得有用；從「今天最想知道的一個數字」開始。

更深一層的洞察：這個 insight 還有一個維度沒被展開——**如果使用者就是建造者，那麼「先問自己最想知道什麼」這個問題，應該在開始任何計畫之前就問，而不是在計畫迭代到第 3 輪才意識到**。

使用者確認的需求是「能檢視所有專案的 CLAUDE.md 內容」。但這個需求是在計畫進行過程中才被提出的，不是在一開始就有的。這說明：對於個人工具，「探索性的」需求發現比「完整的」需求定義更重要。不要在動手前試圖定義所有功能，而是先做一個小東西，然後用它發現真正的需求。

**Insight 4：「計畫文件正在示範 CLAUDE.md 漂移問題」**
Round 2 的原始版本：task_plan.md 已過時，文件漂移這件事本身是 CLAUDE.md 問題的縮影。

更深一層的洞察，也是本輪最重要的 meta-insight：**這個計畫在每一輪迭代中都在生產越來越多的文件（task_plan.md、findings.md、round-1.md、round-2.md、round-3.md），而這些文件本身正在重現它試圖解決的問題——文件量增加，每個文件之間的一致性越來越難維護，使用者需要越來越多時間才能理解「現在的決策是什麼」**。

這不是 Round 2 的分析失誤，而是計畫迭代過程本身的結構性問題。解法不是「更認真地維護文件」，而是「建立一份單一的、永遠最新的『當前決策』文件」，而不���用時間軸的多份報告來追蹤演進。

---

## Part B：改進版完整計畫

### B-1. 專案目標（一句話）

**讓我在 30 秒內看到自己所有 CLAUDE.md 的狀況，知道哪裡太胖、哪些 Skills 裝了沒用，然後知道下一步該做什麼。**

---

### B-2. 使用者故事 + 行動指引

這個 Dashboard 的使用者只有一個人，所以使用者故事直接以第一人稱寫：

#### 故事 1：我想知道我的設定有多重

「當我打開 Dashboard，我能立刻看到全域 CLAUDE.md 有多少 token、docs/ 裡每個檔案各佔多少、整個設定包在每次對話開始時消耗多少預算。」

| 看到什麼 | 做什麼 |
|---------|--------|
| CLAUDE.md 超過 8,000 tokens | 找最大的區塊，考慮把它移到 docs/ 變成按需載入 |
| docs/ 裡某個檔案超過 3,000 tokens | 考慮拆成更小的子文件，或刪除沒在用的部分 |
| 整體自動載入超過 40,000 tokens | 警戒，對話上下文快到 autocompact buffer |
| Memory files 顯示 8,200 tokens 但預期更少 | 去查 rules/ 是否有殘留檔案被載入 |

---

#### 故事 2：我想看所有專案的設定長什麼樣

「當我打開 Dashboard，我能看到電腦上所有找到的 CLAUDE.md 在哪裡、它的內容是什麼、有多大。」

| 看到什麼 | 做什麼 |
|---------|--------|
| 某個專案的 CLAUDE.md 很久沒更新 | 點開看內容，判斷是否仍然相關 |
| 某個專案的 CLAUDE.md 比全域還大 | 考慮是否有多餘的重複內容可以刪 |
| 某個路徑的 CLAUDE.md 自己忘了它存在 | 複查確認內容、決定是否保留 |

---

#### 故事 3：我想知道裝了哪些 Skills

「當我打開 Dashboard，我能看到所有已安裝的 Skills、每個 Skill 有多大、以及它的用途摘要。」

| 看到什麼 | 做什麼 |
|---------|--------|
| 某個 Skill 的 token 比預期大很多（如 vueuse-functions: 4,757t） | 評估這個 Skill 是否值得保留，或能否精簡 |
| 發現安裝了一個完全忘記的 Skill | 讀摘要確認用途，決定是否保留 |
| 某個 Skill 帶有多個附加檔案（如 pdf + reference.md + forms.md）| 知道調用它時實際 token 消耗是主檔 + 附加檔的總和 |

---

#### 故事 4：我想知道這份資料有多舊

「當我打開 Dashboard，我能看到這份資料是什麼時候掃描的，以及如何更新它。」

| 看到什麼 | 做什麼 |
|---------|--------|
| 資料已是三天前的 | 跑 `npm run scan` 更新，再重整頁面 |
| 資料是剛才更新的 | 直接信任數字，開始看內容 |

---

### B-3. data.json 結構初稿

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
    "sections": [
      {
        "heading": "語言與報告",
        "wordCount": 45,
        "estimatedTokens": 420
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
    "totalCount": 25,
    "files": [
      {
        "name": "vueuse-functions",
        "path": "/Users/admin/.agents/skills/vueuse-functions",
        "isSymlink": true,
        "symlinkTarget": "/Users/admin/.agents/skills/vueuse-functions",
        "wordCount": 3659,
        "estimatedTokens": 4757,
        "descriptionSnippet": "VueUse functions reference...",
        "attachments": []
      },
      {
        "name": "pdf",
        "path": "/Users/admin/.agents/skills/pdf",
        "isSymlink": true,
        "symlinkTarget": "/Users/admin/.agents/skills/pdf",
        "wordCount": 1008,
        "estimatedTokens": 1310,
        "descriptionSnippet": "PDF operation patterns...",
        "attachments": [
          { "name": "reference.md", "estimatedTokens": 2461 },
          { "name": "forms.md", "estimatedTokens": 2143 }
        ]
      }
    ]
  },

  "allProjects": [
    {
      "path": "/Users/admin/Documents/SomeProject/CLAUDE.md",
      "projectName": "SomeProject",
      "wordCount": 312,
      "byteSize": 3800,
      "estimatedTokens": 2900,
      "lastModified": "2026-01-15T10:00:00+08:00",
      "content": "...（完整原始內容）..."
    }
  ],

  "tokenBudget": {
    "autoLoadedTotal": 33600,
    "breakdown": {
      "memoryFiles": 8200,
      "skillsFrontmatter": 1700,
      "systemPrompt": 3300,
      "systemTools": 20000,
      "mcpTools": 137,
      "customAgents": 247
    },
    "warningThreshold": 40000,
    "note": "memoryFiles 包含 CLAUDE.md + rules/ 目錄的自動載入，非僅 CLAUDE.md"
  }
}
```

**設計說明：**
- `content` 欄位存完整原始文字，前端用 pre 標籤展示，不需要後端 API
- `estimatedTokens` 統一用 `wordCount × 1.3` 計算，腳本一致，前端不用再計算
- `allProjects` 是 CLAUDE.md 普查結果，只讀不編輯
- 所有路徑都是絕對路徑，避免相對路徑在不同啟動方式下出錯
- `tokenBudget` 是手動填寫的估算值（來自 /context 指令輸出），不是即時計算

---

### B-4. 架構圖

```
使用者本地環境
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [npm run dashboard]                                    │
│       │                                                 │
│       ├─→ [Node.js 掃描腳本 scan.js]                    │
│       │        │                                        │
│       │        ├─ 讀取 ~/.claude/CLAUDE.md              │
│       │        ├─ 讀取 ~/.claude/docs/*.md              │
│       │        ├─ 掃描 ~/.claude/skills/ + symlinks     │
│       │        ├─ 遍歷 ~/Documents/**/ 找 CLAUDE.md     │
│       │        └─ 輸出 → public/data.json               │
│       │                                                 │
│       └─→ [Vite Dev Server]                             │
│                │                                        │
│                └─→ 讀取 public/data.json（靜態資源）     │
│                         │                               │
│                    [Vue 3 SPA]                          │
│                         │                               │
│                    瀏覽器自動開啟                         │
│                                                         │
└─────────────────────────────────────────────────────────┘

資料流：本地檔案系統 → scan.js → data.json → Vue 3 → 瀏覽器
更新方式：手動跑 npm run scan，或重新跑 npm run dashboard
```

**沒有：**
- 後端伺服器（Node.js 只在掃描時執行，不常駐）
- 資料庫
- WebSocket
- Express
- API 端點
- 任何需要「保持運行」的程序

---

### B-5. MVP 功能清單（明確邊界）

#### 在 MVP 範圍內（v1 必做）

| 功能 | 具體內容 | 行動指引 |
|------|---------|---------|
| 全域 Token 分析 | CLAUDE.md 字數/token 數；docs/ 每個檔案的 token 數；token 預算分佈表 | 超過 8k tokens → 考慮移到 docs/ |
| 所有 CLAUDE.md 普查 | 掃描結果的路徑列表；點擊展開看完整內容；檔��大小和最後修改時間 | 看到忘記的 CLAUDE.md → 決定保留或刪除 |
| Skills 清單 | 已安裝列表；每個 Skill 的 token 數和描述摘要；附加檔案的 token 加總 | 某 Skill 太大 → 評估是否保留 |
| 資料新鮮度 | 頁首顯示「掃描於 X 分鐘前」；顯示更新指令說明 | 資料太舊 → 跑 npm run scan |

#### 明確不在 MVP 範圍（v2 以後）

| 功能 | 原因 | 依賴項 |
|------|------|--------|
| 規則使用頻率 | 需要 JSONL 解析，複雜度高 | JSONL 解析邏輯 |
| Skills 使用頻率 | 同上 | JSONL 解析邏輯 |
| 優化歷史追蹤 | 需要備份 diff 邏輯 | 備份快照比較 |
| CLAUDE.md 編輯功能 | 使用者明確說「只看不編輯」 | 永遠不做 |
| 圖表視覺化（圓餅圖/長條圖） | token 分佈用表格就夠清楚 | 無 Chart.js 依賴 |
| 即時監控/WebSocket | 個人工具不需要即時性 | 永遠不做 |
| ESLint + Prettier | v1 跳過，但 v2 加回來 | v2 計畫項目 |

---

### B-6. 開發階段（精簡版）

**原則：三個階段，第一階段必須在一天內能展示。**

#### Phase 1（已完成）：Discovery
目標：了解工具基礎設施的實際狀況。
產出：findings.md，記錄了三個關鍵發現。
狀態：完成。

---

#### Phase 2：腳本 + 靜態資料（目標：1-2 天）

**第一步（上午）：先手寫 data.json 範例**
不跑任何程式，用真實的本地資料手動填寫一份 data.json。
這份手工版本就是腳本和前端的合約，完成後才開始寫程式碼。

**第二步（下午）：寫 scan.js 腳本**
讀取 ~/.claude/CLAUDE.md → 填充 globalConfig
讀取 ~/.claude/docs/*.md → 填充 docs
掃描 ~/.claude/skills/ → 填充 skills（處理 symlink）
遍歷指定根目錄找 CLAUDE.md → 填充 allProjects
輸出到 public/data.json，並記錄 generatedAt

掃描邊界設定（硬編碼在腳本開頭，清晰可見）：
```javascript
const SCAN_ROOTS = [
  '/Users/admin/Documents',
  '/Users/admin/Developer',
  '/Users/admin/Projects'
];
const MAX_DEPTH = 5;
const EXCLUDE_DIRS = ['node_modules', '.git', 'Library', '.Trash'];
```

**第三步（晚上）：驗證腳本輸出**
對比手工版 data.json 和腳本產出，確認結構一致。

---

#### Phase 3：Vue 3 前端（目標：2-3 天）

**第一個畫面（第一天，必須完成）：**
單一頁面，顯示 globalConfig 的 token 數字，加上資料新鮮度。
這是「最小可展示版本」，完成這個就代表整個管線通了。

**後續畫面（第二天之後）：**
- CLAUDE.md 普查列表（路徑 + 字數 + 展開看內容）
- Skills 清單（名稱 + token 數 + 描述摘要）
- Token 預算分佈表

**技術選型：**
- Vue 3 + Composition API
- Vite（開發伺服器 + 建置）
- TypeScript（類型定義用於 data.json 結構）
- 不用 Pinia（資料是靜態的，不需要狀態管理）
- 不用 Chart.js（表格比圖表更直接）
- 不用 ESLint/Prettier（v1 跳過，v2 補）

---

#### 開始前一個小任務（15 分鐘，現在就能做）：

**清理 rules/ 目錄的殘留問題：**
用 `/context` 指令確認 rules/ 的哪些檔案仍在 Memory files 中被載入。
如果有，清空或移除。
這個動作本身就是「Token 分析 → 行動指引 → 採取行動」流程的第一次實際演練。
完成後，findings.md 的風險條目可以從「待確認」改為「已處理」。

---

### B-7. 已知風險與應對

| 風險 | 發生機率 | 影響 | 應對策略 |
|------|---------|------|---------|
| Symlink 讀取失敗 | 中 | Skills 清單不完整 | 用 `fs.lstatSync` 判斷，失敗時標注「symlink 無法讀取」而非崩潰 |
| CLAUDE.md 掃描找到非預期路徑 | 高 | 結果混亂 | SCAN_ROOTS 硬編碼，不掃 ~ 根目錄，加 MAX_DEPTH 限制 |
| data.json 太大（allProjects 的 content 欄位） | 中 | 頁面載入慢 | content 欄位截斷到前 5,000 字，完整內容按需展開 |
| scan.js 在首次執行時找不到某些目錄 | 低 | 腳本崩潰 | 每個目錄加 try/catch，找不到就略過，不影響整體執行 |
| Node.js 版本相容問題 | 低 | 無法執行 | package.json 加 `"engines": {"node": ">=18"}` |
| 計畫繼續迭代而沒有開始動手 | 高 | 無任何實際成果 | 本輪（Round 3）是最後一輪計畫迭代，Round 4 必須是實作輸出 |

---

## Part C：本輪 Insight

### C-1. 從 Round 1 + Round 2 的完整脈絡中看到的新 Insight

**Insight 1：計畫迭代本身是一種結構性的拖延**

Round 1 優化了 20 點，Round 2 提了 9 條建議，Round 3 正在做 meta-review 加改進計畫。每一輪都讓計畫更精確，但「開始實作」的時刻也在不斷後移。

這不是任何人的錯，而是「計畫迭代」這個流程本身的性質——它讓人覺得「計畫更好了，但還不夠好」，所以可以繼續迭代。能終止這個循環的不是「計畫終於好到可以動手」，而是一個外部的決定：**「這是最後一輪，下一輪必須有程式碼」**。

這個 insight 已經被明確寫進 B-7 風險表，作為最高優先的行動約束。

**Insight 2：「使用者最想知道的一個數字」是一個比「功能清單」更好的起點**

Round 2 的建議 9 提出了這個問題，但沒有給出答案。Round 3 可以回答它：

**那個數字是：全域 CLAUDE.md 目前佔了多少 tokens。**

理由：這是 findings.md 記錄的最直接的問題（Memory files 8,200 tokens，但 CLAUDE.md 本身只有 5,600 tokens，差距 2,600 tokens 仍未解釋清楚），也是「使用者看完後最有可能採取行動」的數字。

知道了這個起點，Phase 3 的「第一個畫面」任務就變得非常具體：顯示這一個數字，資料從 data.json 的 globalConfig.estimatedTokens 讀取。

**Insight 3：這個計畫積累了五份文件，但「現在的決策是什麼」仍然分散在各處**

task_plan.md、findings.md、round-1.md（推測存在）、round-2.md、round-3.md——五份文件，每份都有不同的決策和洞察。一個新的讀者（或三個月後的自己）要理解「現在計畫的狀態」，需要讀完所有五份文件並自己整合。

這正是 CLAUDE.md 漂移問題的計畫層面版本。

解法不是「第四輪迭代再整合一次」，而是本輪的 round-3.md（Part B）**直接作為唯一有效的計畫文件**，其他文件歸檔為歷史紀錄。從 Phase 2 開始，只有 round-3.md 的 Part B 是「當前計畫」。

---

### C-2. 比上一輪好在哪裡？具體改了什麼、為什麼改

**改進 1：建議排了優先順序，而不是全部等重**

Round 2 的 9 條建議是並列的清單，讀者不知道從哪裡開始。Round 3 明確分成三個梯隊（P0/P1/P2），並說明了排序理由。這讓「下一步做什麼」變成一個可以直接執行的決定，而不是需要再思考的問題。

**改進 2：使用者故事加了「看到什麼→做什麼」的對照表**

Round 2 的最大缺點是「Dashboard 沒有行動指引」。Round 3 在每個使用者故事後面都加了一張對照表，每個數字都有對應的行動意義。這從根本上回答了「Dashboard 讓使用者做什麼決策」的問題。

**改進 3：data.json 結構給出了具體初稿**

Round 2 指出沒有 data.json 結構定義是最大的技術風險。Round 3 直接給出了帶欄位名稱、類型、用途說明的完整初稿。這份初稿本身就可以用來開始寫腳本，不需要再做任何設計決策。

**改進 4：掃描邊界以具體程式碼形式呈現**

Round 2 說掃描需要邊界，但只是文字描述。Round 3 直接寫出了 `SCAN_ROOTS`、`MAX_DEPTH`、`EXCLUDE_DIRS` 的具體值，並說明要「硬編碼在腳本開頭，清晰可見」。這消除了實作時的設計決策，直接可以貼進程式碼。

**改進 5：明確宣告「這是最後一輪計畫迭代」**

這是 Round 3 和之前所有輪次最根本的差異。Round 1 和 Round 2 都沒有說什麼時候停止計畫、開始動手。Round 3 在風險表中明確寫入「本輪是最後一輪計畫迭代，Round 4 必須是實作輸出」，並把「繼續迭代而不動手」列為最高風險，等同於把自己鎖定在這個承諾上。

---

## 附錄：本輪決策記錄

| 決策 | 理由 |
|------|------|
| Round 3 的 Part B 作為唯一有效計畫文件 | 避免繼續在五份文件之間查找「當前決策是什麼」 |
| 不更新 task_plan.md | task_plan.md 已是歷史文件，更新沒有邊際效益 |
| 不用 Pinia | 資料是靜態的，一次載入，不需要響應式狀態管理 |
| 不用 Chart.js | 表格比圖表更直接，token 數字用表格展示足夠 |
| content 欄位截斷 5,000 字 | 防止 data.json 過大，完整內容按需展開不影響初始載入 |
| 清理 rules/ 作為「開始前一個小任務」 | 15 分鐘可完成，驗證行動指引設計，消除 findings.md 待確認風險 |

---

*本報告由 Claude Sonnet 4.6 撰寫，2026-02-19*
*Round 3 是最後一輪計畫迭代。Round 4 的輸出必須是程式碼。*
