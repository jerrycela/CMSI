# Findings & Decisions — CMSI Phase 1 Discovery Report

## Requirements

- **Token 預算分析**：顯示 CLAUDE.md + docs/ + skills/ 各檔案/區塊佔用的 token 數，找出最肥的部分
- **規則使用頻率**：分析 session log 中哪些 docs 檔案實際被 Claude 讀取，哪些從沒用到
- **優化歷史追蹤**：追蹤每次 CLAUDE.md 的修改（備份 diff）、cron job 的執行結果、前後對比
- **Skills 管理**：列出已安裝 skills、使用頻率、推薦新 skill
- **Web Dashboard**：Vue 3 網頁介面，有圖表、互動操作
- **使用者為非工程師**：UI 需直覺、用語淺顯

---

## 一、claude-log CLI 完整分析

### 基本資訊

- 路徑：`~/.local/bin/claude-log`（2.9 MB 獨立執行檔）
- 資料來源：`~/.claude/projects/<project-key>/*.jsonl`

### 可用指令與格式支援

| 指令 | JSON 支援 | 說明 |
|------|-----------|------|
| `sessions list` | 支援 | 列出所有 session，含 sessionId、日期、訊息數、工具數、大小 |
| `sessions show <id>` | 支援 | Session 詳情 |
| `sessions messages <id>` | 支援（但 toolUses.input 永遠是 null） | 全部訊息 |
| `sessions tools [<id>]` | **不支援** | 只有 table 格式的工具計數 |
| `sessions search <query>` | **不支援** | 只有 table 格式 |
| `projects list` | **不支援** | 只有 table 格式 |

### sessions list JSON 格式

```json
{
  "sessionId": "04cd1a31-b823-4319-9463-8dda199ebc09",
  "gitBranch": "",
  "firstPrompt": "hi",
  "created": "2026-02-03T10:05:13.32+08:00",
  "modified": "2026-02-03T02:22:23.3518225Z",
  "userMessageCount": 30,
  "assistantMessageCount": 62,
  "toolUseCount": 18,
  "fileSizeBytes": 284067,
  "projectPath": "/Users/admin"
}
```

### sessions messages JSON 格式

```json
{
  "role": "assistant",
  "content": "...",
  "timestamp": "2026-02-03T10:05:16.138+08:00",
  "model": "claude-opus-4-5-20251101",
  "toolUses": [{ "name": "Bash", "input": null }]
}
```

**關鍵限制**：`toolUses[].input` 永遠是 `null`，無法透過 claude-log 取得 Read 工具讀取了哪些檔案。

### 取得 Read 檔案路徑的替代方案

必須直接解析原始 JSONL（`~/.claude/projects/<project-key>/*.jsonl`），讀取 `message.content[].input.file_path`：

```json
{
  "type": "tool_use",
  "name": "Read",
  "input": {
    "file_path": "/Users/admin/ProjectCircle/src/phases/battle-phase.ts",
    "offset": 2590,
    "limit": 80
  }
}
```

### API 設計影響

- Session 列表和詳情：直接用 `claude-log --format json`
- 工具統計：需自行解析 claude-log table 輸出或直接讀 JSONL
- Read 逐檔案統計（規則使用頻率的核心需求）：**必須直接解析 JSONL**

---

## 二、auto-analyze-and-update-claude-md.sh 分析

### 腳本資訊

- 路徑：`~/.local/bin/auto-analyze-and-update-claude-md.sh`
- 版本：v1.4
- Cron：每天凌晨 3 點執行
- 硬編碼 6 個專案路徑：global、progresshub、openclawfortest、dc-combat、projectcircle、projectdk

### 4 階段工作流程

1. **分析所有專案對話歷史** → 對每個專案跑 `claude-log sessions list/tools/search`，結果存到 `~/claude-md-analysis/<TIMESTAMP>/<project>/analysis.txt`
2. **生成 Claude Team 優化建議** → 建立 `team-task.md` 但不自動執行（需互動環境）
3. **備份現有 CLAUDE.md** → 存到 `~/claude-md-backups/<TIMESTAMP>/`
4. **儲存待推送報告** → 存到 `~/claude-md-auto-update-logs/pending-heptabase-report.md`

