<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      @click.self="closeModal"
    >
      <div
        :class="darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'"
        class="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div
          class="flex items-center justify-between px-5 py-4 border-b relative z-10"
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

        <div
          class="relative overflow-hidden border-b"
          :class="darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'"
        >
          <div
            id="qr-reader-container"
            class="w-full flex items-center justify-center h-[320px]"
          ></div>

          <div
            v-if="scanState === 'scanning'"
            class="absolute inset-0 pointer-events-none flex items-center justify-center"
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
                class="absolute left-2 right-2 h-0.5 bg-blue-500 opacity-80 scan-line shadow-[0_0_8px_rgba(59,130,246,0.8)]"
              ></div>
            </div>
          </div>

          <div
            v-if="scanState === 'loading'"
            class="absolute inset-0 flex flex-col items-center justify-center"
            :class="darkMode ? 'bg-gray-800' : 'bg-gray-50'"
          >
            <div
              class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"
            ></div>
            <p class="text-sm font-medium" :class="darkMode ? 'text-gray-300' : 'text-gray-600'">
              Activation caméra...
            </p>
          </div>

          <div
            v-if="scanState === 'error'"
            class="absolute inset-0 flex flex-col items-center justify-center p-6"
            :class="darkMode ? 'bg-gray-800' : 'bg-gray-50'"
          >
            <div class="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p class="text-red-500 font-medium text-sm text-center mb-4">{{ errorMessage }}</p>
            <button
              @click="startScanner"
              class="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>

        <div v-if="scanResult" class="p-4" :class="darkMode ? 'bg-gray-900' : 'bg-white'">
          <div
            class="rounded-xl overflow-hidden border-2 mb-4"
            :class="{
              'border-green-500': scanResult.access === 'GRANTED',
              'border-red-500': scanResult.access === 'NOT_PAID',
              'border-yellow-500': scanResult.access === 'INACTIVE',
              'border-gray-300': scanResult.access === 'NOT_ENROLLED',
            }"
          >
            <div
              class="px-4 py-3 flex items-center gap-3"
              :class="{
                'bg-green-500': scanResult.access === 'GRANTED',
                'bg-red-600': scanResult.access === 'NOT_PAID',
                'bg-yellow-500': scanResult.access === 'INACTIVE',
                'bg-gray-500': scanResult.access === 'NOT_ENROLLED',
              }"
            >
              <svg
                v-if="scanResult.access === 'GRANTED'"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span
                v-else-if="scanResult.access === 'NOT_PAID'"
                class="text-white font-black text-2xl leading-none"
                >✕</span
              >
              <svg
                v-else-if="scanResult.access === 'INACTIVE'"
                width="22"
                height="22"
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
              <svg
                v-else
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>

              <span class="text-white font-bold text-sm tracking-wide">
                <template v-if="scanResult.access === 'GRANTED'">ACCÈS AUTORISÉ</template>
                <template v-else-if="scanResult.access === 'NOT_PAID'"
                  >PAIEMENT NON EFFECTUÉ</template
                >
                <template v-else-if="scanResult.access === 'INACTIVE'"
                  >INSCRIPTION INACTIVE</template
                >
                <template v-else>NON INSCRIT DANS CE GROUPE</template>
              </span>
            </div>

            <div
              class="p-4"
              :class="{
                'bg-green-50': scanResult.access === 'GRANTED' && !darkMode,
                'bg-red-50': scanResult.access === 'NOT_PAID' && !darkMode,
                'bg-yellow-50': scanResult.access === 'INACTIVE' && !darkMode,
                'bg-gray-50': scanResult.access === 'NOT_ENROLLED' && !darkMode,
                'bg-gray-800': darkMode,
              }"
            >
              <div class="flex items-center gap-4 mb-4">
                <img
                  v-if="scanResult.photo_url"
                  :src="scanResult.photo_url"
                  class="w-20 h-20 rounded-2xl object-cover border-2 flex-shrink-0"
                  :class="{
                    'border-green-400': scanResult.access === 'GRANTED',
                    'border-red-400': scanResult.access === 'NOT_PAID',
                    'border-yellow-400': scanResult.access === 'INACTIVE',
                    'border-gray-300': scanResult.access === 'NOT_ENROLLED',
                  }"
                />
                <div
                  v-else
                  class="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-black border-2"
                  :class="{
                    'bg-green-100 text-green-600 border-green-300': scanResult.access === 'GRANTED',
                    'bg-red-100 text-red-600 border-red-300': scanResult.access === 'NOT_PAID',
                    'bg-yellow-100 text-yellow-600 border-yellow-300':
                      scanResult.access === 'INACTIVE',
                    'bg-gray-200 text-gray-500 border-gray-300':
                      scanResult.access === 'NOT_ENROLLED',
                  }"
                >
                  {{ (scanResult.last_name || scanResult.name || '?')[0].toUpperCase() }}
                </div>

                <div>
                  <p
                    class="text-xs uppercase tracking-wider mb-1"
                    :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
                  >
                    Nom &amp; Prénom
                  </p>
                  <p
                    class="font-black text-xl leading-tight"
                    :class="darkMode ? 'text-white' : 'text-gray-900'"
                  >
                    {{ scanResult.last_name }}
                  </p>
                  <p
                    class="font-semibold text-base leading-tight"
                    :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
                  >
                    {{ scanResult.name }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-2 mb-3">
                <div
                  class="rounded-xl px-2 py-2 text-center"
                  :class="darkMode ? 'bg-gray-700' : 'bg-white/80'"
                >
                  <p class="text-xs mb-1" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
                    Sexe
                  </p>
                  <p
                    class="font-bold text-sm"
                    :class="darkMode ? 'text-gray-200' : 'text-gray-800'"
                  >
                    {{ scanResult.gender === 'F' ? '👩 Fille' : '👦 Garçon' }}
                  </p>
                </div>
                <div
                  class="rounded-xl px-2 py-2 text-center"
                  :class="darkMode ? 'bg-gray-700' : 'bg-white/80'"
                >
                  <p class="text-xs mb-1" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
                    Âge
                  </p>
                  <p
                    class="font-bold text-sm"
                    :class="darkMode ? 'text-gray-200' : 'text-gray-800'"
                  >
                    {{ scanResult.age ?? '—' }} ans
                  </p>
                </div>
                <div
                  class="rounded-xl px-2 py-2 text-center"
                  :class="darkMode ? 'bg-gray-700' : 'bg-white/80'"
                >
                  <p class="text-xs mb-1" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
                    Groupe
                  </p>
                  <p
                    class="font-bold text-xs truncate"
                    :class="darkMode ? 'text-gray-200' : 'text-gray-800'"
                  >
                    {{ scanResult.group_name || '—' }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div class="rounded-xl px-3 py-2" :class="darkMode ? 'bg-gray-700' : 'bg-white/80'">
                  <p class="text-xs mb-1" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
                    Inscription
                  </p>
                  <p
                    class="font-bold text-sm"
                    :class="
                      scanResult.enrollment_status === 'active'
                        ? 'text-green-500'
                        : 'text-yellow-500'
                    "
                  >
                    {{
                      scanResult.enrollment_status === 'active'
                        ? '✓ Active'
                        : scanResult.enrollment_status || '—'
                    }}
                  </p>
                </div>
                <div class="rounded-xl px-3 py-2" :class="darkMode ? 'bg-gray-700' : 'bg-white/80'">
                  <p class="text-xs mb-1" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
                    Paiement
                  </p>
                  <p
                    class="font-bold text-sm"
                    :class="
                      scanResult.payment_status === 'paid' ? 'text-green-500' : 'text-red-500'
                    "
                  >
                    {{ scanResult.payment_status === 'paid' ? '✓ Payé' : '✕ Non payé' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            @click="resetScan"
            class="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
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

        <div
          v-if="scanState === 'scanning' && !scanResult"
          class="px-5 py-3 text-center"
          :class="darkMode ? 'bg-gray-900' : 'bg-white'"
        >
          <p class="text-sm font-medium" :class="darkMode ? 'text-gray-400' : 'text-gray-600'">
            Pointez la caméra vers le QR Code
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

/* Make sure the library wrapper has no border */
:deep(#qr-reader-container) {
  border: none !important;
  line-height: 0;
}

/* Force the actual camera feed to fill the 320px height of its parent exactly */
:deep(#qr-reader-container video) {
  width: 100% !important;
  height: 320px !important;
  object-fit: cover !important;
  border-radius: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* Hide extra UI elements injected by html5-qrcode */
:deep(#qr-reader-container img[alt='Info icon']),
:deep(#qr-reader-container select),
:deep(#qr-reader-container #qr-reader__camera_selection) {
  display: none !important;
}

:deep(#qr-reader-container #qr-reader__header_message) {
  display: none !important;
}
</style>
