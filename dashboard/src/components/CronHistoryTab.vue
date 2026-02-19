<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DashboardData } from '../types/data'

const props = defineProps<{ data: DashboardData }>()

const expanded = ref<Set<string>>(new Set())

const runs = computed(() => props.data.cronHistory.runs)
const latestRun = computed(() => runs.value[0] || null)

function toggle(folderName: string) {
  if (expanded.value.has(folderName)) {
    expanded.value.delete(folderName)
  } else {
    expanded.value.add(folderName)
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

function statusLabel(run: any): string {
  if (run.status === 'success') return '成功'
  if (run.status === 'partial') return '部分完成'
  return '失敗'
}

function statusClass(run: any): string {
  if (run.status === 'success') return 'dot-ok'
  if (run.status === 'partial') return 'dot-warn'
  return 'dot-alert'
}
</script>

<template>
  <div class="cron-tab">
    <!-- Top stats summary -->
    <p class="cron-stats">
      共 {{ data.cronHistory.totalRuns }} 次執行
      <template v-if="latestRun">
        ，最近一次：{{ formatTime(latestRun.timestamp) }}（{{ statusLabel(latestRun) }}）
      </template>
    </p>

    <!-- Run list -->
    <div
      v-for="run in runs"
      :key="run.folderName"
      class="card run-item"
      @click="toggle(run.folderName)"
    >
      <!-- Header row (always visible) -->
      <div class="run-header">
        <span class="status-dot" :class="statusClass(run)"></span>
        <span class="run-time">{{ formatTime(run.timestamp) }}</span>
        <span
          class="badge"
          :class="run.runType === 'scheduled' ? 'badge-plugin' : 'badge-manual'"
        >
          {{ run.runType === 'scheduled' ? '排程' : '手動' }}
        </span>
        <span class="run-status-text" :class="statusClass(run)">{{ statusLabel(run) }}</span>
      </div>

      <!-- Expanded content -->
      <div v-if="expanded.has(run.folderName)" class="run-detail" @click.stop>

        <!-- Fail reason if any -->
        <p v-if="run.failReason" class="fail-reason">{{ run.failReason }}</p>

        <!-- Global stats -->
        <div v-if="run.globalStats" class="global-stats">
          分析 {{ run.globalStats.projectCount }} 個專案，
          共 {{ run.globalStats.totalSessions }} sessions，
          {{ run.globalStats.totalToolUses.toLocaleString() }} 次工具調用
        </div>

        <p v-if="run.insight" class="run-insight">{{ run.insight }}</p>

        <!-- Project stats table -->
        <table v-if="run.projects.length > 0" class="project-table">
          <thead>
            <tr>
              <th>專案</th><th>Sessions</th><th>訊息</th>
              <th>工具</th><th>提醒</th><th>錯誤</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in run.projects" :key="p.name">
              <td>{{ p.name }}</td>
              <td>{{ p.sessions }}</td>
              <td>{{ p.userMessages.toLocaleString() }}</td>
              <td>{{ p.toolUses.toLocaleString() }}</td>
              <td>{{ p.repeatedReminders }}</td>
              <td :class="{ 'high-errors': p.errors > 100 }">{{ p.errors }}</td>
            </tr>
          </tbody>
        </table>

        <!-- No data message for old format / partial runs -->
        <p v-if="run.projects.length === 0 && !run.failReason" class="no-detail">
          此次執行使用舊版格式，無法顯示詳細統計。
        </p>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="runs.length === 0" class="empty-state">
      <p>目前還沒有自動執行記錄。</p>
      <p style="margin-top: 8px; font-size: 13px;">
        排程首次執行後，結果會顯示在這裡。
      </p>
    </div>
  </div>
</template>

<style scoped>
.cron-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.cron-stats {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
}

.run-item {
  cursor: pointer;
  transition: border-color 0.2s;
}

.run-item:hover {
  border-color: var(--color-border-hover);
}

.run-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-ok { background: var(--color-ok); }
.dot-warn { background: var(--color-warn); }
.dot-alert { background: var(--color-alert); }

.run-time {
  font-weight: 600;
  font-size: 15px;
}

.run-status-text {
  font-size: 13px;
  margin-left: auto;
}

.run-status-text.dot-ok { background: none; color: var(--color-ok-text); }
.run-status-text.dot-warn { background: none; color: var(--color-warn-text); }
.run-status-text.dot-alert { background: none; color: var(--color-alert-text); }

.run-detail {
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
  cursor: default;
}

.fail-reason {
  background: var(--color-alert-bg);
  color: var(--color-alert-text);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  font-size: 13px;
  margin-bottom: var(--space-md);
}

.global-stats {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-md);
}

.project-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.project-table th {
  text-align: left;
  padding: var(--space-xs) var(--space-sm);
  border-bottom: 2px solid var(--color-border);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.project-table td {
  padding: var(--space-xs) var(--space-sm);
  border-bottom: 1px solid var(--color-border);
}

.high-errors {
  color: var(--color-alert-text);
  font-weight: 600;
}

.no-detail {
  font-size: 14px;
  color: var(--color-text-muted);
  font-style: italic;
}

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
</style>
