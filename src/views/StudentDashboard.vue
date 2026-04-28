<script setup>
import { ref, onMounted } from 'vue'
import { BookOpen, Calendar, Users, Clock, Lock } from 'lucide-vue-next' // ✅ FIX 1: Lock was missing
import MaterialsListModal from '../components/MaterialsListModal.vue'
import * as api from '../services/api.js'
import { useLanguage } from '../composables/useLanguage.js'
import AppLoader from '../components/AppLoader.vue'
const showMaterialsModal = ref(false)
const selectedCourseId = ref(null)

const openMaterialsModal = (courseId) => {
  console.log('Fetching materials for:', courseId)
  selectedCourseId.value = courseId
  showMaterialsModal.value = true
}

const { t } = useLanguage()

const props = defineProps({
  darkMode: { type: Boolean, default: false },
  user: { type: Object, default: null },
})

// État
const loading = ref(true)
const error = ref(null)
const enrolledCourses = ref([])

// Charger les cours de l'étudiant
const loadCourses = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await fetch(
      'https://belmahi-school-production.up.railway.app/api/students/my-courses',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des cours')
    }

    const data = await response.json()
    enrolledCourses.value = data

    console.log('Courses loaded:', data)
  } catch (err) {
    console.error('Erreur chargement cours:', err)
    error.value = err.message || 'Erreur lors du chargement des cours'
  } finally {
    loading.value = false
  }
}

// Labels des niveaux
const getLevelLabel = (level) => {
  const labels = {
    primaire: t('level_primary_full'),
    moyen: t('level_middle_full'),
    secondaire: t('level_secondary_full'),
  }
  return labels[level] || level
}

// Format teacher name
const formatTeacherName = (course) => {
  if (!course.teacher_name) return t('not_assigned')
  const prefix = course.teacher_gender === 'M' ? t('mister_short') : t('madam_short')
  return `${prefix} ${course.teacher_name} ${course.teacher_last_name || ''}`
}

onMounted(() => {
  loadCourses()
})
</script>

