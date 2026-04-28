<!-- src/views/PublicCourses.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as api from '../services/api.js'
import { useLanguage } from '../composables/useLanguage.js'
import AppLoader from '../components/AppLoader.vue'
const router = useRouter()
const route = useRoute()
const { t, currentLang } = useLanguage()

const props = defineProps({
  darkMode: { type: Boolean, default: false },
})

const courses = ref([])
const loading = ref(true)
const selectedLevel = ref('tous')

/* ── Level config ─────────────────────────────────────────────── */
const educationLevels = computed(() => ({
  tous: { label: t('all_levels'), color: '#0255ae', bg: 'from-[#0255ae] to-[#1ba8f4]' },
  primaire: {
    label: t('primary_level_label'),
    color: '#10b981',
    bg: 'from-emerald-500 to-teal-400',
  },
  moyen: { label: t('middle_level_label'), color: '#3b82f6', bg: 'from-blue-500 to-sky-400' },
  secondaire: {
    label: t('secondary_level_label'),
    color: '#8b5cf6',
    bg: 'from-violet-500 to-purple-400',
  },
}))

const branchLabels = computed(() => ({
  sciences_experimentales: currentLang.value === 'ar' ? 'علوم تجريبية' : 'Sciences expérimentales',
  mathematiques: currentLang.value === 'ar' ? 'رياضيات' : 'Mathématiques',
  techniques_mathematiques: currentLang.value === 'ar' ? 'تقني رياضي' : 'Techniques mathématiques',
  gestion_economie: currentLang.value === 'ar' ? 'تسيير واقتصاد' : 'Gestion & Économie',
  lettres_philosophie: currentLang.value === 'ar' ? 'آداب وفلسفة' : 'Lettres & Philosophie',
  langues_etrangeres: currentLang.value === 'ar' ? 'لغات أجنبية' : 'Langues étrangères',
}))

/* ── Computed list ────────────────────────────────────────────── */
const coursesByLevel = computed(() => {
  if (selectedLevel.value === 'tous') {
    return {
      primaire: courses.value.filter((c) => c.education_level === 'primaire'),
      moyen: courses.value.filter((c) => c.education_level === 'moyen'),
      secondaire: courses.value.filter((c) => c.education_level === 'secondaire'),
    }
  }
  return {
    [selectedLevel.value]: courses.value.filter((c) => c.education_level === selectedLevel.value),
  }
})

/* ── Data ─────────────────────────────────────────────────────── */
const loadCourses = async () => {
  try {
    loading.value = true
    courses.value = await api.getPublicCourses()
  } catch (err) {
    console.error('Erreur chargement cours:', err)
  } finally {
    loading.value = false
  }
}

const getLevelGradient = (level) => {
  const map = {
    primaire: 'from-emerald-500 to-teal-400',
    moyen: 'from-blue-500 to-sky-400',
    secondaire: 'from-violet-500 to-purple-400',
  }
  return map[level] || 'from-gray-400 to-gray-500'
}

const getLevelColor = (level) => {
  const map = { primaire: '#10b981', moyen: '#3b82f6', secondaire: '#8b5cf6' }
  return map[level] || '#64748b'
}

