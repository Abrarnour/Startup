<script setup>
/**
 * StudentHistoryModal.vue  — Admin dashboard
 * Tabs: Overview · Sessions · Absences · Payments · Timeline
 * Requires backend patch: stats_history_patch.js
 */
import { ref, watch, computed } from 'vue'
import { searchStudents, getStudentHistory } from '../services/api.js'
import { useLanguage } from '../composables/useLanguage.js'
const props = defineProps({
  show: { type: Boolean, default: false },
  darkMode: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])
const { t } = useLanguage()
// ── Search ────────────────────────────────────────────────────────────────────
const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
let searchTimer = null

watch(searchQuery, (v) => {
  clearTimeout(searchTimer)
  if (!v.trim()) {
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      searchResults.value = await searchStudents(v.trim())
    } catch {
      searchResults.value = []
    } finally {
      searching.value = false
    }
  }, 350)
})

// ── Student & data ────────────────────────────────────────────────────────────
const selectedStudent = ref(null)
const historyData = ref(null)
const loading = ref(false)
const error = ref('')
const activeTab = ref('overview')

const selectStudent = async (s) => {
  selectedStudent.value = s
  searchQuery.value = `${s.name} ${s.last_name}`
  searchResults.value = []
  error.value = ''
  historyData.value = null
  loading.value = true
  activeTab.value = 'overview'
  resetFilters()
  try {
    historyData.value = await getStudentHistory(s.id)
  } catch (e) {
    error.value = e.message || 'Erreur de chargement'
  } finally {
    loading.value = false
  }
}

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

// unique courses for filter dropdown
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

