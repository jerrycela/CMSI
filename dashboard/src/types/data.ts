export interface DashboardData {
  meta: Meta
  healthThresholds: HealthThresholds
  globalConfig: GlobalConfig
  docs: DocsData
  skills: SkillsData
  allProjects: ProjectConfig[]
  tokenBudget: TokenBudget
}

export interface Meta {
  generatedAt: string
  scanVersion: string
}

export interface HealthThresholds {
  _note?: string
  globalWordCountWarning: number
  globalWordCountAlert: number
  totalWordCountWarning: number
  totalWordCountAlert: number
  dataStaleHoursWarning: number
  dataStaleHoursAlert: number
}

export interface Section {
  heading: string
  wordCount: number
}

export interface GlobalConfig {
  claudeMdPath: string
  wordCount: number
  byteSize: number
  estimatedTokens: number
  content: string
  isTruncated: boolean
  totalWordCount: number
  sections: Section[]
}

export interface DocFile {
  path: string
  name: string
  wordCount: number
  byteSize: number
  estimatedTokens: number
  descriptionSnippet: string
}

export interface DocsData {
  totalWordCount: number
  totalEstimatedTokens: number
  files: DocFile[]
}

export interface SkillFile {
  name: string
  path: string
  source: string
  type: string
  wordCount: number | null
  byteSize: number | null
  descriptionSnippet: string
  pluginName?: string | null
}

export interface SkillsData {
  totalCount: number
  manualCount: number
  pluginCount: number
  files: SkillFile[]
}

export interface ProjectConfig {
  path: string
  projectDir: string
  projectName: string
  wordCount: number | null
  byteSize: number | null
  content?: string
  isTruncated?: boolean
  totalWordCount?: number
}

export interface TokenBudget {
  _note?: string
  autoLoadedTotal: number | null
  breakdown: Record<string, number | null>
  warningThreshold: number
  lastManualUpdate: string | null
}