onMounted(async () => {
  await loadCourses()
  const lvl = route.query.level
  if (lvl && ['primaire', 'moyen', 'secondaire'].includes(lvl)) {
    selectedLevel.value = lvl
    setTimeout(() => {
      document
        .getElementById(`level-${lvl}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }
})
</script>

<template>
  <!-- ══════ LOADING ══════ -->
  <div v-if="loading" class="flex flex-col items-center justify-center py-24 gap-4">
    <AppLoader size="120px" />
    <p :class="darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-sm font-medium">
      {{ t('loading') }}
    </p>
  </div>

  <div v-else class="space-y-10">
    <!-- ══════ HERO HEADER ══════ -->
    <div class="relative overflow-hidden rounded-3xl">
      <!-- gradient bg -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-[#040d1f] via-[#0255ae] to-[#1ba8f4]"
      ></div>
      <!-- mesh overlay -->
      <div
        class="absolute inset-0 opacity-10"
        style="
          background-image:
            radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px),
            radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px),
            radial-gradient(circle at 60% 80%, #fff 1px, transparent 1px);
          background-size: 40px 40px;
        "
      ></div>

      <div class="relative z-10 px-8 py-12 md:py-16 text-white">
        <div class="max-w-3xl mx-auto text-center">
          <!-- icon -->
          <div
            class="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>

          <h1 class="text-3xl md:text-5xl font-black mb-3 leading-tight">
            {{ t('our_educational_courses') }}
          </h1>
          <p class="text-blue-100 text-base md:text-lg mb-8 max-w-xl mx-auto">
            {{ t('discover_all_courses') }}
          </p>

          <!-- CTA banner -->
          <div
            class="inline-flex flex-col sm:flex-row items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4"
          >
            <!-- info icon -->
            <div class="flex items-center gap-2 text-sm text-blue-100">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              {{ t('login_to_register_details') }}
            </div>
            <button
              @click="router.push('/login')"
              class="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#0255ae] font-bold text-sm hover:bg-blue-50 transition-all hover:scale-105 shadow-lg"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              {{ t('login_button') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════ LEVEL FILTER TABS ══════ -->
    <div class="flex flex-wrap gap-3 justify-center">
      <button
        v-for="(info, key) in educationLevels"
        :key="key"
        @click="selectedLevel = key"
        class="relative px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
        :class="
          selectedLevel === key
            ? `bg-gradient-to-r ${info.bg} text-white shadow-lg scale-105`
            : darkMode
              ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 border border-gray-700'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm'
        "
      >
        <!-- active indicator dot -->
        <span
          v-if="selectedLevel === key"
          class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white/70 animate-pulse"
        ></span>
        {{ info.label }}
      </button>
    </div>

    <!-- ══════ EMPTY STATE ══════ -->
    <div
      v-if="courses.length === 0"
      :class="darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-100'"
      class="rounded-2xl border-2 shadow-lg p-16 text-center"
    >
      <div
        class="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
        :class="darkMode ? 'bg-gray-700' : 'bg-gray-100'"
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          :class="darkMode ? 'text-gray-500' : 'text-gray-400'"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <p :class="darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-base font-medium">
        {{ t('no_courses_available_now') }}
      </p>
    </div>

    <!-- ══════ COURSE SECTIONS BY LEVEL ══════ -->
    <div class="space-y-14">
      <section
        v-for="(levelCourses, level) in coursesByLevel"
        :key="level"
        v-show="levelCourses.length > 0"
        :id="`level-${level}`"
      >
        <!-- section header -->
        <div class="flex items-center gap-4 mb-6">
          <div class="flex items-center gap-3">
            <div class="w-1 h-10 rounded-full" :style="{ background: getLevelColor(level) }"></div>
            <div>
              <h2
                :class="darkMode ? 'text-white' : 'text-gray-900'"
                class="text-2xl font-black tracking-tight"
              >
                {{ educationLevels[level]?.label }}
              </h2>
              <p :class="darkMode ? 'text-gray-400' : 'text-gray-500'" class="text-sm mt-0.5">
                {{ t('available_courses_count').replace('{n}', levelCourses.length) }}
              </p>
            </div>
          </div>
        </div>

        <!-- course grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <article
            v-for="course in levelCourses"
            :key="course.id"
            :class="
              darkMode
                ? 'bg-gray-800/80 border-gray-700/60 hover:border-gray-500'
                : 'bg-white border-gray-100 hover:border-blue-200'
            "
            class="group rounded-2xl border-2 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col"
          >
            <!-- top color bar -->
            <div
              class="h-1.5 w-full bg-gradient-to-r shrink-0"
              :class="getLevelGradient(course.education_level)"
            ></div>

            <div class="p-5 flex flex-col flex-1 gap-4">
              <!-- course title + badges -->
              <div>
                <h3
                  :class="darkMode ? 'text-white' : 'text-gray-900'"
                  class="font-bold text-base leading-snug mb-2 group-hover:text-blue-600 transition-colors"
                >
                  {{ course.title }}
                </h3>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    :style="{
                      background: getLevelColor(course.education_level) + '18',
                      color: getLevelColor(course.education_level),
                    }"
                  >
                    {{ educationLevels[course.education_level]?.label }} — {{ course.year_level }}
                    {{ currentLang === 'ar' ? '' : 'ème' }}
                  </span>
                  <span
                    v-if="course.branch"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700"
                  >
                    {{ branchLabels[course.branch] }}
                  </span>
                </div>
              </div>

              <!-- teacher -->
              <div class="flex items-center gap-2.5">
                <!-- avatar initials -->
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                  :style="{ background: getLevelColor(course.education_level) }"
                >
                  {{ course.teacher_name?.charAt(0) }}{{ course.teacher_last_name?.charAt(0) }}
                </div>
                <div>
                  <p
                    :class="darkMode ? 'text-gray-200' : 'text-gray-800'"
                    class="text-sm font-semibold leading-none"
                  >
                    {{
                      course.teacher_gender === 'M'
                        ? currentLang === 'ar'
                          ? 'أ.'
                          : 'M.'
                        : currentLang === 'ar'
                          ? 'أ.'
                          : 'Mme'
                    }}
                    {{ course.teacher_name }} {{ course.teacher_last_name }}
                  </p>
                  <p :class="darkMode ? 'text-gray-500' : 'text-gray-400'" class="text-xs mt-0.5">
                    {{ t('teachers') }}
                  </p>
                </div>
              </div>

              <!-- description -->
              <p
                v-if="course.description"
                :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
                class="text-sm leading-relaxed line-clamp-2 flex-1"
              >
                {{ course.description }}
              </p>
              <div v-else class="flex-1"></div>

              <!-- meta row: groups + price -->
              <div
                class="flex items-center justify-between pt-3 mt-auto border-t"
                :class="darkMode ? 'border-gray-700' : 'border-gray-100'"
              >
                <!-- groups -->
                <div
                  class="flex items-center gap-1.5"
                  :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span class="text-xs font-medium">
                    {{ course.open_groups }} {{ t('my_groups') }}
                  </span>
                </div>
                <!-- price badge -->
                <span
                  v-if="!course.price || course.price === 0"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700"
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {{ t('free').toUpperCase() }}
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700"
                >
                  {{ parseFloat(course.price).toLocaleString('fr-DZ') }} DA
                </span>
              </div>

              <!-- CTA button -->
              <button
                @click="router.push('/login')"
                class="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all bg-gradient-to-r from-[#0255ae] to-[#1ba8f4] hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                {{ t('login_to_register') }}
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
