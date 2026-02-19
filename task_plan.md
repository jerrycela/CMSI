# Task Plan: CMSI — Claude MD Self-Iteration Dashboard

## Goal

建立一個 Vue 3 網頁 Dashboard，視覺化管理 CLAUDE.md 的自我迭代流程，涵蓋 Token 預算分析、規則使用頻率、優化歷史追蹤、Skills 管理四大功能。

## Current Phase

Phase 2

## Phases

### Phase 1: Requirements & Discovery
- [x] 盤點現有基礎設施（claude-log CLI、auto-analyze 腳本、檔案結構）
- [x] 分析 claude-log 的輸出格式和可用指令
- [x] 確認 CLAUDE.md + docs/ + skills/ 的結構與 token 計算方式
- [x] 定義四大功能的資料模型
- [x] 記錄發現到 findings.md
- **Status:** complete

### Phase 2: Project Scaffolding
- [ ] 初始化 Vue 3 + Vite + TypeScript 前端專案
- [ ] 設定 Express + TypeScript 後端
- [ ] 建立 monorepo 結構（packages/frontend + packages/backend）
- [ ] 設定 ESLint、Prettier
- [ ] 建立專案 CLAUDE.md
- [ ] 初始 commit 推送到 GitHub
- **Status:** pending

### Phase 3: Backend API
- [ ] Token 分析 API — 計算各檔案/區塊的 token 數
- [ ] 規則使用頻率 API — 解析 session log 中的 Read tool 調用
- [ ] 優化歷史 API — 解析 git diff 記錄 + cron log
- [ ] Skills 管理 API — 掃描已安裝 skills + 使用統計
- [ ] API 測試
- **Status:** pending

### Phase 4: Frontend Dashboard
- [ ] Dashboard 整體佈局（sidebar + 主要內容區）
- [ ] Token 預算分析頁面（圓餅圖/樹狀圖）
- [ ] 規則使用頻率頁面（長條圖 + 熱力圖）
- [ ] 優化歷史追蹤頁面（時間軸 + diff 檢視）
- [ ] Skills 管理頁面（卡片列表 + 使用統計）
- **Status:** pending

### Phase 5: Integration & Testing
- [ ] 前後端連接與聯調
- [ ] 單元測試（Vitest）
- [ ] E2E 測試（關鍵流程）
- [ ] 錯誤處理與邊界情況
- **Status:** pending

### Phase 6: Delivery
- [ ] 建置腳本與啟動說明
- [ ] 推送到 GitHub
- [ ] 推送成果到 Heptabase
- [ ] 更新全域 CLAUDE.md 整合說明
- **Status:** pending

## Key Questions

1. claude-log 能提供哪些具體的 session 資料格式？
2. Token 計算用什麼工具？（tiktoken / 自製分詞器 / Claude API）
3. 前端圖表庫選擇？（ECharts / Chart.js / D3）
4. 是否需要即時監控（WebSocket）還是手動刷新就好？
5. 後端是否整合到現有 ProgressHub，還是獨立專案？

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| 獨立專案（非整合到 ProgressHub） | 用途不同，避免專案耦合 |
| Vue 3 + Vite + TypeScript | 與使用者主要技術棧一致 |
| Express 後端 | 輕量且使用者熟悉 |
| Monorepo 結構 | 前後端統一管理，便於開發 |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
|       | 1       |            |

## Notes

- 使用者為非工程師背景，Dashboard UI 要直覺易用
- 現有 auto-analyze-and-update-claude-md.sh 每天凌晨 3 點執行
- claude-log CLI 位於 ~/.local/bin/claude-log
- 全域 CLAUDE.md 已改為精簡版 + docs 路由表架構
