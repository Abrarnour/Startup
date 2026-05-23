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
                <td class="p-3 text-right flex justify-end gap-2 flex-wrap">
                  <button
                    @click="manageStudentEnrollments(student)"
                    class="px-3 py-1.5 bg-blue-100 hover:bg-blue-500 text-blue-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                  >
                    {{ t('manage_courses') }}
                  </button>
                  <!-- ✅ NEW: Print student ID card -->
                  <button
                    @click="printStudentCard(student)"
                    class="px-3 py-1.5 bg-green-100 hover:bg-green-500 text-green-600 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    title="Imprimer la carte de l'étudiant"
                  >
                    {{ t('print_card') || 'Imprimer la carte' }}
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
          {{ cleanupDialog.type === 'pending' ? t('cleanup_pending_14') : t('cleanup_inactiv') }}
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
                {{ preset }} {{ t('day') }}
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
              :placeholder="t('enter_number')"
            />
            <span
              class="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
              :class="darkMode ? 'text-gray-400' : 'text-gray-400'"
            >
              {{ t('day') }}
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
              {{ t('processing') }}
            </span>
            <span v-else>{{ t('confirm_btn') }} ({{ cleanupDialog.days }} {{ t('day') }})</span>
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
            <X :size="18" />
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

// ─── AFTER ──────────────────────────────────
const props = defineProps({
  show: { type: Boolean, default: false },
  darkMode: { type: Boolean, default: false },
  groupName: { type: String, default: '' }, // e.g. "Groupe A"
  courseTitle: { type: String, default: '' }, // e.g. "Mathématiques"
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
function printStudentList() {
  // ✅ FIX: derive title from the students already loaded
  //    getAdminStudentsList returns students that may have a group/course context
  //    If not, fall back to a generic title
  const date = new Date().toLocaleDateString('fr-DZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // grab group/course from first student if available
  const first = filteredStudents.value[0]
  const courseTitle = first?.course_title || first?.enrolled_course || 'Liste des étudiants'
  const groupName = first?.group_name || ''

  const rows = filteredStudents.value
    .map(
      (s, i) => `
    <tr>
      <td style="padding:7px 12px;border-bottom:1px solid #ccc;">${i + 1}</td>
      <td style="padding:7px 12px;border-bottom:1px solid #ccc;">${s.last_name}</td>
      <td style="padding:7px 12px;border-bottom:1px solid #ccc;">${s.name}</td>
    </tr>
  `,
    )
    .join('')

  const win = window.open('', '_blank')
  win.document.write(`
    <!DOCTYPE html><html><head><meta charset="utf-8"/>
    <title>Liste étudiants</title>
    <style>
      body{font-family:Arial,sans-serif;padding:32px;color:#000;}
      .header{text-align:center;margin-bottom:24px;border-bottom:2px solid #000;padding-bottom:12px;}
      h1{font-size:20px;font-weight:bold;margin:0;}
      h2{font-size:15px;font-weight:normal;margin:6px 0 0;}
      p{font-size:12px;color:#555;margin:6px 0 0;}
      table{width:100%;border-collapse:collapse;margin-top:16px;}
      th{background:#000;color:#fff;padding:8px 12px;text-align:left;font-size:13px;}
      tr:nth-child(even) td{background:#f5f5f5;}
      .footer{margin-top:20px;font-size:11px;color:#666;text-align:right;}
    </style></head><body>
    <div class="header">
      <h1>${courseTitle}</h1>
      ${groupName ? `<h2>${groupName}</h2>` : ''}
      <p>Liste des étudiants · ${date}</p>
    </div>
    <table>
      <thead><tr>
        <th>#</th><th>Nom</th><th>Prénom</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      Total : ${filteredStudents.value.length} étudiant(s) — Belmahi School
    </div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script>
    </body></html>
  `)
  win.document.close()
}
async function executeCleanup() {
  if (!cleanupDialog.days || cleanupDialog.days < 1) return
  cleanupDialog.loading = true

  try {
    if (cleanupDialog.type === 'inactive') {
      const result = await adminCleanupInactiveStudents(cleanupDialog.days)
      alert(
        `${t('cleanup_success_inactive').replace('{count}', result.count).replace('{days}', cleanupDialog.days)}`,
      )
      await loadStudents()
    } else {
      const token = localStorage.getItem('token')
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/groups/cleanup/pending-enrollments?days=${cleanupDialog.days}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error((await res.json()).error || t('server_error'))
      const data = await res.json()
      alert(
        ` ${t('cleanup_success_pending').replace('{count}', data.deleted).replace('{days}', cleanupDialog.days)}`,
      )
    }

    cleanupDialog.open = false
  } catch (e) {
    alert('❌ ' + e.message)
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

// ✅ NEW: Print student ID card — exact replica of StudentProfileModal, B&W, credit-card size
function printStudentCard(student) {
  // Build absolute photo URL if relative
  const rawPhoto = student.photo_url || ''
  const photoUrl = rawPhoto
    ? rawPhoto.startsWith('http')
      ? rawPhoto
      : window.location.origin + rawPhoto
    : ''

  // Age from birthday
  const age = student.birthday
    ? Math.floor((Date.now() - new Date(student.birthday)) / 31557600000)
    : null

  // QR data matches StudentProfileModal format
  const qrData = `BELMAHI_STUDENT:${student.id}:${student.name} ${student.last_name}`

  // Gender silhouette SVG (B&W version)
  const silhouetteFemale = `<svg viewBox="0 0 100 120" style="width:60px;height:72px" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="30" rx="20" ry="22" fill="#555"/>
    <ellipse cx="50" cy="18" rx="22" ry="14" fill="#333"/>
    <ellipse cx="30" cy="32" rx="8" ry="18" fill="#333"/>
    <ellipse cx="70" cy="32" rx="8" ry="18" fill="#333"/>
    <path d="M22 75 Q20 95 18 115 L82 115 Q80 95 78 75 Q65 60 50 60 Q35 60 22 75Z" fill="#555"/>
    <path d="M15 115 Q30 90 50 90 Q70 90 85 115Z" fill="#777"/>
  </svg>`
  const silhouetteMale = `<svg viewBox="0 0 100 120" style="width:60px;height:72px" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="28" rx="19" ry="21" fill="#555"/>
    <rect x="31" y="10" width="38" height="10" rx="4" fill="#333"/>
    <path d="M24 72 L24 115 L76 115 L76 72 Q65 58 50 58 Q35 58 24 72Z" fill="#555"/>
    <polygon points="50,62 44,80 50,76 56,80" fill="#333"/>
    <polygon points="50,76 47,95 50,93 53,95" fill="#444"/>
  </svg>`

  const photoBlock = photoUrl
    ? `<img src="${photoUrl}" alt="Photo"
          style="width:100%;height:100%;object-fit:cover;display:block;"
          crossorigin="anonymous"/>`
    : student.gender === 'F'
      ? silhouetteFemale
      : silhouetteMale

  const genderBadge =
    student.gender === 'F'
      ? `<div style="background:#eee;color:#333;padding:2px 10px;border-radius:20px;font-size:9px;font-weight:700;margin-top:6px;text-align:center;">♀ Fille</div>`
      : `<div style="background:#eee;color:#333;padding:2px 10px;border-radius:20px;font-size:9px;font-weight:700;margin-top:6px;text-align:center;">♂ Garçon</div>`

  const ageBlock = age
    ? `<div style="background:#f4f4f4;border-radius:6px;padding:5px 7px;flex:1;">
        <p style="font-size:7px;color:#555;margin:0 0 1px;text-transform:uppercase;letter-spacing:.5px;font-weight:600;">Âge</p>
        <p style="font-size:11px;font-weight:700;color:#111;margin:0;">${age} ans</p>
       </div>`
    : ''
  const cityBlock = student.city
    ? `<div style="background:#f4f4f4;border-radius:6px;padding:5px 7px;flex:1;">
        <p style="font-size:7px;color:#555;margin:0 0 1px;text-transform:uppercase;letter-spacing:.5px;font-weight:600;">Ville</p>
        <p style="font-size:11px;font-weight:700;color:#111;margin:0;">${student.city}</p>
       </div>`
    : ''
  const emailBlock = student.email
    ? `<div style="background:#f4f4f4;border-radius:6px;padding:5px 7px;grid-column:span 2;">
        <p style="font-size:7px;color:#555;margin:0 0 1px;text-transform:uppercase;letter-spacing:.5px;font-weight:600;">Email</p>
        <p style="font-size:9px;font-weight:600;color:#111;margin:0;word-break:break-all;">${student.email}</p>
       </div>`
    : ''

  const win = window.open('', '_blank', 'width=900,height=600')
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Carte Étudiant — ${student.name} ${student.last_name}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    @page {
      size: 85.6mm 53.98mm;
      margin: 0;
    }

    html, body {
      width: 85.6mm;
      height: 53.98mm;
      background: #fff;
      font-family: 'Segoe UI', Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .card {
      width: 85.6mm;
      height: 53.98mm;
      background: #fff;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #bbb;
    }

    /* ── Header ── */
    .card-header {
      background: #1a1a1a;
      padding: 5px 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .hdr-icon {
      width: 20px; height: 20px;
      background: rgba(255,255,255,.15);
      border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .hdr-title { color: #fff; font-size: 8.5px; font-weight: 800; letter-spacing: .3px; }
    .hdr-sub   { color: rgba(255,255,255,.65); font-size: 6.5px; margin-top: 1px; }

    /* ── ID strip ── */
    .id-strip {
      background: rgba(255,255,255,.08);
      padding: 2px 8px;
      display: flex; justify-content: space-between;
      font-size: 6px; color: rgba(255,255,255,.55);
    }

    /* ── Body ── */
    .card-body {
      flex: 1;
      display: flex;
      gap: 7px;
      padding: 6px 8px;
      overflow: hidden;
    }

    /* Left column: photo */
    .col-photo {
      display: flex; flex-direction: column; align-items: center;
      flex-shrink: 0;
    }
    .photo-frame {
      width: 30mm; height: 34mm;
      border: 1.5px solid #333;
      border-radius: 5px;
      overflow: hidden;
      background: #e8e8e8;
      display: flex; align-items: center; justify-content: center;
    }

    /* Middle column: info */
    .col-info { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .student-name { font-size: 10px; font-weight: 800; color: #111; line-height: 1.15; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }

    /* Right column: QR */
    .col-qr {
      display: flex; flex-direction: column; align-items: center;
      flex-shrink: 0; gap: 3px;
    }
    .qr-frame {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 3px;
      background: #fff;
    }
    .qr-label { font-size: 5.5px; color: #555; text-align: center; font-weight: 600; line-height: 1.3; }

    /* ── Footer ── */
    .card-footer {
      background: #f4f4f4;
      border-top: 1px solid #ddd;
      padding: 2.5px 8px;
      display: flex; justify-content: space-between; align-items: center;
      flex-shrink: 0;
    }
    .card-footer span { font-size: 5.5px; color: #555; }

    /* ── Screen preview (before print) ── */
    @media screen {
      html, body { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: #ddd; }
      .card { transform: scale(2.7); transform-origin: center center; box-shadow: 0 8px 40px rgba(0,0,0,.35); }
    }
  </style>
</head>
<body>
  <div class="card">

    <!-- Header -->
    <div class="card-header">
      <div class="hdr-icon">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      </div>
      <div>
        <div class="hdr-title">École Belmahi</div>
        <div class="hdr-sub">Carte d'Identité Étudiant</div>
      </div>
    </div>

    <!-- ID strip -->
    <div class="id-strip" style="background:#2a2a2a;">
      <span style="color:rgba(255,255,255,.5);">ID: #${student.id}</span>
      <span style="color:rgba(255,255,255,.5);">${student.email || ''}</span>
    </div>

    <!-- Body -->
    <div class="card-body">

      <!-- Left: Photo -->
      <div class="col-photo">
        <div class="photo-frame">${photoBlock}</div>
        ${genderBadge}
      </div>

      <!-- Middle: Info -->
      <div class="col-info">
        <div>
          <p style="font-size:6.5px;color:#555;text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:2px;">Nom complet</p>
          <p class="student-name">${student.name}</p>
          <p class="student-name">${student.last_name}</p>
        </div>
        <div class="info-grid">
          ${ageBlock}
          ${cityBlock}
          ${emailBlock}
        </div>
      </div>

      <!-- Right: QR -->
      <div class="col-qr">
        <div class="qr-frame">
          <div id="qr-container"></div>
        </div>
        <p class="qr-label">Scannez<br>pour<br>identifier</p>
      </div>

    </div>

    <!-- Footer -->
    <div class="card-footer">
      <span>www.ecole-belmahi.dz</span>
      <span>Année scolaire 2025–2026</span>
      <span>Document officiel — ne pas falsifier</span>
    </div>

  </div>

  <script>
    window.onload = function() {
      // Generate QR code
      try {
        new QRCode(document.getElementById('qr-container'), {
          text: ${JSON.stringify(qrData)},
          width: 48,
          height: 48,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        })
      } catch(e) { console.warn('QR failed', e) }

      // Auto print after short delay (let QR render)
      setTimeout(function() { window.print() }, 600)
    }
  <\/script>
</body>
</html>`)
  win.document.close()
}

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const fetchEnrollments = async (studentId) => {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_URL}/students/${studentId}/admin-enrollments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      studentEnrollments.value = []
      return
    }
    const data = await res.json()
    studentEnrollments.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
    studentEnrollments.value = []
  }
}

const updateEnrollment = async (enr, newStatus, newPayment) => {
  try {
    const token = localStorage.getItem('token')
    await fetch(
      // ✅ After
      `${API_URL}/groups/${enr.group_id}/students/${enr.student_id}/state`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, payment_status: newPayment }),
      },
    )
    await fetchEnrollments(managingStudent.value.id)
  } catch (e) {
    alert(t('error_update'))
  }
}

const deleteEnrollment = async (enr) => {
  if (!confirm(t('confirm_unenroll_student'))) return
  try {
    const token = localStorage.getItem('token')
    await fetch(`${API_URL}/groups/${enr.group_id}/students/${enr.student_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    await fetchEnrollments(managingStudent.value.id)
  } catch (e) {
    alert(t('error_delete'))
  }
}
</script>
