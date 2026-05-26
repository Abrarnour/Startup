<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import { getCurrentUser, logout as apiLogout } from '../services/api.js'
import { useLanguage } from '../composables/useLanguage.js'

// ── Detect context ─────────────────────────────────────────────
const hostname = window.location.hostname.replace(':5173', '').replace(':3000', '')
const parts = hostname.split('.')
const isPlatform = parts[0] === 'admin' || window.location.pathname.startsWith('/platform')
const isSchool =
  parts.length >= 2 && parts[0] !== 'admin' && parts[0] !== 'localhost' && parts[0] !== 'www'

// ── Tenant data (for school app only) ─────────────────────────
const tenantConfig = ref(null)

onMounted(async () => {
  if (!isSchool) return
  const slug = parts[0]
  try {
    const res = await fetch('/api/tenant-config', {
      headers: { 'X-Tenant-Slug': slug },
    })
    if (!res.ok) return
    const data = await res.json()
    tenantConfig.value = data
    const root = document.documentElement
    root.style.setProperty('--color-primary', data.primary_color || '#1a73e8')
    root.style.setProperty('--color-secondary', data.secondary_color || '#f0f4ff')
    document.title = data.school_name_ar || data.school_name || 'École'
  } catch (e) {
    console.warn('tenant config not loaded', e)
  }
})

// ── School app logic ───────────────────────────────────────────
const { t, currentLang, toggleLang, initLang } = useLanguage()
const router = useRouter()
const user = ref(null)
const darkMode = ref(false)

onMounted(() => {
  user.value = getCurrentUser()
  initLang()
})

const handleLogin = (loggedInUser) => {
  user.value = loggedInUser
  router.push('/courses')
}
const handleLogout = () => {
  apiLogout()
  user.value = null
  router.push('/login')
}
const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
}

const toastMessage = ref(null)

// ── NavBar props derived from tenant config ────────────────────
const navbarStyle = computed(() => ({
  '--navbar-primary': tenantConfig.value?.primary_color || 'var(--color-primary, #1a73e8)',
}))

const schoolLogoUrl = computed(() => tenantConfig.value?.logo_url || null)
const schoolName = computed(
  () => tenantConfig.value?.school_name_ar || tenantConfig.value?.school_name || '',
)
</script>

<template>
  <!-- Platform Admin: no NavBar, no Footer -->
  <div v-if="isPlatform">
    <RouterView />
  </div>

  <!-- School App: NavBar + Footer (tenant-branded) -->
  <div
    v-else
    class="min-h-screen transition-colors duration-300"
    :class="darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50'"
  >
    <NavBar
      :darkMode="darkMode"
      :user="user"
      :t="t"
      :currentLang="currentLang"
      :logoUrl="schoolLogoUrl"
      :schoolName="schoolName"
      :primaryColor="tenantConfig?.primary_color"
      @logout="handleLogout"
      @toggle-dark-mode="toggleDarkMode"
      @toggle-lang="toggleLang"
    />

    <main class="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 md:py-8">
      <RouterView v-slot="{ Component }">
        <component :is="Component" :darkMode="darkMode" :user="user" @login="handleLogin" />
      </RouterView>
    </main>

    <!-- Footer — dynamic per tenant -->
    <footer :class="darkMode ? 'bg-gray-800' : 'bg-gray-900'" class="text-white mt-12" dir="ltr">
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div>
            <div class="flex items-center gap-3 mb-3">
              <img
                v-if="schoolLogoUrl"
                :src="schoolLogoUrl"
                alt="Logo"
                class="h-10 w-10 rounded-full object-cover"
              />
              <span v-else class="text-2xl">🏫</span>
              <h3 class="text-lg font-bold text-blue-400">
                {{ schoolName || 'Notre École' }}
              </h3>
            </div>
            <p class="text-gray-400 text-sm leading-relaxed">
              {{ tenantConfig?.city ? tenantConfig.city : 'Algérie' }}
            </p>
          </div>
          <div>
            <h3 class="text-lg font-bold mb-3 text-blue-400">Nous Contacter</h3>
            <div class="space-y-2 text-sm">
              <p class="text-gray-400">
                <a
                  :href="`mailto:${tenantConfig?.admin_email || ''}`"
                  class="flex items-center gap-2 hover:text-blue-400 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {{ tenantConfig?.admin_email || 'contact@ecole.dz' }}
                </a>
              </p>
              <p v-if="tenantConfig?.admin_phone" class="text-gray-400">
                <span class="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {{ tenantConfig.admin_phone }}
                </span>
              </p>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-bold mb-3 text-blue-400">Administration</h3>
            <div class="text-sm text-gray-400 space-y-1">
              <p class="font-semibold text-white">Horaires d'ouverture :</p>
              <p>Dimanche - Jeudi: 8h00 - 17h00</p>
              <p>Samedi: 8h00 - 12h00</p>
              <p class="text-gray-500 mt-2">Fermé le vendredi</p>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-700 pt-6">
          <p class="text-gray-400 text-sm">
            &copy; {{ new Date().getFullYear() }} — {{ schoolName || 'École' }}. Plateforme
            propulsée par EduSaaS DZ.
          </p>
        </div>
      </div>
    </footer>

    <!-- Toast -->
    <Transition name="slide-up">
      <div
        v-if="toastMessage"
        class="fixed bottom-6 right-6 z-50 max-w-sm bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-start gap-3"
      >
        <span class="text-2xl">🔔</span>
        <div>
          <p class="font-bold text-sm">Rappel de cours</p>
          <p class="text-sm opacity-90 mt-1">{{ toastMessage }}</p>
        </div>
        <button @click="toastMessage = null" class="ml-2 opacity-70 hover:opacity-100 text-xl">
          ×
        </button>
      </div>
    </Transition>
  </div>
</template>

<style>
:root {
  --color-primary: #1a73e8;
  --color-primary-dark: #1557b0;
  --color-primary-light: #e8f0fe;
  --color-secondary: #f0f4ff;
}
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s ease;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
