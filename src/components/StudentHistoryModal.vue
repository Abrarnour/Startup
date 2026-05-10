<script setup>
/**
 * StudentHistoryModal.vue
 * Admin-only — full student history with search, timeline, and date filter.
 *
 * Props : show (Boolean), darkMode (Boolean)
 * Emits : close
 *
 * Requires in api.js:
 *   searchStudents(q)       → GET /api/stats/search-students?q=xxx
 *   getStudentHistory(id)   → GET /api/stats/student-history/:id
 */
import { ref, watch, computed } from 'vue'
import { searchStudents, getStudentHistory } from '../services/api.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  darkMode: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

// ── Search ─────────────────────────────────────────────────────────────────
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

// ── Selected student & history ─────────────────────────────────────────────
const selectedStudent = ref(null)
const historyData = ref(null)
const loadingHistory = ref(false)
const historyError = ref('')

const selectStudent = async (student) => {
  selectedStudent.value = student
  searchQuery.value = `${student.name} ${student.last_name}`
  searchResults.value = []
  historyError.value = ''
  historyData.value = null
  loadingHistory.value = true
  try {
    historyData.value = await getStudentHistory(student.id)
  } catch (e) {
    historyError.value = e.message || 'Erreur de chargement'
  } finally {
    loadingHistory.value = false
  }
}

// ── Filter controls ────────────────────────────────────────────────────────
const clearFromDate = ref('')
const activeFilters = ref([]) // [] = all types shown
const ALL_TYPES = ['account_created', 'enrollment', 'payment']
const TYPE_LABEL = { account_created: 'Compte', enrollment: 'Inscription', payment: 'Paiement' }
const TYPE_COLOR = { account_created: '#8b5cf6', enrollment: '#3b82f6', payment: '#10b981' }
const TYPE_ICON = { account_created: '✦', enrollment: '≡', payment: '▣' }

const toggleFilter = (t) => {
  activeFilters.value = activeFilters.value.includes(t)
    ? activeFilters.value.filter((x) => x !== t)
    : [...activeFilters.value, t]
}

const clearFilters = () => {
  clearFromDate.value = ''
  activeFilters.value = []
}

const filteredTimeline = computed(() => {
  if (!historyData.value) return []
  let tl = [...historyData.value.timeline]
  if (clearFromDate.value) {
    const cutoff = new Date(clearFromDate.value)
    tl = tl.filter((e) => new Date(e.date) >= cutoff)
  }
  if (activeFilters.value.length) {
    tl = tl.filter((e) => activeFilters.value.includes(e.type))
  }
  return tl
})

// ── Summary stats ──────────────────────────────────────────────────────────
const totalPaid = computed(() =>
  historyData.value
    ? historyData.value.payments.reduce((s, p) => s + parseFloat(p.amount_paid || 0), 0)
    : 0,
)

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
const fmtDateShort = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
const statusColor = (s) => {
  const map = {
    active: '#10b981',
    paid: '#10b981',
    inactive: '#f59e0b',
    pending: '#f59e0b',
    dropped: '#ef4444',
    completed: '#3b82f6',
  }
  return (s && map[s.toLowerCase()]) || '#94a3b8'
}

