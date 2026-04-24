<script setup>
import { ref, computed, defineProps, onMounted } from 'vue'
import {
  Search,
  Plus,
  Heart,
  Filter,
  X,
  BookOpen,
  Clock,
  User,
  Users,
  Trash2,
} from 'lucide-vue-next'
import CourseCard from '../components/CourseCard.vue'
import CourseModal from '../components/CourseModal.vue'
import * as api from '../services/api.js'
import TeacherListModal from '../components/TeacherListModal.vue'
import StudentListModal from '../components/StudentListModal.vue'
import { useLanguage } from '../composables/useLanguage.js' // ✅ Import Language
// script
import ChangePasswordModal from '../components/ChangePasswordModal.vue'
const showChangePwdModal = ref(false)
const { t } = useLanguage() // ✅ Extract t for translations
const showStudentModal = ref(false)
const props = defineProps({
  darkMode: { type: Boolean, default: false },
  user: { type: Object, default: null },
})

// État
const stats = ref({
  totalUsers: 0,
  students: 0,
  parents: 0,
  teachers: 0,
  totalCourses: 0,
  totalHours: 0,
  uniqueTeachers: 0,
})

const courses = ref([])
const loading = ref(true)
const error = ref(null)

// Filtres
const showOnlyFavorites = ref(false)
const searchTerm = ref('')
const selectedEducationLevel = ref('tous')
const selectedYearLevel = ref('tous')
const selectedCourseType = ref('tous')
const showFilters = ref(false)
const sortBy = ref('recent')

// Modal
const showModal = ref(false)
const editingCourse = ref(null)
const selectedCourse = ref(null)
const showTeacherModal = ref(false)
const teachersList = ref([])
const teachersLoading = ref(false)

const openTeacherModal = async () => {
  showTeacherModal.value = true
  teachersLoading.value = true
  try {
    teachersList.value = await api.getTeachersList()
  } catch (err) {
    console.error('Erreur chargement enseignants:', err)
  } finally {
    teachersLoading.value = false
  }
}

const handleDeleteTeacher = async (teacherId) => {
  if (!window.confirm(t('confirm_delete_teacher_soft'))) return
  try {
    await api.deleteTeacher(teacherId)
    teachersList.value = teachersList.value.filter((t) => t.id !== teacherId)
    await loadStats() // refresh the count in the card
  } catch (err) {
    alert(t('error') + ': ' + err.message)
  }
}

// Options de filtrage
const educationLevels = computed(() => [
  { value: 'tous', label: t('all_levels') },
  { value: 'primaire', label: t('primary_level_label') },
  { value: 'moyen', label: t('middle_level_label') },
  { value: 'secondaire', label: t('secondary_level_label') },
])

const courseTypes = computed(() => [
  { value: 'tous', label: t('all_types') },
  { value: 'continuous', label: t('continuous_courses') },
  { value: 'one_time', label: t('single_sessions') },
])

// Computed
const availableYears = computed(() => {
  const options = [{ value: 'tous', label: t('all_years') }]

  if (selectedEducationLevel.value === 'primaire') {
    for (let i = 1; i <= 5; i++) {
      options.push({ value: i, label: `${i} ${t('year_suffix')}` })
    }
  } else if (selectedEducationLevel.value === 'moyen') {
    for (let i = 1; i <= 4; i++) {
      options.push({ value: i, label: `${i} ${t('year_suffix')}` })
    }
  } else if (selectedEducationLevel.value === 'secondaire') {
    for (let i = 1; i <= 3; i++) {
      options.push({ value: i, label: `${i} ${t('year_suffix')}` })
    }
  }

  return options
})

