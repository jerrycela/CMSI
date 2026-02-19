<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardData } from '../types/data'

const props = defineProps<{ data: DashboardData }>()

const percentage = computed(() => {
  const threshold = props.data.tokenBudget?.warningThreshold || 40000
  return ((props.data.globalConfig.estimatedTokens / threshold) * 100).toFixed(1)
})

const progressColor = computed(() => {
  const pct = parseFloat(percentage.value)
  if (pct > 20) return 'var(--color-alert)'
  if (pct > 15) return 'var(--color-warn)'
  return 'var(--color-ok)'
})

const biggestProject = computed(() => {
  const projects = props.data.allProjects.filter((p) => p.wordCount !== null)
  if (projects.length === 0) return null
  return projects.sort((a, b) => (b.wordCount ?? 0) - (a.wordCount ?? 0))[0]
})
</script>

<template>
  <div class="cards-grid">
    <div class="card">
      <div class="card-label">全域指令檔</div>
      <div class="card-number">
        {{ data.globalConfig.wordCount.toLocaleString('zh-TW') }}
        <span class="card-unit">字</span>
      </div>
      <div class="card-sub">佔對話額度約 {{ percentage }}%</div>
      <div class="progress-track">
        <div
          class="progress-bar"
          :style="{
            width: Math.min(parseFloat(percentage) * 5, 100) + '%',
            background: progressColor,
          }"
        />
      </div>
    </div>

    <div class="card">
      <div class="card-label">已安裝 Skills</div>
      <div class="card-number">{{ data.skills.totalCount }}</div>
      <div class="card-sub">
        手動 {{ data.skills.manualCount }} 個 + Plugin
        {{ data.skills.pluginCount }} 個
      </div>
    </div>

    <div class="card">
      <div class="card-label">指令設定檔</div>
      <div class="card-number">{{ data.allProjects.length }}</div>
      <div class="card-sub">
        <template v-if="biggestProject">
          最大的：{{ biggestProject.projectName }}（{{
            (biggestProject.wordCount ?? 0).toLocaleString('zh-TW')
          }}
          字）
        </template>
        <template v-else>尚無專案設定</template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
}

.card-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}

.card-number {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.2;
}

.card-unit {
  font-size: 16px;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.card-sub {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: var(--space-xs);
}

.progress-track {
  margin-top: var(--space-sm);
  height: 6px;
  background: var(--color-bg-mute);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}
</style>
