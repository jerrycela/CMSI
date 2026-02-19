<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DashboardData } from '../types/data'

const props = defineProps<{ data: DashboardData }>()

const expanded = ref<Set<string>>(new Set())
const fullExpanded = ref<Set<string>>(new Set())
const copiedPath = ref<string | null>(null)

function toggle(path: string) {
  if (expanded.value.has(path)) {
    expanded.value.delete(path)
    fullExpanded.value.delete(path)
  } else {
    expanded.value.add(path)
  }
}

function toggleFull(path: string) {
  if (fullExpanded.value.has(path)) {
    fullExpanded.value.delete(path)
  } else {
    fullExpanded.value.add(path)
  }
}

function copyPath(dirPath: string) {
  const dir = dirPath.substring(0, dirPath.lastIndexOf('/'))
  navigator.clipboard.writeText(dir)
  copiedPath.value = dirPath
  setTimeout(() => (copiedPath.value = null), 3000)
}

const globalWc = computed(() => props.data.globalConfig.wordCount)
</script>

<template>
  <div class="projects">
    <!-- Global config -->
    <div class="card project-item" @click="toggle(data.globalConfig.claudeMdPath)">
      <div class="project-header">
        <div class="project-info">
          <span class="project-name">全域設定 (global)</span>
          <span class="project-wc">
            {{ data.globalConfig.wordCount.toLocaleString('zh-TW') }} 字
          </span>
        </div>
        <button
          class="goto-btn"
          @click.stop="copyPath(data.globalConfig.claudeMdPath)"
        >
          {{ copiedPath === data.globalConfig.claudeMdPath ? '已複製！' : '前往資料夾' }}
        </button>
      </div>
      <p
        v-if="copiedPath === data.globalConfig.claudeMdPath"
        class="copy-toast"
      >
        路徑已複製！在 Finder 選單列點「前往 > 前往檔案夾」，貼上即可。
      </p>
      <div
        v-if="expanded.has(data.globalConfig.claudeMdPath)"
        class="project-content"
        @click.stop
      >
        <pre class="mono">{{
          fullExpanded.has(data.globalConfig.claudeMdPath)
            ? data.globalConfig.content
            : data.globalConfig.content.substring(0, 300)
        }}</pre>
        <div class="content-footer">
          <span>
            {{ fullExpanded.has(data.globalConfig.claudeMdPath) ? '完整內容' : '部分內容' }}，共
            {{ data.globalConfig.totalWordCount.toLocaleString('zh-TW') }} 字
          </span>
          <button
            v-if="!fullExpanded.has(data.globalConfig.claudeMdPath)"
            class="expand-btn"
            @click="toggleFull(data.globalConfig.claudeMdPath)"
          >
            展開全部
          </button>
          <button v-else class="expand-btn" @click="toggleFull(data.globalConfig.claudeMdPath)">
            收合
          </button>
        </div>
        <p v-if="data.globalConfig.isTruncated" class="truncated-note">
          內容已截斷，完整版有
          {{ data.globalConfig.totalWordCount.toLocaleString('zh-TW') }} 字
        </p>
      </div>
    </div>

    <!-- Projects list -->
    <template v-if="data.allProjects.length > 0">
      <div
        v-for="project in data.allProjects"
        :key="project.path"
        class="card project-item"
        @click="toggle(project.path)"
      >
        <div class="project-header">
          <div class="project-info">
            <span class="project-name">{{ project.projectName }}</span>
            <span class="project-wc">
              {{ project.wordCount !== null ? project.wordCount.toLocaleString('zh-TW') + ' 字' : '未知' }}
            </span>
            <span
              v-if="(project.wordCount ?? 0) > globalWc"
              class="badge badge-warning"
            >
              比全域還大
            </span>
          </div>
          <button class="goto-btn" @click.stop="copyPath(project.path)">
            {{ copiedPath === project.path ? '已複製！' : '前往資料夾' }}
          </button>
        </div>
        <p v-if="copiedPath === project.path" class="copy-toast">
          路徑已複製！在 Finder 選單列點「前往 > 前往檔案夾」，貼上即可。
        </p>
        <div
          v-if="expanded.has(project.path) && project.content"
          class="project-content"
          @click.stop
        >
          <pre class="mono">{{
            fullExpanded.has(project.path)
              ? project.content
              : project.content.substring(0, 300)
          }}</pre>
          <div class="content-footer">
            <span>
              {{ fullExpanded.has(project.path) ? '完整內容' : '部分內容' }}，共
              {{ (project.totalWordCount ?? project.wordCount ?? 0).toLocaleString('zh-TW') }} 字
            </span>
            <button
              v-if="!fullExpanded.has(project.path)"
              class="expand-btn"
              @click="toggleFull(project.path)"
            >
              展開全部
            </button>
            <button v-else class="expand-btn" @click="toggleFull(project.path)">
              收合
            </button>
          </div>
          <p v-if="project.isTruncated" class="truncated-note">
            內容已截斷，完整版有
            {{ (project.totalWordCount ?? 0).toLocaleString('zh-TW') }} 字
          </p>
        </div>
        <div
          v-else-if="expanded.has(project.path) && !project.content"
          class="project-content"
          @click.stop
        >
          <p class="no-content">內容未掃描</p>
        </div>
      </div>
    </template>

    <div v-else class="empty-state">
      <p>沒有找到任何專案設定檔。</p>
      <p style="margin-top: 8px; font-size: 13px;">
        掃描範圍：/Users/admin 下 5 層目錄。
      </p>
    </div>
  </div>
</template>

<style scoped>
.projects {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.project-item {
  cursor: pointer;
  transition: border-color 0.2s;
}

.project-item:hover {
  border-color: var(--color-border-hover);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.project-name {
  font-weight: 600;
  font-size: 15px;
}

.project-wc {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.goto-btn {
  padding: var(--space-xs) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.goto-btn:hover {
  background: var(--color-bg-mute);
  color: var(--color-text);
}

.copy-toast {
  margin-top: var(--space-sm);
  font-size: 12px;
  color: var(--color-ok-text);
  background: var(--color-ok-bg);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
}

.project-content {
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
  cursor: default;
}

.content-footer {
  margin-top: var(--space-sm);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: 12px;
  color: var(--color-text-muted);
}

.expand-btn {
  padding: 2px var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 12px;
}

.expand-btn:hover {
  background: var(--color-bg-mute);
}

.truncated-note {
  margin-top: var(--space-xs);
  font-size: 12px;
  color: var(--color-warn-text);
}

.no-content {
  font-size: 14px;
  color: var(--color-text-muted);
  font-style: italic;
}
</style>
