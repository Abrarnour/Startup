<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { X, Save, BookOpen, User, Calendar, Lock } from 'lucide-vue-next'
import * as api from '../services/api.js'
import { useLanguage } from '../composables/useLanguage.js'
const { t, currentLang } = useLanguage()
const props = defineProps({
  show: { type: Boolean, default: false },
  darkMode: { type: Boolean, default: false },
  editingCourse: { type: Object, default: null },
  isTeacherMode: { type: Boolean, default: false },
  teacherId: { type: Number, default: null },
  teacherName: { type: String, default: '' },
  teacherGender: { type: String, default: 'M' },
})

const emit = defineEmits(['close', 'course-saved'])

const loading = ref(false)
const teachers = ref([])
const error = ref('')

// Full form data (used for CREATE mode)
const formData = reactive({
  title: '',
  teacher_id: props.isTeacherMode ? props.teacherId : null,
  description: '',
  education_level: 'primaire',
  year_level: 1,
  branch: null,
  course_type: 'continuous',
  sessions_per_month: '',
  duration_hours: '',
  price: '',
  max_students_per_group: 30,
  salle: '',
})

// ── Education system structure (unchanged) ──────────
const educationSystem = {
  primaire: {
    label: t('level_primaire'),
    years: [
      { value: 1, label: 'السنة الأولى ابتدائي (1ère année)' },
      { value: 2, label: 'السنة الثانية ابتدائي (2ème année)' },
      { value: 3, label: 'السنة الثالثة ابتدائي (3ème année)' },
      { value: 4, label: 'السنة الرابعة ابتدائي (4ème année)' },
      { value: 5, label: 'السنة الخامسة ابتدائي (5ème année)' },
    ],
    branches: [],
  },
  moyen: {
    label: 'المتوسط (Collège)',
    years: [
      { value: 1, label: 'السنة الأولى متوسط (1ère année)' },
      { value: 2, label: 'السنة الثانية متوسط (2ème année)' },
      { value: 3, label: 'السنة الثالثة متوسط (3ème année)' },
      { value: 4, label: 'السنة الرابعة متوسط (4ème année)' },
    ],
    branches: [],
  },
  secondaire: {
    label: 'الثانوي (Lycée)',
    years: [
      { value: 1, label: 'السنة الأولى ثانوي (1ère année)' },
      { value: 2, label: 'السنة الثانية ثانوي (2ème année)' },
      { value: 3, label: 'السنة الثالثة ثانوي (3ème année - BAC)' },
    ],
    branches: [
      { value: 'sciences_experimentales', label: 'علوم تجريبية' },
      { value: 'mathematiques', label: 'رياضيات' },
      { value: 'techniques_mathematiques', label: 'تقني رياضي' },
      { value: 'gestion_economie', label: 'تسيير واقتصاد' },
      { value: 'lettres_philosophie', label: 'آداب وفلسفة' },
      { value: 'langues_etrangeres', label: 'لغات أجنبية' },
    ],
  },
}

const availableYears = computed(() => educationSystem[formData.education_level]?.years || [])
const availableBranches = computed(() => educationSystem[formData.education_level]?.branches || [])
const needsBranch = computed(
  () =>
    formData.education_level === 'secondaire' &&
    formData.year_level >= 2 &&
    availableBranches.value.length > 0,
)

const loadTeachers = async () => {
  if (props.isTeacherMode) return
  try {
    teachers.value = await api.getTeachersList()
  } catch (err) {
    console.error('Erreur chargement enseignants:', err)
  }
}

const formatTeacherName = (teacher) => {
  const prefix = teacher.gender === 'M' ? 'Mr.' : 'Mme.'
  return `${prefix} ${teacher.name} ${teacher.last_name}`
}

const displayedTeacherName = computed(() => {
  if (props.isTeacherMode) {
    const prefix = props.teacherGender === 'M' ? 'Mr.' : 'Mme.'
    return `${prefix} ${props.teacherName}`
  }
  return ''
})

// ── Labels for read-only display in edit mode ───────
const levelLabel = computed(() => {
  if (!props.editingCourse) return ''
  const lvl = props.editingCourse.education_level
  const yr = props.editingCourse.year_level
  const map = { primaire: 'Primaire', moyen: 'Moyen', secondaire: 'Secondaire' }
  return `${map[lvl] || lvl} — ${yr}${yr === 1 ? 'ère' : 'ème'} année`
})

