# Round 8 — 魔鬼代言人壓力測試報告

文件日期：2026-02-19
文件角色：魔鬼代言人（Devil's Advocate，Claude Sonnet 4.6）
文件性質：**最終壓力測試。不產出新版計畫，只找問題。**

> 本文件以實際查驗本機環境的數據為基礎，不憑假設挑戰。

---

## 前言：測試前的基準資料

在開始挑戰之前，本輪實際查驗了以下數據，作為分析基礎：

| 項目 | 計畫假設 | 實際數值 |
|------|---------|---------|
| 手動 skills 數量 | 25 | 25 個（吻合） |
| Plugin skills 數量 | 43 | 43 個（吻合） |
| Skills 總數 | 68 | 68 個（吻合） |
| Docs 檔案數量 | 未明確 | 10 個 .md 檔 |
| 全域 CLAUDE.md 字數 | 範例用 597 | 實際 633 字 |
| allProjects 掃描數量 | 未明確 | 10 個 CLAUDE.md |
| 最大的專案設定 | 範例用 openclaw 2441 字 | 實際 openclaw 2441 字（吻合） |
| Node.js 版本 | 已確認 v22.14.0 | v22.14.0（吻合） |
| create-vue 版本 | 未指定 | 目前 3.21.1 |

---

## 挑戰角度一：「這個工具真的會被使用嗎？」

### 挑戰 1-A：觸發場景幾乎不存在

**問題陳述：**

計畫假設使用者會「打開 Dashboard 看看」，但沒有回答這個問題：**是什麼事件讓你想到要去開它？**

思考一下典型的一天：你打開終端機，開始用 Claude Code 工作。在這個流程裡，有什麼東西會讓你想到「我應該先去看 Dashboard」？幾乎沒有。Claude Code 已經在工作了，你沒有理由中斷去開一個瀏覽器分頁。

更可能發生的情境是：
- 第一次建好後興奮地開了幾次
- 有一天覺得 Claude 反應變慢，懷疑 context 太重，然後想起有個 Dashboard
- 之後再也沒打開

**這真的是問題嗎？** 是，但不是致命問題。

理由：這個工具的定位本來就是「偶爾健康檢查」，不是「每天必用」。問題在於計畫完全沒有討論「如何讓使用者記得這個工具存在」。

**具體建議：**

在 `npm run scan` 執行完畢後，終端機輸出最後一行加一個提示：

```
掃描完成。Dashboard 報告已就緒。
摘要：正常狀態 | 全域指令 633 字 | 68 個 Skills
打開報告：open "/Users/admin/Documents/Claude md 自我迭代專案/dashboard/index.html"
```

這樣即使不開 `npm run dashboard`，單獨跑 `npm run scan` 也有摘要輸出。使用者在終端機就能看到狀態，只有想深入時才去開瀏覽器。這讓 **終端機摘要變成主要入口，Dashboard 變成輔助**。

---

### 挑戰 1-B：主動提醒機制完全缺失

**問題陳述：**

計畫有「資料超過 24 小時後顯示橫幅警告」，但這個警告的前提是使用者已經打開了 Dashboard。如果根本沒打開，這個提醒永遠不會出現。

有沒有辦法讓 Dashboard 主動找到使用者？

**可行選項分析：**

| 選項 | 可行性 | 成本 |
|------|--------|------|
| macOS 系統通知（osascript） | 高 | 低，scan.js 就能做 |
| LaunchAgent 定時執行 | 中 | 中，需要額外 plist 設定 |
| 在 CLAUDE.md 裡加一條規則，讓 Claude 週期性提醒 | 高 | 零成本 |
| 完全不做，接受「偶爾手動開」的模式 | — | 零成本 |

**這真的是問題嗎？** 看你想要什麼。如果接受「需要時才用」，這不是問題。如果希望「自動發現設定腫脹」，目前的設計做不到。

**具體建議（僅供參考，不要加進 MVP）：**

在 scan.js 完成後，如果偵測到警告狀態，執行：
```javascript
const { execSync } = require('child_process');
if (healthStatus === 'alert') {
  execSync(`osascript -e 'display notification "你的 Claude 設定有需要注意的地方，建議開啟 Dashboard 確認" with title "CMSI 警告"'`);
}
```

這是一行程式碼，但建議放在 v2，原因：第一次警告很新鮮，第三次警告就很煩。

---

## 挑戰角度二：「最小的有價值版本」再挑戰

### 挑戰 2-A：MVP 4 個功能能不能再砍？

