<template>
  <div class="onboarding-page" :style="{ '--primary': form.primaryColor }">
    <!-- Header — Generic platform branding, NOT Belmahi -->
    <div class="ob-header">
      <div class="ob-logo-placeholder">🏫</div>
      <h1>سجّل مدرستك</h1>
      <p>ابدأ تجربتك المجانية لمدة 14 يوماً — بدون بطاقة بنكية</p>
    </div>

    <!-- Progress steps -->
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

    <!-- Form card -->
    <div class="ob-card">
      <!-- Step 0: Personal Info (the human registering) -->
      <div v-if="currentStep === 0" class="step-content">
        <h2>معلوماتك الشخصية</h2>
        <p class="step-sub">أنت مسؤول المدرسة — سيُستخدم هذا البريد لتسجيل الدخول لاحقاً</p>

        <div class="field-row">
          <div class="field">
            <label>الاسم <span class="req">*</span></label>
            <input v-model="form.firstName" placeholder="أحمد" />
          </div>
          <div class="field">
            <label>اللقب <span class="req">*</span></label>
            <input v-model="form.lastName" placeholder="بن علي" />
          </div>
        </div>

        <div class="field">
          <label>البريد الإلكتروني <span class="req">*</span></label>
          <input v-model="form.adminEmail" type="email" placeholder="admin@ecole.dz" dir="ltr" />
        </div>

        <div class="field">
          <label>كلمة المرور <span class="req">*</span></label>
          <input
            v-model="form.adminPassword"
            type="password"
            placeholder="8 أحرف على الأقل"
            dir="ltr"
          />
          <p class="field-hint">
            {{
              form.adminPassword.length > 0 && form.adminPassword.length < 8
                ? '⚠️ كلمة المرور قصيرة جداً'
                : ''
            }}
          </p>
        </div>

        <div class="field-row">
          <div class="field">
            <label>رقم الهاتف</label>
            <input v-model="form.adminPhone" placeholder="07 XX XX XX XX" dir="ltr" />
          </div>
          <div class="field">
            <label>الولاية <span class="req">*</span></label>
            <select v-model="form.wilaya">
              <option value="" disabled>اختر الولاية</option>
              <option v-for="w in wilayas" :key="w" :value="w">{{ w }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Step 1: School Info -->
      <div v-if="currentStep === 1" class="step-content">
        <h2>معلومات المدرسة</h2>

        <div class="field">
          <label>اسم المدرسة (عربي) <span class="req">*</span></label>
          <input v-model="form.schoolNameAr" placeholder="مدرسة النجاح" />
        </div>
        <div class="field">
          <label>School Name (FR/EN)</label>
          <input v-model="form.schoolName" placeholder="École Najah" />
        </div>
        <div class="field">
          <label>الرابط المميز (Slug) <span class="req">*</span></label>
          <div class="slug-row">
            <input
              v-model="form.slug"
              placeholder="najah"
              @input="checkSlug"
              dir="ltr"
              style="direction: ltr"
            />
            <span class="domain">.votre-plateforme.dz</span>
          </div>
          <p class="slug-status" :class="slugStatus.type">{{ slugStatus.msg }}</p>
        </div>
      </div>

      <!-- Step 2: Visual Identity (logo + colors) -->
      <div v-if="currentStep === 2" class="step-content">
        <h2>هوية المدرسة البصرية</h2>

        <div class="field">
          <label>شعار المدرسة</label>
          <div class="logo-upload" @click="$refs.logoInput.click()">
            <img v-if="logoPreview" :src="logoPreview" alt="Logo" class="logo-preview-img" />
            <div v-else class="upload-placeholder">
              <span>📤</span>
              <p>اضغط لرفع الشعار (PNG, JPG)</p>
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

        <!-- Live preview -->
        <div class="preview-card" :style="{ background: form.secondaryColor }">
          <div class="preview-header" :style="{ background: form.primaryColor }">
            <img v-if="logoPreview" :src="logoPreview" class="preview-logo" />
            <span v-else class="preview-logo-ph">🏫</span>
            <span style="color: white; font-weight: bold">{{
              form.schoolNameAr || 'اسم المدرسة'
            }}</span>
          </div>
          <p style="padding: 12px; color: #333; font-size: 0.85rem">معاينة شكل نافبار المدرسة</p>
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
          {{ loading ? 'جاري الإرسال...' : 'إرسال الطلب 🎉' }}
        </button>
      </div>
    </div>

    <!-- Success overlay -->
    <div v-if="success" class="success-overlay">
      <div class="success-card">
        <div class="success-icon">✅</div>
        <h2>تم استلام طلبكم!</h2>
        <p>مدرستك في انتظار موافقة المشرف. سيتم إعلامكم قريباً على البريد الإلكتروني.</p>
        <p class="trial-info">
          بعد الموافقة، ادخل عبر: <strong>{{ form.slug }}.plateforme.dz</strong>
        </p>
        <p class="trial-info" style="color: #666; font-size: 0.8rem">
          ستجد شعار مدرستك وألوانها عند تسجيل الدخول.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const currentStep = ref(0)
const loading = ref(false)
const success = ref(false)
const logoPreview = ref(null)
const slugTimeout = ref(null)
const slugStatus = ref({ type: '', msg: '' })

const steps = ['معلوماتك', 'المدرسة', 'الهوية', 'الباقة']

const plans = ref([])

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

const form = ref({
  // Step 0: personal
  firstName: '',
  lastName: '',
  adminEmail: '',
  adminPassword: '',
  adminPhone: '',
  wilaya: '',
  // Step 1: school
  schoolName: '',
  schoolNameAr: '',
  slug: '',
  // Step 2: branding
  primaryColor: '#1a73e8',
  secondaryColor: '#f0f4ff',
  logoFile: null,
  // Step 3: plan
  planId: 1,
})

onMounted(async () => {
  try {
    const res = await axios.get(`${API}/onboarding/plans`)

    plans.value = res.data
  } catch {
    plans.value = [
      { id: 1, name_ar: 'تجريبية', price_dzd: 0, max_students: 30, max_teachers: 3 },
      { id: 2, name_ar: 'أساسية', price_dzd: 3000, max_students: 150, max_teachers: 10 },
      { id: 3, name_ar: 'احترافية', price_dzd: 6000, max_students: 500, max_teachers: 30 },
    ]
  }
})

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
    try {
      const res = await axios.get(`${API}/onboarding/check-slug?slug=${s}`)
      slugStatus.value = res.data.available
        ? { type: 'ok', msg: `✅ ${s}.plateforme.dz متاح` }
        : { type: 'error', msg: '❌ هذا الاسم محجوز، جرّب اسماً آخر' }
    } catch {
      slugStatus.value = { type: 'error', msg: 'خطأ في التحقق' }
    }
  }, 500)
}

