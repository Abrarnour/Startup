<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div
      :class="darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'"
      class="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl m-4"
    >
      <!-- ── Header ── -->
      <div
        class="flex items-center justify-between p-6 border-b"
        :class="darkMode ? 'border-gray-700' : 'border-gray-200'"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold">{{ t('student_list') }}</h2>
            <p class="text-sm" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
              {{ filteredStudents.length }} {{ t('student_count_suffix') }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- ── Orange: إلغاء المعلقين ── -->
          <div class="flex items-center gap-1">
            <button
              @click="openCleanupDialog('pending')"
              class="px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
            >
              {{ t('cleanup_pending_14d') }}
            </button>
            <div class="relative group">
              <button
                class="w-5 h-5 rounded-full bg-orange-200 text-orange-700 text-xs font-bold flex items-center justify-center hover:bg-orange-300 transition-colors cursor-help"
                title="Info"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="8" stroke-linecap="round" stroke-width="3" />
                  <line x1="12" y1="12" x2="12" y2="16" />
                </svg>
              </button>
              <div
                class="absolute right-0 top-7 z-50 w-72 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              >
                <p class="font-bold mb-1 text-orange-300">{{ t('cleanup_pending_14d') }}</p>
                <p>{{ t('info_cleanup_pending') }}</p>
              </div>
            </div>
          </div>

          <!-- ── Red: تنظيف (inactive students) ── -->
          <div class="flex items-center gap-1">
            <button
              @click="openCleanupDialog('inactive')"
              class="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              {{ t('cleanup_inactive') }}
            </button>
            <div class="relative group">
              <button
                class="w-5 h-5 rounded-full bg-red-200 text-red-700 text-xs font-bold flex items-center justify-center hover:bg-red-300 transition-colors cursor-help"
                title="Info"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="8" stroke-linecap="round" stroke-width="3" />
                  <line x1="12" y1="12" x2="12" y2="16" />
                </svg>
              </button>
              <div
                class="absolute right-0 top-7 z-50 w-72 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              >
                <p class="font-bold mb-1 text-red-300">{{ t('cleanup_inactive') }}</p>
                <p>{{ t('info_cleanup_inactive') }}</p>
              </div>
            </div>
          </div>

          <button
            @click="$emit('close')"
            class="p-2 rounded-full hover:bg-gray-100 transition-colors"
            :class="darkMode ? 'hover:bg-gray-800' : ''"
          >
            <X :size="24" />
          </button>
        </div>
      </div>

      <!-- ── Search bar ── -->
      <div class="p-4 border-b" :class="darkMode ? 'border-gray-700' : 'border-gray-200'">
        <div class="relative">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            v-model="search"
            type="text"
            :placeholder="t('search_student')"
            :class="
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-gray-50 border-gray-200 text-gray-900'
            "
            class="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>
      </div>

      <!-- ── Students table ── -->
      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="loading" class="flex flex-col items-center py-12">
          <AppLoader size="80px" color="#9333ea" />
          <p class="mt-4 text-gray-500">{{ t('loading_list') }}</p>
        </div>

        <div v-else-if="filteredStudents.length === 0" class="text-center py-12">
          <p :class="darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-lg">
            {{ t('no_students') }}
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr :class="darkMode ? 'bg-gray-800' : 'bg-gray-50'" class="text-sm font-semibold">
                <th class="text-left p-3 rounded-l-xl">{{ t('student_label') }}</th>
                <th class="text-left p-3">{{ t('email') }}</th>
                <th class="text-left p-3">{{ t('phone') }}</th>
                <th class="text-left p-3">{{ t('enrolled_courses') }}</th>
                <th class="text-left p-3 rounded-r-xl">{{ t('actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y" :class="darkMode ? 'divide-gray-700' : 'divide-gray-100'">
              <tr
                v-for="student in filteredStudents"
                :key="student.id"
                class="hover:opacity-80 transition-opacity"
              >
                <td class="p-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    >
                      {{ student.name[0] }}{{ student.last_name[0] }}
                    </div>
                    <div>
                      <p class="font-semibold text-sm">
                        {{ student.name }} {{ student.last_name }}
                      </p>
                      <p class="text-xs" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
                        {{ student.city || '—' }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="p-3 text-sm" :class="darkMode ? 'text-gray-300' : 'text-gray-600'">
                  {{ student.email }}
                </td>
                <td class="p-3 text-sm" :class="darkMode ? 'text-gray-300' : 'text-gray-600'">
                  {{ student.parent_phone || student.phone || '—' }}
                </td>
                <td class="p-3">
                  <span
                    class="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold"
                  >
                    {{ student.enrolled_courses }} {{ t('courses_label') }}
                  </span>
                </td>
                <td class="p-3 text-right flex justify-end gap-2">
                  <button
                    @click="manageStudentEnrollments(student)"
                    class="px-3 py-1.5 bg-blue-100 hover:bg-blue-500 text-blue-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                  >
                    {{ t('manage_courses') }}
                  </button>
                  <button
                    @click="initiateDelete(student)"
                    class="px-3 py-1.5 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    {{ t('delete_student') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         CLEANUP DAYS DIALOG  (shared for both buttons)
    ══════════════════════════════════════════════ -->
    <div
      v-if="cleanupDialog.open"
      class="absolute inset-0 flex items-center justify-center bg-black/50 z-[80]"
    >
      <div
        :class="darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'"
        class="rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4"
        @click.stop
      >
        <!-- Icon -->
        <div class="flex items-center justify-center mb-5">
          <div
            :class="cleanupDialog.type === 'pending' ? 'bg-orange-100' : 'bg-red-100'"
            class="w-16 h-16 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-8 h-8"
              :class="cleanupDialog.type === 'pending' ? 'text-orange-500' : 'text-red-500'"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
        </div>

        <!-- Title -->
        <h3 class="text-lg font-bold text-center mb-1">
          {{ cleanupDialog.type === 'pending' ? t('cleanup_pending_14d') : t('cleanup_inactive') }}
        </h3>
        <p class="text-sm text-center mb-5" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
          {{
            cleanupDialog.type === 'pending'
              ? 'حدد عدد الأيام — سيتم إلغاء التسجيلات المعلقة الأقدم من هذه المدة'
              : 'حدد عدد الأيام — سيتم حذف الطلاب الغير نشطين الذين تجاوزوا هذه المدة'
          }}
        </p>

        <!-- Days input -->
        <div class="mb-5">
          <label class="block text-sm font-semibold mb-2 text-center">
            {{ t('days_count') }}
          </label>
          <div class="flex items-center gap-3">
            <!-- Quick presets -->
            <div class="flex gap-2 flex-wrap justify-center w-full">
              <button
                v-for="preset in cleanupDialog.type === 'pending' ? [7, 14, 30] : [30, 60, 90]"
                :key="preset"
                @click="cleanupDialog.days = preset"
                :class="[
                  'px-3 py-1 rounded-lg text-sm font-bold transition-all border-2',
                  cleanupDialog.days === preset
                    ? cleanupDialog.type === 'pending'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-red-500 text-white border-red-500'
                    : darkMode
                      ? 'bg-gray-700 text-gray-200 border-gray-600 hover:border-orange-400'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:border-red-300',
                ]"
              >
                {{ preset }} يوم
              </button>
            </div>
          </div>

          <!-- Manual number input -->
          <div class="mt-3 relative">
            <input
              v-model.number="cleanupDialog.days"
              type="number"
              min="1"
              max="365"
              :class="[
                'w-full text-center text-2xl font-bold py-3 px-4 border-2 rounded-xl focus:outline-none transition-all',
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-orange-400'
                  : 'bg-gray-50 border-gray-200 text-gray-900',
                cleanupDialog.type === 'pending'
                  ? 'focus:border-orange-500'
                  : 'focus:border-red-500',
              ]"
              placeholder="{{ t('enter_number') }}"
            />
            <span
              class="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
              :class="darkMode ? 'text-gray-400' : 'text-gray-400'"
            >
              يوم
            </span>
          </div>

          <!-- Warning when days < 7 -->
          <p
            v-if="cleanupDialog.days && cleanupDialog.days < 7"
            class="mt-2 text-xs text-center text-amber-500 font-semibold"
          >
            {{ t('warning_days_low') }}
          </p>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-3">
          <button
            @click="cleanupDialog.open = false"
            :class="
              darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
            "
            class="flex-1 py-3 rounded-xl font-bold border transition-all"
          >
            {{ t('cancel') }}
          </button>
          <button
            @click="executeCleanup"
            :disabled="cleanupDialog.loading || !cleanupDialog.days || cleanupDialog.days < 1"
            :class="[
              'flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed',
              cleanupDialog.type === 'pending'
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-red-500 hover:bg-red-600',
            ]"
          >
            <span v-if="cleanupDialog.loading" class="flex items-center justify-center gap-2">
              <svg
                class="animate-spin w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              جاري التنفيذ...
            </span>
            <span v-else> {{ t('confirm_btn') }} ({{ cleanupDialog.days }} يوم) </span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Delete student confirm dialog ── -->
    <div
      v-if="confirmTarget"
      class="absolute inset-0 flex items-center justify-center bg-black/40 z-10"
    >
      <div
        :class="darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'"
        class="rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
      >
        <div class="text-center mb-6">
          <div
            class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="h-8 w-8 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-bold mb-2">{{ t('confirm_delete') }}</h3>
          <p class="text-sm" :class="darkMode ? 'text-gray-400' : 'text-gray-600'">
            {{ t('confirm_delete_msg') }}
          </p>
          <p class="mt-3 font-bold text-red-500">
            {{ confirmTarget.name }} {{ confirmTarget.last_name }}
          </p>
        </div>
        <div class="flex gap-3">
          <button
            @click="confirmTarget = null"
            class="flex-1 py-3 rounded-xl font-bold border transition-all"
            :class="
              darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
            "
          >
            {{ t('cancel') }}
          </button>
          <button
            @click="confirmDelete"
            :disabled="deleting"
            class="flex-1 py-3 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ deleting ? t('deleting') : t('confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Manage enrollments sub-modal ── -->
    <div
      v-if="managingStudent"
      class="fixed inset-0 flex items-center justify-center bg-black/60 z-[70]"
    >
      <div
        :class="darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'"
        class="rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">
            {{
              t('courses_of_student').replace(
                '{name}',
                managingStudent.name + ' ' + managingStudent.last_name,
              )
            }}
          </h3>
          <button @click="managingStudent = null" class="p-2 bg-gray-200 rounded-full text-black">
            X
          </button>
        </div>

        <div v-if="studentEnrollments.length === 0" class="text-center text-gray-500 py-4">
          {{ t('no_enrolled_courses_ar') }}
        </div>

        <div
          v-for="enr in studentEnrollments"
          :key="enr.enrollment_id"
          class="border rounded-lg p-4 mb-3"
          :class="darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-bold">{{ enr.course_title }} ({{ enr.group_name }})</h4>
              <p class="text-sm mt-1">
                {{ t('status_label') }}
                <span v-if="enr.status === 'inactive'" class="text-orange-500 font-bold">{{
                  t('enrolled_closed_ar')
                }}</span>
                <span v-else-if="enr.payment_status === 'paid'" class="text-green-500 font-bold">{{
                  t('paid_active_ar')
                }}</span>
                <span v-else class="text-yellow-500 font-bold">{{ t('unpaid_active_trust') }}</span>
              </p>
            </div>
            <div class="flex flex-col gap-2">
              <button
                v-if="enr.status === 'inactive' || enr.payment_status === 'pending'"
                @click="updateEnrollment(enr, 'active', 'paid')"
                class="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded hover:bg-green-600"
              >
                {{ t('confirm_payment') }}
              </button>
              <button
                v-if="enr.payment_status === 'paid' || enr.status === 'inactive'"
                @click="updateEnrollment(enr, 'active', 'pending')"
                class="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded hover:bg-yellow-600"
              >
                {{ t('active_unpaid') }}
              </button>
              <button
                v-if="enr.status === 'active'"
                @click="updateEnrollment(enr, 'inactive', 'pending')"
                class="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600"
              >
                {{ t('lock_registered') }}
              </button>
              <button
                @click="deleteEnrollment(enr)"
                class="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600"
              >
                {{ t('cancel_enrollment') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useLanguage } from '../composables/useLanguage.js'
import {
  getAdminStudentsList,
  adminDeleteUser,
  adminCleanupInactiveStudents,
} from '../services/api.js'
import AppLoader from '../components/AppLoader.vue'

const { t } = useLanguage()

const props = defineProps({
  show: { type: Boolean, default: false },
  darkMode: { type: Boolean, default: false },
  t: { type: Function, default: (k) => k },
})

const emit = defineEmits(['close', 'student-deleted'])

// ── State ──────────────────────────────────────────────
const students = ref([])
const search = ref('')
const loading = ref(false)
const confirmTarget = ref(null)
const deleting = ref(false)
const managingStudent = ref(null)
const studentEnrollments = ref([])

// ── Cleanup dialog state ────────────────────────────────
const cleanupDialog = reactive({
  open: false,
  type: 'pending', // 'pending' | 'inactive'
  days: 14,
  loading: false,
})

function openCleanupDialog(type) {
  cleanupDialog.type = type
  cleanupDialog.days = type === 'pending' ? 14 : 60
  cleanupDialog.loading = false
  cleanupDialog.open = true
}

async function executeCleanup() {
  if (!cleanupDialog.days || cleanupDialog.days < 1) return
  cleanupDialog.loading = true

  try {
    if (cleanupDialog.type === 'inactive') {
      // Red button — delete inactive students
      const result = await adminCleanupInactiveStudents(cleanupDialog.days)
      alert(`✅ تم حذف ${result.count} طالب(ة) غير نشط/ة (الأقدم من ${cleanupDialog.days} يوم).`)
      await loadStudents()
    } else {
      // Orange button — cancel pending enrollments
      const token = localStorage.getItem('token')
      const res = await fetch(
        `https://belmahi-school-production.up.railway.app/api/groups/cleanup/pending-enrollments?days=${cleanupDialog.days}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error((await res.json()).error || 'خطأ في الخادم')
      const data = await res.json()
      alert(`✅ تم إزالة ${data.deleted} تسجيل(ات) معلق(ة) (الأقدم من ${cleanupDialog.days} يوم).`)
    }

    cleanupDialog.open = false
  } catch (e) {
    alert('❌ حدث خطأ: ' + e.message)
  } finally {
    cleanupDialog.loading = false
  }
}

// ── Students list ───────────────────────────────────────
const filteredStudents = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return students.value
  return students.value.filter((s) =>
    `${s.name} ${s.last_name} ${s.email} ${s.city || ''} ${s.phone || ''}`
      .toLowerCase()
      .includes(q),
  )
})

async function loadStudents() {
  loading.value = true
  try {
    students.value = await getAdminStudentsList()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.show,
  async (val) => {
    if (val) {
      await loadStudents()
    } else {
      search.value = ''
      confirmTarget.value = null
      cleanupDialog.open = false
    }
  },
)

// ── Delete student ──────────────────────────────────────
const initiateDelete = (student) => {
  confirmTarget.value = student
}

const confirmDelete = async () => {
  if (!confirmTarget.value) return
  deleting.value = true
  try {
    await adminDeleteUser(confirmTarget.value.id)
    students.value = students.value.filter((s) => s.id !== confirmTarget.value.id)
    confirmTarget.value = null
    emit('student-deleted')
  } catch (e) {
    alert(e.message)
  } finally {
    deleting.value = false
  }
}

// ── Enrollment management ───────────────────────────────
const manageStudentEnrollments = async (student) => {
  managingStudent.value = student
  await fetchEnrollments(student.id)
}

const fetchEnrollments = async (studentId) => {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(
      `https://belmahi-school-production.up.railway.app/api/students/${studentId}/admin-enrollments`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    studentEnrollments.value = await res.json()
  } catch (e) {
    console.error(e)
  }
}

const updateEnrollment = async (enr, newStatus, newPayment) => {
  try {
    const token = localStorage.getItem('token')
    await fetch(
      `https://belmahi-school-production.up.railway.app/api/groups/${enr.group_id}/students/${enr.student_id}/state`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, payment_status: newPayment }),
      },
    )
    await fetchEnrollments(managingStudent.value.id)
  } catch (e) {
    alert('خطأ في التحديث')
  }
}

const deleteEnrollment = async (enr) => {
  if (!confirm(t('confirm_unenroll_student'))) return
  try {
    const token = localStorage.getItem('token')
    await fetch(
      `https://belmahi-school-production.up.railway.app/api/groups/${enr.group_id}/students/${enr.student_id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
    )
    await fetchEnrollments(managingStudent.value.id)
  } catch (e) {
    alert('خطأ في الحذف')
  }
}
</script>
