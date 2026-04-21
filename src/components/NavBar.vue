<script setup>
import { computed } from 'vue'
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
import { useNotifications } from '../composables/useNotifications.js'

// ✅ FIX 1: defineProps AVANT d'utiliser props
const props = defineProps({
  darkMode: { type: Boolean, default: false },
  user: { type: Object, default: null },
  t: { type: Function, default: (k) => k }, // ⬅️ AJOUTER
  currentLang: { type: String, default: 'fr' }, // ⬅️ AJOUTER
})

const emit = defineEmits(['logout', 'toggle-dark-mode', 'toggle-lang']) // ⬅️ ajouter 'toggle-lang'
// ✅ FIX 2: computed importé + props correctement défini AVANT cette ligne
const { notifications, unreadCount, showNotifPanel, toastNotif, togglePanel } = useNotifications(
  computed(() => props.user),
)

const route = useRoute()

const handleLogout = () => {
  emit('logout')
}

const isActive = (path) => {
  return route.path === path
}
</script>

<template>
  <nav
    :class="darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'deep-blue-gradient'"
    class="shadow-2xl sticky top-0 z-50"
  >
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center justify-between h-16">
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
              <h1 class="text-xm font-bold">{{ props.t('nav_portal_title') }}</h1>
              <p class="text-xs text-blue-100">{{ props.t('nav_school_subtitle') }}</p>
            </div>
          </RouterLink>

          <button
            @click="$emit('toggle-dark-mode')"
            class="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all transform hover:scale-110"
          >
            <Sun v-if="darkMode" :size="24" />
            <Moon v-else :size="24" />
          </button>
          <button
            @click="$emit('toggle-lang')"
            :title="props.t('language')"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/30 hover:bg-white/20 transition-all text-white text-sm font-bold tracking-wide"
          >
            <span v-if="currentLang === 'fr'" class="flex items-center gap-1">
              <span>🇫🇷</span>
              <span class="hidden sm:inline text-xs">FR</span>
            </span>
            <span v-else class="flex items-center gap-1">
              <span>🇩🇿</span>
              <span class="hidden sm:inline text-xs">AR</span>
            </span>
          </button>

          <div class="relative">
            <button
              @click="togglePanel"
              class="relative p-2 rounded-full hover:bg-white/10 transition-all"
              :title="props.t('notifications')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span
                v-if="unreadCount > 0"
                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse"
              >
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
            </button>

            <div
              v-if="showNotifPanel"
              class="absolute left-0 top-12 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-200 z-50"
            >
              <div class="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 class="font-bold text-gray-800">{{ props.t('nav_notifications_header') }}</h3>
                <span class="text-xs text-gray-500">{{ props.t('today') }}</span>
              </div>
              <div v-if="notifications.length === 0" class="p-6 text-center text-gray-500 text-sm">
                {{ props.t('no_notif') }}
              </div>
              <div
                v-for="notif in notifications"
                :key="notif.id || notif.key"
                class="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <p class="text-sm text-gray-700">{{ notif.message }}</p>
                <p class="text-xs text-gray-400 mt-1">
                  {{ notif.time ? notif.time.slice(0, 5) : '' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <ul class="flex items-center gap-2">
          <li>
            <RouterLink
              to="/"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all',
                isActive('/') ? 'bg-white/30 text-white' : 'text-blue-100 hover:bg-white/20',
              ]"
            >
              <Home :size="20" />
              <span class="hidden md:inline">{{ props.t('home') }}</span>
            </RouterLink>
          </li>

          <li v-if="user && user.role === 'admin'">
            <RouterLink
              to="/courses"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all',
                isActive('/courses') ? 'bg-white/30 text-white' : 'text-blue-100 hover:bg-white/20',
              ]"
            >
              <BookOpen :size="20" />
              <span class="hidden md:inline">{{ props.t('courses') }}</span>
            </RouterLink>
          </li>

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
              <span class="hidden md:inline">{{ props.t('my_courses') }}</span>
            </RouterLink>
          </li>

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
              <span class="hidden md:inline">{{ props.t('my_space') }}</span>
            </RouterLink>
          </li>

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
              <span class="hidden md:inline">{{ props.t('my_space') }}</span>
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
              <span class="hidden md:inline">{{ props.t('calendar') }}</span>
            </RouterLink>
          </li>

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
              <span class="hidden md:inline">{{ props.t('add_teacher') }}</span>
            </RouterLink>
          </li>
        </ul>

        <div class="flex items-center gap-3">
          <div v-if="user" class="flex items-center gap-3">
            <div class="hidden md:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
              <UserIcon :size="18" class="text-white" />
              <span class="text-white font-semibold">{{ user.name }}</span>
              <span
                v-if="user.role === 'admin'"
                class="ml-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold"
                >{{ props.t('Admin') }}</span
              >
              <span
                v-else-if="user.role === 'Parent'"
                class="ml-2 px-2 py-0.5 bg-blue-400 text-blue-900 rounded-full text-xs font-bold"
                >{{ props.t('parent_badge') }}</span
              >
              <span
                v-else-if="user.role === 'teacher'"
                class="ml-2 px-2 py-0.5 bg-purple-400 text-purple-900 rounded-full text-xs font-bold"
                >{{ props.t('teacher_badge') }}</span
              >
              <span
                v-else
                class="ml-2 px-2 py-0.5 bg-green-400 text-green-900 rounded-full text-xs font-bold"
                >{{ props.t('student_badge') }}</span
              >
            </div>

            <button
              @click="handleLogout"
              class="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              <LogOut :size="18" />
              <span class="hidden md:inline">{{ props.t('logout') }}</span>
            </button>
          </div>

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
            <span class="hidden md:inline">{{ props.t('login') }}</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </nav>
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
