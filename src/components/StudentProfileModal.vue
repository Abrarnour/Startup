<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    @click.self="$emit('close')"
  >
    <div
      :class="darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'"
      class="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
    >
      <div class="h-24 bg-gradient-to-r from-blue-500 to-purple-600 relative">
        <button
          @click="$emit('close')"
          class="absolute top-4 right-4 text-white hover:text-gray-200"
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
      </div>

      <div class="px-6 pb-6 relative">
        <div class="flex justify-center -mt-12 mb-4">
          <div
            class="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-200 overflow-hidden flex items-center justify-center relative group"
          >
            <img
              v-if="profile?.photo_url"
              :src="profile.photo_url"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-3xl font-bold text-gray-400">{{
              profile?.name?.charAt(0)
            }}</span>

            <div
              class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <svg
                class="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>
        </div>

        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold">{{ profile?.name }} {{ profile?.last_name }}</h2>
          <p class="text-sm opacity-70">{{ profile?.email }}</p>
          <div class="flex justify-center gap-4 mt-3 text-sm">
            <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold"
              >{{ profile?.age }} Ans</span
            >
            <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-semibold">{{
              profile?.gender === 'M' ? 'Garçon' : 'Fille'
            }}</span>
          </div>
        </div>

        <div
          class="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-inner border border-gray-100"
        >
          <p class="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider">
            Pass Étudiant
          </p>
          <qrcode-vue :value="qrValue" :size="180" level="H" render-as="svg" />
          <p class="text-[10px] text-gray-400 mt-2">ID: {{ profile?.id }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import QrcodeVue from 'qrcode.vue' // Ensure this is installed: npm install qrcode.vue

const props = defineProps({
  show: Boolean,
  darkMode: Boolean,
  profile: Object,
})

defineEmits(['close'])

// ✅ THE FIX: Define the missing variable
// This creates a JSON string that the admin's camera will decode
const qrValue = computed(() => {
  if (!props.profile || !props.profile.id) return ''

  // We send a JSON object so the scanner knows this is a "student_id"
  return JSON.stringify({
    student_id: props.profile.id,
    name: props.profile.name,
    type: 'school_access',
  })
})
</script>
