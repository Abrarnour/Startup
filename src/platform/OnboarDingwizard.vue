<template>
  <div class="onboarding-page" :style="{ '--primary': form.primaryColor }">
    <!-- Header -->
    <div class="ob-header">
      <img src="/belmahilogo.jpg" alt="Platform" class="platform-logo" />
      <h1>سجّل مدرستك</h1>
      <p>ابدأ تجربتك المجانية لمدة 14 يوماً</p>
    </div>

    <!-- Progress -->
    <div class="ob-steps">
      <div
        v-for="(step, i) in steps"
        :key="i"
        class="step-dot"
        :class="{ active: currentStep === i, done: currentStep > i }"
      >
        <span>{{ i + 1 }}</span>
        <p>{{ step }}</p>
      </div>
    </div>

    <!-- Form Steps -->
    <div class="ob-card">
      <!-- Step 0: School Info -->
      <div v-if="currentStep === 0" class="step-content">
        <h2>معلومات المدرسة</h2>
        <div class="field">
          <label>اسم المدرسة (عربي)</label>
          <input v-model="form.schoolNameAr" placeholder="مدرسة النجاح" />
        </div>
        <div class="field">
          <label>School Name (English/French)</label>
          <input v-model="form.schoolName" placeholder="Najah School" />
        </div>
        <div class="field">
          <label>رابط المدرسة (Slug)</label>
          <div class="slug-input">
            <input v-model="form.slug" placeholder="najah" @input="checkSlug" dir="ltr" />
            <span class="domain">.yourdomain.dz</span>
          </div>
          <p class="slug-status" :class="slugStatus.type">{{ slugStatus.msg }}</p>
        </div>
        <div class="field">
          <label>المدينة</label>
          <input v-model="form.city" placeholder="وهران" />
        </div>
      </div>

      <!-- Step 1: Design -->
      <div v-if="currentStep === 1" class="step-content">
        <h2>هوية المدرسة البصرية</h2>
        <div class="field">
          <label>شعار المدرسة</label>
          <div class="logo-upload" @click="$refs.logoInput.click()">
            <img v-if="logoPreview" :src="logoPreview" alt="logo" />
            <div v-else class="upload-placeholder">
              <span>📤</span>
              <p>اضغط لرفع الشعار</p>
            </div>
          </div>
          <input ref="logoInput" type="file" accept="image/*" hidden @change="handleLogo" />
        </div>
        <div class="colors-row">
          <div class="field">
            <label>اللون الرئيسي</label>
            <div class="color-picker">
              <input type="color" v-model="form.primaryColor" />
              <span>{{ form.primaryColor }}</span>
            </div>
          </div>
          <div class="field">
            <label>اللون الثانوي</label>
            <div class="color-picker">
              <input type="color" v-model="form.secondaryColor" />
              <span>{{ form.secondaryColor }}</span>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="preview-card" :style="{ background: form.secondaryColor }">
          <div class="preview-header" :style="{ background: form.primaryColor }">
            <img v-if="logoPreview" :src="logoPreview" class="preview-logo" />
            <span style="color: white; font-weight: bold">{{
              form.schoolNameAr || 'اسم المدرسة'
            }}</span>
          </div>
          <p style="padding: 12px; color: #333">معاينة مظهر المدرسة</p>
        </div>
      </div>

      <!-- Step 2: Admin Account -->
      <div v-if="currentStep === 2" class="step-content">
        <h2>حساب المسؤول</h2>
        <div class="field">
          <label>البريد الإلكتروني</label>
          <input v-model="form.adminEmail" type="email" placeholder="admin@school.dz" dir="ltr" />
        </div>
        <div class="field">
          <label>كلمة المرور</label>
          <input v-model="form.adminPassword" type="password" placeholder="••••••••" dir="ltr" />
        </div>
        <div class="field">
          <label>رقم الهاتف</label>
          <input v-model="form.adminPhone" placeholder="0550 000 000" dir="ltr" />
        </div>
      </div>

      <!-- Step 3: Plan -->
      <div v-if="currentStep === 3" class="step-content">
        <h2>اختر الباقة</h2>
        <div class="plans-grid">
          <div
            v-for="plan in plans"
            :key="plan.id"
            class="plan-card"
            :class="{ selected: form.planId === plan.id }"
            @click="form.planId = plan.id"
          >
            <h3>{{ plan.name_ar }}</h3>
            <div class="price">
              <span v-if="plan.price_dzd == 0">مجاناً</span>
              <span v-else>{{ plan.price_dzd }} دج/شهر</span>
            </div>
            <ul>
              <li>حتى {{ plan.max_students }} طالب</li>
              <li>حتى {{ plan.max_teachers }} أستاذ</li>
            </ul>
          </div>
        </div>
        <p class="trial-note">✅ جميع الباقات تشمل 14 يوماً تجريبياً مجاناً</p>
      </div>

      <!-- Navigation -->
      <div class="ob-nav">
        <button v-if="currentStep > 0" @click="currentStep--" class="btn-back">السابق</button>
        <button
          v-if="currentStep < steps.length - 1"
          @click="nextStep"
          class="btn-next"
          :style="{ background: form.primaryColor }"
          :disabled="!canProceed"
        >
          التالي
        </button>
        <button
          v-if="currentStep === steps.length - 1"
          @click="submitRegistration"
          class="btn-submit"
          :style="{ background: form.primaryColor }"
          :disabled="loading"
        >
          {{ loading ? 'جاري التسجيل...' : 'إنشاء المدرسة 🎉' }}
        </button>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="success" class="success-overlay">
      <div class="success-card">
        <div class="success-icon">🎉</div>
        <h2>تم إنشاء مدرستك!</h2>
        <p>يمكنك الآن تسجيل الدخول من:</p>
        <a :href="successUrl" class="login-link">{{ successUrl }}</a>
        <p class="trial-info">التجربة المجانية تنتهي بعد 14 يوماً</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const currentStep = ref(0)