const teacherLabel = computed(() => {
  if (!props.editingCourse) return ''
  const prefix = props.editingCourse.teacher_gender === 'M' ? 'Mr.' : 'Mme.'
  return `${prefix} ${props.editingCourse.teacher_name || ''} ${props.editingCourse.teacher_last_name || ''}`
})

const typeLabel = computed(() => {
  if (!props.editingCourse) return ''
  return props.editingCourse.course_type === 'continuous' ? 'Cours Continu' : 'Session Unique'
})

// ── Submit ───────────────────────────────────────────
const handleSubmit = async () => {
  error.value = ''

  if (!formData.title || formData.title.trim() === '') {
    error.value = 'Veuillez remplir le titre de coure'
    return
  }

  // ✅ EDIT MODE: only send the 4 safe fields
  if (props.editingCourse) {
    loading.value = true
    try {
      await api.updateCourse(props.editingCourse.id, {
        title: formData.title.trim(),
        description: formData.description || '',
        salle: formData.salle || null,
        price: parseFloat(formData.price) || 0,
      })
      emit('course-saved')
      closeModal()
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
    return
  }

  // CREATE MODE: full validation
  if (!formData.teacher_id) {
    error.value = 'Veuillez choisir un enseignant'
    return
  }
  if (needsBranch.value && !formData.branch) {
    error.value = 'Veuillez choisir une filière'
    return
  }

  loading.value = true
  try {
    const courseData = {
      ...formData,
      sessions_per_month:
        formData.course_type === 'continuous'
          ? parseInt(formData.sessions_per_month) || null
          : null,
      duration_hours:
        formData.course_type === 'one_time' ? parseInt(formData.duration_hours) || null : null,
      price: parseFloat(formData.price) || 0,
    }
    await api.createCourse(courseData)
    emit('course-saved')
    closeModal()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  Object.assign(formData, {
    title: '',
    teacher_id: props.isTeacherMode ? props.teacherId : null,
    description: '',
    education_level: 'primaire',
    year_level: 1,
    branch: null,
    course_type: 'continuous',
    sessions_per_month: '',
    duration_hours: '',
    price: '',
    max_students_per_group: 30,
    salle: '',
  })
  error.value = ''
  emit('close')
}

// Populate formData when opening in edit mode
watch(
  () => props.editingCourse,
  (course) => {
    if (course) {
      Object.assign(formData, {
        title: course.title,
        teacher_id: course.teacher_id,
        description: course.description || '',
        education_level: course.education_level,
        year_level: course.year_level,
        branch: course.branch,
        course_type: course.course_type,
        sessions_per_month: course.sessions_per_month || '',
        duration_hours: course.duration_hours || '',
        price: course.price || '',
        max_students_per_group: course.max_students_per_group || 30,
        salle: course.salle || '',
      })
    }
  },
  { immediate: true },
)

onMounted(() => {
  loadTeachers()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="closeModal"
      >
        <div
          :class="darkMode ? 'bg-gray-800' : 'bg-white'"
          class="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <!-- Header -->
          <div
            class="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
            :class="darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
          >
            <div class="flex items-center gap-3">
              <div
                class="p-2 rounded-xl"
                :class="
                  editingCourse
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                "
              >
                <BookOpen :size="24" class="text-white" />
              </div>
              <div>
                <h2 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-2xl font-bold">
                  {{ editingCourse ? t('edit_course') : t('create_course') }}
                </h2>
                <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm">
                  {{
                    editingCourse
                      ? 'Modifiez uniquement les champs autorisés'
                      : 'Remplissez les informations du cours'
                  }}
                </p>
              </div>
            </div>
            <button
              @click="closeModal"
              :class="
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              "
              class="p-2 rounded-lg transition-colors"
            >
              <X :size="24" />
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
            <!-- Error -->
            <div
              v-if="error"
              class="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg"
            >
              <p class="font-semibold">{{ error }}</p>
            </div>

            <!-- ════════════════════════════════════════
                 EDIT MODE — locked info banner + 4 fields
                 ════════════════════════════════════════ -->
            <template v-if="editingCourse">
              <!-- Read-only info banner -->
              <div
                :class="darkMode ? 'bg-gray-700 border-gray-600' : 'bg-amber-50 border-amber-200'"
                class="rounded-xl border-2 p-4"
              >
                <div class="flex items-center gap-2 mb-3">
                  <Lock :size="16" class="text-amber-500" />
                  <span class="text-sm font-bold text-amber-600">
                    Informations verrouillées (non modifiables)
                  </span>
                </div>
                <div class="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p :class="darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-xs mb-0.5">
                      {{ t('teacher_label') }}
                    </p>
                    <p :class="darkMode ? 'text-white' : 'text-gray-800'" class="font-semibold">
                      {{ teacherLabel }}
                    </p>
                  </div>
                  <div>
                    <p :class="darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-xs mb-0.5">
                      Niveau
                    </p>
                    <p :class="darkMode ? 'text-white' : 'text-gray-800'" class="font-semibold">
                      {{ levelLabel }}
                    </p>
                  </div>
                  <div>
                    <p :class="darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-xs mb-0.5">
                      Type
                    </p>
                    <p :class="darkMode ? 'text-white' : 'text-gray-800'" class="font-semibold">
                      {{ typeLabel }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- 1. Titre -->
              <div>
                <label
                  :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  class="block text-sm font-medium mb-2"
                >
                  {{ t('course_title') }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.title"
                  type="text"
                  required
                  placeholder="Ex: Mathématiques - 5ème année primaire"
                  :class="
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200'
                  "
                  class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>

              <!-- 2. Description -->
              <div>
                <label
                  :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  class="block text-sm font-medium mb-2"
                >
                  Description
                </label>
                <textarea
                  v-model="formData.description"
                  rows="4"
                  placeholder="Décrivez le contenu du cours..."
                  :class="
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200'
                  "
                  class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none resize-none"
                ></textarea>
              </div>

              <!-- 3. Salle + 4. Prix (side by side) -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                    class="block text-sm font-medium mb-2"
                  >
                    {{ t('classroom') }}
                  </label>
                  <input
                    v-model="formData.salle"
                    type="text"
                    placeholder="Ex: Salle A"
                    :class="
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200'
                    "
                    class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                    class="block text-sm font-medium mb-2"
                  >
                    Prix (DA)
                  </label>
                  <input
                    v-model="formData.price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="5000"
                    :class="
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200'
                    "
                    class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                </div>
              </div>
            </template>

            <!-- ════════════════════════════════════════
                 CREATE MODE — full original form
                 ════════════════════════════════════════ -->
            <template v-else>
              <!-- Titre -->
              <div>
                <label
                  :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  class="block text-sm font-medium mb-2"
                >
                  {{ t('course_title') }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.title"
                  type="text"
                  required
                  placeholder="Ex: Mathématiques - Niveau 5ème année"
                  :class="
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200'
                  "
                  class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <!-- Enseignant -->
              <div>
                <label
                  :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  class="block text-sm font-medium mb-2"
                >
                  {{ t('teacher_label') }} <span class="text-red-500">*</span>
                </label>
                <div v-if="isTeacherMode">
                  <input
                    :value="displayedTeacherName"
                    type="text"
                    readonly
                    :class="
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed'
                    "
                    class="w-full px-4 py-3 border-2 rounded-xl"
                  />
                </div>
                <select
                  v-else
                  v-model="formData.teacher_id"
                  required
                  :class="
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200'
                  "
                  class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option :value="null" disabled>Choisir un{{ t('teacher_label') }}...</option>
                  <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                    {{ formatTeacherName(teacher) }}
                  </option>
                </select>
              </div>

              <!-- Niveau + Année -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                    class="block text-sm font-medium mb-2"
                  >
                    {{ t('education_level') }} <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.education_level"
                    required
                    :class="
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200'
                    "
                    class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="primaire">{{ educationSystem.primaire.label }}</option>
                    <option value="moyen">{{ educationSystem.moyen.label }}</option>
                    <option value="secondaire">{{ educationSystem.secondaire.label }}</option>
                  </select>
                </div>
                <div>
                  <label
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                    class="block text-sm font-medium mb-2"
                  >
                    {{ t('year_level') }} <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.year_level"
                    required
                    :class="
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200'
                    "
                    class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option v-for="year in availableYears" :key="year.value" :value="year.value">
                      {{ year.label }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Filière -->
              <div v-if="needsBranch">
                <label
                  :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  class="block text-sm font-medium mb-2"
                >
                  {{ t('branch_label') }} <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="formData.branch"
                  required
                  :class="
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200'
                  "
                  class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option :value="null" disabled>Choisir une filière...</option>
                  <option
                    v-for="branch in availableBranches"
                    :key="branch.value"
                    :value="branch.value"
                  >
                    {{ branch.label }}
                  </option>
                </select>
              </div>

              <!-- Type de cours -->
              <div>
                <label
                  :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  class="block text-sm font-medium mb-3"
                >
                  {{ t('course_type') }} <span class="text-red-500">*</span>
                </label>
                <div class="grid grid-cols-2 gap-4">
                  <label class="relative cursor-pointer">
                    <input
                      type="radio"
                      v-model="formData.course_type"
                      value="continuous"
                      class="peer sr-only"
                    />
                    <div
                      class="p-4 border-2 rounded-xl transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50"
                      :class="
                        darkMode ? 'border-gray-600 peer-checked:bg-blue-900/20' : 'border-gray-200'
                      "
                    >
                      <Calendar
                        :size="20"
                        class="mb-2"
                        :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                      />
                      <div class="font-semibold" :class="darkMode ? 'text-white' : 'text-gray-900'">
                        Cours continu
                      </div>
                      <div class="text-sm" :class="darkMode ? 'text-gray-400' : 'text-gray-600'">
                        Plusieurs sessions
                      </div>
                    </div>
                  </label>
                  <label class="relative cursor-pointer">
                    <input
                      type="radio"
                      v-model="formData.course_type"
                      value="one_time"
                      class="peer sr-only"
                    />
                    <div
                      class="p-4 border-2 rounded-xl transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50"
                      :class="
                        darkMode ? 'border-gray-600 peer-checked:bg-blue-900/20' : 'border-gray-200'
                      "
                    >
                      <BookOpen
                        :size="20"
                        class="mb-2"
                        :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                      />
                      <div class="font-semibold" :class="darkMode ? 'text-white' : 'text-gray-900'">
                        Session unique
                      </div>
                      <div class="text-sm" :class="darkMode ? 'text-gray-400' : 'text-gray-600'">
                        Formation ponctuelle
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Prix / Séances / Max -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                    class="block text-sm font-medium mb-2"
                  >
                    {{ formData.course_type === 'continuous' ? 'Séances/mois' : 'Durée (heures)' }}
                  </label>
                  <input
                    v-if="formData.course_type === 'continuous'"
                    v-model="formData.sessions_per_month"
                    type="number"
                    min="0"
                    placeholder="8"
                    :class="
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200'
                    "
                    class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    v-else
                    v-model="formData.duration_hours"
                    type="number"
                    min="0"
                    placeholder="30"
                    :class="
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200'
                    "
                    class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                    class="block text-sm font-medium mb-2"
                    >{{ t('price_da') }}</label
                  >
                  <input
                    v-model="formData.price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="5000"
                    :class="
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200'
                    "
                    class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                    class="block text-sm font-medium mb-2"
                    >Max/groupe</label
                  >
                  <input
                    v-model="formData.max_students_per_group"
                    type="number"
                    min="1"
                    placeholder="30"
                    :class="
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200'
                    "
                    class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <!-- Salle -->
              <div>
                <label
                  :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  class="block text-sm font-medium mb-2"
                  >Salle</label
                >
                <input
                  v-model="formData.salle"
                  type="text"
                  placeholder="Ex: Salle A"
                  :class="
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200'
                  "
                  class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <!-- Description -->
              <div>
                <label
                  :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  class="block text-sm font-medium mb-2"
                  >Description</label
                >
                <textarea
                  v-model="formData.description"
                  rows="4"
                  placeholder="Décrivez le contenu du cours..."
                  :class="
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200'
                  "
                  class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                ></textarea>
              </div>
            </template>

            <!-- Submit / Cancel buttons -->
            <div class="flex gap-3 pt-4">
              <button
                type="submit"
                :disabled="loading"
                :class="
                  editingCourse
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                "
                class="flex-1 py-3 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save :size="20" />
                {{ loading ? 'Enregistrement...' : editingCourse ? t('saving') : t('save_btn') }}
              </button>

              <button
                type="button"
                @click="closeModal"
                :class="
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                "
                class="px-8 py-3 rounded-xl font-semibold transition-all"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}
</style>