// ── Reset on close ────────────────────────────────────────────────────────────
watch(
  () => props.show,
  (v) => {
    if (!v) {
      searchQuery.value = ''
      searchResults.value = []
      selectedStudent.value = null
      historyData.value = null
      error.value = ''
      activeTab.value = 'overview'
      resetFilters()
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="shm-fade">
      <div v-if="show" class="shm-backdrop" @click.self="emit('close')">
        <div class="shm-shell" :class="{ dark: darkMode }">
          <!-- ══ HEADER ══════════════════════════════════════════════════════ -->
          <header class="shm-header">
            <div class="shm-header-left">
              <div class="shm-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              <div>
                <h2 class="shm-title">سجل الطالب</h2>
                <p class="shm-subtitle">Historique complet · Séances · Absences</p>
              </div>
            </div>
            <button class="shm-close" @click="emit('close')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <!-- ══ SEARCH BAR ══════════════════════════════════════════════════ -->
          <div class="shm-search-wrap">
            <div class="shm-search-box">
              <svg
                class="shm-search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                v-model="searchQuery"
                class="shm-search-input"
                type="text"
                placeholder="Rechercher un étudiant…"
                autocomplete="off"
              />
              <div v-if="searching" class="shm-spinner" />
            </div>
            <!-- Autocomplete dropdown -->
            <div v-if="searchResults.length" class="shm-dropdown">
              <button
                v-for="s in searchResults"
                :key="s.id"
                class="shm-dropdown-item"
                @click="selectStudent(s)"
              >
                <div class="shm-avatar-sm">{{ s.name?.[0] }}{{ s.last_name?.[0] }}</div>
                <div>
                  <span class="shm-dr-name">{{ s.last_name }} {{ s.name }}</span>
                  <span class="shm-dr-email">{{ s.email }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- ══ EMPTY ═══════════════════════════════════════════════════════ -->
          <div v-if="!selectedStudent && !loading" class="shm-empty">
            <div class="shm-empty-art">
              <svg viewBox="0 0 80 80" fill="none">
                <circle
                  cx="40"
                  cy="30"
                  r="16"
                  stroke="currentColor"
                  stroke-width="3"
                  opacity=".25"
                />
                <path
                  d="M16 66c0-13.3 10.7-24 24-24s24 10.7 24 24"
                  stroke="currentColor"
                  stroke-width="3"
                  opacity=".25"
                />
              </svg>
            </div>
            <p class="shm-empty-label">Recherchez un étudiant pour afficher son historique</p>
          </div>

          <!-- ══ LOADING ════════════════════════════════════════════════════ -->
          <div v-if="loading" class="shm-loading">
            <div class="shm-dots"><span /><span /><span /></div>
            <p>Chargement de l'historique…</p>
          </div>

          <!-- ══ ERROR ══════════════════════════════════════════════════════ -->
          <div v-if="error" class="shm-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {{ error }}
          </div>

          <!-- ══ STUDENT CARD + CONTENT ════════════════════════════════════ -->
          <div v-if="historyData && !loading" class="shm-content">
            <!-- Banner -->
            <div class="shm-banner">
              <div class="shm-avatar-lg">
                <img v-if="historyData.profile.photo_url" :src="historyData.profile.photo_url" />
                <span v-else
                  >{{ historyData.profile.name?.[0] }}{{ historyData.profile.last_name?.[0] }}</span
                >
              </div>
              <div class="shm-banner-info">
                <h3 class="shm-student-name">
                  {{ historyData.profile.last_name }} {{ historyData.profile.name }}
                </h3>
                <p class="shm-student-meta">{{ historyData.profile.email }}</p>
                <p class="shm-student-meta">
                  {{ historyData.profile.city || '' }}
                  {{ historyData.profile.phone ? '· ' + historyData.profile.phone : '' }}
                </p>
              </div>
              <!-- Quick KPIs -->
              <div class="shm-kpis">
                <div class="shm-kpi shm-kpi-green">
                  <span class="shm-kpi-val">{{ totalPresent }}</span>
                  <span class="shm-kpi-lbl">Séances</span>
                </div>
                <div class="shm-kpi shm-kpi-red">
                  <span class="shm-kpi-val">{{ totalAbsent }}</span>
                  <span class="shm-kpi-lbl">Absences</span>
                </div>
                <div
                  class="shm-kpi"
                  :class="
                    attendanceRate >= 75
                      ? 'shm-kpi-green'
                      : attendanceRate >= 50
                        ? 'shm-kpi-yellow'
                        : 'shm-kpi-red'
                  "
                >
                  <span class="shm-kpi-val">{{ attendanceRate }}%</span>
                  <span class="shm-kpi-lbl">Présence</span>
                </div>
                <div class="shm-kpi shm-kpi-blue">
                  <span class="shm-kpi-val">{{ historyData.enrollments?.length ?? 0 }}</span>
                  <span class="shm-kpi-lbl">Cours</span>
                </div>
              </div>
            </div>

            <!-- Attendance rate bar -->
            <div class="shm-rate-bar-wrap">
              <div class="shm-rate-bar-track">
                <div
                  class="shm-rate-bar-fill"
                  :style="{ width: attendanceRate + '%' }"
                  :class="
                    attendanceRate >= 75
                      ? 'shm-bar-green'
                      : attendanceRate >= 50
                        ? 'shm-bar-yellow'
                        : 'shm-bar-red'
                  "
                />
              </div>
              <span class="shm-rate-label">Taux de présence global {{ attendanceRate }}%</span>
            </div>

            <!-- FILTER ROW -->
            <div class="shm-filters">
              <div class="shm-filter-group">
                <label>De</label>
                <input type="date" v-model="dateFrom" class="shm-filter-input" />
              </div>
              <div class="shm-filter-group">
                <label>À</label>
                <input type="date" v-model="dateTo" class="shm-filter-input" />
              </div>
              <div class="shm-filter-group shm-filter-grow">
                <label>Matière</label>
                <select v-model="courseFilter" class="shm-filter-input">
                  <option value="">Toutes</option>
                  <option v-for="c in allCourses" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
              <button
                v-if="dateFrom || dateTo || courseFilter"
                @click="resetFilters"
                class="shm-filter-clear"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                Effacer
              </button>
            </div>

            <!-- TABS -->
            <nav class="shm-tabs">
              <button
                v-for="tab in [
                  { id: 'overview', label: 'Aperçu', icon: '⊞', count: null },
                  { id: 'sessions', label: 'Séances', icon: '✓', count: filteredSessions.length },
                  { id: 'absences', label: 'Absences', icon: '✗', count: filteredAbsences.length },
                  { id: 'payments', label: 'Paiements', icon: '$', count: filteredPayments.length },
                  { id: 'timeline', label: 'Timeline', icon: '⏱', count: null },
                ]"
                :key="tab.id"
                class="shm-tab"
                :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id"
              >
                <span class="shm-tab-icon">{{ tab.icon }}</span>
                {{ tab.label }}
                <span
                  v-if="tab.count !== null"
                  class="shm-tab-badge"
                  :class="tab.id === 'absences' && tab.count > 0 ? 'shm-badge-red' : ''"
                >
                  {{ tab.count }}
                </span>
              </button>
            </nav>

            <!-- ── TAB: OVERVIEW ──────────────────────────────────────────── -->
            <div v-if="activeTab === 'overview'" class="shm-panel">
              <div class="shm-overview-grid">
                <!-- Per-course attendance breakdown -->
                <div v-for="enr in historyData.enrollments" :key="enr.id" class="shm-course-card">
                  <div class="shm-cc-top">
                    <div>
                      <p class="shm-cc-title">{{ enr.course_title }}</p>
                      <p class="shm-cc-group">
                        {{ enr.group_name }} · {{ dayMap[enr.day_of_week] ?? enr.day_of_week }}
                      </p>
                    </div>
                    <span
                      class="shm-badge"
                      :class="enr.status === 'active' ? 'shm-badge-green' : 'shm-badge-gray'"
                    >
                      {{ enr.status }}
                    </span>
                  </div>
                  <!-- mini progress bar: sessions_attended / group_total_sessions -->
                  <div class="shm-mini-bar-wrap">
                    <div class="shm-mini-bar-track">
                      <div
                        class="shm-mini-bar-fill shm-bar-green"
                        :style="{
                          width: enr.group_total_sessions
                            ? Math.min(
                                100,
                                (enr.sessions_attended / enr.group_total_sessions) * 100,
                              ) + '%'
                            : '0%',
                        }"
                      />
                    </div>
                    <span class="shm-mini-bar-label">
                      {{ enr.sessions_attended }} / {{ enr.group_total_sessions ?? '?' }} séances
                    </span>
                  </div>
                  <div class="shm-cc-meta">
                    <span
                      :class="enr.payment_status === 'paid' ? 'shm-pill-green' : 'shm-pill-red'"
                    >
                      {{ enr.payment_status === 'paid' ? '✓ Payé' : '✗ Non payé' }}
                    </span>
                    <span class="shm-cc-since"
                      >Inscrit {{ fmtDate(enr.enrollment_date, false) }}</span
                    >
                  </div>
                </div>

                <!-- No enrollments -->
                <div v-if="!historyData.enrollments?.length" class="shm-no-data">
                  Aucune inscription
                </div>
              </div>
            </div>

            <!-- ── TAB: SESSIONS ──────────────────────────────────────────── -->
            <div v-if="activeTab === 'sessions'" class="shm-panel">
              <div v-if="!filteredSessions.length" class="shm-no-data">
                Aucune séance dans cette période
              </div>
              <table v-else class="shm-table">
                <thead>
                  <tr>
                    <th>Date &amp; Heure</th>
                    <th>Matière</th>
                    <th>Groupe</th>
                    <th>Salle</th>
                    <th class="shm-th-center">N° Séance</th>
                    <th>Scanné par</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="a in filteredSessions" :key="a.id" class="shm-tr">
                    <td class="shm-td-date">
                      <span class="shm-date-badge">{{ fmtDate(a.scanned_at) }}</span>
                    </td>
                    <td class="shm-td-course">{{ a.course_title }}</td>
                    <td class="shm-td-light">{{ a.group_name }}</td>
                    <td class="shm-td-light">{{ a.salle || '—' }}</td>
                    <td class="shm-td-center">
                      <span class="shm-session-num">#{{ a.session_number }}</span>
                    </td>
                    <td class="shm-td-light">
                      {{ a.scanned_by_name ? `${a.scanned_by_name} ${a.scanned_by_last}` : '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- ── TAB: ABSENCES ──────────────────────────────────────────── -->
            <div v-if="activeTab === 'absences'" class="shm-panel">
              <div v-if="!filteredAbsences.length" class="shm-no-data shm-no-data-good">
                ✓ Aucune absence dans cette période
              </div>
              <table v-else class="shm-table">
                <thead>
                  <tr>
                    <th>Date prévue</th>
                    <th>Matière</th>
                    <th>Groupe</th>
                    <th>Heure</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(a, i) in filteredAbsences" :key="i" class="shm-tr shm-tr-absent">
                    <td class="shm-td-date">
                      <span class="shm-absent-badge">{{ fmtDate(a.session_date, false) }}</span>
                    </td>
                    <td class="shm-td-course">{{ a.course_title }}</td>
                    <td class="shm-td-light">{{ a.group_name }}</td>
                    <td class="shm-td-light">{{ a.session_start_time?.slice(0, 5) ?? '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- ── TAB: PAYMENTS ──────────────────────────────────────────── -->
            <div v-if="activeTab === 'payments'" class="shm-panel">
              <div v-if="!filteredPayments.length" class="shm-no-data">
                Aucun paiement enregistré
              </div>
              <div v-else>
                <div class="shm-pay-summary">
                  Total payé : <strong>{{ totalPaid.toLocaleString('fr-DZ') }} DZD</strong>
                </div>
                <table class="shm-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th class="shm-th-right">Montant</th>
                      <th>Méthode</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in filteredPayments" :key="p.id" class="shm-tr">
                      <td class="shm-td-date">
                        <span class="shm-date-badge">{{ fmtDate(p.payment_date, false) }}</span>
                      </td>
                      <td class="shm-td-amount">
                        {{ parseFloat(p.amount_paid || 0).toLocaleString('fr-DZ') }} DZD
                      </td>
                      <td class="shm-td-light">{{ p.payment_method || '—' }}</td>
                      <td class="shm-td-light">{{ p.notes || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- ── TAB: TIMELINE ──────────────────────────────────────────── -->
            <div v-if="activeTab === 'timeline'" class="shm-panel">
              <div v-if="!filteredTimeline.length" class="shm-no-data">
                Aucun événement dans cette période
              </div>
              <div class="shm-timeline">
                <div v-for="(e, i) in filteredTimeline" :key="i" class="shm-tl-item">
                  <div
                    class="shm-tl-dot"
                    :class="{
                      'shm-dot-purple': e.type === 'account_created',
                      'shm-dot-blue': e.type === 'enrollment',
                      'shm-dot-green': e.type === 'payment' || e.type === 'attendance',
                      'shm-dot-red': e.type === 'absence',
                    }"
                  />
                  <div class="shm-tl-body">
                    <p class="shm-tl-label">{{ e.label }}</p>
                    <p v-if="e.detail" class="shm-tl-detail">{{ e.detail }}</p>
                    <time class="shm-tl-time">{{ fmtDate(e.date) }}</time>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- /shm-content -->
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Tokens ─────────────────────────────────────────────────────────────── */
.shm-shell {
  --bg: #ffffff;
  --bg2: #f8fafc;
  --bg3: #f1f5f9;
  --border: #e2e8f0;
  --text: #0f172a;
  --text2: #475569;
  --text3: #94a3b8;
  --accent: #6366f1;
  --accent2: #818cf8;
  --green: #10b981;
  --red: #ef4444;
  --yellow: #f59e0b;
  --blue: #3b82f6;
  --radius: 14px;
  --shadow: 0 20px 60px rgba(0, 0, 0, 0.13), 0 4px 16px rgba(0, 0, 0, 0.08);
}
.shm-shell.dark {
  --bg: #0f1117;
  --bg2: #1a1d27;
  --bg3: #252936;
  --border: #2d3144;
  --text: #f1f5f9;
  --text2: #94a3b8;
  --text3: #475569;
}

/* ── Backdrop & Shell ────────────────────────────────────────────────────── */
.shm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 17, 25, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.shm-shell {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 940px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: var(--text);
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.shm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.shm-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.shm-logo {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.shm-logo svg {
  width: 22px;
  height: 22px;
  stroke: white;
}
.shm-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}
.shm-subtitle {
  font-size: 0.75rem;
  color: var(--text3);
  margin: 2px 0 0;
}
.shm-close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: var(--bg3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.shm-close:hover {
  background: var(--border);
}
.shm-close svg {
  width: 16px;
  height: 16px;
  stroke: var(--text2);
}

/* ── Search ──────────────────────────────────────────────────────────────── */
.shm-search-wrap {
  padding: 14px 24px 0;
  flex-shrink: 0;
  position: relative;
}
.shm-search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg2);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 10px 14px;
  transition: border-color 0.15s;
}
.shm-search-box:focus-within {
  border-color: var(--accent);
}
.shm-search-icon {
  width: 17px;
  height: 17px;
  stroke: var(--text3);
  flex-shrink: 0;
}
.shm-search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9rem;
  color: var(--text);
}
.shm-search-input::placeholder {
  color: var(--text3);
}
.shm-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: shm-spin 0.6s linear infinite;
  flex-shrink: 0;
}
@keyframes shm-spin {
  to {
    transform: rotate(360deg);
  }
}

.shm-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 24px;
  right: 24px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 100;
  max-height: 230px;
  overflow-y: auto;
}
.shm-dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
}
.shm-dropdown-item:hover {
  background: var(--bg2);
}
.shm-avatar-sm {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: white;
  font-size: 0.78rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: -0.5px;
}
.shm-dr-name {
  display: block;
  font-size: 0.87rem;
  font-weight: 600;
  color: var(--text);
}
.shm-dr-email {
  display: block;
  font-size: 0.75rem;
  color: var(--text3);
}

/* ── Empty / Loading / Error ─────────────────────────────────────────────── */
.shm-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 40px;
}
.shm-empty-art svg {
  width: 72px;
  height: 72px;
  stroke: var(--text3);
}
.shm-empty-label {
  color: var(--text3);
  font-size: 0.9rem;
  text-align: center;
}
.shm-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--text3);
  font-size: 0.87rem;
}
.shm-dots {
  display: flex;
  gap: 6px;
}
.shm-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: shm-bounce 0.9s ease-in-out infinite;
}
.shm-dots span:nth-child(2) {
  animation-delay: 0.15s;
}
.shm-dots span:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes shm-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
.shm-error {
  margin: 14px 24px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.87rem;
}
.shm-error svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* ── Content scroll area ─────────────────────────────────────────────────── */
.shm-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.shm-content::-webkit-scrollbar {
  width: 5px;
}
.shm-content::-webkit-scrollbar-track {
  background: transparent;
}
.shm-content::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

