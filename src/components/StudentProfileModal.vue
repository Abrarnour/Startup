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

        <!-- ── Student ID Card (display) ── -->
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
            <!-- Photo -->
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
              <!-- Upload -->
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

          <!-- ID strip -->
          <div
            class="bg-black/20 px-5 py-2 flex justify-between items-center text-white/60 text-xs"
          >
            <span>ID: #{{ profile.id }}</span>
            <span>{{ profile.email }}</span>
          </div>
        </div>

        <!-- ── QR + Courses ── -->
        <div :class="darkMode ? 'bg-gray-800' : 'bg-white'" class="p-5">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 flex flex-col items-center">
              <div class="p-2.5 rounded-xl shadow-md bg-white">
                <canvas ref="qrCanvas" width="120" height="120"></canvas>
              </div>
              <p
                class="text-xs mt-1.5 font-medium"
                :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
              >
                Scannez-moi
              </p>
            </div>
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

          <!-- Save photo -->
          <div v-if="pendingPhoto" class="mt-4 flex gap-2">
            <button
              @click="savePhoto"
              :disabled="uploadingPhoto"
              class="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
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

          <div v-if="photoSuccess" class="mt-3 text-center text-sm text-green-600 font-medium">
            ✓ Photo mise à jour avec succès
          </div>

          <!-- ── Download Card Button ── -->
          <button
            @click="downloadCardPDF"
            :disabled="downloading"
            class="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
            :class="
              darkMode
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-gray-900 hover:bg-gray-700 text-white'
            "
          >
            <span
              v-if="downloading"
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></span>
            <svg
              v-else
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {{ downloading ? 'Génération...' : 'Télécharger la carte (PDF)' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Hidden PDF card (rendered off-screen, captured by html2canvas) ── -->
    <div
      id="pdf-student-card"
      style="
        position: fixed;
        left: -9999px;
        top: 0;
        width: 856px;
        height: 540px;
        background: #ffffff;
        font-family: 'Segoe UI', Arial, sans-serif;
        display: flex;
        flex-direction: column;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
      "
    >
      <!-- Card top bar: school -->
      <div
        style="
          background: #1e3a8a;
          padding: 28px 36px 20px;
          display: flex;
          align-items: center;
          gap: 20px;
        "
      >
        <!-- School icon -->
        <div
          style="
            width: 52px;
            height: 52px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          "
        >
          <svg
            width="28"
            height="28"
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
          <p
            style="
              color: white;
              font-size: 22px;
              font-weight: 800;
              margin: 0;
              letter-spacing: 0.5px;
            "
          >
            École Belmahi
          </p>
          <p style="color: rgba(255, 255, 255, 0.75); font-size: 13px; margin: 4px 0 0">
            Carte d'Identité Étudiant
          </p>
        </div>
      </div>

      <!-- Card body -->
      <div style="display: flex; flex: 1; padding: 32px 36px; gap: 36px; align-items: flex-start">
        <!-- Left: Photo + name -->
        <div
          style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
            flex-shrink: 0;
          "
        >
          <!-- Photo -->
          <div
            style="
              width: 130px;
              height: 150px;
              border-radius: 12px;
              overflow: hidden;
              border: 3px solid #4f46e5;
              background: #e0e7ff;
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            <img
              v-if="profile.photo_url || previewUrl"
              :src="previewUrl || profile.photo_url"
              alt="Photo"
              style="width: 100%; height: 100%; object-fit: cover"
              crossorigin="anonymous"
            />
            <!-- Silhouette SVG when no photo -->
            <svg
              v-else-if="profile.gender === 'F'"
              viewBox="0 0 100 120"
              style="width: 90px; height: 110px"
              xmlns="http://www.w3.org/2000/svg"
            >
              <!-- Female silhouette -->
              <ellipse cx="50" cy="30" rx="20" ry="22" fill="#6366f1" />
              <!-- Hair -->
              <ellipse cx="50" cy="18" rx="22" ry="14" fill="#4338ca" />
              <ellipse cx="30" cy="32" rx="8" ry="18" fill="#4338ca" />
              <ellipse cx="70" cy="32" rx="8" ry="18" fill="#4338ca" />
              <!-- Body -->
              <path
                d="M22 75 Q20 95 18 115 L82 115 Q80 95 78 75 Q65 60 50 60 Q35 60 22 75Z"
                fill="#6366f1"
              />
              <!-- Dress flare -->
              <path d="M15 115 Q30 90 50 90 Q70 90 85 115Z" fill="#818cf8" />
            </svg>
            <svg
              v-else
              viewBox="0 0 100 120"
              style="width: 90px; height: 110px"
              xmlns="http://www.w3.org/2000/svg"
            >
              <!-- Male silhouette -->
              <ellipse cx="50" cy="28" rx="19" ry="21" fill="#3b82f6" />
              <!-- Hair flat top -->
              <rect x="31" y="10" width="38" height="10" rx="4" fill="#1e40af" />
              <!-- Body / suit -->
              <path d="M24 72 L24 115 L76 115 L76 72 Q65 58 50 58 Q35 58 24 72Z" fill="#3b82f6" />
              <!-- Collar / tie -->
              <polygon points="50,62 44,80 50,76 56,80" fill="#1e40af" />
              <polygon points="50,76 47,95 50,93 53,95" fill="#1d4ed8" />
            </svg>
          </div>
          <!-- Gender label -->
          <div
            style="
              background: {{ profile.gender === 'F' ? '#fce7f3' : '#dbeafe' }};
              color: {{ profile.gender === 'F' ? '#be185d' : '#1e40af' }};
              padding: 4px 16px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 700;
            "
          >
            {{ profile.gender === 'F' ? '♀ Fille' : '♂ Garçon' }}
          </div>
        </div>

        <!-- Middle: Info -->
        <div style="flex: 1; display: flex; flex-direction: column; gap: 14px">
          <div>
            <p
              style="
                font-size: 11px;
                color: #111827;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 0 0 4px;
                font-weight: 600;
              "
            >
              Nom complet
            </p>
            <p
              style="font-size: 26px; font-weight: 800; color: #111827; margin: 0; line-height: 1.1"
            >
              {{ profile.name }}
            </p>
            <p
              style="font-size: 26px; font-weight: 800; color: #111827; margin: 0; line-height: 1.1"
            >
              {{ profile.last_name }}
            </p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
            <div
              v-if="profile.age"
              style="background: #f9fafb; border-radius: 8px; padding: 10px 12px"
            >
              <p
                style="
                  font-size: 10px;
                  color: #111827;
                  margin: 0 0 2px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  font-weight: 600;
                "
              >
                Âge
              </p>
              <p style="font-size: 16px; font-weight: 700; color: #111827; margin: 0">
                {{ profile.age }} ans
              </p>
            </div>
            <div
              v-if="profile.city"
              style="background: #f9fafb; border-radius: 8px; padding: 10px 12px"
            >
              <p
                style="
                  font-size: 10px;
                  color: #111827;
                  margin: 0 0 2px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  font-weight: 600;
                "
              >
                Ville
              </p>
              <p style="font-size: 16px; font-weight: 700; color: #111827; margin: 0">
                {{ profile.city }}
              </p>
            </div>
            <div
              v-if="profile.email"
              style="
                background: #f9fafb;
                border-radius: 8px;
                padding: 10px 12px;
                grid-column: span 2;
              "
            >
              <p
                style="
                  font-size: 10px;
                  color: #111827;
                  margin: 0 0 2px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  font-weight: 600;
                "
              >
                Email
              </p>
              <p
                style="
                  font-size: 13px;
                  font-weight: 600;
                  color: #111827;
                  margin: 0;
                  word-break: break-all;
                "
              >
                {{ profile.email }}
              </p>
            </div>
          </div>
        </div>

        <!-- Right: QR -->
        <div
          style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
          "
        >
          <div
            style="background: white; border: 2px solid #d1d5db; border-radius: 12px; padding: 10px"
          >
            <canvas ref="qrCanvasPdf" width="190" height="190"></canvas>
          </div>
          <p style="font-size: 12px; color: #111827; font-weight: 700; text-align: center">
            Scannez pour<br />identifier
          </p>
        </div>
      </div>

      <!-- Card footer -->
      <div
        style="
          background: #f8fafc;
          border-top: 1px solid #e5e7eb;
          padding: 10px 36px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        "
      >
        <p style="font-size: 11px; color: #111827; margin: 0">www.ecole-belmahi.dz</p>
        <p style="font-size: 11px; color: #111827; margin: 0">Année scolaire 2025–2026</p>
        <p style="font-size: 11px; color: #111827; margin: 0">
          Document officiel — ne pas falsifier
        </p>
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
const qrCanvasPdf = ref(null)
const previewUrl = ref(null)
const pendingPhoto = ref(null)
const uploadingPhoto = ref(false)
const photoSuccess = ref(false)
const downloading = ref(false)

// ── QR generation ────────────────────────────────────────────────────
const generateQR = async () => {
  await nextTick()
  if (!props.profile?.id) return

  try {
    const QRCode = (await import('qrcode')).default
    const qrData = `BELMAHI_STUDENT:${props.profile.id}:${props.profile.name} ${props.profile.last_name}`

    const opts = {
      margin: 1,
      color: { dark: '#1e293b', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }

    if (qrCanvas.value) {
      await QRCode.toCanvas(qrCanvas.value, qrData, { ...opts, width: 120 })
    }
    if (qrCanvasPdf.value) {
      await QRCode.toCanvas(qrCanvasPdf.value, qrData, { ...opts, width: 190 })
    }
  } catch (err) {
    console.error('QR generation failed:', err)
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) setTimeout(generateQR, 150)
  },
)
watch(
  () => props.profile?.id,
  () => {
    if (props.modelValue) generateQR()
  },
)

// ── Download as PDF ──────────────────────────────────────────────────
const downloadCardPDF = async () => {
  downloading.value = true
  try {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    const cardEl = document.getElementById('pdf-student-card')

    const canvas = await html2canvas(cardEl, {
      scale: 3, // high resolution
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/jpeg', 1.0)

    // A5 landscape: 210 × 148 mm
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a5',
    })

    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 148)
    pdf.save(`carte-${props.profile.name}-${props.profile.last_name}.pdf`)
  } catch (err) {
    console.error('PDF generation error:', err)
    alert(
      'Erreur lors de la génération du PDF. Vérifiez que html2canvas et jspdf sont installés:\nnpm install html2canvas jspdf',
    )
  } finally {
    downloading.value = false
  }
}

// ── Photo handling ────────────────────────────────────────────────────
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
    const API_URL =
      import.meta.env.VITE_API_URL || 'https://belmahi-school-production.up.railway.app/api'
    const res = await fetch(`${API_URL}/students/upload-photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: formData,
    })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    photoSuccess.value = true
    pendingPhoto.value = null
    emit('photo-updated', data.photo_url)
    if (data.photo_url) previewUrl.value = data.photo_url
  } catch (err) {
    console.error('Photo upload error:', err)
    alert("Erreur lors de l'envoi de la photo.")
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
