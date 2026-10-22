<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { activeThemeMeta } from '@/utils/themeManager'
import { useFormatters } from '@/composables/useFormatters'
import { useCrmStore } from '@/stores/crmStore'

const store = useCrmStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const { formatCompactCurrency } = useFormatters()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(true)
const errorMessage = ref('')
const showAllAccounts = ref(false)

const primaryRoleCards = computed(() => {
  const admin = store.users.find((u) => u.role === 'Admin') ?? store.users[0]
  const manager = store.users.find((u) => u.role === 'Sales Manager') ?? store.users[1]
  const worker = store.users.find((u) => u.role === 'Sales Representative') ?? store.users[3]

  const cards = []
  if (admin) {
    cards.push({
      id: admin.id,
      roleLabel: 'Admin',
      badgeClass: 'bg-slate-900 text-white',
      user: admin
    })
  }
  if (manager) {
    cards.push({
      id: manager.id,
      roleLabel: 'Manager',
      badgeClass: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
      user: manager
    })
  }
  if (worker) {
    cards.push({
      id: worker.id,
      roleLabel: 'Worker',
      badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
      user: worker
    })
  }
  return cards
})

const totalWonRevenue = computed(() =>
  store.allLeads
    .filter((l) => l.status === 'Won')
    .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0)
)

function completeLogin(targetEmail, targetPassword) {
  errorMessage.value = ''
  if (!targetEmail.trim()) {
    errorMessage.value = 'Please enter your email address.'
    return
  }
  if (!targetPassword) {
    errorMessage.value = 'Please enter your password.'
    return
  }

  const res = store.login(targetEmail, targetPassword, rememberMe.value)
  if (!res.ok) {
    errorMessage.value = res.error
    return
  }

  const roleDisplay = res.user.role === 'Sales Representative' ? 'Sales Worker' : res.user.role

  toast.add({
    severity: 'success',
    summary: `Welcome, ${res.user.name}`,
    detail: `Signed in as ${roleDisplay}`,
    life: 2800
  })

  const redirectPath = route.query.redirect || store.settings.defaultLandingRoute || '/'
  if (!store.permissions.canViewTeam && String(redirectPath).startsWith('/team')) {
    router.push('/')
  } else {
    router.push(redirectPath)
  }
}

function handleFormSubmit() {
  completeLogin(email.value, password.value)
}

function quickSignInAs(user) {
  email.value = user.email
  password.value = user.password || 'Worker@123'
  completeLogin(email.value, password.value)
}
</script>

