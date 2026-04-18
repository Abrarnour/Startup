<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BookOpen, Users, LogIn, GraduationCap } from 'lucide-vue-next'
import * as api from '../services/api.js'

const router = useRouter()

const props = defineProps({
  darkMode: { type: Boolean, default: false },
})

const courses = ref([])
const loading = ref(true)
const selectedLevel = ref('tous')

// Structure des niveaux
const educationLevels = {
  tous: { label: 'جميع المستويات (Tous les niveaux)', icon: '🎓' },
  primaire: { label: 'الابتدائي (Primaire)', icon: '📚', years: 5 },
  moyen: { label: 'المتوسط (Collège)', icon: '📖', years: 4 },
  secondaire: { label: 'الثانوي (Lycée)', icon: '🎯', years: 3 },
}

const branchLabels = {
  sciences_experimentales: 'علوم تجريبية',
  mathematiques: 'رياضيات',
  techniques_mathematiques: 'تقني رياضي',
  gestion_economie: 'تسيير واقتصاد',
  lettres_philosophie: 'آداب وفلسفة',
  langues_etrangeres: 'لغات أجنبية',
}

// Computed
const coursesByLevel = computed(() => {
  if (selectedLevel.value === 'tous') {
    return {
      primaire: courses.value.filter((c) => c.education_level === 'primaire'),
      moyen: courses.value.filter((c) => c.education_level === 'moyen'),
      secondaire: courses.value.filter((c) => c.education_level === 'secondaire'),
    }
  } else {
    return {
      [selectedLevel.value]: courses.value.filter((c) => c.education_level === selectedLevel.value),
    }
  }
})

const loadCourses = async () => {
  try {
    loading.value = true
    const data = await api.getPublicCourses()
    courses.value = data
  } catch (err) {
    console.error('Erreur chargement cours:', err)
  } finally {
    loading.value = false
  }
}

const getLevelColor = (level) => {
  const colors = {
    primaire: 'from-green-500 to-emerald-500',
    moyen: 'from-blue-500 to-cyan-500',
    secondaire: 'from-purple-500 to-pink-500',
  }
  return colors[level] || 'from-gray-500 to-gray-600'
}

const goToLogin = () => {
  router.push('/login')
}

onMounted(() => {
  loadCourses()
})
</script>