/* ── Banner ──────────────────────────────────────────────────────────────── */
.shm-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 18px 0 14px;
  border-bottom: 1px solid var(--border);
}
.shm-avatar-lg {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.shm-avatar-lg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.shm-banner-info {
  flex: 1;
  min-width: 140px;
}
.shm-student-name {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 2px;
}
.shm-student-meta {
  font-size: 0.78rem;
  color: var(--text3);
  margin: 0;
}

.shm-kpis {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;
}
.shm-kpi {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 14px;
  border-radius: 12px;
  min-width: 62px;
  border: 1.5px solid var(--border);
  background: var(--bg2);
}
.shm-kpi-green {
  border-color: #bbf7d0;
  background: #f0fdf4;
}
.shm-kpi-red {
  border-color: #fecaca;
  background: #fef2f2;
}
.shm-kpi-yellow {
  border-color: #fde68a;
  background: #fffbeb;
}
.shm-kpi-blue {
  border-color: #bfdbfe;
  background: #eff6ff;
}
.shm-kpi-val {
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1;
}
.shm-kpi-lbl {
  font-size: 0.68rem;
  color: var(--text3);
  margin-top: 2px;
  white-space: nowrap;
}
.shm-kpi-green .shm-kpi-val {
  color: var(--green);
}
.shm-kpi-red .shm-kpi-val {
  color: var(--red);
}
.shm-kpi-yellow .shm-kpi-val {
  color: var(--yellow);
}
.shm-kpi-blue .shm-kpi-val {
  color: var(--blue);
}
.dark .shm-kpi-green {
  border-color: #166534;
  background: #052e16;
}
.dark .shm-kpi-red {
  border-color: #7f1d1d;
  background: #1c0a0a;
}
.dark .shm-kpi-yellow {
  border-color: #78350f;
  background: #1c1003;
}
.dark .shm-kpi-blue {
  border-color: #1e3a5f;
  background: #0c1a2e;
}

/* ── Attendance rate bar ─────────────────────────────────────────────────── */
.shm-rate-bar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0 0;
}
.shm-rate-bar-track {
  flex: 1;
  height: 7px;
  background: var(--bg3);
  border-radius: 99px;
  overflow: hidden;
}
.shm-rate-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.6s ease;
}
.shm-bar-green {
  background: var(--green);
}
.shm-bar-yellow {
  background: var(--yellow);
}
.shm-bar-red {
  background: var(--red);
}
.shm-rate-label {
  font-size: 0.73rem;
  color: var(--text3);
  white-space: nowrap;
}

