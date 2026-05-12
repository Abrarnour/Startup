text

<script setup>
/**
 * ChildHistoryModal.vue — Parent Dashboard
 * Shows full history (sessions, absences, payments, timeline) for ONE child.
 * No search bar — child is received as a prop.
 * Calls GET /api/parents/children/:studentId/history (parent-auth endpoint).
 */
import { ref, watch, computed } from 'vue'
import { getChildHistory } from '../services/api.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  darkMode: { type: Boolean, default: false },
  child: { type: Object, default: null }, // { id, name, last_name, email, … }
})
const emit = defineEmits(['close'])

// ── Data ──────────────────────────────────────────────────────────────────────
const historyData = ref(null)
const loading = ref(false)
const error = ref('')
const activeTab = ref('overview')

// ── Filters ───────────────────────────────────────────────────────────────────
const dateFrom = ref('')
const dateTo = ref('')
const courseFilter = ref('')

const resetFilters = () => {
  dateFrom.value = ''
  dateTo.value = ''
  courseFilter.value = ''
}

const inRange = (d) => {
  if (!d) return false
  const dt = new Date(d)
  if (dateFrom.value && dt < new Date(dateFrom.value)) return false
  if (dateTo.value && dt > new Date(dateTo.value + 'T23:59:59')) return false
  return true
}
const matchCourse = (title) =>
  !courseFilter.value || (title || '').toLowerCase().includes(courseFilter.value.toLowerCase())

// ── Computed filtered data ────────────────────────────────────────────────────
const filteredSessions = computed(() => {
  if (!historyData.value?.attendance) return []
  return historyData.value.attendance.filter(
    (a) => inRange(a.scanned_at) && matchCourse(a.course_title),
  )
})
const filteredAbsences = computed(() => {
  if (!historyData.value?.absences) return []
  return historyData.value.absences.filter(
    (a) => inRange(a.session_date) && matchCourse(a.course_title),
  )
})
const filteredPayments = computed(() => {
  if (!historyData.value?.payments) return []
  return historyData.value.payments.filter((p) => inRange(p.payment_date))
})
const filteredTimeline = computed(() => {
  if (!historyData.value?.timeline) return []
  return historyData.value.timeline.filter((e) => inRange(e.date))
})

// ── Stats ─────────────────────────────────────────────────────────────────────
const totalPresent = computed(() => historyData.value?.attendance?.length ?? 0)
const totalAbsent = computed(() => historyData.value?.absences?.length ?? 0)
const attendanceRate = computed(() => {
  const total = totalPresent.value + totalAbsent.value
  return total === 0 ? 100 : Math.round((totalPresent.value / total) * 100)
})
const totalPaid = computed(() =>
  (historyData.value?.payments ?? []).reduce((s, p) => s + parseFloat(p.amount_paid || 0), 0),
)

const allCourses = computed(() => {
  if (!historyData.value) return []
  const set = new Set()
  ;(historyData.value.attendance ?? []).forEach((a) => set.add(a.course_title))
  ;(historyData.value.absences ?? []).forEach((a) => set.add(a.course_title))
  return [...set].sort()
})

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d, time = true) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-DZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(time ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}
const dayMap = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
}

