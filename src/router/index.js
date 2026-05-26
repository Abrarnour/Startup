// src/router/index.js
// ─────────────────────────────────────────────────────────────
// 3 interface roots:
//   /platform/*      → SuperAdmin (no tenant needed)
//   /register-school → School owner self-registration (no tenant)
//   /*               → School app (requires tenant slug)
// ─────────────────────────────────────────────────────────────

import { createRouter, createWebHistory } from 'vue-router'

// ── Detect tenant slug ────────────────────────────────────────
// Priority: subdomain > ?tenant= query param > localStorage (dev)
function detectTenantSlug() {
  // 1. Subdomain (production)
  const h = window.location.hostname
  const parts = h.split('.')
  if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www')
    return parts[0].toLowerCase()

  // 2. Path-based /school/:slug (dev & fallback)
  const pathMatch = window.location.pathname.match(/^\/school\/([a-z0-9-]+)(\/|$)/i)
  if (pathMatch) return pathMatch[1].toLowerCase()

  // 3. Query param
  const params = new URLSearchParams(window.location.search)
  const q = params.get('tenant')
  if (q) return q.toLowerCase()

  return null
}

export const tenantSlug = detectTenantSlug()

// ── Platform (SuperAdmin) views ───────────────────────────────
import PlatformLogin from '../platform/PlatformLogin.vue'
import PlatformLayout from '../platform/PlatformLayout.vue'
import PlatformDashboard from '../platform/PlatformDashboard.vue'
import OnboardingWizard from '../platform/OnboarDingwizard.vue'

// ── School app views ──────────────────────────────────────────
import HomeView from '../views/HomeView.vue'
import LoginPage from '../views/LoginPage.vue'
import CourseList from '../views/CourseList.vue'
import AppCalendar from '../views/AppCalendar.vue'
import GroupManagement from '../views/GroupManagement.vue'
import AddTeacher from '../views/AddTeacher.vue'
import StudentDashboard from '../views/StudentDashboard.vue'
import TeacherDashboard from '../views/TeacherDashboard.vue'
import ParentDashboard from '../views/ParentDashboard.vue'
import PublicCourses from '../views/PublicCourses.vue'

