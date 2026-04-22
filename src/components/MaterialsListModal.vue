<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
    @click.self="closeModal"
  >
    <div
      :class="darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'"
      class="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-8 m-4"
    >
      <!-- Header -->
      <button
        @click="closeModal"
        :class="darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'"
        class="absolute top-4 right-4 text-3xl transition-colors"
      >
        &times;
      </button>

      <h2 class="text-3xl font-bold mb-2 flex items-center gap-3">
        <span class="text-4xl">📚</span>
        {{ t('materials_list_title') }}
      </h2>

      <!-- Teacher badge -->
      <p v-if="isTeacher" class="mb-6 text-sm text-purple-500 font-semibold">
        {{ t('teacher_mode_badge') }}
      </p>
      <div v-else class="mb-6"></div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"
        ></div>
        <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'">Loading materials...</p>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="p-6 bg-red-100 text-red-700 rounded-xl border border-red-300 text-center"
      >
        <p class="font-bold mb-2">❌ Error</p>
        <p>{{ error }}</p>
        <button
          @click="fetchMaterials"
          class="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>

      <!-- No Materials -->
      <div
        v-else-if="materials.length === 0"
        class="text-center py-12"
        :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
      >
        <span class="text-6xl mb-4 block">📭</span>
        <p class="text-xl font-bold mb-2">No materials yet</p>
        <p>The teacher hasn't uploaded any materials for this course.</p>
      </div>

      <!-- Materials List -->
      <div v-else class="space-y-6">
        <div
          v-for="material in materials"
          :key="material.id"
          class="rounded-xl border-2 transition-all overflow-hidden"
          :class="[darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200']"
        >
          <!-- Material Info Row -->
          <div class="p-5 flex items-start gap-4">
            <!-- File Icon -->
            <div class="text-4xl flex-shrink-0 mt-1">
              {{ getFileIcon(material.file_type) }}
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <h3 class="text-lg font-bold">{{ material.title }}</h3>
                <!-- ✅ SEEN badge -->
                <span
                  v-if="seenIds.has(material.id)"
                  class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold"
                >
                  ✓ Vu
                </span>
              </div>
              <p
                v-if="material.description"
                :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
                class="text-sm mb-2"
              >
                {{ material.description }}
              </p>
              <div
                :class="darkMode ? 'text-gray-500' : 'text-gray-500'"
                class="text-xs flex flex-wrap gap-3"
              >
                <span>📅 {{ formatDate(material.uploaded_at) }}</span>
                <span>👤 {{ material.teacher_name }} {{ material.teacher_last_name }}</span>
                <span>📦 {{ formatFileSize(material.file_size) }}</span>
                <span class="font-semibold uppercase">{{
                  getFileTypeName(material.file_type)
                }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col gap-2 flex-shrink-0">
              <!-- Download (non-video only) -->
              <button
                v-if="!isVideo(material.file_type)"
                @click.stop="downloadFile(material)"
                class="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2 text-sm"
              >
                <span>⬇️</span> {{ t('download_btn') }}
              </button>

              <!-- Watch button for video -->
              <button
                v-if="isVideo(material.file_type)"
                @click.stop="toggleVideo(material)"
                class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-blue-700 transition-all flex items-center gap-2 text-sm"
              >
                <span>{{ expandedVideoId === material.id ? '🔼' : '▶️' }}</span>
                {{ expandedVideoId === material.id ? 'Fermer' : 'Regarder' }}
              </button>

              <!-- ✅ DELETE — teacher or admin only -->
              <button
                v-if="isTeacher"
                @click.stop="confirmDelete(material)"
                class="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-xl font-bold transition-all flex items-center gap-2 text-sm"
              >
                <span>🗑️</span>{{ t('delete_btn') }}
              </button>
            </div>
          </div>

          <!-- ✅ INLINE VIDEO PLAYER — only shown when expanded -->
          <div
            v-if="isVideo(material.file_type) && expandedVideoId === material.id"
            class="px-5 pb-5"
          >
            <div class="rounded-xl overflow-hidden bg-black shadow-lg">
              <video
                :src="getStreamUrl(material.id)"
                controls
                controlsList="nodownload"
                oncontextmenu="return false"
                class="w-full max-h-96"
                @play="markAsSeen(material.id)"
              >
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            </div>
            <p
              :class="darkMode ? 'text-gray-500' : 'text-gray-400'"
              class="text-xs mt-2 text-center"
            >
              🔒 Vidéo protégée — lecture uniquement sur la plateforme
            </p>
          </div>
        </div>
      </div>

      <!-- Delete confirmation dialog -->
      <div
        v-if="deleteTarget"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70"
      >
        <div
          :class="darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'"
          class="rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
        >
          <h3 class="text-xl font-bold mb-3">⚠️ Confirmer la suppression</h3>
          <p :class="darkMode ? 'text-gray-300' : 'text-gray-600'" class="mb-6">
            {{ t('confirm_delete_title') }} <strong>« {{ deleteTarget.title }} »</strong>
            {{ t('confirm_delete_text') }}
          </p>
          <div class="flex gap-4">
            <button
              @click="deleteTarget = null"
              :class="
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              "
              class="flex-1 py-3 rounded-xl font-bold transition-all"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="doDelete"
              :disabled="deleting"
              class="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {{ deleting ? 'Suppression...' : 'Supprimer' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Close Button -->
      <button
        v-if="!loading && !error"
        @click="closeModal"
        :class="
          darkMode
            ? 'bg-gray-700 hover:bg-gray-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        "
        class="w-full mt-6 py-3 rounded-xl font-bold transition-all"
      >
        Fermer
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import * as api from '../services/api.js'

const API_URL = 'https://belmahi-school-production.up.railway.app/api'

const props = defineProps({
  isOpen: Boolean,
  courseId: Number,
  darkMode: Boolean,
  // ✅ NEW: pass the user role so teacher can see delete button
  userRole: { type: String, default: 'student' },
})

const emit = defineEmits(['close'])

const materials = ref([])
const loading = ref(false)
const error = ref(null)
const expandedVideoId = ref(null) // which video is currently open
const seenIds = ref(new Set()) // track which materials were seen this session
const deleteTarget = ref(null) // material pending deletion confirmation
const deleting = ref(false)

// Is the current user a teacher or admin?
const isTeacher = computed(() => props.userRole === 'teacher' || props.userRole === 'admin')

const fetchMaterials = async () => {
  if (!props.courseId) return

  loading.value = true
  error.value = null

  try {
    materials.value = await api.getCourseMaterials(props.courseId)
  } catch (err) {
    console.error('Fetch materials error:', err)
    error.value = err.message || 'Failed to load materials'
  } finally {
    loading.value = false
  }
}

// ─── Helpers ────────────────────────────────────────────

const isVideo = (fileType) => fileType && fileType.startsWith('video/')

const getStreamUrl = (materialId) => {
  const token = localStorage.getItem('token')
  // We embed the token as a query param so the <video> src works directly
  return `${API_URL}/materials/stream/${materialId}?token=${token}`
}

const getFileIcon = (fileType) => {
  if (!fileType) return '📄'

  if (fileType.includes('pdf')) return '📕'
  if (fileType.includes('word') || fileType.includest('type_document')) return '📘'

  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊'
  if (fileType.includes('video')) return '🎬'

  if (fileType.includes('image')) return '🖼️'
  return '📄'
}

const getFileTypeName = (fileType) => {
  if (!fileType) return 'Fichier'
  if (fileType.includes('pdf')) return 'PDF'
  if (fileType.includes('word')) return 'Word'
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'PowerPoint'
  if (fileType.includes('video')) return 'Vidéo'
  if (fileType.includes('image')) return 'Image'
  return 'Fichier'
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Actions ────────────────────────────────────────────

const toggleVideo = (material) => {
  if (expandedVideoId.value === material.id) {
    expandedVideoId.value = null
  } else {
    expandedVideoId.value = material.id
    markAsSeen(material.id)
  }
}

const markAsSeen = (materialId) => {
  seenIds.value = new Set([...seenIds.value, materialId])
}

const downloadFile = async (material) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      alert("Erreur: Vous n'êtes pas connecté (Token manquant).")
      return
    }
    markAsSeen(material.id)

    const response = await fetch(`${API_URL}/materials/download/${material.id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) throw new Error('Échec du téléchargement')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', material.file_name || material.title)
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Download error:', err)
    alert('Une erreur est survenue lors du téléchargement.')
  }
}

// ─── Delete (teacher/admin only) ────────────────────────

const confirmDelete = (material) => {
  deleteTarget.value = material
}

const doDelete = async () => {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await api.deleteMaterial(deleteTarget.value.id)
    materials.value = materials.value.filter((m) => m.id !== deleteTarget.value.id)
    if (expandedVideoId.value === deleteTarget.value.id) expandedVideoId.value = null
    deleteTarget.value = null
  } catch (err) {
    alert('Erreur lors de la suppression: ' + (err.message || 'Erreur inconnue'))
  } finally {
    deleting.value = false
  }
}

const closeModal = () => {
  expandedVideoId.value = null
  deleteTarget.value = null
  emit('close')
}

// ─── Watch ──────────────────────────────────────────────

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      seenIds.value = new Set()
      fetchMaterials()
    }
  },
)
</script>
