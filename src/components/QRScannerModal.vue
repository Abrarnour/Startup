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
          <div id="qr-reader-container" class="w-full bg-black" style="min-height: 300px"></div>

          <!-- Scanning overlay frame -->
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

        <!-- ── Result Card ── -->
        <div v-if="scanResult" class="p-4">
          <!-- ── Status banner ── -->
          <div
            class="rounded-xl overflow-hidden border-2 mb-4"
            :class="{
              'border-green-500': scanResult.access === 'GRANTED',
              'border-red-500': scanResult.access === 'NOT_PAID',
              'border-yellow-500': scanResult.access === 'INACTIVE',
              'border-gray-400': scanResult.access === 'NOT_ENROLLED',
            }"
          >
            <!-- Banner header row -->
            <div
              class="px-4 py-3 flex items-center justify-between gap-3"
              :class="{
                'bg-green-500': scanResult.access === 'GRANTED',
                'bg-red-600': scanResult.access === 'NOT_PAID',
                'bg-yellow-500': scanResult.access === 'INACTIVE',
                'bg-gray-600': scanResult.access === 'NOT_ENROLLED',
              }"
            >
              <div class="flex items-center gap-3">
                <!-- GRANTED icon -->
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
                <!-- NOT_PAID icon -->
                <span
                  v-else-if="scanResult.access === 'NOT_PAID'"
                  class="text-white font-black text-2xl leading-none"
                  >✕</span
                >
                <!-- INACTIVE icon -->
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
                <!-- NOT_ENROLLED icon -->
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

              <!-- ── SESSION NUMBER BADGE (GRANTED only) ── -->
              <div
                v-if="scanResult.access === 'GRANTED' && scanResult.session_number"
                class="flex-shrink-0 bg-white/20 border border-white/40 rounded-xl px-3 py-1 text-center"
              >
                <p
                  class="text-white/80 text-[10px] font-semibold uppercase tracking-widest leading-none mb-0.5"
                >
                  Séance
                </p>
                <p class="text-white font-black text-2xl leading-none">
                  #{{ scanResult.session_number }}
                </p>
              </div>
            </div>

            <!-- ── Already scanned today warning ── -->
            <div
              v-if="scanResult.access === 'GRANTED' && scanResult.already_scanned_today"
              class="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d97706"
                stroke-width="2.5"
              >
                <path
                  d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p class="text-amber-700 text-xs font-semibold">
                Déjà scanné aujourd'hui — compteur non incrémenté
              </p>
            </div>

            <!-- ── Student info body ── -->
            <div
              class="p-4"
              :class="{
                'bg-green-50': scanResult.access === 'GRANTED',
                'bg-red-50': scanResult.access === 'NOT_PAID',
                'bg-yellow-50': scanResult.access === 'INACTIVE',
                'bg-gray-50': scanResult.access === 'NOT_ENROLLED',
              }"
            >
              <!-- Photo + Name -->
              <div class="flex items-center gap-4 mb-4">
                <img
                  v-if="scanResult.photo_url"
                  :src="scanResult.photo_url"
                  class="w-20 h-20 rounded-2xl object-cover border-2 flex-shrink-0"
                  :class="{
                    'border-green-400': scanResult.access === 'GRANTED',
                    'border-red-400': scanResult.access === 'NOT_PAID',
                    'border-yellow-400': scanResult.access === 'INACTIVE',
                    'border-gray-400': scanResult.access === 'NOT_ENROLLED',
                  }"
                />
                <div
                  v-else
                  class="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-black border-2"
                  :class="{
                    'bg-green-100 text-green-600 border-green-300': scanResult.access === 'GRANTED',
                    'bg-red-100   text-red-600   border-red-300': scanResult.access === 'NOT_PAID',
                    'bg-yellow-100 text-yellow-600 border-yellow-300':
                      scanResult.access === 'INACTIVE',
                    'bg-gray-200  text-gray-500  border-gray-300':
                      scanResult.access === 'NOT_ENROLLED',
                  }"
                >
                  {{ (scanResult.last_name || scanResult.name || '?')[0].toUpperCase() }}
                </div>

                <div>
                  <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Nom &amp; Prénom
                  </p>
                  <p class="font-black text-xl text-gray-900 leading-tight">
                    {{ scanResult.last_name }}
                  </p>
                  <p class="font-semibold text-base text-gray-700 leading-tight">
                    {{ scanResult.name }}
                  </p>
                </div>
              </div>

              <!-- Sexe / Âge / Groupe -->
              <div class="grid grid-cols-3 gap-2 mb-3">
                <div class="rounded-xl bg-white/80 px-2 py-2 text-center">
                  <p class="text-gray-400 text-xs mb-1">Sexe</p>
                  <p class="font-bold text-gray-800 text-sm">
                    {{ scanResult.gender === 'F' ? '👩 Fille' : '👦 Garçon' }}
                  </p>
                </div>
                <div class="rounded-xl bg-white/80 px-2 py-2 text-center">
                  <p class="text-gray-400 text-xs mb-1">Âge</p>
                  <p class="font-bold text-gray-800 text-sm">{{ scanResult.age ?? '—' }} ans</p>
                </div>
                <div class="rounded-xl bg-white/80 px-2 py-2 text-center">
                  <p class="text-gray-400 text-xs mb-1">Groupe</p>
                  <p class="font-bold text-gray-800 text-xs truncate">
                    {{ scanResult.group_name || '—' }}
                  </p>
                </div>
              </div>

              <!-- Inscription / Paiement / Sessions this cycle -->
              <div class="grid grid-cols-3 gap-2">
                <div class="rounded-xl bg-white/80 px-3 py-2">
                  <p class="text-gray-400 text-xs mb-1">Inscription</p>
                  <p
                    class="font-bold text-sm"
                    :class="
                      scanResult.enrollment_status === 'active'
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    "
                  >
                    {{
                      scanResult.enrollment_status === 'active'
                        ? '✓ Active'
                        : scanResult.enrollment_status || '—'
                    }}
                  </p>
                </div>
                <div class="rounded-xl bg-white/80 px-3 py-2">
                  <p class="text-gray-400 text-xs mb-1">Paiement</p>
                  <p
                    class="font-bold text-sm"
                    :class="
                      scanResult.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'
                    "
                  >
                    {{ scanResult.payment_status === 'paid' ? '✓ Payé' : '✕ Non payé' }}
                  </p>
                </div>
                <!-- Sessions this cycle (only meaningful when enrolled) -->
                <div v-if="scanResult.enrollment_status" class="rounded-xl bg-white/80 px-3 py-2">
                  <p class="text-gray-400 text-xs mb-1">Ce cycle</p>
                  <p class="font-bold text-sm text-blue-700">
                    {{ scanResult.sessions_attended ?? '—' }}
                    <span class="text-gray-400 font-normal text-xs"
                      >séance{{ (scanResult.sessions_attended ?? 0) > 1 ? 's' : '' }}</span
                    >
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Scan again button -->
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

