<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DashboardData } from '../types/data'

const props = defineProps<{ data: DashboardData }>()

const search = ref('')

const filteredSkills = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return props.data.skills.files
  return props.data.skills.files.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      (s.descriptionSnippet ?? '').toLowerCase().includes(q)
  )
})

const manualSkills = computed(() =>
  filteredSkills.value.filter((s) => s.source === 'manual')
)

const pluginGroups = computed(() => {
  const plugins = filteredSkills.value.filter((s) => s.source === 'plugin')
  const groups: Record<string, typeof plugins> = {}
  for (const skill of plugins) {
    const key = skill.pluginName || 'unknown'
    if (!groups[key]) groups[key] = []
    groups[key].push(skill)
  }
  return groups
})
</script>

<template>
  <div class="skills-tab">
    <div class="skills-header">
      <input
        v-model="search"
        class="search-input"
        type="text"
        placeholder="搜尋 Skills...（例如 vue、debug、slack）"
      />
      <p class="skills-stats">
        共 {{ data.skills.totalCount }} 個 Skills（手動
        {{ data.skills.manualCount }} + Plugin {{ data.skills.pluginCount }}）
        <template v-if="search.trim()">
          — 找到 {{ filteredSkills.length }} 個結果
        </template>
      </p>
    </div>

    <template v-if="filteredSkills.length === 0 && search.trim()">
      <div class="empty-state">
        找不到符合「{{ search }}」的 Skill。
      </div>
    </template>

    <template v-else-if="data.skills.files.length === 0">
      <div class="empty-state">尚未安裝任何 Skill。</div>
    </template>

    <template v-else>
      <!-- Manual skills -->
      <div v-if="manualSkills.length > 0" class="skill-group">
        <h3 class="group-title">手動安裝</h3>
        <div class="skill-list">
          <div v-for="skill in manualSkills" :key="skill.path" class="card skill-card">
            <div class="skill-top">
              <span class="skill-name">{{ skill.name }}</span>
              <span class="badge badge-manual">手動安裝</span>
            </div>
            <p v-if="skill.descriptionSnippet" class="skill-desc">
              {{ skill.descriptionSnippet }}
            </p>
            <span v-if="skill.wordCount" class="skill-wc">
              {{ skill.wordCount.toLocaleString('zh-TW') }} 字
            </span>
          </div>
        </div>
      </div>

      <!-- Plugin groups -->
      <div
        v-for="(skills, pluginName) in pluginGroups"
        :key="pluginName"
        class="skill-group"
      >
        <h3 class="group-title">{{ pluginName }} plugin</h3>
        <div class="skill-list">
          <div v-for="skill in skills" :key="skill.path" class="card skill-card">
            <div class="skill-top">
              <span class="skill-name">{{ skill.name }}</span>
              <span class="badge badge-plugin">Plugin</span>
            </div>
            <p v-if="skill.descriptionSnippet" class="skill-desc">
              {{ skill.descriptionSnippet }}
            </p>
            <span v-if="skill.wordCount" class="skill-wc">
              {{ skill.wordCount.toLocaleString('zh-TW') }} 字
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.skills-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.skills-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  background: var(--color-bg);
  color: var(--color-text);
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--color-ok);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.skills-stats {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.skill-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.skill-card {
  padding: var(--space-md);
}

.skill-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skill-name {
  font-weight: 600;
  font-size: 14px;
}

.skill-desc {
  margin-top: var(--space-xs);
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.skill-wc {
  display: inline-block;
  margin-top: var(--space-xs);
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
