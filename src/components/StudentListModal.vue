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
        <div
          class="flex items-center justify-between p-6 border-b"
          :class="darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-bold">{{ t('student_list') }}</h2>
          </div>

          <div class="flex items-center gap-2">
            <!-- Purge pending > 14 days + info button -->
            <div class="flex items-center gap-1">
              <button
                @click="handleCleanupPending"
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
                <!-- Tooltip -->
                <div
                  class="absolute right-0 top-7 z-50 w-72 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                >
                  <p class="font-bold mb-1 text-orange-300">{{ t('cleanup_pending_14d') }}</p>
                  <p>{{ t('info_cleanup_pending') }}</p>
                </div>
              </div>
            </div>

            <!-- Clean inactive > 60 days + info button -->
            <div class="flex items-center gap-1">
              <button
                @click="handleCleanup"
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
                <!-- Tooltip -->
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
      </div>

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

      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div
            class="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"
          ></div>
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
import { ref, computed, watch } from 'vue'
import { X, Users, Search, Loader2 } from 'lucide-vue-next'
import { useLanguage } from '../composables/useLanguage.js' // ✅ Import Language
import {
  getAdminStudentsList,
  adminDeleteUser,
  adminCleanupInactiveStudents,
} from '../services/api.js'

const handleCleanup = async () => {
  // ⚠️ The Alert Window to make sure
  const confirmed = window.confirm(props.t('confirm_cleanup_msg'))

  if (!confirmed) return

  try {
    loading.value = true
    const result = await adminCleanupInactiveStudents()
    alert(`${props.t('cleanup_success_1')}${result.count}${props.t('cleanup_success_2')}`)

    // Refresh the list after deletion
    await loadStudents()
  } catch (e) {
    alert(props.t('cleanup_error') + e.message)
  } finally {
    loading.value = false
  }
}
const { t } = useLanguage() // ✅ Extract t for translations
const props = defineProps({
  show: { type: Boolean, default: false },
  darkMode: { type: Boolean, default: false },
  t: { type: Function, default: (k) => k },
})

const emit = defineEmits(['close', 'student-deleted'])

const students = ref([])
const search = ref('')
const loading = ref(false)
const confirmTarget = ref(null)
const deleting = ref(false)

const filteredStudents = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return students.value
  return students.value.filter((s) =>
    `${s.name} ${s.last_name} ${s.email} ${s.city || ''} ${s.phone || ''}`
      .toLowerCase()
      .includes(q),
  )
})

const initiateDelete = (student) => {
  confirmTarget.value = student
}

const confirmDelete = async () => {
  if (!confirmTarget.value) return
  deleting.value = true
  try {
    await adminDeleteUser(confirmTarget.value.id)
    // Retirer de la liste locale
    students.value = students.value.filter((s) => s.id !== confirmTarget.value.id)
    confirmTarget.value = null
    emit('student-deleted')
  } catch (e) {
    alert(e.message)
  } finally {
    deleting.value = false
  }
}

watch(
  () => props.show,
  async (val) => {
    if (val) {
      loading.value = true
      try {
        students.value = await getAdminStudentsList()
      } catch (e) {
        console.error(e)
      } finally {
        loading.value = false
      }
    } else {
      search.value = ''
      confirmTarget.value = null
    }
  },
)

const managingStudent = ref(null)
const studentEnrollments = ref([])

const manageStudentEnrollments = async (student) => {
  managingStudent.value = student
  await fetchEnrollments(student.id)
}

const fetchEnrollments = async (studentId) => {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(
      `https://belmahi-school-production.up.railway.app/api/students/${studentId}/admin-enrollments`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
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
    await fetchEnrollments(managingStudent.value.id) // Refresh
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
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    await fetchEnrollments(managingStudent.value.id) // Refresh
  } catch (e) {
    alert('خطأ في الحذف')
  }
}

const handleCleanupPending = async () => {
  if (!confirm(t('confirm_cleanup_pending'))) return
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(
      `https://belmahi-school-production.up.railway.app/api/groups/cleanup/pending-enrollments`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    const data = await res.json()
    alert(`تم إزالة ${data.deleted} تسجيل(ات) بنجاح.`)
  } catch (e) {
    alert('خطأ في التنظيف')
  }
}
</script>
