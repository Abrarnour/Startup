<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      @click.self="closeModal"
    >
      <div
        :class="darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'"
        class="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-5 py-4 border-b"
          :class="darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="2"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="3" height="3" />
                <rect x="19" y="14" width="2" height="2" />
                <rect x="14" y="19" width="2" height="2" />
                <rect x="18" y="18" width="3" height="3" />
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-base" :class="darkMode ? 'text-white' : 'text-gray-900'">
                Scan QR Étudiant
              </h3>
              <p class="text-xs" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
                {{ groupName || 'Groupe sélectionné' }}
              </p>
            </div>
          </div>
          <button
            @click="closeModal"
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

        <!-- Camera Area -->
        <div class="relative">
          <!-- QR Reader container — html5-qrcode mounts here -->
          <div id="qr-reader-container" class="w-full bg-black" style="min-height: 300px"></div>

          <!-- Scanning overlay frame (shown while scanning) -->
          <div
            v-if="scanState === 'scanning'"
            class="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <div class="relative w-52 h-52">
              <div
                class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"
              ></div>
              <div
                class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"
              ></div>
              <div
                class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"
              ></div>
              <div
                class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg"
              ></div>
              <!-- Scanning line animation -->
              <div class="absolute left-2 right-2 h-0.5 bg-blue-400 opacity-80 scan-line"></div>
            </div>
          </div>

          <!-- Loading state -->
          <div
            v-if="scanState === 'loading'"
            class="absolute inset-0 flex flex-col items-center justify-center bg-black/90"
            style="min-height: 300px"
          >
            <div
              class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"
            ></div>
            <p class="text-white text-sm">Activation caméra...</p>
          </div>

          <!-- Error state -->
          <div
            v-if="scanState === 'error'"
            class="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6"
            style="min-height: 300px"
          >
            <div class="w-14 h-14 rounded-full bg-red-900/60 flex items-center justify-center mb-3">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f87171"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p class="text-red-400 text-sm text-center mb-4">{{ errorMessage }}</p>
            <button
              @click="startScanner"
              class="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>

        <!-- Result Card — shown after scan -->
        <div v-if="scanResult" class="p-5">
          <!-- Access GRANTED -->
          <div
            v-if="scanResult.access === 'GRANTED'"
            class="rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20 overflow-hidden"
          >
            <div class="bg-green-500 px-4 py-2 flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span class="text-white font-bold text-sm">ACCÈS AUTORISÉ</span>
            </div>
            <div class="p-4">
              <StudentResultCard :data="scanResult" color="green" />
            </div>
          </div>

          <!-- NOT PAID -->
          <div
            v-else-if="scanResult.access === 'NOT_PAID'"
            class="rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-900/20 overflow-hidden"
          >
            <div class="bg-red-600 px-4 py-3 flex items-center gap-3">
              <span class="text-white font-black text-3xl leading-none">✕</span>
              <span class="text-white font-bold text-sm">PAIEMENT NON EFFECTUÉ</span>
            </div>
            <div class="p-4">
              <StudentResultCard :data="scanResult" color="red" />
            </div>
          </div>

          <!-- INACTIVE -->
          <div
            v-else-if="scanResult.access === 'INACTIVE'"
            class="rounded-xl border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 overflow-hidden"
          >
            <div class="bg-yellow-500 px-4 py-2 flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="2"
              >
                <path
                  d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span class="text-white font-bold text-sm">INSCRIPTION INACTIVE</span>
            </div>
            <div class="p-4">
              <StudentResultCard :data="scanResult" color="yellow" />
            </div>
          </div>

          <!-- NOT ENROLLED -->
          <div
            v-else
            class="rounded-xl border-2 border-gray-500 bg-gray-50 dark:bg-gray-800 overflow-hidden"
          >
            <div class="bg-gray-600 px-4 py-2 flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              <span class="text-white font-bold text-sm">NON INSCRIT DANS CE GROUPE</span>
            </div>
            <div class="p-4">
              <StudentResultCard :data="scanResult" color="gray" />
            </div>
          </div>

          <!-- Scan again button -->
          <button
            @click="resetScan"
            class="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Scanner un autre étudiant
          </button>
        </div>

        <!-- Hint text while scanning -->
        <div v-if="scanState === 'scanning' && !scanResult" class="px-5 py-3 text-center">
          <p class="text-sm" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
            Pointez la caméra vers le QR Code de la carte étudiant
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import * as api from '../services/api.js'

