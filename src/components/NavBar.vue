<script setup>
import { computed, ref } from 'vue'
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
  Bell,
  Trash2,
  X,
  Menu,
  Calendar,
  Sun,
  Moon,
} from 'lucide-vue-next'
import { useNotifications } from '../composables/useNotifications.js'

const props = defineProps({
  darkMode: { type: Boolean, default: false },
  user: { type: Object, default: null },
  t: { type: Function, default: (k) => k },
  currentLang: { type: String, default: 'fr' },
})

const emit = defineEmits(['logout', 'toggle-dark-mode', 'toggle-lang'])

const {
  notifications,
  unreadCount,
  showNotifPanel,
  toastNotif,
  togglePanel,
  removeNotification,
  clearAllNotifications,
  closeToast,
} = useNotifications(computed(() => props.user))

const route = useRoute()
const mobileMenuOpen = ref(false)

const handleLogout = () => {
  mobileMenuOpen.value = false
  emit('logout')
}

const isActive = (path) => route.path === path

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const formatTime = (dateStr) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  if (diffMins < 1) return props.t('just_now')
  if (diffMins < 60) return props.t('mins_ago').replace('{n}', diffMins)
  if (diffHours < 24) return props.t('hours_ago').replace('{n}', diffHours)
  return d.toLocaleDateString(props.currentLang === 'ar' ? 'ar-DZ' : 'fr-FR', {
    day: '2-digit',
    month: 'short',
  })
}

const notifStyle = (type) => {
  switch (type) {
    case 'welcome':
      return { bg: 'bg-green-50', dot: 'bg-green-500', icon: 'user' }
    case 'reminder':
      return { bg: 'bg-amber-50', dot: 'bg-amber-500', icon: 'clock' }
    default:
      return { bg: 'bg-blue-50', dot: 'bg-blue-500', icon: 'bell' }
  }
}

// Role display helpers
const roleLabel = computed(() => {
  if (!props.user) return ''
  const map = { admin: 'Admin', Parent: 'Parent', teacher: 'Prof', student: 'Élève' }
  return map[props.user.role] ?? props.user.role
})

const roleBadgeClass = computed(() => {
  if (!props.user) return ''
  const map = {
    admin: 'bg-yellow-400 text-yellow-900',
    Parent: 'bg-blue-400 text-blue-900',
    teacher: 'bg-purple-400 text-purple-900',
    student: 'bg-green-400 text-green-900',
  }
  return map[props.user.role] ?? 'bg-gray-400 text-gray-900'
})
</script>