function handleLogo(e) {
  const file = e.target.files[0]
  if (!file) return
  form.value.logoFile = file
  logoPreview.value = URL.createObjectURL(file)
}

const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return (
      form.value.firstName &&
      form.value.lastName &&
      form.value.adminEmail &&
      form.value.adminPassword.length >= 8 &&
      form.value.wilaya
    )
  }
  if (currentStep.value === 1) {
    return (
      (form.value.schoolName || form.value.schoolNameAr) &&
      form.value.slug.length >= 3 &&
      slugStatus.value.type === 'ok'
    )
  }
  return true
})

function nextStep() {
  if (canProceed.value) currentStep.value++
}

async function submitRegistration() {
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('firstName', form.value.firstName)
    formData.append('lastName', form.value.lastName)
    formData.append('adminEmail', form.value.adminEmail)
    formData.append('adminPassword', form.value.adminPassword)
    formData.append('adminPhone', form.value.adminPhone || '')
    formData.append('wilaya', form.value.wilaya || '')
    formData.append('schoolName', form.value.schoolName || form.value.schoolNameAr)
    formData.append('schoolNameAr', form.value.schoolNameAr || form.value.schoolName)
    formData.append('slug', form.value.slug)
    formData.append('primaryColor', form.value.primaryColor)
    formData.append('secondaryColor', form.value.secondaryColor)
    formData.append('planId', String(form.value.planId))
    if (form.value.logoFile) {
      formData.append('logo', form.value.logoFile)
    }

    await axios.post(`${API}/onboarding/register`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

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
  padding: 24px 16px 48px;
  font-family: 'Segoe UI', Tahoma, sans-serif;
  direction: rtl;
}

.ob-header {
  text-align: center;
  margin-bottom: 32px;
}
.ob-logo-placeholder {
  font-size: 3.5rem;
  margin-bottom: 8px;
}
.ob-header h1 {
  font-size: 2rem;
  color: #1a1a2e;
  margin: 0 0 4px;
}
.ob-header p {
  color: #666;
  font-size: 0.9rem;
}

.ob-steps {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}
.step-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.step-dot span {
  width: 34px;
  height: 34px;
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
  font-size: 0.68rem;
  color: #888;
  white-space: nowrap;
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
  max-width: 540px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.1);
}

