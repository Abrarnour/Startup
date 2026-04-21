<template>
  <!-- Overlay -->
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
          <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold">{{ t('teacher_list') }}</h2>
            <p class="text-sm" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
              {{ filteredTeachers.length }} enseignant(s)
            </p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-2xl"
        >
          ×
        </button>
      </div>

      <!-- ── Barre de recherche ── -->
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
            :placeholder="t('search_teacher')"
            :class="
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-gray-50 border-gray-200 text-gray-900'
            "
            class="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      <!-- ── Liste ── -->
      <div class="flex-1 overflow-y-auto p-4">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div
            class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"
          ></div>
        </div>

        <!-- Vide -->
        <div v-else-if="filteredTeachers.length === 0" class="text-center py-12">
          <p :class="darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-lg">
            {{ t('no_teachers') }}
          </p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr
                :class="darkMode ? 'bg-gray-800' : 'bg-gray-50'"
                class="text-sm font-semibold rounded-xl"
              >
                <th class="text-left p-3 rounded-l-xl">{{ t('name') }} / {{ t('last_name') }}</th>
                <th class="text-left p-3">{{ t('email') }}</th>
                <th class="text-left p-3">{{ t('phone') }}</th>
                <th class="text-left p-3">Cours</th>
                <th class="text-left p-3">Étudiants</th>
                <th class="text-left p-3 rounded-r-xl">{{ t('actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y" :class="darkMode ? 'divide-gray-700' : 'divide-gray-100'">
              <tr
                v-for="teacher in filteredTeachers"
                :key="teacher.id"
                class="hover:opacity-80 transition-opacity"
              >
                <td class="p-3">
                  <div class="flex items-center gap-3">
                    <!-- Avatar initiales -->
                    <div
                      class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    >
                      {{ teacher.name[0] }}{{ teacher.last_name[0] }}
                    </div>
                    <div>
                      <p class="font-semibold text-sm">
                        {{ teacher.name }} {{ teacher.last_name }}
                      </p>
                      <p class="text-xs" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
                        {{ teacher.gender === 'F' ? 'Madame' : 'Monsieur' }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="p-3 text-sm" :class="darkMode ? 'text-gray-300' : 'text-gray-600'">
                  {{ teacher.email }}
                </td>
                <td class="p-3 text-sm" :class="darkMode ? 'text-gray-300' : 'text-gray-600'">
                  {{ teacher.phone || '—' }}
                </td>
                <td class="p-3">
                  <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                    {{ teacher.course_count }} cours
                  </span>
                </td>
                <td class="p-3">
                  <span class="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                    {{ teacher.student_count }} étudiants
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button
                    @click="initiateDelete(teacher)"
                    class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    :class="darkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'"
                    title="Supprimer cet enseignant"
                  >
                    <Trash2 :size="18" />
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
      class="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-2xl"
    >
      <div
        :class="darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
        class="p-6 rounded-xl shadow-xl max-w-sm w-full mx-4 border"
      >
        <div class="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangle :size="24" />
          <h3 class="font-bold text-lg">Confirmer la suppression</h3>
        </div>
        <p :class="darkMode ? 'text-gray-300' : 'text-gray-600'" class="mb-6">
          Voulez-vous vraiment supprimer l'enseignant
          <span class="font-bold">{{ confirmTarget.name }} {{ confirmTarget.last_name }}</span> ?
          Cette action est irréversible.
        </p>
        <div class="flex gap-3">
          <button
            @click="confirmTarget = null"
            :disabled="deleting"
            class="flex-1 px-4 py-2 rounded-lg border font-medium"
            :class="
              darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
            "
          >
            Annuler
          </button>
          <button
            @click="confirmDelete"
            :disabled="deleting"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Loader2 v-if="deleting" class="animate-spin" :size="18" />
            {{ deleting ? 'Suppression...' : 'Supprimer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getAdminTeachersList } from '../services/api.js'
// In <script setup>
import { adminDeleteUser } from '../services/api.js' // Add this import
const confirmTarget = ref(null)
const deleting = ref(false)
const props = defineProps({
  show: { type: Boolean, default: false },
  darkMode: { type: Boolean, default: false },
  t: { type: Function, default: (k) => k },
})

const emit = defineEmits(['close', 'teacher-deleted'])

const teachers = ref([])
const search = ref('')
const loading = ref(false)

const filteredTeachers = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return teachers.value
  return teachers.value.filter((t) =>
    `${t.name} ${t.last_name} ${t.email} ${t.phone || ''}`.toLowerCase().includes(q),
  )
})
const initiateDelete = (teacher) => {
  confirmTarget.value = teacher
}

const confirmDelete = async () => {
  if (!confirmTarget.value) return
  deleting.value = true
  try {
    await adminDeleteUser(confirmTarget.value.id)
    teachers.value = teachers.value.filter((t) => t.id !== confirmTarget.value.id)
    confirmTarget.value = null
    emit('teacher-deleted')
  } catch (e) {
    alert(e.message)
  } finally {
    deleting.value = false
  }
}
// Charger à l'ouverture
watch(
  () => props.show,
  async (val) => {
    if (val && teachers.value.length === 0) {
      loading.value = true
      try {
        teachers.value = await getAdminTeachersList()
      } catch (e) {
        console.error(e)
      } finally {
        loading.value = false
      }
    }
    if (!val) search.value = ''
  },
)
</script>
