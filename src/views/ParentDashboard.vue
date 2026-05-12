<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Users,
  UserPlus,
  BookOpen,
  GraduationCap,
  DollarSign,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  History,
} from 'lucide-vue-next'
import * as api from '../services/api.js'
import AddChildModal from '../components/AddChildModal.vue'
import EnrollChildModal from '../components/EnrollChildModal.vue'
import ChildHistoryModal from '../components/ChildHistoryModal.vue'
import { useLanguage } from '../composables/useLanguage.js' // ⬅️ استيراد اللغة
import AppLoader from '../components/AppLoader.vue'
const { t } = useLanguage() // ⬅️ تفعيل الترجمة

const props = defineProps({
  darkMode: { type: Boolean, default: false },
})
const router = useRouter()
const darkMode = computed(() => props.darkMode)

// ── State ────────────────────────────────────────────────────────
const user = ref(null)
const children = ref([])
const courses = ref([])
const selectedChild = ref(null)
const childCourses = ref([])
const loading = ref(false)
const showAddChildModal = ref(false)
const showEnrollModal = ref(false)
const selectedCourseForEnroll = ref(null)
const activeTab = ref('children')

// History modal
const showHistoryModal = ref(false)
const historyChild = ref(null)
const openHistoryModal = (child) => {
  historyChild.value = child
  showHistoryModal.value = true
}

// Notes: key = `groupId-studentId`
const notesMap = ref({})
const notesLoading = ref(null)
const notesOpen = ref(null)

// ── Labels ───────────────────────────────────────────────────────
// تم تحويل هذه القوائم إلى computed لتتغير تلقائياً مع تغيير اللغة
const educationLevelLabels = computed(() => ({
  primaire: t('level_primary'),
  moyen: t('level_middle'),
  secondaire: t('level_secondary'),
}))

const branchLabels = computed(() => ({
  sciences_experimentales: t('branch_science'),
  mathematiques: t('branch_math'),
  techniques_mathematiques: t('branch_tech_math'),
  gestion_economie: t('branch_management'),
  lettres_philosophie: t('branch_letters'),
  langues_etrangeres: t('branch_languages'),
}))

const noteTypeLabel = computed(() => ({
  general: t('note_type_general'),
  behavior: t('note_type_behavior'),
  progress: t('note_type_progress'),
  attendance: t('note_type_attendance'),
  payment: t('note_type_payment'),
}))

const noteTypeColor = {
  general: 'bg-gray-100 text-gray-700',
  behavior: 'bg-orange-100 text-orange-700',
  progress: 'bg-blue-100 text-blue-700',
  attendance: 'bg-purple-100 text-purple-700',
  payment: 'bg-yellow-100 text-yellow-700',
}

// ── Auth ─────────────────────────────────────────────────────────
const checkAuth = () => {
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')
  if (!token || !userData) {
    router.push('/login')
    return false
  }
  user.value = JSON.parse(userData)
  if (user.value.role !== 'Parent') {
    router.push('/login')
    return false
  }
  return true
}
const route = useRoute()
const levelFilter = ref('')