<template>
  <!-- ─── Toast Notification ─────────────────────────────────────────────────── -->
  <Transition name="toast-slide">
    <div
      v-if="toastNotif"
      class="fixed bottom-4 right-3 left-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-[9999]"
    >
      <div
        class="flex items-start gap-3 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 pr-10 relative"
      >
        <span
          class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          :class="
            toastNotif.type === 'welcome'
              ? 'bg-green-100 text-green-600'
              : toastNotif.type === 'reminder'
                ? 'bg-amber-100 text-amber-600'
                : 'bg-blue-100 text-blue-600'
          "
        >
          <Bell :size="14" />
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-blue-600 mb-1">Belmahi School</p>
          <p class="text-sm text-gray-800 leading-snug">{{ toastNotif.message }}</p>
        </div>
        <button
          @click="closeToast"
          class="absolute top-3 right-3 text-gray-300 hover:text-gray-600 transition-colors"
        >
          <X :size="16" />
        </button>
      </div>
    </div>
  </Transition>

  <!-- ─── NavBar ─────────────────────────────────────────────────────────────── -->
  <nav
    :class="darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'deep-blue-gradient'"
    class="shadow-2xl sticky top-0 z-50"
  >
    <div class="max-w-7xl mx-auto px-3 sm:px-4">
      <div class="flex items-center justify-between h-14 sm:h-16">
        <!-- ── LEFT: Logo ─────────────────────────────────────────────────── -->
        <RouterLink
          to="/"
          class="flex items-center gap-2 text-white hover:text-blue-200 transition-colors shrink-0"
        >
          <img
            src="/belmahilogo.jpg"
            alt="Belmahi School"
            class="w-9 h-9 sm:w-11 sm:h-11 object-cover rounded-full border-2 border-white shadow-lg"
          />
          <div class="hidden sm:block">
            <h1 class="text-sm font-bold leading-tight">{{ props.t('nav_portal_title') }}</h1>
            <p class="text-xs text-blue-100">{{ props.t('nav_school_subtitle') }}</p>
          </div>
        </RouterLink>

        <!-- ── CENTER: Desktop nav links ─────────────────────────────────── -->
        <ul class="hidden md:flex items-center gap-1">
          <li>
            <RouterLink
              to="/"
              :class="[
                'flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all text-sm',
                isActive('/') ? 'bg-white/30 text-white' : 'text-blue-100 hover:bg-white/20',
              ]"
            >
              <Home :size="18" />
              {{ props.t('home') }}
            </RouterLink>
          </li>
          <li v-if="user && user.role === 'admin'">
            <RouterLink
              to="/courses"
              :class="[
                'flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all text-sm',
                isActive('/courses') ? 'bg-white/30 text-white' : 'text-blue-100 hover:bg-white/20',
              ]"
            >
              <BookOpen :size="18" />
              {{ props.t('courses') }}
            </RouterLink>
          </li>
          <li v-if="user && user.role === 'teacher'">
            <RouterLink
              to="/teacher-dashboard"
              :class="[
                'flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all text-sm',
                isActive('/teacher-dashboard')
                  ? 'bg-white/30 text-white'
                  : 'text-blue-100 hover:bg-white/20',
              ]"
            >
              <Layout :size="18" />
              {{ props.t('my_courses') }}
            </RouterLink>
          </li>
          <li v-if="user && (user.role === 'Parent' || user.role === 'student')">
            <RouterLink
              :to="user.role === 'Parent' ? '/parent-dashboard' : '/student-dashboard'"
              :class="[
                'flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all text-sm',
                isActive('/parent-dashboard') || isActive('/student-dashboard')
                  ? 'bg-white/30 text-white'
                  : 'text-blue-100 hover:bg-white/20',
              ]"
            >
              <LayoutDashboard :size="18" />
              {{ props.t('my_space') }}
            </RouterLink>
          </li>
          <li v-if="user && user.role === 'admin'">
            <RouterLink
              to="/add-teacher"
              :class="[
                'flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all text-sm',
                isActive('/add-teacher')
                  ? 'bg-white/30 text-white'
                  : 'text-blue-100 hover:bg-white/20',
              ]"
            >
              <UserPlus :size="16" />
              {{ props.t('add_teacher') }}
            </RouterLink>
          </li>
          <li v-if="user">
            <RouterLink
              to="/calendar"
              :class="[
                'flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all text-sm',
                isActive('/calendar')
                  ? 'bg-white/30 text-white'
                  : 'text-blue-100 hover:bg-white/20',
              ]"
            >
              <Calendar :size="16" />
              {{ props.t('calendar') }}
            </RouterLink>
          </li>
        </ul>

        <!-- ── RIGHT: Controls ────────────────────────────────────────────── -->
        <div class="flex items-center gap-1.5 sm:gap-2">
          <!-- Dark mode (always visible) -->
          <button
            @click="$emit('toggle-dark-mode')"
            class="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all"
          >
            <Sun v-if="darkMode" :size="18" class="text-white" />
            <Moon v-else :size="18" class="text-white" />
          </button>

          <!-- Language toggle (always visible) -->
          <button
            @click="$emit('toggle-lang')"
            class="px-2.5 py-1.5 rounded-full border border-white/30 hover:bg-white/20 transition-all text-white text-xs font-bold"
          >
            {{ currentLang === 'fr' ? 'FR' : 'AR' }}
          </button>

          <!-- Notification bell (always visible when logged in) -->
          <div v-if="user" class="relative">
            <button
              @click="togglePanel"
              class="relative p-2 rounded-full hover:bg-white/10 transition-all"
            >
              <Bell :size="20" class="text-white" />
              <span
                v-if="unreadCount > 0"
                class="absolute top-0.5 right-0.5 bg-red-600 text-white text-[10px] min-w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold border border-white px-0.5"
              >
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
            </button>

            <!-- Notification Panel -->
            <Transition name="panel-drop">
              <div
                v-if="showNotifPanel"
                class="notif-panel absolute mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                style="
                  width: min(320px, calc(100vw - 1.5rem));
                  right: 0;
                  max-height: 480px;
                  display: flex;
                  flex-direction: column;
                "
              >
                <div
                  class="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white"
                >
                  <div class="flex items-center gap-2">
                    <Bell :size="16" class="text-blue-600" />
                    <h3 class="font-bold text-gray-800 text-sm">{{ props.t('notifications') }}</h3>
                    <span
                      v-if="unreadCount > 0"
                      class="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full"
                      >{{ unreadCount }}</span
                    >
                  </div>
                  <button
                    v-if="notifications.length > 0"
                    @click="clearAllNotifications"
                    class="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 :size="12" />
                    {{ props.t('clear_all') }}
                  </button>
                </div>
                <div
                  v-if="notifications.length === 0"
                  class="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-3"
                >
                  <Bell :size="28" class="text-gray-200" />
                  <p>{{ props.t('no_notif') }}</p>
                </div>
                <div v-else class="overflow-y-auto flex-1">
                  <div
                    v-for="notif in notifications"
                    :key="notif.id"
                    :class="[
                      'flex items-start gap-3 p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors group',
                      notifStyle(notif.type).bg,
                      !notif.is_read ? 'font-medium' : '',
                    ]"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-xs text-gray-800 leading-snug">{{ notif.message }}</p>
                      <p class="text-[10px] text-gray-400 mt-1">
                        {{ formatTime(notif.created_at) }}
                      </p>
                    </div>
                    <div class="flex flex-col items-center gap-1 shrink-0">
                      <span
                        v-if="!notif.is_read"
                        :class="['w-2 h-2 rounded-full', notifStyle(notif.type).dot]"
                      ></span>
                      <button
                        @click="removeNotification(notif.id)"
                        class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                      >
                        <X :size="14" />
                      </button>
                    </div>
                  </div>
                </div>
                <div class="p-3 border-t border-gray-100 text-center shrink-0">
                  <p class="text-xs text-gray-400">
                    {{ notifications.length }} notification{{
                      notifications.length !== 1 ? 's' : ''
                    }}
                  </p>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Desktop: user info + logout / login -->
          <div class="hidden md:flex items-center gap-2">
            <div v-if="user" class="flex items-center gap-2">
              <div class="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
                <UserIcon :size="16" class="text-white" />
                <span class="text-white font-semibold text-sm">{{ user.name }}</span>
                <span :class="['px-2 py-0.5 rounded-full text-xs font-bold', roleBadgeClass]">{{
                  roleLabel
                }}</span>
              </div>
              <button
                @click="handleLogout"
                class="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all text-sm"
              >
                <LogOut :size="16" />
                {{ props.t('logout') }}
              </button>
            </div>
            <RouterLink
              v-else
              to="/login"
              :class="[
                'flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all text-sm',
                isActive('/login')
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 text-white hover:bg-white/30',
              ]"
            >
              <LogIn :size="18" />
              {{ props.t('login') }}
            </RouterLink>
          </div>

          <!-- Mobile: hamburger button -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
            :class="{ 'hamburger-open': mobileMenuOpen }"
            aria-label="Menu"
          >
            <span class="flex flex-col gap-1.5">
              <span class="hamburger-bar"></span>
              <span class="hamburger-bar"></span>
              <span class="hamburger-bar"></span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- ─── Mobile Menu Overlay ───────────────────────────────────────────────── -->
  <Transition name="overlay-fade">
    <div v-if="mobileMenuOpen" class="mobile-menu-overlay md:hidden" @click="closeMobileMenu" />
  </Transition>

  <!-- ─── Mobile Menu Drawer ────────────────────────────────────────────────── -->
  <Transition name="drawer-slide">
    <div
      v-if="mobileMenuOpen"
      :class="darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'"
      class="mobile-menu-drawer md:hidden"
    >
      <!-- Drawer header -->
      <div
        :class="darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'"
        class="flex items-center justify-between px-5 py-4 border-b"
      >
        <div v-if="user" class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg"
          >
            {{ user.name?.charAt(0)?.toUpperCase() }}
          </div>
          <div>
            <p class="font-bold text-sm">{{ user.name }} {{ user.last_name }}</p>
            <span :class="['px-2 py-0.5 rounded-full text-xs font-bold', roleBadgeClass]">{{
              roleLabel
            }}</span>
          </div>
        </div>
        <p
          v-else
          :class="darkMode ? 'text-gray-300' : 'text-gray-600'"
          class="font-semibold text-sm"
        >
          Belmahi School
        </p>
        <button
          @click="closeMobileMenu"
          :class="darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'"
          class="p-1 rounded-lg transition-colors"
        >
          <X :size="22" />
        </button>
      </div>

      <!-- Drawer nav links -->
      <nav class="p-4 space-y-1">
        <RouterLink
          to="/"
          @click="closeMobileMenu"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm',
            isActive('/')
              ? darkMode
                ? 'bg-blue-900 text-blue-200'
                : 'bg-blue-50 text-blue-700'
              : darkMode
                ? 'text-gray-300 hover:bg-gray-800'
                : 'text-gray-700 hover:bg-gray-100',
          ]"
        >
          <Home :size="20" class="shrink-0" />
          {{ props.t('home') }}
        </RouterLink>

        <RouterLink
          v-if="user && user.role === 'admin'"
          to="/courses"
          @click="closeMobileMenu"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm',
            isActive('/courses')
              ? darkMode
                ? 'bg-blue-900 text-blue-200'
                : 'bg-blue-50 text-blue-700'
              : darkMode
                ? 'text-gray-300 hover:bg-gray-800'
                : 'text-gray-700 hover:bg-gray-100',
          ]"
        >
          <BookOpen :size="20" class="shrink-0" />
          {{ props.t('courses') }}
        </RouterLink>

        <RouterLink
          v-if="user && user.role === 'teacher'"
          to="/teacher-dashboard"
          @click="closeMobileMenu"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm',
            isActive('/teacher-dashboard')
              ? darkMode
                ? 'bg-blue-900 text-blue-200'
                : 'bg-blue-50 text-blue-700'
              : darkMode
                ? 'text-gray-300 hover:bg-gray-800'
                : 'text-gray-700 hover:bg-gray-100',
          ]"
        >
          <Layout :size="20" class="shrink-0" />
          {{ props.t('my_courses') }}
        </RouterLink>

        <RouterLink
          v-if="user && user.role === 'Parent'"
          to="/parent-dashboard"
          @click="closeMobileMenu"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm',
            isActive('/parent-dashboard')
              ? darkMode
                ? 'bg-blue-900 text-blue-200'
                : 'bg-blue-50 text-blue-700'
              : darkMode
                ? 'text-gray-300 hover:bg-gray-800'
                : 'text-gray-700 hover:bg-gray-100',
          ]"
        >
          <LayoutDashboard :size="20" class="shrink-0" />
          {{ props.t('my_space') }}
        </RouterLink>

        <RouterLink
          v-if="user && user.role === 'student'"
          to="/student-dashboard"
          @click="closeMobileMenu"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm',
            isActive('/student-dashboard')
              ? darkMode
                ? 'bg-blue-900 text-blue-200'
                : 'bg-blue-50 text-blue-700'
              : darkMode
                ? 'text-gray-300 hover:bg-gray-800'
                : 'text-gray-700 hover:bg-gray-100',
          ]"
        >
          <LayoutDashboard :size="20" class="shrink-0" />
          {{ props.t('my_space') }}
        </RouterLink>

        <RouterLink
          v-if="user && user.role === 'admin'"
          to="/add-teacher"
          @click="closeMobileMenu"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm',
            isActive('/add-teacher')
              ? darkMode
                ? 'bg-blue-900 text-blue-200'
                : 'bg-blue-50 text-blue-700'
              : darkMode
                ? 'text-gray-300 hover:bg-gray-800'
                : 'text-gray-700 hover:bg-gray-100',
          ]"
        >
          <UserPlus :size="20" class="shrink-0" />
          {{ props.t('add_teacher') }}
        </RouterLink>

        <RouterLink
          v-if="user"
          to="/calendar"
          @click="closeMobileMenu"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm',
            isActive('/calendar')
              ? darkMode
                ? 'bg-blue-900 text-blue-200'
                : 'bg-blue-50 text-blue-700'
              : darkMode
                ? 'text-gray-300 hover:bg-gray-800'
                : 'text-gray-700 hover:bg-gray-100',
          ]"
        >
          <Calendar :size="20" class="shrink-0" />
          {{ props.t('calendar') }}
        </RouterLink>
      </nav>

      <!-- Drawer footer: logout / login -->
      <div
        :class="darkMode ? 'border-gray-700' : 'border-gray-100'"
        class="absolute bottom-0 left-0 right-0 border-t p-4"
      >
        <button
          v-if="user"
          @click="handleLogout"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all"
        >
          <LogOut :size="18" />
          {{ props.t('logout') }}
        </button>
        <RouterLink
          v-else
          to="/login"
          @click="closeMobileMenu"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold transition-all"
        >
          <LogIn :size="18" />
          {{ props.t('login') }}
        </RouterLink>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.deep-blue-gradient {
  background: linear-gradient(135deg, #012254 0%, #0255ae 35%, #0271d9 70%, #1ba8f4 100%);
}

/* Toast */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}

/* Notification panel */
.panel-drop-enter-active,
.panel-drop-leave-active {
  transition: all 0.2s ease;
}
.panel-drop-enter-from,
.panel-drop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

/* Mobile overlay fade */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.25s ease;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

/* Mobile drawer slide */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}

/* Hamburger bars */
.hamburger-bar {
  display: block;
  width: 22px;
  height: 2.5px;
  border-radius: 99px;
  background: white;
  transition: all 0.25s ease;
  transform-origin: center;
}

/* Mobile menu drawer positioning */
.mobile-menu-drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: min(320px, 85vw);
  z-index: 41;
  overflow-y: auto;
  padding-bottom: 5rem; /* space for bottom logout button */
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.25);
}

/* Mobile overlay */
.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 40;
  backdrop-filter: blur(2px);
}
</style>
