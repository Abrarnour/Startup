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
import { useLanguage } from '../composables/useLanguage.js'

const { t } = useLanguage()
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
  if (
    !window.confirm('Supprimer cet enseignant ? Ses cours resteront mais sans professeur assigné.')
  )
    return
  try {
    await api.deleteTeacher(teacherId)
    teachersList.value = teachersList.value.filter((t) => t.id !== teacherId)
    await loadStats() // refresh the count in the card
  } catch (err) {
    alert('Erreur: ' + err.message)
  }
}
// Options de filtrage
const educationLevels = [
  { value: 'tous', label: 'Tous les niveaux' },
  { value: 'primaire', label: 'ابتدائي (Primaire)' },
  { value: 'moyen', label: 'متوسط (Collège)' },
  { value: 'secondaire', label: 'ثانوي (Lycée)' },
]

const courseTypes = [
  { value: 'tous', label: 'Tous les types' },
  { value: 'continuous', label: 'Cours continus' },
  { value: 'one_time', label: 'Sessions uniques' },
]

// Computed
const availableYears = computed(() => {
  const options = [{ value: 'tous', label: 'Toutes les années' }]

  if (selectedEducationLevel.value === 'primaire') {
    for (let i = 1; i <= 5; i++) {
      options.push({ value: i, label: `${i}ère année` })
    }
  } else if (selectedEducationLevel.value === 'moyen') {
    for (let i = 1; i <= 4; i++) {
      options.push({ value: i, label: `${i}ème année` })
    }
  } else if (selectedEducationLevel.value === 'secondaire') {
    for (let i = 1; i <= 3; i++) {
      options.push({ value: i, label: `${i}ème année` })
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
    alert('Vous devez être connecté pour ajouter des favoris')
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
    alert('Erreur lors de la gestion des favoris: ' + err.message)
    await loadCourses()
  }
}

const deleteCourse = async (id) => {
  if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
    return
  }

  try {
    await api.deleteCourse(id)
    await loadCourses()
  } catch (err) {
    alert('Erreur: ' + err.message)
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
  <!-- Message de chargement -->
  <div v-if="loading" class="text-center py-12">
    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p :class="props.darkMode ? 'text-white' : 'text-gray-700'" class="mt-4 font-semibold">
      Chargement des cours...
    </p>
  </div>

  <!-- Message d'erreur -->
  <div
    v-else-if="error"
    class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6"
  >
    <p class="font-semibold">❌ Erreur: {{ error }}</p>
    <button
      @click="loadCourses"
      class="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
    >
      Réessayer
    </button>
  </div>

  <!-- Contenu principal -->
  <div v-else>
    <!-- Header avec statistiques -->
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
            <h2 class="text-2xl font-bold mb-1">Tableau de bord</h2>
            <p class="text-blue-100 text-sm">Statistiques globales</p>
          </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Card 1: Cours -->
          <div
            class="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-white/20 transition-all"
          >
            <BookOpen class="mx-auto mb-2" :size="28" />
            <div class="text-2xl font-bold">{{ courses.length }}</div>
            <div class="text-sm text-blue-100">
              Cours {{ user?.role === 'teacher' ? 'assignés' : 'disponibles' }}
            </div>
          </div>

          <!-- Card 2: Étudiants (admin only) -->
          <div
            v-if="user?.role === 'admin'"
            @click="showStudentModal = true"
            class="cursor-pointer hover:scale-105 transition-transform bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-white/20 transition-all"
          >
            <Users class="mx-auto mb-2" :size="28" />
            <div class="text-2xl font-bold">{{ stats.students }}</div>
            <div class="text-sm text-blue-100">Étudiants</div>
            <p class="text-yellow-300 text-xs mt-1 flex items-center gap-1">
              👆 {{ t('click_to_manage') }}
            </p>
          </div>

          <!-- Card 3: Enseignants (admin, clickable) -->
          <div
            v-if="user?.role === 'admin'"
            class="cursor-pointer hover:scale-105 transition-transform bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-white/20 transition-all cursor-pointer"
            @click="showTeacherModal = true"
          >
            <User class="mx-auto mb-2" :size="28" />
            <div class="text-2xl font-bold">{{ stats.teachers }}</div>
            <div class="text-sm text-blue-100">Enseignants</div>
            <p class="text-yellow-300 text-xs mt-1 flex items-center gap-1">
              👆 {{ t('click_to_manage') }}
            </p>
          </div>

          <!-- Card 4: Favoris -->
          <div
            class="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-white/20 transition-all"
          >
            <Heart class="mx-auto mb-2" :size="28" />
            <div class="text-2xl font-bold">{{ favoriteCount }}</div>
            <div class="text-sm text-blue-100">Favoris</div>
          </div>
        </div>
      </div>
    </header>

    <!-- Barre de recherche et filtres -->
    <div
      :class="props.darkMode ? 'bg-gray-800' : 'bg-white'"
      class="rounded-2xl shadow-xl p-6 mb-8"
    >
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex-1 min-w-64 relative">
          <Search class="absolute left-3 top-3 text-gray-400" :size="20" />
          <input
            type="text"
            placeholder="Rechercher un cours..."
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
          {{ showFilters ? 'Masquer' : 'Filtres' }}
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
          <span>{{ showOnlyFavorites ? 'Tous' : 'Favoris' }}</span>
        </button>

        <button
          v-if="props.user && props.user.role === 'admin'"
          @click="openAddModal"
          class="flex items-center gap-2 px-6 py-3 bg-[#0056b3] text-white rounded-xl font-bold hover:bg-[#004494] transition-all shadow-lg"
        >
          <Plus :size="20" />
          Ajouter un cours
        </button>
      </div>

      <!-- Filtres -->
      <div v-if="showFilters" class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div>
          <label
            :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
            class="block text-sm font-medium mb-1"
          >
            Niveau
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
            Année
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
            Type
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
            Trier par
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
            <option value="recent">Plus récent</option>
            <option value="title">Titre</option>
            <option value="hours">Heures (↓)</option>
            <option value="price">Prix (↓)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Liste des cours -->
    <div class="mb-4 flex justify-between items-center">
      <h2 :class="props.darkMode ? 'text-white' : 'text-gray-800'" class="text-2xl font-bold">
        📚 {{ filteredCourses.length }} cours
        <span v-if="filteredCourses.length !== courses.length">sur {{ courses.length }}</span>
      </h2>
    </div>

    <div
      v-if="filteredCourses.length === 0"
      :class="props.darkMode ? 'bg-gray-800' : 'bg-white'"
      class="rounded-2xl shadow-xl p-12 text-center"
    >
      <p :class="props.darkMode ? 'text-gray-300' : 'text-gray-600'" class="text-lg">
        Aucun cours ne correspond à vos critères.
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

    <!-- Modal d'ajout/modification -->
    <CourseModal
      :show="showModal"
      :darkMode="props.darkMode"
      :editing-course="editingCourse"
      @close="closeModal"
      @course-saved="handleCourseSaved"
    />

    <!-- Modal de détails -->
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
          {{ selectedCourse.description || 'Aucune description disponible' }}
        </p>

        <div class="grid grid-cols-2 gap-4">
          <div
            :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
            class="flex items-center gap-2"
          >
            <Clock :size="20" />
            <span class="font-semibold">{{ selectedCourse.total_hours }} Heures</span>
          </div>
          <div
            :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
            class="flex items-center gap-2"
          >
            <User :size="20" />
            <span class="font-semibold">{{ selectedCourse.max_students }} Places max</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- ══ Teacher Management Modal ══ -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showTeacherModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="showTeacherModal = false"
      >
        <div
          :class="darkMode ? 'bg-gray-800' : 'bg-white'"
          class="rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
          @click.stop
        >
          <!-- Header -->
          <div
            class="sticky top-0 z-10 flex items-center justify-between p-5 border-b"
            :class="darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
          >
            <div class="flex items-center gap-3">
              <div class="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Users :size="22" class="text-white" />
              </div>
              <div>
                <h2 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-xl font-bold">
                  Gestion des Enseignants
                </h2>
                <p :class="darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-sm">
                  {{ teachersList.length }} enseignant(s) enregistré(s)
                </p>
              </div>
            </div>
            <button
              @click="showTeacherModal = false"
              :class="
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              "
              class="p-2 rounded-lg transition-colors"
            >
              <X :size="22" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-5">
            <!-- Loading -->
            <div v-if="teachersLoading" class="text-center py-8">
              <div
                class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"
              ></div>
              <p :class="darkMode ? 'text-gray-300' : 'text-gray-600'">Chargement...</p>
            </div>

            <!-- Empty -->
            <div v-else-if="teachersList.length === 0" class="text-center py-8">
              <User :size="48" class="mx-auto mb-3 text-gray-400" />
              <p :class="darkMode ? 'text-gray-400' : 'text-gray-500'">Aucun enseignant trouvé</p>
            </div>

            <!-- List -->
            <div v-else class="space-y-3">
              <div
                v-for="teacher in teachersList"
                :key="teacher.id"
                :class="darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'"
                class="flex items-center justify-between p-4 rounded-xl border-2"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm"
                  >
                    {{ (teacher.name || '?').charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p
                      :class="darkMode ? 'text-white' : 'text-gray-900'"
                      class="font-semibold text-sm"
                    >
                      {{ teacher.gender === 'F' ? 'Mme.' : 'Mr.' }} {{ teacher.name }}
                      {{ teacher.last_name }}
                    </p>
                    <p :class="darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-xs">
                      {{ teacher.email }}
                    </p>
                  </div>
                </div>
                <button
                  @click="handleDeleteTeacher(teacher.id)"
                  class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer cet enseignant"
                >
                  <Trash2 :size="18" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
  <TeacherListModal
    :show="showTeacherModal"
    :darkMode="darkMode"
    :t="t"
    @close="showTeacherModal = false"
  />

  <StudentListModal
    :show="showStudentModal"
    :darkMode="darkMode"
    :t="t"
    @close="showStudentModal = false"
    @student-deleted="loadStats"
  />
</template>

<style scoped>
.deep-blue-gradient {
  background: linear-gradient(135deg, #012254 0%, #0255ae 35%, #0271d9 70%, #1ba8f4 100%);
}
</style>