const filteredCourses = computed(() => {
  return courses.value
    .filter((course) => {
      const matchSearch =
        course.title.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        (course.teacher_name &&
          course.teacher_name.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
        (course.description &&
          course.description.toLowerCase().includes(searchTerm.value.toLowerCase()))

      const matchEducationLevel =
        selectedEducationLevel.value === 'tous' ||
        course.education_level === selectedEducationLevel.value

      const matchYearLevel =
        selectedYearLevel.value === 'tous' || course.year_level === selectedYearLevel.value

      const matchCourseType =
        selectedCourseType.value === 'tous' || course.course_type === selectedCourseType.value

      const matchFavorite = !showOnlyFavorites.value || course.is_favorite

      return (
        matchSearch && matchEducationLevel && matchYearLevel && matchCourseType && matchFavorite
      )
    })
    .sort((a, b) => {
      if (sortBy.value === 'title') return a.title.localeCompare(b.title)
      if (sortBy.value === 'hours') return b.total_hours - a.total_hours
      if (sortBy.value === 'price') return (b.price || 0) - (a.price || 0)
      if (sortBy.value === 'recent') return new Date(b.created_at) - new Date(a.created_at)
      return 0
    })
})

const totalHours = computed(() => courses.value.reduce((sum, c) => sum + (c.total_hours || 0), 0))
const favoriteCount = computed(() => courses.value.filter((c) => c.is_favorite).length)

// Méthodes
const loadStats = async () => {
  try {
    const data = await api.getStats()
    stats.value = data
  } catch (err) {
    console.error('Erreur chargement stats:', err)
  }
}

const loadCourses = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await api.getCourses()
    courses.value = data
  } catch (err) {
    error.value = err.message
    console.error('Erreur chargement cours:', err)
  } finally {
    loading.value = false
  }
}

const toggleFavorite = async (id) => {
  if (!props.user) {
    alert(t('must_be_logged_for_favorites'))
    return
  }

  try {
    const courseIndex = courses.value.findIndex((c) => c.id === id)
    if (courseIndex === -1) return

    const previousState = courses.value[courseIndex].is_favorite
    courses.value[courseIndex].is_favorite = !previousState

    const result = await api.toggleFavorite(id)

    if (result && typeof result.isFavorite !== 'undefined') {
      courses.value[courseIndex].is_favorite = result.isFavorite
    } else {
      await loadCourses()
    }
  } catch (err) {
    console.error('Erreur favoris:', err)
    alert(t('error_favorites') + err.message)
    await loadCourses()
  }
}

const deleteCourse = async (id) => {
  if (!window.confirm(t('confirm_delete_course_msg'))) {
    return
  }

  try {
    await api.deleteCourse(id)
    await loadCourses()
  } catch (err) {
    alert(t('error') + ': ' + err.message)
  }
}

const openAddModal = () => {
  editingCourse.value = null
  showModal.value = true
}

const openEditModal = (course) => {
  editingCourse.value = course
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingCourse.value = null
}

const handleCourseSaved = async () => {
  await loadCourses()
  await loadStats()
}

const viewDetails = (course) => {
  selectedCourse.value = course
}

const toggleFavoritesFilter = () => {
  showOnlyFavorites.value = !showOnlyFavorites.value
}

onMounted(() => {
  loadCourses()
  loadStats()
})
</script>

