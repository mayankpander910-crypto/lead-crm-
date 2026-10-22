<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Drawer from 'primevue/drawer'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { activeThemeMeta } from '@/utils/themeManager'
import { useCrmStore } from '@/stores/crmStore'

const props = defineProps({
  mobileOpen: { type: Boolean, required: true }
})

const emit = defineEmits(['update:mobileOpen'])

const store = useCrmStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const primaryNav = computed(() => {
  const isWorker = store.permissions.isWorker
  return [
    { label: 'Overview', to: '/', icon: 'pi pi-th-large' },
    {
      label: isWorker ? 'My Leads' : 'Leads',
      to: '/leads',
      icon: 'pi pi-users',
      badge: store.leads.length
    },
    {
      label: isWorker ? 'My Pipeline' : 'Sales Pipeline',
      to: '/pipeline',
      icon: 'pi pi-objects-column'
    },
    {
      label: isWorker ? 'My Tasks' : 'Tasks & Reminders',
      to: '/tasks',
      icon: 'pi pi-check-square',
      badge:
        store.overdueTasks.length > 0
          ? store.overdueTasks.length
          : store.upcomingTasks.length || undefined,
      urgent: store.overdueTasks.length > 0
    },
    {
      label: isWorker ? 'My Performance' : 'Analytics',
      to: '/analytics',
      icon: 'pi pi-chart-line'
    }
  ]
})

const secondaryNav = computed(() => {
  const items = []
  if (store.permissions.canViewTeam) {
    items.push({ label: 'Team', to: '/team', icon: 'pi pi-building' })
  }
  items.push({
    label: store.permissions.isAdmin ? 'System Settings' : 'Preferences',
    to: '/settings',
    icon: 'pi pi-cog'
  })
  return items
})

const isDark = computed(() => store.settings.sidebarStyle === 'dark')

const rolePillClass = computed(() => {
  if (store.permissions.isAdmin) {
    return isDark.value
      ? 'bg-blue-500/20 text-blue-300 ring-1 ring-inset ring-blue-400/25'
      : 'bg-slate-900 text-white'
  }
  if (store.permissions.isManager) {
    return isDark.value
      ? 'bg-sky-500/20 text-sky-300 ring-1 ring-inset ring-sky-400/25'
      : 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
  }
  return isDark.value
    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-inset ring-emerald-400/25'
    : 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
})

function isActive(targetPath) {
  if (targetPath === '/') return route.path === '/'
  return route.path.startsWith(targetPath)
}

function navigateTo(targetPath) {
  router.push(targetPath)
  emit('update:mobileOpen', false)
}

function handleSignOut() {
  emit('update:mobileOpen', false)
  store.logout()
  toast.add({
    severity: 'info',
    summary: 'Signed Out',
    detail: 'Your session has ended.',
    life: 2400
  })
  router.push('/login')
}
</script>

