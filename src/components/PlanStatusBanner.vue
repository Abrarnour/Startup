<template>
  <div v-if="planStatus" class="psb-root" :class="{ 'psb-warning': isNearLimit }">
    <div class="psb-left">
      <div class="psb-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>
      <div class="psb-info">
        <span class="psb-plan-name">{{ planStatus.plan_name_ar }}</span>
        <span v-if="planStatus.trial_ends_at && planStatus.status === 'trial'" class="psb-trial-badge">
          تجريبية — تنتهي {{ formatTrialEnd(planStatus.trial_ends_at) }}
        </span>
      </div>
    </div>
    <div class="psb-limits">
      <div class="psb-limit-item" :class="{ 'psb-at-limit': planStatus.student_count >= planStatus.max_students }">
        <span class="psb-count">{{ planStatus.student_count }}</span>
        <span class="psb-sep">/</span>
        <span class="psb-max">{{ planStatus.max_students }}</span>
        <span class="psb-label">طالب</span>
        <div class="psb-bar">
          <div class="psb-bar-fill" :style="{ width: Math.min(100, (planStatus.student_count / planStatus.max_students) * 100) + '%' }"></div>
        </div>
      </div>
      <div class="psb-limit-item" :class="{ 'psb-at-limit': planStatus.teacher_count >= planStatus.max_teachers }">
        <span class="psb-count">{{ planStatus.teacher_count }}</span>
        <span class="psb-sep">/</span>
        <span class="psb-max">{{ planStatus.max_teachers }}</span>
        <span class="psb-label">أستاذ</span>
        <div class="psb-bar">
          <div class="psb-bar-fill" :style="{ width: Math.min(100, (planStatus.teacher_count / planStatus.max_teachers) * 100) + '%' }"></div>
        </div>
      </div>
    </div>
    <div v-if="isNearLimit" class="psb-upgrade-hint">
      اقتربت من الحد الأقصى — تواصل معنا للترقية
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const planStatus = ref(null)

const isNearLimit = computed(() => {
  if (!planStatus.value) return false
  const { student_count, max_students, teacher_count, max_teachers } = planStatus.value
  return student_count / max_students >= 0.85 || teacher_count / max_teachers >= 0.85
})

function formatTrialEnd(d) {
  return new Date(d).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })
}

onMounted(async () => {
  try {
    const token = localStorage.getItem('token')
    const slug = window.location.pathname.match(/\/school\/([^/]+)/)?.[1]
    const headers = { Authorization: `Bearer ${token}` }
    if (slug) headers['X-Tenant-Slug'] = slug
    const res = await axios.get(`${API}/auth/plan-status`, { headers })
    planStatus.value = res.data
  } catch {}
})
</script>

<style scoped>
.psb-root {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.65rem 1.25rem;
  background: linear-gradient(90deg, #f5f3ff, #ede9fe);
  border-bottom: 1px solid #ddd6fe;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  direction: rtl;
  flex-wrap: wrap;
  font-size: 0.82rem;
}
.psb-root.psb-warning {
  background: linear-gradient(90deg, #fef3c7, #fde68a);
  border-bottom-color: #f59e0b;
}
.psb-left { display: flex; align-items: center; gap: 0.5rem; }
.psb-icon { width: 28px; height: 28px; background: #7c3aed; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.psb-icon svg { width: 14px; height: 14px; color: #fff; }
.psb-plan-name { font-weight: 700; color: #3b0764; }
.psb-trial-badge { background: #fde68a; color: #92400e; padding: 2px 8px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; margin-right: 6px; }
.psb-limits { display: flex; gap: 1.5rem; }
.psb-limit-item { display: flex; align-items: center; gap: 0.25rem; }
.psb-count { font-weight: 700; color: #1e0a3c; }
.psb-sep, .psb-max { color: #9d8bbf; }
.psb-label { color: #5b21b6; margin-right: 4px; }
.psb-limit-item.psb-at-limit .psb-count { color: #dc2626; }
.psb-bar { width: 60px; height: 5px; background: #ddd6fe; border-radius: 3px; overflow: hidden; margin-right: 4px; }
.psb-bar-fill { height: 100%; background: #7c3aed; border-radius: 3px; transition: width 0.4s; }
.psb-limit-item.psb-at-limit .psb-bar-fill { background: #dc2626; }
.psb-upgrade-hint { font-size: 0.75rem; color: #92400e; font-weight: 600; }
</style>