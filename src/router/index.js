// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CourseList from '../views/CourseList.vue'
import LoginPage from '../views/LoginPage.vue'
import AddTeacher from '../views/AddTeacher.vue'
import TeacherDashboard from '../views/TeacherDashboard.vue'
import GroupManagement from '../views/GroupManagement.vue' // ✅ NOUVEAU
import ParentDashboard from '../views/ParentDashboard.vue'
import StudentDashboard from '../views/StudentDashboard.vue'
import AppCalendar from '../views/AppCalendar.vue'
import PublicCourses from '../views/PublicCourses.vue'
// inside routes array, add:

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/courses',
      name: 'courses',
      component: CourseList,
      meta: { requiresAuth: true },
    },
    {
      path: '/teacher-dashboard',
      name: 'teacher-dashboard',
      component: TeacherDashboard,
      meta: { requiresAuth: true, requiresTeacher: true },
    },
    {
      path: '/courses/:courseId/groups', // ✅ NOUVEAU
      name: 'group-management',
      component: GroupManagement,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/add-teacher',
      name: 'add-teacher',
      component: AddTeacher,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/parent-dashboard',
      name: 'parent-dashboard',
      component: ParentDashboard,
      meta: { requiresAuth: true, role: 'Parent' },
    },
    {
      path: '/student-dashboard',
      name: 'student-dashboard',
      component: StudentDashboard,
      meta: { requiresAuth: true, role: 'student' },
    },
    {
      path: '/calendar',
      name: 'AppCalendar',
      component: AppCalendar,
      meta: { requiresAuth: true },
    },
    { path: '/public-courses', name: 'public-courses', component: PublicCourses },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    return {
      top: 0,
      behavior: 'smooth',
    }
  },
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  // Vérifier si la route nécessite une authentification
  if (to.meta.requiresAuth && !user) {
    next('/login')
    return
  }

  // Vérifier si la route nécessite le rôle admin
  if (to.meta.requiresAdmin && (!user || user.role !== 'admin')) {
    next('/courses')
    return
  }

  // Vérifier si la route nécessite le rôle enseignant
  if (to.meta.requiresTeacher && (!user || user.role !== 'teacher')) {
    next('/courses')
    return
  }

  // Rediriger les enseignants vers leur tableau de bord au lieu de /courses
  if (to.path === '/courses' && user && user.role === 'teacher') {
    next('/teacher-dashboard')
    return
  }

  next()
})

export default router
