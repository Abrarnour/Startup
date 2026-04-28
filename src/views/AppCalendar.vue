<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Users,
  BookOpen,
  GraduationCap,
  AlertCircle,
  X,
  Repeat,
  Plus,
} from 'lucide-vue-next'
import * as api from '../services/api.js'
import { useLanguage } from '../composables/useLanguage.js'
import AppLoader from '../components/AppLoader.vue'
const { t, currentLang } = useLanguage()
const props = defineProps({
  darkMode: { type: Boolean, default: false },
})

const router = useRouter()

const currentDate = ref(new Date())
const events = ref([])
const loading = ref(true)
const error = ref('')
const selectedEvent = ref(null) // single event detail modal
const selectedDay = ref(null) // "all events of this day" modal
const userRole = ref('')
const currentUser = ref(null)

// ─── Stable color palette (not random — deterministic per course_id / student_name) ────
// 12 rich, accessible colors. Index is derived from a string hash so it's
// always the same color for the same course / child — no random, no keys.
const COLOR_PALETTE = [
  { bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', solid: '#6366f1' },
  { bg: 'linear-gradient(135deg,#ec4899,#f43f5e)', solid: '#ec4899' },
  { bg: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', solid: '#0ea5e9' },
  { bg: 'linear-gradient(135deg,#10b981,#34d399)', solid: '#10b981' },
  { bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)', solid: '#f59e0b' },
  { bg: 'linear-gradient(135deg,#ef4444,#f97316)', solid: '#ef4444' },
  { bg: 'linear-gradient(135deg,#14b8a6,#06b6d4)', solid: '#14b8a6' },
  { bg: 'linear-gradient(135deg,#a855f7,#d946ef)', solid: '#a855f7' },
  { bg: 'linear-gradient(135deg,#3b82f6,#6366f1)', solid: '#3b82f6' },
  { bg: 'linear-gradient(135deg,#84cc16,#22c55e)', solid: '#84cc16' },
  { bg: 'linear-gradient(135deg,#fb923c,#f97316)', solid: '#fb923c' },
  { bg: 'linear-gradient(135deg,#64748b,#94a3b8)', solid: '#64748b' },
]

function hashString(str) {
  if (!str) return 0
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

// ─── Color logic:
//   • admin / teacher  → color by course_id (stable per course)
//   • student          → color by group_id  (stable per group)
//   • Parent           → color by student_name (one color per child)
function getEventColor(event) {
  let key = ''
  if (userRole.value === 'Parent') {
    key = event.student_name || event.course_title || ''
  } else {
    key = String(event.course_id || event.group_id || event.course_title || '')
  }
  const idx = hashString(key) % COLOR_PALETTE.length
  return COLOR_PALETTE[idx]
}

// ─── Weekdays & month name ────────────────────────────────────────────────────
const weekDays = computed(() => [
  t('sun'),
  t('mon'),
  t('tue'),
  t('wed'),
  t('thu'),
  t('fri'),
  t('sat'),
])

const monthName = computed(() =>
  currentDate.value.toLocaleDateString(currentLang.value === 'ar' ? 'ar-DZ' : 'fr-FR', {
    month: 'long',
  }),
)
const currentYear = computed(() => currentDate.value.getFullYear())

// ─── Calendar grid ─────────────────────────────────────────────────────────────
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const startingDayOfWeek = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days = []
  const today = new Date()

  // Previous month filler
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = daysInPrevMonth - i
    days.push({
      id: `prev-${date}`,
      date,
      fullDate: new Date(year, month - 1, date),
      isCurrentMonth: false,
      isToday: false,
      events: [],
    })
  }

  // Current month days — ALL events (no slice here)
  for (let date = 1; date <= daysInMonth; date++) {
    const fullDate = new Date(year, month, date)
    const isToday =
      fullDate.getDate() === today.getDate() &&
      fullDate.getMonth() === today.getMonth() &&
      fullDate.getFullYear() === today.getFullYear()

    const dateString = fullDate.toISOString().split('T')[0]
    // ✅ FIX: collect ALL events for this day (not slice)
    const dayEvents = events.value.filter((e) => e.date === dateString)
    // ✅ Sort by start time so the earliest course shows first
    dayEvents.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))

    days.push({
      id: `curr-${date}`,
      date,
      fullDate,
      isCurrentMonth: true,
      isToday,
      events: dayEvents,
    })
  }

  // Next month filler
  const remainingDays = 42 - days.length
  for (let date = 1; date <= remainingDays; date++) {
    days.push({
      id: `next-${date}`,
      date,
      fullDate: new Date(year, month + 1, date),
      isCurrentMonth: false,
      isToday: false,
      events: [],
    })
  }

  return days
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getLevelLabel = (level) => {
  const labels = {
    primaire: t('level_primary'),
    moyen: t('level_middle'),
    secondaire: t('level_secondary'),
  }
  return labels[level] || level
}