<template>
  <div class="min-h-screen flex bg-white text-slate-900">
    <!-- Left Column: Full-Bleed Visual Showcase Image (visible from md 768px+ including split-pane previews) -->
    <div class="hidden md:flex md:w-[48%] lg:w-[53%] relative overflow-hidden bg-slate-950 select-none">
      <img
        src="/images/login-hero.png"
        alt="PulseCRM Revenue Analytics Visual"
        class="h-full w-full object-cover object-center scale-[1.01]"
      />

      <!-- Subtle top & bottom gradient vignettes for crisp badge contrast -->
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/65 via-transparent to-slate-950/85"
      />

      <!-- Top Floating Brand Mark -->
      <div class="absolute top-8 left-9 right-9 z-10 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-md"
            :style="{ backgroundColor: activeThemeMeta.hex }"
          >
            <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12.5H7.8L10.3 6.5L13.7 17.5L16.2 11.5H20"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <span class="text-base font-bold tracking-tight text-white">
            {{ store.settings.workspaceName }}
          </span>
        </div>

        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-slate-950/60 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-slate-200 ring-1 ring-white/15"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Live Pipeline Suite
        </span>
      </div>

      <!-- Bottom Glass Telemetry Bar -->
      <div class="absolute bottom-8 left-9 right-9 z-10 space-y-4">
        <h1 class="text-2xl font-bold tracking-tight text-white max-w-md leading-snug">
          Unified sales pipeline & revenue intelligence.
        </h1>

        <div
          class="grid grid-cols-3 gap-4 rounded-xl bg-slate-950/60 backdrop-blur-md border border-white/15 px-5 py-3.5 max-w-md"
        >
          <div>
            <p class="text-base font-bold text-white tabular-nums">{{ store.allLeads.length }}</p>
            <p class="text-[11px] text-slate-300">Active Leads</p>
          </div>
          <div>
            <p class="text-base font-bold text-emerald-400 tabular-nums">
              {{ formatCompactCurrency(totalWonRevenue) }}
            </p>
            <p class="text-[11px] text-slate-300">Won Revenue</p>
          </div>
          <div>
            <p class="text-base font-bold text-white tabular-nums">{{ store.users.length }}</p>
            <p class="text-[11px] text-slate-300">Team Members</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Clean Minimal Sign-In Form -->
    <div class="flex-1 flex flex-col justify-center bg-slate-50/50 px-5 sm:px-8 lg:px-10 py-8">
      <div class="w-full max-w-[410px] mx-auto space-y-5">
        <!-- Mobile Visual Hero Banner (< 768px) -->
        <div class="md:hidden relative h-40 w-full overflow-hidden rounded-2xl bg-slate-950 shadow-sm">
          <img
            src="/images/login-hero.png"
            alt="PulseCRM Mobile Showcase"
            class="h-full w-full object-cover object-center"
          />
          <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-slate-950/50" />
          <div class="absolute top-3.5 left-4 flex items-center gap-2">
            <div
              class="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-xs"
              :style="{ backgroundColor: activeThemeMeta.hex }"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 12.5H7.8L10.3 6.5L13.7 17.5L16.2 11.5H20"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <span class="text-sm font-bold tracking-tight text-white">
              {{ store.settings.workspaceName }}
            </span>
          </div>
          <p class="absolute bottom-3.5 left-4 right-4 text-sm font-semibold text-white leading-snug">
            Unified sales pipeline & revenue intelligence.
          </p>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-7 sm:p-8 space-y-5">
          <div>
            <h2 class="text-xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p class="mt-1 text-xs text-slate-500">Sign in to access your workspace</p>
          </div>

          <div
            v-if="errorMessage"
            class="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 flex items-center gap-2 text-xs text-rose-700"
          >
            <i class="pi pi-exclamation-circle text-sm shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <form class="space-y-4" @submit.prevent="handleFormSubmit">
            <div class="space-y-1.5">
              <label for="login-email" class="block text-xs font-medium text-slate-700">Email</label>
              <IconField>
                <InputIcon class="pi pi-envelope !text-xs text-slate-400" />
                <InputText
                  id="login-email"
                  v-model="email"
                  type="email"
                  autocomplete="username"
                  placeholder="name@pulsecrm.io"
                  size="small"
                  class="w-full !rounded-lg !text-xs !py-2"
                />
              </IconField>
            </div>

            <div class="space-y-1.5">
              <label for="login-password" class="block text-xs font-medium text-slate-700">
                Password
              </label>
              <div class="relative">
                <IconField>
                  <InputIcon class="pi pi-lock !text-xs text-slate-400" />
                  <InputText
                    id="login-password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    placeholder="Enter password"
                    size="small"
                    class="w-full !rounded-lg !text-xs !py-2 !pr-9"
                  />
                </IconField>
                <button
                  type="button"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  @click="showPassword = !showPassword"
                >
                  <i :class="showPassword ? 'pi pi-eye-slash text-xs' : 'pi pi-eye text-xs'" />
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <label class="inline-flex items-center gap-2 cursor-pointer select-none">
                <Checkbox v-model="rememberMe" binary />
                <span class="text-xs text-slate-600">Remember me</span>
              </label>
            </div>

            <Button
              type="submit"
              label="Sign In"
              icon="pi pi-arrow-right"
              icon-pos="right"
              size="small"
              class="w-full !rounded-lg !py-2.5 !text-xs !font-semibold"
            />
          </form>

          <!-- Clean Compact 3-Card Role Switcher -->
          <div class="pt-1 space-y-3">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-slate-200" />
              </div>
              <div class="relative flex justify-center">
                <span class="bg-white px-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Quick Role Login
                </span>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="card in primaryRoleCards"
                :key="card.id"
                type="button"
                :title="`${card.user.email} / ${card.user.password}`"
                class="group rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-blue-50/40 p-2.5 flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer"
                @click="quickSignInAs(card.user)"
              >
                <UserAvatar :name="card.user.name" :color="card.user.avatarColor" />
                <span
                  class="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold"
                  :class="card.badgeClass"
                >
                  {{ card.roleLabel }}
                </span>
                <span class="text-[10px] font-mono text-slate-400 truncate max-w-full">
                  {{ card.user.password }}
                </span>
              </button>
            </div>

            <div class="text-center">
              <button
                type="button"
                class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 cursor-pointer"
                @click="showAllAccounts = !showAllAccounts"
              >
                <span>{{ showAllAccounts ? 'Hide accounts' : `All ${store.users.length} accounts` }}</span>
                <i
                  class="text-[9px]"
                  :class="showAllAccounts ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                />
              </button>
            </div>

            <div
              v-if="showAllAccounts"
              class="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-44 overflow-y-auto"
            >
              <button
                v-for="u in store.users"
                :key="u.id"
                type="button"
                class="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between gap-2 text-xs cursor-pointer"
                @click="quickSignInAs(u)"
              >
                <span class="font-medium text-slate-800 truncate">{{ u.name }}</span>
                <span class="text-[10px] font-mono text-slate-400 shrink-0">
                  {{ u.role === 'Sales Representative' ? 'Worker' : u.role }} · {{ u.password }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
