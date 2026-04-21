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
} from 'lucide-vue-next'
import * as api from '../services/api.js'
import { useLanguage } from '../composables/useLanguage.js' // ✅ Import Language

const { t, currentLang } = useLanguage() // ✅ Extract translation tools
const props = defineProps({
  darkMode: { type: Boolean, default: false },
})

const router = useRouter()

const currentDate = ref(new Date())
const events = ref([])
const loading = ref(true)
const error = ref('')
const selectedEvent = ref(null)
const userRole = ref('')

// Reactive translated weekdays
const weekDays = computed(() => [
  t('sun'),
  t('mon'),
  t('tue'),
  t('wed'),
  t('thu'),
  t('fri'),
  t('sat'),
])

const educationLevels = computed(() => [
  {
    key: 'primaire',
    label: t('level_primary'),
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    key: 'moyen',
    label: t('level_middle'),
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    key: 'secondaire',
    label: t('level_secondary'),
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
])

const monthName = computed(() => {
  return currentDate.value.toLocaleDateString(currentLang.value === 'ar' ? 'ar-DZ' : 'fr-FR', {
    month: 'long',
  })
})

const currentYear = computed(() => {
  return currentDate.value.getFullYear()
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const startingDayOfWeek = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days = []

  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = daysInPrevMonth - i
    const fullDate = new Date(year, month - 1, date)
    days.push({
      id: `prev-${date}`,
      date,
      fullDate,
      isCurrentMonth: false,
      isToday: false,
      events: [],
    })
  }

  const today = new Date()
  for (let date = 1; date <= daysInMonth; date++) {
    const fullDate = new Date(year, month, date)
    const isToday =
      fullDate.getDate() === today.getDate() &&
      fullDate.getMonth() === today.getMonth() &&
      fullDate.getFullYear() === today.getFullYear()

    const dateString = fullDate.toISOString().split('T')[0]
    const dayEvents = events.value.filter((e) => e.date === dateString)

    days.push({
      id: `curr-${date}`,
      date,
      fullDate,
      isCurrentMonth: true,
      isToday,
      events: dayEvents,
    })
  }

  const remainingDays = 42 - days.length
  for (let date = 1; date <= remainingDays; date++) {
    const fullDate = new Date(year, month + 1, date)
    days.push({
      id: `next-${date}`,
      date,
      fullDate,
      isCurrentMonth: false,
      isToday: false,
      events: [],
    })
  }

  return days
})

const getEventColor = (event) => {
  const level = educationLevels.value.find((l) => l.key === event.education_level)
  return level ? level.color : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
}

const getLevelLabel = (level) => {
  const labels = {
    primaire: t('level_primary'),
    moyen: t('level_middle'),
    secondaire: t('level_secondary'),
  }
  return labels[level] || level
}

const getSuffix = (year) => {
  return year === 1 && currentLang.value !== 'ar' ? 'ère' : 'ème'
}

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

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const today = () => {
  currentDate.value = new Date()
}

const showEventDetails = (event) => {
  selectedEvent.value = event
}

const closeModal = () => {
  selectedEvent.value = null
}

