<script setup>
import { ref, reactive, defineProps } from 'vue'
import { useRouter } from 'vue-router'
// Removed Calendar since birthday is deleted
import { UserPlus, Mail, Lock, Phone, User, MapPin } from 'lucide-vue-next'
import { useLanguage } from '../composables/useLanguage.js'

const { t } = useLanguage()
const router = useRouter()

const props = defineProps({
  darkMode: { type: Boolean, default: false },
  user: { type: Object, default: null },
})

// Redirect if not admin
if (!props.user || props.user.role !== 'admin') {
  router.push('/courses')
}

const loading = ref(false)
const error = ref('')
const successMessage = ref('')

// List of the 58 Wilayas of Algeria
const wilayas = [
  '01 - Adrar',
  '02 - Chlef',
  '03 - Laghouat',
  '04 - Oum El Bouaghi',
  '05 - Batna',
  '06 - Béjaïa',
  '07 - Biskra',
  '08 - Béchar',
  '09 - Blida',
  '10 - Bouira',
  '11 - Tamanrasset',
  '12 - Tébessa',
  '13 - Tlemcen',
  '14 - Tiaret',
  '15 - Tizi Ouzou',
  '16 - Alger',
  '17 - Djelfa',
  '18 - Jijel',
  '19 - Sétif',
  '20 - Saïda',
  '21 - Skikda',
  '22 - Sidi Bel Abbès',
  '23 - Annaba',
  '24 - Guelma',
  '25 - Constantine',
  '26 - Médéa',
  '27 - Mostaganem',
  "28 - M'Sila",
  '29 - Mascara',
  '30 - Ouargla',
  '31 - Oran',
  '32 - El Bayadh',
  '33 - Illizi',
  '34 - Bordj Bou Arréridj',
  '35 - Boumerdès',
  '36 - El Tarf',
  '37 - Tindouf',
  '38 - Tissemsilt',
  '39 - El Oued',
  '40 - Khenchela',
  '41 - Souk Ahras',
  '42 - Tipaza',
  '43 - Mila',
  '44 - Aïn Defla',
  '45 - Naâma',
  '46 - Aïn Témouchent',
  '47 - Ghardaïa',
  '48 - Relizane',
  '49 - Timimoun',
  '50 - Bordj Badji Mokhtar',
  '51 - Ouled Djellal',
  '52 - Béni Abbès',
  '53 - In Salah',
  '54 - In Guezzam',
  '55 - Touggourt',
  '56 - Djanet',
  "57 - El M'Ghair",
  '58 - El Meniaa',
]

// Removed birthday from state
const teacherData = reactive({
  name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
  gender: 'M',
  city: '',
})

