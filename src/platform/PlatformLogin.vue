<template>
  <div class="pl-root">
    <!-- Left panel -->
    <div class="pl-panel-left">
      <div class="pl-orb pl-orb-1"></div>
      <div class="pl-orb pl-orb-2"></div>
      <div class="pl-orb pl-orb-3"></div>

      <div class="pl-brand">
        <div class="pl-brand-icon">
          <img
            src="/logoMUDAR.png"
            alt="MUDAR"
            style="width: 100%; height: 100%; object-fit: contain; border-radius: 6px; padding: 1px"
          />
        </div>
        <span class="pl-brand-name">MUDAR</span>
      </div>

      <div class="pl-hero">
        <h1>لوحة الإدارة<br /><em>العليا</em></h1>
        <p>منصة إدارة شاملة للمدارس والمعاهد — مراقبة، موافقة، وتحكم كامل من مكان واحد.</p>
      </div>

      <ul class="pl-features">
        <li>
          <div class="pl-feat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <span>مراجعة وموافقة طلبات المدارس</span>
        </li>
        <li>
          <div class="pl-feat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <span>إنشاء بيئات عمل مستقلة لكل مدرسة</span>
        </li>
        <li>
          <div class="pl-feat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <span>إحصائيات وفواتير مركزية</span>
        </li>
      </ul>

      <div class="pl-badge">للمشرفين المصرّح لهم فقط</div>
    </div>

    <!-- Right panel -->
    <div class="pl-panel-right">
      <div class="pl-form-wrap">
        <div class="pl-form-header">
          <div class="pl-lock-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2>تسجيل الدخول</h2>
          <p>أدخل بيانات الوصول الخاصة بك</p>
        </div>

        <form @submit.prevent="handleLogin" class="pl-form" novalidate>
          <div class="pl-field">
            <label>البريد الإلكتروني</label>
            <div class="pl-input-wrap">
              <span class="pl-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                v-model="email"
                type="email"
                placeholder="admin@platform.dz"
                dir="ltr"
                autocomplete="email"
                :class="{ 'has-error': error }"
              />
            </div>
          </div>

          <div class="pl-field">
            <label>كلمة المرور</label>
            <div class="pl-input-wrap">
              <span class="pl-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                v-model="password"
                :type="showPw ? 'text' : 'password'"
                placeholder="••••••••"
                dir="ltr"
                autocomplete="current-password"
                :class="{ 'has-error': error }"
              />
              <button type="button" class="pl-eye-btn" @click="showPw = !showPw" tabindex="-1">
                <svg
                  v-if="!showPw"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            </div>
          </div>

          <div v-if="error" class="pl-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{{ error }}</span>
          </div>

          <button type="submit" class="pl-submit" :disabled="loading">
            <span v-if="loading" class="pl-spinner"></span>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            {{ loading ? 'جاري تسجيل الدخول...' : 'دخول' }}
          </button>
        </form>

        <p class="pl-footer-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          هذه الصفحة مخصصة للإدارة العليا فقط
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
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');

* {
  box-sizing: border-box;
}

.pl-root {
  min-height: 100vh;
  display: flex;
  font-family: 'IBM Plex Sans Arabic', 'Segoe UI', sans-serif;
  direction: rtl;
}

/* ── Left panel ─────────────────────────────────── */
.pl-panel-left {
  width: 42%;
  background: linear-gradient(155deg, #1e0a3c 0%, #3b0764 40%, #5b21b6 75%, #7c3aed 100%);
  padding: 3rem;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* Orbs */
.pl-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.35;
  pointer-events: none;
}
.pl-orb-1 {
  width: 300px;
  height: 300px;
  background: #a855f7;
  top: -80px;
  right: -80px;
}
.pl-orb-2 {
  width: 200px;
  height: 200px;
  background: #4f46e5;
  bottom: 100px;
  left: -40px;
}
.pl-orb-3 {
  width: 150px;
  height: 150px;
  background: #ec4899;
  bottom: -30px;
  right: 40px;
  opacity: 0.2;
}

/* Brand */
.pl-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 3.5rem;
  position: relative;
  z-index: 1;
}
.pl-brand-icon {
  width: 65px; /* زيادة مساحة الحاوية */
  height: auto;
  background: none !important; /* إزالة التظليل الافتراضي */
  border: none !important;
  backdrop-filter: none !important;
}
.pl-brand-icon img {
  width: 100%;
  height: auto;
  mix-blend-mode: multiply; /* إزالة الخلفية البيضاء */
}
.pl-brand-icon svg {
  width: 18px;
  height: 18px;
  color: #e9d5ff;
}
.pl-brand-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.3px;
}