.step-content h2 {
  font-size: 1.4rem;
  margin-bottom: 4px;
  color: #1a1a2e;
}
.step-sub {
  font-size: 0.82rem;
  color: #888;
  margin-bottom: 20px;
}

.field {
  margin-bottom: 16px;
}
.field label {
  display: block;
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 6px;
}
.req {
  color: #e53935;
}
.field input,
.field select {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  background: white;
}
.field input:focus,
.field select:focus {
  border-color: var(--primary, #1a73e8);
}
.field-hint {
  font-size: 0.75rem;
  color: #e53935;
  margin-top: 4px;
  min-height: 18px;
}

.field-row {
  display: flex;
  gap: 12px;
}
.field-row .field {
  flex: 1;
}

.slug-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.slug-row input {
  flex: 1;
}
.domain {
  color: #888;
  font-size: 0.8rem;
  white-space: nowrap;
}
.slug-status {
  font-size: 0.78rem;
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
  padding: 28px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}
.logo-upload:hover {
  border-color: var(--primary, #1a73e8);
}
.logo-preview-img {
  max-height: 80px;
  max-width: 100%;
  border-radius: 8px;
}
.upload-placeholder span {
  font-size: 2rem;
}
.upload-placeholder p {
  color: #888;
  margin: 4px 0 0;
  font-size: 0.85rem;
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
  font-size: 0.82rem;
  color: #555;
}

.preview-card {
  border-radius: 12px;
  overflow: hidden;
  margin-top: 16px;
}
.preview-header {
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.preview-logo {
  height: 30px;
  width: 30px;
  border-radius: 50%;
  object-fit: cover;
}
.preview-logo-ph {
  font-size: 1.4rem;
}

.plans-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.plan-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 14px 18px;
  cursor: pointer;
  transition: all 0.2s;
}
.plan-card:hover,
.plan-card.selected {
  border-color: var(--primary, #1a73e8);
}
.plan-card.selected {
  background: #f0f7ff;
}
.plan-card h3 {
  margin: 0 0 6px;
}
.price {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--primary, #1a73e8);
  margin-bottom: 6px;
}
.plan-card ul {
  margin: 0;
  padding-right: 18px;
  color: #555;
  font-size: 0.82rem;
}
.trial-note {
  text-align: center;
  color: #34a853;
  font-size: 0.82rem;
  margin-top: 10px;
}

.ob-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 28px;
  gap: 12px;
}
.btn-back {
  padding: 12px 22px;
  border: 2px solid #ddd;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 0.95rem;
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
  padding: 44px;
  text-align: center;
  max-width: 420px;
  width: 90%;
}
.success-icon {
  font-size: 3.5rem;
  margin-bottom: 14px;
}
.trial-info {
  color: #555;
  font-size: 0.88rem;
  margin-top: 8px;
}

@media (max-width: 480px) {
  .ob-card {
    padding: 20px;
  }
  .field-row {
    flex-direction: column;
  }
  .colors-row {
    flex-direction: column;
  }
}
</style>
