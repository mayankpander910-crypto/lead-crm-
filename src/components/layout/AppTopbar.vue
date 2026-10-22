<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Popover from 'primevue/popover'
import Badge from 'primevue/badge'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import UserAvatar from '@/components/common/UserAvatar.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { THEME_OPTIONS } from '@/utils/themeManager'
import { useCrmStore } from '@/stores/crmStore'
import { useFormatters } from '@/composables/useFormatters'

defineEmits(['toggleMobileSidebar'])

const store = useCrmStore()
const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const { formatCurrency, formatRelativeTime } = useFormatters()

const themePopover = ref(null)
const notifPopover = ref(null)
const accountPopover = ref(null)
const searchFocused = ref(false)

const pageTitle = computed(() => route.meta.title || 'Overview')

const themeList = Object.values(THEME_OPTIONS)

const searchDropdownOpen = computed(
  () => searchFocused.value && store.globalSearchQuery.trim().length >= 2
)

const quickMatchedLeads = computed(() => {
  const q = store.globalSearchQuery.trim().toLowerCase()
  if (q.length < 2) return []
  return store.leads
    .filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.state.toLowerCase().includes(q)
    )
    .slice(0, 6)
})

const quickSwitchAccounts = computed(() => {
  const admin = store.users.find((u) => u.role === 'Admin')
  const manager = store.users.find((u) => u.role === 'Sales Manager')
  const worker = store.users.find((u) => u.role === 'Sales Representative')
  return [admin, manager, worker].filter(Boolean)
})

const roleBadgeClasses = computed(() => {
  if (store.permissions.isAdmin) {
    return 'bg-slate-900 text-white'
  }
  if (store.permissions.isManager) {
    return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
  }
  return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
})

function handleSearchEnter() {
  searchFocused.value = false
  if (route.path !== '/leads') {
    router.push('/leads')
  }
}

function handleSelectSearchLead(leadId) {
  searchFocused.value = false
  store.openLeadDetailDrawer(leadId)
}

function handleBlurSearch() {
  setTimeout(() => {
    searchFocused.value = false
  }, 180)
}

function selectTheme(key) {
  store.setTheme(key)
}

function handleNotificationClick(item) {
  store.markNotificationRead(item.id)
  notifPopover.value?.hide()
  if (item.leadId && store.getLeadById(item.leadId)) {
    store.openLeadDetailDrawer(item.leadId)
  } else if (item.route) {
    router.push(item.route)
  }
}

function handleSwitchUser(user) {
  accountPopover.value?.hide()
  store.switchActiveSessionUser(user.id)
  if (route.meta.requiresTeamAccess && !store.permissions.canViewTeam) {
    router.push('/')
  }
  toast.add({
    severity: 'info',
    summary: `Switched to ${user.name}`,
    detail: `${store.permissions.roleBadge} · ${store.permissions.scopeLabel}`,
    life: 2600
  })
}

function handleSignOut() {
  accountPopover.value?.hide()
  store.logout()
  toast.add({
    severity: 'info',
    summary: 'Signed Out',
    detail: 'Redirected to sign-in screen.',
    life: 2400
  })
  router.push('/login')
}

function confirmResetDemoData() {
  accountPopover.value?.hide()
  confirm.require({
    header: 'Reset Demo Workspace?',
    message:
      'This restores the initial 42 sample leads, tasks, and activity records while keeping you signed in.',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Reset Demo Data',
      severity: 'danger'
    },
    accept: () => {
      store.resetDemoData()
      toast.add({
        severity: 'info',
        summary: 'Demo Data Restored',
        detail: 'All leads, tasks, and charts have been reset to seed records.',
        life: 3000
      })
    }
  })
}

function categoryStyle(cat) {
  if (cat === 'reminder') return { box: 'text-amber-600 bg-amber-50', icon: 'pi pi-clock' }
  if (cat === 'deal') return { box: 'text-emerald-600 bg-emerald-50', icon: 'pi pi-trophy' }
  if (cat === 'lead') return { box: 'text-blue-600 bg-blue-50', icon: 'pi pi-user-plus' }
  return { box: 'text-slate-600 bg-slate-100', icon: 'pi pi-info-circle' }
}
</script>

