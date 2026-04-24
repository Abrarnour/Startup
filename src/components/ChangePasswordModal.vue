<script setup>
import { ref } from 'vue'
import { Lock, Eye, EyeOff, X } from 'lucide-vue-next'
import { changeMyPassword } from '../services/api.js'
import { useLanguage } from '../composables/useLanguage.js'

const { t } = useLanguage()

const props = defineProps({
  show: { type: Boolean, default: false },
  darkMode: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const oldPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')

const showOld = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const loading = ref(false)
const error = ref('')
const success = ref('')

const reset = () => {
  oldPwd.value = ''
  newPwd.value = ''
  confirmPwd.value = ''
  error.value = ''
  success.value = ''
  loading.value = false
}

const handleClose = () => {
  reset()
  emit('close')
}

const handleSubmit = async () => {
  error.value = ''
  success.value = ''

  if (!oldPwd.value || !newPwd.value || !confirmPwd.value) {
    error.value = t('fill_all_fields')
    return
  }
  if (newPwd.value.length < 8) {
    error.value = t('password_min_8')
    return
  }
  if (newPwd.value !== confirmPwd.value) {
    error.value = t('passwords_not_match')
    return
  }
  if (newPwd.value === oldPwd.value) {
    error.value = t('same_password_error')
    return
  }

  loading.value = true
  try {
    await changeMyPassword(oldPwd.value, newPwd.value)
    success.value = t('password_changed_success')
    setTimeout(() => handleClose(), 2000)
  } catch (e) {
    error.value =
      e.message === 'Ancien mot de passe incorrect' ? t('wrong_old_password') : e.message
  } finally {
    loading.value = false
  }
}

// Password strength indicator
const strength = computed(() => {
  const p = newPwd.value
  if (!p) return 0
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
})

const strengthLabel = computed(() => {
  if (strength.value <= 1) return { text: t('pwd_weak'), color: 'bg-red-500' }
  if (strength.value <= 3) return { text: t('pwd_medium'), color: 'bg-yellow-500' }
  return { text: t('pwd_strong'), color: 'bg-green-500' }
})

import { computed } from 'vue'
</script>

<template>
  <Transition name="modal-fade">
    <div
      v-if="show"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="handleClose"
    >
      <div
        :class="darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'"
        class="relative rounded-3xl shadow-2xl p-8 w-full max-w-md"
      >
        <!-- Close button -->
        <button
          @click="handleClose"
          class="absolute top-4 end-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          :class="darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'"
        >
          <X :size="20" />
        </button>

        <!-- Header -->
        <div class="flex items-center gap-4 mb-8">
          <div class="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
            <Lock :size="28" class="text-white" />
          </div>
          <div>
            <h2 class="text-2xl font-bold">{{ t('change_my_password') }}</h2>
            <p :class="darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-sm mt-1">
              {{ t('password_min_8') }}
            </p>
          </div>
        </div>

        <!-- Error / Success -->
        <Transition name="slide-down">
          <div
            v-if="error"
            class="mb-5 p-3 bg-red-100 border-s-4 border-red-500 text-red-700 rounded-xl text-sm flex items-center gap-2"
          >
            ❌ {{ error }}
          </div>
        </Transition>
        <Transition name="slide-down">
          <div
            v-if="success"
            class="mb-5 p-3 bg-green-100 border-s-4 border-green-500 text-green-700 rounded-xl text-sm flex items-center gap-2"
          >
            ✅ {{ success }}
          </div>
        </Transition>

        <div class="space-y-4">
          <!-- Old password -->
          <div>
            <label
              :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
              class="block text-sm font-semibold mb-2"
            >
              {{ t('old_password') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <Lock class="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
              <input
                v-model="oldPwd"
                :type="showOld ? 'text' : 'password'"
                :placeholder="t('old_password')"
                :class="
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                "
                class="w-full ps-10 pe-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <button
                @click="showOld = !showOld"
                type="button"
                class="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
              >
                <Eye v-if="!showOld" :size="18" />
                <EyeOff v-else :size="18" />
              </button>
            </div>
          </div>

          <!-- New password -->
          <div>
            <label
              :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
              class="block text-sm font-semibold mb-2"
            >
              {{ t('new_password') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <Lock class="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
              <input
                v-model="newPwd"
                :type="showNew ? 'text' : 'password'"
                :placeholder="t('new_password')"
                :class="
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                "
                class="w-full ps-10 pe-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <button
                @click="showNew = !showNew"
                type="button"
                class="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
              >
                <Eye v-if="!showNew" :size="18" />
                <EyeOff v-else :size="18" />
              </button>
            </div>

            <!-- Strength bar -->
            <div v-if="newPwd" class="mt-2">
              <div class="flex gap-1 mb-1">
                <div
                  v-for="i in 5"
                  :key="i"
                  class="h-1.5 flex-1 rounded-full transition-all duration-300"
                  :class="
                    i <= strength ? strengthLabel.color : darkMode ? 'bg-gray-600' : 'bg-gray-200'
                  "
                />
              </div>
              <p class="text-xs" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
                {{ strengthLabel.text }}
              </p>
            </div>
          </div>

          <!-- Confirm password -->
          <div>
            <label
              :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
              class="block text-sm font-semibold mb-2"
            >
              {{ t('confirm_password') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <Lock class="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
              <input
                v-model="confirmPwd"
                :type="showConfirm ? 'text' : 'password'"
                :placeholder="t('confirm_password')"
                :class="[
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-50 border-gray-200',
                  confirmPwd && newPwd !== confirmPwd ? '!border-red-400' : '',
                  confirmPwd && newPwd === confirmPwd ? '!border-green-400' : '',
                ]"
                class="w-full ps-10 pe-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <button
                @click="showConfirm = !showConfirm"
                type="button"
                class="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
              >
                <Eye v-if="!showConfirm" :size="18" />
                <EyeOff v-else :size="18" />
              </button>
            </div>
            <p v-if="confirmPwd && newPwd !== confirmPwd" class="text-xs text-red-500 mt-1">
              {{ t('passwords_not_match') }}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 mt-8">
          <button
            @click="handleClose"
            :class="
              darkMode
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            "
            class="flex-1 py-3 border-2 rounded-xl font-semibold transition-all"
          >
            {{ t('cancel') }}
          </button>
          <button
            @click="handleSubmit"
            :disabled="loading || (confirmPwd && newPwd !== confirmPwd)"
            class="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span
              v-if="loading"
              class="inline-block animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
            {{ loading ? t('loading') : t('save') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
