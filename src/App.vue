<script setup>
import { ref, onMounted, watch } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'
import { getCurrentUser, logout as apiLogout } from './services/api.js'
import { useLanguage } from './composables/useLanguage.js'
import { useTenant } from './composables/useTenant.js'
import { isSchool, tenantSlug } from './router/index.js'

const { loading, error, loadTenant, markLoaded, tenant } = useTenant()
const route = useRoute()

onMounted(async () => {
  user.value = getCurrentUser()
  initLang()
  const slugFromRoute = route.params?.slug
  const isPlatform = route.path.startsWith('/platform') || route.path.startsWith('/register-school')
  if (isPlatform) {
    markLoaded()
  } else {
    await loadTenant(slugFromRoute || undefined)
  }
})

// Re-load tenant when navigating between /school/:slug routes
watch(
  () => route.params?.slug,
  async (newSlug, oldSlug) => {
    if (newSlug && newSlug !== oldSlug) {
      await loadTenant(newSlug)
    }
  },
)

const { t, currentLang, toggleLang, initLang, isRTL } = useLanguage()
const toastMessage = ref(null)

const router = useRouter()
const user = ref(null)
const darkMode = ref(false)

const schoolBase = tenantSlug ? `/school/${tenantSlug}` : ''

function getSchoolBase() {
  const slug = route.params?.slug || tenantSlug
  return slug ? `/school/${slug}` : ''
}

const handleLogin = (loggedInUser) => {
  user.value = loggedInUser
  const base = getSchoolBase()
  const role = loggedInUser?.role
  if (role === 'student') router.push(`${base}/student-dashboard`)
  else if (role === 'Parent') router.push(`${base}/parent-dashboard`)
  else if (role === 'teacher') router.push(`${base}/teacher-dashboard`)
  else router.push(`${base}/courses`) // admin + default
}

const handleLogout = () => {
  apiLogout()
  user.value = null
  router.push(`${getSchoolBase()}/login`)
}

const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
}
</script>