<template>
  <div v-if="loading" class="text-center py-12">
    <AppLoader size="80px" />
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
        <div class="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
          <BookOpen :size="32" class="text-white" />
        </div>
        <div class="flex-1">
          <h1 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-3xl font-bold mb-2">
            {{ t('welcome_comma') }} {{ user?.name }} {{ user?.last_name }}
          </h1>
          <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-lg">
            {{ t('your_enrolled_courses') }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="enrolledCourses.length === 0"
      :class="darkMode ? 'bg-gray-800' : 'bg-white'"
      class="rounded-2xl shadow-xl p-12 text-center"
    >
      <BookOpen
        :size="64"
        :class="darkMode ? 'text-gray-600' : 'text-gray-300'"
        class="mx-auto mb-4"
      />
      <h3 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-2xl font-bold mb-2">
        {{ t('no_enrolled_courses') }}
      </h3>
      <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-lg">
        {{ t('not_enrolled_yet') }}
      </p>
    </div>

    <div v-else>
      <!-- ─── STATS BOX ──────────────────────────────────────────── -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div
          :class="darkMode ? 'bg-gray-800' : 'bg-white'"
          class="rounded-xl shadow-lg p-5 text-center"
        >
          <BookOpen class="mx-auto mb-2 text-blue-500" :size="28" />
          <div :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-2xl font-bold">
            {{ enrolledCourses.length }}
          </div>
          <div :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-xs mt-1">
            {{ t('total_courses_enrolled') }}
          </div>
        </div>
        <div
          :class="darkMode ? 'bg-gray-800' : 'bg-white'"
          class="rounded-xl shadow-lg p-5 text-center"
        >
          <Users class="mx-auto mb-2 text-green-500" :size="28" />
          <div :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-2xl font-bold">
            {{ enrolledCourses.filter((c) => c.payment_status === 'paid').length }}
          </div>
          <div :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-xs mt-1">
            {{ t('courses_paid') }}
          </div>
        </div>
        <div
          :class="darkMode ? 'bg-gray-800' : 'bg-white'"
          class="rounded-xl shadow-lg p-5 text-center"
        >
          <Clock class="mx-auto mb-2 text-orange-500" :size="28" />
          <div :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-2xl font-bold">
            {{ enrolledCourses.filter((c) => c.payment_status !== 'paid').length }}
          </div>
          <div :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-xs mt-1">
            {{ t('courses_pending') }}
          </div>
        </div>
        <div
          :class="darkMode ? 'bg-gray-800' : 'bg-white'"
          class="rounded-xl shadow-lg p-5 text-center"
        >
          <Calendar class="mx-auto mb-2 text-purple-500" :size="28" />
          <div :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-2xl font-bold">
            {{ enrolledCourses.filter((c) => c.enrollment_status === 'active').length }}
          </div>
          <div :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-xs mt-1">
            {{ t('enrolled_courses') }}
          </div>
        </div>
      </div>

      <!-- ─── BOX 1: PAID / ACTIVE COURSES ───────────────────────── -->
      <div :class="darkMode ? 'bg-gray-800' : 'bg-white'" class="rounded-2xl shadow-xl p-6 mb-8">
        <h2
          :class="darkMode ? 'text-white' : 'text-gray-900'"
          class="text-2xl font-bold mb-6 flex items-center gap-3"
        >
          <span class="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
          {{ t('my_paid_courses') }}
        </h2>
        <div
          v-if="enrolledCourses.filter((c) => c.enrollment_status === 'active').length === 0"
          class="text-center py-8 text-gray-400"
        >
          <BookOpen :size="40" class="mx-auto mb-3 opacity-30" />
          <p>{{ t('no_enrolled_courses') }}</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="course in enrolledCourses.filter((c) => c.enrollment_status === 'active')"
            :key="course.course_id"
            :class="darkMode ? 'bg-gray-700' : 'bg-gray-50'"
            class="rounded-xl p-5 border-2 border-transparent hover:border-blue-300 transition-all"
          >
            <div
              :class="{
                'bg-gradient-to-r from-green-500 to-emerald-500':
                  course.education_level === 'primaire',
                'bg-gradient-to-r from-blue-500 to-cyan-500': course.education_level === 'moyen',
                'bg-gradient-to-r from-purple-500 to-pink-500':
                  course.education_level === 'secondaire',
              }"
              class="h-1.5 rounded-full mb-4"
            />
            <h3 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-lg font-bold mb-2">
              {{ course.title }}
            </h3>
            <p :class="darkMode ? 'text-gray-300' : 'text-gray-600'" class="text-sm mb-2">
              {{ formatTeacherName(course) }}
            </p>
            <div
              class="flex items-center gap-2 text-sm mb-3"
              :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
            >
              <Clock :size="14" />
              <span
                >{{ course.day_of_week }} {{ course.session_start_time }}–{{
                  course.session_end_time
                }}</span
              >
            </div>
            <div class="flex items-center justify-between">
              <span
                class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-semibold"
              >
                {{ t('paid_status') }}
              </span>
              <button
                @click="openMaterialsModal(course.course_id)"
                class="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-xs font-bold hover:from-blue-600 hover:to-indigo-700 transition-all"
              >
                {{ t('view_course_materials') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── BOX 2: PENDING / INACTIVE COURSES ──────────────────── -->
      <div
        v-if="enrolledCourses.filter((c) => c.enrollment_status !== 'active').length > 0"
        :class="darkMode ? 'bg-gray-800' : 'bg-white'"
        class="rounded-2xl shadow-xl p-6"
      >
        <h2
          :class="darkMode ? 'text-white' : 'text-gray-900'"
          class="text-2xl font-bold mb-6 flex items-center gap-3"
        >
          <span class="w-3 h-3 rounded-full bg-orange-400 inline-block"></span>
          {{ t('courses_pending') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="course in enrolledCourses.filter((c) => c.enrollment_status !== 'active')"
            :key="course.course_id"
            :class="darkMode ? 'bg-gray-700' : 'bg-gray-50'"
            class="rounded-xl p-5 opacity-80 border-2 border-orange-200"
          >
            <h3 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-lg font-bold mb-2">
              {{ course.title }}
            </h3>
            <p :class="darkMode ? 'text-gray-300' : 'text-gray-600'" class="text-sm mb-3">
              {{ formatTeacherName(course) }}
            </p>
            <div class="flex items-center gap-2">
              <Lock :size="14" class="text-orange-500" />
              <span class="text-xs text-orange-700 font-semibold">
                {{ t('enrolled_awaiting_payment') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ FIX 2: Removed "&&  user" condition — modal must mount even if user prop arrives late -->
    <!-- ✅ FIX 3: user-role uses optional chaining safely -->
    <MaterialsListModal
      v-if="showMaterialsModal"
      :is-open="showMaterialsModal"
      :course-id="selectedCourseId"
      :dark-mode="darkMode"
      :user-role="user?.role"
      @close="showMaterialsModal = false"
    />
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