<template>
  <header
    class="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4"
  >
    <div class="flex items-center gap-3 min-w-0">
      <Button
        icon="pi pi-bars"
        text
        rounded
        severity="secondary"
        aria-label="Open menu"
        class="lg:!hidden !w-9 !h-9 shrink-0"
        @click="$emit('toggleMobileSidebar')"
      />

      <div class="flex items-center gap-2 min-w-0">
        <template v-if="route.path !== '/'">
          <button
            type="button"
            class="hidden sm:inline text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            @click="router.push('/')"
          >
            {{ store.settings.workspaceName }}
          </button>
          <span class="hidden sm:inline text-slate-300 text-xs">/</span>
        </template>
        <h1 class="text-[16px] sm:text-[17px] font-semibold tracking-tight text-slate-900 truncate">
          {{ pageTitle }}
        </h1>
        <span
          class="hidden xl:inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold shrink-0 ml-1"
          :class="roleBadgeClasses"
        >
          {{ store.permissions.roleBadge }} · {{ store.permissions.scopeLabel }}
        </span>
      </div>
    </div>

    <div class="flex items-center gap-2 sm:gap-2.5">
      <div class="relative hidden md:block w-52 lg:w-64">
        <IconField>
          <InputIcon class="pi pi-search !text-xs text-slate-400" />
          <InputText
            v-model="store.globalSearchQuery"
            :placeholder="store.permissions.isWorker ? 'Search my leads...' : 'Quick search leads...'"
            size="small"
            class="w-full !rounded-lg !bg-slate-50 focus:!bg-white !border-slate-200 !text-xs !py-1.5 !pr-7"
            @focus="searchFocused = true"
            @blur="handleBlurSearch"
            @keydown.enter="handleSearchEnter"
          />
        </IconField>
        <button
          v-if="store.globalSearchQuery"
          type="button"
          aria-label="Clear search"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          @click="store.globalSearchQuery = ''"
        >
          <i class="pi pi-times text-[10px]" />
        </button>

        <div
          v-if="searchDropdownOpen"
          class="absolute left-0 right-0 mt-1.5 rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden z-50"
        >
          <div class="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Matching Leads
            </span>
            <button
              type="button"
              class="text-[11px] font-medium crm-accent-text hover:underline cursor-pointer"
              @mousedown.prevent="handleSearchEnter"
            >
              Open table →
            </button>
          </div>

          <div
            v-if="quickMatchedLeads.length === 0"
            class="px-3.5 py-5 text-center text-xs text-slate-500"
          >
            No leads match "{{ store.globalSearchQuery }}"
          </div>

          <ul v-else class="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            <li v-for="lead in quickMatchedLeads" :key="lead.id">
              <button
                type="button"
                class="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                @mousedown.prevent="handleSelectSearchLead(lead.id)"
              >
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-slate-900 truncate">{{ lead.name }}</p>
                  <p class="text-[11px] text-slate-500 truncate">
                    {{ lead.company }} · {{ formatCurrency(lead.dealValue) }}
                  </p>
                </div>
                <StatusTag :value="lead.status" variant="stage" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div>
        <Button
          icon="pi pi-palette"
          text
          rounded
          severity="secondary"
          aria-label="Customize theme"
          title="Change Theme & Sidebar Style"
          class="!w-8 !h-8 !text-slate-500 hover:!bg-slate-100"
          @click="themePopover?.toggle($event)"
        />

        <Popover ref="themePopover" class="!w-72 !p-0 !rounded-xl overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-100">
            <p class="text-xs font-semibold text-slate-900">Appearance & Theme</p>
            <p class="text-[11px] text-slate-500">Switch primary accent or sidebar finish</p>
          </div>

          <div class="p-3.5 space-y-3.5">
            <div class="space-y-1.5">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Accent Palette
              </span>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="opt in themeList"
                  :key="opt.key"
                  type="button"
                  class="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-all cursor-pointer"
                  :class="
                    store.settings.themePreset === opt.key
                      ? 'border-slate-900 bg-slate-50 font-semibold text-slate-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  "
                  @click="selectTheme(opt.key)"
                >
                  <span
                    class="h-3.5 w-3.5 rounded-full shrink-0"
                    :style="{ backgroundColor: opt.hex }"
                  />
                  <span class="truncate">{{ opt.label }}</span>
                </button>
              </div>
            </div>

            <div class="space-y-1.5 pt-2 border-t border-slate-100">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Sidebar Surface
              </span>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  class="rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer"
                  :class="
                    store.settings.sidebarStyle === 'dark'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  "
                  @click="store.setSidebarStyle('dark')"
                >
                  Slate Dark
                </button>
                <button
                  type="button"
                  class="rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer"
                  :class="
                    store.settings.sidebarStyle === 'light'
                      ? 'border-slate-900 bg-slate-100 text-slate-900 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  "
                  @click="store.setSidebarStyle('light')"
                >
                  Clean Light
                </button>
              </div>
            </div>
          </div>
        </Popover>
      </div>

      <div class="relative">
        <Button
          icon="pi pi-bell"
          text
          rounded
          severity="secondary"
          aria-label="Notifications"
          class="!w-8 !h-8 !text-slate-500 hover:!bg-slate-100"
          @click="notifPopover?.toggle($event)"
        />
        <span
          v-if="store.unreadNotificationsCount > 0"
          class="pointer-events-none absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-white"
          :style="{ backgroundColor: 'var(--crm-accent)' }"
        >
          {{ store.unreadNotificationsCount }}
        </span>

        <Popover ref="notifPopover" class="!w-80 sm:!w-96 !p-0 !rounded-xl overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-slate-900">Notifications</span>
              <Badge
                v-if="store.unreadNotificationsCount > 0"
                :value="store.unreadNotificationsCount"
                severity="info"
              />
            </div>
            <button
              v-if="store.unreadNotificationsCount > 0"
              type="button"
              class="text-xs font-medium crm-accent-text hover:underline cursor-pointer"
              @click="store.markAllNotificationsRead()"
            >
              Mark all read
            </button>
          </div>

          <div
            v-if="store.notifications.length === 0"
            class="px-4 py-8 text-center text-xs text-slate-500"
          >
            You're all caught up.
          </div>

          <ul v-else class="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            <li v-for="notif in store.notifications.slice(0, 10)" :key="notif.id">
              <button
                type="button"
                class="w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                :class="!notif.read ? 'bg-blue-50/35' : ''"
                @click="handleNotificationClick(notif)"
              >
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                  :class="categoryStyle(notif.category).box"
                >
                  <i :class="[categoryStyle(notif.category).icon, 'text-xs']" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-xs font-semibold text-slate-900 truncate">
                      {{ notif.title }}
                    </p>
                    <span
                      v-if="!notif.read"
                      class="h-2 w-2 shrink-0 rounded-full crm-accent-bg"
                    />
                  </div>
                  <p class="mt-0.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {{ notif.message }}
                  </p>
                  <span class="mt-1 block text-[11px] text-slate-400">
                    {{ formatRelativeTime(notif.timestamp) }}
                  </span>
                </div>
              </button>
            </li>
          </ul>
        </Popover>
      </div>

      <Button
        label="New Lead"
        icon="pi pi-plus"
        size="small"
        class="!rounded-lg !px-3.5 !py-1.5 !text-xs !font-semibold"
        :pt="{ label: { class: 'hidden sm:inline' } }"
        @click="store.openCreateLeadDrawer()"
      />

      <div class="pl-0.5">
        <button
          type="button"
          aria-label="User profile menu"
          class="flex items-center gap-2 rounded-full pl-0.5 pr-2 py-0.5 border border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition-all cursor-pointer"
          @click="accountPopover?.toggle($event)"
        >
          <UserAvatar
            :name="store.currentUser.name"
            :color="store.currentUser.avatarColor"
          />
          <span class="hidden sm:block text-left">
            <span class="block text-xs font-semibold text-slate-900 leading-tight max-w-28 truncate">
              {{ store.currentUser.name.split(' ')[0] }}
            </span>
            <span class="block text-[10px] font-medium text-slate-500 leading-tight">
              {{ store.permissions.roleBadge }}
            </span>
          </span>
          <i class="pi pi-chevron-down text-[10px] text-slate-400 hidden sm:inline" />
        </button>

        <Popover ref="accountPopover" class="!w-76 !p-0 !rounded-xl overflow-hidden">
          <div class="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3">
            <UserAvatar
              :name="store.currentUser.name"
              :color="store.currentUser.avatarColor"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <p class="text-xs font-semibold text-slate-900 truncate">
                  {{ store.currentUser.name }}
                </p>
                <span
                  class="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold shrink-0"
                  :class="roleBadgeClasses"
                >
                  {{ store.permissions.roleBadge }}
                </span>
              </div>
              <p class="text-[11px] text-slate-500 truncate mt-0.5">
                {{ store.currentUser.email }}
              </p>
            </div>
          </div>

          <div class="p-2.5 border-b border-slate-100 space-y-1">
            <p class="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Switch Role Session
            </p>
            <button
              v-for="u in quickSwitchAccounts"
              :key="u.id"
              type="button"
              class="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
              :class="
                u.id === store.currentUser.id
                  ? 'bg-slate-100 font-semibold text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              "
              @click="handleSwitchUser(u)"
            >
              <span class="flex items-center gap-2 min-w-0">
                <UserAvatar :name="u.name" :color="u.avatarColor" small />
                <span class="truncate">{{ u.name }}</span>
              </span>
              <span class="text-[10px] font-medium text-slate-500 shrink-0">
                {{ u.role === 'Sales Representative' ? 'Worker' : u.role }}
              </span>
            </button>
          </div>

          <div class="p-1.5 space-y-0.5">
            <button
              type="button"
              class="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
              @click="accountPopover?.hide(); router.push('/settings')"
            >
              <i class="pi pi-cog text-xs text-slate-400" />
              <span>{{ store.permissions.isAdmin ? 'System Settings' : 'Account Preferences' }}</span>
            </button>

            <button
              v-if="store.permissions.isAdmin"
              type="button"
              class="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
              @click="confirmResetDemoData"
            >
              <i class="pi pi-refresh text-xs text-slate-400" />
              <span>Reset Demo Data</span>
            </button>

            <button
              type="button"
              class="w-full px-3 py-2 rounded-lg text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
              @click="handleSignOut"
            >
              <i class="pi pi-sign-out text-xs" />
              <span>Sign Out</span>
            </button>
          </div>
        </Popover>
      </div>
    </div>
  </header>
</template>