/* ── Contain the library inside our div ── */
:deep(#qr-reader-container) {
  border: none !important;
  padding: 0 !important;
  background: black;
  position: relative !important;
}

/* ── Make the scan region fill our container, no overflow ── */
:deep(#qr-reader-container #qr-reader__scan_region) {
  position: relative !important;
  border: none !important;
  overflow: hidden !important;
}

/* ── Video fills the box cleanly ── */
:deep(#qr-reader-container video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
  position: relative !important;
}

/* ── Hide the library's own dark shading overlay (the full-screen black cause) ── */
:deep(#qr-reader-container #qr-reader__scan_region > img),
:deep(#qr-reader-container #qr-reader__scan_region > div[style*='position: absolute']),
:deep(#qr-reader-container img[alt='QR code']),
:deep(#qr-reader-container img[alt='']) {
  display: none !important;
}

/* ── Hide all library UI chrome ── */
:deep(#qr-reader-container img[alt='Info icon']),
:deep(#qr-reader-container select),
:deep(#qr-reader-container #qr-reader__camera_selection),
:deep(#qr-reader-container #qr-reader__header_message),
:deep(#qr-reader-container #qr-reader__status_span),
:deep(#qr-reader-container #qr-reader__dashboard),
:deep(#qr-reader-container button) {
  display: none !important;
}
</style>
