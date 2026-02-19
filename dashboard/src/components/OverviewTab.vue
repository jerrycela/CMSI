<script setup lang="ts">
import type { DashboardData } from '../types/data'
import HealthBanner from './HealthBanner.vue'
import SummaryCards from './SummaryCards.vue'
import SectionsRanking from './SectionsRanking.vue'

defineProps<{ data: DashboardData }>()
</script>

<template>
  <div class="overview">
    <HealthBanner :data="data" />
    <SummaryCards :data="data" />
    <SectionsRanking :data="data" />
  </div>
</template>

<style scoped>
.overview {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}
</style>
