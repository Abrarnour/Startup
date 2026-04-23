<script setup>
import { ref, computed, onMounted } from 'vue'
import { BookOpen, Calendar, Users, TrendingUp, AlertCircle } from 'lucide-vue-next'
import CourseCard from '../components/CourseCard.vue'
import CourseModal from '../components/CourseModal.vue'
import UploadMaterialModal from '../components/UploadMaterialModal.vue'
import * as api from '../services/api.js'
import MaterialsListModal from '../components/MaterialsListModal.vue'
import { useLanguage } from '../composables/useLanguage.js' // ✅ Import Language

const props = defineProps({
  darkMode: { type: Boolean, default: false },
  user: { type: Object, default: null },
})

const { t } = useLanguage() // ✅ Extract t for translations

const showMaterialsModal = ref(false)
const selectedCourseForMaterials = ref(null)

// ADD this function near handleUploadSuccess:
const openMaterialsModal = (courseId) => {
  selectedCourseForMaterials.value = courseId
  showMaterialsModal.value = true
}
// État
const loading = ref(true)
const error = ref(null)
const courses = ref([])
const stats = ref({
  totalCourses: 0,
  totalGroups: 0,
  totalSessionsPerWeek: 0,
  totalStudents: 0,
  availableSeats: 0,
})
// ⭐ NEW: Modals state
const showCourseModal = ref(false)
const showUploadModal = ref(false)
const selectedCourseForUpload = ref(null)
const selectedCourse = ref(null)

// Grouper les cours par niveau
const coursesByLevel = computed(() => {
  const grouped = {
    primaire: [],
    moyen: [],
    secondaire: [],
  }

  courses.value.forEach((course) => {
    if (grouped[course.education_level]) {
      grouped[course.education_level].push(course)
    }
  })

  return grouped
})

// Labels des niveaux
const getLevelLabel = (level) => {
  const labels = {
    primaire: t('level_primary_full'),
    moyen: t('level_middle_full'),
    secondaire: t('level_secondary_full'),
  }
  return labels[level] || level
}

// Charger les cours
const loadCourses = async () => {
  loading.value = true
  error.value = null

  try {
    // Récupérer les cours de l'enseignant
    courses.value = await api.getCourses()

    // Calculer les statistiques
    stats.value.totalCourses = courses.value.length

    let totalSessions = 0
    let totalStudents = 0
    let availableSeats = 0

    courses.value.forEach((course) => {
      // Compter les séances par semaine
      if (course.sessions_per_week) {
        totalSessions += parseInt(course.sessions_per_week)
      }

      // Compter les étudiants
      const current = parseInt(course.current_students) || 0
      const max = parseInt(course.max_students_per_group || course.max_students) || 25
      totalStudents += current
      availableSeats += max - current
    })

    stats.value.totalSessionsPerWeek = totalSessions
    stats.value.totalStudents = totalStudents
    stats.value.availableSeats = availableSeats
    try {
      const apiStats = await api.getTeacherStats()
      stats.value.totalGroups = apiStats.totalSessionsPerWeek // backend sends groups count under this key
      stats.value.totalStudents = apiStats.totalStudents // more accurate: from DB not local calc
      stats.value.availableSeats = apiStats.availableSeats
    } catch (e) {
      console.warn('Stats API fallback to local calc', e)
    }
  } catch (err) {
    console.error('Erreur chargement cours:', err)
    error.value = err.message || t('error_loading_courses') // ✅ Dynamic translation
  } finally {
    loading.value = false
  }
}

// Voir les détails d'un cours
const viewDetails = (course) => {
  selectedCourse.value = course
}

// ⭐ NEW: Open upload modal
const openUploadModal = (courseId) => {
  selectedCourseForUpload.value = courseId
  showUploadModal.value = true
}

// ⭐ NEW: Handle course added
const handleCourseAdded = async () => {
  showCourseModal.value = false
  await loadCourses() // Refresh courses
}

// ⭐ NEW: Handle upload success
const handleUploadSuccess = () => {
  showUploadModal.value = false
  // Optionally show success notification
  alert(t('material_uploaded_success')) // ✅ Dynamic translation
}

onMounted(() => {
  loadCourses()
})
</script>

