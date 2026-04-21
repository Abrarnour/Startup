<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { X, Users, Calendar, Clock, MapPin, DollarSign } from 'lucide-vue-next'
import * as api from '../services/api.js'
import { useLanguage } from '../composables/useLanguage.js' // ✅ Import Language

const { t } = useLanguage() // ✅ Extract t for translations

const props = defineProps({
  show: { type: Boolean, default: false },
  darkMode: { type: Boolean, default: false },
  course: { type: Object, default: null },
  children: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'enrolled'])

// État
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const selectedChild = ref(null)
const selectedGroup = ref(null)
const groups = ref([])

// Formater le nom de l'enseignant
const teacherFullName = computed(() => {
  if (!props.course) return ''
  const prefix = props.course.teacher_gender === 'M' ? t('mister_short') : t('madam_short')
  return `${prefix} ${props.course.teacher_name} ${props.course.teacher_last_name}`
})

// Formater le prix
const formattedPrice = computed(() => {
  if (!props.course || !props.course.price) return t('free')
  return `${parseFloat(props.course.price).toLocaleString('fr-DZ')} DA`
})

// Charger les groupes du cours
const loadGroups = async () => {
  if (!props.course) return

  try {
    loading.value = true
    const result = await api.getCourseGroups(props.course.id)
    // Filtrer seulement les groupes ouverts aux inscriptions
    groups.value = result.filter((g) => g.registration_open && g.is_active)
  } catch (err) {
    error.value = t('error')
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Formater les informations du groupe
const formatGroupInfo = (group) => {
  if (props.course.course_type === 'continuous') {
    // Assuming days of week are translated in standard format or API, otherwise standard day fallback
    const dayLabelsLocal = {
      sunday: 'الأحد (Dimanche)',
      monday: 'الإثنين (Lundi)',
      tuesday: 'الثلاثاء (Mardi)',
      wednesday: 'الأربعاء (Mercredi)',
      thursday: 'الخميس (Jeudi)',
      friday: 'الجمعة (Vendredi)',
      saturday: 'السبت (Samedi)',
    }
    return `${dayLabelsLocal[group.day_of_week] || group.day_of_week} - ${group.session_start_time} ${t('to_time')} ${group.session_end_time}`
  } else {
    const date = new Date(group.start_date).toLocaleDateString('fr-FR')
    return `${date} - ${group.start_time} ${t('to_time')} ${group.end_time}`
  }
}

// Places disponibles
const availableSeats = (group) => {
  return props.course.max_students_per_group - group.current_students
}

// Inscrire l'enfant
const handleEnroll = async () => {
  error.value = ''
  successMessage.value = ''

  if (!selectedChild.value) {
    error.value = t('select_child_error')
    return
  }

  if (!selectedGroup.value) {
    error.value = t('select_group_error')
    return
  }

  loading.value = true

  try {
    await api.enrollChild(selectedChild.value, selectedGroup.value)
    successMessage.value = t('enroll_success')
    setTimeout(() => {
      emit('enrolled')
      closeModal()
    }, 1500)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Fermer la modal
const closeModal = () => {
  selectedChild.value = null
  selectedGroup.value = null
  error.value = ''
  successMessage.value = ''
  emit('close')
}

// Charger les groupes quand la modal s'ouvre
onMounted(() => {
  if (props.show && props.course) {
    loadGroups()
  }
})

// Recharger si le cours change
const watchCourse = computed(() => props.course?.id)
const watchShow = computed(() => props.show)

watch([watchCourse, watchShow], ([newCourseId, newShow]) => {
  if (newShow && newCourseId) {
    loadGroups()
  }
})
</script>

<template>
  <div
    v-if="show && course"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
    @click.self="closeModal"
  >
    <div
      :class="darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'"
      class="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-8 m-4"
    >
      <button
        @click="closeModal"
        :class="darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'"
        class="absolute top-4 right-4 transition-colors"
      >
        <X :size="24" />
      </button>

      <h2 class="text-3xl font-bold mb-6">{{ t('enroll_child_title') }}</h2>

      <div
        :class="darkMode ? 'bg-gray-800' : 'bg-gray-50'"
        class="rounded-xl p-6 mb-6 border-2 border-blue-500"
      >
        <h3 class="text-2xl font-bold mb-2">{{ course.title }}</h3>
        <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="mb-3">
          {{ teacherFullName }}
        </p>
        <div class="flex flex-wrap gap-2 mb-3">
          <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            {{ t(`level_${course.education_level}`) }} - {{ course.year_level
            }}{{ t('year_suffix_short') }}
          </span>
          <span
            v-if="course.branch"
            class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold"
          >
            {{ t(`branch_${course.branch}`) || course.branch }}
          </span>
          <span
            class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-1"
          >
            <DollarSign :size="14" />
            {{ formattedPrice }}
          </span>
        </div>
        <p
          v-if="course.description"
          :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
          class="text-sm"
        >
          {{ course.description }}
        </p>
      </div>

      <div v-if="error" class="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
        {{ error }}
      </div>
      <div
        v-if="successMessage"
        class="mb-4 p-4 bg-green-100 text-green-700 rounded-lg border border-green-300"
      >
        {{ successMessage }}
      </div>

      <div class="mb-6">
        <label class="block mb-3 font-semibold text-lg flex items-center gap-2">
          <Users :size="20" />
          {{ t('select_your_child') }}
        </label>

        <div v-if="children.length === 0" class="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
          {{ t('no_children_registered') }}
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            v-for="child in children"
            :key="child.id"
            @click="selectedChild = child.id"
            :class="[
              selectedChild === child.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                : darkMode
                  ? 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                  : 'border-gray-300 bg-white hover:bg-gray-50',
            ]"
            class="p-4 rounded-lg border-2 transition-all text-left"
          >
            <p class="font-bold text-lg">{{ child.name }} {{ child.last_name }}</p>
            <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm">
              {{ child.email }}
            </p>
          </button>
        </div>
      </div>

      <div v-if="selectedChild" class="mb-6">
        <label class="block mb-3 font-semibold text-lg flex items-center gap-2">
          <Calendar :size="20" />
          {{ t('choose_group_schedule') }}
        </label>

        <div v-if="loading" class="text-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p class="mt-4 text-gray-500">{{ t('loading_groups') }}</p>
        </div>

        <div v-else-if="groups.length === 0" class="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
          {{ t('no_groups_available') }}
        </div>

        <div v-else class="space-y-3">
          <button
            v-for="group in groups"
            :key="group.id"
            @click="selectedGroup = group.id"
            :class="[
              selectedGroup === group.id
                ? 'border-green-500 bg-green-50 dark:bg-green-900'
                : darkMode
                  ? 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                  : 'border-gray-300 bg-white hover:bg-gray-50',
            ]"
            class="w-full p-4 rounded-lg border-2 transition-all text-left"
          >
            <div class="flex justify-between items-start mb-2">
              <p class="font-bold text-lg">{{ group.group_name }}</p>
              <span
                :class="
                  availableSeats(group) > 5
                    ? 'bg-green-100 text-green-800'
                    : availableSeats(group) > 0
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                "
                class="px-2 py-1 rounded-full text-xs font-semibold"
              >
                {{ availableSeats(group) }} {{ t('available_seats') }}
              </span>
            </div>
            <div
              class="flex items-center gap-2 text-sm"
              :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
            >
              <Clock :size="16" />
              {{ formatGroupInfo(group) }}
            </div>
            <div
              v-if="course.salle"
              class="flex items-center gap-2 text-sm mt-1"
              :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
            >
              <MapPin :size="16" />
              {{ course.salle }}
            </div>
          </button>
        </div>
      </div>

      <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
        <p class="text-sm text-green-700 font-semibold" v-html="t('free_course_notice')"></p>
      </div>

      <button
        v-if="children.length > 0"
        @click="handleEnroll"
        :disabled="loading || !selectedChild || !selectedGroup"
        class="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? t('enroll_in_progress') : t('enroll_child_free') }}
      </button>
    </div>
  </div>
</template>