const getSuffix = (year) => (year === 1 && currentLang.value !== 'ar' ? 'ère' : 'ème')

const formatTime = (time) => {
  if (!time) return ''
  return time.substring(0, 5)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString(currentLang.value === 'ar' ? 'ar-DZ' : 'fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const formatDayHeader = (fullDate) => {
  return fullDate.toLocaleDateString(currentLang.value === 'ar' ? 'ar-DZ' : 'fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

// ─── Navigation ───────────────────────────────────────────────────────────────
const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}
const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}
const goToday = () => {
  currentDate.value = new Date()
}

// ─── Modal controls ────────────────────────────────────────────────────────────
const showEventDetails = (event, e) => {
  e?.stopPropagation()
  selectedEvent.value = event
  selectedDay.value = null
}

// ✅ NEW: Open "all events of this day" modal — triggered by clicking day cell
//         or the "+N more" indicator
const openDayModal = (day, e) => {
  e?.stopPropagation()
  if (day.events.length === 0) return
  selectedDay.value = day
  selectedEvent.value = null
}

const closeModals = () => {
  selectedEvent.value = null
  selectedDay.value = null
}

// ─── Fetch events ─────────────────────────────────────────────────────────────
const fetchEvents = async () => {
  loading.value = true
  error.value = ''
  try {
    const user = api.getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }
    userRole.value = user.role
    currentUser.value = user

    const data = await api.getCalendarEvents(user.role)
    events.value = (data.events || []).map((event, index) => ({
      ...event,
      id: `event-${index}-${event.group_id}-${event.date}-${event.start_time}`,
    }))
  } catch (err) {
    console.error('Erreur chargement calendrier:', err)
    error.value = err.message || t('error_loading_calendar')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchEvents()
})
</script>