### 日誌結構

每次執行產生：

```
~/claude-md-auto-update-logs/<TIMESTAMP>/
├── main.log      ← 原始執行流程（含 ANSI 顏色碼）
└── summary.log   ← 結構化 Markdown 摘要報告
```

**summary.log 格式範例**：

```markdown
# Claude Code CLAUDE.md 自動優化執行報告
執行時間：2026年 2月19日

## 各專案分析摘要

### global
**Sessions**: 29 sessions, 4519 total user messages
**工具使用**: 4030 total tool uses across 29 session(s)
**Top 5 工具**: Read(1211) Bash(799) Edit(786) Grep(299) Task(188)
**重複提醒**: 發現 29 條
**錯誤記錄**: 發現 244 條
```

### 備份歷史

`~/claude-md-backups/` 共 11 個時間點（2026-02-14 至今），每個含 6 個專案的 CLAUDE.md 快照。

### 已知問題

**重複計數 Bug**：dc-combat、projectcircle、projectdk 的路徑不存在時，claude-log fallback 讀取全域 .claude 目錄，導致統計數字重複。全域報告的 185 sessions / 22,152 工具調用存在嚴重膨脹。

### 變更追蹤方式

**~/.claude/ 不是 git 倉庫**，無法用 git diff。只能透過備份比較追蹤變更。

---

## 三、檔案結構與 Token 分析

### 目錄樹

```
~/.claude/
├── CLAUDE.md                 ← 主設定檔（597 words / 6,304 bytes / ~5.6k tokens）
├── CLAUDE.md.bak             ← 舊版備份（1,104 words / 13,320 bytes）
├── docs/                     ← 條件式參考手冊（按需讀取）
│   ├── agents.md       229w / 2,233B
│   ├── hooks.md        195w / 1,396B
│   ├── coding-style.md 156w / 1,337B
│   ├── patterns.md     138w / 1,156B
│   ├── integrations.md 132w / 1,954B
│   ├── performance.md  124w / 1,193B
│   ├── git-workflow.md 118w / 1,152B
│   ├── planning.md     114w / 1,417B
│   ├── security.md     106w /   898B
│   └── testing.md       95w / 1,073B
│   合計：1,407 words / 13,809 bytes / ~1,830 tokens
├── rules/                    ← 空目錄（已遷移到 docs/）
├── skills/                   ← 22 個 symlinks + 3 個真實檔案
│   ├── [22 symlinks → ~/.agents/skills/]
│   ├── excalidraw-mcp/       ← 真實目錄（410w / 3,121B）
│   ├── fetch-slack-messages.md  ← 真實 .md（8,831B）
│   └── weekly-report-auto.md   ← 真實 .md（16,315B）
└── settings.json             ← hooks / plugins 設定

~/.agents/skills/             ← 24 個技能真實目錄
```

### Token 預算（每次對話自動載入）

根據 /context 指令的實際數據：

| 類別 | Tokens | 佔比 |
|------|--------|------|
| System prompt | 3,300 | 1.6% |
| System tools | 20,000 | 10.0% |
| MCP tools | 137 | 0.1% |
| Custom agents | 247 | 0.1% |
| **Memory files**（CLAUDE.md + rules/） | **8,200** | **4.1%** |
| Skills（frontmatter 摘要） | 1,700 | 0.8% |
| **自動載入小計** | **~33,600** | **16.8%** |
| Messages（對話內容） | 38,700 | 19.4% |
| **已使用總計** | **73,000** | **37%** |
| 空閒空間 | 95,000 | 47.4% |
| Autocompact buffer | 33,000 | 16.5% |

**重要發現**：雖然 CLAUDE.md 已精簡到 ~5.6k tokens，但 `rules/` 目錄的 8 個舊檔案**仍然被自動載入**（顯示在 Memory files 8.2k 中）。這表示 rules/ 檔案雖然在 system-reminder 中顯示的路徑是舊版，但 Claude Code 仍把它們當作 rules/ 載入。需要確認 docs/ 是否也同步被載入，或只是按需讀取。

### Skills Token 重量排名（按需載入，非常駐）

