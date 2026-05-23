import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CourseList from '../views/CourseList.vue'
import LoginPage from '../views/LoginPage.vue'
import AddTeacher from '../views/AddTeacher.vue'
import TeacherDashboard from '../views/TeacherDashboard.vue'
import GroupManagement from '../views/GroupManagement.vue'
import ParentDashboard from '../views/ParentDashboard.vue'
import StudentDashboard from '../views/StudentDashboard.vue'
import AppCalendar from '../views/AppCalendar.vue'
import PublicCourses from '../views/PublicCourses.vue'

const hostname = window.location.hostname.replace(':5173', '')
const parts = hostname.split('.')
const isPlatform = parts[0] === 'admin'
const isSchool = parts.length >= 2 && parts[0] !== 'admin' && parts[0] !== 'localhost'
const tenantSlug = isSchool ? parts[0] : new URLSearchParams(location.search).get('tenant')

// ── Platform Admin ────────────────────────────────────────────
const platformRoutes = [
  { path: '/login', component: () => import('../platform/PlatformLogin.vue') },
  {
    path: '/dashboard',
    component: () => import('../platform/PlatformDashboard.vue'),
    meta: { requiresPlatformAuth: true },
  },
  { path: '/', redirect: '/dashboard' },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

// ── School App ────────────────────────────────────────────────
const schoolRoutes = [
  { path: '/', component: HomeView },
  { path: '/login', component: LoginPage },
  { path: '/courses', component: CourseList, meta: { requiresAuth: true } },
  {
    path: '/teacher-dashboard',
    component: TeacherDashboard,
    meta: { requiresAuth: true, requiresTeacher: true },
  },
  { path: '/courses/:courseId/groups', component: GroupManagement, meta: { requiresAuth: true } },
  {
    path: '/add-teacher',
    component: AddTeacher,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/parent-dashboard',
    component: ParentDashboard,
    meta: { requiresAuth: true, role: 'Parent' },
  },
  {
    path: '/student-dashboard',
    component: StudentDashboard,
    meta: { requiresAuth: true, role: 'student' },
  },
  { path: '/calendar', component: AppCalendar, meta: { requiresAuth: true } },
  { path: '/public-courses', component: PublicCourses },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

// ── Landing + Onboarding ──────────────────────────────────────
const landingRoutes = [
  { path: '/', component: HomeView },
  { path: '/register', component: () => import('../platform/OnboarDingwizard.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const routes = isPlatform ? platformRoutes : isSchool ? schoolRoutes : landingRoutes

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach((to, from, next) => {
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  if (to.meta.requiresPlatformAuth) {
    const token = localStorage.getItem('platform_token')
    if (!token) return next('/login')
  }

  if (to.meta.requiresAuth && !user) {
    next('/login')
    return
  }
  if (to.meta.requiresAdmin && (!user || user.role !== 'admin')) {
    next('/courses')
    return
  }
  if (to.meta.requiresTeacher && (!user || user.role !== 'teacher')) {
    next('/courses')
    return
  }
  if (to.path === '/courses' && user && user.role === 'teacher') {
    next('/teacher-dashboard')
    return
  }

  next()
})

export { tenantSlug, isPlatform, isSchool }
export default router
