<script setup>
import { useRouter } from 'vue-router'
import { login } from '../services/api.js'
import axios from 'axios'
import { useLanguage } from '../composables/useLanguage.js'
import './assets/mobile.css'
import { ref, reactive, computed } from 'vue'
// REMOVED UserPlus and Mail to prevent Vercel linting errors
import { User, Lock, LogIn, Eye, EyeOff, GraduationCap, Users } from 'lucide-vue-next'
const router = useRouter()
const { t, isRTL } = useLanguage()

defineProps({ darkMode: { type: Boolean, default: false } })
const emit = defineEmits(['login'])

const isSignUp = ref(false)
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

// Login fields
const email = ref('')
const password = ref('')
const showPassword = ref(false)

// Register fields
const registerData = reactive({
  name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'student',
  birthday: '',
  city: '',
  phone: '',
})

const algeriaWilayas = [
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

const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  error.value = ''
  successMessage.value = ''
}

const overlayTransform = computed(() => {
  if (!isSignUp.value) return 'translateX(0)'
  return isRTL.value ? 'translateX(-100%)' : 'translateX(100%)'
})

const handleLogin = async () => {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = t('fill_all_fields')
    return
  }
  loading.value = true
  try {
    const data = await login(email.value, password.value)
    emit('login', data.user)
    const role = data.user.role
    if (role === 'admin') router.push('/courses')
    else if (role === 'Parent') router.push('/parent-dashboard')
    else if (role === 'student') router.push('/student-dashboard')
    else if (role === 'teacher') router.push('/teacher-dashboard')
    else router.push('/courses')
  } catch (err) {
    error.value = err.message || t('error_login')
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  error.value = ''
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  if (!emailRegex.test(registerData.email)) {
    error.value = t('error_registration') + ' — Email invalide'
    return
  }
  if (registerData.password.length < 8) {
    error.value = t('password_min_8')
    return
  }
  loading.value = true
  try {
    await axios.post(
      'https://belmahi-school-production.up.railway.app/api/auth/register',
      registerData,
    )
    successMessage.value = t('registration_success')
    setTimeout(() => {
      isSignUp.value = false
      email.value = registerData.email
    }, 1000)
  } catch (err) {
    error.value = err.response?.data?.error || t('error_registration')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page flex items-center justify-center min-h-[calc(100vh-200px)] py-6 px-4">
    <!-- ════════════════════════════════════════════════
         MOBILE LAYOUT  (visible below md, hidden above)
         ════════════════════════════════════════════════ -->
    <div class="md:hidden w-full max-w-md">
      <div
        :class="darkMode ? 'bg-gray-800' : 'bg-white'"
        class="rounded-3xl shadow-2xl overflow-hidden"
      >
        <!-- Logo strip -->
        <div class="deep-blue-gradient px-6 pt-8 pb-6 text-center text-white">
          <div
            class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3"
          >
            <GraduationCap :size="32" class="text-white" />
          </div>
          <h1 class="text-xl font-bold">Belmahi School</h1>
          <p class="text-blue-100 text-sm mt-1">
            {{ isSignUp ? t('register_subtitle') : t('login_subtitle') }}
          </p>
        </div>

        <!-- Tab toggle -->
        <div class="flex border-b" :class="darkMode ? 'border-gray-700' : 'border-gray-200'">
          <button
            @click="
              isSignUp = false
              error = ''
            "
            class="flex-1 py-3.5 text-sm font-bold transition-all"
            :class="
              !isSignUp
                ? 'text-blue-600 border-b-2 border-blue-600'
                : darkMode
                  ? 'text-gray-400'
                  : 'text-gray-500'
            "
          >
            {{ t('login_button') }}
          </button>
          <button
            @click="
              isSignUp = true
              error = ''
            "
            class="flex-1 py-3.5 text-sm font-bold transition-all"
            :class="
              isSignUp
                ? 'text-blue-600 border-b-2 border-blue-600'
                : darkMode
                  ? 'text-gray-400'
                  : 'text-gray-500'
            "
          >
            {{ t('create_account') }}
          </button>
        </div>

        <!-- Error / success banners -->
        <div
          v-if="error"
          class="mx-5 mt-4 p-3 bg-red-100 border-s-4 border-red-500 text-red-700 rounded-lg text-sm"
        >
          ❌ {{ error }}
        </div>
        <div
          v-if="successMessage"
          class="mx-5 mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm"
        >
          ✅ {{ successMessage }}
        </div>

        <!-- ── LOGIN FORM (mobile) ─────────────────── -->
        <div v-if="!isSignUp" class="p-5">
          <form @submit.prevent="handleLogin" class="space-y-4">
            <div class="relative">
              <User class="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
              <input
                v-model="email"
                type="email"
                :placeholder="t('email')"
                class="w-full ps-10 pe-4 py-3 border-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                :class="
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                "
              />
            </div>
            <div class="relative">
              <Lock class="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="t('password')"
                class="w-full ps-10 pe-12 py-3 border-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                :class="
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                "
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
              >
                <Eye v-if="!showPassword" :size="18" /><EyeOff v-else :size="18" />
              </button>
            </div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3.5 deep-blue-gradient text-white rounded-xl font-bold text-base transition-all shadow-lg disabled:opacity-60"
            >
              {{ loading ? t('loading_connexion') : t('login_button') }}
            </button>
          </form>

          <!-- Test accounts -->
          <div
            :class="darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-500'"
            class="mt-4 p-3 rounded-xl text-xs text-center"
          >
            <p class="font-bold mb-1">{{ t('test_accounts_label') }}</p>
            <p>{{ t('test_student_example') }}</p>
            <p>{{ t('test_admin_example') }}</p>
          </div>
        </div>

        <!-- ── REGISTER FORM (mobile) ──────────────── -->
        <div v-if="isSignUp" class="p-5">
          <form @submit.prevent="handleRegister" class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model="registerData.name"
                type="text"
                :placeholder="t('first_name')"
                class="p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                :class="darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50'"
              />
              <input
                v-model="registerData.last_name"
                type="text"
                :placeholder="t('last_name')"
                class="p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                :class="darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50'"
              />
            </div>

            <!-- Role toggle -->
            <div
              class="relative flex bg-gray-100 p-1 rounded-xl"
              :class="darkMode ? 'bg-gray-700' : ''"
            >
              <div
                class="absolute h-[calc(100%-8px)] w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300"
                :style="{
                  transform: registerData.role === 'student' ? 'translateX(0)' : 'translateX(100%)',
                }"
              ></div>
              <button
                type="button"
                @click="registerData.role = 'student'"
                class="relative z-10 flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                :class="registerData.role === 'student' ? 'text-blue-600' : 'text-gray-500'"
              >
                <GraduationCap :size="14" /> {{ t('student_role') }}
              </button>
              <button
                type="button"
                @click="registerData.role = 'Parent'"
                class="relative z-10 flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                :class="registerData.role === 'Parent' ? 'text-blue-600' : 'text-gray-500'"
              >
                <Users :size="14" /> {{ t('parent_role') }}
              </button>
            </div>

            <input
              v-model="registerData.email"
              type="email"
              :placeholder="t('email')"
              class="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              :class="darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50'"
            />
            <input
              v-model="registerData.phone"
              type="tel"
              :placeholder="t('phone_number')"
              pattern="^(05|06|07)[0-9]{8}$"
              class="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              :class="darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50'"
            />

            <div class="grid grid-cols-2 gap-2">
              <input
                v-model="registerData.birthday"
                type="date"
                class="p-3 border rounded-xl text-sm text-gray-400"
                :class="darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'"
              />
              <select
                v-model="registerData.city"
                class="p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                :class="
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 text-gray-700'
                "
              >
                <option value="" disabled>{{ t('wilaya_label') }}</option>
                <option v-for="w in algeriaWilayas" :key="w" :value="w">{{ w }}</option>
              </select>
            </div>

            <input
              v-model="registerData.password"
              type="password"
              :placeholder="t('password')"
              class="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              :class="darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50'"
            />

            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3.5 deep-blue-gradient text-white rounded-xl font-bold text-base transition-all shadow-lg disabled:opacity-60"
            >
              {{ loading ? t('loading_inscription') : t('register_button') }}
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════
         DESKTOP LAYOUT  (hidden below md, visible above)
         — Original sliding-panel design, unchanged —
         ════════════════════════════════════════════════ -->
    <div
      :class="darkMode ? 'bg-gray-800' : 'bg-white'"
      class="hidden md:flex relative rounded-[40px] shadow-2xl overflow-hidden max-w-5xl w-full mx-4 h-[650px]"
    >
      <!-- Sliding blue overlay -->
      <div
        class="absolute top-0 start-0 w-1/2 h-full z-10 transition-all duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] deep-blue-gradient text-white flex flex-col justify-center items-center text-center p-12"
        :style="{ transform: overlayTransform }"
      >
        <div v-if="!isSignUp" class="space-y-6">
          <h2 class="text-4xl font-bold">{{ t('welcome_title') }}</h2>
          <p class="text-blue-100 leading-relaxed">{{ t('login_subtitle') }}</p>
          <div class="space-y-4 text-start">
            <div class="flex items-center gap-3">
              <div class="bg-white/20 p-2 rounded-lg"><LogIn :size="20" /></div>
              <p class="text-sm">{{ t('secure_login') }}</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="bg-white/20 p-2 rounded-lg">📚</div>
              <p class="text-sm">{{ t('personalized_courses') }}</p>
            </div>
          </div>
          <!-- FIXED: solid white button, clearly visible -->
          <button
            @click="toggleMode"
            class="mt-8 px-10 py-3 bg-white text-blue-700 rounded-full font-bold shadow-lg hover:bg-blue-50 transition-all"
          >
            {{ t('create_account') }}
          </button>
        </div>

        <div v-else class="space-y-6">
          <h2 class="text-4xl font-bold">{{ t('welcome_back') }}</h2>
          <p class="text-blue-100 leading-relaxed">{{ t('have_account_text') }}</p>
          <!-- FIXED: solid white button, clearly visible -->
          <button
            @click="toggleMode"
            class="mt-8 px-10 py-3 bg-white text-blue-700 rounded-full font-bold shadow-lg hover:bg-blue-50 transition-all"
          >
            {{ t('login_button') }}
          </button>
        </div>

        <div
          class="absolute bottom-6 start-6 end-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm text-xs text-start"
        >
          <p class="font-bold mb-1">{{ t('test_accounts_label') }}</p>
          <span>{{ t('test_student_example') }}</span>
          <span class="mx-1">|</span>
          <span>{{ t('test_admin_example') }}</span>
        </div>
      </div>

      <!-- Register panel (left, desktop) -->
      <div
        class="w-1/2 h-full p-12 flex flex-col justify-center transition-all duration-700"
        :class="isSignUp ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'"
      >
        <h2 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-3xl font-bold mb-2">
          {{ t('register_title') }}
        </h2>
        <p class="text-gray-500 mb-6 text-sm">{{ t('register_subtitle') }}</p>
        <div
          v-if="error"
          class="mb-3 p-3 bg-red-100 border-s-4 border-red-500 text-red-700 rounded-lg text-sm"
        >
          ❌ {{ error }}
        </div>
        <div v-if="successMessage" class="mb-3 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
          ✅ {{ successMessage }}
        </div>

        <form @submit.prevent="handleRegister" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <input
              v-model="registerData.name"
              type="text"
              :placeholder="t('first_name')"
              class="p-2.5 border rounded-xl bg-gray-50 outline-none text-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              v-model="registerData.last_name"
              type="text"
              :placeholder="t('last_name')"
              class="p-2.5 border rounded-xl bg-gray-50 outline-none text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="relative flex bg-gray-100 p-1 rounded-xl">
            <div
              class="absolute h-[calc(100%-8px)] w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300"
              :style="{
                transform: registerData.role === 'student' ? 'translateX(0)' : 'translateX(100%)',
              }"
            ></div>
            <button
              type="button"
              @click="registerData.role = 'student'"
              class="relative z-10 flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2"
              :class="registerData.role === 'student' ? 'text-blue-600' : 'text-gray-500'"
            >
              <GraduationCap :size="16" /> {{ t('student_role') }}
            </button>
            <button
              type="button"
              @click="registerData.role = 'Parent'"
              class="relative z-10 flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2"
              :class="registerData.role === 'Parent' ? 'text-blue-600' : 'text-gray-500'"
            >
              <Users :size="16" /> {{ t('parent_role') }}
            </button>
          </div>
          <input
            v-model="registerData.email"
            type="email"
            :placeholder="t('email')"
            class="w-full p-2.5 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <input
            v-model="registerData.phone"
            type="tel"
            :placeholder="t('phone_number')"
            pattern="^(05|06|07)[0-9]{8}$"
            class="w-full p-2.5 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <div class="grid grid-cols-2 gap-3">
            <input
              v-model="registerData.birthday"
              type="date"
              class="p-2.5 border rounded-xl bg-gray-50 text-sm text-gray-400"
            />
            <select
              v-model="registerData.city"
              class="p-2.5 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 text-gray-700"
            >
              <option value="" disabled>{{ t('wilaya_label') }}</option>
              <option v-for="w in algeriaWilayas" :key="w" :value="w">{{ w }}</option>
            </select>
          </div>
          <input
            v-model="registerData.password"
            type="password"
            :placeholder="t('password')"
            class="w-full p-2.5 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 deep-blue-gradient text-white rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-lg disabled:opacity-60"
          >
            {{ loading ? t('loading_inscription') : t('register_button') }}
          </button>
        </form>
      </div>

      <!-- Login panel (right, desktop) -->
      <div
        class="w-1/2 h-full p-12 flex flex-col justify-center transition-all duration-700"
        :class="isSignUp ? 'opacity-0 z-0 pointer-events-none' : 'opacity-100 z-10'"
      >
        <h2 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-3xl font-bold mb-6">
          {{ t('login_title') }}
        </h2>
        <div
          v-if="error"
          class="mb-4 p-3 bg-red-100 border-s-4 border-red-500 text-red-700 rounded-lg text-sm"
        >
          ❌ {{ error }}
        </div>
        <div v-if="successMessage" class="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
          ✅ {{ successMessage }}
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div class="relative">
            <User class="absolute start-3 top-3 text-gray-400" :size="18" />
            <input
              v-model="email"
              type="email"
              :placeholder="t('email')"
              class="w-full ps-10 pe-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              :class="
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
              "
            />
          </div>
          <div class="relative">
            <Lock class="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="t('password')"
              class="w-full ps-10 pe-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              :class="
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
              "
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
            >
              <Eye v-if="!showPassword" :size="20" /><EyeOff v-else :size="20" />
            </button>
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 deep-blue-gradient text-white rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-lg disabled:opacity-60"
          >
            {{ loading ? t('loading_connexion') : t('login_button') }}
          </button>
        </form>

        <div class="text-center mt-6">
          <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm">
            {{ t('no_account') }}
            <button @click="toggleMode" class="text-blue-600 font-bold hover:underline">
              {{ t('register_link') }}
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  animation: fadeIn 0.8s ease-out;
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

.deep-blue-gradient {
  background: linear-gradient(135deg, #012254 0%, #0255ae 35%, #0271d9 70%, #1ba8f4 100%);
}

input[type='date']::-webkit-calendar-picker-indicator {
  cursor: pointer;
  filter: invert(0.5);
}

/* Desktop: smooth panel opacity transition */
.hidden.md\:flex > div:not(.absolute) {
  transition: opacity 0.5s ease 0.2s;
}
</style>
