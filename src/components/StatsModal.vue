<script setup>
// src/components/StatsModal.vue
// Interactive Power BI-like dashboard modal for admin
import { ref, computed, onMounted, watch } from 'vue'
import * as api from '../services/api.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  darkMode: { type: Boolean, default: false },
  baseStats: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close'])

const loading = ref(true)
const dashData = ref(null)

// ── Fetch dashboard data ──────────────────────────────────────────────────────
const fetchDashboard = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(
      (import.meta.env.VITE_API_URL || 'https://belmahi-school-production.up.railway.app/api') +
        '/stats/dashboard',
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (res.ok) dashData.value = await res.json()
  } catch (e) {
    console.warn('Dashboard stats error', e)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.show,
  (v) => {
    if (v && !dashData.value) fetchDashboard()
  },
)
onMounted(() => {
  if (props.show) fetchDashboard()
})

// ── Color palette ─────────────────────────────────────────────────────────────
const COLORS = ['#1ba8f4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
const LEVEL_COLORS = { primaire: '#10b981', moyen: '#3b82f6', secondaire: '#8b5cf6' }

// ── Payment donut chart ────────────────────────────────────────────────────────
const donutPayment = computed(() => {
  const data = dashData.value?.paymentDistribution || []
  const total = data.reduce((s, d) => s + parseInt(d.count), 0) || 1
  const colors = { paid: '#10b981', pending: '#f59e0b', inactive: '#ef4444' }
  const labels = { paid: 'مدفوع ✓', pending: 'معلق ⏳', inactive: 'غير نشط ✗' }

  let offset = 0
  const r = 54
  const cx = 70
  const cy = 70
  const circumference = 2 * Math.PI * r

  return data.map((d) => {
    const pct = parseInt(d.count) / total
    const dash = circumference * pct
    const gap = circumference * (1 - pct)
    const seg = {
      status: d.payment_status,
      count: parseInt(d.count),
      pct: Math.round(pct * 100),
      color: colors[d.payment_status] || '#64748b',
      label: labels[d.payment_status] || d.payment_status,
      dasharray: `${dash} ${gap}`,
      dashoffset: -circumference * offset,
      r,
      cx,
      cy,
    }
    offset += pct
    return seg
  })
})

// ── Level bar chart ───────────────────────────────────────────────────────────
const levelBars = computed(() => {
  const data = dashData.value?.byLevel || []
  const max = Math.max(...data.map((d) => parseInt(d.student_count)), 1)
  return data.map((d) => ({
    level: d.education_level,
    label:
      { primaire: 'ابتدائي', moyen: 'متوسط', secondaire: 'ثانوي' }[d.education_level] ||
      d.education_level,
    count: parseInt(d.student_count),
    width: (parseInt(d.student_count) / max) * 100,
    color: LEVEL_COLORS[d.education_level] || '#64748b',
  }))
})

// ── Monthly enrollments line chart ─────────────────────────────────────────────
const lineChart = computed(() => {
  const raw = dashData.value?.monthlyEnrollments || []
  if (!raw.length) return { points: '', dots: [], labels: [], max: 10 }
  const max = Math.max(...raw.map((d) => parseInt(d.count)), 1)
  const w = 380
  const h = 120
  const pad = { left: 30, right: 10, top: 14, bottom: 28 }
  const innerW = w - pad.left - pad.right
  const innerH = h - pad.top - pad.bottom

  const pts = raw.map((d, i) => {
    const x = pad.left + (i / Math.max(raw.length - 1, 1)) * innerW
    const y = pad.top + innerH - (parseInt(d.count) / max) * innerH
    return { x, y, count: parseInt(d.count), month: d.month }
  })

  const points = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const fillPts = [
    `${pts[0].x},${pad.top + innerH}`,
    ...pts.map((p) => `${p.x},${p.y}`),
    `${pts[pts.length - 1].x},${pad.top + innerH}`,
  ].join(' ')

  return { points, fillPts, dots: pts, max, w, h }
})

// ── Top courses bar chart ──────────────────────────────────────────────────────
const topCourseBars = computed(() => {
  const data = dashData.value?.topCourses || []
  const max = Math.max(...data.map((d) => parseInt(d.student_count)), 1)
  return data.map((d, i) => ({
    title: d.title.length > 18 ? d.title.substring(0, 16) + '…' : d.title,
    count: parseInt(d.student_count),
    capacity: parseInt(d.capacity),
    fillPct: (parseInt(d.student_count) / Math.max(parseInt(d.capacity), 1)) * 100,
    barW: (parseInt(d.student_count) / max) * 100,
    color: COLORS[i % COLORS.length],
  }))
})

// ── Revenue trend ──────────────────────────────────────────────────────────────
const revenueBars = computed(() => {
  const data = dashData.value?.monthlyRevenue || []
  const max = Math.max(...data.map((d) => parseFloat(d.revenue)), 1)
  return data.map((d, i) => ({
    month: d.month,
    revenue: parseFloat(d.revenue),
    height: (parseFloat(d.revenue) / max) * 80,
    color: COLORS[i % COLORS.length],
  }))
})

// ── Teacher performance ────────────────────────────────────────────────────────
const teacherBars = computed(() => {
  const data = dashData.value?.teacherPerformance || []
  const max = Math.max(...data.map((d) => parseInt(d.student_count)), 1)
  return data.map((d, i) => ({
    name: d.teacher_name.split(' ').slice(0, 2).join(' '),
    students: parseInt(d.student_count),
    courses: parseInt(d.course_count),
    pct: (parseInt(d.student_count) / max) * 100,
    color: COLORS[i % COLORS.length],
  }))
})

// ── KPI helpers ────────────────────────────────────────────────────────────────
const capacityUsed = computed(() => {
  const cap = dashData.value?.capacityData
  if (!cap) return 0
  return Math.round(
    (parseInt(cap.enrolled_students) / Math.max(parseInt(cap.total_capacity), 1)) * 100,
  )
})

const totalStudents = computed(() =>
  parseInt(dashData.value?.capacityData?.enrolled_students || props.baseStats.students || 0),
)
const totalCapacity = computed(() => parseInt(dashData.value?.capacityData?.total_capacity || 0))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-[999] flex items-center justify-center p-3"
        style="background: rgba(4, 13, 31, 0.85); backdrop-filter: blur(6px)"
        @click.self="emit('close')"
      >
        <div class="dashboard-modal" :class="darkMode ? 'dash-dark' : 'dash-light'" @click.stop>
          <!-- ── Header ──────────────────────────────────────────────────── -->
          <div class="dash-header">
            <div class="dash-header-left">
              <div class="dash-logo">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <div>
                <h2 class="dash-title">لوحة الإحصائيات</h2>
                <p class="dash-subtitle">Dashboard Belmahi School — Vue en temps réel</p>
              </div>
            </div>
            <button class="dash-close" @click="emit('close')">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- ── Loading ────────────────────────────────────────────────── -->
          <div v-if="loading" class="dash-loading">
            <div class="dash-spinner"></div>
            <p>جاري تحميل الإحصائيات...</p>
          </div>

          <!-- ── Content ────────────────────────────────────────────────── -->
          <div v-else class="dash-body">
            <!-- ════ ROW 1: KPI CARDS ════════════════════════════════════ -->
            <div class="kpi-row">
              <div class="kpi-card kpi-blue">
                <div class="kpi-icon">👥</div>
                <div class="kpi-value">{{ props.baseStats.students || totalStudents }}</div>
                <div class="kpi-label">إجمالي الطلاب</div>
                <div class="kpi-bar">
                  <div
                    class="kpi-fill"
                    :style="{ width: capacityUsed + '%', background: '#1ba8f4' }"
                  ></div>
                </div>
                <div class="kpi-sub">{{ capacityUsed }}% من الطاقة</div>
              </div>

              <div class="kpi-card kpi-green">
                <div class="kpi-icon">👨‍🏫</div>
                <div class="kpi-value">{{ props.baseStats.teachers }}</div>
                <div class="kpi-label">الأساتذة النشطون</div>
                <div class="kpi-sub">{{ props.baseStats.totalCourses }} مادة مسجلة</div>
              </div>

              <div class="kpi-card kpi-amber">
                <div class="kpi-icon">💰</div>
                <div class="kpi-value">
                  {{ (dashData?.revenueThisMonth || 0).toLocaleString('fr-DZ') }}
                </div>
                <div class="kpi-label">إيرادات هذا الشهر (DA)</div>
                <div class="kpi-sub">المدفوعات المستلمة</div>
              </div>

              <div class="kpi-card kpi-purple">
                <div class="kpi-icon">📊</div>
                <div class="kpi-value">{{ dashData?.avgFillRate || 0 }}%</div>
                <div class="kpi-label">متوسط نسبة الامتلاء</div>
                <div class="kpi-bar">
                  <div
                    class="kpi-fill"
                    :style="{ width: (dashData?.avgFillRate || 0) + '%', background: '#8b5cf6' }"
                  ></div>
                </div>
                <div class="kpi-sub">{{ totalCapacity }} مقعد إجمالي</div>
              </div>
            </div>

            <!-- ════ ROW 2: LINE CHART + DONUT ══════════════════════════ -->
            <div class="chart-row-2">
              <!-- Monthly Enrollments Line -->
              <div class="chart-card chart-wide">
                <div class="chart-header">
                  <span class="chart-title">📈 منحنى التسجيل حسب الوقت</span>
                  <span class="chart-badge">آخر 7 أشهر</span>
                </div>
                <div v-if="lineChart.dots.length === 0" class="chart-empty">لا توجد بيانات</div>
                <svg v-else :viewBox="`0 0 ${lineChart.w} ${lineChart.h}`" class="line-svg">
                  <!-- Grid lines -->
                  <line
                    x1="30"
                    y1="14"
                    x2="370"
                    y2="14"
                    stroke="currentColor"
                    stroke-opacity=".06"
                    stroke-width="1"
                  />
                  <line
                    x1="30"
                    y1="48"
                    x2="370"
                    y2="48"
                    stroke="currentColor"
                    stroke-opacity=".06"
                    stroke-width="1"
                  />
                  <line
                    x1="30"
                    y1="82"
                    x2="370"
                    y2="82"
                    stroke="currentColor"
                    stroke-opacity=".06"
                    stroke-width="1"
                  />
                  <line
                    x1="30"
                    y1="106"
                    x2="370"
                    y2="106"
                    stroke="currentColor"
                    stroke-opacity=".06"
                    stroke-width="1"
                  />
                  <!-- Gradient fill -->
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#1ba8f4" stop-opacity=".3" />
                      <stop offset="100%" stop-color="#1ba8f4" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon :points="lineChart.fillPts" fill="url(#lineGrad)" />
                  <!-- Line -->
                  <polyline
                    :points="lineChart.points"
                    fill="none"
                    stroke="#1ba8f4"
                    stroke-width="2.5"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                  />
                  <!-- Dots -->
                  <g v-for="dot in lineChart.dots" :key="dot.month">
                    <circle
                      :cx="dot.x"
                      :cy="dot.y"
                      r="4"
                      fill="#1ba8f4"
                      stroke="white"
                      stroke-width="2"
                    />
                    <text
                      :x="dot.x"
                      :y="lineChart.h - 6"
                      text-anchor="middle"
                      font-size="8"
                      fill="currentColor"
                      fill-opacity=".5"
                    >
                      {{ dot.month.split(' ')[0] }}
                    </text>
                    <text
                      :x="dot.x"
                      :y="dot.y - 9"
                      text-anchor="middle"
                      font-size="9"
                      fill="#1ba8f4"
                      font-weight="bold"
                    >
                      {{ dot.count }}
                    </text>
                  </g>
                </svg>
              </div>

              <!-- Payment Donut -->
              <div class="chart-card chart-narrow">
                <div class="chart-header">
                  <span class="chart-title">💳 توزيع الدفعات</span>
                </div>
                <div v-if="!donutPayment.length" class="chart-empty">لا توجد بيانات</div>
                <div v-else class="donut-wrap">
                  <svg viewBox="0 0 140 140" class="donut-svg">
                    <circle
                      cx="70"
                      cy="70"
                      r="54"
                      fill="none"
                      stroke="currentColor"
                      stroke-opacity=".06"
                      stroke-width="20"
                    />
                    <circle
                      v-for="seg in donutPayment"
                      :key="seg.status"
                      :cx="seg.cx"
                      :cy="seg.cy"
                      :r="seg.r"
                      fill="none"
                      :stroke="seg.color"
                      stroke-width="20"
                      :stroke-dasharray="seg.dasharray"
                      :stroke-dashoffset="seg.dashoffset"
                      stroke-linecap="butt"
                      transform="rotate(-90 70 70)"
                      style="transition: stroke-dasharray 1s ease"
                    />
                    <text
                      x="70"
                      y="65"
                      text-anchor="middle"
                      font-size="18"
                      font-weight="bold"
                      fill="currentColor"
                    >
                      {{ donutPayment.reduce((s, d) => s + d.count, 0) }}
                    </text>
                    <text
                      x="70"
                      y="80"
                      text-anchor="middle"
                      font-size="8"
                      fill="currentColor"
                      fill-opacity=".5"
                    >
                      تسجيل
                    </text>
                  </svg>
                  <div class="donut-legend">
                    <div v-for="seg in donutPayment" :key="seg.status" class="legend-item">
                      <span class="legend-dot" :style="{ background: seg.color }"></span>
                      <span class="legend-lbl">{{ seg.label }}</span>
                      <span class="legend-val">{{ seg.count }} ({{ seg.pct }}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ════ ROW 3: LEVEL BARS + REVENUE + TEACHERS ════════════ -->
            <div class="chart-row-3">
              <!-- By Level -->
              <div class="chart-card">
                <div class="chart-header">
                  <span class="chart-title">🏫 الطلاب حسب المستوى</span>
                </div>
                <div class="level-bars">
                  <div v-for="b in levelBars" :key="b.level" class="level-item">
                    <div class="level-meta">
                      <span class="level-name">{{ b.label }}</span>
                      <span class="level-count" :style="{ color: b.color }">{{ b.count }}</span>
                    </div>
                    <div class="bar-track">
                      <div
                        class="bar-fill"
                        :style="{ width: b.width + '%', background: b.color }"
                      ></div>
                    </div>
                  </div>
                  <div v-if="!levelBars.length" class="chart-empty">لا توجد بيانات</div>
                </div>
              </div>

              <!-- Revenue trend mini bars -->
              <div class="chart-card">
                <div class="chart-header">
                  <span class="chart-title">💵 منحنى الإيرادات</span>
                  <span class="chart-badge">DA</span>
                </div>
                <div class="rev-bars">
                  <div v-for="b in revenueBars" :key="b.month" class="rev-col">
                    <div class="rev-val">{{ (b.revenue / 1000).toFixed(0) }}k</div>
                    <div class="rev-bar-wrap">
                      <div
                        class="rev-bar"
                        :style="{ height: b.height + 'px', background: b.color }"
                      ></div>
                    </div>
                    <div class="rev-month">{{ b.month.split(' ')[0] }}</div>
                  </div>
                  <div v-if="!revenueBars.length" class="chart-empty">لا توجد بيانات</div>
                </div>
              </div>

              <!-- Teacher performance -->
              <div class="chart-card">
                <div class="chart-header">
                  <span class="chart-title">🏆 أداء الأساتذة</span>
                </div>
                <div class="teacher-bars">
                  <div v-for="t in teacherBars" :key="t.name" class="teacher-item">
                    <div class="teacher-meta">
                      <div class="teacher-avatar" :style="{ background: t.color }">
                        {{ t.name.charAt(0) }}
                      </div>
                      <div>
                        <div class="teacher-name">{{ t.name }}</div>
                        <div class="teacher-sub">{{ t.courses }} مادة · {{ t.students }} طالب</div>
                      </div>
                    </div>
                    <div class="bar-track">
                      <div
                        class="bar-fill"
                        :style="{ width: t.pct + '%', background: t.color }"
                      ></div>
                    </div>
                  </div>
                  <div v-if="!teacherBars.length" class="chart-empty">لا توجد بيانات</div>
                </div>
              </div>
            </div>

            <!-- ════ ROW 4: TOP COURSES ═══════════════════════════════════ -->
            <div class="chart-card chart-full">
              <div class="chart-header">
                <span class="chart-title">📚 أفضل المواد تسجيلاً</span>
              </div>
              <div class="top-courses">
                <div v-for="c in topCourseBars" :key="c.title" class="tc-item">
                  <div class="tc-title">{{ c.title }}</div>
                  <div class="tc-bar-wrap">
                    <div class="tc-bar" :style="{ width: c.barW + '%', background: c.color }"></div>
                  </div>
                  <div class="tc-stats">
                    <span class="tc-count">{{ c.count }}</span>
                    <span class="tc-fill" :style="{ color: c.color }"
                      >{{ Math.round(c.fillPct) }}%</span
                    >
                  </div>
                </div>
                <div v-if="!topCourseBars.length" class="chart-empty">لا توجد بيانات</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Modal shell ───────────────────────────────────────────────────────── */
.dashboard-modal {
  width: min(1140px, 98vw);
  max-height: 92vh;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5);
}
.dash-light {
  background: #f0f4f9;
  color: #1e293b;
}
.dash-dark {
  background: #0d1627;
  color: #e2e8f0;
}

/* ── Header ──────────────────────────────────────────────────────────── */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.5rem;
  background: #040d1f;
  color: white;
  flex-shrink: 0;
}
.dash-header-left {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
.dash-logo {
  width: 40px;
  height: 40px;
  background: #1ba8f4;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.dash-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
}
.dash-subtitle {
  font-size: 0.72rem;
  opacity: 0.45;
  margin: 0;
}
.dash-close {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  cursor: pointer;
  padding: 0.55rem;
  border-radius: 8px;
  color: white;
  transition: background 0.2s;
}
.dash-close:hover {
  background: rgba(255, 255, 255, 0.18);
}

/* ── Loading ──────────────────────────────────────────────────────────── */
.dash-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #64748b;
}
.dash-spinner {
  width: 42px;
  height: 42px;
  border: 3px solid rgba(27, 168, 244, 0.2);
  border-top-color: #1ba8f4;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Body scrollable ─────────────────────────────────────────────────── */
.dash-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── KPI row ─────────────────────────────────────────────────────────── */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.8rem;
}
@media (max-width: 900px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

.kpi-card {
  border-radius: 14px;
  padding: 1.1rem;
  color: white;
  position: relative;
  overflow: hidden;
}
.kpi-blue {
  background: linear-gradient(135deg, #0255ae, #1ba8f4);
}
.kpi-green {
  background: linear-gradient(135deg, #059669, #10b981);
}
.kpi-amber {
  background: linear-gradient(135deg, #d97706, #f59e0b);
}
.kpi-purple {
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
}

.kpi-icon {
  font-size: 1.5rem;
  margin-bottom: 0.4rem;
}
.kpi-value {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 0.2rem;
}
.kpi-label {
  font-size: 0.72rem;
  opacity: 0.75;
  margin-bottom: 0.6rem;
}
.kpi-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin-bottom: 0.4rem;
}
.kpi-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 1.2s ease;
}
.kpi-sub {
  font-size: 0.68rem;
  opacity: 0.6;
}

/* ── Chart cards ────────────────────────────────────────────────────── */
.chart-card {
  border-radius: 14px;
  padding: 1rem 1.1rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.07);
}
.dash-light .chart-card {
  background: white;
  border-color: rgba(2, 85, 174, 0.07);
  box-shadow: 0 2px 12px rgba(2, 85, 174, 0.06);
}
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}
.chart-title {
  font-size: 0.82rem;
  font-weight: 600;
}
.chart-badge {
  font-size: 0.65rem;
  padding: 0.2rem 0.55rem;
  background: rgba(27, 168, 244, 0.15);
  color: #1ba8f4;
  border-radius: 999px;
}
.chart-empty {
  text-align: center;
  opacity: 0.35;
  font-size: 0.8rem;
  padding: 1.5rem 0;
}

