<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      @click.self="$emit('update:modelValue', false)"
    >
      <div
        :class="darkMode ? 'bg-gray-900' : 'bg-gray-100'"
        class="rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative"
      >
        <!-- Close button -->
        <button
          @click="$emit('update:modelValue', false)"
          class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          :class="
            darkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-white/80 hover:bg-white text-gray-500'
          "
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <!-- ── Student ID Card ── -->
        <div
          class="relative overflow-hidden"
          :class="
            darkMode
              ? 'bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900'
              : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700'
          "
        >
          <!-- Decorative circles -->
          <div
            class="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none"
          ></div>
          <div
            class="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none"
          ></div>

          <!-- School header -->
          <div class="flex items-center gap-3 px-5 pt-5 pb-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="2"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div>
              <p class="text-white font-bold text-sm leading-tight">École Belmahi</p>
              <p class="text-white/70 text-xs">Carte Étudiant</p>
            </div>
          </div>

          <!-- Avatar + info -->
          <div class="flex items-start gap-4 px-5 pb-5">
            <!-- Photo section -->
            <div class="relative flex-shrink-0">
              <div
                class="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 border-2 border-white/30"
              >
                <img
                  v-if="profile.photo_url || previewUrl"
                  :src="previewUrl || profile.photo_url"
                  alt="Photo"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <span class="text-white text-3xl font-bold">
                    {{ (profile.name || '?')[0]?.toUpperCase() }}
                  </span>
                </div>
              </div>
              <!-- Upload button overlay -->
              <label
                class="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-blue-400 hover:bg-blue-300 cursor-pointer flex items-center justify-center shadow-lg transition-colors"
                title="Changer la photo"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  stroke-width="2.5"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <input type="file" accept="image/*" class="hidden" @change="handlePhotoChange" />
              </label>
            </div>

            <!-- Student info -->
            <div class="flex-1 text-white">
              <h2 class="font-black text-xl leading-tight tracking-tight">
                {{ profile.name }} {{ profile.last_name }}
              </h2>
              <div class="mt-2 space-y-1">
                <div class="flex items-center gap-2 text-white/80 text-xs">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M20 21a8 8 0 1 0-16 0" />
                  </svg>
                  {{ profile.gender === 'F' ? 'Fille' : 'Garçon' }}
                  <span class="text-white/40">·</span>
                  {{ profile.age ?? 'N/A' }} ans
                </div>
                <div v-if="profile.city" class="flex items-center gap-2 text-white/80 text-xs">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {{ profile.city }}
                </div>
                <div v-if="profile.phone" class="flex items-center gap-2 text-white/80 text-xs">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                    />
                  </svg>
                  {{ profile.phone }}
                </div>
              </div>
            </div>
          </div>

          <!-- ID badge strip -->
          <div
            class="bg-black/20 px-5 py-2 flex justify-between items-center text-white/60 text-xs"
          >
            <span>ID: #{{ profile.id }}</span>
            <span>{{ profile.email }}</span>
          </div>
        </div>

        <!-- ── QR Code section ── -->
        <div :class="darkMode ? 'bg-gray-800' : 'bg-white'" class="p-5">
          <div class="flex items-start gap-4">
            <!-- QR Code -->
            <div class="flex-shrink-0 flex flex-col items-center">
              <div :class="darkMode ? 'bg-white' : 'bg-white'" class="p-2.5 rounded-xl shadow-md">
                <canvas ref="qrCanvas" width="120" height="120"></canvas>
              </div>
              <p
                class="text-xs mt-1.5 font-medium"
                :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
              >
                Scannez-moi
              </p>
            </div>

            <!-- Course info -->
            <div class="flex-1 min-w-0">
              <p
                class="text-xs font-bold uppercase tracking-wider mb-2"
                :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
              >
                Mes cours ({{ courses.length }})
              </p>
              <div
                v-if="courses.length === 0"
                class="text-xs"
                :class="darkMode ? 'text-gray-500' : 'text-gray-400'"
              >
                Aucun cours inscrit
              </div>
              <div v-else class="space-y-1.5 max-h-28 overflow-y-auto">
                <div
                  v-for="c in courses"
                  :key="c.course_id"
                  class="flex items-center gap-2 text-xs rounded-lg px-2 py-1.5"
                  :class="[
                    darkMode ? 'bg-gray-700' : 'bg-gray-50',
                    c.payment_status === 'paid'
                      ? 'border-l-2 border-green-500'
                      : 'border-l-2 border-orange-400',
                  ]"
                >
                  <span
                    class="flex-1 truncate font-medium"
                    :class="darkMode ? 'text-gray-200' : 'text-gray-700'"
                  >
                    {{ c.title }}
                  </span>
                  <span
                    class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    :class="
                      c.payment_status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    "
                  >
                    {{ c.payment_status === 'paid' ? '✓' : '⏳' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Save photo button (shown if new photo selected) -->
          <div v-if="pendingPhoto" class="mt-4 flex gap-2">
            <button
              @click="savePhoto"
              :disabled="uploadingPhoto"
              class="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg
                v-if="!uploadingPhoto"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span
                v-if="uploadingPhoto"
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></span>
              {{ uploadingPhoto ? 'Envoi...' : 'Sauvegarder la photo' }}
            </button>
            <button
              @click="cancelPhoto"
              class="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              :class="
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              "
            >
              Annuler
            </button>
          </div>

          <!-- Upload success message -->
          <div v-if="photoSuccess" class="mt-3 text-center text-sm text-green-600 font-medium">
            ✓ Photo mise à jour avec succès
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import * as api from '../services/api.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  profile: { type: Object, default: () => ({}) },
  courses: { type: Array, default: () => [] },
  darkMode: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'photo-updated'])

