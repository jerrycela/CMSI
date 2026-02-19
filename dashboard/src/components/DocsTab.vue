<script setup lang="ts">
import type { DashboardData } from '../types/data'

defineProps<{ data: DashboardData }>()
</script>

<template>
  <div class="docs-tab">
    <p class="docs-stats">
      共 {{ data.docs.files.length }} 個參考文件，合計
      {{ data.docs.totalWordCount.toLocaleString('zh-TW') }} 字
    </p>

    <template v-if="data.docs.files.length > 0">
      <div class="docs-list">
        <div v-for="doc in data.docs.files" :key="doc.path" class="card doc-card">
          <div class="doc-top">
            <span class="doc-name">{{ doc.name }}</span>
            <span class="doc-wc">
              {{ doc.wordCount.toLocaleString('zh-TW') }} 字 /
              {{ doc.estimatedTokens.toLocaleString('zh-TW') }} tokens
            </span>
          </div>
          <p v-if="doc.descriptionSnippet" class="doc-desc">
            {{ doc.descriptionSnippet }}
          </p>
          <p class="doc-path">{{ doc.path }}</p>
        </div>
      </div>
    </template>

    <div v-else class="empty-state">
      <p>目前沒有參考文件。docs/ 目錄為空。</p>
    </div>
  </div>
</template>

<style scoped>
.docs-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.docs-stats {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.docs-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.doc-card {
  padding: var(--space-md);
}

.doc-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.doc-name {
  font-weight: 600;
  font-size: 14px;
}

.doc-wc {
  font-size: 12px;
  color: var(--color-text-muted);
}

.doc-desc {
  margin-top: var(--space-xs);
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.doc-path {
  margin-top: var(--space-xs);
  font-size: 12px;
  color: var(--color-text-muted);
  font-family: 'SF Mono', SFMono-Regular, Consolas, monospace;
}
</style>
