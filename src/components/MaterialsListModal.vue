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
        <!-- Library icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-9 h-9 text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        {{ t('materials_list_title') }}
      </h2>

      <!-- Teacher badge -->
      <p
        v-if="isTeacher"
        class="mb-6 text-sm text-purple-500 font-semibold flex items-center gap-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
        {{ t('teacher_mode_badge') }}
      </p>
      <div v-else class="mb-6"></div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"
        ></div>
        <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'">{{ t('materials_loading') }}</p>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="p-6 bg-red-100 text-red-700 rounded-xl border border-red-300 text-center"
      >
        <div class="flex justify-center mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p class="font-bold mb-2">Erreur</p>
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
        <div class="flex justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-16 h-16 opacity-40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <p class="text-xl font-bold mb-2">{{ t('materials_empty_title') }}</p>
        <p>{{ t('materials_empty_desc') }}.</p>
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
            <div
              class="flex-shrink-0 mt-1 w-10 h-10 flex items-center justify-center rounded-lg"
              :class="getFileIconBg(material.file_type)"
            >
              <component :is="getFileIconComponent(material.file_type)" class="w-5 h-5" />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <h3 class="text-lg font-bold">{{ material.title }}</h3>
                <!-- Seen badge -->
                <span
                  v-if="seenIds.has(material.id)"
                  class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Vu
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
                <span class="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {{ formatDate(material.uploaded_at) }}
                </span>
                <span class="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {{ material.teacher_name }} {{ material.teacher_last_name }}
                </span>
                <span class="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  </svg>
                  {{ formatFileSize(material.file_size) }}
                </span>
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
                :disabled="downloadingId === material.id"
                class="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg
                  v-if="downloadingId !== material.id"
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <svg
                  v-else
                  class="w-4 h-4 animate-spin"
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
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {{ downloadingId === material.id ? 'Chargement...' : t('download_btn') }}
              </button>

              <!-- Watch button for video -->
              <button
                v-if="isVideo(material.file_type)"
                @click.stop="toggleVideo(material)"
                class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-blue-700 transition-all flex items-center gap-2 text-sm"
              >
                <svg
                  v-if="expandedVideoId !== material.id"
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                {{ expandedVideoId === material.id ? 'Fermer' : 'Regarder' }}
              </button>

              <!-- DELETE — teacher or admin only -->
              <button
                v-if="isTeacher"
                @click.stop="confirmDelete(material)"
                class="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-xl font-bold transition-all flex items-center gap-2 text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                {{ t('delete_btn') }}
              </button>
            </div>
          </div>

          <!-- INLINE VIDEO PLAYER -->
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
              class="text-xs mt-2 text-center flex items-center justify-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Vidéo protégée — lecture uniquement sur la plateforme
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
          <h3 class="text-xl font-bold mb-3 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6 text-amber-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Confirmer la suppression
          </h3>
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
import { ref, watch, computed, onMounted, h } from 'vue'
import * as api from '../services/api.js'
import { useLanguage } from '../composables/useLanguage.js'

const { t } = useLanguage()

const API_URL = 'https://belmahi-school-production.up.railway.app/api'

const props = defineProps({
  isOpen: Boolean,
  courseId: Number,
  darkMode: Boolean,
  userRole: { type: String, default: 'student' },
})

const emit = defineEmits(['close'])

const materials = ref([])
const loading = ref(false)
const error = ref(null)
const expandedVideoId = ref(null)
const seenIds = ref(new Set())
const deleteTarget = ref(null)
const deleting = ref(false)
const downloadingId = ref(null)

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
  return `${API_URL}/materials/stream/${materialId}?token=${token}`
}

// SVG icon components by file type
const PdfIcon = {
  render() {
    return h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      },
      [
        h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
        h('polyline', { points: '14 2 14 8 20 8' }),
        h('line', { x1: '9', y1: '15', x2: '15', y2: '15' }),
      ],
    )
  },
}
const WordIcon = {
  render() {
    return h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      },
      [
        h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
        h('polyline', { points: '14 2 14 8 20 8' }),
        h('line', { x1: '9', y1: '12', x2: '15', y2: '12' }),
        h('line', { x1: '9', y1: '16', x2: '13', y2: '16' }),
      ],
    )
  },
}
const PptIcon = {
  render() {
    return h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      },
      [
        h('rect', { x: '2', y: '3', width: '20', height: '14', rx: '2', ry: '2' }),
        h('line', { x1: '8', y1: '21', x2: '16', y2: '21' }),
        h('line', { x1: '12', y1: '17', x2: '12', y2: '21' }),
      ],
    )
  },
}
const VideoIcon = {
  render() {
    return h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      },
      [
        h('polygon', { points: '23 7 16 12 23 17 23 7' }),
        h('rect', { x: '1', y: '5', width: '15', height: '14', rx: '2', ry: '2' }),
      ],
    )
  },
}
const ImageIcon = {
  render() {
    return h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      },
      [
        h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }),
        h('circle', { cx: '8.5', cy: '8.5', r: '1.5' }),
        h('polyline', { points: '21 15 16 10 5 21' }),
      ],
    )
  },
}
const FileIcon = {
  render() {
    return h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      },
      [
        h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
        h('polyline', { points: '14 2 14 8 20 8' }),
      ],
    )
  },
}

const getFileIconComponent = (fileType) => {
  if (!fileType) return FileIcon
  if (fileType.includes('pdf')) return PdfIcon
  if (fileType.includes('word') || fileType.includes('document')) return WordIcon
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return PptIcon
  if (fileType.includes('video')) return VideoIcon
  if (fileType.includes('image')) return ImageIcon
  return FileIcon
}

const getFileIconBg = (fileType) => {
  if (!fileType) return 'bg-gray-100 text-gray-500'
  if (fileType.includes('pdf')) return 'bg-red-100 text-red-600'
  if (fileType.includes('word') || fileType.includes('document')) return 'bg-blue-100 text-blue-600'
  if (fileType.includes('powerpoint') || fileType.includes('presentation'))
    return 'bg-orange-100 text-orange-600'
  if (fileType.includes('video')) return 'bg-purple-100 text-purple-600'
  if (fileType.includes('image')) return 'bg-green-100 text-green-600'
  return 'bg-gray-100 text-gray-500'
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
  if (downloadingId.value) return
  const token = localStorage.getItem('token')
  if (!token) {
    alert("Erreur: Vous n'êtes pas connecté (Token manquant).")
    return
  }

  downloadingId.value = material.id
  markAsSeen(material.id)

  try {
    const response = await fetch(`${API_URL}/materials/download/${material.id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 404) {
      throw new Error('Fichier introuvable sur le serveur. Il a peut-être été supprimé.')
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.error || `Erreur serveur (${response.status})`)
    }

    const blob = await response.blob()

    if (blob.size === 0) {
      throw new Error('Le fichier téléchargé est vide.')
    }

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
    alert('Erreur de téléchargement: ' + err.message)
  } finally {
    downloadingId.value = null
  }
}

// ─── Delete ────────────────────────────────────────────

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

// ─── Watch + Mount ──────────────────────────────────────

onMounted(() => {
  if (props.isOpen) {
    seenIds.value = new Set()
    fetchMaterials()
  }
})

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
