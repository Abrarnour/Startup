<script setup>
import { ref, reactive, defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import {
  User,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  UserPlus,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  Users,
  ArrowRight,
} from 'lucide-vue-next'
import { login } from '../services/api.js'
import axios from 'axios' // سنحتاجه لعملية الـ Register
import { useLanguage } from '../composables/useLanguage.js'
import AppLoader from '../components/AppLoader.vue'
const router = useRouter()
// دالة لتحديد اتجاه حركة الطبقة الزرقاء بدقة بناءً على اتجاه المتصفح
import { computed } from 'vue'
const { t, isRTL, local } = useLanguage()

const overlayTransform = computed(() => {
  if (!isSignUp.value) return 'translateX(0)'
  return isRTL.value ? 'translateX(-100%)' : 'translateX(100%)'
})
// props لـ Dark Mode
defineProps({
  darkMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['login'])

// --- الحالات المشتركة ---
const isSignUp = ref(false) // التبديل بين الدخول والتسجيل
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

// --- بيانات تسجيل الدخول (Connexion) ---
const email = ref('')
const password = ref('')
const showPassword = ref(false)

// --- بيانات إنشاء الحساب (Inscription) ---
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

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// دالة التبديل بين الصفحات (الأنيميشن)
const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  error.value = ''
  successMessage.value = ''
}
const handleLogin = async () => {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = t('fill_all_fields')
    return
  }
  loading.value = true
  try {
    const data = await login(email.value, password.value)

    // 1. حفظ بيانات المستخدم وتحديث الحالة
    emit('login', data.user)

    // 2. التوجيه الديناميكي بناءً على الرتبة (Role)
    const userRole = data.user.role

    if (userRole === 'admin') {
      router.push('/courses')
    } else if (userRole === 'Parent') {
      router.push('/parent-dashboard')
    } else if (userRole === 'student') {
      router.push('/student-dashboard')
    } else if (userRole === 'teacher') {
      router.push('/teacher-dashboard')
    } else {
      router.push('/courses') // المسار الافتراضي
    }
  } catch (err) {
    error.value = err.message || t('error_login')
  } finally {
    loading.value = false
  }
}
// دالة إنشاء الحساب (الجديدة)
const handleRegister = async () => {
  error.value = ''

  // Email: must have a proper domain (at least one dot after @)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  if (!emailRegex.test(registerData.email)) {
    error.value = t('error_registration') + ' — Email invalide'
    return
  }
  // Password: min 8 characters
  if (registerData.password.length < 8) {
    error.value = t('password_min_8')
    return
  }

  loading.value = true
  try {
    // إرسال البيانات للـ Backend (تأكد من أن المسار صحيح في الـ API الخاص بك)
    await axios.post(
      'https://belmahi-school-production.up.railway.app/api/auth/register',
      registerData,
    )

    successMessage.value = t('registration_success')

    // الانتظار قليلاً ثم العودة لصفحة الدخول بالأنيميشن
    setTimeout(() => {
      isSignUp.value = false
      email.value = registerData.email // ملء الإيميل تلقائياً لتسهيل الدخول
    }, 1000)
  } catch (err) {
    error.value = err.response?.data?.error || t('error_registration')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
    <div
      :class="darkMode ? 'bg-gray-800' : 'bg-white'"
      class="relative rounded-3xl md:rounded-[40px] shadow-2xl overflow-hidden max-w-5xl w-full mx-4 min-h-[700px] md:h-[650px] flex"
    >
      <div
        class="hidden md:flex absolute top-0 start-0 w-1/2 h-full z-20 transition-all duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] deep-blue-gradient text-white flex-col justify-center items-center text-center p-12"
        :style="{ transform: overlayTransform }"
      >
        <div v-if="!isSignUp" class="space-y-6">
          <h2 class="text-4xl font-bold">{{ t('welcome_title') }}</h2>
          <p class="text-blue-100 leading-relaxed">
            {{ t('login_subtitle') }}
          </p>

          <div class="space-y-4 text-start hidden md:block">
            <div class="flex items-center gap-3">
              <div class="bg-white/20 p-2 rounded-lg"><LogIn :size="20" /></div>
              <p class="text-sm">{{ t('secure_login') }}</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="bg-white/20 p-2 rounded-lg">📚</div>
              <p class="text-sm">{{ t('personalized_courses') }}</p>
            </div>
          </div>

          <button
            @click="toggleMode"
            class="mt-8 px-10 py-3 border-2 border-white/50 rounded-full font-bold hover:bg-white hover:text-blue-600 transition-all"
          >
            {{ t('create_account') }}
          </button>
        </div>

        <div v-else class="space-y-6">
          <h2 class="text-4xl font-bold">{{ t('welcome_back') }}</h2>
          <p class="text-blue-100 leading-relaxed">
            {{ t('have_account_text') }}
          </p>
          <button
            @click="toggleMode"
            :disabled="loading"
            class="mt-8 px-10 py-3 border-2 border-white/50 rounded-full font-bold hover:bg-white hover:text-blue-600 transition-all"
          >
            <span v-if="!loading">{{ t('login_button') }}</span>
            <div v-else class="flex items-center gap-2">
              <AppLoader size="24px" />
              <span>{{ t('loading_connexion') }}</span>
            </div>
          </button>
        </div>

        <div
          class="absolute bottom-6 start-6 right-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm text-xs text-start"
        >
          <p class="font-bold mb-1">{{ t('test_accounts_label') }}</p>
          <span>{{ t('test_student_example') }}</span>
          <span class="mx-1">|</span>
          <span>{{ t('test_admin_example') }}</span>
        </div>
      </div>

      <div
        class="absolute md:relative top-0 start-0 w-full md:w-1/2 h-full p-6 md:p-12 flex flex-col justify-center transition-all duration-700"
        :class="[
          isSignUp ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none',
          darkMode ? 'bg-gray-800' : 'bg-white',
        ]"
      >
        <h2 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-3xl font-bold mb-2">
          {{ t('register_title') }}
        </h2>
        <p class="text-gray-500 mb-6 text-sm">{{ t('register_subtitle') }}</p>

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
              class="absolute h-[calc(100%-8px)] w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out"
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
              <GraduationCap size="16" /> {{ t('student_role') }}
            </button>
            <button
              type="button"
              @click="registerData.role = 'Parent'"
              class="relative z-10 flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2"
              :class="registerData.role === 'Parent' ? 'text-blue-600' : 'text-gray-500'"
            >
              <Users size="16" /> {{ t('parent_role') }}
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
            class="w-full py-3 deep-blue-gradient text-white rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-lg"
          >
            {{ loading ? t('loading_inscription') : t('register_button') }}
          </button>
        </form>

        <div class="text-center mt-6 md:hidden">
          <p :class="darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-sm">
            {{ t('no_account') }}
            <button @click="toggleMode" class="text-blue-600 font-bold hover:underline">
              {{ t('register_link') }}
            </button>
          </p>
        </div>
      </div>

      <div
        class="absolute md:relative top-0 end-0 w-full md:w-1/2 h-full p-6 md:p-12 flex flex-col justify-center transition-all duration-700"
        :class="[
          isSignUp ? 'opacity-0 z-0 pointer-events-none' : 'opacity-100 z-10',
          darkMode ? 'bg-gray-800' : 'bg-white',
        ]"
      >
        <h2 :class="darkMode ? 'text-white' : 'text-gray-900'" class="text-3xl font-bold mb-2">
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
              @click.prevent="togglePasswordVisibility"
              class="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
            >
              <Eye v-if="!showPassword" :size="20" />
              <EyeOff v-else :size="20" />
            </button>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 deep-blue-gradient text-white rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-lg"
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
/* أنيميشن دخول الصفحة */
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

/* تعديل شكل حقل التاريخ */
input[type='date']::-webkit-calendar-picker-indicator {
  cursor: pointer;
  filter: invert(0.5);
}

.deep-blue-gradient {
  background: linear-gradient(135deg, #012254 0%, #0255ae 35%, #0271d9 70%, #1ba8f4 100%);
}

/* Prevent content flash during transition */
.login-page > div > div:not(.absolute) {
  transition: opacity 0.5s ease 0.2s;
}
</style>