| 排名 | Skill | 字數 | 估算 Tokens | 附加檔案 |
|------|-------|------|-------------|---------|
| 1 | vueuse-functions | 3,659 | 4,757 | — |
| 2 | nodejs-backend-patterns | 2,832 | 3,682 | — |
| 3 | algorithmic-art | 2,763 | 3,592 | — |
| 4 | typescript-advanced-types | 2,380 | 3,094 | — |
| 5 | vue-best-practices | 2,066 | 2,686 | — |
| 6 | code-review-excellence | 1,987 | 2,583 | — |
| 7 | shadertoy | 1,857 | 2,414 | — |
| 8 | vue-debug-guides | 1,685 | 2,191 | — |
| 9 | e2e-testing-patterns | 1,599 | 2,079 | — |
| 10 | bash-defensive-patterns | 1,591 | 2,068 | — |
| 11 | api-design-principles | 1,513 | 1,967 | — |
| 12 | pdf | 1,008 | 1,310 | +reference.md(1,893w) +forms.md(1,649w) = +4,602t |
| 13 | mcp-builder | 1,143 | 1,486 | — |
| 14 | performance | 1,078 | 1,401 | — |
| 15 | fixing-motion-performance | 832 | 1,082 | — |
| 16 | code-review-expert | 786 | 1,022 | — |
| 17 | find-skills | 712 | 926 | — |
| 18 | webapp-testing | 501 | 651 | — |
| 19 | excalidraw-mcp | 410 | 533 | — |
| 20 | vitest | 395 | 514 | — |
| 21 | pinia | 317 | 412 | — |
| 22 | ui-animation | 316 | 411 | +examples.md(673w) = +875t |
| 23 | vite | 315 | 410 | — |

---

## 四、技術決策

| 決策 | 理由 |
|------|------|
| 後端直接解析 JSONL 而非只靠 claude-log | claude-log 不提供 Read 工具的 file_path，也不支援 tools 的 JSON 格式 |
| 備份 diff 做變更追蹤（非 git diff） | ~/.claude/ 不是 git 倉庫，只能比對 ~/claude-md-backups/ 的快照 |
| Token 計算用 tiktoken 或 wc -w × 1.3 | 與 /context 指令的數據交叉驗證 |
| 獨立專案（非整合到 ProgressHub） | 用途不同，避免耦合 |
| Vue 3 + Vite + TypeScript 前端 | 使用者主要技術棧 |
| Express + TypeScript 後端 | 輕量且使用者熟悉 |

---

## 五、已知問題與風險

| 問題 | 影響 | 建議 |
|------|------|------|
| claude-log tools 指令不支援 JSON | 需自行解析 table 或直接讀 JSONL | 直接讀 JSONL |
| claude-log messages 的 toolUses.input 永遠是 null | 無法用 claude-log 取得 Read 的檔案路徑 | 直接讀 JSONL |
| auto-analyze 腳本有重複計數 bug | 全域統計數字膨脹（185→實際可能只有 70-80） | Dashboard 需自行去重 |
| ~/.claude/ 不是 git 倉庫 | 無法用 git diff 追蹤變更 | 用備份快照比對 |
| rules/ 可能仍在被自動載入 | 佔用不必要的 token | 需驗證並清理 |

---

## Resources

- GitHub Repo: https://github.com/jerrycela/CMSI
- claude-log CLI: `~/.local/bin/claude-log`
- auto-analyze script: `~/.local/bin/auto-analyze-and-update-claude-md.sh`（v1.4）
- Session JSONL: `~/.claude/projects/<project-key>/*.jsonl`
- Cron logs: `~/claude-md-auto-update-logs/<TIMESTAMP>/`（main.log + summary.log）
- Backups: `~/claude-md-backups/<TIMESTAMP>/`（11 個快照）
- Analysis data: `~/claude-md-analysis/<TIMESTAMP>/<project>/analysis.txt`
- CLAUDE.md: `~/.claude/CLAUDE.md`
- Docs: `~/.claude/docs/`（10 個檔案）
- Rules: `~/.claude/rules/`（空目錄）
- Skills: `~/.claude/skills/` + `~/.agents/skills/`

---
*Phase 1 Discovery 完成於 2026-02-19*