// ── Load when modal opens or child changes ────────────────────────────────────
const loadHistory = async () => {
  if (!props.child?.id) return
  historyData.value = null
  error.value = ''
  loading.value = true
  activeTab.value = 'overview'
  resetFilters()
  try {
    historyData.value = await getChildHistory(props.child.id)
  } catch (e) {
    error.value = e.message || 'Erreur de chargement'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.show,
  (v) => {
    if (v) loadHistory()
  },
)
watch(
  () => props.child?.id,
  (v) => {
    if (v && props.show) loadHistory()
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="chm-fade">
      <div v-if="show" class="chm-backdrop" @click.self="emit('close')">
        <div class="chm-shell" :class="{ dark: darkMode }">
          <!-- ══ HEADER ════════════════════════════════════════════════════════ -->
          <header class="chm-header">
            <div class="chm-header-left">
              <div class="chm-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              <div>
                <h2 class="chm-title">سجل {{ child?.name }} {{ child?.last_name }}</h2>
                <p class="chm-subtitle">Historique · Séances · Absences · Paiements</p>
              </div>
            </div>
            <button class="chm-close" @click="emit('close')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <!-- ══ LOADING ═══════════════════════════════════════════════════════ -->
          <div v-if="loading" class="chm-loading">
            <div class="chm-dots"><span /><span /><span /></div>
            <p>Chargement de l'historique…</p>
          </div>

          <!-- ══ ERROR ═════════════════════════════════════════════════════════ -->
          <div v-else-if="error" class="chm-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {{ error }}
          </div>

          <!-- ══ CONTENT ═══════════════════════════════════════════════════════ -->
          <div v-else-if="historyData" class="chm-content">
            <!-- Banner -------------------------------------------------------- -->
            <div class="chm-banner">
              <div class="chm-avatar-lg">
                <img
                  v-if="historyData.profile?.photo_url"
                  :src="historyData.profile.photo_url"
                  alt="photo"
                />
                <span v-else
                  >{{ historyData.profile?.name?.[0]
                  }}{{ historyData.profile?.last_name?.[0] }}</span
                >
              </div>
              <div class="chm-banner-info">
                <h3 class="chm-student-name">
                  {{ historyData.profile?.last_name }} {{ historyData.profile?.name }}
                </h3>
                <p class="chm-student-meta">{{ historyData.profile?.email }}</p>
                <p class="chm-student-meta">
                  {{ historyData.profile?.city || '' }}
                  {{ historyData.profile?.phone ? '· ' + historyData.profile.phone : '' }}
                </p>
              </div>
              <div class="chm-kpis">
                <div class="chm-kpi chm-kpi-green">
                  <span class="chm-kpi-val">{{ totalPresent }}</span>
                  <span class="chm-kpi-lbl">Séances</span>
                </div>
                <div class="chm-kpi chm-kpi-red">
                  <span class="chm-kpi-val">{{ totalAbsent }}</span>
                  <span class="chm-kpi-lbl">Absences</span>
                </div>
                <div class="chm-kpi chm-kpi-blue">
                  <span class="chm-kpi-val">{{ attendanceRate }}%</span>
                  <span class="chm-kpi-lbl">Présence</span>
                </div>
                <div class="chm-kpi chm-kpi-purple">
                  <span class="chm-kpi-val">{{ totalPaid.toLocaleString('fr-DZ') }}</span>
                  <span class="chm-kpi-lbl">DA payé</span>
                </div>
              </div>
            </div>

            <!-- Filters ------------------------------------------------------- -->
            <div class="chm-filters">
              <input v-model="dateFrom" type="date" class="chm-filter-input" title="De" />
              <input v-model="dateTo" type="date" class="chm-filter-input" title="À" />
              <select v-model="courseFilter" class="chm-filter-input">
                <option value="">Tous les cours</option>
                <option v-for="c in allCourses" :key="c" :value="c">{{ c }}</option>
              </select>
              <button @click="resetFilters" class="chm-filter-reset">✕ Réinitialiser</button>
            </div>

            <!-- Tabs ---------------------------------------------------------- -->
            <nav class="chm-tabs">
              <button
                v-for="tab in [
                  { key: 'overview', label: 'Aperçu' },
                  { key: 'sessions', label: 'Séances', badge: totalPresent },
                  { key: 'absences', label: 'Absences', badge: totalAbsent },
                  { key: 'payments', label: 'Paiements' },
                  { key: 'timeline', label: 'Chronologie' },
                ]"
                :key="tab.key"
                @click="activeTab = tab.key"
                :class="['chm-tab', activeTab === tab.key ? 'chm-tab-active' : '']"
              >
                {{ tab.label }}
                <span
                  v-if="tab.badge"
                  :class="tab.key === 'absences' ? 'chm-badge-red' : 'chm-badge-blue'"
                  class="chm-badge"
                >
                  {{ tab.badge }}
                </span>
              </button>
            </nav>

            <!-- ── OVERVIEW ─────────────────────────────────────────────────── -->
            <div v-if="activeTab === 'overview'" class="chm-panel">
              <div class="chm-overview-grid">
                <div
                  v-for="e in historyData.enrollments"
                  :key="e.enrollment_id"
                  class="chm-course-card"
                >
                  <div class="chm-cc-top">
                    <div>
                      <p class="chm-cc-title">{{ e.course_title }}</p>
                      <p class="chm-cc-group">
                        {{ e.group_name }} · {{ dayMap[e.day_of_week] || e.day_of_week }}
                        {{ e.session_start_time }}
                      </p>
                    </div>
                    <span
                      :class="
                        e.enrollment_status === 'active' ? 'chm-badge-green' : 'chm-badge-gray'
                      "
                      class="chm-badge"
                    >
                      {{ e.enrollment_status === 'active' ? 'Actif' : e.enrollment_status }}
                    </span>
                  </div>
                  <div class="chm-cc-meta">
                    <span class="chm-cc-since"
                      >Inscrit le {{ fmtDate(e.enrollment_date, false) }}</span
                    >
                    <span :class="e.payment_status === 'paid' ? 'chm-pill-green' : 'chm-pill-red'">
                      {{ e.payment_status === 'paid' ? '✓ Payé' : '✗ En attente' }}
                    </span>
                  </div>
                  <div v-if="e.sessions_attended !== undefined" class="chm-mini-bar-wrap">
                    <div class="chm-mini-bar-track">
                      <div
                        class="chm-mini-bar-fill"
                        :style="{
                          width: e.group_total_sessions
                            ? Math.min(
                                100,
                                Math.round((e.sessions_attended / e.group_total_sessions) * 100),
                              ) + '%'
                            : '0%',
                          background: '#6366f1',
                        }"
                      />
                    </div>
                    <span class="chm-mini-bar-label">
                      {{ e.sessions_attended }} séance{{
                        e.sessions_attended !== 1 ? 's' : ''
                      }}
                      assistée{{ e.sessions_attended !== 1 ? 's' : '' }}
                      <span v-if="e.group_total_sessions"> / {{ e.group_total_sessions }}</span>
                    </span>
                  </div>
                </div>
              </div>
              <p v-if="!historyData.enrollments?.length" class="chm-no-data">
                Aucune inscription enregistrée.
              </p>
            </div>

            <!-- ── SESSIONS ──────────────────────────────────────────────────── -->
            <div v-if="activeTab === 'sessions'" class="chm-panel">
              <div v-if="filteredSessions.length" class="chm-table-wrap">
                <table class="chm-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date & heure</th>
                      <th>Cours</th>
                      <th>Groupe</th>
                      <th class="chm-th-center">Séance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(a, i) in filteredSessions" :key="a.id" class="chm-tr">
                      <td class="chm-td-light">{{ i + 1 }}</td>
                      <td class="chm-td-date">
                        <span class="chm-date-badge">{{ fmtDate(a.scanned_at) }}</span>
                      </td>
                      <td class="chm-td-course">{{ a.course_title }}</td>
                      <td class="chm-td-light">{{ a.group_name }}</td>
                      <td class="chm-td-center">
                        <span class="chm-session-num">#{{ a.session_number }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="chm-no-data chm-no-data-good">✓ Aucune séance dans cette plage.</p>
            </div>

            <!-- ── ABSENCES ──────────────────────────────────────────────────── -->
            <div v-if="activeTab === 'absences'" class="chm-panel">
              <div v-if="filteredAbsences.length" class="chm-table-wrap">
                <table class="chm-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Cours</th>
                      <th>Groupe</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(a, i) in filteredAbsences" :key="i" class="chm-tr chm-tr-absent">
                      <td class="chm-td-light">{{ i + 1 }}</td>
                      <td class="chm-td-date">
                        <span class="chm-absent-badge">{{ fmtDate(a.session_date, false) }}</span>
                      </td>
                      <td class="chm-td-course">{{ a.course_title }}</td>
                      <td class="chm-td-light">{{ a.group_name }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="chm-no-data chm-no-data-good">✓ Aucune absence dans cette plage.</p>
            </div>

            <!-- ── PAYMENTS ──────────────────────────────────────────────────── -->
            <div v-if="activeTab === 'payments'" class="chm-panel">
              <div class="chm-pay-summary">
                Total payé : <strong>{{ totalPaid.toLocaleString('fr-DZ') }} DA</strong>
              </div>
              <div v-if="filteredPayments.length" class="chm-table-wrap">
                <table class="chm-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Cours</th>
                      <th>Statut</th>
                      <th class="chm-th-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in filteredPayments" :key="p.id" class="chm-tr">
                      <td class="chm-td-date">
                        <span class="chm-date-badge">{{ fmtDate(p.payment_date, false) }}</span>
                      </td>
                      <td class="chm-td-course">{{ p.course_title }}</td>
                      <td>
                        <span
                          :class="p.payment_status === 'paid' ? 'chm-pill-green' : 'chm-pill-red'"
                        >
                          {{ p.payment_status === 'paid' ? '✓ Payé' : '⏳ Attente' }}
                        </span>
                      </td>
                      <td class="chm-td-amount">
                        {{ parseFloat(p.amount_paid || 0).toLocaleString('fr-DZ') }} DA
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="chm-no-data">Aucun paiement enregistré dans cette plage.</p>
            </div>

            <!-- ── TIMELINE ──────────────────────────────────────────────────── -->
            <div v-if="activeTab === 'timeline'" class="chm-panel">
              <div v-if="filteredTimeline.length" class="chm-timeline">
                <div v-for="(ev, i) in filteredTimeline" :key="i" class="chm-tl-item">
                  <div
                    :class="{
                      'chm-dot-purple': ev.type === 'account_created',
                      'chm-dot-blue': ev.type === 'enrollment',
                      'chm-dot-green': ev.type === 'attendance',
                      'chm-dot-red': ev.type === 'absence',
                      'chm-dot-yellow': ev.type === 'payment',
                    }"
                    class="chm-tl-dot"
                  />
                  <div class="chm-tl-body">
                    <p class="chm-tl-label">{{ ev.icon }} {{ ev.label }}</p>
                    <p class="chm-tl-detail">{{ ev.detail }}</p>
                    <p class="chm-tl-time">{{ fmtDate(ev.date) }}</p>
                  </div>
                </div>
              </div>
              <p v-else class="chm-no-data">Aucun événement dans cette plage.</p>
            </div>
          </div>
          <!-- /chm-content -->
        </div>
        <!-- /chm-shell -->
      </div>
      <!-- /chm-backdrop -->
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── CSS variables ────────────────────────────────────────────────────────── */
.chm-shell {
  --bg: #ffffff;
  --bg2: #f8fafc;
  --bg3: #f1f5f9;
  --border: #e2e8f0;
  --text: #0f172a;
  --text2: #475569;
  --text3: #94a3b8;
  --accent: #6366f1;
  --green: #22c55e;
  --red: #ef4444;
  --blue: #3b82f6;
  --yellow: #f59e0b;
  --radius: 10px;
}
.chm-shell.dark {
  --bg: #0f172a;
  --bg2: #1e293b;
  --bg3: #334155;
  --border: #334155;
  --text: #f1f5f9;
  --text2: #94a3b8;
  --text3: #64748b;
}

/* ── Backdrop & shell ────────────────────────────────────────────────────── */
.chm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 9000;
  padding: 24px 16px;
  overflow-y: auto;
}
.chm-shell {
  width: 100%;
  max-width: 860px;
  background: var(--bg);
  color: var(--text);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

/* ── Header ─────────────────────────────────────────────────────────────── */
.chm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%);
  color: #fff;
}
.chm-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.chm-logo {
  width: 38px;
  height: 38px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: grid;
  place-items: center;
}
.chm-logo svg {
  width: 20px;
  height: 20px;
}
.chm-title {
  font-size: 1.05rem;
  font-weight: 800;
  margin: 0;
}
.chm-subtitle {
  font-size: 0.75rem;
  opacity: 0.75;
  margin: 2px 0 0;
}
.chm-close {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  color: #fff;
  display: grid;
  place-items: center;
  transition: background 0.15s;
}
.chm-close:hover {
  background: rgba(255, 255, 255, 0.35);
}
.chm-close svg {
  width: 16px;
  height: 16px;
}

