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
          class="flex items-center justify-between px-5 py-4 border-b shrink-0 relative z-30"
          :class="darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'"
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
                {{ groupName || 'Alignez le code' }}
              </p>
            </div>
          </div>
          <button @click="closeModal" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
            <svg
              width="20"
              height="20"
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

        <div class="relative overflow-hidden bg-gray-100 dark:bg-gray-800" style="height: 320px">
          <div id="qr-reader-container" class="absolute inset-0 z-10"></div>

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
                class="absolute left-1 right-1 h-0.5 bg-blue-500 scan-line shadow-[0_0_10px_rgba(59,130,246,0.6)]"
              ></div>
            </div>
          </div>

          <div
            v-if="scanState === 'loading'"
            class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800"
          >
            <div
              class="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"
            ></div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-widest">
              Initialisation...
            </p>
          </div>
        </div>

        <div
          v-if="scanResult"
          class="p-4 border-t z-30 relative"
          :class="darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-white'"
        >
          <button
            @click="resetScan"
            class="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20"
          >
            Scanner suivant
          </button>
        </div>

        <div
          v-else
          class="px-5 py-4 text-center z-30 relative"
          :class="darkMode ? 'bg-gray-900' : 'bg-white'"
        >
          <p class="text-sm font-medium" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
            Placez le QR code au centre du carré
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

/* ── CRITICAL: Remove the Black Boxes from the library ── */

/* Force the root container to be transparent */
:deep(#qr-reader-container) {
  border: none !important;
  background-color: transparent !important;
}

/* Force ALL nested divs injected by the library to be transparent */
:deep(#qr-reader-container *) {
  background-color: transparent !important;
  border: none !important;
}

/* Force the video to fill the 320px area completely */
:deep(video) {
  width: 100% !important;
  height: 320px !important;
  object-fit: cover !important;
  display: block !important;
  transform: none !important; /* Prevents library from shifting the video */
}

/* Hide library UI elements */
:deep(#qr-reader-container__dashboard_section_csr button),
:deep(#qr-reader-container__header_message),
:deep(img[alt='Info icon']),
:deep(span#qr-reader-container__status_span) {
  display: none !important;
}

/* Clean up the library's auto-generated "Scan Region" */
:deep(#qr-reader-container__scan_region) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 100% !important;
}
</style>