const filteredCourses = computed(() => {
  if (!levelFilter.value) return courses.value
  return courses.value.filter((c) => c.education_level === levelFilter.value)
})
// ── Loaders ──────────────────────────────────────────────────────
const loadChildren = async () => {
  try {
    loading.value = true
    children.value = await api.getParentChildren()
    if (selectedChild.value) loadChildCourses(selectedChild.value.id)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadPublicCourses = async () => {
  try {
    loading.value = true
    courses.value = await api.getPublicCourses()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadChildCourses = async (childId) => {
  try {
    loading.value = true
    childCourses.value = await api.getChildCourses(childId)
    notesOpen.value = null
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// ── Notes toggle + lazy fetch ─────────────────────────────────────
const toggleNotes = async (enrollment) => {
  const key = `${enrollment.group_id}-${selectedChild.value.id}`
  if (notesOpen.value === key) {
    notesOpen.value = null
    return
  }
  notesOpen.value = key
  if (notesMap.value[key]) return // already loaded
  notesLoading.value = key
  try {
    const result = await api.getStudentNotes(enrollment.group_id, selectedChild.value.id)
    notesMap.value = { ...notesMap.value, [key]: result }
  } catch (e) {
    notesMap.value = { ...notesMap.value, [key]: [] }
  } finally {
    notesLoading.value = null
  }
}

// ── Helpers ───────────────────────────────────────────────────────
const formatTeacherName = (c) => {
  if (!c.teacher_name) return t('not_assigned')
  return `${c.teacher_gender === 'M' ? t('mister_short') : t('madam_short')} ${c.teacher_name} ${c.teacher_last_name}`
}
const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''

const selectChild = (child) => {
  selectedChild.value = child
  loadChildCourses(child.id)
}
const deselectChild = () => {
  selectedChild.value = null
  childCourses.value = []
  notesOpen.value = null
}

const openEnrollModal = (course) => {
  selectedCourseForEnroll.value = course
  showEnrollModal.value = true
}
const handleChildAdded = () => {
  loadChildren()
  showAddChildModal.value = false
}
const handleEnrolled = () => {
  if (selectedChild.value) loadChildCourses(selectedChild.value.id)
  showEnrollModal.value = false
}

const unenrollChild = async (enrollmentId) => {
  if (!confirm(t('confirm_unenroll_child'))) return
  try {
    await api.unenrollChild(selectedChild.value.id, enrollmentId)
    loadChildCourses(selectedChild.value.id)
  } catch (e) {
    alert(t('error_prefix_short') + e.message)
  }
}
const unlinkChild = async (childId) => {
  if (!confirm(t('confirm_unlink_child'))) return
  try {
    await api.unlinkChild(childId)
    loadChildren()
    if (selectedChild.value?.id === childId) deselectChild()
  } catch (e) {
    alert(t('error_prefix_short') + e.message)
  }
}

onMounted(() => {
  if (checkAuth()) {
    loadChildren()
    loadPublicCourses()
    if (route.query.tab === 'courses') activeTab.value = 'courses'
    if (route.query.level) levelFilter.value = route.query.level
  }
})
</script>

<template>
  <div
    :class="props.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'"
    class="min-h-screen"
  >
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2">{{ t('parent_space_welcome') }} {{ user?.name }} 👨‍👩‍👧‍👦</h1>
        <p :class="props.darkMode ? 'text-gray-400' : 'text-gray-600'">
          {{ t('manage_children_enrollments') }}
        </p>
      </div>
      <div class="mb-6">
        <button
          @click="showAddChildModal = true"
          class="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
        >
          <UserPlus :size="20" /> {{ t('add_child_btn') }}
        </button>
      </div>
      <div
        class="mb-6 flex gap-4 border-b-2"
        :class="props.darkMode ? 'border-gray-700' : 'border-gray-200'"
      >
        <button
          @click="activeTab = 'children'"
          :class="
            activeTab === 'children'
              ? 'border-blue-500 text-blue-600'
              : props.darkMode
                ? 'border-transparent text-gray-400'
                : 'border-transparent text-gray-600'
          "
          class="px-6 py-3 font-semibold border-b-2 transition-all flex items-center gap-2"
        >
          <Users :size="20" /> {{ t('my_children_tab') }} ({{ children.length }})
        </button>
        <button
          @click="activeTab = 'courses'"
          :class="
            activeTab === 'courses'
              ? 'border-blue-500 text-blue-600'
              : props.darkMode
                ? 'border-transparent text-gray-400'
                : 'border-transparent text-gray-600'
          "
          class="px-6 py-3 font-semibold border-b-2 transition-all flex items-center gap-2"
        >
          <BookOpen :size="20" /> {{ t('available_courses_tab') }}
        </button>
      </div>

      <div v-if="activeTab === 'children'">
        <div v-if="children.length === 0" class="text-center py-16">
          <Users :size="64" class="mx-auto mb-4 text-gray-400" />
          <p class="text-xl mb-4" :class="props.darkMode ? 'text-gray-400' : 'text-gray-600'">
            {{ t('no_child_registered') }}
          </p>
          <button
            @click="showAddChildModal = true"
            class="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold"
          >
            {{ t('add_first_child') }}
          </button>
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-1 space-y-4">
            <div
              v-for="child in children"
              :key="child.id"
              @click="selectChild(child)"
              :class="[
                selectedChild?.id === child.id
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : props.darkMode
                    ? 'border-gray-700'
                    : 'border-gray-200',
                props.darkMode ? 'bg-gray-800' : 'bg-white',
              ]"
              class="p-5 rounded-xl border-2 cursor-pointer transition-all shadow-lg hover:shadow-xl"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="text-xl font-bold">{{ child.name }} {{ child.last_name }}</h3>
                  <p
                    :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'"
                    class="text-sm mt-1"
                  >
                    {{ child.email }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click.stop="openHistoryModal(child)"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-sm"
                    title="Voir l'historique"
                  >
                    <History :size="14" /> Historique
                  </button>
                  <button
                    @click.stop="unlinkChild(child.id)"
                    class="text-red-400 hover:text-red-600"
                  >
                    <Trash2 :size="18" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-2">
            <div
              v-if="!selectedChild"
              class="text-center py-16"
              :class="props.darkMode ? 'text-gray-500' : 'text-gray-400'"
            >
              <GraduationCap :size="56" class="mx-auto mb-4 opacity-30" />
              <p>{{ t('select_child_to_view_courses') }}</p>
            </div>

            <div v-else>
              <h2 class="text-2xl font-bold mb-5">{{ t('courses_of') }}{{ selectedChild.name }}</h2>

              <div v-if="loading" class="text-center py-10">
                <AppLoader size="120px" />
                <p class="mt-4 text-gray-500">{{ t('loading_courses') }}</p>
              </div>

              <div
                v-else-if="childCourses.length === 0"
                class="text-center py-10 rounded-xl border-2 border-dashed"
                :class="
                  props.darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'
                "
              >
                <BookOpen :size="40" class="mx-auto mb-3 opacity-30" />
                <p>{{ t('no_courses_yet') }}</p>
              </div>

              <div v-else class="space-y-5">
                <div
                  v-for="enrollment in childCourses"
                  :key="enrollment.enrollment_id"
                  class="rounded-xl border-2 overflow-hidden shadow-lg"
                  :class="
                    props.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  "
                >
                  <div class="p-5">
                    <div class="flex justify-between items-start mb-3">
                      <div class="flex-1 pr-3">
                        <h3 class="text-lg font-bold mb-1">{{ enrollment.course_title }}</h3>
                        <p
                          :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'"
                          class="text-sm mb-3"
                        >
                          {{ formatTeacherName(enrollment) }}
                        </p>

                        <div class="flex flex-wrap gap-2">
                          <span
                            class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold"
                          >
                            {{ educationLevelLabels[enrollment.education_level] }} —
                            {{ enrollment.year_level }}{{ t('year_suffix_short') }}
                          </span>
                          <span
                            v-if="enrollment.branch"
                            class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold"
                          >
                            {{ branchLabels[enrollment.branch] }}
                          </span>
                          <span
                            :class="
                              enrollment.payment_status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            "
                            class="px-3 py-1 rounded-full text-xs font-bold"
                          >
                            {{
                              enrollment.payment_status === 'paid'
                                ? t('paid_status_ok')
                                : t('unpaid_status')
                            }}
                          </span>
                        </div>

                        <div
                          v-if="enrollment.payment_status !== 'paid'"
                          class="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <AlertCircle :size="15" class="text-red-500 flex-shrink-0 mt-0.5" />
                          <p class="text-xs text-red-700">
                            {{ t('monthly_cycle_ended') }}
                          </p>
                        </div>
                      </div>
                      <button
                        @click="unenrollChild(enrollment.enrollment_id)"
                        class="text-red-400 hover:text-red-600 flex-shrink-0"
                      >
                        <Trash2 :size="18" />
                      </button>
                    </div>

                    <div class="grid grid-cols-2 gap-2 mb-4">
                      <div
                        :class="props.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
                        class="p-2 rounded-lg"
                      >
                        <p
                          :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'"
                          class="text-xs mb-0.5"
                        >
                          {{ t('group_label') }}
                        </p>
                        <p class="font-semibold text-sm">{{ enrollment.group_name }}</p>
                      </div>
                      <div
                        :class="props.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
                        class="p-2 rounded-lg"
                      >
                        <p
                          :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'"
                          class="text-xs mb-0.5"
                        >
                          {{ t('schedule_label') }}
                        </p>
                        <p class="font-semibold text-xs">
                          {{ enrollment.day_of_week }} {{ enrollment.session_start_time }}–{{
                            enrollment.session_end_time
                          }}
                        </p>
                      </div>
                    </div>

                    <button
                      @click="toggleNotes(enrollment)"
                      :class="
                        props.darkMode
                          ? 'bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-200'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                      "
                      class="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                    >
                      <span class="flex items-center gap-2"
                        ><FileText :size="16" /> {{ t('teacher_notes') }}</span
                      >
                      <component
                        :is="
                          notesOpen === `${enrollment.group_id}-${selectedChild.id}`
                            ? ChevronUp
                            : ChevronDown
                        "
                        :size="16"
                      />
                    </button>
                  </div>

                  <div
                    v-if="notesOpen === `${enrollment.group_id}-${selectedChild.id}`"
                    :class="
                      props.darkMode
                        ? 'bg-indigo-950/20 border-indigo-900'
                        : 'bg-indigo-50 border-indigo-100'
                    "
                    class="border-t-2 px-5 py-4"
                  >
                    <div
                      v-if="notesLoading === `${enrollment.group_id}-${selectedChild.id}`"
                      class="text-center py-4"
                    >
                      <div
                        class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"
                      ></div>
                    </div>

                    <p
                      v-else-if="!notesMap[`${enrollment.group_id}-${selectedChild.id}`]?.length"
                      class="text-sm text-center py-3"
                      :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'"
                    >
                      {{ t('no_notes_yet') }}
                    </p>

                    <div v-else class="space-y-3">
                      <div
                        v-for="note in notesMap[`${enrollment.group_id}-${selectedChild.id}`]"
                        :key="note.id"
                        :class="[
                          props.darkMode
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200',
                          note.is_important ? 'border-l-4 !border-l-orange-400' : '',
                        ]"
                        class="rounded-lg p-4 border shadow-sm"
                      >
                        <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <div class="flex items-center gap-2">
                            <span
                              v-if="note.is_important"
                              class="text-orange-500 text-xs font-bold"
                              >{{ t('important_warning') }}</span
                            >
                            <span
                              :class="noteTypeColor[note.note_type] || 'bg-gray-100 text-gray-700'"
                              class="px-2 py-0.5 rounded-full text-xs font-semibold"
                            >
                              {{ noteTypeLabel[note.note_type] || note.note_type }}
                            </span>
                          </div>
                          <span
                            class="text-xs"
                            :class="props.darkMode ? 'text-gray-500' : 'text-gray-400'"
                            >{{ formatDate(note.created_at) }}</span
                          >
                        </div>
                        <p
                          class="text-sm leading-relaxed"
                          :class="props.darkMode ? 'text-gray-200' : 'text-gray-800'"
                        >
                          {{ note.note_text }}
                        </p>
                        <p
                          class="text-xs mt-2"
                          :class="props.darkMode ? 'text-gray-500' : 'text-gray-400'"
                        >
                          — {{ note.author_name }} {{ note.author_last_name }}
                          <span class="opacity-60"
                            >({{
                              note.author_role === 'admin'
                                ? t('admin_role_label')
                                : t('teacher_role_label')
                            }})</span
                          >
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'courses'">
        <!-- Filter buttons -->
        <div class="flex gap-2 mb-6">
          <button
            v-for="lvl in [
              { key: '', label: t('all_levels') || 'Tous' },
              { key: 'primaire', label: t('level_primary') },
              { key: 'moyen', label: t('level_middle') },
              { key: 'secondaire', label: t('level_secondary') },
            ]"
            :key="lvl.key"
            @click="levelFilter = lvl.key"
            :class="
              levelFilter === lvl.key
                ? 'bg-blue-600 text-white'
                : props.darkMode
                  ? 'bg-gray-700 text-gray-200'
                  : 'bg-gray-100 text-gray-700'
            "
            class="px-4 py-2 rounded-full text-sm font-semibold transition-all"
          >
            {{ lvl.label }}
          </button>
        </div>
        <div v-if="loading" class="text-center py-16">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
        </div>
        <div v-else-if="filteredCourses.length === 0" class="text-center py-16">
          <BookOpen :size="64" class="mx-auto mb-4 text-gray-400" />
          <p class="text-xl" :class="props.darkMode ? 'text-gray-400' : 'text-gray-600'">
            {{ t('no_courses_available') }}
          </p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="course in filteredCourses"
            :key="course.id"
            :class="props.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
            class="rounded-xl shadow-lg border-2 overflow-hidden hover:shadow-2xl transition-all"
          >
            <div
              :class="{
                'bg-gradient-to-r from-green-500 to-emerald-500':
                  course.education_level === 'primaire',
                'bg-gradient-to-r from-blue-500 to-cyan-500': course.education_level === 'moyen',
                'bg-gradient-to-r from-purple-500 to-pink-500':
                  course.education_level === 'secondaire',
              }"
              class="h-2"
            />
            <div class="p-6">
              <h3 class="text-xl font-bold mb-2">{{ course.title }}</h3>
              <p :class="props.darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm mb-3">
                {{ formatTeacherName(course) }}
              </p>
              <div class="flex flex-wrap gap-2 mb-3">
                <span
                  class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold"
                >
                  {{ educationLevelLabels[course.education_level] }} — {{ course.year_level
                  }}{{ t('year_suffix_short') }}
                </span>
                <span
                  v-if="course.branch"
                  class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold"
                >
                  {{ branchLabels[course.branch] }}
                </span>
              </div>
              <p
                v-if="course.description"
                class="text-sm mb-4 line-clamp-2"
                :class="props.darkMode ? 'text-gray-400' : 'text-gray-600'"
              >
                {{ course.description }}
              </p>
              <div class="grid grid-cols-2 gap-2 mb-4">
                <div
                  :class="props.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
                  class="p-2 rounded-lg text-sm flex items-center gap-1"
                >
                  <DollarSign :size="14" />
                  <span
                    :class="!course.price || course.price == 0 ? 'text-green-600' : 'text-blue-700'"
                    class="font-semibold"
                  >
                    {{
                      !course.price || course.price == 0
                        ? t('free')
                        : `${parseFloat(course.price).toLocaleString('fr-DZ')} DA`
                    }}
                  </span>
                </div>
                <div
                  :class="props.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
                  class="p-2 rounded-lg text-sm flex items-center gap-1"
                >
                  <Users :size="14" />{{ course.open_groups || 0 }} {{ t('groups_label') }}
                </div>
              </div>
              <button
                @click="openEnrollModal(course)"
                :disabled="children.length === 0"
                class="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{
                  children.length === 0
                    ? t('add_child_first')
                    : !course.price || course.price == 0
                      ? t('enroll_child_free')
                      : t('enroll_child_paid')
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AddChildModal
      :show="showAddChildModal"
      :dark-mode="darkMode"
      @close="showAddChildModal = false"
      @child-added="handleChildAdded"
    />
    <EnrollChildModal
      :show="showEnrollModal"
      :dark-mode="darkMode"
      :course="selectedCourseForEnroll"
      :children="children"
      @close="showEnrollModal = false"
      @enrolled="handleEnrolled"
    />
    <ChildHistoryModal
      :show="showHistoryModal"
      :dark-mode="darkMode"
      :child="historyChild"
      @close="showHistoryModal = false"
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