**現在的 MVP 功能：**
1. 健康燈號（狀態判斷）
2. 指令設定瀏覽（CLAUDE.md 列表）
3. Skills 清單（68 個）
4. 資料新鮮度

**如果只做 1 個功能，哪個最有價值？**

答案是**終端機摘要輸出**，而不是任何 Vue 元件。

理由：
- 你的使用場景是「工作途中想確認一下」
- 在終端機看 5 行摘要比開瀏覽器、切分頁、等頁面載入快 10 倍
- Skills 清單是 68 個條目，在終端機用 `grep` 找更快
- 健康燈號一行 `echo` 就能輸出

**這動搖了整個 Vue Dashboard 的存在理由嗎？**

部分動搖，但沒有推翻。

終端機輸出適合「快速確認」，但不適合「瀏覽」。你不會在終端機裡「讀」一個有 2441 字的 CLAUDE.md，也不會在終端機裡翻閱 68 個 Skills 的摘要。Dashboard 的核心價值在於**可讀性和可瀏覽性**，這是終端機沒辦法取代的。

**結論：MVP 不需要砍功能，但需要加終端機摘要輸出作為補充。**

---

### 挑戰 2-B：有沒有不在清單裡但超有價值的功能？

**發現一個計畫完全沒提到的功能：CLAUDE.md 重複規則偵測**

考慮這個場景：
- 全域 CLAUDE.md 有一條「一律使用繁體中文」
- openclaw/CLAUDE.md 也有一條「語言：繁體中文」
- 這是重複的，可以刪掉一個

重複規則是「設定腫脹」最常見的原因，但目前計畫只顯示字數，不識別重複。

這個功能值得放進 v2，但**不要放進 v1**。原因：識別語意上的重複需要更複雜的文字比對邏輯，v1 的目標是讓管線通，不是做 AI 分析。

---

## 挑戰角度三：技術實作的「第一天困難」

### 挑戰 3-A：工程師第一步會卡在哪裡？

**實際執行 `npm create vue@latest .` 的問題：**

這個指令會在**現有目錄**初始化，但目前 `dashboard/` 目錄尚未建立。計畫說：

```bash
mkdir dashboard
cd dashboard
npm create vue@latest .
```

問題：`npm create vue@latest .` 的 `.` 代表「在當前目錄建立」，如果目錄不是空的會有警告。如果已經有 `package.json` 也會衝突。計畫沒有說明如何處理這個情況。

**更安全的初始化方式：**

```bash
cd "/Users/admin/Documents/Claude md 自我迭代專案"
npm create vue@latest dashboard
# create-vue 會自己建立 dashboard/ 目錄，不需要 mkdir
```

這避免了「先建目錄再在裡面初始化」的潛在衝突。

---

### 挑戰 3-B：package.json 的依賴項有哪些？

計畫完全沒有列出依賴版本。`npm create vue@latest` 的實際輸出（以目前版本 3.21.1 為基礎）會產生：

```json
{
  "dependencies": {
    "vue": "^3.5.28"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.3",
    "typescript": "~5.8.0",
    "vite": "^7.3.1",
    "vue-tsc": "^2.2.10"
  }
}
```

**注意：Vite 7 和之前版本有 breaking changes。**

目前 `npm show vite version` 顯示 `7.3.1`。Vite 7 在 2025 年釋出，改了設定檔格式。如果工程師參考網路上舊的 Vite 5 教學，`vite.config.ts` 的寫法可能會有問題。

計畫中的 `vite.config.ts` 一節沒有提供任何設定範例，這是一個真實的卡關點。

**最小可用的 vite.config.ts（Vite 7 格式）：**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

對這個專案來說這就夠了，不需要客製化。

---

### 挑戰 3-C：scan.js 的第一個 function 應該寫什麼？

計畫提供了許多函式片段，但沒有說明**進入點**（entry point）。工程師坐下來的第一個問題是：「我應該從哪個函式開始寫？」

正確的思維是從輸出往回推：

```
最終目標：寫出 public/data.json
↑ 需要：把所有資料組裝成一個物件
↑ 需要：globalConfig、docs、skills、allProjects、tokenBudget、healthThresholds
↑ 需要：各個掃描函式
```

所以**第一個要寫的不是掃描函式，而是主函式的骨架：**

