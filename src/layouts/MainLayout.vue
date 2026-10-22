<script setup>
import { ref } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import LeadFormDrawer from '@/components/leads/LeadFormDrawer.vue'
import LeadDetailDrawer from '@/components/leads/LeadDetailDrawer.vue'
import TaskFormDrawer from '@/components/tasks/TaskFormDrawer.vue'

const mobileSidebarOpen = ref(false)
</script>

<template>
  <div class="min-h-screen flex bg-slate-50 text-slate-900">
    <AppSidebar v-model:mobile-open="mobileSidebarOpen" />

    <div class="flex-1 flex flex-col min-w-0">
      <AppTopbar @toggle-mobile-sidebar="mobileSidebarOpen = true" />

      <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
        <RouterView />
      </main>
    </div>

    <LeadFormDrawer />
    <LeadDetailDrawer />
    <TaskFormDrawer />
  </div>
</template>