<template>
  <aside
    class="hidden lg:flex lg:flex-col lg:shrink-0 select-none transition-[width] duration-200 ease-out h-screen sticky top-0 z-30 border-r"
    :class="[
      store.sidebarCollapsed ? 'w-[4.5rem]' : 'w-60',
      isDark ? 'bg-slate-950 border-slate-800/90 text-slate-300' : 'bg-white border-slate-200/90 text-slate-600'
    ]"
  >
    <div
      class="h-16 flex items-center px-4 border-b"
      :class="[
        store.sidebarCollapsed ? 'justify-center' : 'justify-between',
        isDark ? 'border-slate-800/80' : 'border-slate-100'
      ]"
    >
      <button
        type="button"
        class="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
        @click="navigateTo('/')"
      >
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-xs transition-transform group-hover:scale-[1.02]"
          :style="{ backgroundColor: activeThemeMeta.hex }"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12.5H7.8L10.3 6.5L13.7 17.5L16.2 11.5H20"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div v-if="!store.sidebarCollapsed" class="overflow-hidden">
          <span
            class="block text-sm font-bold tracking-tight leading-none"
            :class="isDark ? 'text-white' : 'text-slate-900'"
          >
            {{ store.settings.workspaceName }}
          </span>
          <span
            class="block text-[0.625rem] font-medium uppercase tracking-wider mt-1"
            :class="isDark ? 'text-slate-400' : 'text-slate-400'"
          >
            Revenue Suite
          </span>
        </div>
      </button>

      <button
        v-if="!store.sidebarCollapsed"
        type="button"
        aria-label="Collapse sidebar"
        class="flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer"
        :class="
          isDark
            ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
        "
        @click="store.sidebarCollapsed = true"
      >
        <i class="pi pi-angle-double-left text-xs" />
      </button>
    </div>

    <div v-if="store.sidebarCollapsed" class="flex justify-center pt-2.5 pb-1">
      <button
        type="button"
        aria-label="Expand sidebar"
        class="flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer"
        :class="
          isDark
            ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
        "
        @click="store.sidebarCollapsed = false"
      >
        <i class="pi pi-angle-double-right text-xs" />
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      <div class="space-y-1">
        <p
          v-if="!store.sidebarCollapsed"
          class="px-3 pb-1 text-[0.625rem] font-semibold uppercase tracking-widest"
          :class="isDark ? 'text-slate-500' : 'text-slate-400'"
        >
          {{ store.permissions.isWorker ? 'My Portal' : 'Workspace' }}
        </p>

        <button
          v-for="item in primaryNav"
          :key="item.to"
          type="button"
          :title="store.sidebarCollapsed ? item.label : undefined"
          class="w-full flex items-center rounded-lg text-[0.8125rem] transition-all duration-150 cursor-pointer relative group"
          :class="[
            store.sidebarCollapsed ? 'justify-center py-2.5 px-2' : 'justify-between px-3 py-2',
            isActive(item.to)
              ? isDark
                ? 'bg-slate-800/95 text-white font-semibold shadow-2xs ring-1 ring-inset ring-white/10'
                : 'bg-slate-100 text-slate-900 font-semibold'
              : isDark
                ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 font-medium'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
          ]"
          @click="navigateTo(item.to)"
        >
          <span
            v-if="isActive(item.to) && !store.sidebarCollapsed"
            class="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
            :style="{ backgroundColor: isDark ? '#60a5fa' : activeThemeMeta.hex }"
          />

          <span class="flex items-center gap-2.5 min-w-0">
            <i
              :class="[
                item.icon,
                'text-sm shrink-0 transition-colors',
                isActive(item.to)
                  ? isDark
                    ? 'text-blue-400'
                    : 'text-slate-900'
                  : isDark
                    ? 'text-slate-500 group-hover:text-slate-300'
                    : 'text-slate-400 group-hover:text-slate-600'
              ]"
            />
            <span v-if="!store.sidebarCollapsed" class="truncate">{{ item.label }}</span>
          </span>

          <span
            v-if="!store.sidebarCollapsed && item.badge"
            class="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.6875rem] font-semibold tabular-nums"
            :class="
              item.urgent
                ? 'bg-rose-500 text-white'
                : isDark
                  ? 'bg-slate-800 text-slate-300 ring-1 ring-inset ring-white/10'
                  : 'bg-slate-100 text-slate-600'
            "
          >
            {{ item.badge }}
          </span>
          <span
            v-else-if="store.sidebarCollapsed && item.urgent"
            class="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-rose-500"
          />
        </button>
      </div>

      <div class="space-y-1">
        <p
          v-if="!store.sidebarCollapsed"
          class="px-3 pb-1 text-[0.625rem] font-semibold uppercase tracking-widest"
          :class="isDark ? 'text-slate-500' : 'text-slate-400'"
        >
          {{ store.permissions.canViewTeam ? 'Organization' : 'Account' }}
        </p>

        <button
          v-for="item in secondaryNav"
          :key="item.to"
          type="button"
          :title="store.sidebarCollapsed ? item.label : undefined"
          class="w-full flex items-center rounded-lg text-[0.8125rem] transition-all duration-150 cursor-pointer relative group"
          :class="[
            store.sidebarCollapsed ? 'justify-center py-2.5 px-2' : 'justify-between px-3 py-2',
            isActive(item.to)
              ? isDark
                ? 'bg-slate-800/95 text-white font-semibold ring-1 ring-inset ring-white/10'
                : 'bg-slate-100 text-slate-900 font-semibold'
              : isDark
                ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 font-medium'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
          ]"
          @click="navigateTo(item.to)"
        >
          <span
            v-if="isActive(item.to) && !store.sidebarCollapsed"
            class="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
            :style="{ backgroundColor: isDark ? '#60a5fa' : activeThemeMeta.hex }"
          />
          <span class="flex items-center gap-2.5 min-w-0">
            <i
              :class="[
                item.icon,
                'text-sm shrink-0 transition-colors',
                isActive(item.to)
                  ? isDark
                    ? 'text-blue-400'
                    : 'text-slate-900'
                  : isDark
                    ? 'text-slate-500 group-hover:text-slate-300'
                    : 'text-slate-400 group-hover:text-slate-600'
              ]"
            />
            <span v-if="!store.sidebarCollapsed" class="truncate">{{ item.label }}</span>
          </span>
        </button>
      </div>
    </nav>

    <div
      class="border-t p-3"
      :class="isDark ? 'border-slate-800/80' : 'border-slate-100'"
    >
      <div
        class="flex items-center gap-2 rounded-lg p-2"
        :class="[
          store.sidebarCollapsed ? 'flex-col justify-center gap-2' : 'justify-between',
          isDark ? 'bg-slate-900/70' : 'bg-slate-50/80'
        ]"
      >
        <button
          type="button"
          class="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
          :title="`${store.currentUser.name} (${store.permissions.roleBadge})`"
          @click="navigateTo('/settings')"
        >
          <UserAvatar
            :name="store.currentUser.name"
            :color="isDark ? '#60a5fa' : store.currentUser.avatarColor"
          />
          <div v-if="!store.sidebarCollapsed" class="min-w-0">
            <p
              class="truncate text-xs font-semibold leading-tight"
              :class="isDark ? 'text-slate-100' : 'text-slate-900'"
            >
              {{ store.currentUser.name }}
            </p>
            <div class="flex items-center gap-1.5 mt-1">
              <span
                class="inline-flex items-center rounded px-1.5 py-0.2 text-[0.625rem] font-semibold"
                :class="rolePillClass"
              >
                {{ store.permissions.roleBadge }}
              </span>
              <span class="truncate text-[0.625rem] text-slate-400">
                {{ store.currentUser.region }}
              </span>
            </div>
          </div>
        </button>

        <button
          type="button"
          aria-label="Sign out"
          title="Sign out"
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors cursor-pointer"
          :class="
            isDark
              ? 'text-slate-400 hover:bg-rose-500/15 hover:text-rose-400'
              : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
          "
          @click="handleSignOut"
        >
          <i class="pi pi-sign-out text-xs" />
        </button>
      </div>
    </div>
  </aside>

  <Drawer
    :visible="props.mobileOpen"
    position="left"
    class="!w-72"
    :pt="{
      header: { class: '!px-4 !py-3.5 border-b border-slate-100' },
      content: { class: '!p-0 flex flex-col justify-between h-full' }
    }"
    @update:visible="emit('update:mobileOpen', $event)"
  >
    <template #header>
      <div class="flex items-center gap-2.5">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
          :style="{ backgroundColor: activeThemeMeta.hex }"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12.5H7.8L10.3 6.5L13.7 17.5L16.2 11.5H20"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div>
          <span class="block text-sm font-bold text-slate-900 leading-none">
            {{ store.settings.workspaceName }}
          </span>
          <span class="block text-[0.625rem] font-medium uppercase tracking-wider text-slate-400 mt-0.5">
            {{ store.permissions.roleBadge }} · {{ store.permissions.scopeLabel }}
          </span>
        </div>
      </div>
    </template>

    <nav class="p-3 space-y-4 flex-1 overflow-y-auto">
      <div class="space-y-1">
        <p class="px-3 pb-1 text-[0.625rem] font-semibold uppercase tracking-widest text-slate-400">
          {{ store.permissions.isWorker ? 'My Portal' : 'Workspace' }}
        </p>
        <button
          v-for="item in primaryNav"
          :key="item.to"
          type="button"
          class="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer"
          :class="
            isActive(item.to)
              ? 'bg-slate-100 text-slate-900 font-semibold'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          "
          @click="navigateTo(item.to)"
        >
          <span class="flex items-center gap-3">
            <i :class="[item.icon, 'text-sm text-slate-500']" />
            <span>{{ item.label }}</span>
          </span>
          <span
            v-if="item.badge"
            class="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.6875rem] font-semibold tabular-nums"
            :class="item.urgent ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'"
          >
            {{ item.badge }}
          </span>
        </button>
      </div>

      <div class="space-y-1 pt-2 border-t border-slate-100">
        <p class="px-3 pb-1 text-[0.625rem] font-semibold uppercase tracking-widest text-slate-400">
          {{ store.permissions.canViewTeam ? 'Organization' : 'Account' }}
        </p>
        <button
          v-for="item in secondaryNav"
          :key="item.to"
          type="button"
          class="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer"
          :class="
            isActive(item.to)
              ? 'bg-slate-100 text-slate-900 font-semibold'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          "
          @click="navigateTo(item.to)"
        >
          <i :class="[item.icon, 'text-sm text-slate-500']" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <div class="border-t border-slate-100 p-3.5 bg-slate-50/70 space-y-2.5">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <UserAvatar
            :name="store.currentUser.name"
            :color="store.currentUser.avatarColor"
          />
          <div class="min-w-0">
            <p class="truncate text-xs font-semibold text-slate-900">
              {{ store.currentUser.name }}
            </p>
            <p class="truncate text-[0.6875rem] text-slate-500">
              {{ store.permissions.roleBadge }} · {{ store.currentUser.region }}
            </p>
          </div>
        </div>
        <Button
          icon="pi pi-sign-out"
          label="Sign Out"
          severity="danger"
          text
          size="small"
          class="!text-xs"
          @click="handleSignOut"
        />
      </div>
    </div>
  </Drawer>
</template>