```javascript
// scan.js 第一步：建立骨架，先讓輸出能執行
import fs from 'fs';
import path from 'path';

const OUTPUT_PATH = new URL('../public/data.json', import.meta.url).pathname;

async function main() {
  const data = {
    meta: {
      generatedAt: new Date().toISOString(),
      scanVersion: '1.0.0'
    },
    healthThresholds: getHealthThresholds(),
    globalConfig: {},     // TODO
    docs: {},             // TODO
    skills: {},           // TODO
    allProjects: [],      // TODO
    tokenBudget: {}       // TODO
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log('掃描完成，輸出至', OUTPUT_PATH);
  process.exit(0);
}

main().catch(err => {
  console.error('掃描失敗:', err);
  process.exit(1);
});
```

**第一天能做到的最小目標：讓這個骨架能成功執行，輸出一個帶有正確 `meta` 的空 data.json。** 之後每個 TODO 依序填入。

---

### 挑戰 3-D：scan.js 使用 ES Modules 還是 CommonJS？

計畫的程式碼片段混用了兩種風格：
- 部分片段用 `const fs = require('fs')` （CommonJS）
- 主函式骨架應該用什麼格式？

`npm create vue@latest` 產生的 `package.json` 預設**不含** `"type": "module"`，但 Vite 設定檔用 ES Module 語法（`import/export`）。

scan.js 是 Node.js 腳本，如果 package.json 不含 `"type": "module"`，就應該用 CommonJS (`require`)，否則要加 `.mjs` 副檔名或在 package.json 加 `"type": "module"`。

**建議：在 package.json 加 `"type": "module"`，讓 scan.js 和 Vue 元件的 import 語法一致。** 如果不加，scan.js 就必須全程用 `require()`，反而不一致。

這個細節計畫完全沒提，但它影響第一行程式碼怎麼寫。

---

## 挑戰角度四：維護成本的誠實評估

### 挑戰 4-A：新版 Claude Code 出來，需要更新什麼？

**需要更新的情況（機率排序）：**

**高機率（每幾個月）：**
- Skills 數量增減：有新 Skills 安裝或舊的刪除 → scan.js 是動態掃描，**不需要更新**
- CLAUDE.md 內容改變 → scan.js 重新讀取，**不需要更新**

**中機率（每半年）：**
- Plugin 在 marketplace 增加新的 skills 子目錄 → scan.js 用 glob 動態掃描，**不需要更新**
- `healthThresholds` 的閾值不夠準確（閾值是寫在 scan.js 的 `HEALTH_THRESHOLDS` 常數裡，不是只在 data.json）→ **需要改 scan.js 的常數**

**低機率（每一年）：**
- `/context` 指令輸出格式改變 → `tokenBudget` 是手動填寫，**不會自動失效**，但手動更新流程需要重新學習
- Claude Code 更換 skills 儲存路徑 → 計畫有 `SKILLS_MANUAL_DIR` 常數，**需要改常數**

**整體評估：維護成本很低。** 動態掃描的設計讓大部分變化自動適應。最需要人工介入的場景是路徑結構改變，但這個機率很低。

---

### 挑戰 4-B：Skills 路徑結構改變了怎麼辦？

目前計畫的掃描路徑：
```javascript
const SKILLS_MANUAL_DIR = '/Users/admin/.claude/skills';
const SKILLS_PLUGIN_BASE = '/Users/admin/.claude/plugins/marketplaces';
```

**潛在的路徑變化場景：**

1. Claude Code 把 skills 移到 `~/.claude/commands/skills/` → 需要改常數，但改一行就好
2. Plugin 格式從 `marketplaces/*/skills/` 改成 `plugins/*/commands/` → 需要改 `scanPluginSkills` 邏輯

**目前計畫對這個風險的應對（第 10 節）：**

> plugin skills 目錄結構改變（低）→ 使用 glob 動態掃描 `marketplaces/*/skills/`，不硬編碼 plugin 名稱

這個應對只解決了「plugin 名稱改變」的問題，沒有解決「目錄結構本身改變」的問題。但這個風險真的很低（Claude Code 的 skills 路徑已穩定很久），不需要過度設計。

**實際驗證發現一個現有問題：**

目前有 6 個 plugin，其中 `claude-plugins-official`、`thedotmack`、`ui-ux-pro-max-skill` 的 `skills/` 子目錄不存在（這些 plugin 沒有 skills，只有其他內容）。計畫的 `scanPluginSkills` 邏輯已有 `if (!fs.existsSync(skillsDir)) continue;` 來處理這種情況。

---

### 挑戰 4-C：data.json 格式需要升級時，前端要改多少？

