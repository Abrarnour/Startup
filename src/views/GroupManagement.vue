<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Plus,
  Users,
  Calendar,
  Clock,
  MapPin,
  DoorOpen,
  DoorClosed,
  Trash2,
  Edit,
  UserPlus,
  StickyNote,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Settings,
  RefreshCw,
  CalendarPlus,
  Zap,
  AlertTriangle,
  Info,
} from 'lucide-vue-next'
import * as api from '../services/api.js'
import { useLanguage } from '../composables/useLanguage.js' // ✅ Import Language
const route = useRoute()
const router = useRouter()
const { t } = useLanguage()
const props = defineProps({
  darkMode: { type: Boolean, default: false },
  user: { type: Object, required: true },
})

// État
const course = ref(null)
const groups = ref([])
const selectedGroup = ref(null)
const students = ref([])
const loading = ref(true)
const error = ref(null)
const successMessage = ref('')

// Modals
const showAddGroupModal = ref(false)
const showAddStudentModal = ref(false)
const showNoteModal = ref(false)
const showPaymentModal = ref(false)
const showModifyCycleModal = ref(false)
const showEditConfigModal = ref(false)
const selectedStudent = ref(null)
const selectedStudentNotes = ref([])

// Formulaires
const groupForm = reactive({
  group_name: '',
  salle: '',
  start_date: '',
  start_time: '',
  end_time: '',
  calendar_type: 'manual',
  total_weeks: 4,
  total_sessions: 8,
  sessions_per_week: 2,
  repeat_calendar: false,
  sessions: [],
  day_of_week: '',
  session_start_time: '',
  session_end_time: '',
  registration_open: true,
  weekly_schedule: [], // For fixed weekly with multiple sessions
})

const cycleModForm = reactive({
  reason: '',
  calendar_type: 'manual',
  total_weeks: 4,
  total_sessions: 8,
  sessions_per_week: 2,
  return_to_normal: true,
  sessions: [],
  day_of_week: '',
  session_start_time: '',
  session_end_time: '',
  weekly_schedule: [], // For fixed weekly with multiple sessions
})

const configForm = reactive({
  total_sessions: 0,
  total_weeks: 0,
  sessions_per_week: 0,
  max_students: 0,
})

const studentForm = reactive({
  student_id: null,
  email: '',
  name: '',
  last_name: '',
  birthday: '',
  gender: 'M',
  parent_phone: '',
  create_if_not_exists: false,
})

const noteForm = reactive({
  note_text: '',
  note_type: 'general',
  is_important: false,
  is_private: false,
})

const paymentForm = reactive({
  amount_paid: 0,
  payment_status: 'pending',
})

const availableStudents = ref([])

// Jours de la semaine
const daysOfWeek = [
  { value: 'sunday', label: 'الأحد (Dimanche)' },
  { value: 'monday', label: 'الإثنين (Lundi)' },
  { value: 'tuesday', label: 'الثلاثاء (Mardi)' },
  { value: 'wednesday', label: 'الأربعاء (Mercredi)' },
  { value: 'thursday', label: 'الخميس (Jeudi)' },
  { value: 'friday', label: 'الجمعة (Vendredi)' },
  { value: 'saturday', label: 'السبت (Samedi)' },
]

const noteTypes = [
  { value: 'general', label: 'Général' },
  { value: 'behavior', label: 'Comportement' },
  { value: 'progress', label: 'Progression' },
  { value: 'attendance', label: 'Assiduité' },
  { value: 'payment', label: 'Paiement' },
]

// Computed
const isAdmin = computed(() => props.user?.role === 'admin')
const isTeacher = computed(() => props.user?.role === 'teacher')

// Watch pour calculer automatiquement le nombre total de séances
watch(
  () => [groupForm.total_weeks, groupForm.sessions_per_week],
  ([weeks, perWeek]) => {
    if (weeks && perWeek) {
      groupForm.total_sessions = weeks * perWeek
    }
  },
)

watch(
  () => [cycleModForm.total_weeks, cycleModForm.sessions_per_week],
  ([weeks, perWeek]) => {
    if (weeks && perWeek) {
      cycleModForm.total_sessions = weeks * perWeek
    }
  },
)

// Charger les données
const loadCourse = async () => {
  try {
    const data = await api.getCourse(route.params.courseId)
    course.value = data
  } catch (err) {
    error.value = err.message
  }
}

const loadGroups = async () => {
  try {
    const data = await api.getGroupsByCourse(route.params.courseId)
    groups.value = data
  } catch (err) {
    error.value = err.message
  }
}

const loadStudents = async (groupId) => {
  try {
    const data = await api.getGroupStudents(groupId)
    students.value = data
  } catch (err) {
    error.value = err.message
  }
}

const loadAvailableStudents = async () => {
  try {
    const data = await api.getAvailableStudents()
    availableStudents.value = data
  } catch (err) {
    console.error('Erreur chargement étudiants disponibles:', err)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    await loadCourse()
    await loadGroups()
  } catch (err) {
    console.error('Erreur chargement:', err)
  } finally {
    loading.value = false
  }
}

// Initialiser les sessions avec nombre indépendant
const initializeManualSessions = () => {
  const totalSessions =
    groupForm.total_sessions || groupForm.total_weeks * groupForm.sessions_per_week
  groupForm.sessions = []

  let sessionNumber = 1
  for (let week = 1; week <= groupForm.total_weeks; week++) {
    const sessionsThisWeek = Math.min(
      groupForm.sessions_per_week,
      totalSessions - sessionNumber + 1,
    )

    for (let i = 0; i < sessionsThisWeek && sessionNumber <= totalSessions; i++) {
      groupForm.sessions.push({
        session_number: sessionNumber,
        week: week,
        title: `Séance ${sessionNumber}`,
        date: '',
        start_time: '09:00',
        end_time: '11:00',
        status: 'scheduled',
      })
      sessionNumber++
    }
  }
}

// Initialize weekly schedule for fixed weekly calendar
const initializeWeeklySchedule = () => {
  groupForm.weekly_schedule = []
  for (let i = 1; i <= groupForm.sessions_per_week; i++) {
    groupForm.weekly_schedule.push({
      session_in_week: i,
      day_of_week: '',
      start_time: '09:00',
      end_time: '11:00',
    })
  }
}

// Initialiser les sessions pour modification de cycle
const initializeCycleModSessions = () => {
  const totalSessions = cycleModForm.total_sessions
  cycleModForm.sessions = []

  let sessionNumber = 1
  for (let week = 1; week <= cycleModForm.total_weeks; week++) {
    const sessionsThisWeek = Math.min(
      cycleModForm.sessions_per_week,
      totalSessions - sessionNumber + 1,
    )

    for (let i = 0; i < sessionsThisWeek && sessionNumber <= totalSessions; i++) {
      cycleModForm.sessions.push({
        session_number: sessionNumber,
        week: week,
        title: `Séance ${sessionNumber}`,
        date: '',
        start_time: selectedGroup.value?.session_start_time || '09:00',
        end_time: selectedGroup.value?.session_end_time || '11:00',
        status: 'scheduled',
      })
      sessionNumber++
    }
  }
}

// Initialize weekly schedule for cycle modification
const initializeCycleWeeklySchedule = () => {
  cycleModForm.weekly_schedule = []
  for (let i = 1; i <= cycleModForm.sessions_per_week; i++) {
    cycleModForm.weekly_schedule.push({
      session_in_week: i,
      day_of_week: '',
      start_time: '09:00',
      end_time: '11:00',
    })
  }
}

// Gestion des groupes
const openAddGroupModal = () => {
  Object.assign(groupForm, {
    group_name: '',
    salle: '',
    start_date: '',
    start_time: '',
    end_time: '',
    calendar_type: course.value.course_type === 'one_time' ? 'weekly_fixed' : 'manual',
    total_weeks: 4,
    total_sessions: 8,
    sessions_per_week: 2,
    repeat_calendar: false,
    sessions: [],
    day_of_week: '',
    session_start_time: '',
    session_end_time: '',
    registration_open: true,
    weekly_schedule: [],
  })

  if (course.value.course_type === 'continuous') {
    initializeManualSessions()
  } else {
    // For one-time, initialize with 1 session
    groupForm.weekly_schedule = [
      {
        session_in_week: 1,
        day_of_week: '',
        start_time: '09:00',
        end_time: '11:00',
      },
    ]
  }

  showAddGroupModal.value = true
}

