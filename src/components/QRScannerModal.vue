<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
  >
    <div v-if="!scanResult" class="w-full max-w-md bg-white rounded-2xl overflow-hidden relative">
      <div class="bg-gray-900 text-white p-4 flex justify-between items-center">
        <h3 class="font-bold">Scan QR Étudiant</h3>
        <button @click="stopScanner" class="text-gray-400 hover:text-white">✕</button>
      </div>
      <div id="qr-reader" class="w-full"></div>
    </div>

    <div
      v-else
      class="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl transform transition-all"
    >
      <div
        :class="resultConfig.bgClass"
        class="p-6 flex flex-col items-center justify-center text-white"
      >
        <component :is="resultConfig.icon" :size="64" class="mb-4" />
        <h2 class="text-2xl font-bold uppercase tracking-widest">{{ resultConfig.title }}</h2>
        <p class="text-sm mt-1 opacity-90 text-center">{{ resultConfig.message }}</p>
      </div>

      <div class="p-6 text-center">
        <h3 class="text-xl font-bold text-gray-800">
          {{ scanResult.name }} {{ scanResult.last_name }}
        </h3>
        <p class="text-sm text-gray-500 mb-4">
          {{ scanResult.age ? scanResult.age + ' Ans' : '' }} |
          {{ scanResult.gender === 'M' ? 'Garçon' : 'Fille' }}
        </p>

        <div
          class="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 text-left space-y-2 border border-gray-100"
        >
          <p><strong>Groupe:</strong> {{ scanResult.group_name || 'Aucun' }}</p>
          <p><strong>Inscription:</strong> {{ scanResult.enrollment_status || 'Non Inclus' }}</p>
          <p>
            <strong>Paiement:</strong>
            {{ scanResult.payment_status === 'paid' ? 'Payé' : 'Non Payé' }}
          </p>
        </div>

        <button
          @click="resetScanner"
          class="mt-6 w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
        >
          Scanner un autre
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-vue-next'
import * as api from '../services/api.js'

const props = defineProps({ show: Boolean, groupId: Number })
const emit = defineEmits(['close'])

const scanResult = ref(null)
let html5QrcodeScanner = null

// Determine UI state mathematically based on access level
const resultConfig = computed(() => {
  if (!scanResult.value) return {}
  const map = {
    GRANTED: {
      bgClass: 'bg-green-500',
      icon: CheckCircle,
      title: 'AUTORISÉ',
      message: "L'étudiant est inscrit et à jour.",
    },
    NOT_PAID: {
      bgClass: 'bg-red-600',
      icon: XCircle,
      title: 'REFUSÉ',
      message: "L'étudiant n'a pas payé.",
    },
    INACTIVE: {
      bgClass: 'bg-orange-500',
      icon: AlertTriangle,
      title: 'BLOQUÉ',
      message: 'Inscription inactive.',
    },
    NOT_ENROLLED: {
      bgClass: 'bg-gray-800',
      icon: XCircle,
      title: 'INCONNU',
      message: "N'appartient pas à ce groupe.",
    },
  }
  return map[scanResult.value.access] || map['NOT_ENROLLED']
})

const onScanSuccess = async (decodedText) => {
  try {
    const payload = JSON.parse(decodedText)
    if (!payload.student_id) throw new Error('QR non valide')

    // Stop camera temporarily
    html5QrcodeScanner.pause()

    // Fetch real-time status from backend
    scanResult.value = await api.scanStudentInGroup(props.groupId, payload.student_id)
  } catch (error) {
    alert('Erreur de scan ou QR Code invalide.')
    html5QrcodeScanner.resume()
  }
}

const startScanner = () => {
  nextTick(() => {
    html5QrcodeScanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    )
    html5QrcodeScanner.render(onScanSuccess, () => {})
  })
}

const stopScanner = () => {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.clear().catch((e) => console.error(e))
  }
  emit('close')
}

const resetScanner = () => {
  scanResult.value = null
  startScanner()
}

watch(
  () => props.show,
  (newVal) => {
    if (newVal) startScanner()
    else stopScanner()
  },
)
</script>
