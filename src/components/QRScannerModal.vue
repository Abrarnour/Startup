<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      @click.self="closeModal"
    >
      <div
        :class="darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'"
        class="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
      >
        <div
          class="flex items-center justify-between px-5 py-4 border-b shrink-0"
          :class="darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <QrCode class="text-white" :size="20" />
            </div>
            <div>
              <h3 class="font-bold text-base" :class="darkMode ? 'text-white' : 'text-gray-900'">
                Scan QR Étudiant
              </h3>
              <p class="text-xs" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
                {{ groupName || 'Alignez le code' }}
              </p>
            </div>
          </div>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 transition-colors">
            <X :size="20" />
          </button>
        </div>

        <div class="relative bg-gray-100 dark:bg-gray-800 overflow-hidden min-h-[300px]">
          <div id="qr-reader-container" class="w-full"></div>

          <div
            v-if="scanState === 'scanning' && !scanResult"
            class="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
          >
            <div class="relative w-56 h-56">
              <div
                class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"
              ></div>
              <div
                class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"
              ></div>
              <div
                class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"
              ></div>
              <div
                class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"
              ></div>
              <div
                class="absolute left-1 right-1 h-0.5 bg-blue-500/80 scan-line shadow-[0_0_10px_rgba(59,130,246,0.8)]"
              ></div>
            </div>
          </div>

          <div
            v-if="scanState === 'loading'"
            class="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800"
          >
            <div
              class="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"
            ></div>
          </div>
        </div>

        <div
          v-if="scanResult"
          class="p-4 border-t"
          :class="darkMode ? 'border-gray-700' : 'border-gray-100'"
        >
          <button
            @click="resetScan"
            class="w-full py-3 bg-blue-600 text-white rounded-xl font-bold"
          >
            Scanner suivant
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import * as api from '../services/api.js'

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
let html5QrCode = null
let isCurrentlyScanning = false

// ── Scanner lifecycle ───────────────────────────────────────────────
const startScanner = async () => {
  await nextTick()
  scanResult.value = null
  scanState.value = 'loading'
  errorMessage.value = ''

  await safeStop()

  const container = document.getElementById('qr-reader-container')
  if (!container) {
    scanState.value = 'error'
    errorMessage.value = 'Élément DOM introuvable. Rechargez la page.'
    return
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach((t) => t.stop())

    const cameras = await Html5Qrcode.getCameras()
    if (!cameras || cameras.length === 0) {
      throw new Error('Aucune caméra détectée sur cet appareil.')
    }

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
      { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0, disableFlip: false },
      onScanSuccess,
      () => {},
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
      /* ignore */
    }
    isCurrentlyScanning = false
  }
  if (html5QrCode) {
    try {
      html5QrCode.clear()
    } catch {
      /* ignore */
    }
    html5QrCode = null
  }
}

// ── QR scan success handler ─────────────────────────────────────────
const onScanSuccess = async (decodedText) => {
  if (!isCurrentlyScanning) return

  try {
    await html5QrCode?.pause(true)
  } catch {
    /* ignore */
  }
  scanState.value = 'loading'

  // Parse QR format: "BELMAHI_STUDENT:ID"  |  plain ID  |  JSON {"id":123}
  let studentId = decodedText.trim()
  if (studentId.startsWith('BELMAHI_STUDENT:')) {
    studentId = studentId.split(':')[1]
  }
  if (studentId.startsWith('{')) {
    try {
      const parsed = JSON.parse(studentId)
      studentId = String(parsed.id || parsed.student_id)
    } catch {
      /* leave as-is */
    }
  }

  try {
    // NOTE: api.scanStudentInGroup now uses POST (side-effect: increments counter)
    const result = await api.scanStudentInGroup(props.groupId, studentId)
    scanResult.value = result
    scanState.value = 'idle'
    await safeStop()
  } catch (err) {
    console.error('Scan API error:', err)
    scanResult.value = null
    scanState.value = 'error'
    errorMessage.value = err.message || 'Étudiant non trouvé'
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

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      setTimeout(() => startScanner(), 150)
    } else {
      await safeStop()
      scanResult.value = null
      scanState.value = 'idle'
    }
  },
)

onUnmounted(async () => {
  await safeStop()
})
</script>

<style scoped>
/* 1. Fix the Laser Animation */
.scan-line {
  top: 10%;
  animation: scanMove 2.5s ease-in-out infinite;
}
@keyframes scanMove {
  0%,
  100% {
    top: 10%;
  }
  50% {
    top: 90%;
  }
}

/* 2. CRITICAL: Fix the Camera visibility */
:deep(#qr-reader-container) {
  border: none !important;
  padding: 0 !important;
}

:deep(video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important; /* This forces the camera to fill the box */
  display: block !important;
}

/* 3. Hide the library's built-in "Stop Scanning" button and extra text */
:deep(#qr-reader-container__dashboard_section_csr button),
:deep(#qr-reader-container__header_message),
:deep(img[alt='Info icon']) {
  display: none !important;
}

/* Ensure the container itself doesn't collapse */
#qr-reader-container {
  min-height: 300px;
}
</style>
