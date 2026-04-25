<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
    @click.self="closeModal"
  >
    <div
      :class="darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'"
      class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-8 m-4"
    >
      <!-- Header -->
      <button
        @click="closeModal"
        :class="darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'"
        class="absolute top-4 right-4 transition-colors"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <h2 class="text-3xl font-bold mb-6 flex items-center gap-3">
        <span
          class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="2"
          >
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          </svg>
        </span>
        {{ t('upload_material_title') }}
      </h2>

      <form @submit.prevent="handleUpload" class="space-y-6">
        <!-- Title -->
        <div>
          <label
            :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
            class="block text-sm font-bold mb-2"
          >
            {{ t('material_title_label') }}
          </label>
          <input
            v-model="formData.title"
            type="text"
            placeholder="Ex: Chapitre 1 — Introduction"
            required
            :class="
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            "
            class="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Description -->
        <div>
          <label
            :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
            class="block text-sm font-bold mb-2"
          >
            {{ t('description_label') }}
          </label>
          <textarea
            v-model="formData.description"
            rows="3"
            :placeholder="t('brief_description')"
            :class="
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            "
            class="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <!-- File Upload -->
        <div>
          <label
            :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
            class="block text-sm font-bold mb-2"
          >
            {{ t('select_file_btn') }}
          </label>
          <div
            :class="
              darkMode
                ? 'border-gray-700 hover:border-blue-500'
                : 'border-gray-300 hover:border-blue-500'
            "
            class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all"
            @click="$refs.fileInput.click()"
          >
            <input
              type="file"
              @change="handleFileSelect"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.mov,.webm,.jpg,.jpeg,.png,.gif,.txt"
              required
              ref="fileInput"
              class="hidden"
            />
            <div v-if="selectedFile" class="flex items-center gap-4 justify-center">
              <span class="text-4xl">{{ getFileIconChar(selectedFile.type) }}</span>
              <div class="text-left">
                <p class="font-bold">{{ selectedFile.name }}</p>
                <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm">
                  {{ formatFileSize(selectedFile.size) }}
                </p>
              </div>
            </div>
            <div v-else>
              <div class="flex justify-center mb-3">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="opacity-30"
                >
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
              </div>
              <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="mb-2">
                {{ t('drag_drop_files') }}
              </p>
              <!-- CHANGED: 1GB limit -->
              <p :class="darkMode ? 'text-gray-500' : 'text-gray-500'" class="text-xs">
                PDF, DOC, PPT, MP4, {{ t('images_label') }} (Max 1 GB)
              </p>
            </div>
          </div>
        </div>

        <!-- Upload Progress -->
        <div v-if="uploading" class="space-y-2">
          <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 transition-all duration-300"
              :style="{ width: uploadProgress + '%' }"
            ></div>
          </div>
          <p class="text-center text-blue-600 font-bold">
            {{ t('uploading_btn') }} {{ uploadProgress }}%
          </p>
        </div>

        <!-- Error -->
        <div v-if="error" class="p-4 bg-red-100 text-red-700 rounded-xl border border-red-300">
          {{ error }}
        </div>

        <!-- Success -->
        <div
          v-if="success"
          class="p-4 bg-green-100 text-green-700 rounded-xl border border-green-300 text-center font-bold flex items-center justify-center gap-2"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {{ t('upload_success_msg') }}
        </div>

        <!-- Buttons -->
        <div class="flex gap-4">
          <button
            type="button"
            @click="closeModal"
            :disabled="uploading"
            :class="
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            "
            class="flex-1 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {{ t('cancel') }}
          </button>
          <button
            type="submit"
            :disabled="uploading || !selectedFile"
            class="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ uploading ? t('uploading_btn') : t('upload_btn') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import * as api from '../services/api.js'
import { useLanguage } from '../composables/useLanguage.js'
const { t } = useLanguage()

const props = defineProps({
  isOpen: Boolean,
  courseId: Number,
  darkMode: Boolean,
})

const emit = defineEmits(['close', 'upload-success'])

const formData = reactive({ title: '', description: '' })
const selectedFile = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref(null)
const success = ref(false)

// Returns a text character for file type icon (no emoji)
const getFileIconChar = (mimeType) => {
  if (!mimeType) return '?'
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('word')) return 'DOC'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PPT'
  if (mimeType.includes('video')) return 'VID'
  if (mimeType.includes('image')) return 'IMG'
  return 'FILE'
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    // CHANGED: 1 GB limit
    if (file.size > 1024 * 1024 * 1024) {
      error.value = t('file_too_large_1gb') || 'La taille du fichier doit être inférieure à 1 GB'
      return
    }
    selectedFile.value = file
    error.value = null
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const handleUpload = async () => {
  if (!selectedFile.value) {
    error.value = t('error_select_file')
    return
  }
  if (!formData.title.trim()) {
    error.value = t('error_enter_title')
    return
  }

  uploading.value = true
  error.value = null
  success.value = false
  uploadProgress.value = 0

  try {
    const data = new FormData()
    data.append('file', selectedFile.value)
    data.append('course_id', props.courseId)
    data.append('title', formData.title)
    data.append('description', formData.description || '')

    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) uploadProgress.value += 5
    }, 300)

    await api.uploadMaterial(data)

    clearInterval(progressInterval)
    uploadProgress.value = 100
    success.value = true

    setTimeout(() => {
      emit('upload-success')
      closeModal()
    }, 1500)
  } catch (err) {
    console.error('Upload error:', err)
    error.value = err.message || t('upload_failed')
  } finally {
    uploading.value = false
  }
}

const closeModal = () => {
  if (!uploading.value) {
    formData.title = ''
    formData.description = ''
    selectedFile.value = null
    uploadProgress.value = 0
    error.value = null
    success.value = false
    emit('close')
  }
}
</script>