/* ── Chart rows layout ──────────────────────────────────────────────── */
.chart-row-2 {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 0.8rem;
}
.chart-row-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
}
.chart-full {
  width: 100%;
}
.chart-wide {
}
.chart-narrow {
}
@media (max-width: 900px) {
  .chart-row-2,
  .chart-row-3 {
    grid-template-columns: 1fr;
  }
}

/* ── Line SVG ───────────────────────────────────────────────────────── */
.line-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

/* ── Donut ──────────────────────────────────────────────────────────── */
.donut-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}
.donut-svg {
  width: 120px;
  height: 120px;
}
.donut-legend {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.72rem;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-lbl {
  flex: 1;
  opacity: 0.8;
}
.legend-val {
  font-weight: 600;
}

/* ── Level bars ─────────────────────────────────────────────────────── */
.level-bars {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.level-item {
}
.level-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  margin-bottom: 0.35rem;
}
.level-name {
  opacity: 0.75;
}
.level-count {
  font-weight: 700;
}
.bar-track {
  height: 8px;
  background: rgba(128, 128, 128, 0.12);
  border-radius: 4px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 1s ease;
}

/* ── Revenue bars ───────────────────────────────────────────────────── */
.rev-bars {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  height: 120px;
  padding-top: 1rem;
}
.rev-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}
.rev-val {
  font-size: 0.65rem;
  opacity: 0.6;
}
.rev-bar-wrap {
  flex: 1;
  display: flex;
  align-items: flex-end;
}
.rev-bar {
  width: 100%;
  min-height: 4px;
  border-radius: 4px 4px 0 0;
  transition: height 0.8s ease;
}
.rev-month {
  font-size: 0.62rem;
  opacity: 0.5;
}

/* ── Teacher bars ───────────────────────────────────────────────────── */
.teacher-bars {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.teacher-item {
}
.teacher-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.4rem;
}
.teacher-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}
.teacher-name {
  font-size: 0.78rem;
  font-weight: 600;
}
.teacher-sub {
  font-size: 0.65rem;
  opacity: 0.5;
}

/* ── Top courses ────────────────────────────────────────────────────── */
.top-courses {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.tc-item {
  display: grid;
  grid-template-columns: 160px 1fr 80px;
  align-items: center;
  gap: 0.8rem;
}
.tc-title {
  font-size: 0.78rem;
  font-weight: 500;
}
.tc-bar-wrap {
  height: 10px;
  background: rgba(128, 128, 128, 0.1);
  border-radius: 5px;
  overflow: hidden;
}
.tc-bar {
  height: 100%;
  border-radius: 5px;
  transition: width 1s ease;
}
.tc-stats {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
}
.tc-count {
  font-weight: 700;
}
.tc-fill {
  font-weight: 600;
}
@media (max-width: 600px) {
  .tc-item {
    grid-template-columns: 1fr;
  }
}

/* ── Modal transition ────────────────────────────────────────────────── */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