<template>
  <div v-if="loading" class="text-center py-12">
    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>

  <div v-else>
    <!-- Header -->
    <div :class="darkMode ? 'bg-gray-800' : 'bg-white'" class="rounded-2xl shadow-xl p-8 mb-8">
      <div class="text-center max-w-3xl mx-auto">
        <div
          class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4"
        >
          <BookOpen :size="40" class="text-white" />
        </div>
        <h1 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-4xl font-bold mb-4">
          دوراتنا التعليمية
        </h1>
        <p :class="darkMode ? 'text-gray-300' : 'text-gray-600'" class="text-lg mb-6">
          اكتشف جميع الدورات المتاحة في مدرستنا من الابتدائي إلى الثانوي
        </p>

        <div
          :class="darkMode ? 'bg-blue-900/20' : 'bg-blue-50'"
          class="rounded-xl p-6 border-2 border-blue-500/30"
        >
          <p
            :class="darkMode ? 'text-blue-200' : 'text-blue-800'"
            class="text-lg font-semibold mb-4"
          >
            💡 هل أعجبك أحد هذه الدورات؟
          </p>
          <p :class="darkMode ? 'text-blue-300' : 'text-blue-700'" class="mb-4">
            للتسجيل أو معرفة المزيد من التفاصيل، يرجى تسجيل الدخول إلى حسابك
          </p>
          <button
            @click="goToLogin"
            class="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <LogIn :size="24" />
            تسجيل الدخول
          </button>
        </div>
      </div>
    </div>

    <!-- Filtres par niveau -->
    <div class="flex flex-wrap gap-3 mb-8 justify-center">
      <button
        v-for="(info, level) in educationLevels"
        :key="level"
        @click="selectedLevel = level"
        :class="[
          selectedLevel === level
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-105'
            : darkMode
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              : 'bg-white text-gray-700 hover:bg-gray-50',
          'px-6 py-3 rounded-xl font-bold transition-all transform shadow-lg',
        ]"
      >
        <span class="mr-2">{{ info.icon }}</span>
        {{ info.label }}
      </button>
    </div>

    <!-- Cours groupés par niveau -->
    <div class="space-y-12">
      <div
        v-for="(levelCourses, level) in coursesByLevel"
        :key="level"
        v-show="levelCourses.length > 0"
      >
        <!-- En-tête du niveau -->
        <div class="flex items-center gap-4 mb-6">
          <div :class="`bg-gradient-to-r ${getLevelColor(level)} w-2 h-16 rounded-full`"></div>
          <div>
            <h2 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-3xl font-bold">
              {{ educationLevels[level].label }}
            </h2>
            <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm">
              {{ levelCourses.length }} cours disponibles
            </p>
          </div>
        </div>

        <!-- Grille des cours -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="course in levelCourses"
            :key="course.id"
            :class="darkMode ? 'bg-gray-800' : 'bg-white'"
            class="rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden border-2"
            :style="{ borderColor: 'transparent' }"
          >
            <!-- Barre de couleur -->
            <div :class="`h-2 bg-gradient-to-r ${getLevelColor(course.education_level)}`"></div>

            <div class="p-6">
              <!-- Titre et badge -->
              <div class="mb-4">
                <h3
                  :class="darkMode ? 'text-white' : 'text-gray-900'"
                  class="text-xl font-bold mb-2"
                >
                  {{ course.title }}
                </h3>
                <div class="flex flex-wrap gap-2">
                  <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                    {{ educationLevels[course.education_level].label.split('(')[0].trim() }} -
                    {{ course.year_level }}ème
                  </span>
                  <span
                    v-if="course.branch"
                    class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold"
                  >
                    {{ branchLabels[course.branch] }}
                  </span>
                </div>
              </div>

              <!-- Enseignant -->
              <div
                :class="darkMode ? 'text-gray-300' : 'text-gray-600'"
                class="flex items-center gap-2 mb-3"
              >
                <GraduationCap :size="18" />
                <span class="font-semibold">
                  {{ course.teacher_gender === 'M' ? 'Mr.' : 'Mme.' }}
                  {{ course.teacher_name }} {{ course.teacher_last_name }}
                </span>
              </div>

              <!-- Description -->
              <p
                v-if="course.description"
                :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                class="text-sm mb-4 line-clamp-3"
              >
                {{ course.description }}
              </p>

              <!-- Infos -->
              <div class="flex items-center justify-between mb-4 text-sm">
                <div
                  :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                  class="flex items-center gap-2"
                >
                  <Users :size="16" />
                  <span>{{ course.open_groups }} groupes ouverts</span>
                </div>
                <span
                  v-if="course.price === 0 || course.price === null"
                  class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold"
                >
                  🆓 GRATUIT
                </span>
                <span
                  v-else
                  class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold"
                >
                  {{ parseFloat(course.price).toLocaleString('fr-DZ') }} DA
                </span>
              </div>

              <!-- Bouton -->
              <button
                @click="goToLogin"
                :class="darkMode ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-600'"
                class="w-full py-3 bg-gradient-to-r text-white rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105"
              >
                تسجيل الدخول للتسجيل
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Message si aucun cours -->
    <div
      v-if="courses.length === 0"
      :class="darkMode ? 'bg-gray-800' : 'bg-white'"
      class="rounded-2xl shadow-xl p-12 text-center"
    >
      <BookOpen
        :size="64"
        :class="darkMode ? 'text-gray-600' : 'text-gray-300'"
        class="mx-auto mb-4"
      />
      <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-lg">
        Aucun cours disponible pour le moment
      </p>
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
