<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      @click.self="close"
    >
      <div
        class="rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
        :class="darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'"
        style="max-height: 85vh"
      >
        <!-- ── Header ── -->
        <div
          class="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          :class="darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
              <!-- User-X icon -->
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="2.2"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="18" y1="8" x2="23" y2="13" />
                <line x1="23" y1="8" x2="18" y2="13" />
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-base" :class="darkMode ? 'text-white' : 'text-gray-900'">
                Absents aujourd'hui
              </h3>
              <p class="text-xs" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
                {{ groupName }} — {{ today }}
              </p>
            </div>
          </div>
          <button
            @click="close"
            class="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            :class="
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            "
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- ── Loading ── -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-16 flex-shrink-0">
          <div
            class="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-3"
          ></div>
          <p :class="darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-sm">
            Chargement des absents...
          </p>
        </div>

        <!-- ── Error ── -->
        <div v-else-if="error" class="p-6 text-center flex-shrink-0">
          <p class="text-red-500 text-sm">{{ error }}</p>
          <button
            @click="fetchAbsents"
            class="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
          >
            Réessayer
          </button>
        </div>

        <!-- ── Empty state ── -->
        <div
          v-else-if="absentStudents.length === 0"
          class="flex flex-col items-center justify-center py-14 px-6 flex-shrink-0"
        >
          <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16a34a"
              stroke-width="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p class="font-bold text-lg" :class="darkMode ? 'text-white' : 'text-gray-800'">
            Tous présents !
          </p>
          <p :class="darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-sm mt-1">
            Aucun absent enregistré pour cette séance.
          </p>
        </div>

        <!-- ── Student list ── -->
        <template v-else>
          <!-- Toolbar: select-all + delete button -->
          <div
            class="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
            :class="darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'"
          >
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="someSelected && !allSelected"
                @change="toggleAll"
                class="w-4 h-4 rounded accent-orange-500"
              />
              <span class="text-sm" :class="darkMode ? 'text-gray-300' : 'text-gray-600'">
                Tout sélectionner
                <span v-if="selectedIds.size > 0" class="font-semibold text-orange-600">
                  ({{ selectedIds.size }} / {{ absentStudents.length }})
                </span>
              </span>
            </label>

            <button
              v-if="selectedIds.size > 0"
              @click="confirmDelete"
              :disabled="deleting"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
              :class="
                darkMode
                  ? 'bg-red-700 hover:bg-red-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              "
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
              <span v-if="deleting">Suppression...</span>
              <span v-else>Supprimer ({{ selectedIds.size }})</span>
            </button>
          </div>

          <!-- Scrollable list -->
          <div class="overflow-y-auto flex-1">
            <div
              v-for="student in absentStudents"
              :key="student.id"
              class="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors"
              :class="[
                darkMode ? 'border-gray-700/60' : 'border-gray-100',
                selectedIds.has(student.id) ? (darkMode ? 'bg-orange-900/20' : 'bg-orange-50') : '',
              ]"
            >
              <!-- Checkbox -->
              <input
                type="checkbox"
                :checked="selectedIds.has(student.id)"
                @change="toggleStudent(student.id)"
                class="w-4 h-4 rounded accent-orange-500 flex-shrink-0"
              />

              <!-- Avatar -->
              <img
                v-if="student.photo_url"
                :src="student.photo_url"
                class="w-10 h-10 rounded-xl object-cover flex-shrink-0 border"
                :class="darkMode ? 'border-gray-600' : 'border-gray-200'"
              />
              <div
                v-else
                class="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black flex-shrink-0"
                :class="darkMode ? 'bg-gray-700 text-gray-300' : 'bg-orange-100 text-orange-600'"
              >
                {{ (student.last_name || student.name || '?')[0].toUpperCase() }}
              </div>

              <!-- Name + meta -->
              <div class="flex-1 min-w-0">
                <p
                  class="font-semibold text-sm truncate"
                  :class="darkMode ? 'text-white' : 'text-gray-900'"
                >
                  {{ student.last_name }} {{ student.name }}
                </p>
                <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                  <!-- Payment badge -->
                  <span
                    class="text-[11px] font-semibold px-1.5 py-0.5 rounded"
                    :class="
                      student.payment_status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    "
                  >
                    {{ student.payment_status === 'paid' ? 'Payé' : 'Non payé' }}
                  </span>
                  <!-- Sessions badge -->
                  <span class="text-[11px] text-gray-400">
                    {{ student.sessions_attended ?? 0 }} séance{{
                      (student.sessions_attended ?? 0) !== 1 ? 's' : ''
                    }}
                    ce cycle
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Confirm delete dialog (inline) -->
          <div
            v-if="showConfirm"
            class="border-t px-4 py-4 flex-shrink-0"
            :class="darkMode ? 'border-gray-700 bg-red-950/40' : 'border-red-200 bg-red-50'"
          >
            <p
              class="text-sm font-semibold mb-3"
              :class="darkMode ? 'text-red-300' : 'text-red-700'"
            >
              ⚠️ Supprimer définitivement {{ selectedIds.size }} étudiant{{
                selectedIds.size > 1 ? 's' : ''
              }}
              du groupe ? Cette action est irréversible.
            </p>
            <div class="flex gap-2">
              <button
                @click="executeDelete"
                :disabled="deleting"
                class="flex-1 py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {{ deleting ? 'Suppression...' : 'Oui, supprimer' }}
              </button>
              <button
                @click="showConfirm = false"
                :disabled="deleting"
                class="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
                :class="
                  darkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                "
              >
                Annuler
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import * as api from '../services/api.js'