/* ── Filters ─────────────────────────────────────────────────────────────── */
.shm-filters {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px 0 2px;
}
.shm-filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.shm-filter-group label {
  font-size: 0.7rem;
  color: var(--text3);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.shm-filter-input {
  height: 36px;
  padding: 0 10px;
  border-radius: 9px;
  border: 1.5px solid var(--border);
  background: var(--bg2);
  color: var(--text);
  font-size: 0.82rem;
  outline: none;
  transition: border-color 0.15s;
}
.shm-filter-input:focus {
  border-color: var(--accent);
}
.shm-filter-grow .shm-filter-input {
  min-width: 160px;
}
.shm-filter-clear {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 36px;
  padding: 0 12px;
  border-radius: 9px;
  border: 1.5px solid var(--border);
  background: var(--bg2);
  color: var(--text2);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}
.shm-filter-clear:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: var(--red);
}
.shm-filter-clear svg {
  width: 13px;
  height: 13px;
}

/* ── Tabs ────────────────────────────────────────────────────────────────── */
.shm-tabs {
  display: flex;
  gap: 2px;
  padding: 10px 0 0;
  border-bottom: 2px solid var(--border);
  overflow-x: auto;
  flex-shrink: 0;
}
.shm-tabs::-webkit-scrollbar {
  display: none;
}
.shm-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px 10px;
  border: none;
  background: transparent;
  color: var(--text2);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2.5px solid transparent;
  margin-bottom: -2px;
  white-space: nowrap;
  transition:
    color 0.15s,
    border-color 0.15s;
  border-radius: 6px 6px 0 0;
}
.shm-tab:hover {
  color: var(--text);
  background: var(--bg2);
}
.shm-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  font-weight: 700;
}
.shm-tab-icon {
  font-size: 0.75rem;
  opacity: 0.7;
}
.shm-tab-badge {
  background: var(--bg3);
  color: var(--text3);
  font-size: 0.67rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 99px;
  min-width: 18px;
  text-align: center;
}
.shm-badge-red {
  background: #fef2f2;
  color: var(--red);
}

