<script setup>
import { ref, onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import NavBar from './components/NavBar.vue'
import { getCurrentUser, logout as apiLogout } from './services/api.js' // ✅ Import API
import { useLanguage } from './composables/useLanguage.js'
import LinkedInButton from './components/LinkedInButton.vue'
const { t, currentLang, toggleLang, initLang, isRTL } = useLanguage()

// Initialiser la langue au démarrage
onMounted(() => {
  user.value = getCurrentUser()
  initLang() // ⬅️ AJOUTER CETTE LIGNE
})
const router = useRouter()
const user = ref(null)
// État global
const darkMode = ref(false)

// ✅ Charger l'utilisateur depuis localStorage au démarrage
onMounted(() => {
  user.value = getCurrentUser()
})

// Gérer la connexion
const handleLogin = (loggedInUser) => {
  user.value = loggedInUser
  router.push('/courses')
}

// Gérer la déconnexion
const handleLogout = () => {
  apiLogout() // ✅ Utiliser la fonction logout de l'API
  user.value = null
  router.push('/login')
}

// Basculer le mode sombre
const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
}
</script>

<template>
  <div
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

    <footer :class="darkMode ? 'bg-gray-800' : 'bg-gray-900'" class="text-white mt-12">
      <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Section principale -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <!-- À propos -->
          <div>
            <h3 class="text-lg font-bold mb-3 text-blue-400">À Propos</h3>
            <p class="text-gray-400 text-sm leading-relaxed">Belahi School _ Oran <br /></p>
          </div>

          <!-- Contact -->
          <div>
            <h3 class="text-lg font-bold mb-3 text-blue-400">Nous Contacter</h3>
            <div class="space-y-2 text-sm">
              <!-- Email -->
              <a
                href="mailto:belmahi@gmail.com"
                class="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
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
                belmahi@gmail.com
              </a>

              <!-- Téléphone -->
              <a
                href="tel:+213555123456"
                class="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
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
                +213 555 123 456
              </a>

              <!-- Instagram -->
              <a
                href="https://www.instagram.com/belmahi_school/"
                target="_blank"
                class="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                  />
                </svg>
                @belmahi_school
              </a>
            </div>
          </div>

          <!-- Horaires d'administration -->
          <div>
            <h3 class="text-lg font-bold mb-3 text-blue-400">Administration</h3>
            <div class="text-sm text-gray-400 space-y-1">
              <p class="font-semibold text-white">Horaires d'ouverture:</p>
              <p>Dimanche - Jeudi: 8h00 - 17h00</p>
              <p>Samedi: 8h00 - 12h00</p>
              <p class="text-gray-500 mt-2">Fermé le vendredi</p>
            </div>
          </div>
        </div>

        <!-- Séparateur -->
        <div class="border-t border-gray-700 pt-6">
          <div class="flex flex-col md:flex-row justify-between items-center gap-6">
            <p class="text-gray-400 text-sm">
              &copy; 2025–2026 <br />
              <br />developed for BELMAHI SCHOOL.Unauthorized Reproduction, Distribution,or
              Commercial Use Prohibited <br />
              DEVELOPED by

              <a href="https://www.linkedin.com/in/abrar-nour-lacida-96574239b" class="custom-link">
                Abrar Nour Lacida
              </a>
              <br />
              MANAGEMENT BY:
              <a href="https://www.linkedin.com/in/hamza-zineb-052071390" class="custom-link">
                Hamza Zineb
              </a>
            </p>
            <style>
              /* 1. Set the initial color of the links (optional) */
              .custom-link {
                color: black; /* Or any color you prefer before hovering */
                text-decoration: none;
                transition: color 0.3s ease; /* Makes the color change smooth */
              }

              /* 2. Change the color on HOVER */
              .custom-link:hover {
                color: blueviolet !important;
              }
            </style>
            <div class="flex flex-col sm:flex-row gap-4 items-center">
              <LinkedInButton
                label="Devlopment by : "
                url="https://www.linkedin.com/in/abrar-nour-lacida-96574239b"
              />

              <LinkedInButton
                label="Product Manegment by : "
                url="https://www.linkedin.com/in/hamza-zineb-052071390"
              />
            </div>

            <p class="text-sm text-gray-500"></p>
          </div>
        </div>
      </div>
    </footer>
    <!-- Toast notifications — DANS App.vue -->
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
/* Vous pouvez laisser ce fichier vide ou mettre des styles VRAIMENT globaux,
   comme la police de caractères pour tout le body si vous le souhaitez. */
</style>
