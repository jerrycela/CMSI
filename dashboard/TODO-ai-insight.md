# AI Insight 功能需求

## 目標

每次 cron 執行記錄自動產生一段 AI 總結的洞察，顯示在展開的卡片中。

## 前置條件

- 環境變數 `ANTHROPIC_API_KEY` 必須可用（scan.js 執行時讀取）
- 已安裝 `@anthropic-ai/sdk`（已加入 package.json）

## 修改檔案

### 1. `src/types/data.ts`

CronRun 介面新增：

```ts
insight?: string
```

### 2. `scan.js`

新增 import：

```js
import Anthropic from '@anthropic-ai/sdk';
```

新增函式 `generateInsight(run)`：

- 輸入：一個 CronRun 物件（含 projects、globalStats、status 等）
- 輸出：一段 2-3 句繁體中文洞察
- 模型：`claude-haiku-4-5`（便宜、快速，每次 scan 會呼叫多次）
- Prompt 重點：
  - 比較各專案的工具使用量、錯誤數、提醒數
  - 指出異常值（錯誤 > 200、某專案工具使用量特別高等）
  - 給出可操作建議
- 若 run.status === 'failed' 或 projects 為空，跳過不生成

快取機制：

- scan 開始前讀取現有 data.json
- 若某 run 已有 insight，不重新生成
- 這樣每次 scan 只會為新增的 run 呼叫 API

容錯：

- 若 ANTHROPIC_API_KEY 未設定，跳過所有 insight 生成（console.warn 提示）
- 若單次 API 呼叫失敗，該 run 的 insight 留空，不影響其他 run

整合到 scanCronHistory()：

```
1. 讀取現有 data.json 中的 cronHistory.runs（取得已快取的 insights）
2. 掃描所有 run（現有邏輯不變）
3. 對每個有 projects 資料但沒有 insight 的 run，呼叫 generateInsight()
4. 回傳完整結果
```

### 3. `src/components/CronHistoryTab.vue`

在展開區塊中，global-stats 下方、project-table 上方，新增：

```html
<p v-if="run.insight" class="run-insight">{{ run.insight }}</p>
```

樣式：

```css
.run-insight {
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-bg-soft);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-ok);
  margin-bottom: var(--space-md);
  line-height: 1.6;
}
```

## Prompt 範本

```
你是一位 DevOps 分析師。以下是一次 Claude Code 自動分析的執行結果。
請用繁體中文寫 2-3 句洞察，指出最值得注意的發現和建議。
不要重複數據本身，要給出解讀和可操作建議。

執行時間：{timestamp}
狀態：{status}

各專案統計：
{projects 列表，含 name/sessions/toolUses/errors/reminders}

全域統計：
{globalStats}
```

## 驗證

1. 設定 ANTHROPIC_API_KEY 後跑 `npm run scan`，確認新 run 有 insight
2. 再跑一次 `npm run scan`，確認已有 insight 的 run 不重新生成（看 console 無重複 API 呼叫）
3. 移除 ANTHROPIC_API_KEY 跑 `npm run scan`，確認不報錯、insight 欄位為空
4. 確認 UI 中 insight 文字正常顯示在展開區塊中