<template>
  <div v-if="loading" class="text-center py-12">
    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p :class="darkMode ? 'text-white' : 'text-gray-700'" class="mt-4 font-semibold">
      {{ t('loading_your_courses') }}
    </p>
  </div>

  <div
    v-else-if="error"
    class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6"
  >
    <p class="font-semibold">{{ t('error_prefix') }} {{ error }}</p>
    <button
      @click="loadCourses"
      class="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
    >
      {{ t('retry') }}
    </button>
  </div>

  <div v-else>
    <div :class="darkMode ? 'bg-gray-800' : 'bg-white'" class="rounded-2xl shadow-xl p-6 mb-8">
      <div class="flex items-start gap-4">
        <div class="p-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl">
          <BookOpen :size="32" class="text-white" />
        </div>
        <div class="flex-1">
          <h1 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-3xl font-bold mb-2">
            {{ t('welcome_comma') }}{{ user?.name }}
            {{ user?.last_name }}
          </h1>
          <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-lg">
            {{ t('manage_courses_materials') }}
          </p>
        </div>
      </div>

      <div
        class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg flex items-start gap-3"
      >
        <AlertCircle :size="20" class="text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <p :class="darkMode ? 'text-blue-200' : 'text-blue-800'" class="text-sm font-medium">
            <strong>{{ t('info_label') }}</strong> {{ t('teacher_info_msg') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Statistiques -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div
        :class="darkMode ? 'bg-gray-800' : 'bg-white'"
        class="rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all"
      >
        <BookOpen class="mx-auto mb-3 text-blue-500" :size="32" />
        <div :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-3xl font-bold mb-1">
          {{ stats.totalCourses }}
        </div>
        <div :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm">
          {{ t('assigned_courses') }}
        </div>
      </div>

      <div
        :class="darkMode ? 'bg-gray-800' : 'bg-white'"
        class="rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all"
      >
        <Calendar class="mx-auto mb-3 text-green-500" :size="32" />
        <div :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-3xl font-bold mb-1">
          {{ stats.totalGroups }}
        </div>
        <div :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm">
          {{ t('group_label') }}
        </div>
      </div>

      <div
        :class="darkMode ? 'bg-gray-800' : 'bg-white'"
        class="rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all"
      >
        <Users class="mx-auto mb-3 text-purple-500" :size="32" />
        <div :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-3xl font-bold mb-1">
          {{ stats.totalStudents }}
        </div>
        <div :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm">
          {{ t('enrolled_students_count') }}
        </div>
      </div>

      <div
        :class="darkMode ? 'bg-gray-800' : 'bg-white'"
        class="rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all"
      >
        <TrendingUp class="mx-auto mb-3 text-orange-500" :size="32" />
        <div :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-3xl font-bold mb-1">
          {{ stats.availableSeats }}
        </div>
        <div :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm">
          {{ t('available_seats') }}
        </div>
      </div>
    </div>

    <div class="mb-6">
      <button
        @click="showCourseModal = true"
        class="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-pink-400 text-white rounded-xl font-bold hover:from-pink-600 hover:to-blue-500 transition-all shadow-lg transform hover:scale-105"
      >
        <svg
          data-v-402bf322=""
          xmlns="http://www.w3.org/2000/svg"
          width="25"
          height="25"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-plus-icon lucide-plus"
        >
          <path d="M5 12h14"></path>
          <path d="M12 5v14"></path>
        </svg>
        {{ t('add_course') }}
      </button>
    </div>

    <div
      v-if="courses.length === 0"
      :class="darkMode ? 'bg-gray-800' : 'bg-white'"
      class="rounded-2xl shadow-xl p-12 text-center"
    >
      <Calendar
        :size="64"
        :class="darkMode ? 'text-gray-600' : 'text-gray-300'"
        class="mx-auto mb-4"
      />
      <h3 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-2xl font-bold mb-2">
        {{ t('no_courses_yet_title') }}
      </h3>
      <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-lg mb-4">
        {{ t('click_add_course_msg') }}
      </p>
    </div>

    <div v-else class="space-y-8">
      <div
        v-for="(levelCourses, level) in coursesByLevel"
        :key="level"
        v-show="levelCourses.length > 0"
      >
        <div class="flex items-center gap-3 mb-4">
          <div
            :class="{
              'bg-green-500': level === 'primaire',
              'bg-blue-500': level === 'moyen',
              'bg-purple-500': level === 'secondaire',
            }"
            class="w-1 h-8 rounded-full"
          ></div>
          <h2 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-2xl font-bold">
            {{ getLevelLabel(level) }} ({{ levelCourses.length }})
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="course in levelCourses" :key="course.id" class="relative">
            <CourseCard
              :course="course"
              :darkMode="darkMode"
              :user="user"
              @view-details="viewDetails"
            />

            <div class="mt-3">
              <button
                @click="openUploadModal(course.id)"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
              >
                <span class="text-xl"></span>
                {{ t('upload_course_btn') }}
              </button>
              <button
                @click="openMaterialsModal(course.id)"
                :class="
                  darkMode
                    ? 'bg-indigo-900 text-indigo-200 hover:bg-indigo-800'
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                "
                class="px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                {{ t('view_documents_btn') }} ({{ course.materials_count || 0 }})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de détails -->
    <div
      v-if="selectedCourse"
      @click="selectedCourse = null"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        @click.stop
        :class="darkMode ? 'bg-gray-800' : 'bg-white'"
        class="rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div class="flex justify-between items-start mb-6">
          <div>
            <h3 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-3xl font-bold mb-2">
              {{ selectedCourse.title }}
            </h3>
            <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm">
              {{ getLevelLabel(selectedCourse.education_level) }} - {{ selectedCourse.year_level
              }}{{ t('year_suffix') }}
            </p>
          </div>
          <button
            @click="selectedCourse = null"
            :class="darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'"
            class="p-2 rounded-lg transition-colors"
          >
            <span class="text-2xl">×</span>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <h4 :class="darkMode ? 'text-gray-300' : 'text-gray-700'" class="font-semibold mb-2">
              {{ t('description') }}
            </h4>
            <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'">
              {{ selectedCourse.description || t('no_description_available') }}
            </p>
          </div>

          <div
            class="grid grid-cols-2 gap-4 pt-4 border-t"
            :class="darkMode ? 'border-gray-700' : 'border-gray-200'"
          >
            <div>
              <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm mb-1">
                {{ t('group_label') }}
              </p>
              <p :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-xl font-bold">
                {{
                  selectedCourse.sessions_per_week || selectedCourse.course_type === 'one_time'
                    ? '1'
                    : t('variable')
                }}
              </p>
            </div>
            <div>
              <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm mb-1">
                {{ t('enrolled_students_count') }}
              </p>
              <p :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-xl font-bold">
                {{ selectedCourse.current_students }} / {{ selectedCourse.max_students }}
              </p>
            </div>
            <div>
              <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm mb-1">
                {{ t('course_type_label') }}
              </p>
              <p :class="darkMode ? 'text-white' : 'text-gray-900'" class="font-semibold">
                {{
                  selectedCourse.course_type === 'continuous'
                    ? t('continuous_course')
                    : t('single_session')
                }}
              </p>
            </div>
            <div>
              <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm mb-1">
                {{ t('tariff_label') }}
              </p>
              <p :class="darkMode ? 'text-white' : 'text-gray-900'" class="font-semibold">
                {{
                  selectedCourse.price
                    ? `${parseFloat(selectedCourse.price).toLocaleString('fr-DZ')} DA`
                    : t('free')
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CourseModal
      :show="showCourseModal"
      :dark-mode="darkMode"
      :is-teacher-mode="true"
      :teacher-id="user?.id"
      :teacher-name="`${user?.name} ${user?.last_name}`"
      :teacher-gender="user?.gender"
      @close="showCourseModal = false"
      @course-saved="handleCourseAdded"
    />

    <UploadMaterialModal
      :is-open="showUploadModal"
      :course-id="selectedCourseForUpload"
      :dark-mode="darkMode"
      @close="showUploadModal = false"
      @upload-success="handleUploadSuccess"
    />
    <MaterialsListModal
      :is-open="showMaterialsModal"
      :course-id="selectedCourseForMaterials"
      :dark-mode="darkMode"
      :user-role="user?.role"
      @close="showMaterialsModal = false"
    />
  </div>
</template>

<style scoped>
.hover\:shadow-xl:hover {
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>