/* ── Panel ───────────────────────────────────────────────────────────────── */
.shm-panel {
  padding: 16px 0 0;
}

/* ── Overview grid ───────────────────────────────────────────────────────── */
.shm-overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.shm-course-card {
  background: var(--bg2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.shm-cc-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.shm-cc-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 2px;
}
.shm-cc-group {
  font-size: 0.75rem;
  color: var(--text3);
  margin: 0;
}
.shm-cc-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.shm-cc-since {
  font-size: 0.72rem;
  color: var(--text3);
}
.shm-mini-bar-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.shm-mini-bar-track {
  height: 5px;
  background: var(--bg3);
  border-radius: 99px;
  overflow: hidden;
}
.shm-mini-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.4s;
}
.shm-mini-bar-label {
  font-size: 0.72rem;
  color: var(--text3);
}

/* ── Badges & Pills ──────────────────────────────────────────────────────── */
.shm-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 99px;
  white-space: nowrap;
  flex-shrink: 0;
}
.shm-badge-green {
  background: #dcfce7;
  color: #166534;
}
.shm-badge-gray {
  background: var(--bg3);
  color: var(--text3);
}
.dark .shm-badge-green {
  background: #052e16;
  color: #4ade80;
}
.shm-pill-green {
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--green);
}
.shm-pill-red {
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--red);
}

