<script setup>
import { defineEmits } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  User as UserIcon,
  LogOut,
  Home,
  BookOpen,
  LogIn,
  UserPlus,
  Layout,
  LayoutDashboard,
} from 'lucide-vue-next'
import { Sun, Moon } from 'lucide-vue-next'
import { Calendar } from 'lucide-vue-next'

const emit = defineEmits(['logout', 'add-child', 'toggle-dark-mode'])
const route = useRoute()

const handleLogout = () => {
  emit('logout')
}

const isActive = (path) => {
  return route.path === path
}

defineProps({
  darkMode: {
    type: Boolean,
    required: true,
  },
  user: {
    type: Object,
    default: null,
  },
})
</script>

<template>
  <nav
    :class="darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'deep-blue-gradient'"
    class="shadow-2xl sticky top-0 z-50"
  >
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo et Titre -->
        <div class="flex items-center gap-3">
          <RouterLink
            to="/"
            class="flex items-center gap-3 text-white hover:text-blue-200 transition-colors"
          >
            <img
              src="/belmahilogo.jpg"
              alt="Notre ecole"
              class="w-12 h-12 object-cover rounded-full border-2 border-white shadow-lg"
            />
            <div class="hidden md:block">
              <h1 class="text-xm font-bold">Portail de cours</h1>
              <p class="text-xs text-blue-100">Belmahi School - Oran</p>
            </div>
          </RouterLink>
          <button
            @click="$emit('toggle-dark-mode')"
            class="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all transform hover:scale-110"
          >
            <Sun v-if="darkMode" :size="24" />
            <Moon v-else :size="24" />
          </button>
        </div>

        <!-- Menu de Navigation Central -->
        <ul class="flex items-center gap-2">
          <!-- Accueil — toujours visible -->
          <li>
            <RouterLink
              to="/"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all',
                isActive('/') ? 'bg-white/30 text-white' : 'text-blue-100 hover:bg-white/20',
              ]"
            >
              <Home :size="20" />
              <span class="hidden md:inline">Accueil</span>
            </RouterLink>
          </li>

          <!--
            ✅ FIX 2A: "Cours" visible UNIQUEMENT pour l'admin.
            Avant : v-if="user && user.role !== 'teacher'"  ← montrait à tout le monde sauf teacher
            Après : v-if="user && user.role === 'admin'"   ← montré SEULEMENT à l'admin
          -->
          <li v-if="user && user.role === 'admin'">
            <RouterLink
              to="/courses"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all',
                isActive('/courses') ? 'bg-white/30 text-white' : 'text-blue-100 hover:bg-white/20',
              ]"
            >
              <BookOpen :size="20" />
              <span class="hidden md:inline">Cours</span>
            </RouterLink>
          </li>

          <!-- Tableau de bord enseignant (pour enseignants uniquement) -->
          <li v-if="user && user.role === 'teacher'">
            <RouterLink
              to="/teacher-dashboard"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all',
                isActive('/teacher-dashboard')
                  ? 'bg-white/30 text-white'
                  : 'text-blue-100 hover:bg-white/20',
              ]"
            >
              <Layout :size="20" />
              <span class="hidden md:inline">Mes Cours</span>
            </RouterLink>
          </li>

          <!-- Tableau de bord Parent (pour parents uniquement) -->
          <li v-if="user && user.role === 'Parent'">
            <RouterLink
              to="/parent-dashboard"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all',
                isActive('/parent-dashboard')
                  ? 'bg-white/30 text-white'
                  : 'text-blue-100 hover:bg-white/20',
              ]"
            >
              <LayoutDashboard :size="20" />
              <span class="hidden md:inline">Mon Espace</span>
            </RouterLink>
          </li>

          <!-- Tableau de bord Étudiant (pour étudiants uniquement) -->
          <li v-if="user && user.role === 'student'">
            <RouterLink
              to="/student-dashboard"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all',
                isActive('/student-dashboard')
                  ? 'bg-white/30 text-white'
                  : 'text-blue-100 hover:bg-white/20',
              ]"
            >
              <LayoutDashboard :size="20" />
              <span class="hidden md:inline">Mon Espace</span>
            </RouterLink>
          </li>

          <li v-if="user">
            <RouterLink
              to="/calendar"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all',
                isActive('/calendar')
                  ? 'bg-white/30 text-white'
                  : 'text-blue-100 hover:bg-white/20',
              ]"
            >
              <Calendar :size="15" />
              <span class="hidden md:inline">Emploi du Temps</span>
            </RouterLink>
          </li>

          <!-- Ajouter Enseignant (Admin uniquement) -->
          <li v-if="user && user.role === 'admin'">
            <RouterLink
              to="/add-teacher"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all',
                isActive('/add-teacher')
                  ? 'bg-white/30 text-white'
                  : 'text-blue-100 hover:bg-white/20',
              ]"
            >
              <UserPlus :size="15" />
              <span class="hidden md:inline">Ajouter Enseignant</span>
            </RouterLink>
          </li>
        </ul>

        <!-- Section Utilisateur -->
        <div class="flex items-center gap-3">
          <div v-if="user" class="flex items-center gap-3">
            <!-- Nom de l'utilisateur avec badge de rôle -->
            <div class="hidden md:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
              <UserIcon :size="18" class="text-white" />
              <span class="text-white font-semibold">{{ user.name }}</span>

              <span
                v-if="user.role === 'admin'"
                class="ml-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold"
              >
                ADMIN
              </span>
              <span
                v-else-if="user.role === 'Parent'"
                class="ml-2 px-2 py-0.5 bg-blue-400 text-blue-900 rounded-full text-xs font-bold"
              >
                PARENT
              </span>
              <span
                v-else-if="user.role === 'teacher'"
                class="ml-2 px-2 py-0.5 bg-purple-400 text-purple-900 rounded-full text-xs font-bold"
              >
                ENSEIGNANT
              </span>
              <span
                v-else
                class="ml-2 px-2 py-0.5 bg-green-400 text-green-900 rounded-full text-xs font-bold"
              >
                ÉTUDIANT
              </span>
            </div>

            <!-- Bouton Déconnexion -->
            <button
              @click="handleLogout"
              class="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              <LogOut :size="18" />
              <span class="hidden md:inline">Déconnexion</span>
            </button>
          </div>

          <!-- Si l'utilisateur n'est PAS connecté -->
          <RouterLink
            v-else
            to="/login"
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105',
              isActive('/login')
                ? 'bg-white text-purple-600'
                : 'bg-white/20 text-white hover:bg-white/30',
            ]"
          >
            <LogIn :size="20" />
            <span class="hidden md:inline">Connexion</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </nav>

  <!-- Pour les Parents -->
  <div v-if="user?.role === 'Parent'" class="flex items-center gap-4">
    <button
      @click="$emit('add-child')"
      class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2"
    >
      <UserPlus :size="18" />
      Ajouter un enfant
    </button>
  </div>
</template>

<style scoped>
.router-link-active {
  position: relative;
}

.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: white;
  border-radius: 2px;
}

.deep-blue-gradient {
  background: linear-gradient(135deg, #012254 0%, #0255ae 35%, #0271d9 70%, #1ba8f4 100%);
}
</style>