// ── Sub-component for the result card ──────────────────────────────
const StudentResultCard = {
  props: ['data', 'color'],
  template: `
    <div>
      <!-- Photo + name row -->
      <div class="flex items-center gap-4 mb-4">
        <!-- Photo -->
        <img v-if="data.photo_url" :src="data.photo_url"
          class="w-20 h-20 rounded-2xl object-cover border-3 flex-shrink-0"
          :class="color === 'green' ? 'border-green-400' : color === 'red' ? 'border-red-400' : color === 'yellow' ? 'border-yellow-400' : 'border-gray-400'" />
        <div v-else
          class="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-black"
          :class="color === 'green' ? 'bg-green-100 text-green-600' : color === 'red' ? 'bg-red-100 text-red-600' : color === 'yellow' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-500'">
          {{ (data.name || '?')[0].toUpperCase() }}
        </div>

        <!-- Nom / Prénom -->
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Nom & Prénom</p>
          <p class="font-black text-lg text-gray-900 leading-tight">{{ data.last_name }}</p>
          <p class="font-bold text-base text-gray-700 leading-tight">{{ data.name }}</p>
        </div>
      </div>

      <!-- Info grid: Sexe / Age / Groupe -->
      <div class="grid grid-cols-3 gap-2 mb-3">
        <div class="rounded-xl px-3 py-2 bg-white/70 text-center">
          <p class="text-gray-400 text-xs mb-0.5">Sexe</p>
          <p class="font-bold text-gray-800 text-sm">{{ data.gender === 'F' ? '👩 Fille' : '👦 Garçon' }}</p>
        </div>
        <div class="rounded-xl px-3 py-2 bg-white/70 text-center">
          <p class="text-gray-400 text-xs mb-0.5">Âge</p>
          <p class="font-bold text-gray-800 text-sm">{{ data.age ?? '—' }} ans</p>
        </div>
        <div class="rounded-xl px-3 py-2 bg-white/70 text-center">
          <p class="text-gray-400 text-xs mb-0.5">Groupe</p>
          <p class="font-bold text-gray-800 text-xs truncate">{{ data.group_name || '—' }}</p>
        </div>
      </div>

      <!-- Status row: Inscription / Paiement -->
      <div class="grid grid-cols-2 gap-2">
        <div class="rounded-xl px-3 py-2 bg-white/70">
          <p class="text-gray-400 text-xs mb-0.5">Inscription</p>
          <p class="font-bold text-sm"
            :class="data.enrollment_status === 'active' ? 'text-green-600' : 'text-yellow-600'">
            {{ data.enrollment_status === 'active' ? '✓ Active' : data.enrollment_status || '—' }}
          </p>
        </div>
        <div class="rounded-xl px-3 py-2 bg-white/70">
          <p class="text-gray-400 text-xs mb-0.5">Paiement</p>
          <p class="font-bold text-sm"
            :class="data.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'">
            {{ data.payment_status === 'paid' ? '✓ Payé' : '✕ Non payé' }}
          </p>
        </div>
      </div>
    </div>
  `,
}

// ── Props & Emits ───────────────────────────────────────────────────
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  groupId: { type: [String, Number], required: true },
  groupName: { type: String, default: '' },
  darkMode: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

// ── State ───────────────────────────────────────────────────────────
const scanState = ref('idle') // idle | loading | scanning | error
const errorMessage = ref('')
const scanResult = ref(null)
let html5QrCode = null // html5-qrcode instance
let isCurrentlyScanning = false // guard flag