<template>
  <div v-if="loading" class="text-center py-12">
    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p :class="props.darkMode ? 'text-white' : 'text-gray-700'" class="mt-4 font-semibold">
      {{ t('loading_courses_list') }}
    </p>
  </div>

  <div
    v-else-if="error"
    class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6"
  >
    <p class="font-semibold">❌ {{ t('error') }}: {{ error }}</p>
    <button
      @click="loadCourses"
      class="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
    >
      {{ t('retry') }}
    </button>
  </div>

  <div v-else>
    <header
      :class="
        props.darkMode
          ? 'bg-gradient-to-r from-gray-800 to-gray-900'
          : 'deep-blue-gradient text-white'
      "
      class="text-white shadow-2xl rounded-3xl -mt-4 mb-8"
    >
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-2xl font-bold mb-1">{{ t('dashboard') }}</h2>
            <p class="text-blue-100 text-sm">{{ t('global_stats') }}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            class="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-white/20 transition-all"
          >
            <BookOpen class="mx-auto mb-2" :size="28" />
            <div class="text-2xl font-bold">{{ courses.length }}</div>
            <div class="text-sm text-blue-100">
              {{ user?.role === 'teacher' ? t('courses_assigned') : t('courses_available') }}
            </div>
          </div>

          <div
            v-if="user?.role === 'admin'"
            @click="showStudentModal = true"
            class="cursor-pointer hover:scale-105 transition-transform bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-white/20 transition-all"
          >
            <Users class="mx-auto mb-2" :size="28" />
            <div class="text-2xl font-bold">{{ stats.students }}</div>
            <div class="text-sm text-blue-100">{{ t('students') }}</div>
            <p class="text-yellow-300 text-xs mt-1 flex items-center gap-1">
              👆 {{ t('click_to_manage') }}
            </p>
          </div>

          <div
            v-if="user?.role === 'admin'"
            @click="showTeacherModal = true"
            class="cursor-pointer hover:scale-105 transition-transform bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-white/20 transition-all cursor-pointer"
          >
            <User class="mx-auto mb-2" :size="28" />
            <div class="text-2xl font-bold">{{ stats.teachers }}</div>
            <div class="text-sm text-blue-100">{{ t('teachers') }}</div>
            <p class="text-yellow-300 text-xs mt-1 flex items-center gap-1">
              👆 {{ t('click_to_manage') }}
            </p>
          </div>

          <div
            class="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-white/20 transition-all"
          >
            <Heart class="mx-auto mb-2" :size="28" />
            <div class="text-2xl font-bold">{{ favoriteCount }}</div>
            <div class="text-sm text-blue-100">{{ t('favorites') }}</div>
          </div>
        </div>
      </div>
    </header>

    <div
      :class="props.darkMode ? 'bg-gray-800' : 'bg-white'"
      class="rounded-2xl shadow-xl p-6 mb-8"
    >
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex-1 min-w-64 relative">
          <Search class="absolute left-3 top-3 text-gray-400" :size="20" />
          <input
            type="text"
            :placeholder="t('search_course_placeholder')"
            v-model="searchTerm"
            :class="
              props.darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-gray-50 border-gray-200'
            "
            class="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <button
          @click="showFilters = !showFilters"
          :class="
            props.darkMode
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          "
          class="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all transform hover:scale-105"
        >
          <Filter :size="20" />
          {{ showFilters ? t('hide') : t('filters') }}
        </button>

        <button
          @click="toggleFavoritesFilter"
          :class="[
            showOnlyFavorites
              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg scale-105'
              : props.darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            'px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all transform hover:scale-105',
          ]"
        >
          <Heart
            :size="20"
            :fill="showOnlyFavorites ? 'currentColor' : 'none'"
            :class="showOnlyFavorites ? 'animate-pulse' : ''"
          />
          <span>{{ showOnlyFavorites ? t('all') : t('favorites') }}</span>
        </button>

        <button
          v-if="props.user && props.user.role === 'admin'"
          @click="openAddModal"
          class="flex items-center gap-2 px-6 py-3 bg-[#0056b3] text-white rounded-xl font-bold hover:bg-[#004494] transition-all shadow-lg"
        >
          <Plus :size="20" />
          {{ t('add_course') }}
        </button>
        <button
          @click="showChangePwdModal = true"
          class="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all"
        >
          <Lock :size="16" /> {{ t('change_my_password') }}
        </button>
      </div>

      <div v-if="showFilters" class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div>
          <label
            :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
            class="block text-sm font-medium mb-1"
          >
            {{ t('level') }}
          </label>
          <select
            v-model="selectedEducationLevel"
            :class="
              props.darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            "
            class="w-full py-2 px-3 border-2 rounded-xl transition-all"
          >
            <option v-for="level in educationLevels" :key="level.value" :value="level.value">
              {{ level.label }}
            </option>
          </select>
        </div>

        <div>
          <label
            :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
            class="block text-sm font-medium mb-1"
          >
            {{ t('year_label') }}
          </label>
          <select
            v-model="selectedYearLevel"
            :class="
              props.darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            "
            class="w-full py-2 px-3 border-2 rounded-xl transition-all"
          >
            <option v-for="year in availableYears" :key="year.value" :value="year.value">
              {{ year.label }}
            </option>
          </select>
        </div>

        <div>
          <label
            :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
            class="block text-sm font-medium mb-1"
          >
            {{ t('type') }}
          </label>
          <select
            v-model="selectedCourseType"
            :class="
              props.darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            "
            class="w-full py-2 px-3 border-2 rounded-xl transition-all"
          >
            <option v-for="type in courseTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <div>
          <label
            :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
            class="block text-sm font-medium mb-1"
          >
            {{ t('sort_by') }}
          </label>
          <select
            v-model="sortBy"
            :class="
              props.darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            "
            class="w-full py-2 px-3 border-2 rounded-xl transition-all"
          >
            <option value="recent">{{ t('sort_recent') }}</option>
            <option value="title">{{ t('sort_title') }}</option>
            <option value="hours">{{ t('sort_hours_desc') }}</option>
            <option value="price">{{ t('sort_price_desc') }}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="mb-4 flex justify-between items-center">
      <h2 :class="props.darkMode ? 'text-white' : 'text-gray-800'" class="text-2xl font-bold">
        {{ filteredCourses.length }} {{ t('courses_word') }}
        <span v-if="filteredCourses.length !== courses.length"
          >{{ t('out_of') }} {{ courses.length }}</span
        >
      </h2>
    </div>

    <div
      v-if="filteredCourses.length === 0"
      :class="props.darkMode ? 'bg-gray-800' : 'bg-white'"
      class="rounded-2xl shadow-xl p-12 text-center"
    >
      <p :class="props.darkMode ? 'text-gray-300' : 'text-gray-600'" class="text-lg">
        {{ t('no_course_match_criteria') }}
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <CourseCard
        v-for="course in filteredCourses"
        :key="course.id"
        :course="course"
        :darkMode="props.darkMode"
        :user="props.user"
        @toggle-favorite="toggleFavorite"
        @delete="deleteCourse"
        @edit="openEditModal"
        @view-details="viewDetails"
      />
    </div>

    <CourseModal
      :show="showModal"
      :darkMode="props.darkMode"
      :editing-course="editingCourse"
      @close="closeModal"
      @course-saved="handleCourseSaved"
    />

    <div
      v-if="selectedCourse"
      @click="selectedCourse = null"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div
        @click.stop
        :class="props.darkMode ? 'bg-gray-800' : 'bg-white'"
        class="rounded-2xl shadow-2xl p-6 w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto"
      >
        <div class="flex justify-between items-start mb-4">
          <h3 :class="props.darkMode ? 'text-white' : 'text-gray-900'" class="text-3xl font-bold">
            {{ selectedCourse.title }}
          </h3>
          <button
            @click="selectedCourse = null"
            :class="
              props.darkMode
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-500 hover:text-gray-800'
            "
            class="p-2 rounded-full transition-all"
          >
            <X :size="24" />
          </button>
        </div>

        <p :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'" class="text-lg mb-6">
          {{ selectedCourse.description || t('no_description_available') }}
        </p>

        <div class="grid grid-cols-2 gap-4">
          <div
            :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
            class="flex items-center gap-2"
          >
            <Clock :size="20" />
            <span class="font-semibold"
              >{{ selectedCourse.total_hours }} {{ t('hours_label') }}</span
            >
          </div>
          <div
            :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
            class="flex items-center gap-2"
          >
            <User :size="20" />
            <span class="font-semibold"
              >{{ selectedCourse.max_students }} {{ t('max_seats_label') }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>

  <TeacherListModal
    :show="showTeacherModal"
    :darkMode="darkMode"
    :t="t"
    @close="showTeacherModal = false"
    @teacher-deleted="loadStats"
  />

  <StudentListModal
    :show="showStudentModal"
    :darkMode="darkMode"
    :t="t"
    @close="showStudentModal = false"
    @student-deleted="loadStats"
  />
  <ChangePasswordModal
    :show="showChangePwdModal"
    :dark-mode="darkMode"
    @close="showChangePwdModal = false"
  />
</template>

<style scoped>
.deep-blue-gradient {
  background: linear-gradient(135deg, #012254 0%, #0255ae 35%, #0271d9 70%, #1ba8f4 100%);
}
</style>