// ── Reset when modal closes ────────────────────────────────────────────────
watch(
  () => props.show,
  (v) => {
    if (!v) {
      searchQuery.value = ''
      searchResults.value = []
      selectedStudent.value = null
      historyData.value = null
      historyError.value = ''
      clearFromDate.value = ''
      activeFilters.value = []
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="hm-fade">
      <div v-if="show" class="hm-overlay" @click.self="emit('close')">
        <div class="hm-modal" :class="{ 'hm-dark': darkMode }">
          <!-- ═══ HEADER ════════════════════════════════════════════════ -->
          <div class="hm-header">
            <div class="hm-title-row">
              <div class="hm-header-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h2 class="hm-title">Historique des étudiants</h2>
                <p class="hm-subtitle">Consultez le parcours complet de chaque étudiant</p>
              </div>
            </div>
            <button class="hm-close-btn" @click="emit('close')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- ═══ SEARCH ════════════════════════════════════════════════ -->
          <div class="hm-search-section">
            <div class="hm-search-box" :class="{ 'hm-search-focus': searchQuery }">
              <svg
                class="hm-search-ico"
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
                class="hm-search-input"
                placeholder="Rechercher par nom, prénom ou email…"
                autocomplete="off"
                spellcheck="false"
              />
              <div v-if="searching" class="hm-search-spinner"></div>
              <button
                v-if="searchQuery && !searching"
                class="hm-search-clear"
                @click="searchQuery = ''"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <!-- Results dropdown -->
            <Transition name="hm-drop">
              <div v-if="searchResults.length" class="hm-dropdown">
                <div class="hm-dropdown-header">{{ searchResults.length }} résultat(s)</div>
                <button
                  v-for="s in searchResults"
                  :key="s.id"
                  class="hm-dropdown-item"
                  @click="selectStudent(s)"
                >
                  <div
                    class="hm-drop-avatar"
                    :style="{ background: `hsl(${(s.id * 47) % 360}, 60%, 45%)` }"
                  >
                    {{ s.name[0] }}{{ s.last_name[0] }}
                  </div>
                  <div class="hm-drop-info">
                    <span class="hm-drop-name">{{ s.name }} {{ s.last_name }}</span>
                    <span class="hm-drop-email">{{ s.email }}</span>
                  </div>
                  <span class="hm-drop-since">Depuis {{ fmtDateShort(s.created_at) }}</span>
                </button>
              </div>
            </Transition>
          </div>

          <!-- ═══ EMPTY STATE ═══════════════════════════════════════════ -->
          <div v-if="!selectedStudent && !loadingHistory && !historyError" class="hm-empty">
            <div class="hm-empty-illustration">
              <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-dasharray="6 4"
                  opacity="0.2"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="22"
                  stroke="currentColor"
                  stroke-width="2"
                  opacity="0.35"
                />
                <polyline
                  points="40 28 40 40 48 45"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  opacity="0.6"
                />
                <circle cx="40" cy="40" r="2" fill="currentColor" opacity="0.6" />
              </svg>
            </div>
            <p class="hm-empty-title">Aucun étudiant sélectionné</p>
            <p class="hm-empty-sub">
              Tapez un nom ou email dans la barre de recherche ci-dessus pour afficher l'historique
              complet d'un étudiant.
            </p>
          </div>

          <!-- ═══ LOADING ═══════════════════════════════════════════════ -->
          <div v-if="loadingHistory" class="hm-loading">
            <div class="hm-loading-dots"><span></span><span></span><span></span></div>
            <p>Chargement de l'historique…</p>
          </div>

          <!-- ═══ ERROR ═════════════════════════════════════════════════ -->
          <div v-if="historyError" class="hm-error-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {{ historyError }}
          </div>

          <!-- ═══ STUDENT BANNER ════════════════════════════════════════ -->
          <div v-if="historyData && !loadingHistory" class="hm-student-banner">
            <div class="hm-banner-left">
              <div
                class="hm-banner-avatar"
                :style="{ background: `hsl(${(selectedStudent.id * 47) % 360}, 55%, 42%)` }"
              >
                {{ historyData.student.name[0] }}{{ historyData.student.last_name[0] }}
              </div>
              <div class="hm-banner-info">
                <div class="hm-banner-name">
                  {{ historyData.student.name }} {{ historyData.student.last_name }}
                </div>
                <div class="hm-banner-email">{{ historyData.student.email }}</div>
                <div class="hm-banner-chips">
                  <span v-if="historyData.student.phone" class="hm-chip"
                    >✆ {{ historyData.student.phone }}</span
                  >
                  <span v-if="historyData.student.city" class="hm-chip"
                    >◉ {{ historyData.student.city }}</span
                  >
                  <span v-if="historyData.student.birthday" class="hm-chip"
                    >✿ {{ fmtDateShort(historyData.student.birthday) }}</span
                  >
                  <span class="hm-chip">
                    {{
                      historyData.student.gender === 'M'
                        ? '♂ Masculin'
                        : historyData.student.gender === 'F'
                          ? '♀ Féminin'
                          : ''
                    }}
                  </span>
                </div>
              </div>
            </div>
            <div class="hm-banner-kpis">
              <div class="hm-kpi">
                <span class="hm-kpi-val">{{ historyData.enrollments.length }}</span>
                <span class="hm-kpi-lbl">Inscriptions</span>
              </div>
              <div class="hm-kpi-divider"></div>
              <div class="hm-kpi">
                <span class="hm-kpi-val">{{ historyData.payments.length }}</span>
                <span class="hm-kpi-lbl">Paiements</span>
              </div>
              <div class="hm-kpi-divider"></div>
              <div class="hm-kpi">
                <span class="hm-kpi-val">{{ totalPaid.toFixed(0) }} DA</span>
                <span class="hm-kpi-lbl">Total payé</span>
              </div>
              <div class="hm-kpi-divider"></div>
              <div class="hm-kpi">
                <span class="hm-kpi-val">{{ fmtDateShort(historyData.student.created_at) }}</span>
                <span class="hm-kpi-lbl">Membre depuis</span>
              </div>
            </div>
          </div>

          <!-- ═══ FILTER BAR ════════════════════════════════════════════ -->
          <div v-if="historyData && !loadingHistory" class="hm-filter-bar">
            <div class="hm-filter-group">
              <span class="hm-filter-label">Type :</span>
              <button
                v-for="tp in ALL_TYPES"
                :key="tp"
                class="hm-filter-pill"
                :class="{ 'hm-filter-pill--on': activeFilters.includes(tp) }"
                :style="
                  activeFilters.includes(tp)
                    ? { background: TYPE_COLOR[tp], borderColor: TYPE_COLOR[tp], color: '#fff' }
                    : {}
                "
                @click="toggleFilter(tp)"
              >
                {{ TYPE_ICON[tp] }} {{ TYPE_LABEL[tp] }}
              </button>
            </div>

            <div class="hm-filter-group">
              <span class="hm-filter-label">Depuis le :</span>
              <input type="date" v-model="clearFromDate" class="hm-date-pick" />
            </div>

            <button
              v-if="clearFromDate || activeFilters.length"
              class="hm-clear-filters"
              @click="clearFilters"
            >
              ✕ Réinitialiser
            </button>

            <span class="hm-event-count" v-if="historyData">
              {{ filteredTimeline.length }} événement(s)
            </span>
          </div>

          <!-- ═══ TIMELINE ══════════════════════════════════════════════ -->
          <div v-if="historyData && !loadingHistory" class="hm-timeline">
            <div v-if="filteredTimeline.length === 0" class="hm-no-results">
              Aucun événement pour ces filtres.
            </div>

            <div v-for="(ev, idx) in filteredTimeline" :key="idx" class="hm-event">
              <!-- Connector line -->
              <div class="hm-event-connector">
                <div class="hm-event-node" :style="{ background: TYPE_COLOR[ev.type] }">
                  {{ ev.icon }}
                </div>
                <div v-if="idx < filteredTimeline.length - 1" class="hm-event-line"></div>
              </div>

              <!-- Card -->
              <div class="hm-event-card">
                <!-- Top row -->
                <div class="hm-event-toprow">
                  <span
                    class="hm-event-badge"
                    :style="{ background: TYPE_COLOR[ev.type] + '1a', color: TYPE_COLOR[ev.type] }"
                  >
                    {{ TYPE_LABEL[ev.type] }}
                  </span>
                  <time class="hm-event-time">{{ fmtDate(ev.date) }}</time>
                </div>

                <div class="hm-event-title">{{ ev.label }}</div>
                <div class="hm-event-desc">{{ ev.detail }}</div>

                <!-- ── Enrollment details ── -->
                <div v-if="ev.type === 'enrollment' && ev.meta" class="hm-meta">
                  <div class="hm-meta-row">
                    <div class="hm-meta-cell">
                      <span class="hm-mk">Enseignant</span>
                      <span class="hm-mv">{{ ev.meta.teacher_name || '—' }}</span>
                    </div>
                    <div class="hm-meta-cell">
                      <span class="hm-mk">Niveau</span>
                      <span class="hm-mv"
                        >{{ ev.meta.education_level }} — {{ ev.meta.year_level }}ème</span
                      >
                    </div>
                    <div class="hm-meta-cell">
                      <span class="hm-mk">Branche</span>
                      <span class="hm-mv">{{ ev.meta.branch || '—' }}</span>
                    </div>
                    <div class="hm-meta-cell">
                      <span class="hm-mk">Type</span>
                      <span class="hm-mv">{{ ev.meta.enrollment_type }}</span>
                    </div>
                    <div class="hm-meta-cell">
                      <span class="hm-mk">Statut</span>
                      <span
                        class="hm-mv hm-status"
                        :style="{
                          background: statusColor(ev.meta.status) + '1a',
                          color: statusColor(ev.meta.status),
                        }"
                        >{{ ev.meta.status }}</span
                      >
                    </div>
                    <div class="hm-meta-cell">
                      <span class="hm-mk">Paiement</span>
                      <span
                        class="hm-mv hm-status"
                        :style="{
                          background: statusColor(ev.meta.payment_status) + '1a',
                          color: statusColor(ev.meta.payment_status),
                        }"
                        >{{ ev.meta.payment_status }}</span
                      >
                    </div>
                    <div class="hm-meta-cell">
                      <span class="hm-mk">Prix du cours</span>
                      <span class="hm-mv">{{ ev.meta.price ? ev.meta.price + ' DA' : '—' }}</span>
                    </div>
                  </div>
                </div>

                <!-- ── Payment details ── -->
                <div v-if="ev.type === 'payment' && ev.meta" class="hm-meta">
                  <div class="hm-meta-row">
                    <div class="hm-meta-cell">
                      <span class="hm-mk">Montant payé</span>
                      <span class="hm-mv hm-paid">{{ ev.meta.amount_paid }} DA</span>
                    </div>
                    <div class="hm-meta-cell">
                      <span class="hm-mk">Montant dû</span>
                      <span class="hm-mv">{{
                        ev.meta.payment_due ? ev.meta.payment_due + ' DA' : '—'
                      }}</span>
                    </div>
                    <div class="hm-meta-cell">
                      <span class="hm-mk">Statut</span>
                      <span
                        class="hm-mv hm-status"
                        :style="{
                          background: statusColor(ev.meta.payment_status) + '1a',
                          color: statusColor(ev.meta.payment_status),
                        }"
                        >{{ ev.meta.payment_status }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════
   OVERLAY & MODAL SHELL
═══════════════════════════════════════════════════ */
.hm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 13, 31, 0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.hm-modal {
  background: #ffffff;
  border-radius: 24px;
  width: 100%;
  max-width: 880px;
  max-height: 92vh;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 32px 100px rgba(2, 85, 174, 0.2),
    0 0 0 1px rgba(2, 85, 174, 0.06);
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}
.hm-modal::-webkit-scrollbar {
  width: 5px;
}
.hm-modal::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.hm-dark.hm-modal {
  background: #0d1829;
  box-shadow:
    0 32px 100px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
}

/* ═══════════════════════════════════════════════════
   HEADER
═══════════════════════════════════════════════════ */
.hm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.75rem 1.25rem;
  border-bottom: 1px solid rgba(2, 85, 174, 0.07);
  position: sticky;
  top: 0;
  background: inherit;
  z-index: 20;
  border-radius: 24px 24px 0 0;
}
.hm-dark .hm-header {
  border-bottom-color: rgba(255, 255, 255, 0.06);
}