/* ── Content area ────────────────────────────────────────────────────────── */
.chm-content {
  padding: 20px 22px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Loading / Error ─────────────────────────────────────────────────────── */
.chm-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text3);
  font-size: 0.88rem;
}
.chm-dots {
  display: flex;
  gap: 6px;
}
.chm-dots span {
  width: 10px;
  height: 10px;
  background: var(--accent);
  border-radius: 50%;
  animation: chm-bounce 0.8s ease-in-out infinite;
}
.chm-dots span:nth-child(2) {
  animation-delay: 0.15s;
}
.chm-dots span:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes chm-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.7);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.chm-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 22px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: var(--red);
  font-size: 0.88rem;
}
.chm-error svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* ── Banner ──────────────────────────────────────────────────────────────── */
.chm-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 18px;
  background: var(--bg2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
}
.chm-avatar-lg {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 800;
  flex-shrink: 0;
  overflow: hidden;
}
.chm-avatar-lg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.chm-banner-info {
  flex: 1;
  min-width: 140px;
}
.chm-student-name {
  font-size: 1rem;
  font-weight: 800;
  margin: 0 0 2px;
  color: var(--text);
}
.chm-student-meta {
  font-size: 0.75rem;
  color: var(--text3);
  margin: 0;
}
.chm-kpis {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.chm-kpi {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 58px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1.5px solid var(--border);
  background: var(--bg);
}
.chm-kpi-green {
  border-color: #bbf7d0;
}
.chm-kpi-red {
  border-color: #fecaca;
}
.chm-kpi-blue {
  border-color: #bfdbfe;
}
.chm-kpi-purple {
  border-color: #e9d5ff;
}
.dark .chm-kpi-green {
  border-color: #052e16;
}
.dark .chm-kpi-red {
  border-color: #450a0a;
}
.dark .chm-kpi-blue {
  border-color: #1e3a5f;
}
.dark .chm-kpi-purple {
  border-color: #2e1065;
}
.chm-kpi-val {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text);
}
.chm-kpi-lbl {
  font-size: 0.65rem;
  color: var(--text3);
  margin-top: 1px;
  text-align: center;
}