const addSessionToWeek = (weekNumber) => {
  const nextNumber = groupForm.sessions.length + 1
  groupForm.sessions.push({
    session_number: nextNumber,
    week: weekNumber,
    title: `Séance ${nextNumber}`,
    date: '',
    start_time: '09:00',
    end_time: '11:00',
    status: 'scheduled',
  })
  groupForm.total_sessions = groupForm.sessions.length
}

const removeSession = (index) => {
  groupForm.sessions.splice(index, 1)
  groupForm.sessions.forEach((session, idx) => {
    session.session_number = idx + 1
  })
  groupForm.total_sessions = groupForm.sessions.length
}

// Modifier prochain cycle - ajouter session
const addCycleSessionToWeek = (weekNumber) => {
  const nextNumber = cycleModForm.sessions.length + 1
  cycleModForm.sessions.push({
    session_number: nextNumber,
    week: weekNumber,
    title: `Séance ${nextNumber}`,
    date: '',
    start_time: cycleModForm.session_start_time || '09:00',
    end_time: cycleModForm.session_end_time || '11:00',
    status: 'scheduled',
  })
  cycleModForm.total_sessions = cycleModForm.sessions.length
}

// Modifier prochain cycle - supprimer session
const removeCycleSession = (index) => {
  cycleModForm.sessions.splice(index, 1)
  cycleModForm.sessions.forEach((session, idx) => {
    session.session_number = idx + 1
  })
  cycleModForm.total_sessions = cycleModForm.sessions.length
}