/* ── Table ───────────────────────────────────────────────────────────────── */
.shm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.shm-table th {
  padding: 9px 12px;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text3);
  border-bottom: 1.5px solid var(--border);
}
.shm-th-center {
  text-align: center;
}
.shm-th-right {
  text-align: right;
}
.shm-tr {
  transition: background 0.1s;
}
.shm-tr:hover {
  background: var(--bg2);
}
.shm-tr-absent:hover {
  background: #fef2f2;
}
.dark .shm-tr-absent:hover {
  background: #1c0a0a;
}
.shm-table td {
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.shm-td-date {
  white-space: nowrap;
}
.shm-td-course {
  font-weight: 600;
  color: var(--text);
}
.shm-td-light {
  color: var(--text2);
}
.shm-td-center {
  text-align: center;
}
.shm-td-amount {
  font-weight: 700;
  color: var(--green);
  text-align: right;
}
.shm-date-badge {
  display: inline-block;
  background: var(--bg2);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.76rem;
  color: var(--text2);
}
.shm-absent-badge {
  display: inline-block;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.76rem;
  color: var(--red);
  font-weight: 600;
}
.dark .shm-absent-badge {
  background: #1c0a0a;
  border-color: #7f1d1d;
}
.shm-session-num {
  display: inline-block;
  background: var(--bg3);
  color: var(--accent);
  font-weight: 800;
  font-size: 0.78rem;
  padding: 2px 9px;
  border-radius: 99px;
}

/* ── No data ─────────────────────────────────────────────────────────────── */
.shm-no-data {
  text-align: center;
  padding: 40px 20px;
  color: var(--text3);
  font-size: 0.88rem;
}
.shm-no-data-good {
  color: var(--green);
  font-weight: 600;
}

/* ── Payments summary ────────────────────────────────────────────────────── */
.shm-pay-summary {
  background: var(--bg2);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 0.85rem;
  color: var(--text2);
  margin-bottom: 12px;
}
.shm-pay-summary strong {
  color: var(--green);
  font-size: 1rem;
}

/* ── Timeline ────────────────────────────────────────────────────────────── */
.shm-timeline {
  display: flex;
  flex-direction: column;
  padding-left: 12px;
}
.shm-tl-item {
  display: flex;
  gap: 14px;
  padding: 0 0 18px;
  border-left: 2px solid var(--border);
  position: relative;
}
.shm-tl-item:last-child {
  border-left-color: transparent;
}
.shm-tl-dot {
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
.shm-dot-purple {
  color: #8b5cf6;
}
.shm-dot-blue {
  color: var(--blue);
}
.shm-dot-green {
  color: var(--green);
}
.shm-dot-red {
  color: var(--red);
}
.shm-tl-body {
  padding-left: 16px;
}
.shm-tl-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 2px;
}
.shm-tl-detail {
  font-size: 0.78rem;
  color: var(--text3);
  margin: 0 0 3px;
}
.shm-tl-time {
  font-size: 0.72rem;
  color: var(--text3);
}

/* ── Transition ──────────────────────────────────────────────────────────── */
.shm-fade-enter-active,
.shm-fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.shm-fade-enter-from,
.shm-fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