const handleSubmit = async () => {
  error.value = ''
  successMessage.value = ''

  if (
    !teacherData.name ||
    !teacherData.last_name ||
    !teacherData.email ||
    !teacherData.password ||
    !teacherData.phone ||
    !teacherData.gender
  ) {
    error.value = t('fill_required_fields')
    return
  }

  loading.value = true

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(
      'https://belmahi-school-production.up.railway.app/api/auth/register-teacher',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(teacherData),
      },
    )

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || t('error_creation'))
    }

    const data = await response.json()
    successMessage.value = t('teacher_created_success')

    // Reset form
    setTimeout(() => {
      Object.assign(teacherData, {
        name: '',
        last_name: '',
        email: '',
        password: '',
        phone: '',
        gender: 'M',
        city: '',
      })
      successMessage.value = ''
    }, 2000)
  } catch (err) {
    error.value = err.message || t('error_creation')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="add-teacher-page min-h-[calc(100vh-200px)] py-12">
    <div
      :class="props.darkMode ? 'bg-gray-800' : 'bg-white'"
      class="max-w-4xl mx-auto rounded-3xl shadow-2xl p-8"
    >
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-300 to-blue-700 rounded-full mb-4"
        >
          <UserPlus :size="32" class="text-white" />
        </div>
        <h1
          :class="props.darkMode ? 'text-white' : 'text-gray-900'"
          class="text-3xl font-bold mb-2"
        >
          {{ t('add_teacher_title') }}
        </h1>
        <p :class="props.darkMode ? 'text-gray-400' : 'text-gray-600'">
          {{ t('add_teacher_subtitle') }}
        </p>
      </div>

      <div
        v-if="error"
        class="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg"
      >
        <p class="font-semibold">❌ {{ error }}</p>
      </div>

      <div
        v-if="successMessage"
        class="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-lg"
      >
        <p class="font-semibold">✅ {{ successMessage }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
              class="block text-sm font-medium mb-2"
            >
              {{ t('first_name_label') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
              <input
                v-model="teacherData.name"
                type="text"
                required
                :placeholder="t('ex_mohammed')"
                :class="
                  props.darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-50 border-gray-200'
                "
                class="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label
              :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
              class="block text-sm font-medium mb-2"
            >
              {{ t('last_name') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
              <input
                v-model="teacherData.last_name"
                type="text"
                required
                :placeholder="t('ex_benali')"
                :class="
                  props.darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-50 border-gray-200'
                "
                class="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
              class="block text-sm font-medium mb-2"
            >
              {{ t('email') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
              <input
                v-model="teacherData.email"
                type="email"
                required
                :placeholder="t('ex_email_teacher')"
                :class="
                  props.darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-50 border-gray-200'
                "
                class="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label
              :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
              class="block text-sm font-medium mb-2"
            >
              {{ t('phone') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <Phone class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
              <input
                v-model="teacherData.phone"
                type="tel"
                required
                :placeholder="t('ex_phone')"
                :class="
                  props.darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-50 border-gray-200'
                "
                class="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
              class="block text-sm font-medium mb-2"
            >
              {{ t('civility') }} <span class="text-red-500">*</span>
            </label>
            <div
              class="flex gap-6 items-center px-4 py-3 border-2 rounded-xl h-[52px]"
              :class="props.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'"
            >
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="teacherData.gender"
                  value="M"
                  class="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span
                  :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
                  class="font-medium"
                >
                  {{ t('mister_full') }}
                </span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="teacherData.gender"
                  value="F"
                  class="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span
                  :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
                  class="font-medium"
                >
                  {{ t('madam_full') }}
                </span>
              </label>
            </div>
          </div>

          <div>
            <label
              :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
              class="block text-sm font-medium mb-2"
            >
              Wilaya / {{ t('city') }}
            </label>
            <div class="relative">
              <MapPin class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
              <select
                v-model="teacherData.city"
                :class="
                  props.darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-50 border-gray-200'
                "
                class="w-full pl-10 pr-10 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none h-[52px]"
              >
                <option value="" disabled>{{ t('ex_city') || 'Select Wilaya' }}</option>
                <option v-for="wilaya in wilayas" :key="wilaya" :value="wilaya">
                  {{ wilaya }}
                </option>
              </select>
              <div
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label
            :class="props.darkMode ? 'text-gray-300' : 'text-gray-700'"
            class="block text-sm font-medium mb-2"
          >
            {{ t('password') }} <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
            <input
              v-model="teacherData.password"
              type="password"
              required
              :placeholder="t('secure_password')"
              :class="
                props.darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-gray-50 border-gray-200'
              "
              class="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <p :class="props.darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-xs mt-1">
            {{ t('min_8_chars') }}
          </p>
        </div>

        <div class="flex gap-4 pt-4">
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? t('creation_in_progress') : t('create_teacher_account') }}
          </button>

          <button
            type="button"
            @click="router.push('/courses')"
            :class="
              props.darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            "
            class="px-8 py-4 rounded-xl font-semibold transition-all"
          >
            {{ t('cancel') }}
          </button>
        </div>
      </form>

      <div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg">
        <p class="text-sm text-blue-800 dark:text-blue-300">
          <strong>{{ t('note_label') }}</strong> {{ t('teacher_note_desc') }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.add-teacher-page {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
