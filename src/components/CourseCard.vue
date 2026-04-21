<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { useLanguage } from '../composables/useLanguage.js' // ⬅️ استيراد نظام اللغة
import {
  Heart,
  User,
  Clock,
  TrendingUp,
  Pencil,
  DollarSign,
  Calendar,
  GraduationCap,
  Users,
} from 'lucide-vue-next'

const { t } = useLanguage() // ⬅️ استدعاء دالة الترجمة

const props = defineProps({
  course: { type: Object, required: true },
  darkMode: { type: Boolean, default: false },
  user: { type: Object, default: null },
})

const emit = defineEmits(['toggle-favorite', 'delete', 'edit', 'view-details'])

// Formater le nom de l'enseignant avec civilité
const teacherFullName = computed(() => {
  if (!props.course.teacher_name) return t('not_assigned')
  const prefix = props.course.teacher_gender === 'M' ? t('mister_short') : t('madam_short')
  return `${prefix} ${props.course.teacher_name} ${props.course.teacher_last_name}`
})

// Traduction dynamique des niveaux (باستخدام computed)
const educationLevelLabels = computed(() => ({
  primaire: t('level_primary'),
  moyen: t('level_middle'),
  secondaire: t('level_secondary'),
}))

// Traduction dynamique des branches
const branchLabels = computed(() => ({
  sciences_experimentales: t('branch_science'),
  mathematiques: t('branch_math'),
  techniques_mathematiques: t('branch_tech_math'),
  gestion_economie: t('branch_management'),
  lettres_philosophie: t('branch_letters'),
  langues_etrangeres: t('branch_languages'),
}))