export const isSchool = !!tenantSlug
const schoolChildren = [
  { path: '', name: 'Home', component: HomeView },
  { path: 'login', name: 'Login', component: LoginPage, meta: { requiresTenant: true } },
  {
    path: 'courses',
    name: 'Courses',
    component: CourseList,
    meta: { requiresAuth: true, requiresTenant: true },
  },
  {
    path: 'calendar',
    name: 'Calendar',
    component: AppCalendar,
    meta: { requiresAuth: true, requiresTenant: true },
  },
  {
    path: 'groups',
    name: 'Groups',
    component: GroupManagement,
    meta: { requiresAuth: true, requiresTenant: true, roles: ['admin', 'teacher'] },
  },
  {
    path: 'add-teacher',
    name: 'AddTeacher',
    component: AddTeacher,
    meta: { requiresAuth: true, requiresTenant: true, roles: ['admin'] },
  },
  {
    path: 'student-dashboard',
    name: 'StudentDashboard',
    component: StudentDashboard,
    meta: { requiresAuth: true, requiresTenant: true, roles: ['student'] },
  },
  {
    path: 'teacher-dashboard',
    name: 'TeacherDashboard',
    component: TeacherDashboard,
    meta: { requiresAuth: true, requiresTenant: true, roles: ['teacher'] },
  },
  {
    path: 'parent-dashboard',
    name: 'ParentDashboard',
    component: ParentDashboard,
    meta: { requiresAuth: true, requiresTenant: true, roles: ['parent'] },
  },
  { path: 'public-courses', name: 'PublicCourses', component: PublicCourses },
]
const routes = [
  // ── 0. School Self-Registration (SaaS onboarding) ──────────
  {
    path: '/register-school',
    name: 'RegisterSchool',
    component: OnboardingWizard,
    meta: { isPublicRegistration: true },
  },
  {
    path: '/platform/login',
    name: 'PlatformLogin',
    component: PlatformLogin,
    meta: { requiresNoAuth: true, isPlatform: true },
  },
  // ── 0b. Post-approval onboarding (admin activates tenant) ──
  {
    path: '/onboarding/:tenantId',
    name: 'OnboardingWizard',
    component: OnboardingWizard,
    meta: { isPublicRegistration: true },
  },

  {
    path: '/platform',
    component: PlatformLayout,
    meta: { requiresPlatformAuth: true, isPlatform: true },
    children: [
      {
        path: '',
        redirect: '/platform/dashboard',
      },
      {
        path: 'dashboard',
        name: 'PlatformDashboard',
        component: PlatformDashboard,
      },
    ],
  },
  {
    path: '/school/:slug',
    meta: { isSchoolRoot: true },
    children: schoolChildren.map((r) => ({
      ...r,
      // prefix names to avoid conflict with legacy routes
      name: r.name ? `School_${r.name}` : undefined,
    })),
  },
  // ── 2. School App ─────────────────────────────────────────────
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { requiresTenant: true },
  },
  {
    path: '/courses',
    name: 'Courses',
    component: CourseList,
    meta: { requiresAuth: true, requiresTenant: true },
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: AppCalendar,
    meta: { requiresAuth: true, requiresTenant: true },
  },
  {
    path: '/groups',
    name: 'Groups',
    component: GroupManagement,
    meta: { requiresAuth: true, requiresTenant: true, roles: ['admin', 'teacher'] },
  },
  {
    path: '/add-teacher',
    name: 'AddTeacher',
    component: AddTeacher,
    meta: { requiresAuth: true, requiresTenant: true, roles: ['admin'] },
  },
  {
    path: '/student-dashboard',
    name: 'StudentDashboard',
    component: StudentDashboard,
    meta: { requiresAuth: true, requiresTenant: true, roles: ['student'] },
  },
  {
    path: '/teacher-dashboard',
    name: 'TeacherDashboard',
    component: TeacherDashboard,
    meta: { requiresAuth: true, requiresTenant: true, roles: ['teacher'] },
  },
  {
    path: '/parent-dashboard',
    name: 'ParentDashboard',
    component: ParentDashboard,
    meta: { requiresAuth: true, requiresTenant: true, roles: ['parent'] },
  },
  {
    path: '/public-courses',
    name: 'PublicCourses',
    component: PublicCourses,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// ── Navigation Guards ─────────────────────────────────────────
router.beforeEach((to, from, next) => {
  const platformToken = localStorage.getItem('platform_token')
  const schoolToken = localStorage.getItem('token')
  const userRaw = localStorage.getItem('user')
  const user = userRaw ? JSON.parse(userRaw) : null

  // 1. Platform routes
  if (to.meta.requiresPlatformAuth) {
    if (!platformToken) return next('/platform/login')
    return next()
  }
  if (to.path.startsWith('/school/')) {
    if (to.meta.requiresAuth && !schoolToken) {
      const slug = to.params.slug
      return next(`/school/${slug}/login`)
    }
    if (to.meta.roles && user && !to.meta.roles.includes(user.role)) {
      const slug = to.params.slug
      return next(`/school/${slug}/courses`)
    }
    return next()
  }
  // 2. School auth routes
  if (to.meta.requiresAuth) {
    if (!schoolToken) return next('/login')
    if (to.meta.roles && user && !to.meta.roles.includes(user.role)) {
      return next('/courses')
    }
    return next()
  }

  // 3. requiresTenant: if no tenant slug, block access
  if (to.meta.requiresTenant && !tenantSlug) {
    // No tenant → redirect to school self-registration page
    return next('/register-school')
  }

  next()
})
export function getSlugFromRoute(route) {
  return route?.params?.slug || tenantSlug
}
export default router
