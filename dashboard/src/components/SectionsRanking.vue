<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardData } from '../types/data'

const props = defineProps<{ data: DashboardData }>()

const topSections = computed(() => {
  const sections = [...props.data.globalConfig.sections]
    .sort((a, b) => b.wordCount - a.wordCount)
    .slice(0, 3)

  const total = props.data.globalConfig.totalWordCount
  return sections.map((s, i) => ({
    rank: i + 1,
    heading: s.heading,
    wordCount: s.wordCount,
    percentage: total > 0 ? ((s.wordCount / total) * 100).toFixed(1) : '0',
  }))
})
</script>

<template>
  <div class="card">
    <h3 class="section-title">最重區塊排行</h3>
    <div v-if="topSections.length === 0" class="empty-hint">
      無章節資料
    </div>
    <div v-else class="ranking-list">
      <div v-for="item in topSections" :key="item.rank" class="ranking-item">
        <span class="rank-circle">{{ item.rank }}</span>
        <div class="rank-info">
          <span class="rank-name">{{ item.heading }}</span>
          <span class="rank-stats">
            {{ item.wordCount.toLocaleString('zh-TW') }} 字（佔
            {{ item.percentage }}%）
          </span>
        </div>
        <span
          v-if="parseFloat(item.percentage) > 15"
          class="rank-hint"
          title="這個區塊較大，可考慮移到參考文件"
        >
          較大
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: var(--space-md);
  color: var(--color-text);
}

.empty-hint {
  color: var(--color-text-muted);
  font-size: 14px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.ranking-item:last-child {
  border-bottom: none;
}

.rank-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-bg-mute);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.rank-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rank-name {
  font-size: 14px;
  font-weight: 500;
}

.rank-stats {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.rank-hint {
  font-size: 11px;
  padding: 2px 6px;
  background: var(--color-warn-bg);
  color: var(--color-warn-text);
  border-radius: var(--radius-sm);
  cursor: help;
}
</style>