/* Hero */
.pl-hero {
  position: relative;
  z-index: 1;
  margin-bottom: 2.5rem;
}
.pl-hero h1 {
  font-size: 2.4rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.25;
  margin: 0 0 1rem;
}
.pl-hero h1 em {
  font-style: italic;
  color: #c4b5fd;
}
.pl-hero p {
  color: #c4b5fd;
  font-size: 0.95rem;
  line-height: 1.65;
  margin: 0;
}

/* Features */
.pl-features {
  list-style: none;
  padding: 0;
  margin: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  position: relative;
  z-index: 1;
}
.pl-features li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #ddd6fe;
  font-size: 0.88rem;
}
.pl-feat-icon {
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.pl-feat-icon svg {
  width: 14px;
  height: 14px;
  color: #a78bfa;
}

.pl-badge {
  margin-top: 2rem;
  display: inline-flex;
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e9d5ff;
  font-size: 0.75rem;
  padding: 0.35rem 0.9rem;
  border-radius: 100px;
  backdrop-filter: blur(8px);
  position: relative;
  z-index: 1;
}

/* ── Right panel ─────────────────────────────────── */
.pl-panel-right {
  flex: 1;
  background: #faf9ff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
}

.pl-form-wrap {
  width: 100%;
  max-width: 400px;
}

.pl-form-header {
  text-align: center;
  margin-bottom: 2.5rem;
}
.pl-lock-icon {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.3);
}
.pl-lock-icon svg {
  width: 24px;
  height: 24px;
  color: #fff;
}

.pl-form-header h2 {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1e0a3c;
  margin: 0 0 0.4rem;
}
.pl-form-header p {
  color: #7c6f9a;
  font-size: 0.88rem;
  margin: 0;
}

/* Form */
.pl-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.pl-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.pl-field label {
  font-size: 0.83rem;
  font-weight: 600;
  color: #3b0764;
}

.pl-input-wrap {
  position: relative;
}
.pl-input-icon {
  position: absolute;
  right: 13px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
.pl-input-icon svg {
  width: 16px;
  height: 16px;
  color: #a78bfa;
}

.pl-input-wrap input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 0.9rem;
  border: 2px solid #e9d5ff;
  border-radius: 12px;
  font-size: 0.92rem;
  color: #1e0a3c;
  background: #fff;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  font-family: inherit;
}
.pl-input-wrap input:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
}
.pl-input-wrap input.has-error {
  border-color: #dc2626;
}

.pl-eye-btn {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
}
.pl-eye-btn svg {
  width: 16px;
  height: 16px;
  color: #a78bfa;
}
.pl-eye-btn:hover svg {
  color: #7c3aed;
}

/* Error */
.pl-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  font-size: 0.83rem;
}
.pl-error svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

/* Submit */
.pl-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem;
  background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 60%, #a855f7 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.98rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity 0.2s,
    transform 0.15s,
    box-shadow 0.2s;
  font-family: inherit;
  box-shadow: 0 4px 18px rgba(124, 58, 237, 0.35);
  margin-top: 0.25rem;
}
.pl-submit svg {
  width: 18px;
  height: 18px;
}
.pl-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 28px rgba(124, 58, 237, 0.45);
}
.pl-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.pl-spinner {
  width: 17px;
  height: 17px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: pl-spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes pl-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Footer note */
.pl-footer-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 1.75rem;
  font-size: 0.78rem;
  color: #9d8bbf;
}
.pl-footer-note svg {
  width: 13px;
  height: 13px;
}

/* Responsive */
@media (max-width: 768px) {
  .pl-panel-left {
    display: none;
  }
  .pl-panel-right {
    padding: 2rem 1.25rem;
    background: #fff;
  }
}
</style>
