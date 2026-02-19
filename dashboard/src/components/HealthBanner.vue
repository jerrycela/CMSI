<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DashboardData } from '../types/data'

const props = defineProps<{ data: DashboardData }>()

const healthStatus = computed(() => {
  const { globalConfig, docs, allProjects, healthThresholds } = props.data
  const totalWords =
    globalConfig.totalWordCount +
    docs.totalWordCount +
    allProjects.reduce((sum, p) => sum + (p.wordCount ?? 0), 0)

  const biggerProjects = allProjects.filter(
    (p) => (p.wordCount ?? 0) > globalConfig.wordCount
  )

  const reasons: string[] = []
  let status: 'ok' | 'warn' | 'alert' = 'ok'

  if (
    totalWords > healthThresholds.totalWordCountAlert ||
    biggerProjects.length > 0
  ) {
    status = 'alert'
    if (biggerProjects.length > 0) {
      const biggest = biggerProjects.sort(
        (a, b) => (b.wordCount ?? 0) - (a.wordCount ?? 0)
      )[0]
      const ratio = ((biggest.wordCount ?? 0) / globalConfig.wordCount).toFixed(1)
      reasons.push(
        `${biggest.projectName} 設定（${(biggest.wordCount ?? 0).toLocaleString('zh-TW')} 字）比全域（${globalConfig.wordCount.toLocaleString('zh-TW')} 字）大 ${ratio} 倍，可能有重複規則——建議打開「指令設定」Tab 比對`
      )
    }
    if (totalWords > healthThresholds.totalWordCountAlert) {
      reasons.push(
        `所有設定合計超過 ${healthThresholds.totalWordCountAlert.toLocaleString('zh-TW')} 字，佔對話額度較大比例，建議刪減不常用的規則`
      )
    }
  } else if (globalConfig.wordCount > healthThresholds.globalWordCountWarning) {
    status = 'warn'
    reasons.push(
      `全域指令檔超過 ${healthThresholds.globalWordCountWarning.toLocaleString('zh-TW')} 字，可考慮將部分規則移到按需載入的參考文件`
    )
  }

  if (staleHours.value >= healthThresholds.dataStaleHoursWarning) {
    if (status === 'ok') status = 'warn'
    reasons.push('資料已過時，建議重新掃描')
  }

  return { status, reasons }
})

const staleHours = computed(() => {
  const generated = new Date(props.data.meta.generatedAt).getTime()
  return (Date.now() - generated) / (1000 * 60 * 60)
})

const freshness = computed(() => {
  const minutes = staleHours.value * 60
  if (minutes < 1) return '剛剛'
  if (minutes < 60) return `${Math.floor(minutes)} 分鐘前`
  if (staleHours.value < 24)
    return `${Math.floor(staleHours.value)} 小時前`
  return `${Math.floor(staleHours.value / 24)} 天前`
})

const statusLabel = computed(() => {
  const map = { ok: '正常', warn: '注意', alert: '警告' }
  return map[healthStatus.value.status]
})

const statusColor = computed(() => {
  const map = { ok: '#16a34a', warn: '#ca8a04', alert: '#dc2626' }
  return map[healthStatus.value.status]
})

const copied = ref(false)
function copyScanCommand() {
  navigator.clipboard.writeText(
    'cd "/Users/admin/_dev-tools/claude-code/Claude md 自我迭代專案/dashboard" && npm run scan'
  )
  copied.value = true
  setTimeout(() => (copied.value = false), 3000)
}
</script>

<template>
  <div class="banner" :style="{ background: statusColor }">
    <div class="banner-main">
      <span class="banner-status">現在狀態：{{ statusLabel }}</span>
      <span class="banner-time">掃描於 {{ freshness }}</span>
    </div>
    <div v-if="healthStatus.reasons.length" class="banner-reasons">
      <p v-for="(reason, i) in healthStatus.reasons" :key="i">{{ reason }}</p>
    </div>
  </div>

  <div v-if="staleHours >= 24" class="stale-warning">
    <p>資料已超過 24 小時未更新，建議重新掃描後重新整理頁面。</p>
    <button class="copy-btn" @click="copyScanCommand">
      {{ copied ? '已複製！' : '複製更新指令' }}
    </button>
    <p v-if="copied" class="copy-hint">
      在終端機貼上指令並按 Enter，完成後重新整理此頁面。
    </p>
  </div>
</template>

<style scoped>
.banner {
  border-radius: var(--radius-lg);
  padding: var(--space-lg) var(--space-xl);
  color: #fff;
}

.banner-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.banner-status {
  font-size: 20px;
  font-weight: 700;
}

.banner-time {
  font-size: 13px;
  opacity: 0.9;
}

.banner-reasons {
  margin-top: var(--space-sm);
  font-size: 14px;
  opacity: 0.95;
  line-height: 1.5;
}

.banner-reasons p + p {
  margin-top: var(--space-xs);
}

.stale-warning {
  margin-top: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--color-warn-bg);
  border: 1px solid var(--color-warn);
  border-radius: var(--radius-md);
  color: var(--color-warn-text);
  font-size: 14px;
}

.copy-btn {
  margin-top: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  border: 1px solid var(--color-warn);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--color-warn-text);
  cursor: pointer;
  font-size: 13px;
}

.copy-btn:hover {
  background: var(--color-warn-bg);
}

.copy-hint {
  margin-top: var(--space-xs);
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