.hm-title-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hm-header-icon {
  width: 46px;
  height: 46px;
  min-width: 46px;
  background: linear-gradient(135deg, #0255ae, #0ea5e9);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(2, 85, 174, 0.3);
}
.hm-header-icon svg {
  width: 22px;
  height: 22px;
  stroke: #fff;
}

.hm-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #040d1f;
  margin: 0 0 0.2rem;
  letter-spacing: -0.02em;
}
.hm-dark .hm-title {
  color: #f1f5f9;
}
.hm-subtitle {
  font-size: 0.78rem;
  color: #64748b;
  margin: 0;
}

.hm-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: #f1f5f9;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}
.hm-close-btn:hover {
  background: #e2e8f0;
}
.hm-dark .hm-close-btn {
  background: rgba(255, 255, 255, 0.08);
}
.hm-dark .hm-close-btn:hover {
  background: rgba(255, 255, 255, 0.14);
}
.hm-close-btn svg {
  width: 16px;
  height: 16px;
  stroke: #64748b;
}

/* ═══════════════════════════════════════════════════
   SEARCH
═══════════════════════════════════════════════════ */
.hm-search-section {
  padding: 1.25rem 1.75rem 0;
  position: relative;
}

.hm-search-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  padding: 0.7rem 1rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.hm-dark .hm-search-box {
  background: #1a2744;
  border-color: rgba(255, 255, 255, 0.1);
}
.hm-search-box:focus-within {
  border-color: #0255ae;
  box-shadow: 0 0 0 3px rgba(2, 85, 174, 0.1);
}