// Badge de couleur selon le niveau
const levelColor = computed(() => {
  switch (props.course.education_level) {
    case 'primaire':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'moyen':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'secondaire':
      return 'bg-purple-100 text-purple-800 border-purple-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
})

// Label pour le type de cours
const courseTypeLabel = computed(() => {
  return props.course.course_type === 'continuous' ? t('continuous_course') : t('single_session')
})

const courseTypeIcon = computed(() => {
  return props.course.course_type === 'continuous' ? Calendar : GraduationCap
})

// Formater le prix
const formattedPrice = computed(() => {
  if (!props.course.price) return t('free')
  return `${parseFloat(props.course.price).toLocaleString('fr-DZ')} DA`
})

// Compute sessions per week
const sessionsPerWeek = computed(() => {
  if (props.course.course_type === 'one_time') {
    return t('one_session')
  }
  return props.course.sessions_per_week
    ? `${props.course.sessions_per_week} ${t('sessions_per_week_short')}`
    : t('variable')
})

// Compute current students enrolled
const currentStudents = computed(() => {
  return props.course.current_students || 0
})

// Compute max students
const maxStudents = computed(() => {
  return props.course.max_students_per_group || props.course.max_students || 25
})

// Fonctions d'émission
const toggleFavorite = () => emit('toggle-favorite', props.course.id)
const deleteCourse = () => emit('delete', props.course.id)
const editCourse = () => emit('edit', props.course)
const viewDetails = () => {
  // Rediriger vers la page de gestion des groupes
  window.location.href = `/courses/${props.course.id}/groups`
}
</script>
<template>
  <div
    :class="[
      darkMode ? 'bg-gray-800' : 'bg-white',
      course.is_favorite ? 'border-pink-500' : darkMode ? 'border-gray-700' : 'border-gray-100',
    ]"
    class="rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden border-2 cursor-pointer"
  >
    <div
      :class="{
        'bg-gradient-to-r from-green-500 to-emerald-500': course.education_level === 'primaire',
        'bg-gradient-to-r from-blue-500 to-cyan-500': course.education_level === 'moyen',
        'bg-gradient-to-r from-purple-500 to-pink-500': course.education_level === 'secondaire',
      }"
      class="h-2"
    />

    <div class="p-6">
      <div class="flex justify-between items-start mb-4">
        <div class="flex-1">
          <h3 :class="darkMode ? 'text-white' : 'text-gray-800'" class="text-xl font-bold mb-2">
            {{ course.title }}
          </h3>

          <div class="flex flex-wrap gap-2 mb-2">
            <span
              :class="levelColor"
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border"
            >
              {{ educationLevelLabels[course.education_level] }} - {{ course.year_level }}
            </span>

            <span
              v-if="course.branch"
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300"
            >
              {{ branchLabels[course.branch] }}
            </span>
          </div>
        </div>

        <button
          @click.stop="toggleFavorite"
          :class="
            course.is_favorite ? 'text-pink-500' : darkMode ? 'text-gray-600' : 'text-gray-300'
          "
          class="transition-all transform hover:scale-125"
          :title="t('add_to_favorites')"
        >
          <Heart :size="24" :fill="course.is_favorite ? 'currentColor' : 'none'" />
        </button>
      </div>

      <div
        :class="darkMode ? 'text-gray-300' : 'text-gray-600'"
        class="flex items-center gap-2 mb-3"
      >
        <User :size="18" />
        <span class="font-semibold">{{ teacherFullName }}</span>
      </div>

      <p
        v-if="course.description"
        :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
        class="mb-4 text-sm leading-relaxed line-clamp-3"
      >
        {{ course.description }}
      </p>

      <div class="grid grid-cols-2 gap-3 mb-4">
        <div
          :class="darkMode ? 'bg-gray-700' : 'bg-gray-50'"
          class="flex items-center gap-2 px-3 py-2 rounded-lg"
        >
          <component
            :is="courseTypeIcon"
            :size="16"
            :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
          />
          <span :class="darkMode ? 'text-gray-300' : 'text-gray-700'" class="text-xs font-medium">
            {{ courseTypeLabel }}
          </span>
        </div>

        <div
          :class="darkMode ? 'bg-gray-700' : 'bg-gray-50'"
          class="flex items-center gap-2 px-3 py-2 rounded-lg"
        >
          <Clock :size="16" :class="darkMode ? 'text-gray-400' : 'text-gray-500'" />
          <span :class="darkMode ? 'text-gray-300' : 'text-gray-700'" class="text-xs font-medium">
            {{ sessionsPerWeek }}
          </span>
        </div>

        <div
          :class="darkMode ? 'bg-gray-700' : 'bg-gray-50'"
          class="flex items-center gap-2 px-3 py-2 rounded-lg"
        >
          <DollarSign :size="16" :class="darkMode ? 'text-gray-400' : 'text-gray-500'" />
          <span :class="darkMode ? 'text-gray-300' : 'text-gray-700'" class="text-xs font-medium">
            {{ formattedPrice }}
          </span>
        </div>

        <div
          :class="darkMode ? 'bg-gray-700' : 'bg-gray-50'"
          class="flex items-center gap-2 px-3 py-2 rounded-lg"
        >
          <Users :size="16" :class="darkMode ? 'text-gray-400' : 'text-gray-500'" />
          <span :class="darkMode ? 'text-gray-300' : 'text-gray-700'" class="text-xs font-medium">
            {{ currentStudents }}/{{ maxStudents }}
          </span>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          @click.stop="viewDetails"
          class="flex-1 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
        >
          {{ t('view_details') }}
        </button>

        <button
          v-if="user && user.role === 'admin'"
          @click.stop="editCourse"
          :class="
            darkMode
              ? 'bg-amber-900 text-amber-200 hover:bg-amber-800'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          "
          class="p-2 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center"
          :title="t('edit_course_title')"
        >
          <Pencil :size="18" />
        </button>

        <button
          v-if="user && user.role === 'admin'"
          @click.stop="deleteCourse"
          :class="
            darkMode
              ? 'bg-red-900 text-red-200 hover:bg-red-800'
              : 'bg-red-100 text-red-600 hover:bg-red-200'
          "
          class="px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105"
          :title="t('delete_course_title')"
        >
          🗑️
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
