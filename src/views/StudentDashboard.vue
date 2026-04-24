<script setup>
import { ref, onMounted } from 'vue'
import { BookOpen, Calendar, Users, Clock } from 'lucide-vue-next'
import MaterialsListModal from '../components/MaterialsListModal.vue'
import * as api from '../services/api.js'
import { useLanguage } from '../composables/useLanguage.js' // ⬅️ استيراد اللغة

const { t } = useLanguage() // ⬅️ تفعيل دالة الترجمة

const props = defineProps({
  darkMode: { type: Boolean, default: false },
  user: { type: Object, default: null },
})

// État
const loading = ref(true)
const error = ref(null)
const enrolledCourses = ref([])

// ⭐ Materials modal
const showMaterialsModal = ref(false)
const selectedCourseId = ref(null)

// Charger les cours de l'étudiant
const loadCourses = async () => {
  loading.value = true
  error.value = null

  try {
    // Appeler l'API pour récupérer les cours de l'étudiant
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

    console.log('Courses loaded:', data) // Debug
  } catch (err) {
    console.error('Erreur chargement cours:', err)
    error.value = err.message || 'Erreur lors du chargement des cours'
  } finally {
    loading.value = false
  }
}

// ⭐ Open materials modal
const openMaterialsModal = (courseId) => {
  console.log('Opening materials for course:', courseId) // Debug
  selectedCourseId.value = courseId
  showMaterialsModal.value = true
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

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="course in enrolledCourses"
        :key="course.course_id"
        :class="darkMode ? 'bg-gray-800' : 'bg-white'"
        class="rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6"
      >
        <div
          :class="{
            'bg-gradient-to-r from-green-500 to-emerald-500': course.education_level === 'primaire',
            'bg-gradient-to-r from-blue-500 to-cyan-500': course.education_level === 'moyen',
            'bg-gradient-to-r from-purple-500 to-pink-500': course.education_level === 'secondaire',
          }"
          class="h-2 rounded-full mb-4"
        />

        <h3 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-xl font-bold mb-2">
          {{ course.title }}
        </h3>

        <div class="mb-3">
          <span
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800"
          >
            {{ getLevelLabel(course.education_level) }} - {{ course.year_level }}
            {{ t('year_suffix') }}
          </span>
        </div>

        <div
          :class="darkMode ? 'text-gray-300' : 'text-gray-600'"
          class="flex items-center gap-2 mb-3"
        >
          <Users :size="18" />
          <span class="font-semibold">{{ formatTeacherName(course) }}</span>
        </div>

        <div
          :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
          class="flex items-center gap-2 mb-3"
        >
          <Calendar :size="18" />
          <span>{{ course.group_name }}</span>
        </div>

        <div
          v-if="course.day_of_week"
          :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
          class="flex items-center gap-2 mb-4"
        >
          <Clock :size="18" />
          <span>
            {{ course.day_of_week }} - {{ course.session_start_time }} {{ t('to_time') }}
            {{ course.session_end_time }}
          </span>
        </div>

        <p
          v-if="course.description"
          :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
          class="text-sm mb-4 line-clamp-2"
        >
          {{ course.description }}
        </p>

        <div
          v-if="course.enrollment_status === 'inactive'"
          class="mt-4 p-3 bg-orange-100 text-orange-800 rounded-lg text-center text-sm font-bold flex items-center justify-center gap-2"
        >
          <Lock :size="16" />
          مسجل (في انتظار تأكيد الدفع)
        </div>

        <button
          v-else
          @click="openMaterialsModal(course.course_id)"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
        >
          <span class="text-xl">📚</span>
          {{ t('view_course_materials') }}
        </button>

        <div class="mt-3 text-center">
          <span
            :class="{
              'bg-green-100 text-green-800': course.payment_status === 'paid',
              'bg-yellow-100 text-yellow-800':
                course.payment_status === 'pending' && course.enrollment_status === 'active',
              'bg-orange-100 text-orange-800': course.enrollment_status === 'inactive',
            }"
            class="text-xs px-3 py-1 rounded-full font-semibold"
          >
            {{
              course.enrollment_status === 'inactive'
                ? 'مسجل (مغلق)'
                : course.payment_status === 'paid'
                  ? t('paid_status')
                  : 'غير مدفوع (مفعل)'
            }}
          </span>
        </div>
      </div>
    </div>

    <MaterialsListModal
      :is-open="showMaterialsModal"
      :course-id="selectedCourseId"
      :dark-mode="darkMode"
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