.hm-search-ico {
  width: 18px;
  height: 18px;
  color: #94a3b8;
  flex-shrink: 0;
}

.hm-search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 0.9rem;
  color: #040d1f;
  font-family: inherit;
}
.hm-dark .hm-search-input {
  color: #e2e8f0;
}
.hm-search-input::placeholder {
  color: #94a3b8;
}

.hm-search-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #e2e8f0;
  border-top-color: #0255ae;
  border-radius: 50%;
  animation: hm-spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes hm-spin {
  to {
    transform: rotate(360deg);
  }
}

.hm-search-clear {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  flex-shrink: 0;
}
.hm-search-clear svg {
  width: 16px;
  height: 16px;
  stroke: #94a3b8;
}
.hm-search-clear:hover svg {
  stroke: #ef4444;
}

/* Dropdown */
.hm-dropdown {
  position: absolute;
  top: calc(100% + 2px);
  left: 1.75rem;
  right: 1.75rem;
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(2, 85, 174, 0.1);
  box-shadow: 0 12px 40px rgba(2, 85, 174, 0.14);
  z-index: 30;
  overflow: hidden;
}
.hm-dark .hm-dropdown {
  background: #1a2744;
  border-color: rgba(255, 255, 255, 0.08);
}

.hm-dropdown-header {
  padding: 0.5rem 1rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}
