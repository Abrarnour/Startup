<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { registerSchool } from '../services/api.js'

const router = useRouter()

const step = ref(1) // 1 = form, 2 = success
const loading = ref(false)
const error = ref('')

const form = reactive({
  school_name: '',
  school_name_ar: '',
  slug: '',
  admin_email: '',
  admin_password: '',
  admin_phone: '',
  city: '',
  primary_color: '#1a73e8',
})

const slugError = ref('')

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 30)
}

function onSchoolNameInput() {
  if (!form.slug || form.slug === generateSlug(form.school_name.slice(0, -1))) {
    form.slug = generateSlug(form.school_name)
  }
}

function validateSlug(val) {
  if (!/^[a-z0-9-]{3,30}$/.test(val)) {
    slugError.value = 'Slug: 3–30 caractères, lettres minuscules, chiffres et tirets uniquement.'
  } else {
    slugError.value = ''
  }
}

async function submit() {
  error.value = ''
  if (slugError.value) return
  if (!form.school_name || !form.slug || !form.admin_email || !form.admin_password || !form.city) {
    error.value = 'Veuillez remplir tous les champs obligatoires.'
    return
  }
  if (form.admin_password.length < 8) {
    error.value = 'Le mot de passe doit contenir au moins 8 caractères.'
    return
  }
  loading.value = true
  try {
    await registerSchool({
      schoolName: form.school_name,
      schoolNameAr: form.school_name_ar,
      slug: form.slug,
      adminEmail: form.admin_email,
      adminPassword: form.admin_password,
      adminPhone: form.admin_phone,
      city: form.city,
      primaryColor: form.primary_color,
    })
    step.value = 2
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
  >
    <!-- Success -->
    <div v-if="step === 2" class="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
      <div
        class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#16a34a"
          stroke-width="2.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-3">Inscription soumise !</h1>
      <p class="text-gray-600 mb-2">Votre demande d'inscription a été envoyée à notre équipe.</p>
      <p class="text-gray-500 text-sm mb-8">
        Vous recevrez un email de confirmation à <strong>{{ form.admin_email }}</strong> une fois
        votre école approuvée (généralement sous 24h).
      </p>
      <a
        href="/"
        class="block w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
      >
        Retour à l'accueil
      </a>
    </div>

    <!-- Registration Form -->
    <div v-else class="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="flex justify-center items-center mx-auto mb-6">
          <img
            src="/logoMUDAR.png"
            alt="MUDAR"
            class="w-28 h-auto object-contain"
            style="mix-blend-mode: multiply"
          />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Inscrire votre école</h1>
        <p class="text-gray-500 mt-1">Essai gratuit · Aucune carte bancaire requise</p>
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
      >
        {{ error }}
      </div>

      <div class="space-y-5">
        <!-- School Name -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'école (FR) <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.school_name"
              @input="onSchoolNameInput"
              type="text"
              placeholder="Ex: École Excellence"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> اسم المدرسة (AR) </label>
            <input
              v-model="form.school_name_ar"
              type="text"
              dir="rtl"
              placeholder="مثال: مدرسة التميز"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <!-- Slug -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Identifiant unique (slug) <span class="text-red-500">*</span>
          </label>
          <div
            class="flex items-center border-2 rounded-xl overflow-hidden"
            :class="slugError ? 'border-red-400' : 'border-gray-200 focus-within:border-blue-500'"
          >
            <span
              class="px-3 py-3 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 whitespace-nowrap"
              >votre-plateforme.dz/</span
            >
            <input
              v-model="form.slug"
              @input="validateSlug(form.slug)"
              type="text"
              placeholder="ecole-excellence"
              class="flex-1 px-3 py-3 outline-none bg-white text-sm"
            />
          </div>
          <p v-if="slugError" class="text-red-500 text-xs mt-1">{{ slugError }}</p>
          <p v-else class="text-gray-400 text-xs mt-1">
            Lettres minuscules, chiffres et tirets uniquement.
          </p>
        </div>

        <!-- Admin Account -->
        <div class="pt-2 border-t border-gray-100">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Compte administrateur
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Email admin <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.admin_email"
                type="email"
                placeholder="admin@ecole.dz"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.admin_password"
                type="password"
                placeholder="Min. 8 caractères"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <!-- Location + Color -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Téléphone admin </label>
            <input
              v-model="form.admin_phone"
              type="tel"
              placeholder="+213 5XX XXX XXX"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Ville <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.city"
              type="text"
              placeholder="Oran"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <!-- Color -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
          <div class="flex items-center gap-3">
            <input
              v-model="form.primary_color"
              type="color"
              class="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer p-1"
            />
            <span class="text-sm text-gray-500">{{ form.primary_color }}</span>
          </div>
        </div>

        <!-- Submit -->
        <button
          @click="submit"
          :disabled="loading"
          class="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {{ loading ? 'Envoi en cours...' : "Soumettre la demande d'inscription" }}
        </button>

        <p class="text-center text-sm text-gray-400">
          Déjà inscrit ?
          <router-link to="/platform/login" class="text-blue-600 hover:underline"
            >Accès SuperAdmin</router-link
          >
        </p>
      </div>
    </div>
  </div>
</template>
