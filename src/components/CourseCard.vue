<script setup>
import { defineProps, defineEmits, computed } from 'vue'
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

const props = defineProps({
  course: { type: Object, required: true },
  darkMode: { type: Boolean, default: false },
  user: { type: Object, default: null },
})

const emit = defineEmits(['toggle-favorite', 'delete', 'edit', 'view-details'])

// Formater le nom de l'enseignant avec civilité
const teacherFullName = computed(() => {
  if (!props.course.teacher_name) return 'Non assigné'
  const prefix = props.course.teacher_gender === 'M' ? 'Mr.' : 'Mme.'
  return `${prefix} ${props.course.teacher_name} ${props.course.teacher_last_name}`
})

// Traduction des niveaux
const educationLevelLabels = {
  primaire: 'ابتدائي',
  moyen: 'متوسط',
  secondaire: 'ثانوي',
}

const branchLabels = {
  sciences_experimentales: 'علوم تجريبية',
  mathematiques: 'رياضيات',
  techniques_mathematiques: 'تقني رياضي',
  gestion_economie: 'تسيير واقتصاد',
  lettres_philosophie: 'آداب وفلسفة',
  langues_etrangeres: 'لغات أجنبية',
}

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
  return props.course.course_type === 'continuous' ? 'Cours continu' : 'Session unique'
})

const courseTypeIcon = computed(() => {
  return props.course.course_type === 'continuous' ? Calendar : GraduationCap
})

// Formater le prix
const formattedPrice = computed(() => {
  if (!props.course.price) return 'Gratuit'
  return `${parseFloat(props.course.price).toLocaleString('fr-DZ')} DA`
})

// Compute sessions per week
const sessionsPerWeek = computed(() => {
  if (props.course.course_type === 'one_time') {
    return '1 séance'
  }
  // Get from database or calculate from groups
  return props.course.sessions_per_week
    ? `${props.course.sessions_per_week} séances/sem`
    : 'Variable'
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
    <!-- Barre supérieure avec dégradé selon niveau -->
    <div
      :class="{
        'bg-gradient-to-r from-green-500 to-emerald-500': course.education_level === 'primaire',
        'bg-gradient-to-r from-blue-500 to-cyan-500': course.education_level === 'moyen',
        'bg-gradient-to-r from-purple-500 to-pink-500': course.education_level === 'secondaire',
      }"
      class="h-2"
    />

    <div class="p-6">
      <!-- En-tête : Titre + Badge Niveau + Favori -->
      <div class="flex justify-between items-start mb-4">
        <div class="flex-1">
          <h3 :class="darkMode ? 'text-white' : 'text-gray-800'" class="text-xl font-bold mb-2">
            {{ course.title }}
          </h3>

          <!-- Badge du niveau éducatif -->
          <div class="flex flex-wrap gap-2 mb-2">
            <span
              :class="levelColor"
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border"
            >
              {{ educationLevelLabels[course.education_level] }} - {{ course.year_level }}ème
            </span>

            <!-- Badge branche (si secondaire 2ème/3ème année) -->
            <span
              v-if="course.branch"
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300"
            >
              {{ branchLabels[course.branch] }}
            </span>
          </div>
        </div>

        <!-- Bouton Favori -->
        <button
          @click.stop="toggleFavorite"
          :class="
            course.is_favorite ? 'text-pink-500' : darkMode ? 'text-gray-600' : 'text-gray-300'
          "
          class="transition-all transform hover:scale-125"
          title="Ajouter aux favoris"
        >
          <Heart :size="24" :fill="course.is_favorite ? 'currentColor' : 'none'" />
        </button>
      </div>

      <!-- Enseignant -->
      <div
        :class="darkMode ? 'text-gray-300' : 'text-gray-600'"
        class="flex items-center gap-2 mb-3"
      >
        <User :size="18" />
        <span class="font-semibold">{{ teacherFullName }}</span>
      </div>

      <!-- Description (limitée à 3 lignes) -->
      <p
        v-if="course.description"
        :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
        class="mb-4 text-sm leading-relaxed line-clamp-3"
      >
        {{ course.description }}
      </p>

      <!-- Informations complémentaires -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <!-- Type de cours -->
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

        <!-- Séances par semaine -->
        <div
          :class="darkMode ? 'bg-gray-700' : 'bg-gray-50'"
          class="flex items-center gap-2 px-3 py-2 rounded-lg"
        >
          <Clock :size="16" :class="darkMode ? 'text-gray-400' : 'text-gray-500'" />
          <span :class="darkMode ? 'text-gray-300' : 'text-gray-700'" class="text-xs font-medium">
            {{ sessionsPerWeek }}
          </span>
        </div>

        <!-- Prix -->
        <div
          :class="darkMode ? 'bg-gray-700' : 'bg-gray-50'"
          class="flex items-center gap-2 px-3 py-2 rounded-lg"
        >
          <DollarSign :size="16" :class="darkMode ? 'text-gray-400' : 'text-gray-500'" />
          <span :class="darkMode ? 'text-gray-300' : 'text-gray-700'" class="text-xs font-medium">
            {{ formattedPrice }}
          </span>
        </div>

        <!-- Places disponibles / Étudiants -->
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

      <!-- Boutons d'action -->
      <div class="flex gap-2">
        <!-- Voir détails -->
        <button
          @click.stop="viewDetails"
          class="flex-1 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
        >
          Voir détails
        </button>

        <!-- Modifier (admin uniquement) -->
        <button
          v-if="user && user.role === 'admin'"
          @click.stop="editCourse"
          :class="
            darkMode
              ? 'bg-amber-900 text-amber-200 hover:bg-amber-800'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          "
          class="p-2 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center"
          title="Modifier ce cours"
        >
          <Pencil :size="18" />
        </button>

        <!-- Supprimer (admin uniquement) -->
        <button
          v-if="user && user.role === 'admin'"
          @click.stop="deleteCourse"
          :class="
            darkMode
              ? 'bg-red-900 text-red-200 hover:bg-red-800'
              : 'bg-red-100 text-red-600 hover:bg-red-200'
          "
          class="px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105"
          title="Supprimer ce cours"
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