.hm-dark .hm-dropdown-header {
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.hm-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 1rem;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}
.hm-dropdown-item:last-child {
  border-bottom: none;
}
.hm-dropdown-item:hover {
  background: rgba(2, 85, 174, 0.05);
}
.hm-dark .hm-dropdown-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.hm-drop-avatar {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 50%;
  color: #fff;
  font-weight: 800;
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hm-drop-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.hm-drop-name {
  font-weight: 700;
  font-size: 0.87rem;
  color: #040d1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hm-dark .hm-drop-name {
  color: #e2e8f0;
}
.hm-drop-email {
  font-size: 0.73rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hm-drop-since {
  font-size: 0.7rem;
  color: #94a3b8;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════════════
   EMPTY / LOADING / ERROR
═══════════════════════════════════════════════════ */
.hm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem 3rem;
  gap: 0.75rem;
  color: #94a3b8;
  text-align: center;
}
.hm-empty-illustration {
  width: 80px;
  height: 80px;
  color: #cbd5e1;
}
.hm-dark .hm-empty-illustration {
  color: rgba(255, 255, 255, 0.12);
}
.hm-empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: #475569;
  margin: 0;
}
.hm-dark .hm-empty-title {
  color: #94a3b8;
}
.hm-empty-sub {
  font-size: 0.83rem;
  max-width: 360px;
  margin: 0;
  line-height: 1.6;
}

.hm-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3.5rem;
  color: #64748b;
  font-size: 0.88rem;
}
.hm-loading-dots {
  display: flex;
  gap: 6px;
}
.hm-loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0255ae;
  animation: hm-bounce 1.2s ease-in-out infinite;
}
.hm-loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.hm-loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes hm-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.7);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.hm-error-box {
  margin: 1rem 1.75rem;
  padding: 0.8rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #dc2626;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.hm-error-box svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.hm-dark .hm-error-box {
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.3);
}

/* ═══════════════════════════════════════════════════
   STUDENT BANNER
═══════════════════════════════════════════════════ */
.hm-student-banner {
  margin: 1.25rem 1.75rem 0;
  background: linear-gradient(135deg, #012254 0%, #0255ae 50%, #0ea5e9 100%);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  box-shadow: 0 8px 28px rgba(2, 85, 174, 0.25);
}
.hm-banner-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 200px;
}
.hm-banner-avatar {
  width: 56px;
  height: 56px;
  min-width: 56px;
  border-radius: 50%;
  color: #fff;
  font-weight: 800;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
}
.hm-banner-name {
  color: #fff;
  font-weight: 800;
  font-size: 1rem;
  margin-bottom: 0.15rem;
}
.hm-banner-email {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.78rem;
  margin-bottom: 0.5rem;
}
.hm-banner-chips {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}
.hm-chip {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 0.15rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 500;
}

.hm-banner-kpis {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.hm-kpi {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0.75rem;
  text-align: center;
}
.hm-kpi-val {
  color: #fff;
  font-weight: 800;
  font-size: 1rem;
  white-space: nowrap;
}
.hm-kpi-lbl {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.68rem;
  white-space: nowrap;
  margin-top: 0.1rem;
}
.hm-kpi-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
}

/* ═══════════════════════════════════════════════════
   FILTER BAR
═══════════════════════════════════════════════════ */
.hm-filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 1rem 1.75rem 0;
}
.hm-filter-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.hm-filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
}

.hm-filter-pill {
  padding: 0.28rem 0.75rem;
  border-radius: 20px;
  border: 1.5px solid #e2e8f0;
  background: transparent;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.18s;
  font-family: inherit;
}
.hm-dark .hm-filter-pill {
  border-color: rgba(255, 255, 255, 0.12);
  color: #94a3b8;
}
.hm-filter-pill:hover {
  border-color: #0255ae;
  color: #0255ae;
}
.hm-filter-pill--on {
  border-color: transparent !important;
}