const showDayEvents = (day) => {
  console.log('Show all events for day:', day)
}

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

    const data = await api.getCalendarEvents(user.role)
    events.value = data.events.map((event, index) => ({
      ...event,
      id: `event-${index}-${event.group_id}-${event.date}`,
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
    <div class="calendar-header">
      <div class="header-content">
        <div class="title-section">
          <Calendar class="icon" :size="28" />
          <div>
            <h1>{{ t('timetable_title') }}</h1>
            <p class="subtitle">{{ monthName }} {{ currentYear }}</p>
          </div>
        </div>

        <div class="month-nav">
          <button @click="previousMonth" class="nav-btn">
            <ChevronLeft :size="20" />
          </button>
          <button @click="today" class="today-btn">{{ t('today') }}</button>
          <button @click="nextMonth" class="nav-btn">
            <ChevronRight :size="20" />
          </button>
        </div>

        <div class="legend">
          <div v-for="level in educationLevels" :key="level.key" class="legend-item">
            <div class="color-box" :style="{ background: level.color }"></div>
            <span>{{ level.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ t('loading_calendar') }}</p>
    </div>

    <div v-else-if="error" class="error-state">
      <AlertCircle :size="48" />
      <p>{{ error }}</p>
      <button @click="fetchEvents" class="retry-btn">{{ t('retry') }}</button>
    </div>

    <div v-else class="calendar-body">
      <div class="weekdays">
        <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
      </div>

      <div class="days-grid">
        <div
          v-for="day in calendarDays"
          :key="day.id"
          :class="[
            'day-cell',
            {
              'other-month': !day.isCurrentMonth,
              today: day.isToday,
              'has-events': day.events.length > 0,
            },
          ]"
        >
          <div class="day-number">{{ day.date }}</div>

          <div class="events-list">
            <div
              v-for="event in day.events.slice(0, 2)"
              :key="event.id"
              :class="['event-item', `level-${event.education_level}`]"
              :style="{ background: getEventColor(event) }"
              @click="showEventDetails(event)"
            >
              <div class="event-time">
                {{ formatTime(event.start_time) }} - {{ formatTime(event.end_time) }}
              </div>
              <div class="event-title">{{ event.course_title }}</div>
              <div class="event-subtitle">
                {{ event.group_name }}
                <span v-if="userRole === 'Parent'" class="student-badge">{{
                  event.student_name
                }}</span>
              </div>
            </div>

            <div v-if="day.events.length > 2" class="more-events" @click="showDayEvents(day)">
              +{{ day.events.length - 2 }} {{ t('more_suffix') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <transition name="modal">
      <div v-if="selectedEvent" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content" :style="{ borderTopColor: getEventColor(selectedEvent) }">
          <button class="close-btn" @click="closeModal">
            <X :size="24" />
          </button>

          <div class="modal-header">
            <div class="event-icon" :style="{ background: getEventColor(selectedEvent) }">
              <BookOpen :size="32" />
            </div>
            <div>
              <h2>{{ selectedEvent.course_title }}</h2>
              <p class="modal-subtitle">{{ selectedEvent.group_name }}</p>
            </div>
          </div>

          <div class="modal-body">
            <div class="detail-row">
              <Clock :size="20" />
              <div>
                <strong>{{ t('schedule_label') }}</strong>
                <p>
                  {{ formatDate(selectedEvent.date) }} •
                  {{ formatTime(selectedEvent.start_time) }} -
                  {{ formatTime(selectedEvent.end_time) }}
                </p>
              </div>
            </div>

            <div v-if="selectedEvent.teacher_name" class="detail-row">
              <User :size="20" />
              <div>
                <strong>{{ t('teacher_label') }}</strong>
                <p>{{ selectedEvent.teacher_name }}</p>
              </div>
            </div>

            <div v-if="selectedEvent.salle" class="detail-row">
              <MapPin :size="20" />
              <div>
                <strong>{{ t('room') }}</strong>
                <p>{{ selectedEvent.salle }}</p>
              </div>
            </div>

            <div class="detail-row">
              <GraduationCap :size="20" />
              <div>
                <strong>{{ t('level') }}</strong>
                <p>
                  {{ getLevelLabel(selectedEvent.education_level) }} - {{ selectedEvent.year_level
                  }}{{ currentLang === 'ar' ? ' ' : getSuffix(selectedEvent.year_level) }}
                  {{ t('year_label') }}
                  <span v-if="selectedEvent.branch"> ({{ selectedEvent.branch }})</span>
                </p>
              </div>
            </div>

            <div v-if="userRole === 'Parent' && selectedEvent.student_name" class="detail-row">
              <Users :size="20" />
              <div>
                <strong>{{ t('student_label') }}</strong>
                <p>{{ selectedEvent.student_name }}</p>
              </div>
            </div>

            <div v-if="['admin', 'teacher'].includes(userRole)" class="detail-row">
              <Users :size="20" />
              <div>
                <strong>{{ t('class_size') }}</strong>
                <p>
                  {{ selectedEvent.current_students || 0 }} /
                  {{ selectedEvent.max_students || 30 }} {{ t('students_count') }}
                </p>
              </div>
            </div>

            <div class="type-badge">
              {{
                selectedEvent.course_type === 'continuous'
                  ? t('continuous_course')
                  : t('single_session')
              }}
              <span v-if="selectedEvent.is_recurring" class="recurring-badge">
                <Repeat :size="14" /> {{ t('recurring') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* ===================================================
   ✅ FIX 1: CALENDAR CSS - Smaller + No overflow
   =================================================== */

.calendar-container {
  /* ✅ Changed: min-height: 100vh removed, padding 2rem → 1rem */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.calendar-container.dark {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.calendar-header {
  background: white;
  border-radius: 16px;
  /* ✅ Changed: padding 2rem → 1rem, margin-bottom 2rem → 1rem */
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.calendar-container.dark .calendar-header {
  background: #1a1a2e;
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  /* ✅ Changed: gap 2rem → 1rem */
  gap: 1rem;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon {
  color: #667eea;
}

h1 {
  /* ✅ Changed: font-size 2rem → 1.5rem */
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: 0.15rem 0 0 0;
  color: #64748b;
  font-size: 0.9rem;
  text-transform: capitalize;
}

.month-nav {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.nav-btn:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

.today-btn {
  padding: 0.4rem 1.2rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.today-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.legend {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
}

.color-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.calendar-body {
  background: white;
  border-radius: 16px;
  /* ✅ Changed: padding 2rem → 1rem */
  padding: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.calendar-container.dark .calendar-body {
  background: #1a1a2e;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  /* ✅ Changed: gap 1rem → 0.4rem */
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.weekday {
  text-align: center;
  font-weight: 600;
  color: #667eea;
  font-size: 0.85rem;
  padding: 0.3rem;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  /* ✅ Changed: gap 1rem → 0.4rem */
  gap: 0.4rem;
}

.day-cell {
  /* ✅ Changed: min-height 120px → 95px — fits screen without scrolling */
  min-height: 95px;
  border: 1.5px solid #f1f5f9;
  border-radius: 10px;
  /* ✅ Changed: padding 0.5rem → 0.35rem */
  padding: 0.35rem;
  background: #fafafa;
  transition: all 0.3s;
  cursor: pointer;
  /* ✅ KEY FIX: prevents events from breaking outside the cell border */
  overflow: hidden;
}

.calendar-container.dark .day-cell {
  border-color: #2d3748;
  background: #16213e;
}

.day-cell:hover {
  border-color: #667eea;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.day-cell.other-month {
  opacity: 0.4;
}

.day-cell.today {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.day-number {
  font-weight: 600;
  font-size: 0.8rem;
  color: #1e293b;
  margin-bottom: 0.3rem;
}

.calendar-container.dark .day-number {
  color: #e2e8f0;
}

.day-cell.today .day-number {
  color: #667eea;
  font-weight: 700;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  /* ✅ KEY FIX: max-height limits how tall events can be, overflow:hidden clips extra */
  max-height: 70px;
  overflow: hidden;
}

.event-item {
  /* ✅ Changed: padding reduced for compactness */
  padding: 0.25rem 0.4rem;
  border-radius: 6px;
  font-size: 0.68rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  /* ✅ KEY FIX: each event also clips its own text */
  overflow: hidden;
}

.event-item:hover {
  transform: scale(1.02);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.event-time {
  font-weight: 600;
  font-size: 0.62rem;
  opacity: 0.9;
}

.event-title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-subtitle {
  font-size: 0.6rem;
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  margin-left: 0.25rem;
}

.more-events {
  text-align: center;
  font-size: 0.65rem;
  color: #667eea;
  font-weight: 600;
  padding: 0.15rem;
  cursor: pointer;
  transition: all 0.2s;
}

.more-events:hover {
  color: #764ba2;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: white;
  border-radius: 16px;
  padding: 2rem;
  color: #64748b;
}

.calendar-container.dark .loading-state,
.calendar-container.dark .error-state {
  background: #1a1a2e;
  color: #94a3b8;
}

.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid #f1f5f9;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 10px;
  background: #667eea;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border-top: 5px solid #667eea;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.calendar-container.dark .modal-content {
  background: #1a1a2e;
  color: white;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #fee;
  color: #dc2626;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.event-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #1e293b;
}

.calendar-container.dark .modal-header h2 {
  color: white;
}

.modal-subtitle {
  margin: 0.25rem 0 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.detail-row {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.detail-row > svg {
  color: #667eea;
  flex-shrink: 0;
  margin-top: 0.2rem;
}

.detail-row strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #1e293b;
}

.calendar-container.dark .detail-row strong {
  color: white;
}

.detail-row p {
  margin: 0;
  color: #64748b;
}

.type-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
}

.recurring-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .calendar-container {
    padding: 0.5rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  h1 {
    font-size: 1.2rem;
  }

  .days-grid {
    gap: 0.25rem;
  }

  .day-cell {
    min-height: 70px;
    padding: 0.2rem;
  }

  .event-item {
    padding: 0.2rem 0.3rem;
    font-size: 0.6rem;
  }

  .legend {
    width: 100%;
  }

  .modal-content {
    margin: 0.5rem;
    padding: 1.5rem;
  }
}
</style>