<template>
  <div :class="['calendar-container', { dark: darkMode }]">
    <!-- ─── Header ─────────────────────────────────────────────────────────── -->
    <div class="cal-header">
      <div class="cal-header-left">
        <Calendar class="cal-icon" :size="26" />
        <div>
          <h1 class="cal-title">{{ t('timetable_title') }}</h1>
          <p class="cal-subtitle" style="text-transform: capitalize">
            {{ monthName }} {{ currentYear }}
          </p>
        </div>
      </div>

      <div class="cal-nav">
        <button @click="previousMonth" class="nav-btn" :title="t('previous')">
          <ChevronLeft :size="18" />
        </button>
        <button @click="goToday" class="today-btn">{{ t('today') }}</button>
        <button @click="nextMonth" class="nav-btn" :title="t('next')">
          <ChevronRight :size="18" />
        </button>
      </div>

      <!-- Legend: only shown for admin/teacher (not student/parent — colors are per-course/child) -->
      <div v-if="['admin', 'teacher'].includes(userRole)" class="cal-legend">
        <span class="legend-label">{{ t('courses') }}</span>
        <div
          v-for="(color, i) in COLOR_PALETTE.slice(0, 5)"
          :key="i"
          class="legend-dot"
          :style="{ background: color.solid }"
        ></div>
        <span class="legend-label" style="opacity: 0.6">…</span>
      </div>
      <div v-else-if="userRole === 'Parent'" class="cal-legend">
        <span class="legend-label">{{ t('color_per_child') || 'Couleur par enfant' }}</span>
      </div>
      <div v-else class="cal-legend">
        <span class="legend-label">{{ t('color_per_course') || 'Couleur par matière' }}</span>
      </div>
    </div>

    <!-- ─── Loading ────────────────────────────────────────────────────────── -->
    <div v-if="loading" class="state-box">
      <AppLoader size="120px" />
      <p class="mt-4 text-gray-500">{{ t('loading_calendar') }}</p>
    </div>

    <!-- ─── Error ──────────────────────────────────────────────────────────── -->
    <div v-else-if="error" class="state-box">
      <AlertCircle :size="44" style="color: #ef4444" />
      <p>{{ error }}</p>
      <button @click="fetchEvents" class="today-btn" style="margin-top: 1rem">
        {{ t('retry') }}
      </button>
    </div>

    <!-- ─── Calendar body ──────────────────────────────────────────────────── -->
    <div v-else class="cal-body">
      <!-- Weekday headers -->
      <div class="weekdays-row">
        <div v-for="day in weekDays" :key="day" class="weekday-label">{{ day }}</div>
      </div>

      <!-- Days grid -->
      <div class="days-grid">
        <div
          v-for="day in calendarDays"
          :key="day.id"
          :class="[
            'day-cell',
            {
              'other-month': !day.isCurrentMonth,
              'is-today': day.isToday,
              'has-events': day.events.length > 0,
            },
          ]"
          @click="openDayModal(day, $event)"
        >
          <!-- Day number + optional plus badge -->
          <div class="day-top">
            <span class="day-num">{{ day.date }}</span>
            <!-- ✅ Plus badge — visible when day has more than 2 events -->
            <span v-if="day.events.length > 2" class="plus-badge">
              <Plus :size="10" />{{ day.events.length }}
            </span>
          </div>

          <!-- Show max 2 events inline, rest hidden behind the modal -->
          <div class="events-stack">
            <div
              v-for="event in day.events.slice(0, 2)"
              :key="event.id"
              class="event-pill"
              :style="{ background: getEventColor(event).bg }"
              @click="showEventDetails(event, $event)"
            >
              <span class="pill-time">{{ formatTime(event.start_time) }}</span>
              <span class="pill-title">
                <!-- For Parent: show child name first -->
                <template v-if="userRole === 'Parent' && event.student_name">
                  {{ event.student_name.split(' ')[0] }} · {{ event.course_title }}
                </template>
                <template v-else>{{ event.course_title }}</template>
              </span>
            </div>

            <!-- ✅ "+N more" strip — clicking opens the day modal -->
            <div
              v-if="day.events.length > 2"
              class="more-strip"
              @click.stop="openDayModal(day, $event)"
            >
              +{{ day.events.length - 2 }} {{ t('more_suffix') || 'de plus' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════
         ✅ NEW: Day modal — all events of a day in one scrollable sheet
         ═══════════════════════════════════════════════════════════════════ -->
    <Transition name="fade">
      <div v-if="selectedDay" class="modal-overlay" @click.self="closeModals">
        <div class="day-modal" :class="{ dark: darkMode }">
          <button class="close-btn" @click="closeModals"><X :size="20" /></button>
          <h3 class="day-modal-title">
            <Calendar :size="18" style="margin-right: 0.4rem; vertical-align: middle" />
            {{ formatDayHeader(selectedDay.fullDate) }}
          </h3>
          <p class="day-modal-count">
            {{ selectedDay.events.length }}
            {{
              selectedDay.events.length === 1
                ? t('course_singular') || 'cours'
                : t('courses_plural') || 'cours'
            }}
          </p>

          <div class="day-modal-list">
            <div
              v-for="event in selectedDay.events"
              :key="event.id"
              class="day-event-card"
              :style="{ borderLeftColor: getEventColor(event).solid }"
              @click="showEventDetails(event, $event)"
            >
              <!-- Color strip -->
              <div class="dcard-accent" :style="{ background: getEventColor(event).bg }">
                <BookOpen :size="18" />
              </div>

              <div class="dcard-body">
                <div class="dcard-title">{{ event.course_title }}</div>
                <div class="dcard-meta">
                  <!-- Time -->
                  <span class="dcard-tag">
                    <Clock :size="12" />
                    {{ formatTime(event.start_time) }} – {{ formatTime(event.end_time) }}
                  </span>
                  <!-- Room -->
                  <span v-if="event.salle" class="dcard-tag">
                    <MapPin :size="12" />{{ event.salle }}
                  </span>
                  <!-- Teacher -->
                  <span v-if="event.teacher_name" class="dcard-tag">
                    <User :size="12" />{{ event.teacher_name }}
                  </span>
                  <!-- Group -->
                  <span class="dcard-tag"> <Users :size="12" />{{ event.group_name }} </span>
                  <!-- Child name (parent view) -->
                  <span
                    v-if="userRole === 'Parent' && event.student_name"
                    class="dcard-tag child-tag"
                  >
                    👤 {{ event.student_name }}
                  </span>
                  <!-- Students count (admin/teacher) -->
                  <span v-if="['admin', 'teacher'].includes(userRole)" class="dcard-tag">
                    {{ event.current_students || 0 }}/{{ event.max_students || 30 }} élèves
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ═══════════════════════════════════════════════════════════════════════
         Event detail modal
         ═══════════════════════════════════════════════════════════════════ -->
    <Transition name="fade">
      <div v-if="selectedEvent" class="modal-overlay" @click.self="closeModals">
        <div
          class="detail-modal"
          :class="{ dark: darkMode }"
          :style="{ '--event-color': getEventColor(selectedEvent).solid }"
        >
          <button class="close-btn" @click="closeModals"><X :size="20" /></button>

          <div class="detail-hero" :style="{ background: getEventColor(selectedEvent).bg }">
            <BookOpen :size="28" style="color: white; margin-bottom: 0.5rem" />
            <h2>{{ selectedEvent.course_title }}</h2>
            <p>{{ selectedEvent.group_name }}</p>
          </div>

          <div class="detail-body">
            <div class="detail-row">
              <Clock :size="18" class="detail-icon" />
              <div>
                <strong>{{ t('schedule_label') }}</strong>
                <p>{{ formatDate(selectedEvent.date) }}</p>
                <p>
                  {{ formatTime(selectedEvent.start_time) }} –
                  {{ formatTime(selectedEvent.end_time) }}
                </p>
              </div>
            </div>

            <div v-if="selectedEvent.teacher_name" class="detail-row">
              <User :size="18" class="detail-icon" />
              <div>
                <strong>{{ t('teacher_label') }}</strong>
                <p>{{ selectedEvent.teacher_name }}</p>
              </div>
            </div>

            <div v-if="selectedEvent.salle" class="detail-row">
              <MapPin :size="18" class="detail-icon" />
              <div>
                <strong>{{ t('room') }}</strong>
                <p>{{ selectedEvent.salle }}</p>
              </div>
            </div>

            <div class="detail-row">
              <GraduationCap :size="18" class="detail-icon" />
              <div>
                <strong>{{ t('level') }}</strong>
                <p>
                  {{ getLevelLabel(selectedEvent.education_level) }} – {{ selectedEvent.year_level
                  }}{{ currentLang === 'ar' ? '' : getSuffix(selectedEvent.year_level) }}
                  {{ t('year_label') }}
                  <span v-if="selectedEvent.branch"> ({{ selectedEvent.branch }})</span>
                </p>
              </div>
            </div>

            <div v-if="userRole === 'Parent' && selectedEvent.student_name" class="detail-row">
              <Users :size="18" class="detail-icon" />
              <div>
                <strong>{{ t('student_label') }}</strong>
                <p>{{ selectedEvent.student_name }}</p>
              </div>
            </div>

            <div v-if="['admin', 'teacher'].includes(userRole)" class="detail-row">
              <Users :size="18" class="detail-icon" />
              <div>
                <strong>{{ t('class_size') }}</strong>
                <p>
                  {{ selectedEvent.current_students || 0 }} /
                  {{ selectedEvent.max_students || 30 }} {{ t('students_count') }}
                </p>
              </div>
            </div>

            <div class="type-pill">
              {{
                selectedEvent.course_type === 'continuous'
                  ? t('continuous_course')
                  : t('single_session')
              }}
              <span v-if="selectedEvent.is_recurring" class="recurring-tag">
                <Repeat :size="12" /> {{ t('recurring') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── Design tokens ─────────────────────────────────────────────────────────── */
.calendar-container {
  --bg: #f0f4ff;
  --surface: #ffffff;
  --border: #e2e8f0;
  --text: #1e293b;
  --muted: #64748b;
  --accent: #6366f1;
  --accent2: #8b5cf6;
  --today-bg: rgba(99, 102, 241, 0.08);
  --radius: 14px;
  --shadow: 0 4px 24px rgba(99, 102, 241, 0.1);
  min-height: 100%;
  background: var(--bg);
  padding: 1rem;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.calendar-container.dark {
  --bg: #0f1117;
  --surface: #1a1d2e;
  --border: #2d3448;
  --text: #e2e8f0;
  --muted: #94a3b8;
  --today-bg: rgba(99, 102, 241, 0.15);
  --shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

/* ── Header ────────────────────────────────────────────────────────────────── */
.cal-header {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.cal-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.cal-icon {
  color: var(--accent);
}

.cal-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cal-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
}

.cal-nav {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.nav-btn {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.nav-btn:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.today-btn {
  padding: 0.4rem 1rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.today-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.cal-legend {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.legend-label {
  font-size: 0.78rem;
  color: var(--muted);
}
.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

/* ── State boxes ───────────────────────────────────────────────────────────── */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: var(--surface);
  border-radius: var(--radius);
  color: var(--muted);
  gap: 0.75rem;
  border: 1px solid var(--border);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Calendar body ─────────────────────────────────────────────────────────── */
.cal-body {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 1rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.weekdays-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}
.weekday-label {
  text-align: center;
  font-weight: 700;
  font-size: 0.78rem;
  color: var(--accent);
  padding: 0.3rem 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ─── Days grid ──────────────────────────────────────────────────────────── */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.35rem;
}

.day-cell {
  min-height: 100px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 0.3rem;
  background: var(--bg);
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.15s;
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.day-cell.other-month {
  opacity: 0.35;
  pointer-events: none;
}

.day-cell:hover:not(.other-month) {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  transform: translateY(-1px);
}

.day-cell.is-today {
  border-color: var(--accent);
  background: var(--today-bg);
}

.day-cell.has-events {
  cursor: pointer;
}

/* Day number row */
.day-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.day-num {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
}

.day-cell.is-today .day-num {
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 0.9rem;
}

/* ✅ Plus badge — appears when day has >2 events */
.plus-badge {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  background: var(--accent);
  color: white;
  border-radius: 5px;
  font-size: 0.6rem;
  font-weight: 800;
  padding: 1px 4px;
  line-height: 1.4;
}

/* Events stack — shows 2 pills max */
.events-stack {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

/* Event pill */
.event-pill {
  border-radius: 5px;
  padding: 0.22rem 0.35rem;
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.event-pill:hover {
  transform: scale(1.03);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.pill-time {
  font-size: 0.58rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1;
}

.pill-title {
  font-size: 0.66rem;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

/* "+N more" strip */
.more-strip {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--accent);
  text-align: center;
  padding: 0.1rem 0;
  border-radius: 4px;
  background: rgba(99, 102, 241, 0.08);
  cursor: pointer;
  transition: background 0.15s;
}
.more-strip:hover {
  background: rgba(99, 102, 241, 0.18);
}

/* ══════════════════════════════════════════════════════════════════════════════
   Day modal (all events of a day)
══════════════════════════════════════════════════════════════════════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.day-modal {
  background: white;
  border-radius: 18px;
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.day-modal.dark {
  background: #1a1d2e;
  color: #e2e8f0;
}

.day-modal-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text, #1e293b);
  text-transform: capitalize;
}
.day-modal.dark .day-modal-title {
  color: #e2e8f0;
}

.day-modal-count {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
}

.day-modal-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

/* Each event card inside day modal */
.day-event-card {
  display: flex;
  align-items: stretch;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  border-left: 4px solid;
  overflow: hidden;
  cursor: pointer;
  transition:
    box-shadow 0.15s,
    transform 0.15s;
}
.day-modal.dark .day-event-card {
  border-color: #2d3448;
}
.day-event-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.dcard-accent {
  width: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.dcard-body {
  flex: 1;
  padding: 0.55rem 0.7rem;
}

.dcard-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.35rem;
}
.day-modal.dark .dcard-title {
  color: #e2e8f0;
}

.dcard-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.dcard-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.72rem;
  color: #475569;
  background: #f1f5f9;
  border-radius: 5px;
  padding: 0.15rem 0.4rem;
}
.day-modal.dark .dcard-tag {
  background: #2d3448;
  color: #94a3b8;
}

.child-tag {
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
  font-weight: 700;
}

/* ══════════════════════════════════════════════════════════════════════════════
   Event detail modal
══════════════════════════════════════════════════════════════════════════════ */
.detail-modal {
  background: white;
  border-radius: 18px;
  width: 100%;
  max-width: 460px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
}
.detail-modal.dark {
  background: #1a1d2e;
  color: #e2e8f0;
}

.detail-hero {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border-radius: 18px 18px 0 0;
}
.detail-hero h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: white;
}
.detail-hero p {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.8);
}

.detail-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}
.detail-icon {
  color: var(--accent, #6366f1);
  flex-shrink: 0;
  margin-top: 2px;
}
.detail-row strong {
  display: block;
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 0.15rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.detail-row p {
  margin: 0;
  font-size: 0.9rem;
  color: #1e293b;
}
.detail-modal.dark .detail-row p {
  color: #e2e8f0;
}

.type-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.9rem;
  background: linear-gradient(135deg, var(--accent, #6366f1), var(--accent2, #8b5cf6));
  color: white;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
}

.recurring-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.2rem 0.45rem;
  border-radius: 5px;
  font-size: 0.72rem;
}

/* ── Close button (shared) ─────────────────────────────────────────────────── */
.close-btn {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 10;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.45);
}

/* For day modal (white bg) */
.day-modal .close-btn {
  background: #f1f5f9;
  color: #475569;
}
.day-modal.dark .close-btn {
  background: #2d3448;
  color: #94a3b8;
}
.day-modal .close-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* ── Transition ────────────────────────────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s;
}
.fade-enter-active .day-modal,
.fade-enter-active .detail-modal {
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fade-enter-from {
  opacity: 0;
}
.fade-enter-from .day-modal,
.fade-enter-from .detail-modal {
  transform: scale(0.93) translateY(12px);
}
.fade-leave-to {
  opacity: 0;
}

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .calendar-container {
    padding: 0.5rem;
  }
  .cal-header {
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }
  .cal-title {
    font-size: 1.1rem;
  }
  .days-grid {
    gap: 0.2rem;
  }
  .day-cell {
    min-height: 72px;
    padding: 0.2rem;
  }
  .event-pill {
    padding: 0.18rem 0.28rem;
  }
  .pill-title {
    font-size: 0.6rem;
  }
}

@media (max-width: 480px) {
  .day-cell {
    min-height: 58px;
  }
  .pill-time {
    display: none;
  }
  .day-modal {
    padding: 1rem;
  }
}
</style>