.hm-date-pick {
  padding: 0.3rem 0.65rem;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  background: transparent;
  color: inherit;
  font-size: 0.78rem;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}
.hm-date-pick:focus {
  border-color: #0255ae;
}
.hm-dark .hm-date-pick {
  border-color: rgba(255, 255, 255, 0.12);
  background: #1a2744;
  color: #e2e8f0;
}

.hm-clear-filters {
  padding: 0.28rem 0.75rem;
  border-radius: 20px;
  border: 1.5px solid #ef4444;
  background: transparent;
  color: #ef4444;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  font-family: inherit;
}
.hm-clear-filters:hover {
  background: #ef4444;
  color: #fff;
}

.hm-event-count {
  margin-left: auto;
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
}

/* ═══════════════════════════════════════════════════
   TIMELINE
═══════════════════════════════════════════════════ */
.hm-timeline {
  padding: 1.25rem 1.75rem 2rem;
  display: flex;
  flex-direction: column;
}
.hm-no-results {
  text-align: center;
  padding: 2.5rem 1rem;
  color: #94a3b8;
  font-size: 0.87rem;
}

.hm-event {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.hm-event-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding-top: 2px;
}

.hm-event-node {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  position: relative;
  z-index: 1;
}

.hm-event-line {
  flex: 1;
  width: 2px;
  background: linear-gradient(to bottom, rgba(2, 85, 174, 0.15), rgba(2, 85, 174, 0.05));
  min-height: 16px;
  margin: 3px 0;
}
.hm-dark .hm-event-line {
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
}

.hm-event-card {
  flex: 1;
  background: #f8fafc;
  border: 1px solid rgba(2, 85, 174, 0.06);
  border-radius: 14px;
  padding: 1rem 1.15rem;
  margin-bottom: 0.75rem;
  transition: box-shadow 0.2s;
}
.hm-event-card:hover {
  box-shadow: 0 4px 20px rgba(2, 85, 174, 0.08);
}
.hm-dark .hm-event-card {
  background: #1a2744;
  border-color: rgba(255, 255, 255, 0.05);
}
.hm-dark .hm-event-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.hm-event-toprow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.hm-event-badge {
  padding: 0.18rem 0.65rem;
  border-radius: 20px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.hm-event-time {
  font-size: 0.72rem;
  color: #94a3b8;
}

.hm-event-title {
  font-weight: 700;
  font-size: 0.9rem;
  color: #040d1f;
  margin-bottom: 0.2rem;
}
.hm-dark .hm-event-title {
  color: #e2e8f0;
}

.hm-event-desc {
  font-size: 0.82rem;
  color: #475569;
  margin-bottom: 0.5rem;
}
.hm-dark .hm-event-desc {
  color: #94a3b8;
}

/* Meta grid */
.hm-meta {
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(2, 85, 174, 0.06);
}
.hm-dark .hm-meta {
  border-top-color: rgba(255, 255, 255, 0.05);
}

.hm-meta-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
}
.hm-meta-cell {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.hm-mk {
  font-size: 0.65rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}
.hm-mv {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e293b;
}
.hm-dark .hm-mv {
  color: #e2e8f0;
}
.hm-status {
  display: inline-block;
  padding: 0.12rem 0.5rem;
  border-radius: 20px;
  font-size: 0.72rem;
}
.hm-paid {
  color: #10b981;
  font-weight: 700;
}

/* ═══════════════════════════════════════════════════
   TRANSITIONS
═══════════════════════════════════════════════════ */
.hm-fade-enter-active,
.hm-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.hm-fade-enter-from,
.hm-fade-leave-to {
  opacity: 0;
}
.hm-fade-enter-from .hm-modal {
  transform: scale(0.96) translateY(16px);
}

.hm-drop-enter-active,
.hm-drop-leave-active {
  transition: all 0.18s ease;
}
.hm-drop-enter-from,
.hm-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ═══════════════════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════════════════ */
@media (max-width: 640px) {
  .hm-modal {
    border-radius: 16px;
  }
  .hm-header {
    padding: 1.25rem 1.25rem 1rem;
  }
  .hm-search-section,
  .hm-filter-bar,
  .hm-timeline {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }
  .hm-student-banner {
    margin-left: 1.25rem;
    margin-right: 1.25rem;
  }
  .hm-banner-kpis {
    gap: 0.25rem;
  }
  .hm-kpi-divider {
    display: none;
  }
}
</style>
