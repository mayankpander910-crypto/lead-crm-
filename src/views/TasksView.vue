<script setup>
import KpiCard from '@/components/common/KpiCard.vue'
import TasksTable from '@/components/tasks/TasksTable.vue'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
</script>

<template>
  <div class="space-y-5">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <KpiCard
        label="Upcoming Tasks"
        :value="store.upcomingTasks.length"
        sub-value="Scheduled today & ahead"
        icon="pi pi-calendar"
        accent-bg="bg-blue-50"
        accent-text="text-blue-600"
      />
      <KpiCard
        label="Overdue Reminders"
        :value="store.overdueTasks.length"
        sub-value="Requires immediate action"
        icon="pi pi-exclamation-circle"
        accent-bg="bg-rose-50"
        accent-text="text-rose-600"
      />
      <KpiCard
        label="Completed Tasks"
        :value="store.completedTasks.length"
        sub-value="Recorded in activity history"
        icon="pi pi-check-circle"
        accent-bg="bg-emerald-50"
        accent-text="text-emerald-600"
      />
    </div>

    <TasksTable />
  </div>
</template>
