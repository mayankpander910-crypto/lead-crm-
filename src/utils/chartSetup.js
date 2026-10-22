import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { scaledFontSize } from '@/utils/themeManager'

let registered = false

export function registerChartJs() {
  if (registered) return
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
  )

  ChartJS.defaults.font.family =
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  ChartJS.defaults.color = '#64748b'
  ChartJS.defaults.font.size = 12
  registered = true
}

registerChartJs()

export function getBaseTooltipStyle() {
  return {
    backgroundColor: '#0f172a',
    titleColor: '#f8fafc',
    bodyColor: '#e2e8f0',
    borderColor: '#1e293b',
    borderWidth: 1,
    padding: 11,
    cornerRadius: 8,
    displayColors: true,
    boxPadding: 5,
    titleFont: { size: scaledFontSize(12), weight: 600 },
    bodyFont: { size: scaledFontSize(12), weight: 500 }
  }
}

export const BASE_TOOLTIP_STYLE = getBaseTooltipStyle()
