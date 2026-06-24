<template>
  <div class="auth-page">
    <!-- Left Panel -->
    <div class="left-panel">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>

      <div class="left-content">
        <router-link to="/mudar" class="logo">
          <img src="/logoMUDAR.png" alt="MUDAR" class="logo-img" />
          <span>MUDAR</span>
        </router-link>

        <div class="panel-quote">
          <h2>أدِر مدرستك<br /><em>باحترافية.</em></h2>
          <p>ادخل إلى فضاء إدارتك المتكامل — طلاب، معلمون، مدفوعات — في مكان واحد.</p>
        </div>

        <div class="stats-row">
          <div class="stat-pill">
            <span class="stat-num">200+</span>
            <span class="stat-lbl">مدرسة</span>
          </div>
          <div class="stat-pill">
            <span class="stat-num">48</span>
            <span class="stat-lbl">ولاية</span>
          </div>
          <div class="stat-pill">
            <span class="stat-num">100%</span>
            <span class="stat-lbl">آمن</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="right-panel">
      <div class="form-card">
        <div class="form-header">
          <h1>مرحباً 👋</h1>
          <p>سجّل الدخول إلى منصتك</p>
        </div>

        <div v-if="error" class="error-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {{ error }}
        </div>

        <div class="form">
          <div class="field">
            <label>البريد الإلكتروني</label>
            <div class="input-wrap">
              <svg
                class="input-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <input
                v-model="email"
                type="email"
                placeholder="admin@ecole.dz"
                dir="ltr"
                @keyup.enter="handleLogin"
              />
            </div>
          </div>

          <div class="field">
            <label>
              كلمة المرور
              <a href="#" class="forgot">نسيت كلمة المرور؟</a>
            </label>
            <div class="input-wrap">
              <svg
                class="input-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                dir="ltr"
                @keyup.enter="handleLogin"
              />
              <button type="button" class="toggle-pw" @click="showPassword = !showPassword">
                <svg
                  v-if="!showPassword"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg
                  v-else
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"
                  />
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            </div>
          </div>

          <button
            class="btn-submit"
            :class="{ loading: isLoading }"
            @click="handleLogin"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">دخول ←</span>
            <span v-else class="spinner"></span>
          </button>
        </div>

        <p class="switch-link">
          مدرستك غير مسجّلة؟
          <router-link to="/register-school">سجّل مدرستك الآن</router-link>
        </p>
      </div>
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
const showPassword = ref(false)
const isLoading = ref(false)
const error = ref('')

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function handleLogin() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'الرجاء إدخال البريد وكلمة المرور'
    return
  }
  isLoading.value = true

  // 1. Try SuperAdmin (platform) login
  try {
    await platformLogin(email.value, password.value)
    router.push('/platform/dashboard')
    return
  } catch (_) {
    // not a superadmin, continue
  }

  // 2. Try school client login (onboarding/client-login endpoint)
  try {
    const res = await fetch(`${API_URL}/onboarding/client-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'البريد أو كلمة المرور غير صحيحة')
    }
    const data = await res.json()
    localStorage.setItem('client_token', data.token)
    localStorage.setItem('client_tenant', JSON.stringify(data.tenant))
    // Always redirect to the client portal dashboard
    router.push('/register-school')
  } catch (e) {
    error.value = e.message || 'البريد أو كلمة المرور غير صحيحة'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,300;0,400;1,300;1,400&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.auth-page {
  display: flex;
  min-height: 100vh;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  direction: rtl;
}

.left-panel {
  position: relative;
  width: 42%;
  background: #1e0a3c;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(3px);
}
.blob-1 {
  width: 500px;
  height: 500px;
  bottom: -150px;
  right: -150px;
  background: radial-gradient(circle, #5b21b6 0%, #7c3aed 40%, transparent 75%);
  opacity: 0.85;
  animation: blobFloat1 9s ease-in-out infinite;
}
.blob-2 {
  width: 350px;
  height: 350px;
  top: -80px;
  left: -80px;
  background: radial-gradient(circle, #a855f7 0%, #e879f9 45%, transparent 75%);
  opacity: 0.55;
  animation: blobFloat2 11s ease-in-out infinite;
}
.blob-3 {
  width: 220px;
  height: 220px;
  top: 50%;
  right: 50%;
  transform: translate(50%, -50%);
  background: radial-gradient(circle, #7c3aed 0%, transparent 70%);
  opacity: 0.3;
  animation: blobFloat1 7s ease-in-out infinite reverse;
}

.left-content {
  position: relative;
  z-index: 2;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
}
.logo-img {
  width: 80px; /* تكبير الرمز مباشرة */
  height: auto;
  object-fit: contain;
  border-radius: 0;
  background: none !important; /* حذف التظليل الخلفي الصغير */
  padding: 0;
  mix-blend-mode: multiply; /* إزالة الخلفية البيضاء برمجياً */
}

.panel-quote h2 {
  font-family: 'Fraunces', serif;
  font-size: 32px;
  font-weight: 300;
  line-height: 1.2;
  letter-spacing: -1px;
  margin-bottom: 12px;
}
.panel-quote h2 em {
  font-style: italic;
  background: linear-gradient(135deg, #c084fc, #e879f9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.panel-quote p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.7;
}

.stats-row {
  display: flex;
  gap: 10px;
}
.stat-pill {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 14px 10px;
  text-align: center;
  backdrop-filter: blur(8px);
}
.stat-num {
  display: block;
  font-family: 'Fraunces', serif;
  font-size: 20px;
  color: #e879f9;
  font-weight: 600;
}
.stat-lbl {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 2px;
  display: block;
}

.right-panel {
  flex: 1;
  background: #f9f7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.form-card {
  width: 100%;
  max-width: 420px;
}

.form-header {
  margin-bottom: 2rem;
}
.form-header h1 {
  font-family: 'Fraunces', serif;
  font-size: 30px;
  font-weight: 300;
  color: #1e0a3c;
  letter-spacing: -0.8px;
  margin-bottom: 6px;
}
.form-header p {
  font-size: 14px;
  color: #7c6b99;
}

.error-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: 1rem;
}
.error-box svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.field label {
  font-size: 13px;
  font-weight: 600;
  color: #3b0764;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot {
  font-size: 12px;
  font-weight: 400;
  color: #a855f7;
  text-decoration: none;
}
.forgot:hover {
  text-decoration: underline;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  right: 13px;
  width: 16px;
  height: 16px;
  color: #a78bfa;
  pointer-events: none;
}

.input-wrap input {
  width: 100%;
  padding: 11px 44px 11px 44px;
  border: 1.5px solid #ede9fe;
  border-radius: 10px;
  font-size: 14px;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  color: #1e0a3c;
  background: #fff;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.input-wrap input:focus {
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.12);
}
.input-wrap input::placeholder {
  color: #c4b5fd;
}

.toggle-pw {
  position: absolute;
  left: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #a78bfa;
  display: flex;
  align-items: center;
}
.toggle-pw svg {
  width: 16px;
  height: 16px;
}

.btn-submit {
  margin-top: 6px;
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  cursor: pointer;
  transition:
    opacity 0.2s,
    transform 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  box-shadow: 0 4px 18px rgba(124, 58, 237, 0.3);
}
.btn-submit:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-submit.loading,
.btn-submit:disabled {
  opacity: 0.75;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

.switch-link {
  margin-top: 22px;
  text-align: center;
  font-size: 13px;
  color: #7c6b99;
}
.switch-link a {
  color: #7c3aed;
  font-weight: 600;
  text-decoration: none;
  margin-right: 4px;
}
.switch-link a:hover {
  text-decoration: underline;
}

@keyframes blobFloat1 {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(4deg);
  }
}
@keyframes blobFloat2 {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(16px) rotate(-3deg);
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .left-panel {
    display: none;
  }
  .right-panel {
    padding: 2rem 1.25rem;
    background: #fff;
  }
}
</style>
