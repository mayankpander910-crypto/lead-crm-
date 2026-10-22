import { computed, ref } from 'vue'
import { definePreset, updatePrimaryPalette } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

export const THEME_OPTIONS = {
  blue: {
    key: 'blue',
    label: 'Sapphire Blue',
    description: 'Clean executive blue & slate',
    primeScale: 'blue',
    hex: '#2563eb',
    hexHover: '#1d4ed8',
    hexSoft: '#eff6ff',
    hexMuted: 'rgba(37, 99, 235, 0.12)',
    chartScale: ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#64748b']
  },
  sky: {
    key: 'sky',
    label: 'Ocean Cyan',
    description: 'Modern cloud & data blue',
    primeScale: 'sky',
    hex: '#0284c7',
    hexHover: '#0369a1',
    hexSoft: '#f0f9ff',
    hexMuted: 'rgba(2, 132, 199, 0.12)',
    chartScale: ['#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#64748b']
  },
  teal: {
    key: 'teal',
    label: 'Nordic Teal',
    description: 'Calm financial emerald-teal',
    primeScale: 'teal',
    hex: '#0d9488',
    hexHover: '#0f766e',
    hexSoft: '#f0fdfa',
    hexMuted: 'rgba(13, 148, 136, 0.12)',
    chartScale: ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#64748b']
  },
  slate: {
    key: 'slate',
    label: 'Graphite Ink',
    description: 'Minimal monochrome slate',
    primeScale: 'slate',
    hex: '#0f172a',
    hexHover: '#1e293b',
    hexSoft: '#f1f5f9',
    hexMuted: 'rgba(15, 23, 42, 0.09)',
    chartScale: ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1']
  }
}

export const CrmAuraPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '6px',
      md: '8px',
      lg: '10px',
      xl: '12px'
    }
  },
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.600}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}'
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '{slate.50}',
          100: '{slate.100}',
          200: '{slate.200}',
          300: '{slate.300}',
          400: '{slate.400}',
          500: '{slate.500}',
          600: '{slate.600}',
          700: '{slate.700}',
          800: '{slate.800}',
          900: '{slate.900}',
          950: '{slate.950}'
        }
      }
    }
  }
})

export const currentThemeKey = ref('blue')

export const activeThemeMeta = computed(
  () => THEME_OPTIONS[currentThemeKey.value] ?? THEME_OPTIONS.blue
)

export function applyThemePreset(key) {
  const meta = THEME_OPTIONS[key] ?? THEME_OPTIONS.blue
  currentThemeKey.value = meta.key

  const p = meta.primeScale
  updatePrimaryPalette({
    50: `{${p}.50}`,
    100: `{${p}.100}`,
    200: `{${p}.200}`,
    300: `{${p}.300}`,
    400: `{${p}.400}`,
    500: key === 'slate' ? `{${p}.900}` : `{${p}.600}`,
    600: key === 'slate' ? `{${p}.800}` : `{${p}.600}`,
    700: key === 'slate' ? `{${p}.950}` : `{${p}.700}`,
    800: `{${p}.800}`,
    900: `{${p}.900}`,
    950: `{${p}.950}`
  })

  if (typeof document !== 'undefined') {
    const root = document.documentElement
    root.style.setProperty('--crm-accent', meta.hex)
    root.style.setProperty('--crm-accent-hover', meta.hexHover)
    root.style.setProperty('--crm-accent-soft', meta.hexSoft)
    root.style.setProperty('--crm-accent-muted', meta.hexMuted)
  }
}
