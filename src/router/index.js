// src/router/index.js
// ─────────────────────────────────────────────────────────────
// 4 interface roots:
//   /mudar           → MUDAR platform landing page (public)
//   /mudar/login     → Unified login (school clients + superadmin)
//   /platform/*      → SuperAdmin dashboard (requires platform_token)
//   /register-school → School self-registration
//   /school/:slug/*  → School tenant app
//   /*               → School app (legacy, requires tenant slug)
// ─────────────────────────────────────────────────────────────

import { createRouter, createWebHistory } from 'vue-router'

// ── Detect tenant slug ────────────────────────────────────────
function detectTenantSlug() {
  const h = window.location.hostname
  const parts = h.split('.')
  if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www')
    return parts[0].toLowerCase()

  const pathMatch = window.location.pathname.match(/^\/school\/([a-z0-9-]+)(\/|$)/i)
  if (pathMatch) return pathMatch[1].toLowerCase()

  const params = new URLSearchParams(window.location.search)
  const q = params.get('tenant')
  if (q) return q.toLowerCase()

  return null
}

export const tenantSlug = detectTenantSlug()

// ── MUDAR Platform views ──────────────────────────────────────
import MudarLanding from '../platform/MudarLanding.vue'
import MudarLogin from '../platform/MudarLogin.vue'
import PlatformLogin from '../platform/PlatformLogin.vue'
import PlatformLayout from '../platform/PlatformLayout.vue'
import PlatformDashboard from '../platform/PlatformDashboard.vue'
import OnboardingWizard from '../platform/OnboarDingwizard.vue'
import RegisterSchoolPage from '../platform/RegisterSchoolPage.vue'

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
  // ── MUDAR Platform ─────────────────────────────────────────
  {
    path: '/mudar',
    name: 'MudarLanding',
    component: MudarLanding,
    meta: { isPublic: true, isPublicRegistration: true },
  },
  {
    path: '/mudar/login',
    name: 'MudarLogin',
    component: MudarLogin,
    meta: { isPublic: true, isPublicRegistration: true },
  },

  // ── School Self-Registration ────────────────────────────────
  {
    path: '/register-school',
    name: 'RegisterSchool',
    component: RegisterSchoolPage,
    meta: { isPublicRegistration: true },
  },

  // ── SuperAdmin login (keep for direct access) ───────────────
  {
    path: '/platform/login',
    name: 'PlatformLogin',
    component: PlatformLogin,
    meta: { requiresNoAuth: true, isPlatform: true },
  },

  // ── Onboarding wizard ───────────────────────────────────────
  {
    path: '/onboarding/:tenantId',
    name: 'OnboardingWizard',
    component: OnboardingWizard,
    meta: { isPublicRegistration: true },
  },

  // ── SuperAdmin dashboard ────────────────────────────────────
  {
    path: '/platform',
    component: PlatformLayout,
    meta: { requiresPlatformAuth: true, isPlatform: true },
    children: [
      { path: '', redirect: '/platform/dashboard' },
      { path: 'dashboard', name: 'PlatformDashboard', component: PlatformDashboard },
    ],
  },

  // ── School tenant app (slug-based) ─────────────────────────
  {
    path: '/school/:slug',
    meta: { isSchoolRoot: true },
    children: schoolChildren.map((r) => ({
      ...r,
      name: r.name ? `School_${r.name}` : undefined,
    })),
  },

  // ── Root redirect ───────────────────────────────────────────
  // If there's a tenant slug in URL, show school home; else show MUDAR landing
  {
    path: '/',
    redirect: () => {
      const slug = detectTenantSlug()
      return slug ? `/school/${slug}` : '/mudar'
    },
    meta: { isPublicRegistration: true },
  },

  // ── Legacy school routes (for subdomain/query-param tenants) ─
  { path: '/login', name: 'Login', component: LoginPage, meta: { requiresTenant: true } },
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
  { path: '/public-courses', name: 'PublicCourses', component: PublicCourses },
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

  // Platform admin routes
  if (to.meta.requiresPlatformAuth) {
    if (!platformToken) return next('/mudar/login')
    return next()
  }

  // /school/:slug/* routes
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

  // School auth routes (legacy)
  if (to.meta.requiresAuth) {
    if (!schoolToken) return next('/login')
    if (to.meta.roles && user && !to.meta.roles.includes(user.role)) {
      return next('/courses')
    }
    return next()
  }

  // requiresTenant: if no tenant slug, redirect to MUDAR landing
  if (to.meta.requiresTenant && !tenantSlug) {
    return next('/mudar')
  }

  next()
})

export function getSlugFromRoute(route) {
  return route?.params?.slug || tenantSlug
}

export default router