const qrCanvas = ref(null)
const previewUrl = ref(null)
const pendingPhoto = ref(null)
const uploadingPhoto = ref(false)
const photoSuccess = ref(false)

// ── Generate QR code on canvas using qrcode library ─────────────────
const generateQR = async () => {
  if (!qrCanvas.value || !props.profile?.id) return
  await nextTick()

  try {
    // Dynamic import so build doesn't fail if library isn't installed
    const QRCode = (await import('qrcode')).default

    // Encode student ID + summary of courses
    const qrData = `BELMAHI_STUDENT:${props.profile.id}`

    await QRCode.toCanvas(qrCanvas.value, qrData, {
      width: 120,
      margin: 1,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
  } catch (err) {
    console.error('QR generation failed:', err)
    // Fallback: show text in canvas
    const ctx = qrCanvas.value.getContext('2d')
    ctx.fillStyle = '#f1f5f9'
    ctx.fillRect(0, 0, 120, 120)
    ctx.fillStyle = '#64748b'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('QR indisponible', 60, 55)
    ctx.fillText('npm i qrcode', 60, 70)
  }
}

// Watch for modal open to generate QR
watch(
  () => props.modelValue,
  (open) => {
    if (open) setTimeout(generateQR, 100)
  },
)

watch(
  () => props.profile?.id,
  () => {
    if (props.modelValue) generateQR()
  },
)

// ── Photo handling ──────────────────────────────────────────────────
const handlePhotoChange = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  pendingPhoto.value = file
  previewUrl.value = URL.createObjectURL(file)
  photoSuccess.value = false
}

const savePhoto = async () => {
  if (!pendingPhoto.value) return
  uploadingPhoto.value = true

  try {
    const formData = new FormData()
    formData.append('photo', pendingPhoto.value)

    // POST to backend — add this endpoint to your students.js route
    const API_URL =
      import.meta.env.VITE_API_URL || 'https://belmahi-school-production.up.railway.app/api'
    const token = localStorage.getItem('token')

    const res = await fetch(`${API_URL}/students/upload-photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    if (!res.ok) throw new Error('Upload failed')

    const data = await res.json()
    photoSuccess.value = true
    pendingPhoto.value = null
    emit('photo-updated', data.photo_url)

    // Update preview to final URL
    if (data.photo_url) {
      previewUrl.value = data.photo_url
    }
  } catch (err) {
    console.error('Photo upload error:', err)
    alert("Erreur lors de l'envoi de la photo. Vérifiez votre connexion.")
  } finally {
    uploadingPhoto.value = false
  }
}

const cancelPhoto = () => {
  pendingPhoto.value = null
  previewUrl.value = null
  photoSuccess.value = false
}
</script>