假設 v2 要新增一個欄位 `skills[].usageCount`，需要改：
1. `scan.js`：新增掃描邏輯（必須改）
2. `types/data.ts`：新增 TypeScript 型別（必須改）
3. `SkillsTab.vue`：新增顯示邏輯（必須改）

這是正常的。但如果要**改變現有欄位的型別**（例如把 `wordCount: number` 改成 `wordCount: { chars: number, words: number }`），就需要改所有用到這個欄位的元件。

計畫有 `types/data.ts` 的設計，這讓型別錯誤在編譯時就被抓到，不會在執行時才發現。**這個設計是對的，維護成本可控。**

---

## 挑戰角度五：有沒有更好的替代方案？

### 挑戰 5-A：用 CLI 腳本輸出 report 到終端，行不行？

**完全可以，而且對「快速確認」的場景比 Dashboard 更快。**

一個 CLI 版本的 scan.js 可以這樣輸出：

```
CMSI 掃描報告 - 2026-02-19 14:30
狀態：警告 (openclaw CLAUDE.md 比全域大 3.8 倍)

全域指令檔：633 字（佔對話額度 1.6%）
Skills：68 個（手動 25 + Plugin 43）
指令設定：10 個 CLAUDE.md

最重章節：Skill 路由表 > 模型分工原則 > 核心品質規則
```

這 8 行輸出可能已經覆蓋了 80% 的使用場景。

**但 CLI 做不到的事情：**
- 閱讀 2441 字的 openclaw CLAUDE.md（終端機不適合閱讀長文）
- 即時篩選 68 個 Skills
- 視覺化進度條

所以 CLI 和 Dashboard 不是競爭關係，而是互補的。

**建議：scan.js 執行後預設輸出 CLI 摘要（5-8 行），Dashboard 作為「看詳情」的工具。** 這個改動對 scan.js 來說是加一個 `printSummary()` 函式，成本很低。

---

### 挑戰 5-B：用 Obsidian/Notion/Heptabase 呈現，可行嗎？

**Heptabase 有整合（計畫本身就在用），為什麼不直接存進去？**

可行性分析：

| 方式 | 優勢 | 劣勢 |
|------|------|------|
| Heptabase | 已有整合，會自動同步 | 沒有即時篩選，不能自動掃描，需要手動貼資料 |
| Obsidian | markdown 原生，適合查閱文字內容 | 無法做互動（篩選、進度條） |
| Notion | 表格好看 | 需要手動貼，無法自動更新 |
| 自建 Vue Dashboard | 完全客製化，可自動掃描 | 需要建置成本 |

**結論：替代方案對「查閱」有幫助，但對「自動掃描 + 健康判斷」無法取代。** Dashboard 的核心差異在於：**scan.js 自動產生資料**，這個自動化是其他工具做不到的。

---

### 挑戰 5-C：有沒有現成工具可以組合？

**找過了，沒有。**

原因：這個工具的需求非常特定——掃描 `~/.claude/` 的特定目錄結構，理解 CLAUDE.md 的意義，計算對應的 context 佔比。沒有任何現成工具理解這個 context。

最接近的工具是「目錄分析工具」（如 `duf`、`ncdu`），但它們不理解 Claude Code 的概念，只能看大小，不能判斷健康狀態。

---

## 本輪的三個關鍵發現

### 關鍵發現一：第一次開啟 Dashboard 就會是紅色警告

這是用實際數據驗證後發現的問題，**計畫完全沒有討論過**。

openclaw/CLAUDE.md 有 2441 字，全域 CLAUDE.md 只有 633 字。根據計畫的健康判斷邏輯：

> 若某個 project.wordCount > globalConfig.wordCount → 狀態：警告（紅）

���一次開啟 Dashboard，看到的是**紅色警告**。使用者的第一印象是「這個工具一開就報錯」。

**這是真正的問題，需要修正。**

有兩種修正方向：

方向 A（改判斷邏輯）：把「專案設定比全域大」的門檻提高。例如改成「專案設定是全域的 5 倍以上才警告」。openclaw 有 2441 字是合理的（這是一個真實專案的詳細設定），比全域大不代表有問題。

方向 B（改觸發條件的說明）：保留判斷邏輯，但在警告訊息裡更清楚說明「為什麼這是問題」。如果使用者看到的是「openclaw 的設定比全域大，可能有重複規則——點此查看」，就不會以為是程式出錯。

**建議採用方向 B**，因為方向 A 是迴避問題，方向 B 是解釋問題。紅色警告沒有錯，錯的是缺少解釋。

