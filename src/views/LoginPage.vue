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
import { useLanguage } from '../composables/useLanguage.js' // ✅ نظام اللغة

const { t } = useLanguage() // ✅ استدعاء دالة الترجمة
const router = useRouter()

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
  role: 'student', // القيمة الافتراضية
  birthday: '',
  city: '',
})

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
      class="relative rounded-[40px] shadow-2xl overflow-hidden max-w-5xl w-full mx-4 h-[650px] flex"
    >
      <div
        class="absolute top-0 start-0 w-1/2 h-full z-50 transition-transform duration-700 ease-in-out deep-blue-gradient text-white flex flex-col text-white flex flex-col justify-center items-center text-center p-12"
        :class="isSignUp ? 'translate-x-full' : 'translate-x-0'"
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
            class="mt-8 px-10 py-3 border-2 border-white/50 rounded-full font-bold hover:bg-white hover:text-blue-600 transition-all"
          >
            {{ t('login_button') }}
          </button>
        </div>

        <div
          class="absolute bottom-6 start-6 right-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm text-xs text-start"
        >
          <p class="font-bold mb-1">🔑 Test Accounts:</p>
          <span>Etudiant: etudiant@usto.dz | Admin: admin@usto.dz</span>
        </div>
      </div>

      <div
        class="w-1/2 h-full p-12 flex flex-col justify-center transition-all duration-700"
        :class="isSignUp ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'"
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
          <div class="grid grid-cols-2 gap-3">
            <input
              v-model="registerData.birthday"
              type="date"
              class="p-2.5 border rounded-xl bg-gray-50 text-sm text-gray-400"
            />
            <input
              v-model="registerData.city"
              type="text"
              :placeholder="t('city')"
              class="p-2.5 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500"
            />
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
      </div>

      <div
        class="w-1/2 h-full p-12 flex flex-col justify-center transition-all duration-700"
        :class="isSignUp ? 'opacity-0 z-0 pointer-events-none' : 'opacity-100 z-10'"
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
</style>
