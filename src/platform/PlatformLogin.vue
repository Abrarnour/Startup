<template>
  <div class="platform-login-page">
    <div class="login-box">
      <div class="login-header">
        <span class="lock-icon">🔐</span>
        <h1>لوحة الإدارة العليا</h1>
        <p>للمشرفين المصرّح لهم فقط</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="field">
          <label>البريد الإلكتروني</label>
          <input
            v-model="email"
            type="email"
            placeholder="admin@platform.dz"
            dir="ltr"
            autocomplete="email"
          />
        </div>
        <div class="field">
          <label>كلمة المرور</label>
          <div class="password-wrap">
            <input
              v-model="password"
              :type="showPw ? 'text' : 'password'"
              placeholder="••••••••"
              dir="ltr"
              autocomplete="current-password"
            />
            <button type="button" class="eye-btn" @click="showPw = !showPw">
              {{ showPw ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <div v-if="error" class="error-box">❌ {{ error }}</div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading" class="spinner-inline"></span>
          {{ loading ? 'جاري تسجيل الدخول...' : 'دخول' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { platformLogin } from '../services/api.js'

const router = useRouter()
const email = ref('')
const password = ref('')
const showPw = ref(false)
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'الرجاء إدخال البريد وكلمة المرور'
    return
  }
  loading.value = true
  try {
    await platformLogin(email.value, password.value)
    router.push('/platform/dashboard')
  } catch (e) {
    error.value = e.message || 'بيانات الدخول غير صحيحة'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.platform-login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0d1b2a 0%, #1a2a4a 60%, #0d1b2a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: 'Segoe UI', sans-serif;
  direction: rtl;
}

.login-box {
  background: #fff;
  border-radius: 20px;
  padding: 44px 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.lock-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 10px;
}
.login-header h1 {
  font-size: 1.5rem;
  color: #1a1a2e;
  margin: 0 0 6px;
}
.login-header p {
  color: #888;
  font-size: 0.85rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 0.85rem;
  color: #555;
  font-weight: 500;
}
.field input {
  padding: 12px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}
.field input:focus {
  border-color: #1a73e8;
}

.password-wrap {
  position: relative;
}
.password-wrap input {
  width: 100%;
  box-sizing: border-box;
  padding-left: 44px;
}
.eye-btn {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
}

.error-box {
  background: #fce4ec;
  color: #c62828;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
}

.submit-btn {
  padding: 14px;
  background: linear-gradient(135deg, #012254, #1a73e8);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.spinner-inline {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