const handleAddGroup = async () => {
  try {
    const groupData = {
      course_id: course.value.id,
      ...groupForm,
    }

    // For manual calendar with sessions
    if (groupForm.calendar_type === 'manual' && groupForm.sessions.length > 0) {
      groupData.sessions = groupForm.sessions.filter((s) => s.date)
    }

    // For weekly_fixed calendar with weekly_schedule
    if (groupForm.calendar_type === 'weekly_fixed' && groupForm.weekly_schedule.length > 0) {
      groupData.weekly_schedule = groupForm.weekly_schedule
    }

    await api.createGroup(groupData)
    showAddGroupModal.value = false
    successMessage.value = t('group_created_success')
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadGroups()
  } catch (err) {
    alert(t('error') + ': ' + err.message)
  }
}
const handleDeleteGroup = async (groupId) => {
  if (!confirm(t('confirm_delete_group'))) return
  try {
    await api.deleteGroup(groupId)
    await loadGroups()
    if (selectedGroup.value?.id === groupId) {
      selectedGroup.value = null
      students.value = []
    }
    successMessage.value = t('group_deleted_success')
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (err) {
    alert(t('error') + ': ' + err.message)
  }
}

const toggleRegistration = async (groupId) => {
  try {
    await api.toggleGroupRegistration(groupId)
    await loadGroups()
  } catch (err) {
    alert('Erreur: ' + err.message)
  }
}

const selectGroup = async (group) => {
  selectedGroup.value = group
  await loadStudents(group.id)
}

// Ouvrir modal modification de cycle
const openModifyCycleModal = () => {
  if (!selectedGroup.value) return

  Object.assign(cycleModForm, {
    reason: '',
    calendar_type: 'manual',
    total_weeks: selectedGroup.value.total_weeks || 4,
    total_sessions: selectedGroup.value.total_sessions || 8,
    sessions_per_week: selectedGroup.value.sessions_per_week || 2,
    return_to_normal: true,
    sessions: [],
    day_of_week: selectedGroup.value.day_of_week || '',
    session_start_time: selectedGroup.value.session_start_time || '09:00',
    session_end_time: selectedGroup.value.session_end_time || '11:00',
    weekly_schedule: [],
  })

  initializeCycleModSessions()
  initializeCycleWeeklySchedule()
  showModifyCycleModal.value = true
}

// Sauvegarder les modifications du prochain cycle
const handleSaveNextCycle = async () => {
  try {
    if (!cycleModForm.reason.trim()) {
      alert('Veuillez indiquer la raison de la modification')
      return
    }

    if (cycleModForm.calendar_type === 'manual') {
      const sessionsWithDates = cycleModForm.sessions.filter((s) => s.date)
      if (sessionsWithDates.length === 0) {
        alert('Veuillez remplir au moins quelques dates de séances')
        return
      }
    }

    const modificationData = {
      reason: cycleModForm.reason,
      calendar_type: cycleModForm.calendar_type,
      total_weeks: cycleModForm.total_weeks,
      total_sessions: cycleModForm.total_sessions,
      sessions_per_week: cycleModForm.sessions_per_week,
      return_to_normal: cycleModForm.return_to_normal,
    }

    // Add sessions for manual calendar
    if (cycleModForm.calendar_type === 'manual') {
      modificationData.sessions = cycleModForm.sessions
    }

    // Add weekly_schedule for fixed calendar
    if (cycleModForm.calendar_type === 'weekly_fixed') {
      modificationData.weekly_schedule = cycleModForm.weekly_schedule
    }

    await api.saveNextCycleModifications(selectedGroup.value.id, modificationData)

    showModifyCycleModal.value = false
    successMessage.value = 'Modifications du prochain cycle enregistrées!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadGroups()
  } catch (err) {
    alert('Erreur: ' + err.message)
  }
}

// Appliquer le prochain cycle maintenant
const handleApplyNextCycle = async (groupId) => {
  if (!confirm('Appliquer les modifications du prochain cycle maintenant?')) return

  try {
    await api.applyNextCycle(groupId)
    successMessage.value = 'Cycle modifié appliqué avec succès!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadGroups()
    if (selectedGroup.value?.id === groupId) {
      await loadStudents(groupId)
    }
  } catch (err) {
    alert('Erreur: ' + err.message)
  }
}

// Annuler les modifications du prochain cycle
const handleCancelNextCycle = async (groupId) => {
  if (!confirm('Annuler les modifications du prochain cycle?')) return

  try {
    await api.cancelNextCycleModifications(groupId)
    successMessage.value = 'Modifications annulées'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadGroups()
  } catch (err) {
    alert('Erreur: ' + err.message)
  }
}

// Ouvrir modal configuration
const openEditConfigModal = () => {
  if (!selectedGroup.value) return

  Object.assign(configForm, {
    total_sessions: selectedGroup.value.total_sessions || 0,
    total_weeks: selectedGroup.value.total_weeks || 0,
    sessions_per_week: selectedGroup.value.sessions_per_week || 0,
    max_students: course.value.max_students_per_group || 0,
  })

  showEditConfigModal.value = true
}

// Sauvegarder la configuration
const handleSaveConfig = async () => {
  try {
    if (configForm.total_sessions || configForm.total_weeks || configForm.sessions_per_week) {
      await api.updateSessionsConfig(selectedGroup.value.id, {
        total_sessions: configForm.total_sessions,
        total_weeks: configForm.total_weeks,
        sessions_per_week: configForm.sessions_per_week,
      })
    }

    if (configForm.max_students !== course.value.max_students_per_group) {
      await api.updateMaxStudents(selectedGroup.value.id, configForm.max_students)
    }

    showEditConfigModal.value = false
    successMessage.value = 'Configuration mise à jour!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadGroups()
    await loadCourse()
  } catch (err) {
    alert('Erreur: ' + err.message)
  }
}

// Gestion des étudiants
const openAddStudentModal = async () => {
  try {
    await loadAvailableStudents()
    Object.assign(studentForm, {
      student_id: null,
      email: '',
      name: '',
      last_name: '',
      birthday: '',
      gender: 'M',
      parent_phone: '',
      create_if_not_exists: false,
    })
    showAddStudentModal.value = true
  } catch (err) {
    alert('Erreur: ' + err.message)
  }
}

const handleAddStudent = async () => {
  try {
    await api.addStudentToGroup(selectedGroup.value.id, studentForm)
    showAddStudentModal.value = false
    successMessage.value = 'Étudiant ajouté avec succès!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadStudents(selectedGroup.value.id)
    await loadGroups()
  } catch (err) {
    alert('Erreur: ' + err.message)
  }
}

const handleRemoveStudent = async (studentId) => {
  if (!confirm('Retirer cet étudiant du groupe ?')) return

  try {
    await api.removeStudentFromGroup(selectedGroup.value.id, studentId)
    successMessage.value = 'Étudiant retiré avec succès!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadStudents(selectedGroup.value.id)
    await loadGroups()
  } catch (err) {
    alert('Erreur: ' + err.message)
  }
}

// Gestion des notes
const openNoteModal = async (student) => {
  selectedStudent.value = student
  noteForm.note_text = ''
  noteForm.note_type = 'general'
  noteForm.is_important = false
  noteForm.is_private = false

  try {
    const notes = await api.getStudentNotes(selectedGroup.value.id, student.student_id)
    selectedStudentNotes.value = notes
  } catch (err) {
    console.error('Erreur chargement notes:', err)
    selectedStudentNotes.value = []
  }

  showNoteModal.value = true
}

const handleAddNote = async () => {
  if (!noteForm.note_text.trim()) {
    alert('Veuillez saisir une remarque')
    return
  }

  try {
    await api.addStudentNote(selectedGroup.value.id, selectedStudent.value.student_id, noteForm)

    const notes = await api.getStudentNotes(
      selectedGroup.value.id,
      selectedStudent.value.student_id,
    )
    selectedStudentNotes.value = notes

    noteForm.note_text = ''
    noteForm.note_type = 'general'
    noteForm.is_important = false
    noteForm.is_private = false

    await loadStudents(selectedGroup.value.id)

    successMessage.value = 'Remarque ajoutée avec succès!'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (err) {
    alert('Erreur: ' + err.message)
  }
}

const handleDeleteNote = async (noteId) => {
  if (!confirm('Supprimer cette remarque ?')) return

  try {
    await api.deleteStudentNote(selectedGroup.value.id, selectedStudent.value.student_id, noteId)

    const notes = await api.getStudentNotes(
      selectedGroup.value.id,
      selectedStudent.value.student_id,
    )
    selectedStudentNotes.value = notes

    await loadStudents(selectedGroup.value.id)

    successMessage.value = 'Remarque supprimée avec succès!'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (err) {
    alert('Erreur: ' + err.message)
  }
}

// Gestion des paiements
const openPaymentModal = (student) => {
  selectedStudent.value = student
  paymentForm.amount_paid = student.amount_paid || 0
  paymentForm.payment_status = student.payment_status || 'pending'
  showPaymentModal.value = true
}

const handleUpdatePayment = async () => {
  try {
    await api.updateStudentPayment(
      selectedGroup.value.id,
      selectedStudent.value.student_id,
      paymentForm,
    )
    showPaymentModal.value = false
    successMessage.value = 'Paiement mis à jour avec succès!'
    setTimeout(() => (successMessage.value = ''), 3000)
    await loadStudents(selectedGroup.value.id)
  } catch (err) {
    alert('Erreur: ' + err.message)
  }
}

// Formatage
const formatDayOfWeek = (day) => {
  const found = daysOfWeek.find((d) => d.value === day)
  return found ? found.label : day
}

const formatPaymentStatus = (status) => {
  return status === 'paid' ? '✅ Payé' : '❌ Non payé'
}

const getPaymentStatusClass = (status) => {
  return status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
}

// New: one-click toggle — no modal needed
const togglePayment = async (student) => {
  const newStatus = student.payment_status === 'paid' ? 'pending' : 'paid'
  try {
    await api.updateStudentPayment(selectedGroup.value.id, student.student_id, {
      payment_status: newStatus,
    })
    student.payment_status = newStatus // instant update without reload
  } catch (err) {
    alert('Erreur: ' + err.message)
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div v-if="loading" class="text-center py-12">
    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p :class="darkMode ? 'text-white' : 'text-gray-700'" class="mt-4 font-semibold">
      {{ t('loading') }}
    </p>
  </div>

  <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
    <p class="font-semibold">❌ {{ t('error') }}: {{ error }}</p>
  </div>

  <div v-else>
    <!-- Message de succès -->
    <div
      v-if="successMessage"
      class="fixed top-4 right-4 z-50 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-pulse"
    >
      <CheckCircle :size="20" />
      {{ successMessage }}
    </div>

    <!-- En-tête -->
    <div :class="darkMode ? 'bg-gray-800' : 'bg-white'" class="rounded-2xl shadow-xl p-6 mb-8">
      <button
        @click="router.back()"
        :class="darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'"
        class="flex items-center gap-2 mb-4 font-semibold transition-colors"
      >
        <ArrowLeft :size="20" />
        {{ t('back') }}
      </button>

      <div class="flex items-start justify-between">
        <div>
          <h1 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-3xl font-bold mb-2">
            {{ course.title }}
          </h1>
          <div
            class="flex flex-wrap gap-4 text-sm"
            :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
          >
            <span class="flex items-center gap-1">
              <Users :size="16" />
              {{ course.teacher_gender === 'M' ? 'Mr.' : 'Mme.' }} {{ course.teacher_name }}
              {{ course.teacher_last_name }}
            </span>
            <span class="flex items-center gap-1">
              <MapPin :size="16" />
              {{ course.salle || 'Salle non définie' }}
            </span>
            <span class="flex items-center gap-1">
              <Calendar :size="16" />
              {{ course.course_type === 'continuous' ? 'Cours continu' : 'Session unique' }}
            </span>
          </div>
        </div>

        <button
          v-if="isAdmin"
          @click="openAddGroupModal"
          class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
        >
          <Plus :size="20" />
          {{ t('new_group') }}
        </button>
      </div>
    </div>

    <!-- Liste des groupes -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Colonne groupes -->
      <div class="lg:col-span-1 space-y-4">
        <h2 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-xl font-bold mb-4">
          {{ t('groups_label') }} ({{ groups.length }})
        </h2>

        <div
          v-for="group in groups"
          :key="group.id"
          @click="selectGroup(group)"
          :class="[
            darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50',
            selectedGroup?.id === group.id ? 'ring-2 ring-blue-500' : '',
            'rounded-xl shadow-lg p-4 cursor-pointer transition-all relative',
          ]"
        >
          <!-- Badge si modifications en attente -->
          <div
            v-if="group.has_next_cycle_modifications"
            class="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-pulse"
          >
            <Zap :size="12" />
            {{ t('mod_pending') }}
          </div>

          <div class="flex items-start justify-between mb-3">
            <h3 :class="darkMode ? 'text-white' : 'text-gray-900'" class="font-bold text-lg pr-24">
              {{ group.group_name }}
            </h3>

            <div class="flex items-center gap-2">
              <span
                :class="
                  group.registration_open
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                "
                class="text-xs font-bold px-2 py-1 rounded-full"
              >
                {{ group.registration_open ? 'Ouvert' : 'Fermé' }}
              </span>
            </div>
          </div>

          <div class="space-y-2 text-sm" :class="darkMode ? 'text-gray-400' : 'text-gray-600'">
            <div v-if="course.course_type === 'one_time'" class="flex items-center gap-2">
              <Calendar :size="16" />
              {{ new Date(group.start_date).toLocaleDateString('fr-FR') }}
              {{ group.start_time }} - {{ group.end_time }}
            </div>

            <div v-else class="space-y-1">
              <div class="flex items-center gap-2">
                <Calendar :size="16" />
                <span class="font-semibold">
                  {{ group.total_sessions || '?' }} {{ t('session') }}
                </span>
                {{ t('out_of') }} {{ group.total_weeks || '?' }} {{ t('week') }}
              </div>

              <div v-if="group.sessions_per_week" class="flex items-center gap-2 text-xs">
                <Clock :size="14" />
                {{ group.sessions_per_week }} {{ t('sessions_per_week_short') }}
              </div>

              <div v-if="group.day_of_week" class="flex items-center gap-2 text-xs">
                <Clock :size="14" />
                {{ formatDayOfWeek(group.day_of_week) }}
                {{ group.session_start_time }} - {{ group.session_end_time }}
              </div>
              <div v-else class="flex items-center gap-2 text-xs italic">
                <Clock :size="14" />
                {{ t('custom_calendar') }}
              </div>
            </div>

            <div class="flex items-center gap-2">
              <Users :size="16" />
              {{ group.enrolled_students }} / {{ course.max_students_per_group }}
              {{ t('bento_students') }}
            </div>

            <div v-if="group.salle" class="flex items-center gap-2">
              <MapPin :size="16" />
              {{ group.salle }}
            </div>
          </div>

          <!-- Boutons de gestion de cycle -->
          <div
            v-if="isAdmin || isTeacher"
            class="mt-3 pt-3 border-t space-y-2"
            :class="darkMode ? 'border-gray-700' : 'border-gray-200'"
          >
            <!-- Bouton modifier prochain cycle (seulement pour cours continus) -->
            <button
              v-if="selectedGroup?.id === group.id && course.course_type === 'continuous'"
              @click.stop="openModifyCycleModal"
              :class="
                darkMode ? 'bg-orange-800 hover:bg-orange-700' : 'bg-orange-100 hover:bg-orange-200'
              "
              class="w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 text-orange-800 dark:text-orange-200"
            >
              <CalendarPlus :size="14" />
              {{ t('modify_next_cycle') }}
            </button>

            <!-- Si modifications en attente -->
            <div v-if="group.has_next_cycle_modifications" class="space-y-1">
              <div class="text-xs text-orange-600 dark:text-orange-400 font-semibold px-2">
                {{ group.next_cycle_reason || 'Modifications planifiées' }}
              </div>
              <div class="flex gap-1">
                <button
                  @click.stop="handleApplyNextCycle(group.id)"
                  class="flex-1 py-1 px-2 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700"
                >
                  Appliquer maintenant
                </button>
                <button
                  @click.stop="handleCancelNextCycle(group.id)"
                  class="flex-1 py-1 px-2 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
                >
                  Annuler
                </button>
              </div>
            </div>

            <!-- Bouton config (seulement pour cours continus) -->
            <button
              v-if="
                selectedGroup?.id === group.id && isAdmin && course.course_type === 'continuous'
              "
              @click.stop="openEditConfigModal"
              :class="darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'"
              class="w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
            >
              <Settings :size="14" />
              Configuration
            </button>

            <!-- Boutons existants -->
            <div class="flex gap-2">
              <button
                v-if="isAdmin"
                @click.stop="toggleRegistration(group.id)"
                :class="
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                "
                class="flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <component :is="group.registration_open ? DoorClosed : DoorOpen" :size="14" />
                {{ group.registration_open ? 'Fermer' : 'Ouvrir' }}
              </button>

              <button
                v-if="isAdmin"
                @click.stop="handleDeleteGroup(group.id)"
                class="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="groups.length === 0"
          :class="darkMode ? 'bg-gray-800' : 'bg-white'"
          class="rounded-xl shadow-lg p-8 text-center"
        >
          <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'">
            Aucun groupe créé pour ce cours
          </p>
        </div>
      </div>

      <!-- Colonne étudiants -->
      <div class="lg:col-span-2">
        <div
          v-if="!selectedGroup"
          :class="darkMode ? 'bg-gray-800' : 'bg-white'"
          class="rounded-xl shadow-lg p-12 text-center"
        >
          <Users
            :size="64"
            :class="darkMode ? 'text-gray-600' : 'text-gray-300'"
            class="mx-auto mb-4"
          />
          <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-lg">
            Sélectionnez un groupe pour voir les étudiants
          </p>
        </div>

        <div v-else :class="darkMode ? 'bg-gray-800' : 'bg-white'" class="rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-xl font-bold">
              Étudiants ({{ students.length }})
            </h2>

            <button
              v-if="isAdmin || isTeacher"
              @click="openAddStudentModal"
              class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <UserPlus :size="18" />
              Ajouter étudiant
            </button>
          </div>

          <!-- Table des étudiants -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr :class="darkMode ? 'bg-gray-700' : 'bg-gray-50'">
                  <th
                    class="px-4 py-3 text-left text-xs font-semibold"
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  >
                    {{ t('name') }}
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-semibold"
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  >
                    {{ t('parent_phone') }}
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-semibold"
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  >
                    {{ t('payment') }}
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-semibold"
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  >
                    {{ t('status') }}
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-semibold"
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  >
                    {{ t('notes') }}
                  </th>
                  <th
                    class="px-4 py-3 text-right text-xs font-semibold"
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  >
                    {{ t('actions') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="student in students"
                  :key="student.id"
                  :class="
                    darkMode
                      ? 'border-gray-700 hover:bg-gray-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  "
                  class="border-b transition-colors"
                >
                  <td class="px-4 py-3">
                    <div :class="darkMode ? 'text-white' : 'text-gray-900'" class="font-semibold">
                      {{ student.name }} {{ student.last_name }}
                    </div>
                    <div :class="darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-xs">
                      {{ student.email }}
                    </div>
                  </td>
                  <td class="px-4 py-3" :class="darkMode ? 'text-gray-300' : 'text-gray-700'">
                    {{ student.parent_phone || 'Non renseigné' }}
                  </td>
                  <td class="px-4 py-3">
                    <button
                      v-if="isAdmin || isTeacher"
                      @click="togglePayment(student)"
                      :class="getPaymentStatusClass(student.payment_status)"
                      class="px-3 py-1 rounded-full text-xs font-bold hover:opacity-75 transition-opacity cursor-pointer"
                      :title="
                        student.payment_status === 'paid'
                          ? t('click_to_mark_unpaid')
                          : t('click_to_mark_paid')
                      "
                    >
                      {{ formatPaymentStatus(student.payment_status) }}
                    </button>
                    <span
                      v-else
                      :class="getPaymentStatusClass(student.payment_status)"
                      class="px-3 py-1 rounded-full text-xs font-bold inline-block"
                    >
                      {{ formatPaymentStatus(student.payment_status) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span
                      :class="{
                        'bg-green-100 text-green-800': student.status === 'active',
                        'bg-yellow-100 text-yellow-800': student.status === 'pending',
                        'bg-red-100 text-red-800': student.status === 'inactive',
                      }"
                      class="px-2 py-1 rounded-full text-xs font-semibold"
                    >
                      {{ student.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <button
                      @click="openNoteModal(student)"
                      :class="
                        student.notes_count > 0
                          ? 'text-blue-600 hover:text-blue-800'
                          : darkMode
                            ? 'text-gray-400 hover:text-gray-300'
                            : 'text-gray-500 hover:text-gray-700'
                      "
                      class="flex items-center gap-1 text-sm font-semibold"
                    >
                      <StickyNote :size="14" />
                      {{ student.notes_count || 0 }}
                    </button>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button
                      v-if="isAdmin || isTeacher"
                      @click="handleRemoveStudent(student.student_id)"
                      class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 :size="16" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              v-if="students.length === 0"
              class="text-center py-8"
              :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
            >
              {{ t('no_student_in_group') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Ajouter Groupe -->
    <Teleport to="body">
      <div
        v-if="showAddGroupModal"
        @click="showAddGroupModal = false"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      >
        <div
          @click.stop
          :class="darkMode ? 'bg-gray-800' : 'bg-white'"
          class="rounded-2xl shadow-2xl w-full max-w-5xl p-6 my-8 max-h-[90vh] overflow-y-auto"
        >
          <div class="flex justify-between items-center mb-6 sticky top-0 bg-inherit z-10 pb-4">
            <h3 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-2xl font-bold">
              {{ t('new_group') }}
            </h3>
            <button @click="showAddGroupModal = false" class="p-2">
              <X :size="24" />
            </button>
          </div>

          <form @submit.prevent="handleAddGroup" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-sm font-medium mb-2"
                  :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                >
                  {{ t('group_name_label_full') }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="groupForm.group_name"
                  type="text"
                  required
                  placeholder="Ex: Groupe A"
                  :class="
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200'
                  "
                  class="w-full px-4 py-3 border-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  class="block text-sm font-medium mb-2"
                  :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                >
                  {{ t('room') }}
                </label>
                <input
                  v-model="groupForm.salle"
                  type="text"
                  placeholder="Ex: Salle A"
                  :class="
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200'
                  "
                  class="w-full px-4 py-3 border-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <!-- Pour cours unique - VERSION SIMPLE -->
            <div v-if="course.course_type === 'one_time'" class="space-y-4">
              <div
                class="border-2 rounded-xl p-4"
                :class="darkMode ? 'border-gray-700' : 'border-gray-200'"
              >
                <h4 :class="darkMode ? 'text-white' : 'text-gray-900'" class="font-bold mb-3">
                  {{ t('session_schedule') }}
                </h4>

                <div
                  class="grid grid-cols-12 gap-3 items-end p-3 rounded-lg"
                  :class="darkMode ? 'bg-gray-700/50' : 'bg-gray-50'"
                >
                  <div class="col-span-5">
                    <label
                      class="block text-sm font-medium mb-2"
                      :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                    >
                      {{ t('day_of_week') }}<span class="text-red-500">*</span>
                    </label>
                    <select
                      v-model="groupForm.weekly_schedule[0].day_of_week"
                      required
                      :class="
                        darkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-200'
                      "
                      class="w-full px-4 py-3 border-2 rounded-xl outline-none"
                    >
                      <option value="">Choisir...</option>
                      <option v-for="day in daysOfWeek" :key="day.value" :value="day.value">
                        {{ day.label }}
                      </option>
                    </select>
                  </div>

                  <div class="col-span-3">
                    <label
                      class="block text-sm font-medium mb-2"
                      :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                    >
                      {{ t('day_of_week') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="groupForm.weekly_schedule[0].start_time"
                      type="time"
                      required
                      :class="
                        darkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-200'
                      "
                      class="w-full px-4 py-3 border-2 rounded-xl outline-none"
                    />
                  </div>

                  <div class="col-span-4">
                    <label
                      class="block text-sm font-medium mb-2"
                      :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                    >
                      Heure fin <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="groupForm.weekly_schedule[0].end_time"
                      type="time"
                      required
                      :class="
                        darkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-200'
                      "
                      class="w-full px-4 py-3 border-2 rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Pour cours continu - VERSION COMPLÈTE -->
            <div v-else class="space-y-4">
              <div>
                <label
                  class="block text-sm font-medium mb-2"
                  :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                >
                  {{ t('calendar_type') }}
                </label>
                <select
                  v-model="groupForm.calendar_type"
                  :class="
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200'
                  "
                  class="w-full px-4 py-3 border-2 rounded-xl outline-none"
                  @change="initializeManualSessions"
                >
                  <option value="manual">Calendrier manuel flexible</option>
                  <option value="weekly_fixed">Jour fixe chaque semaine</option>
                </select>
              </div>

              <!-- Calendrier manuel flexible -->
              <div v-if="groupForm.calendar_type === 'manual'" class="space-y-4">
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label
                      class="block text-sm font-medium mb-2"
                      :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                    >
                      {{ t('number_of_weeks') }}
                    </label>
                    <select
                      v-model.number="groupForm.total_weeks"
                      :class="
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-50 border-gray-200'
                      "
                      class="w-full px-4 py-3 border-2 rounded-xl outline-none"
                      @change="initializeManualSessions"
                    >
                      <option :value="4">{{ t('four_weeks') }}</option>
                      <option :value="6">{{ t('six_weeks') }}</option>
                      <option :value="8">8 semaines</option>
                      <option :value="10">10 semaines</option>
                      <option :value="12">12 semaines</option>
                    </select>
                  </div>

                  <div>
                    <label
                      class="block text-sm font-medium mb-2"
                      :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                    >
                      {{ t('sessions_per_week') }}
                    </label>
                    <select
                      v-model.number="groupForm.sessions_per_week"
                      :class="
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-50 border-gray-200'
                      "
                      class="w-full px-4 py-3 border-2 rounded-xl outline-none"
                      @change="initializeManualSessions"
                    >
                      <option :value="1">1 séance/semaine</option>
                      <option :value="2">2 séances/semaine</option>
                      <option :value="3">3 séances/semaine</option>
                      <option :value="4">4 séances/semaine</option>
                    </select>
                  </div>

                  <div>
                    <label
                      class="block text-sm font-medium mb-2"
                      :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                    >
                      {{ t('total_sessions') }}
                    </label>
                    <input
                      :value="groupForm.total_sessions"
                      type="number"
                      readonly
                      :class="
                        darkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                      "
                      class="w-full px-4 py-3 border-2 rounded-xl outline-none font-bold"
                    />
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    v-model="groupForm.repeat_calendar"
                    class="w-5 h-5"
                    id="repeat-calendar"
                  />
                  <label
                    for="repeat-calendar"
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                    class="cursor-pointer"
                  >
                    {{ t('repeat_calendar') }}
                  </label>
                </div>

                <!-- Sessions manuelles -->
                <div
                  class="border-2 rounded-xl p-4"
                  :class="darkMode ? 'border-gray-700' : 'border-gray-200'"
                >
                  <div class="flex items-center justify-between mb-4">
                    <h4 :class="darkMode ? 'text-white' : 'text-gray-900'" class="font-bold">
                      {{ t('plan_sessions') }} {{ groupForm.total_sessions }} séances
                    </h4>
                    <span class="text-sm" :class="darkMode ? 'text-gray-400' : 'text-gray-600'">
                      {{ groupForm.sessions.filter((s) => s.date).length }} /
                      {{ groupForm.total_sessions }} {{ t('completed') }}
                    </span>
                  </div>

                  <div class="space-y-4 max-h-96 overflow-y-auto">
                    <div v-for="week in groupForm.total_weeks" :key="week" class="space-y-2">
                      <div
                        class="flex items-center justify-between px-2 py-1 rounded"
                        :class="darkMode ? 'bg-gray-700' : 'bg-gray-100'"
                      >
                        <h5
                          class="font-bold text-sm"
                          :class="darkMode ? 'text-white' : 'text-gray-900'"
                        >
                          📅 {{ t('week') }}{{ week }}
                        </h5>
                        <button
                          type="button"
                          @click="addSessionToWeek(week)"
                          class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          +{{ t('add_session') }}
                        </button>
                      </div>

                      <div
                        v-for="(session, index) in groupForm.sessions.filter(
                          (s) => s.week === week,
                        )"
                        :key="index"
                        class="grid grid-cols-12 gap-2 items-end p-2 rounded-lg"
                        :class="darkMode ? 'bg-gray-700/50' : 'bg-gray-50'"
                      >
                        <div class="col-span-1">
                          <div
                            class="text-center font-bold text-lg"
                            :class="darkMode ? 'text-blue-400' : 'text-blue-600'"
                          >
                            #{{ session.session_number }}
                          </div>
                        </div>

                        <div class="col-span-3">
                          <label
                            class="block text-xs mb-1"
                            :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                          >
                            {{ t('title') || 'Titre' }}
                          </label>
                          <input
                            v-model="session.title"
                            type="text"
                            placeholder="Titre de la séance"
                            :class="
                              darkMode
                                ? 'bg-gray-800 border-gray-600 text-white'
                                : 'bg-white border-gray-200'
                            "
                            class="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>

                        <div class="col-span-3">
                          <label
                            class="block text-xs mb-1"
                            :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                          >
                            Date
                          </label>
                          <input
                            v-model="session.date"
                            type="date"
                            :class="
                              darkMode
                                ? 'bg-gray-800 border-gray-600 text-white'
                                : 'bg-white border-gray-200'
                            "
                            class="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>

                        <div class="col-span-2">
                          <label
                            class="block text-xs mb-1"
                            :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                          >
                            {{ t('start_time') }}
                          </label>
                          <input
                            v-model="session.start_time"
                            type="time"
                            :class="
                              darkMode
                                ? 'bg-gray-800 border-gray-600 text-white'
                                : 'bg-white border-gray-200'
                            "
                            class="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>

                        <div class="col-span-2">
                          <label
                            class="block text-xs mb-1"
                            :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                          >
                            {{ t('end_time') }}
                          </label>
                          <input
                            v-model="session.end_time"
                            type="time"
                            :class="
                              darkMode
                                ? 'bg-gray-800 border-gray-600 text-white'
                                : 'bg-white border-gray-200'
                            "
                            class="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>

                        <div class="col-span-1 flex items-end">
                          <button
                            type="button"
                            @click="removeSession(groupForm.sessions.indexOf(session))"
                            class="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 :size="16" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    class="mt-4 p-3 rounded-lg"
                    :class="darkMode ? 'bg-blue-900/20' : 'bg-blue-50'"
                  >
                    <p class="text-sm" :class="darkMode ? 'text-blue-300' : 'text-blue-800'">
                      💡 <strong>{{ t('tip') }}:</strong> {{ t('sessions_without_date_tip') }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Calendrier fixe hebdomadaire -->
              <div v-else class="space-y-4">
                <div>
                  <label
                    class="block text-sm font-medium mb-2"
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  >
                    {{ t('sessions_per_week') }}<span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model.number="groupForm.sessions_per_week"
                    required
                    :class="
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200'
                    "
                    class="w-full px-4 py-3 border-2 rounded-xl outline-none"
                    @change="initializeWeeklySchedule"
                  >
                    <option :value="1">1 séance/semaine</option>
                    <option :value="2">2 séances/semaine</option>
                    <option :value="3">3 séances/semaine</option>
                    <option :value="4">4 séances/semaine</option>
                  </select>
                </div>

                <!-- Table des séances hebdomadaires -->
                <div
                  class="border-2 rounded-xl p-4"
                  :class="darkMode ? 'border-gray-700' : 'border-gray-200'"
                >
                  <h4 :class="darkMode ? 'text-white' : 'text-gray-900'" class="font-bold mb-3">
                    {{ t('schedules_of') }}{{ groupForm.sessions_per_week }} séance(s) par semaine
                  </h4>

                  <div class="space-y-3">
                    <div
                      v-for="(schedule, index) in groupForm.weekly_schedule"
                      :key="index"
                      class="grid grid-cols-12 gap-3 items-end p-3 rounded-lg"
                      :class="darkMode ? 'bg-gray-700/50' : 'bg-gray-50'"
                    >
                      <div class="col-span-1">
                        <div
                          class="text-center font-bold text-lg"
                          :class="darkMode ? 'text-blue-400' : 'text-blue-600'"
                        >
                          #{{ schedule.session_in_week }}
                        </div>
                      </div>

                      <div class="col-span-5">
                        <label
                          class="block text-xs mb-1"
                          :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                        >
                          {{ t('day_of_week') }} <span class="text-red-500">*</span>
                        </label>
                        <select
                          v-model="schedule.day_of_week"
                          required
                          :class="
                            darkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-200'
                          "
                          class="w-full px-3 py-2 border rounded-lg text-sm"
                        >
                          <option value="">
                            {{ t('select_child_to_view_courses').replace(/ .*/, '...') }}
                          </option>
                          <option v-for="day in daysOfWeek" :key="day.value" :value="day.value">
                            {{ day.label }}
                          </option>
                        </select>
                      </div>

                      <div class="col-span-3">
                        <label
                          class="block text-xs mb-1"
                          :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                        >
                          {{ t('start_time') }} <span class="text-red-500">*</span>
                        </label>
                        <input
                          v-model="schedule.start_time"
                          type="time"
                          required
                          :class="
                            darkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-200'
                          "
                          class="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>

                      <div class="col-span-3">
                        <label
                          class="block text-xs mb-1"
                          :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                        >
                          {{ t('end_time') }} <span class="text-red-500">*</span>
                        </label>
                        <input
                          v-model="schedule.end_time"
                          type="time"
                          required
                          :class="
                            darkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-200'
                          "
                          class="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    class="mt-4 p-3 rounded-lg"
                    :class="darkMode ? 'bg-blue-900/20' : 'bg-blue-50'"
                  >
                    <p class="text-sm" :class="darkMode ? 'text-blue-300' : 'text-blue-800'">
                      💡 <strong>{{ t('example') }}</strong> Pour 2 séances/semaine → Séance #1:
                      Lundi 09:00-11:00, Séance #2: Mercredi 14:00-16:00
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-4 pt-4">
              <button
                type="submit"
                class="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Save :size="20" />
                {{ t('create_group') }}
              </button>

              <button
                type="button"
                @click="showAddGroupModal = false"
                :class="
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                "
                class="px-8 py-3 rounded-xl font-semibold transition-all"
              >
                {{ t('cancel') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal Modifier Prochain Cycle -->
    <Teleport to="body">
      <div
        v-if="showModifyCycleModal"
        @click="showModifyCycleModal = false"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      >
        <div
          @click.stop
          :class="darkMode ? 'bg-gray-800' : 'bg-white'"
          class="rounded-2xl shadow-2xl w-full max-w-5xl p-6 my-8 max-h-[90vh] overflow-y-auto"
        >
          <div class="flex justify-between items-center mb-6">
            <div>
              <h3
                :class="darkMode ? 'text-white' : 'text-gray-900'"
                class="text-2xl font-bold flex items-center gap-2"
              >
                <CalendarPlus :size="28" class="text-orange-500" />
                {{ t('modify_next_cycle') }}
              </h3>
              <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm mt-1">
                {{ selectedGroup?.group_name }}
              </p>
            </div>
            <button @click="showModifyCycleModal = false" class="p-2">
              <X :size="24" />
            </button>
          </div>

          <div
            class="mb-6 p-4 rounded-lg border"
            :class="
              darkMode ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'
            "
          >
            <div class="flex items-start gap-3">
              <Info :size="20" class="text-orange-600 flex-shrink-0 mt-0.5" />
              <div class="text-sm" :class="darkMode ? 'text-orange-300' : 'text-orange-800'">
                <p class="font-semibold mb-1">Comment ça marche?</p>
                <ul class="list-disc list-inside space-y-1">
                  <li>
                    Planifiez un calendrier spécial pour le prochain cycle (exemple: révisions,
                    Ramadan)
                  </li>
                  <li>Les modifications seront appliquées au début du prochain cycle</li>
                  <li>
                    Choisissez si vous voulez retourner au cycle normal après ou garder ces
                    modifications
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSaveNextCycle" class="space-y-4">
            <div>
              <label
                class="block text-sm font-medium mb-2"
                :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
              >
                {{ t('reason_for_modification') }}<span class="text-red-500">*</span>
              </label>
              <input
                v-model="cycleModForm.reason"
                type="text"
                required
                placeholder="Ex: Révisions BAC, Ramadan 2026..."
                :class="
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                "
                class="w-full px-4 py-3 border-2 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium mb-2"
                :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
              >
                {{ t('calendar_type') }}
              </label>
              <select
                v-model="cycleModForm.calendar_type"
                :class="
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                "
                class="w-full px-4 py-3 border-2 rounded-xl outline-none"
                @change="initializeCycleModSessions"
              >
                <option value="manual">Calendrier manuel flexible</option>
                <option value="weekly_fixed">Jour fixe chaque semaine</option>
              </select>
            </div>

            <!-- Calendrier manuel flexible -->
            <div v-if="cycleModForm.calendar_type === 'manual'" class="space-y-4">
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label
                    class="block text-sm font-medium mb-2"
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  >
                    {{ t('week') }}s
                  </label>
                  <select
                    v-model.number="cycleModForm.total_weeks"
                    :class="
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200'
                    "
                    class="w-full px-4 py-3 border-2 rounded-xl outline-none"
                    @change="initializeCycleModSessions"
                  >
                    <option :value="4">4 {{ t('week') }}s</option>
                    <option :value="6">6 {{ t('week') }}s</option>
                    <option :value="8">8 {{ t('week') }}s</option>
                    <option :value="10">10 {{ t('week') }}s</option>
                  </select>
                </div>

                <div>
                  <label
                    class="block text-sm font-medium mb-2"
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  >
                    {{ t('sessions_per_week') }}
                  </label>
                  <select
                    v-model.number="cycleModForm.sessions_per_week"
                    :class="
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200'
                    "
                    class="w-full px-4 py-3 border-2 rounded-xl outline-none"
                    @change="initializeCycleModSessions"
                  >
                    <option :value="1">1 {{ t('session') }}</option>
                    <option :value="2">2 {{ t('session') }}s</option>
                    <option :value="3">3 {{ t('session') }}s</option>
                    <option :value="4">4 {{ t('session') }}s</option>
                  </select>
                </div>

                <div>
                  <label
                    class="block text-sm font-medium mb-2"
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  >
                    {{ t('total_sessions') }}
                  </label>
                  <input
                    :value="cycleModForm.total_sessions"
                    type="number"
                    readonly
                    :class="
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-gray-100 border-gray-200 text-gray-700'
                    "
                    class="w-full px-4 py-3 border-2 rounded-xl outline-none font-bold"
                  />
                </div>
              </div>

              <!-- Sessions manuelles -->
              <div
                class="border-2 rounded-xl p-4"
                :class="darkMode ? 'border-orange-700' : 'border-orange-200'"
              >
                <h4 :class="darkMode ? 'text-white' : 'text-gray-900'" class="font-bold mb-4">
                  Séances du cycle modifié
                </h4>

                <div class="space-y-3 max-h-96 overflow-y-auto">
                  <div v-for="week in cycleModForm.total_weeks" :key="week">
                    <div
                      class="flex items-center justify-between px-2 py-1 rounded mb-2"
                      :class="darkMode ? 'bg-orange-900/30' : 'bg-orange-100'"
                    >
                      <h5
                        class="font-semibold text-sm"
                        :class="darkMode ? 'text-orange-300' : 'text-orange-700'"
                      >
                        {{ t('week') }}
                      </h5>
                      <button
                        type="button"
                        @click="addCycleSessionToWeek(week)"
                        class="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                      >
                        +{{ t('add_session') }}
                      </button>
                    </div>
                    <div
                      v-for="(session, index) in cycleModForm.sessions.filter(
                        (s) => s.week === week,
                      )"
                      :key="index"
                      class="grid grid-cols-12 gap-2 items-end p-2 rounded-lg mb-2"
                      :class="darkMode ? 'bg-gray-700/50' : 'bg-gray-50'"
                    >
                      <div class="col-span-1">
                        <div
                          class="text-center font-bold"
                          :class="darkMode ? 'text-orange-400' : 'text-orange-600'"
                        >
                          #{{ session.session_number }}
                        </div>
                      </div>

                      <div class="col-span-3">
                        <input
                          v-model="session.title"
                          type="text"
                          placeholder="Titre"
                          :class="
                            darkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-200'
                          "
                          class="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>

                      <div class="col-span-3">
                        <input
                          v-model="session.date"
                          type="date"
                          :class="
                            darkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-200'
                          "
                          class="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>

                      <div class="col-span-2">
                        <input
                          v-model="session.start_time"
                          type="time"
                          :class="
                            darkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-200'
                          "
                          class="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>

                      <div class="col-span-2">
                        <input
                          v-model="session.end_time"
                          type="time"
                          :class="
                            darkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-200'
                          "
                          class="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>

                      <div class="col-span-1 flex items-center">
                        <button
                          type="button"
                          @click="removeCycleSession(cycleModForm.sessions.indexOf(session))"
                          class="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 :size="16" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Calendrier fixe hebdomadaire -->
            <div v-else class="space-y-4">
              <div>
                <label
                  class="block text-sm font-medium mb-2"
                  :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                >
                  {{ t('sessions_per_week') }} <span class="text-red-500">*</span>
                </label>
                <select
                  v-model.number="cycleModForm.sessions_per_week"
                  required
                  :class="
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200'
                  "
                  class="w-full px-4 py-3 border-2 rounded-xl outline-none"
                  @change="initializeCycleWeeklySchedule"
                >
                  <option :value="1">1 {{ t('session') }}/{{ t('week') }}</option>
                  <option :value="2">2 {{ t('session') }}/{{ t('week') }}</option>
                  <option :value="3">3 {{ t('session') }}/{{ t('week') }}</option>
                  <option :value="4">4 {{ t('session') }}/{{ t('week') }}</option>
                </select>
              </div>

              <!-- Table des séances hebdomadaires -->
              <div
                class="border-2 rounded-xl p-4"
                :class="darkMode ? 'border-orange-700' : 'border-orange-200'"
              >
                <h4 :class="darkMode ? 'text-white' : 'text-gray-900'" class="font-bold mb-3">
                  {{ t('schedules_of') }} {{ cycleModForm.sessions_per_week }} séance(s) par semaine
                </h4>

                <div class="space-y-3">
                  <div
                    v-for="(schedule, index) in cycleModForm.weekly_schedule"
                    :key="index"
                    class="grid grid-cols-12 gap-3 items-end p-3 rounded-lg"
                    :class="darkMode ? 'bg-gray-700/50' : 'bg-gray-50'"
                  >
                    <div class="col-span-1">
                      <div
                        class="text-center font-bold text-lg"
                        :class="darkMode ? 'text-orange-400' : 'text-orange-600'"
                      >
                        #{{ schedule.session_in_week }}
                      </div>
                    </div>

                    <div class="col-span-5">
                      <label
                        class="block text-xs mb-1"
                        :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                      >
                        {{ t('day_of_week') }} <span class="text-red-500">*</span>
                      </label>
                      <select
                        v-model="schedule.day_of_week"
                        required
                        :class="
                          darkMode
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-200'
                        "
                        class="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="">
                          {{ t('select_child_to_view_courses').replace(/ .*/, '...') }}
                        </option>
                        <option v-for="day in daysOfWeek" :key="day.value" :value="day.value">
                          {{ day.label }}
                        </option>
                      </select>
                    </div>

                    <div class="col-span-3">
                      <label
                        class="block text-xs mb-1"
                        :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                      >
                        {{ t('start_time') }}<span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="schedule.start_time"
                        type="time"
                        required
                        :class="
                          darkMode
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-200'
                        "
                        class="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>

                    <div class="col-span-3">
                      <label
                        class="block text-xs mb-1"
                        :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                      >
                        {{ t('end_time') }}<span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="schedule.end_time"
                        type="time"
                        required
                        :class="
                          darkMode
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-200'
                        "
                        class="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div
                  class="mt-4 p-3 rounded-lg"
                  :class="darkMode ? 'bg-orange-900/20' : 'bg-orange-100'"
                >
                  <p class="text-sm" :class="darkMode ? 'text-orange-300' : 'text-orange-800'">
                    💡 <strong>{{ t('example') }}:</strong> Pour 3 séances/semaine → #1: Lundi
                    09:00-11:00, #2: Mercredi 14:00-16:00, #3: Vendredi 16:00-18:00
                  </p>
                </div>
              </div>
            </div>

            <div
              class="flex items-center gap-2 p-4 rounded-lg"
              :class="darkMode ? 'bg-orange-900/20' : 'bg-orange-100'"
            >
              <input
                type="checkbox"
                v-model="cycleModForm.return_to_normal"
                class="w-5 h-5"
                id="return-to-normal"
              />
              <label
                for="return-to-normal"
                :class="darkMode ? 'text-orange-300' : 'text-orange-700'"
                class="cursor-pointer font-semibold"
              >
                {{ t('return_to_normal_cycle') }}
              </label>
            </div>

            <div class="flex gap-4 pt-4">
              <button
                type="submit"
                class="flex-1 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-red-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Save :size="20" />
                {{ t('save_modifications') }}
              </button>

              <button
                type="button"
                @click="showModifyCycleModal = false"
                :class="
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                "
                class="px-8 py-3 rounded-xl font-semibold transition-all"
              >
                {{ t('cancel') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal Configuration -->
    <Teleport to="body">
      <div
        v-if="showEditConfigModal"
        @click="showEditConfigModal = false"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <div
          @click.stop
          :class="darkMode ? 'bg-gray-800' : 'bg-white'"
          class="rounded-2xl shadow-2xl w-full max-w-md p-6"
        >
          <div class="flex justify-between items-center mb-6">
            <h3
              :class="darkMode ? 'text-white' : 'text-gray-900'"
              class="text-2xl font-bold flex items-center gap-2"
            >
              <Settings :size="24" />
              {{ t('configuration') }}
            </h3>
            <button @click="showEditConfigModal = false" class="p-2">
              <X :size="24" />
            </button>
          </div>

          <form @submit.prevent="handleSaveConfig" class="space-y-4">
            <div>
              <label
                class="block text-sm font-medium mb-2"
                :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
              >
                {{ t('total_sessions') }}
              </label>
              <input
                v-model.number="configForm.total_sessions"
                type="number"
                min="1"
                :class="
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                "
                class="w-full px-4 py-3 border-2 rounded-xl outline-none"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium mb-2"
                :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
              >
                {{ t('number_of_weeks') }}
              </label>
              <input
                v-model.number="configForm.total_weeks"
                type="number"
                min="1"
                :class="
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                "
                class="w-full px-4 py-3 border-2 rounded-xl outline-none"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium mb-2"
                :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
              >
                {{ t('sessions_per_week') }}
              </label>
              <input
                v-model.number="configForm.sessions_per_week"
                type="number"
                min="1"
                :class="
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                "
                class="w-full px-4 py-3 border-2 rounded-xl outline-none"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium mb-2"
                :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
              >
                {{ t('max_students') }}
              </label>
              <input
                v-model.number="configForm.max_students"
                type="number"
                min="1"
                :class="
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                "
                class="w-full px-4 py-3 border-2 rounded-xl outline-none"
              />
              <p class="text-xs mt-1" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
                {{ t('currently') }}: {{ selectedGroup?.enrolled_students || 0 }} étudiants inscrits
              </p>
            </div>

            <div class="flex gap-4 pt-4">
              <button
                type="submit"
                class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
              >
                {{ t('save') }}
              </button>

              <button
                type="button"
                @click="showEditConfigModal = false"
                :class="
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                "
                class="px-8 py-3 rounded-xl font-semibold transition-all"
              >
                {{ t('cancel') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal Ajouter Étudiant -->
    <Teleport to="body">
      <div
        v-if="showAddStudentModal"
        @click="showAddStudentModal = false"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <div
          @click.stop
          :class="darkMode ? 'bg-gray-800' : 'bg-white'"
          class="rounded-2xl shadow-2xl w-full max-w-2xl p-6"
        >
          <div class="flex justify-between items-center mb-6">
            <h3 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-2xl font-bold">
              {{ t('add_student') }}
            </h3>
            <button @click="showAddStudentModal = false" class="p-2">
              <X :size="24" />
            </button>
          </div>

          <form @submit.prevent="handleAddStudent" class="space-y-4">
            <!-- Option 1: Sélectionner un étudiant existant -->
            <div
              class="p-4 rounded-lg border-2"
              :class="darkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'"
            >
              <h4 :class="darkMode ? 'text-white' : 'text-gray-900'" class="font-bold mb-3">
                {{ t('option_1_existing') }}
              </h4>
              <select
                v-model.number="studentForm.student_id"
                :class="
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                "
                class="w-full px-4 py-3 border-2 rounded-xl outline-none"
                @change="studentForm.create_if_not_exists = false"
              >
                <option :value="null">{{ t('select_student') }}</option>
                <option v-for="student in availableStudents" :key="student.id" :value="student.id">
                  {{ student.name }} {{ student.last_name }} ({{ student.email }})
                </option>
              </select>
            </div>

            <div class="text-center py-2" :class="darkMode ? 'text-gray-400' : 'text-gray-600'">
              - OU -
            </div>

            <!-- Option 2: Créer un nouvel étudiant -->
            <div
              class="p-4 rounded-lg border-2"
              :class="darkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'"
            >
              <div class="flex items-center justify-between mb-3">
                <h4 :class="darkMode ? 'text-white' : 'text-gray-900'" class="font-bold">
                  {{ t('option_2_new') }}
                </h4>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="studentForm.create_if_not_exists"
                    @change="studentForm.student_id = null"
                    class="w-4 h-4"
                  />
                  <span :class="darkMode ? 'text-gray-300' : 'text-gray-700'" class="text-sm">
                    {{ t('enable') }}
                  </span>
                </label>
              </div>

              <div v-if="studentForm.create_if_not_exists" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      class="block text-sm mb-1"
                      :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                    >
                      {{ t('first_name_label') }}<span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="studentForm.name"
                      type="text"
                      required
                      placeholder="Prénom"
                      :class="
                        darkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-200'
                      "
                      class="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label
                      class="block text-sm mb-1"
                      :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                    >
                      {{ t('last_name') }}<span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="studentForm.last_name"
                      type="text"
                      required
                      placeholder="Nom"
                      :class="
                        darkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-200'
                      "
                      class="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label
                    class="block text-sm mb-1"
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  >
                    {{ t('email') }}<span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="studentForm.email"
                    type="email"
                    required
                    placeholder="email@student.dz"
                    :class="
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-200'
                    "
                    class="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      class="block text-sm mb-1"
                      :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                    >
                      {{ t('birthday') }}
                    </label>
                    <input
                      v-model="studentForm.birthday"
                      type="date"
                      :class="
                        darkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-200'
                      "
                      class="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label
                      class="block text-sm mb-1"
                      :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                    >
                      {{ t('gender') }}
                    </label>
                    <select
                      v-model="studentForm.gender"
                      :class="
                        darkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-200'
                      "
                      class="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="M">{{ t('boy') }}</option>
                      <option value="F">{{ t('girl') }}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    class="block text-sm mb-1"
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  >
                    {{ t('parent_phone') }}
                  </label>
                  <input
                    v-model="studentForm.parent_phone"
                    type="tel"
                    placeholder="0555 12 34 56"
                    :class="
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-200'
                    "
                    class="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div class="p-3 rounded-lg" :class="darkMode ? 'bg-blue-900/20' : 'bg-blue-50'">
                  <p class="text-xs" :class="darkMode ? 'text-blue-300' : 'text-blue-800'">
                    ℹ️ {{ t('auto_account_creation') }}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex gap-4 pt-4">
              <button
                type="submit"
                class="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <UserPlus :size="20" />
                {{ t('save') }}
              </button>

              <button
                type="button"
                @click="showAddStudentModal = false"
                :class="
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                "
                class="px-8 py-3 rounded-xl font-semibold transition-all"
              >
                {{ t('cancel') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal Notes/Remarques -->
    <Teleport to="body">
      <div
        v-if="showNoteModal"
        @click="showNoteModal = false"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <div
          @click.stop
          :class="darkMode ? 'bg-gray-800' : 'bg-white'"
          class="rounded-2xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto"
        >
          <div class="flex justify-between items-center mb-6">
            <div>
              <h3 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-2xl font-bold">
                {{ t('notes') }}- {{ selectedStudent?.name }} {{ selectedStudent?.last_name }}
              </h3>
              <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm">
                {{ selectedStudent?.email }}
              </p>
            </div>
            <button @click="showNoteModal = false" class="p-2">
              <X :size="24" />
            </button>
          </div>

          <!-- Formulaire d'ajout de remarque -->
          <div
            v-if="isAdmin || isTeacher"
            class="mb-6 p-4 rounded-lg border-2"
            :class="darkMode ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'"
          >
            <h4 :class="darkMode ? 'text-white' : 'text-gray-900'" class="font-bold mb-3">
              {{ t('add_note') }}
            </h4>
            <form @submit.prevent="handleAddNote" class="space-y-3">
              <div>
                <select
                  v-model="noteForm.note_type"
                  :class="
                    darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'
                  "
                  class="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option Remarque v-for="type in noteTypes" :key="type.value" :value="type.value">
                    {{ t(`note_type_${type.value}`) || type.label }}
                  </option>
                </select>
              </div>

              <div>
                <textarea
                  v-model="noteForm.note_text"
                  rows="3"
                  placeholder="Écrivez votre remarque ici..."
                  required
                  :class="
                    darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'
                  "
                  class="w-full px-3 py-2 border rounded-lg resize-none"
                ></textarea>
              </div>

              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="noteForm.is_important" class="w-4 h-4" />
                  <span :class="darkMode ? 'text-gray-300' : 'text-gray-700'" class="text-sm">
                    {{ t('important') }}
                  </span>
                </label>

                <label v-if="isAdmin" class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="noteForm.is_private" class="w-4 h-4" />
                  <span :class="darkMode ? 'text-gray-300' : 'text-gray-700'" class="text-sm">
                    {{ t('private_admin_only') }}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                class="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save :size="18" />
                {{ t('save') }}
              </button>
            </form>
          </div>

          <!-- Liste des remarques -->
          <div class="space-y-3">
            <h4 :class="darkMode ? 'text-white' : 'text-gray-900'" class="font-bold">
              {{ t('history') }}({{ selectedStudentNotes.length }})
            </h4>

            <div
              v-if="selectedStudentNotes.length === 0"
              class="text-center py-8"
              :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
            >
              {{ t('no_note_for_student') }}
            </div>

            <div
              v-for="note in selectedStudentNotes"
              :key="note.id"
              class="p-4 rounded-lg border"
              :class="[
                darkMode ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50',
                note.is_important ? 'border-l-4 border-l-orange-500' : '',
                note.is_private ? 'border-l-4 border-l-purple-500' : '',
              ]"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span
                    :class="darkMode ? 'text-white' : 'text-gray-900'"
                    class="font-semibold text-sm"
                  >
                    {{ note.author_name }} {{ note.author_last_name }}
                  </span>
                  <span
                    class="text-xs px-2 py-1 rounded-full"
                    :class="darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'"
                  >
                    {{
                      t(`note_type_${note.note_type}`) ||
                      noteTypes.find((t) => t.value === note.note_type)?.label ||
                      note.note_type
                    }}
                  </span>
                  <span
                    v-if="note.is_important"
                    class="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800"
                  >
                    {{ t('important') }}
                  </span>
                  <span
                    v-if="note.is_private"
                    class="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800"
                  >
                    {{ t('private_admin_only').replace(' (admin seulement)', '') }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span :class="darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-xs">
                    {{ new Date(note.created_at).toLocaleDateString('fr-FR') }}
                  </span>
                  <button
                    v-if="isAdmin || props.user?.id === note.author_id"
                    @click="handleDeleteNote(note.id)"
                    class="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>
              <p :class="darkMode ? 'text-gray-300' : 'text-gray-700'" class="text-sm">
                {{ note.note_text }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.ring-2 {
  box-shadow: 0 0 0 2px currentColor;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