---

### 關鍵發現二：scan.js 的 ES Module 問題是「第一天卡關」的真正來源

計畫完全沒有提到這個問題，但它是**工程師打開編輯器的第一行就會遇到的選擇：**

`const fs = require('fs')` 還是 `import fs from 'fs'`？

如果選錯了，執行 `node scan.js` 會報錯。這個報錯的訊息不直觀，新手工程師可能花 30 分鐘在這裡。

**計畫在第 9 節明確要求的指令是：**

```bash
npm create vue@latest .
```

create-vue 產生的 package.json 需要確認是否要加 `"type": "module"`。**建議在計畫裡明確加一行指示：**

> 在 package.json 加入 `"type": "module"` 後再開始寫 scan.js。

---

### 關鍵發現三：「終端機摘要輸出」是計畫遺漏的最高價值功能

不是 Dashboard 的功能，而是 scan.js 執行後在終端機直接輸出 5-8 行狀態摘要。這讓工具的日常使用場景（快速確認）不需要開瀏覽器，大幅提高使用頻率。

成本：在 scan.js 的 `main()` 函式最後加一個 `printSummary(data)` 函式，10-15 行。

---

## 哪些擔心「其實不用擔心」

**1. data.json 太大導致頁面載入慢？**
不用擔心。scan.js 已有截斷邏輯（10,000 bytes 截斷）。手動計算：10 個 CLAUDE.md 各截斷後最多 100KB，68 個 skills 只存 descriptionSnippet（30 個詞），data.json 最多 500KB，瀏覽器在本地讀取不到 50ms。

**2. Skills 篩選效能？**
不用擔心。68 個條目的 Vue computed filter 在任何現代電腦上都是毫秒級。

**3. tokenBudget 被誤覆寫？**
計畫已有 `preserveTokenBudget()` 函式，不用擔心。

**4. 掃描到非預期的 CLAUDE.md？**
實際掃描結果是 10 個，都是合理的。EXCLUDE_DIRS 和 EXCLUDE_PATHS 已排除雜訊路徑。

**5. Plugin 結構不一致（有的沒有 skills/ 子目錄）？**
計畫已有 `if (!fs.existsSync(skillsDir)) continue;` 處理，不用擔心。

---

## 與 Round 7 的差異總結

Round 7 是「最終整合版計畫」，Round 8 沒有推翻它，但發現了三個需要在實作前修正的問題：

| 問題 | Round 7 的狀態 | Round 8 的建議 |
|------|--------------|--------------|
| 第一次開啟就是紅色警告 | 計畫未討論此場景 | 在警告訊息裡加明確說明（「openclaw 設定比全域大，可能有重複規則」），而非只顯示紅色 |
| scan.js 模組格式未指定 | 計畫未提 | 在第 9 節第零步加一行：「在 package.json 加入 `"type": "module"`」 |
| 終端機摘要輸出缺失 | 未列為功能 | 在 scan.js 的 main() 函式結尾加 `printSummary()`，輸出 5-8 行狀態摘要 |
| `npm create vue@latest` 初始化方式 | 用 `mkdir dashboard && cd dashboard && npm create vue@latest .` | 改為 `npm create vue@latest dashboard`，避免空目錄問題 |

**Round 7 的整體設計判斷是正確的。** 技術架構（Vue 3 + scan.js + data.json）、UX 設計（健康燈號三層結構）、MVP 範圍（4 個 Tab）都沒有需要大改的地方。Round 8 的修正是細節層級，不影響架構。

---

## 本輪 Insight：「計畫好但第一次開啟就是紅色」是使用者體驗最脆弱的地方

一個工具的第一印象決定了使用者是否繼續使用。如果第一次開啟 Dashboard 看到的是紅色大字「警告」，使用者的第一反應可能是「這個工具壞了」而不是「我應該去看是哪裡出了問題」。

這個場景的解法不是迴避（把觸發條件改得更寬鬆），而是**把紅色警告的原因說清楚、把下一步說明白**。紅色是對的，但紅色必須配合「因為 X，所以紅色，你應該做 Y」的說明才有意義。

這個 insight 在更廣泛的設計場景也成立：告警系統如果不解釋原因，會比沒有告警系統更糟糕，因為它製造了焦慮但沒有提供解決方向。

---

*本文件由 Claude Sonnet 4.6 撰寫，2026-02-19*
*Round 8 的結論：計畫可以進入實作，但建議在開始前修正三個細節問題。*