/* ── Filters ─────────────────────────────────────────────────────────────── */
.chm-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.chm-filter-input {
  padding: 7px 10px;
  background: var(--bg2);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 0.8rem;
  outline: none;
  transition: border-color 0.15s;
}
.chm-filter-input:focus {
  border-color: var(--accent);
}
.chm-filter-reset {
  padding: 7px 12px;
  background: var(--bg3);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  color: var(--text2);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s;
}
.chm-filter-reset:hover {
  background: var(--border);
}

/* ── Tabs ────────────────────────────────────────────────────────────────── */
.chm-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  border-bottom: 2px solid var(--border);
  padding-bottom: 0;
}
.chm-tab {
  padding: 9px 16px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text3);
  font-size: 0.83rem;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition:
    color 0.15s,
    border-color 0.15s;
  display: flex;
  align-items: center;
  gap: 5px;
}
.chm-tab:hover {
  color: var(--text);
}
.chm-tab-active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

/* ── Badges ──────────────────────────────────────────────────────────────── */
.chm-badge {
  font-size: 0.67rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 99px;
  min-width: 18px;
  text-align: center;
}
.chm-badge-blue {
  background: #dbeafe;
  color: #1d4ed8;
}
.chm-badge-red {
  background: #fef2f2;
  color: var(--red);
}
.dark .chm-badge-blue {
  background: #1e3a5f;
  color: #93c5fd;
}
.dark .chm-badge-red {
  background: #1c0a0a;
  color: #fca5a5;
}