const loading = ref(false)
const success = ref(false)
const successUrl = ref('')
const logoPreview = ref(null)
const slugTimeout = ref(null)
const slugStatus = ref({ type: '', msg: '' })

const steps = ['معلومات المدرسة', 'الهوية البصرية', 'حساب المسؤول', 'الباقة']

const plans = ref([])

const form = ref({
  schoolName: '',
  schoolNameAr: '',
  slug: '',
  city: '',
  primaryColor: '#1a73e8',
  secondaryColor: '#f0f4ff',
  adminEmail: '',
  adminPassword: '',
  adminPhone: '',
  planId: 1,
  logoFile: null,
})

onMounted(async () => {
  try {
    const res = await axios.get(`${API}/api/public/plans`)
    plans.value = res.data
  } catch {
    plans.value = [
      { id: 1, name_ar: 'تجريبية', price_dzd: 0, max_students: 30, max_teachers: 3 },
      { id: 2, name_ar: 'أساسية', price_dzd: 3000, max_students: 150, max_teachers: 10 },
      { id: 3, name_ar: 'احترافية', price_dzd: 6000, max_students: 500, max_teachers: 30 },
    ]
  }
})

// Slug validation
function checkSlug() {
  clearTimeout(slugTimeout.value)
  const s = form.value.slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
  form.value.slug = s
  if (s.length < 3) {
    slugStatus.value = { type: 'error', msg: 'على الأقل 3 أحرف' }
    return
  }
  slugStatus.value = { type: '', msg: 'جاري التحقق...' }
  slugTimeout.value = setTimeout(async () => {
    const res = await axios.get(`${API}/api/onboarding/check-slug?slug=${s}`)
    slugStatus.value = res.data.available
      ? { type: 'ok', msg: `✅ ${s}.yourdomain.dz متاح` }
      : { type: 'error', msg: '❌ هذا الاسم محجوز' }
  }, 500)
}

function handleLogo(e) {
  const file = e.target.files[0]
  if (!file) return
  form.value.logoFile = file
  logoPreview.value = URL.createObjectURL(file)
}

const canProceed = computed(() => {
  if (currentStep.value === 0)
    return form.value.schoolName && form.value.slug.length >= 3 && slugStatus.value.type === 'ok'
  if (currentStep.value === 2) return form.value.adminEmail && form.value.adminPassword.length >= 6
  return true
})

function nextStep() {
  if (canProceed.value) currentStep.value++
}