// ── Props & Emits ────────────────────────────────────────────────────────────
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  groupId: { type: [String, Number], required: true },
  groupName: { type: String, default: '' },
  darkMode: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'students-deleted'])

// ── State ─────────────────────────────────────────────────────────────────────
const absentStudents = ref([])
const loading = ref(false)
const error = ref(null)
const selectedIds = ref(new Set())
const deleting = ref(false)
const showConfirm = ref(false)

// Today's date for display
const today = new Date().toLocaleDateString('fr-DZ', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

// ── Computed ──────────────────────────────────────────────────────────────────
const allSelected = computed(
  () => absentStudents.value.length > 0 && selectedIds.value.size === absentStudents.value.length,
)
const someSelected = computed(() => selectedIds.value.size > 0)

// ── Actions ───────────────────────────────────────────────────────────────────
const fetchAbsents = async () => {
  if (!props.groupId) return
  loading.value = true
  error.value = null
  selectedIds.value = new Set()
  showConfirm.value = false
  try {
    absentStudents.value = await api.getAbsentStudentsToday(props.groupId)
  } catch (err) {
    error.value = err.message || 'Erreur lors du chargement des absents'
  } finally {
    loading.value = false
  }
}

const toggleStudent = (id) => {
  const s = new Set(selectedIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedIds.value = s
  showConfirm.value = false
}

const toggleAll = () => {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(absentStudents.value.map((s) => s.id))
  }
  showConfirm.value = false
}

const confirmDelete = () => {
  if (selectedIds.value.size === 0) return
  showConfirm.value = true
}

const executeDelete = async () => {
  if (selectedIds.value.size === 0) return
  deleting.value = true
  try {
    const ids = Array.from(selectedIds.value)
    await api.bulkRemoveStudents(props.groupId, ids)
    // Remove from local list
    absentStudents.value = absentStudents.value.filter((s) => !selectedIds.value.has(s.id))
    selectedIds.value = new Set()
    showConfirm.value = false
    // Tell parent to refresh the student list
    emit('students-deleted', ids)
  } catch (err) {
    error.value = err.message || 'Erreur lors de la suppression'
    showConfirm.value = false
  } finally {
    deleting.value = false
  }
}

const close = () => {
  showConfirm.value = false
  emit('update:modelValue', false)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
watch(
  () => props.modelValue,
  (open) => {
    if (open) fetchAbsents()
  },
)
</script>
