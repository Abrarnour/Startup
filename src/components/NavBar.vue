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
} from 'lucide-vue-next'
import { Sun, Moon } from 'lucide-vue-next'
import { Calendar } from 'lucide-vue-next'
import { useNotifications } from '../composables/useNotifications.js'

// ✅ defineProps BEFORE using props
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
  closeToast, // ✅ FIX: use the new exposed closeToast function instead of direct ref assignment
} = useNotifications(computed(() => props.user))

const route = useRoute()

const handleLogout = () => {
  emit('logout')
}

const isActive = (path) => route.path === path

// Format notification timestamp
const formatTime = (dateStr) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return props.currentLang === 'ar' ? 'الآن' : "À l'instant"
  if (diffMins < 60)
    return props.currentLang === 'ar' ? `منذ ${diffMins} دقيقة` : `Il y a ${diffMins} min`
  if (diffHours < 24)
    return props.currentLang === 'ar' ? `منذ ${diffHours} ساعة` : `Il y a ${diffHours}h`
  return d.toLocaleDateString(props.currentLang === 'ar' ? 'ar-DZ' : 'fr-FR', {
    day: '2-digit',
    month: 'short',
  })
}

// Notification type icon/color
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

const notifIcon = (icon) =>
  ({
    user: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
    clock: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
    bell: `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
  })[icon] ?? ``
</script>

<template>
  <!-- ─── In-app Toast Notification ─────────────────────────────────────────── -->
  <Transition name="toast-slide">
    <div v-if="toastNotif" class="fixed bottom-6 right-6 z-[9999] max-w-sm w-full">
      <div
        class="flex items-start gap-3 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 pr-10"
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
          <!-- welcome: user icon -->
          <svg
            v-if="toastNotif.type === 'welcome'"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <!-- reminder: clock icon -->
          <svg
            v-else-if="toastNotif.type === 'reminder'"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <!-- default: bell icon -->
          <svg
            v-else
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-blue-600 mb-1">Belmahi School</p>
          <p class="text-sm text-gray-800 leading-snug">{{ toastNotif.message }}</p>
        </div>
        <!-- ✅ FIX: Use closeToast() function instead of direct ref assignment in template -->
        <button
          @click="closeToast"
          class="absolute top-3 right-3 text-gray-300 hover:text-gray-600 transition-colors"
        >
          <X :size="16" />
        </button>
      </div>
    </div>
  </Transition>

  <!-- ─── Main NavBar ────────────────────────────────────────────────────────── -->
  <nav
    :class="darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'deep-blue-gradient'"
    class="shadow-2xl sticky top-0 z-50"
  >
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- LEFT: Logo + controls -->
        <div class="flex items-center gap-3">
          <!-- Logo -->
          <RouterLink
            to="/"
            class="flex items-center gap-3 text-white hover:text-blue-200 transition-colors"
          >
            <img
              src="/belmahilogo.jpg"
              alt="Belmahi School"
              class="w-12 h-12 object-cover rounded-full border-2 border-white shadow-lg"
            />
            <div class="hidden md:block">
              <h1 class="text-sm font-bold">{{ props.t('nav_portal_title') }}</h1>
              <p class="text-xs text-blue-100">{{ props.t('nav_school_subtitle') }}</p>
            </div>
          </RouterLink>

          <!-- Dark mode toggle -->
          <button
            @click="$emit('toggle-dark-mode')"
            class="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all transform hover:scale-110"
          >
            <Sun v-if="darkMode" :size="24" class="text-white" />
            <Moon v-else :size="24" class="text-white" />
          </button>

          <!-- Language toggle -->
          <button
            @click="$emit('toggle-lang')"
            :title="props.t('language')"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/30 hover:bg-white/20 transition-all text-white text-sm font-bold"
          >
            <span v-if="currentLang === 'fr'" class="flex items-center gap-1">
              <span class="hidden sm:inline text-xs">FR</span>
            </span>
            <span v-else class="flex items-center gap-1">
              <span class="hidden sm:inline text-xs">AR</span>
            </span>
          </button>

          <!-- ─── NOTIFICATION BELL — only shown when user is logged in ──────── -->
          <div v-if="user" class="relative">
            <button
              @click="togglePanel"
              class="relative p-2 rounded-full hover:bg-white/10 transition-all"
              :title="props.t('notifications')"
            >
              <Bell :size="24" class="text-white" />

              <!-- Red badge — only shown when there are unread notifications -->
              <span
                v-if="unreadCount > 0"
                class="absolute top-0.5 right-0.5 bg-red-600 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold border-2 border-white px-0.5"
              >
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
            </button>

            <!-- ─── Notification Panel (dropdown) ──────────────────────────────── -->
            <Transition name="panel-drop">
              <div
                v-if="showNotifPanel"
                class="absolute left-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                style="max-height: 480px; display: flex; flex-direction: column"
              >
                <!-- Panel header -->
                <div
                  class="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white"
                >
                  <div class="flex items-center gap-2">
                    <Bell :size="18" class="text-blue-600" />
                    <h3 class="font-bold text-gray-800 text-sm">
                      {{ currentLang === 'ar' ? 'الإشعارات' : 'Notifications' }}
                    </h3>
                    <span
                      v-if="unreadCount > 0"
                      class="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full"
                      >{{ unreadCount }}</span
                    >
                  </div>
                  <!-- Clear all button -->
                  <button
                    v-if="notifications.length > 0"
                    @click="clearAllNotifications"
                    class="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                    :title="currentLang === 'ar' ? 'مسح الكل' : 'Tout supprimer'"
                  >
                    <Trash2 :size="12" />
                    {{ currentLang === 'ar' ? 'مسح الكل' : 'Tout effacer' }}
                  </button>
                </div>

                <!-- Empty state -->
                <div
                  v-if="notifications.length === 0"
                  class="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-3"
                >
                  <Bell :size="32" class="text-gray-200" />
                  <p>{{ currentLang === 'ar' ? 'لا توجد إشعارات' : 'Aucune notification' }}</p>
                </div>

                <!-- Notifications list -->
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
                    <!-- Type emoji -->
                    <span class="text-lg shrink-0 mt-0.5">{{ notifStyle(notif.type).emoji }}</span>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                      <p class="text-xs text-gray-800 leading-snug">{{ notif.message }}</p>
                      <p class="text-[10px] text-gray-400 mt-1">
                        {{ formatTime(notif.created_at) }}
                      </p>
                    </div>

                    <!-- Unread dot + delete button -->
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

                <!-- Panel footer -->
                <div class="p-3 border-t border-gray-100 text-center shrink-0">
                  <p class="text-xs text-gray-400">
                    {{
                      currentLang === 'ar'
                        ? `${notifications.length} إشعار`
                        : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`
                    }}
                  </p>
                </div>
              </div>
            </Transition>
          </div>
          <!-- END notification bell — only for logged-in users -->
        </div>
        <!-- END LEFT -->

        <!-- CENTER: Navigation links -->
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

        <!-- RIGHT: User info + logout / login -->
        <div class="flex items-center gap-3">
          <div v-if="user" class="flex items-center gap-3">
            <div class="hidden md:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
              <UserIcon :size="18" class="text-white" />
              <span class="text-white font-semibold">{{ user.name }}</span>
              <span
                v-if="user.role === 'admin'"
                class="ml-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold"
              >
                Admin
              </span>
              <span
                v-else-if="user.role === 'Parent'"
                class="ml-2 px-2 py-0.5 bg-blue-400 text-blue-900 rounded-full text-xs font-bold"
              >
                Parent
              </span>
              <span
                v-else-if="user.role === 'teacher'"
                class="ml-2 px-2 py-0.5 bg-purple-400 text-purple-900 rounded-full text-xs font-bold"
              >
                Prof
              </span>
              <span
                v-else
                class="ml-2 px-2 py-0.5 bg-green-400 text-green-900 rounded-full text-xs font-bold"
              >
                Élève
              </span>
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
.deep-blue-gradient {
  background: linear-gradient(135deg, #012254 0%, #0255ae 35%, #0271d9 70%, #1ba8f4 100%);
}

/* Toast slide-up animation */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(24px) scale(0.96);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

/* Panel drop-down animation */
.panel-drop-enter-active,
.panel-drop-leave-active {
  transition: all 0.2s ease;
}
.panel-drop-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
.panel-drop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
