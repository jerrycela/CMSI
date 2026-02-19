<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DashboardData } from './types/data'
import OverviewTab from './components/OverviewTab.vue'
import ProjectsTab from './components/ProjectsTab.vue'
import SkillsTab from './components/SkillsTab.vue'
import DocsTab from './components/DocsTab.vue'

const data = ref<DashboardData | null>(null)
const error = ref<string | null>(null)
const activeTab = ref<string>('overview')

const tabs = [
  { key: 'overview', label: '總覽' },
  { key: 'projects', label: '指令設定' },
  { key: 'skills', label: 'Skills' },
  { key: 'docs', label: '參考文件' },
]

onMounted(async () => {
  try {
    const res = await fetch('/data.json')
    if (!res.ok) throw new Error(`載入失敗 (${res.status})`)
    data.value = await res.json()
  } catch (e: any) {
    error.value = e.message || '無法載入資料'
  }
})
</script>

<template>
  <div v-if="error" class="error-state">
    <p>{{ error }}</p>
    <p style="margin-top: 8px; font-size: 13px;">
      請確認已執行 <code>npm run scan</code> 產生 data.json
    </p>
  </div>

  <div v-else-if="!data" class="loading">載入中...</div>

  <template v-else>
    <nav class="tab-nav">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </nav>

    <OverviewTab v-if="activeTab === 'overview'" :data="data" />
    <ProjectsTab v-else-if="activeTab === 'projects'" :data="data" />
    <SkillsTab v-else-if="activeTab === 'skills'" :data="data" />
    <DocsTab v-else-if="activeTab === 'docs'" :data="data" />
  </template>
</template>
