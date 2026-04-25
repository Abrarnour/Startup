<script setup>
// src/components/StatsModal.vue
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  darkMode: { type: Boolean, default: false },
  baseStats: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['close'])

const loading = ref(true)
const error = ref(null)
const dash = ref(null) // raw API response

// ── Fetch ─────────────────────────────────────────────────────────────────────
const fetchDash = async () => {
  loading.value = true
  error.value = null
  try {
    const token = localStorage.getItem('token')
    const API =
      import.meta.env.VITE_API_URL || 'https://belmahi-school-production.up.railway.app/api'
    const res = await fetch(`${API}/stats/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.detail || body.error || `HTTP ${res.status}`)
    }
    dash.value = await res.json()
  } catch (e) {
    error.value = e.message
    console.error('Dashboard fetch error:', e)
  } finally {
    loading.value = false
  }
}
watch(
  () => props.show,
  (v) => {
    if (v && !dash.value) fetchDash()
  },
)
onMounted(() => {
  if (props.show) fetchDash()
})

// ── Palette ───────────────────────────────────────────────────────────────────
const PAL = ['#1ba8f4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
const PAY_COLOR = { paid: '#10b981', pending: '#f59e0b', inactive: '#ef4444' }
const PAY_LABEL = { paid: 'مدفوع ✓', pending: 'معلق ⏳', inactive: 'غير نشط ✗' }
const LVL_COLOR = { primaire: '#10b981', moyen: '#3b82f6', secondaire: '#8b5cf6' }
const LVL_LABEL = { primaire: 'ابتدائي', moyen: 'متوسط', secondaire: 'ثانوي' }

// ── KPIs (using dash data + baseStats fallback) ───────────────────────────────
const kpis = computed(() => {
  const d = dash.value
  const bs = props.baseStats
  const enrolled = parseInt(d?.capacityData?.enrolled_students ?? bs.students ?? 0)
  const capacity = parseInt(d?.capacityData?.total_capacity ?? 0)
  const fillPct = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0
  const paid = d?.paymentDistribution?.find((r) => r.payment_status === 'paid')?.count ?? 0
  const pending = d?.paymentDistribution?.find((r) => r.payment_status === 'pending')?.count ?? 0
  const totalEnroll = parseInt(paid) + parseInt(pending)

  return {
    students: enrolled,
    teachers: parseInt(bs.teachers ?? 0),
    totalCourses: parseInt(bs.totalCourses ?? 0),
    revenue: parseFloat(d?.revenueThisMonth ?? 0),
    fillPct,
    capacity,
    paid: parseInt(paid),
    pending: parseInt(pending),
    totalEnroll,
    materials: parseInt(d?.totalMaterials ?? 0),
    avgFill: parseInt(d?.avgFillRate ?? 0),
  }
})

// ── Donut chart ───────────────────────────────────────────────────────────────
const donut = computed(() => {
  const rows = dash.value?.paymentDistribution ?? []
  if (!rows.length) return []
  const total = rows.reduce((s, r) => s + parseInt(r.count), 0) || 1
  const R = 54,
    CX = 70,
    CY = 70,
    CIRC = 2 * Math.PI * R
  let offset = 0
  return rows.map((r) => {
    const pct = parseInt(r.count) / total
    const seg = {
      status: r.payment_status,
      count: parseInt(r.count),
      pct: Math.round(pct * 100),
      color: PAY_COLOR[r.payment_status] || '#64748b',
      label: PAY_LABEL[r.payment_status] || r.payment_status,
      dasharray: `${CIRC * pct} ${CIRC * (1 - pct)}`,
      dashoffset: -(CIRC * offset),
    }
    offset += pct
    return seg
  })
})

// ── Level bars ────────────────────────────────────────────────────────────────
const levelBars = computed(() => {
  const rows = dash.value?.byLevel ?? []
  const max = Math.max(...rows.map((r) => parseInt(r.student_count)), 1)
  return rows.map((r) => ({
    level: r.education_level,
    label: LVL_LABEL[r.education_level] || r.education_level,
    count: parseInt(r.student_count),
    width: (parseInt(r.student_count) / max) * 100,
    color: LVL_COLOR[r.education_level] || '#64748b',
  }))
})

// ── Line chart (monthly enrollments) ─────────────────────────────────────────
const line = computed(() => {
  const raw = dash.value?.monthlyEnrollments ?? []
  if (!raw.length) return null
  const W = 380,
    H = 130,
    PL = 32,
    PR = 12,
    PT = 16,
    PB = 30
  const iW = W - PL - PR,
    iH = H - PT - PB
  const max = Math.max(...raw.map((r) => parseInt(r.count)), 1)
  const pts = raw.map((r, i) => ({
    x: PL + (i / Math.max(raw.length - 1, 1)) * iW,
    y: PT + iH - (parseInt(r.count) / max) * iH,
    count: parseInt(r.count),
    month: r.month,
  }))
  const polyPts = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const fillPts = [
    `${pts[0].x},${PT + iH}`,
    ...pts.map((p) => `${p.x},${p.y}`),
    `${pts[pts.length - 1].x},${PT + iH}`,
  ].join(' ')
  return { pts, polyPts, fillPts, W, H, PT, iH }
})

// ── Top courses bars ──────────────────────────────────────────────────────────
const topCourses = computed(() => {
  const rows = dash.value?.topCourses ?? []
  const max = Math.max(...rows.map((r) => parseInt(r.student_count)), 1)
  return rows.map((r, i) => ({
    title: r.title.length > 20 ? r.title.slice(0, 18) + '…' : r.title,
    count: parseInt(r.student_count),
    cap: parseInt(r.capacity),
    barW: (parseInt(r.student_count) / max) * 100,
    fillPct: Math.round((parseInt(r.student_count) / Math.max(parseInt(r.capacity), 1)) * 100),
    color: PAL[i % PAL.length],
  }))
})

// ── Revenue bars ──────────────────────────────────────────────────────────────
const revBars = computed(() => {
  const rows = dash.value?.monthlyRevenue ?? []
  const max = Math.max(...rows.map((r) => parseFloat(r.revenue)), 1)
  return rows.map((r, i) => ({
    month: r.month.split(' ')[0],
    revenue: parseFloat(r.revenue),
    height: Math.max((parseFloat(r.revenue) / max) * 85, 4),
    color: PAL[i % PAL.length],
  }))
})

// ── Teacher bars ──────────────────────────────────────────────────────────────
const teacherBars = computed(() => {
  const rows = dash.value?.teacherPerformance ?? []
  const max = Math.max(...rows.map((r) => parseInt(r.student_count)), 1)
  return rows.map((r, i) => ({
    name: r.teacher_name.split(' ').slice(0, 2).join(' '),
    students: parseInt(r.student_count),
    courses: parseInt(r.course_count),
    pct: (parseInt(r.student_count) / max) * 100,
    color: PAL[i % PAL.length],
  }))
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade-scale">
      <div v-if="show" class="sm-backdrop" @click.self="emit('close')">
        <div class="sm-box" :class="darkMode ? 'sm-dark' : 'sm-light'">
          <!-- ── Header ──────────────────────────────────────────────── -->
          <div class="sm-hdr">
            <div class="sm-hdr-left">
              <div class="sm-logo">
                <svg
                  width="20"
                  height="20"
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
                <h2 class="sm-title">لوحة الإحصائيات</h2>
                <p class="sm-sub">Belmahi School · Vue en temps réel</p>
              </div>
            </div>
            <button class="sm-close" @click="emit('close')">✕</button>
          </div>

          <!-- ── Loading ────────────────────────────────────────────── -->
          <div v-if="loading" class="sm-center">
            <div class="sm-spin"></div>
            <p>جاري تحميل البيانات…</p>
          </div>

          <!-- ── Error ──────────────────────────────────────────────── -->
          <div v-else-if="error" class="sm-center sm-err">
            <p>⚠️ خطأ في تحميل البيانات</p>
            <p style="font-size: 0.75rem; opacity: 0.6">{{ error }}</p>
            <button @click="fetchDash" class="sm-retry">إعادة المحاولة</button>
          </div>

          <!-- ── Dashboard ──────────────────────────────────────────── -->
          <div v-else class="sm-body">
            <!-- ══ ROW 1 · KPI CARDS ════════════════════════════════ -->
            <div class="kpi-grid">
              <!-- Students -->
              <div class="kpi kpi-blue">
                <div class="kpi-top">
                  <span class="kpi-ico">👥</span>
                  <span class="kpi-num">{{ kpis.students }}</span>
                </div>
                <div class="kpi-lbl">إجمالي الطلاب المسجلين</div>
                <div class="kpi-track">
                  <div
                    class="kpi-fill"
                    :style="{ width: kpis.fillPct + '%', background: '#60c8ff' }"
                  />
                </div>
                <div class="kpi-foot">{{ kpis.fillPct }}% من طاقة {{ kpis.capacity }} مقعد</div>
              </div>

              <!-- Teachers + Courses -->
              <div class="kpi kpi-green">
                <div class="kpi-top">
                  <span class="kpi-ico">👨‍🏫</span>
                  <span class="kpi-num">{{ kpis.teachers }}</span>
                </div>
                <div class="kpi-lbl">الأساتذة النشطون</div>
                <div class="kpi-foot">
                  {{ kpis.totalCourses }} مادة · {{ kpis.materials }} ملف مرفوع
                </div>
              </div>

              <!-- Paid vs Pending -->
              <div class="kpi kpi-amber">
                <div class="kpi-top">
                  <span class="kpi-ico">💳</span>
                  <span class="kpi-num">{{ kpis.paid }}</span>
                </div>
                <div class="kpi-lbl">تسجيلات مدفوعة</div>
                <div class="kpi-track">
                  <div
                    class="kpi-fill"
                    :style="{
                      width:
                        kpis.totalEnroll > 0 ? (kpis.paid / kpis.totalEnroll) * 100 + '%' : '0%',
                      background: '#fff8',
                    }"
                  />
                </div>
                <div class="kpi-foot">{{ kpis.pending }} معلق · {{ kpis.totalEnroll }} إجمالي</div>
              </div>

              <!-- Fill rate -->
              <div class="kpi kpi-purple">
                <div class="kpi-top">
                  <span class="kpi-ico">📊</span>
                  <span class="kpi-num">{{ kpis.avgFill }}%</span>
                </div>
                <div class="kpi-lbl">متوسط امتلاء المجموعات</div>
                <div class="kpi-track">
                  <div
                    class="kpi-fill"
                    :style="{ width: kpis.avgFill + '%', background: '#d8b4fe' }"
                  />
                </div>
                <div class="kpi-foot">
                  Revenue ce mois: {{ kpis.revenue.toLocaleString('fr-DZ') }} DA
                </div>
              </div>
            </div>

            <!-- ══ ROW 2 · LINE + DONUT ════════════════════════════ -->
            <div class="row2">
              <!-- Line chart -->
              <div class="card card-wide">
                <div class="card-hdr">
                  <span class="card-ttl">📈 منحنى التسجيل حسب الوقت</span>
                  <span class="badge">آخر 7 أشهر</span>
                </div>
                <div v-if="!line" class="no-data">لا توجد بيانات بعد</div>
                <svg v-else :viewBox="`0 0 ${line.W} ${line.H}`" class="line-svg">
                  <defs>
                    <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#1ba8f4" stop-opacity=".28" />
                      <stop offset="100%" stop-color="#1ba8f4" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                  <!-- grid -->
                  <line
                    v-for="y in [0.2, 0.5, 0.8]"
                    :key="y"
                    :x1="32"
                    :y1="line.PT + line.iH * (1 - y)"
                    :x2="370"
                    :y2="line.PT + line.iH * (1 - y)"
                    stroke="currentColor"
                    stroke-opacity=".07"
                    stroke-width="1"
                  />
                  <!-- fill -->
                  <polygon :points="line.fillPts" fill="url(#lg)" />
                  <!-- line -->
                  <polyline
                    :points="line.polyPts"
                    fill="none"
                    stroke="#1ba8f4"
                    stroke-width="2.5"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                  />
                  <!-- dots + labels -->
                  <g v-for="d in line.pts" :key="d.month">
                    <circle
                      :cx="d.x"
                      :cy="d.y"
                      r="4"
                      fill="#1ba8f4"
                      stroke="white"
                      stroke-width="2"
                    />
                    <text
                      :x="d.x"
                      :y="d.y - 9"
                      text-anchor="middle"
                      font-size="9"
                      fill="#1ba8f4"
                      font-weight="700"
                    >
                      {{ d.count }}
                    </text>
                    <text
                      :x="d.x"
                      :y="line.H - 6"
                      text-anchor="middle"
                      font-size="8"
                      fill="currentColor"
                      fill-opacity=".45"
                    >
                      {{ d.month.split(' ')[0] }}
                    </text>
                  </g>
                </svg>
              </div>

              <!-- Donut -->
              <div class="card card-narrow">
                <div class="card-hdr">
                  <span class="card-ttl">💳 توزيع الدفعات</span>
                </div>
                <div v-if="!donut.length" class="no-data">لا توجد بيانات</div>
                <div v-else class="donut-wrap">
                  <svg viewBox="0 0 140 140" class="donut-svg">
                    <circle
                      cx="70"
                      cy="70"
                      r="54"
                      fill="none"
                      stroke="currentColor"
                      stroke-opacity=".07"
                      stroke-width="20"
                    />
                    <circle
                      v-for="seg in donut"
                      :key="seg.status"
                      cx="70"
                      cy="70"
                      r="54"
                      fill="none"
                      :stroke="seg.color"
                      stroke-width="20"
                      :stroke-dasharray="seg.dasharray"
                      :stroke-dashoffset="seg.dashoffset"
                      transform="rotate(-90 70 70)"
                    />
                    <text
                      x="70"
                      y="67"
                      text-anchor="middle"
                      font-size="19"
                      font-weight="800"
                      fill="currentColor"
                    >
                      {{ donut.reduce((s, d) => s + d.count, 0) }}
                    </text>
                    <text
                      x="70"
                      y="80"
                      text-anchor="middle"
                      font-size="8"
                      fill="currentColor"
                      fill-opacity=".45"
                    >
                      إجمالي
                    </text>
                  </svg>
                  <div class="donut-legend">
                    <div v-for="seg in donut" :key="seg.status" class="legend-row">
                      <span class="legend-dot" :style="{ background: seg.color }" />
                      <span class="legend-lbl">{{ seg.label }}</span>
                      <span class="legend-num">{{ seg.count }} ({{ seg.pct }}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ══ ROW 3 · LEVELS + REVENUE + TEACHERS ════════════ -->
            <div class="row3">
              <!-- Level bars -->
              <div class="card">
                <div class="card-hdr"><span class="card-ttl">🏫 الطلاب حسب المستوى</span></div>
                <div v-if="!levelBars.length" class="no-data">لا توجد بيانات</div>
                <div v-else class="lvl-list">
                  <div v-for="b in levelBars" :key="b.level" class="lvl-item">
                    <div class="lvl-meta">
                      <span class="lvl-name">{{ b.label }}</span>
                      <span class="lvl-cnt" :style="{ color: b.color }">{{ b.count }} طالب</span>
                    </div>
                    <div class="bar-track">
                      <div
                        class="bar-fill"
                        :style="{ width: b.width + '%', background: b.color }"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Revenue bars -->
              <div class="card">
                <div class="card-hdr">
                  <span class="card-ttl">💵 الإيرادات الشهرية</span>
                  <span class="badge">DA</span>
                </div>
                <div v-if="!revBars.length" class="no-data">لا توجد مدفوعات مسجلة</div>
                <div v-else class="rev-bars">
                  <div v-for="b in revBars" :key="b.month" class="rev-col">
                    <div class="rev-val">{{ (b.revenue / 1000).toFixed(0) }}k</div>
                    <div class="rev-track">
                      <div
                        class="rev-bar"
                        :style="{ height: b.height + 'px', background: b.color }"
                      />
                    </div>
                    <div class="rev-mo">{{ b.month }}</div>
                  </div>
                </div>
              </div>

              <!-- Teacher perf -->
              <div class="card">
                <div class="card-hdr"><span class="card-ttl">🏆 أداء الأساتذة</span></div>
                <div v-if="!teacherBars.length" class="no-data">لا توجد بيانات</div>
                <div v-else class="tch-list">
                  <div v-for="t in teacherBars" :key="t.name" class="tch-item">
                    <div class="tch-meta">
                      <div class="tch-av" :style="{ background: t.color }">
                        {{ t.name.charAt(0) }}
                      </div>
                      <div>
                        <div class="tch-name">{{ t.name }}</div>
                        <div class="tch-sub">{{ t.courses }} مادة · {{ t.students }} طالب</div>
                      </div>
                    </div>
                    <div class="bar-track">
                      <div class="bar-fill" :style="{ width: t.pct + '%', background: t.color }" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ══ ROW 4 · TOP COURSES ═══════════════════════════ -->
            <div class="card card-full">
              <div class="card-hdr"><span class="card-ttl">📚 أفضل المواد تسجيلاً</span></div>
              <div v-if="!topCourses.length" class="no-data">لا توجد بيانات</div>
              <div v-else class="tc-grid">
                <div v-for="c in topCourses" :key="c.title" class="tc-row">
                  <span class="tc-title">{{ c.title }}</span>
                  <div class="bar-track tc-bar-track">
                    <div class="bar-fill" :style="{ width: c.barW + '%', background: c.color }" />
                  </div>
                  <span class="tc-nums">
                    <strong>{{ c.count }}</strong> طالب
                    <span :style="{ color: c.color }">&nbsp;{{ c.fillPct }}%</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <!-- /sm-body -->
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Backdrop ───────────────────────────────────────────────────────── */
.sm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: rgba(4, 13, 31, 0.82);
  backdrop-filter: blur(8px);
}

/* ── Modal box ──────────────────────────────────────────────────────── */
.sm-box {
  width: min(1180px, 98vw);
  max-height: 93vh;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.55);
}
.sm-light {
  background: #f1f5fb;
  color: #1e293b;
}
.sm-dark {
  background: #0d1627;
  color: #e2e8f0;
}

/* ── Header ─────────────────────────────────────────────────────────── */
.sm-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.4rem;
  background: #040d1f;
  color: #fff;
  flex-shrink: 0;
}
.sm-hdr-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.sm-logo {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #1ba8f4;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.sm-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}
.sm-sub {
  font-size: 0.7rem;
  opacity: 0.4;
  margin: 0;
}
.sm-close {
  background: rgba(255, 255, 255, 0.09);
  border: none;
  cursor: pointer;
  padding: 0.5rem 0.7rem;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  transition: background 0.2s;
}
.sm-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* ── States ─────────────────────────────────────────────────────────── */
.sm-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  color: #64748b;
  padding: 2rem;
}
.sm-err {
  color: #ef4444;
}
.sm-spin {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(27, 168, 244, 0.2);
  border-top-color: #1ba8f4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.sm-retry {
  margin-top: 0.5rem;
  padding: 0.45rem 1.1rem;
  border-radius: 8px;
  background: #1ba8f4;
  color: #fff;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.82rem;
}

/* ── Scrollable body ────────────────────────────────────────────────── */
.sm-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

/* ── KPI grid ───────────────────────────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}
@media (max-width: 860px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.kpi {
  border-radius: 14px;
  padding: 1.05rem 1.1rem;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.kpi-blue {
  background: linear-gradient(135deg, #0255ae, #1ba8f4);
}
.kpi-green {
  background: linear-gradient(135deg, #059669, #10b981);
}
.kpi-amber {
  background: linear-gradient(135deg, #b45309, #f59e0b);
}
.kpi-purple {
  background: linear-gradient(135deg, #6d28d9, #8b5cf6);
}

.kpi-top {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.kpi-ico {
  font-size: 1.4rem;
}
.kpi-num {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
}
.kpi-lbl {
  font-size: 0.72rem;
  opacity: 0.75;
}
.kpi-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
.kpi-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 1.2s ease;
}
.kpi-foot {
  font-size: 0.67rem;
  opacity: 0.55;
}

/* ── Cards ──────────────────────────────────────────────────────────── */
.card {
  border-radius: 14px;
  padding: 0.95rem 1.05rem;
}
.sm-light .card {
  background: #fff;
  box-shadow: 0 2px 14px rgba(2, 85, 174, 0.07);
  border: 1px solid rgba(2, 85, 174, 0.06);
}
.sm-dark .card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.07);
}
.card-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.card-ttl {
  font-size: 0.82rem;
  font-weight: 600;
}
.badge {
  font-size: 0.65rem;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  background: rgba(27, 168, 244, 0.13);
  color: #1ba8f4;
}
.no-data {
  text-align: center;
  opacity: 0.3;
  font-size: 0.78rem;
  padding: 1.4rem 0;
}

/* ── Row layouts ────────────────────────────────────────────────────── */
.row2 {
  display: grid;
  grid-template-columns: 1fr 270px;
  gap: 0.75rem;
}
.row3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}
.card-full {
  width: 100%;
}
@media (max-width: 860px) {
  .row2,
  .row3 {
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
  gap: 0.75rem;
}
.donut-svg {
  width: 110px;
  height: 110px;
}
.donut-legend {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
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
.legend-num {
  font-weight: 600;
}

/* ── Level bars ─────────────────────────────────────────────────────── */
.lvl-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.lvl-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.77rem;
  margin-bottom: 0.3rem;
}
.lvl-name {
  opacity: 0.7;
}
.lvl-cnt {
  font-weight: 700;
}

/* ── Common bar ─────────────────────────────────────────────────────── */
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
  height: 115px;
  padding-top: 0.5rem;
}
.rev-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}
.rev-val {
  font-size: 0.64rem;
  opacity: 0.55;
}
.rev-track {
  flex: 1;
  display: flex;
  align-items: flex-end;
  width: 100%;
}
.rev-bar {
  width: 100%;
  min-height: 4px;
  border-radius: 4px 4px 0 0;
  transition: height 0.8s ease;
}
.rev-mo {
  font-size: 0.62rem;
  opacity: 0.45;
}

/* ── Teacher bars ───────────────────────────────────────────────────── */
.tch-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.tch-meta {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.35rem;
}
.tch-av {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
}
.tch-name {
  font-size: 0.77rem;
  font-weight: 600;
}
.tch-sub {
  font-size: 0.64rem;
  opacity: 0.45;
}

/* ── Top courses ────────────────────────────────────────────────────── */
.tc-grid {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.tc-row {
  display: grid;
  grid-template-columns: 180px 1fr 130px;
  align-items: center;
  gap: 0.75rem;
}
.tc-title {
  font-size: 0.78rem;
  font-weight: 500;
}
.tc-bar-track {
  height: 10px;
}
.tc-nums {
  font-size: 0.72rem;
}
@media (max-width: 600px) {
  .tc-row {
    grid-template-columns: 1fr;
  }
}

/* ── Transition ─────────────────────────────────────────────────────── */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.28s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