// ── Scanner lifecycle ───────────────────────────────────────────────
const startScanner = async () => {
  // Wait for DOM
  await nextTick()
  scanResult.value = null
  scanState.value = 'loading'
  errorMessage.value = ''

  // Make sure old instance is cleaned up
  await safeStop()

  const container = document.getElementById('qr-reader-container')
  if (!container) {
    scanState.value = 'error'
    errorMessage.value = 'Élément DOM introuvable. Rechargez la page.'
    return
  }

  try {
    // Request camera permission first
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach((t) => t.stop()) // just checking permission

    // Get camera list
    const cameras = await Html5Qrcode.getCameras()
    if (!cameras || cameras.length === 0) {
      throw new Error('Aucune caméra détectée sur cet appareil.')
    }

    // Prefer back camera on mobile, otherwise use last one (usually back)
    const backCamera = cameras.find(
      (c) =>
        c.label.toLowerCase().includes('back') ||
        c.label.toLowerCase().includes('arrière') ||
        c.label.toLowerCase().includes('environment'),
    )
    const selectedCamera = backCamera || cameras[cameras.length - 1]

    html5QrCode = new Html5Qrcode('qr-reader-container')

    await html5QrCode.start(
      selectedCamera.id,
      {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
        disableFlip: false,
      },
      onScanSuccess,
      () => {}, // ignore per-frame errors (not real errors)
    )

    isCurrentlyScanning = true
    scanState.value = 'scanning'
  } catch (err) {
    console.error('Scanner start error:', err)
    isCurrentlyScanning = false
    scanState.value = 'error'

    if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
      errorMessage.value =
        "Permission caméra refusée. Autorisez l'accès dans les paramètres du navigateur."
    } else if (err.message?.includes('Aucune caméra')) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = "Impossible d'activer la caméra. " + (err.message || '')
    }
  }
}

const safeStop = async () => {
  if (html5QrCode && isCurrentlyScanning) {
    try {
      await html5QrCode.stop()
    } catch {
      // ignore stop errors
    }
    isCurrentlyScanning = false
  }
  if (html5QrCode) {
    try {
      html5QrCode.clear()
    } catch {
      // ignore
    }
    html5QrCode = null
  }
}

// ── QR scan success handler ─────────────────────────────────────────
const onScanSuccess = async (decodedText) => {
  // Pause scanning while we process
  if (!isCurrentlyScanning) return

  try {
    await html5QrCode?.pause(true)
  } catch {
    /* ignore */
  }

  scanState.value = 'loading'

  // Parse QR data — format: "BELMAHI_STUDENT:ID"  or just the ID
  let studentId = decodedText.trim()
  if (studentId.startsWith('BELMAHI_STUDENT:')) {
    studentId = studentId.split(':')[1]
  }
  // Also handle JSON format: {"id": 123, ...}
  if (studentId.startsWith('{')) {
    try {
      const parsed = JSON.parse(studentId)
      studentId = String(parsed.id || parsed.student_id)
    } catch {
      /* leave as-is */
    }
  }

  try {
    const result = await api.scanStudentInGroup(props.groupId, studentId)
    scanResult.value = result
    scanState.value = 'idle'
    await safeStop()
  } catch (err) {
    console.error('Scan API error:', err)
    scanResult.value = null
    scanState.value = 'error'
    errorMessage.value = err.message || 'Étudiant non trouvé'
    // Resume scanning on error
    try {
      await html5QrCode?.resume()
      scanState.value = 'scanning'
    } catch {
      /* ignore */
    }
  }
}

// ── Reset to scan again ─────────────────────────────────────────────
const resetScan = async () => {
  scanResult.value = null
  await startScanner()
}

// ── Modal open/close ────────────────────────────────────────────────
const closeModal = async () => {
  await safeStop()
  scanResult.value = null
  scanState.value = 'idle'
  emit('update:modelValue', false)
}

// Watch for modal open
watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      // Small delay to let DOM mount
      setTimeout(() => startScanner(), 150)
    } else {
      await safeStop()
      scanResult.value = null
      scanState.value = 'idle'
    }
  },
)

// Cleanup on component destroy
onUnmounted(async () => {
  await safeStop()
})
</script>

<style scoped>
.scan-line {
  top: 30%;
  animation: scanMove 2s ease-in-out infinite;
}

@keyframes scanMove {
  0% {
    top: 10%;
    opacity: 1;
  }
  50% {
    top: 85%;
    opacity: 1;
  }
  100% {
    top: 10%;
    opacity: 1;
  }
}

/* Force html5-qrcode to fill container and hide its default UI noise */
:deep(#qr-reader-container video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}
:deep(#qr-reader-container img[alt='Info icon']),
:deep(#qr-reader-container select),
:deep(#qr-reader-container #qr-reader__camera_selection) {
  display: none !important;
}
:deep(#qr-reader-container #qr-reader__header_message) {
  display: none !important;
}
</style>