/* ── Panel ───────────────────────────────────────────────────────────────── */
.chm-panel {
  padding: 16px 0 0;
}

/* ── Overview grid ───────────────────────────────────────────────────────── */
.chm-overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.chm-course-card {
  background: var(--bg2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.chm-cc-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.chm-cc-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 2px;
  color: var(--text);
}
.chm-cc-group {
  font-size: 0.75rem;
  color: var(--text3);
  margin: 0;
}
.chm-cc-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.chm-cc-since {
  font-size: 0.72rem;
  color: var(--text3);
}

.chm-badge-green {
  background: #dcfce7;
  color: #166534;
}
.chm-badge-gray {
  background: var(--bg3);
  color: var(--text3);
}
.dark .chm-badge-green {
  background: #052e16;
  color: #4ade80;
}

.chm-pill-green {
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--green);
}
.chm-pill-red {
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--red);
}

.chm-mini-bar-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.chm-mini-bar-track {
  height: 5px;
  background: var(--bg3);
  border-radius: 99px;
  overflow: hidden;
}
.chm-mini-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.4s;
}
.chm-mini-bar-label {
  font-size: 0.72rem;
  color: var(--text3);
}

/* ── Table ───────────────────────────────────────────────────────────────── */
.chm-table-wrap {
  overflow-x: auto;
}
.chm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.chm-table th {
  padding: 9px 12px;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text3);
  border-bottom: 1.5px solid var(--border);
}
.chm-th-center {
  text-align: center;
}
.chm-th-right {
  text-align: right;
}
.chm-tr {
  transition: background 0.1s;
}
.chm-tr:hover {
  background: var(--bg2);
}
.chm-tr-absent:hover {
  background: #fef2f2;
}
.dark .chm-tr-absent:hover {
  background: #1c0a0a;
}
.chm-table td {
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.chm-td-date {
  white-space: nowrap;
}
.chm-td-course {
  font-weight: 600;
  color: var(--text);
}
.chm-td-light {
  color: var(--text2);
}
.chm-td-center {
  text-align: center;
}
.chm-td-amount {
  font-weight: 700;
  color: var(--green);
  text-align: right;
}

.chm-date-badge {
  display: inline-block;
  background: var(--bg2);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.76rem;
  color: var(--text2);
}
.chm-absent-badge {
  display: inline-block;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.76rem;
  color: var(--red);
  font-weight: 600;
}
.dark .chm-absent-badge {
  background: #1c0a0a;
  border-color: #7f1d1d;
}
.chm-session-num {
  display: inline-block;
  background: var(--bg3);
  color: var(--accent);
  font-weight: 800;
  font-size: 0.78rem;
  padding: 2px 9px;
  border-radius: 99px;
}

/* ── No data ─────────────────────────────────────────────────────────────── */
.chm-no-data {
  text-align: center;
  padding: 40px 20px;
  color: var(--text3);
  font-size: 0.88rem;
}
.chm-no-data-good {
  color: var(--green);
  font-weight: 600;
}

/* ── Payments summary ────────────────────────────────────────────────────── */
.chm-pay-summary {
  background: var(--bg2);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 0.85rem;
  color: var(--text2);
  margin-bottom: 12px;
}
.chm-pay-summary strong {
  color: var(--green);
  font-size: 1rem;
}

/* ── Timeline ────────────────────────────────────────────────────────────── */
.chm-timeline {
  display: flex;
  flex-direction: column;
  padding-left: 12px;
}
.chm-tl-item {
  display: flex;
  gap: 14px;
  padding: 0 0 18px;
  border-left: 2px solid var(--border);
  position: relative;
}
.chm-tl-item:last-child {
  border-left-color: transparent;
}
.chm-tl-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 2.5px solid currentColor;
  background: var(--bg);
  flex-shrink: 0;
  position: absolute;
  left: -6.5px;
  top: 4px;
}
.chm-dot-purple {
  color: #8b5cf6;
}
.chm-dot-blue {
  color: var(--blue);
}
.chm-dot-green {
  color: var(--green);
}
.chm-dot-red {
  color: var(--red);
}
.chm-dot-yellow {
  color: var(--yellow);
}
.chm-tl-body {
  padding-left: 16px;
}
.chm-tl-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 2px;
}
.chm-tl-detail {
  font-size: 0.78rem;
  color: var(--text3);
  margin: 0 0 3px;
}
.chm-tl-time {
  font-size: 0.72rem;
  color: var(--text3);
}

/* ── Transition ──────────────────────────────────────────────────────────── */
.chm-fade-enter-active,
.chm-fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.chm-fade-enter-from,
.chm-fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