<template>
  <!--
    ┌─────────────────────────────────────────────────────────────┐
    │  ROUTING LOGIC                                              │
    │  1. /platform/*        → bare RouterView (no school chrome) │
    │  2. /register-school   → bare RouterView (no school chrome) │
    │  3. School app         → NavBar + content + Footer          │
    └─────────────────────────────────────────────────────────────┘
  -->

  <!-- ── Case 1 & 2: Platform admin OR public school registration ── -->
  <RouterView v-if="$route.meta.isPlatform || $route.meta.isPublicRegistration" />

  <!-- ── Case 3: School app ── -->
  <template v-else>
    <!-- Loading: fetching tenant config -->
    <div v-if="loading" class="app-loading">
      <div class="loader-ring"></div>
      <p>جاري التحميل...</p>
    </div>

    <!-- Error: school slug not found -->
    <div v-else-if="error && !tenant" class="app-error">
      <h2>❌ المدرسة غير موجودة</h2>
      <p>تأكد من الرابط أو تواصل مع الدعم</p>
    </div>

    <!-- School app shell: NavBar + main + Footer -->
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
        @logout="handleLogout"
        @toggle-dark-mode="toggleDarkMode"
        @toggle-lang="toggleLang"
      />

      <main class="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 md:py-8">
        <RouterView v-slot="{ Component }">
          <component :is="Component" :darkMode="darkMode" :user="user" @login="handleLogin" />
        </RouterView>
      </main>

      <footer :class="darkMode ? 'bg-gray-800' : 'bg-gray-900'" class="text-white mt-12" dir="ltr">
        <div class="max-w-7xl mx-auto px-4 py-10">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <!-- À propos -->
            <div>
              <div class="flex items-center gap-3 mb-3">
                <img
                  v-if="tenant?.logo_url"
                  :src="
                    tenant.logo_url.startsWith('http')
                      ? tenant.logo_url
                      : ($env?.VITE_API_URL || 'http://localhost:3000').replace('/api', '') +
                        tenant.logo_url
                  "
                  class="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                  :alt="tenant.school_name"
                />
                <div>
                  <h3 class="text-base font-bold text-white leading-tight">
                    {{ tenant?.school_name || 'École' }}
                  </h3>
                  <p v-if="tenant?.school_name_ar" class="text-xs text-gray-400" dir="rtl">
                    {{ tenant.school_name_ar }}
                  </p>
                </div>
              </div>
              <p v-if="tenant?.address" class="text-gray-400 text-sm leading-relaxed mb-1">
                📍 {{ tenant.address }}
              </p>
              <p v-else-if="tenant?.city" class="text-gray-400 text-sm">
                📍 {{ tenant.city }}, Algérie
              </p>
            </div>

            <!-- Contact -->
            <div>
              <h3
                class="text-sm font-bold mb-4 uppercase tracking-widest"
                style="color: var(--color-primary, #60a5fa)"
              >
                Nous Contacter
              </h3>
              <div class="space-y-3 text-sm">
                <a
                  v-if="tenant?.admin_email"
                  :href="'mailto:' + tenant.admin_email"
                  class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    class="w-4 h-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {{ tenant.admin_email }}
                </a>
                <a
                  v-if="tenant?.admin_phone"
                  :href="'tel:' + tenant.admin_phone"
                  class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    class="w-4 h-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {{ tenant.admin_phone }}
                </a>
                <a
                  v-if="tenant?.whatsapp_number"
                  :href="'https://wa.me/' + tenant.whatsapp_number.replace(/\D/g, '')"
                  target="_blank"
                  class="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors"
                >
                  <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                    />
                  </svg>
                  WhatsApp
                </a>
                <a
                  v-if="tenant?.instagram_url"
                  :href="tenant.instagram_url"
                  target="_blank"
                  class="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
                >
                  <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                    />
                  </svg>
                  Instagram
                </a>
                <a
                  v-if="tenant?.map_link"
                  :href="tenant.map_link"
                  target="_blank"
                  class="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <svg
                    class="w-4 h-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Voir sur la carte
                </a>
              </div>
            </div>

            <!-- Horaires -->
            <div>
              <h3
                class="text-sm font-bold mb-4 uppercase tracking-widest"
                style="color: var(--color-primary, #60a5fa)"
              >
                Administration
              </h3>
              <div class="text-sm text-gray-400 space-y-1">
                <p class="font-semibold text-white">Horaires d'ouverture :</p>
                <template v-if="tenant?.open_hours">
                  <p v-for="line in tenant.open_hours.split('|')" :key="line" class="text-gray-400">
                    {{ line.trim() }}
                  </p>
                </template>
                <template v-else>
                  <p>Dimanche – Jeudi : 8h00 – 17h00</p>
                  <p>Samedi : 8h00 – 12h00</p>
                  <p class="text-gray-500 mt-2">Fermé le vendredi</p>
                </template>
              </div>
            </div>
          </div>

          <!-- Bottom bar -->
          <div
            class="border-t border-gray-700 pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
          >
            <p class="text-gray-500 text-xs">
              &copy; {{ new Date().getFullYear() }}
              <a href="http://localhost:5173/mudar" class="mudar-link">MUDAR</a>. Tous droits
              réservés.
            </p>
            <p class="credit-text">
              Developed by <a href="http://localhost:5173/mudar" class="mudar-link">MUDAR</a>
            </p>
          </div>
        </div>
      </footer>

      <!-- Toast notification -->
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
</template>

<style>
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

:root {
  --color-primary: #1a73e8;
  --color-primary-dark: #1557b0;
  --color-primary-light: #e8f0fe;
  --color-secondary: #f0f4ff;
}

.app-loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--color-secondary);
}

.loader-ring {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.app-error {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #e53935;
}

.credit-text {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  color: #333; /* لون النص الأساسي */
  font-size: 16px;
}

.mudar-link {
  /* تنسيق جمالي للكلمة */
  background: linear-gradient(45deg, #6b21a8, #c026d3); /* تدرج لوني */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
  text-decoration: none;
  font-size: 1.1em;
  transition:
    opacity 0.3s ease,
    text-shadow 0.3s ease;
}

.mudar-link:hover {
  /* تأثير عند تمرير المؤشر */
  opacity: 0.8;
  text-shadow: 0px 4px 10px rgba(192, 38, 211, 0.3);
}
</style>