async function submitRegistration() {
  loading.value = true
  try {
    const res = await axios.post(`${API}/api/onboarding/register`, {
      schoolName: form.value.schoolName,
      schoolNameAr: form.value.schoolNameAr,
      slug: form.value.slug,
      adminEmail: form.value.adminEmail,
      adminPassword: form.value.adminPassword,
      adminPhone: form.value.adminPhone,
      city: form.value.city,
      primaryColor: form.value.primaryColor,
      secondaryColor: form.value.secondaryColor,
      planId: form.value.planId,
    })
    successUrl.value = res.data.tenant.loginUrl
    success.value = true
  } catch (err) {
    alert(err.response?.data?.error || 'حدث خطأ، حاول مرة أخرى')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  font-family: 'Segoe UI', Tahoma, sans-serif;
  direction: rtl;
}

.ob-header {
  text-align: center;
  margin-bottom: 32px;
}
.ob-header h1 {
  font-size: 2rem;
  color: #1a1a2e;
  margin: 8px 0;
}
.ob-header p {
  color: #666;
}
.platform-logo {
  height: 56px;
}

.ob-steps {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}
.step-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.step-dot span {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.85rem;
  transition: background 0.3s;
}
.step-dot p {
  font-size: 0.7rem;
  color: #888;
}
.step-dot.active span {
  background: var(--primary, #1a73e8);
  color: white;
}
.step-dot.done span {
  background: #34a853;
  color: white;
}

.ob-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.1);
}

.step-content h2 {
  font-size: 1.4rem;
  margin-bottom: 24px;
  color: #1a1a2e;
}

.field {
  margin-bottom: 18px;
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
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.field input:focus {
  border-color: var(--primary, #1a73e8);
}

.slug-input {
  display: flex;
  align-items: center;
  gap: 8px;
}
.slug-input input {
  flex: 1;
}
.domain {
  color: #888;
  font-size: 0.85rem;
  white-space: nowrap;
}
.slug-status {
  font-size: 0.8rem;
  margin-top: 4px;
}
.slug-status.ok {
  color: #34a853;
}
.slug-status.error {
  color: #e53935;
}

.logo-upload {
  border: 2px dashed #ccc;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}
.logo-upload:hover {
  border-color: var(--primary, #1a73e8);
}
.logo-upload img {
  max-height: 80px;
}
.upload-placeholder span {
  font-size: 2rem;
}
.upload-placeholder p {
  color: #888;
  margin: 4px 0 0;
}

.colors-row {
  display: flex;
  gap: 16px;
}
.colors-row .field {
  flex: 1;
}
.color-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
}
.color-picker input[type='color'] {
  width: 40px;
  height: 32px;
  border: none;
  padding: 0;
  cursor: pointer;
}
.color-picker span {
  font-size: 0.85rem;
  color: #555;
}

.preview-card {
  border-radius: 12px;
  overflow: hidden;
  margin-top: 16px;
}
.preview-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.preview-logo {
  height: 32px;
  width: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.plans-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.plan-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s;
}
.plan-card:hover {
  border-color: var(--primary, #1a73e8);
}
.plan-card.selected {
  border-color: var(--primary, #1a73e8);
  background: #f0f7ff;
}
.plan-card h3 {
  margin: 0 0 8px;
}
.price {
  font-size: 1.3rem;
  font-weight: bold;
  color: var(--primary, #1a73e8);
  margin-bottom: 8px;
}
.plan-card ul {
  margin: 0;
  padding-right: 20px;
  color: #555;
  font-size: 0.85rem;
}
.trial-note {
  text-align: center;
  color: #34a853;
  font-size: 0.85rem;
  margin-top: 12px;
}

.ob-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
  gap: 12px;
}
.btn-back {
  padding: 12px 24px;
  border: 2px solid #ddd;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 1rem;
}
.btn-next,
.btn-submit {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-next:disabled,
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.success-card {
  background: white;
  border-radius: 20px;
  padding: 48px;
  text-align: center;
  max-width: 400px;
}
.success-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}
.login-link {
  display: block;
  padding: 12px 24px;
  background: #1a73e8;
  color: white;
  border-radius: 10px;
  text-decoration: none;
  margin: 12px 0;
}
.trial-info {
  color: #888;
  font-size: 0.85rem;
}
</style>
