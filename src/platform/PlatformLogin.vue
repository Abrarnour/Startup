<template>
  <div class="platform-login">
    <div class="login-card">
      <div class="login-icon">🏛️</div>
      <h1>لوحة الإدارة العليا</h1>
      <p class="login-sub">للمشغّلين فقط</p>

      <div class="field">
        <label>البريد الإلكتروني</label>
        <input
          v-model="email"
          type="email"
          placeholder="admin@platform.dz"
          dir="ltr"
          @keyup.enter="handleLogin"
        />
      </div>
      <div class="field">
        <label>كلمة المرور</label>
        <input
          v-model="password"
          type="password"
          placeholder="••••••••"
          dir="ltr"
          @keyup.enter="handleLogin"
        />
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <button @click="handleLogin" class="login-btn" :disabled="loading">
        {{ loading ? 'جاري الدخول...' : 'دخول' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { platformLogin } from '../../services/api.js'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'أدخل البيانات'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await platformLogin(email.value, password.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = 'بيانات خاطئة'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.platform-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
  direction: rtl;
}
.login-card {
  background: white;
  border-radius: 20px;
  padding: 48px 40px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}
.login-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}
.login-card h1 {
  font-size: 1.4rem;
  color: #1a1a2e;
  margin: 0 0 4px;
}
.login-sub {
  color: #888;
  font-size: 0.85rem;
  margin: 0 0 32px;
}

.field {
  margin-bottom: 16px;
  text-align: right;
}
.field label {
  display: block;
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 6px;
}
.field input {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  outline: none;
  box-sizing: border-box;
}
.field input:focus {
  border-color: #1a73e8;
}

.error-msg {
  color: #e53935;
  font-size: 0.85rem;
  margin: -8px 0 12px;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: #1a1a2e;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
  transition: opacity 0.2s;
}
.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
