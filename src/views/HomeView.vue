<script setup>
import { defineProps, ref, onMounted, onUnmounted, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useLanguage } from '../composables/useLanguage.js'
import { Home, GraduationCap, Star, ListChecks } from 'lucide-vue-next'
const { t } = useLanguage()
const router = useRouter()
const props = defineProps({
  darkMode: { type: Boolean, default: false },
  user: { type: Object, default: null },
})
const navigateToLevel = (key) => {
  if (!props.user) router.push({ path: '/public-courses', query: { level: key } })
  else router.push('/courses')
}

const sections = computed(() => [
  { id: 'hero-section', label: t('snav_home'), svgPath: '...', svgExtra: '' },
  { id: 'stats-section', label: t('snav_stats'), svgPath: '...', svgExtra: '' },
  { id: 'levels-section', label: t('snav_levels'), svgPath: '...', svgExtra: '' },
  { id: 'features-section', label: t('snav_features'), svgPath: '...', svgExtra: '' },
  { id: 'about-section', label: t('snav_about'), svgPath: '...', svgExtra: '' },
  { id: 'testimonials-section', label: t('snav_reviews'), svgPath: '...', svgExtra: '' },
  { id: 'cta-section', label: t('snav_register'), svgPath: '...', svgExtra: '' },
])

const activeSection = ref('hero-section')

const scrollToSection = (id) => {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── Animated counters ──────────────────────────────────────────
const counters = ref([
  { key: 'stat_students', target: 320, current: 0, suffix: '+' },
  { key: 'stat_courses', target: 48, current: 0, suffix: '' },
  { key: 'stat_teachers', target: 12, current: 0, suffix: '' },
  { key: 'stat_experience', target: 8, current: 0, suffix: '+' },
])
const animateCounter = (counter) => {
  const duration = 2200
  const steps = 80
  const increment = counter.target / steps
  let step = 0
  const interval = setInterval(() => {
    step++
    counter.current = Math.min(Math.round(increment * step), counter.target)
    if (step >= steps) clearInterval(interval)
  }, duration / steps)
}

const countersRef = ref(null)
let countersTriggered = false
let io = null

onMounted(() => {
  io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          if (entry.target === countersRef.value && !countersTriggered) {
            countersTriggered = true
            counters.value.forEach((c) => animateCounter(c))
          }
        }
      })
    },
    { threshold: 0.12 },
  )
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
  if (countersRef.value) io.observe(countersRef.value)

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      })
    },
    { threshold: 0.4 },
  )
  sections.value.forEach((s) => {
    const el = document.getElementById(s.id)
    if (el) sectionObserver.observe(el)
  })
  onUnmounted(() => sectionObserver.disconnect())
})

onUnmounted(() => io?.disconnect())

// ── Features ──────────────────────────────────────────────────
const features = computed(() => [
  { icon: '', num: '01', title: t('f1_title'), desc: t('f1_desc') },
  { icon: '', num: '02', title: t('f2_title'), desc: t('f2_desc') },
  { icon: '', num: '03', title: t('f3_title'), desc: t('f3_desc') },
  { icon: '', num: '04', title: t('f4_title'), desc: t('f4_desc') },
  { icon: '', num: '05', title: t('f5_title'), desc: t('f5_desc') },
  { icon: '', num: '06', title: t('f6_title'), desc: t('f6_desc') },
])

// ── Levels ────────────────────────────────────────────────────
const levels = computed(() => [
  {
    key: 'primaire',
    name: t('level_primary'),
    arabic: t('level_primary_ar'),
    years: t('years_primary'),
    img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=85',
    accent: '#10b981',
  },
  {
    key: 'moyen',
    name: t('level_middle'),
    arabic: t('level_middle_ar'),
    years: t('years_middle'),
    img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=85',
    accent: '#3b82f6',
  },
  {
    key: 'secondaire',
    name: t('level_secondary'),
    arabic: t('level_secondary_ar'),
    years: t('years_secondary'),
    img: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=85',
    accent: '#8b5cf6',
  },
])

// ── Testimonials ──────────────────────────────────────────────
const testimonials = computed(() => [
  {
    name: 'Amira B.',
    role: t('parent_role'),
    text: t('testi_1_text'),
    rating: 5,
    color: '#0255ae',
  },
  {
    name: 'Yacine M.',
    role: t('student_role'),
    text: t('testi_2_text'),
    rating: 5,
    color: '#10b981',
  },
  {
    name: 'Nadia K.',
    role: t('parent_role'),
    text: t('testi_3_text'),
    rating: 5,
    color: '#f59e0b',
  },
])
const activeTestimonial = ref(0)
const tInterval = setInterval(() => {
  activeTestimonial.value = (activeTestimonial.value + 1) % testimonials.value.length
}, 4500)
onUnmounted(() => clearInterval(tInterval))
</script>

<template>
  <div class="home" :class="{ 'dark-mode': darkMode }">
    <!-- ══════════════════════════════════
         1. HERO — split dark editorial
         ══════════════════════════════════ -->
    <section id="hero-section" class="hero reveal">
      <div class="hero-left">
        <div class="hero-eyebrow">
          <span class="live-dot"></span>
          {{ t('hero_eyebrow') }}
        </div>

        <h1 class="hero-heading">
          <span class="h-top">{{ t('hero_h_top') }}</span>
          <span class="h-main">{{ t('hero_h_main') }}</span>
          <span class="h-arabic">{{ t('hero_h_arabic') }}</span>
        </h1>

        <p class="hero-body">
          {{ t('hero_body') }}
        </p>

        <div class="hero-actions">
          <RouterLink to="/courses" class="btn-electric">
            {{ t('explore_courses') }}
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </RouterLink>
          <RouterLink to="/login" class="btn-ghost">{{ t('login_link') }}</RouterLink>
        </div>

        <div class="hero-strip">
          <div class="strip-item" v-for="c in counters" :key="c.key">
            <span class="strip-val">{{ c.target }}{{ c.suffix }}</span>
            <span class="strip-lbl">{{ t(c.key) }}</span>
          </div>
        </div>
      </div>

      <div class="hero-right">
        <img
          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1000&q=88"
          alt="Salle de classe Belmahi"
          class="hero-photo"
        />
        <div class="hero-photo-veil"></div>

        <div class="hero-glass-card">
          <span class="glass-num">320+</span>
          <span class="glass-txt">{{ t('hero_glass_txt') }}</span>
        </div>

        <div class="hero-badge-pill">
          <span class="pill-dot"></span> {{ t('registration_open') }}
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════
         2. BENTO STATS
         ══════════════════════════════════ -->
    <section id="stats-section" class="bento reveal" ref="countersRef">
      <div class="bento-grid">
        <!-- Big card -->
        <div class="bc bc-navy bc-big">
          <div class="bc-ghost-txt">{{ t('bento_students') }}</div>
          <div class="bc-num">{{ counters[0].current }}{{ counters[0].suffix }}</div>
          <div class="bc-lbl">{{ t(counters[0].key) }}</div>
          <div class="bc-bar">
            <div
              class="bc-fill"
              :style="{ width: (counters[0].current / counters[0].target) * 100 + '%' }"
            ></div>
          </div>
        </div>

        <!-- Stack: 2 small -->
        <div class="bc-stack">
          <div class="bc bc-light bc-sm">
            <div class="bc-num">{{ counters[1].current }}{{ counters[1].suffix }}</div>
            <div class="bc-lbl">{{ t(counters[1].key) }}</div>
          </div>
          <div class="bc bc-electric bc-sm">
            <div class="bc-num">{{ counters[2].current }}{{ counters[2].suffix }}</div>
            <div class="bc-lbl">{{ t(counters[2].key) }}</div>
          </div>
        </div>

        <!-- Wide amber card -->
        <div class="bc bc-amber bc-wide">
          <div class="bc-ghost-txt">{{ t('bento_years') }}</div>
          <div class="bc-num">{{ counters[3].current }}{{ counters[3].suffix }}</div>
          <div class="bc-lbl">{{ t(counters[3].key) }}</div>
          <img
            src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=400&q=80"
            alt=""
            class="bc-img"
          />
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════
         3. LEVELS — full photo cards
         ══════════════════════════════════ -->
    <section id="levels-section" class="levels reveal">
      <div class="levels-top">
        <div>
          <span class="eyetag">{{ t('levels_eyetag') }}</span>
          <h2 class="sec-title">
            {{ t('levels_title_1') }}<br /><em>{{ t('levels_title_2') }}</em>
          </h2>
        </div>
        <p class="sec-sub">{{ t('levels_sub') }}</p>
      </div>

      <div class="levels-grid">
        <div
          v-for="lv in levels"
          :key="lv.name"
          class="lc"
          @click="navigateToLevel(lv.key)"
          style="cursor: pointer"
        >
          <img :src="lv.img" :alt="lv.name" class="lc-img" />
          <div class="lc-veil" :style="{ '--a': lv.accent }"></div>
          <div class="lc-body">
            <span class="lc-ar">{{ lv.arabic }}</span>
            <h3 class="lc-name">{{ lv.name }}</h3>
            <p class="lc-years">{{ lv.years }}</p>
            <RouterLink to="/courses" class="lc-cta">
              <button class="lc-cta">{{ t('see_courses') }} ...</button>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════
         4. FEATURES — editorial grid
         ══════════════════════════════════ -->
    <section id="features-section" class="features reveal">
      <div class="features-top">
        <div>
          <span class="eyetag">{{ t('feat_eyetag') }}</span>
          <h2 class="sec-title">
            {{ t('feat_title_1') }}<br /><em>{{ t('feat_title_2') }}</em>
          </h2>
        </div>
        <div class="features-img-col">
          <img
            src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80"
            alt="Bibliothèque"
            class="feat-side-img"
          />
        </div>
      </div>

      <div class="feat-grid">
        <div
          v-for="(f, i) in features"
          :key="i"
          class="feat-card reveal"
          :style="{ transitionDelay: i * 0.065 + 's' }"
        >
          <div class="feat-top-row">
            <span class="feat-icon">{{ f.icon }}</span>
            <span class="feat-num">{{ f.num }}</span>
          </div>
          <h3 class="feat-title">{{ f.title }}</h3>
          <p class="feat-desc">{{ f.desc }}</p>
          <div class="feat-ruler"></div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════
         5. ABOUT — layered images
         ══════════════════════════════════ -->
    <section id="about-section" class="about reveal" :class="{ dark: darkMode }">
      <div class="about-grid">
        <!-- Visual -->
        <div class="about-vis">
          <div class="av-frame av-frame1">
            <img src="/blmahi.jpeg" alt="Belmahi School" class="av-img" />
          </div>
          <div class="av-frame av-frame2">
            <img src="/blmahi2.jpeg" alt="Belmahi School" class="av-img" />
          </div>
          <div class="av-chip">
            <span class="av-chip-num">8+</span>
            <span class="av-chip-lbl"
              >{{ t('about_chip_years') }}<br />{{ t('about_chip_exp') }}</span
            >
          </div>
          <div class="av-ring"></div>
        </div>

        <!-- Text -->
        <div class="about-txt">
          <span class="eyetag">{{ t('about_eyetag') }}</span>
          <h2 class="about-h">{{ t('about_title_1') }}<br />{{ t('about_title_2') }}</h2>
          <p class="about-desc" v-html="t('about_desc')"></p>
          <ul class="about-list">
            <li
              v-for="pt in [t('about_li_1'), t('about_li_2'), t('about_li_3'), t('about_li_4')]"
              :key="pt"
            >
              <span class="ck">✓</span>
              <span>{{ pt }}</span>
            </li>
          </ul>
          <a
            href="https://www.google.com/maps/place/Belmahi+School"
            target="_blank"
            class="map-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              />
            </svg>
            {{ t('find_us_maps') }}
          </a>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════
         6. TESTIMONIALS — featured quote
         ══════════════════════════════════ -->
    <section id="testimonials-section" class="testi reveal">
      <div class="testi-layout">
        <!-- Sidebar -->
        <div class="testi-side">
          <span class="eyetag">{{ t('testi_eyetag') }}</span>
          <h2 class="sec-title">
            {{ t('testi_title_1') }}<br /><em>{{ t('testi_title_2') }}</em>
          </h2>
          <div class="testi-controls">
            <button
              v-for="(t, i) in testimonials"
              :key="i"
              class="testi-thumb"
              :class="{ active: i === activeTestimonial }"
              @click="activeTestimonial = i"
            >
              <div class="tt-avatar" :style="{ background: t.color }">{{ t.name.charAt(0) }}</div>
              <div class="tt-info">
                <span class="tt-name">{{ t.name }}</span>
                <span class="tt-role">{{ t.role }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Featured card -->
        <div class="testi-main">
          <transition name="tslide" mode="out-in">
            <div :key="activeTestimonial" class="testi-card">
              <div class="testi-bigquote">"</div>
              <div class="testi-stars">
                {{ '★'.repeat(testimonials[activeTestimonial].rating) }}
              </div>
              <p class="testi-text">{{ testimonials[activeTestimonial].text }}</p>
              <div class="testi-author">
                <div
                  class="ta-avatar"
                  :style="{ background: testimonials[activeTestimonial].color }"
                >
                  {{ testimonials[activeTestimonial].name.charAt(0) }}
                </div>
                <div>
                  <strong class="ta-name">{{ testimonials[activeTestimonial].name }}</strong>
                  <span class="ta-role">{{ testimonials[activeTestimonial].role }}</span>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════
         7. CTA — dark cinematic
         ══════════════════════════════════ -->
    <section id="cta-section" class="cta reveal">
      <div class="cta-photo-wrap">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=85"
          alt=""
          class="cta-photo"
        />
        <div class="cta-overlay"></div>
      </div>
      <div class="cta-content">
        <span class="eyetag eyetag-light">{{ t('cta_eyetag') }}</span>
        <h2 class="cta-title">{{ t('cta_title_1') }}<br />{{ t('cta_title_2') }}</h2>
        <p class="cta-sub">{{ t('cta_sub') }}</p>
        <RouterLink to="/login" class="btn-electric btn-large">
          {{ t('cta_btn') }}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

/* ═══════════════════════════════════════
   TOKENS & BASE
   ═══════════════════════════════════════ */
*,
*::before,
*::after {
  box-sizing: border-box;
}

.home {
  --navy: #040d1f;
  --blue: #0255ae;
  --electric: #1ba8f4;
  --amber: #fca716;
  --cream: #f4f3ef;
  --gray: #64748b;
  --white: #ffffff;
  /* Navbar height — keep in sync with NavBar h-16 (64px) */
  --navbar-h: 64px;

  font-family: 'DM Sans', sans-serif;
  background: var(--cream);
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 2vw, 1.25rem);
  width: 100%;
}

h1,
h2,
h3 {
  font-family: 'Syne', sans-serif;
}

.reveal {
  opacity: 0;
  transform: translateY(36px);
  transition:
    opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* eyetag */
.eyetag {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--blue);
  background: rgba(2, 85, 174, 0.09);
  padding: 0.28rem 0.85rem;
  border-radius: 999px;
  margin-bottom: 0.9rem;
}
.eyetag-light {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.sec-title {
  font-size: clamp(1.6rem, 4vw, 3.2rem);
  font-weight: 800;
  color: var(--navy);
  line-height: 1.05;
  margin: 0;
  letter-spacing: -0.03em;
}
.sec-title em {
  font-style: italic;
  color: var(--blue);
}
.dark-mode .sec-title {
  color: var(--white);
}

.sec-sub {
  color: var(--gray);
  font-size: clamp(0.85rem, 1.5vw, 1rem);
  line-height: 1.75;
  max-width: 340px;
}

/* Shared buttons */
.btn-electric {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.85rem 1.9rem;
  background: var(--electric);
  color: white;
  border-radius: 12px;
  font-weight: 600;
  font-size: clamp(0.82rem, 1.5vw, 0.95rem);
  text-decoration: none;
  font-family: 'Syne', sans-serif;
  transition: all 0.3s;
  box-shadow: 0 6px 24px rgba(27, 168, 244, 0.35);
  white-space: nowrap;
}
.btn-electric:hover {
  background: #0c9fe0;
  transform: translateY(-2px);
  box-shadow: 0 10px 32px rgba(27, 168, 244, 0.45);
}
.btn-electric svg {
  transition: transform 0.3s;
  flex-shrink: 0;
}
.btn-electric:hover svg {
  transform: translateX(4px);
}
.btn-large {
  padding: 1.05rem 2.4rem;
  font-size: 1.05rem;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  padding: 0.85rem 1.9rem;
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.75);
  border-radius: 12px;
  font-weight: 500;
  font-size: clamp(0.82rem, 1.5vw, 0.95rem);
  text-decoration: none;
  transition: all 0.3s;
  white-space: nowrap;
}
.btn-ghost:hover {
  border-color: rgba(255, 255, 255, 0.6);
  color: white;
}

/* ═══════════════════════════════════════
   SECTION NAV  ← KEY FIX
   ═══════════════════════════════════════
   top: var(--navbar-h)  → sticks BELOW the main navbar (not on top of it)
   z-index: 40           → stays behind the main navbar (z-50 = 50)
   ═══════════════════════════════════════ */
.section-nav {
  position: sticky;
  top: var(--navbar-h); /* was: top: 0 — was causing overlap with main navbar */
  z-index: 40; /* was: 90 — was rendering OVER the main navbar (z-50) */
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(2, 85, 174, 0.1);
  border-radius: 16px;
  box-shadow: 0 2px 24px rgba(2, 85, 174, 0.08);
  margin-bottom: 0;
}

.dark-mode .section-nav {
  background: rgba(4, 13, 31, 0.96);
  border-bottom-color: rgba(27, 168, 244, 0.12);
  box-shadow: 0 2px 24px rgba(0, 0, 0, 0.3);
}

.snav-inner {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.5rem 1rem;
  overflow-x: auto;
  scrollbar-width: none;
}
.snav-inner::-webkit-scrollbar {
  display: none;
}

.snav-btn {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 999px;
  transition: all 0.22s ease;
  white-space: nowrap;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  flex-shrink: 0;
}

.snav-btn:hover {
  background: rgba(2, 85, 174, 0.08);
  color: #0255ae;
}

.snav-active {
  background: linear-gradient(135deg, #0255ae, #1ba8f4) !important;
  color: white !important;
  box-shadow: 0 4px 16px rgba(2, 85, 174, 0.28);
}

.dark-mode .snav-btn {
  color: rgba(255, 255, 255, 0.45);
}
.dark-mode .snav-btn:hover {
  background: rgba(27, 168, 244, 0.12);
  color: #1ba8f4;
}
.dark-mode .snav-active {
  background: linear-gradient(135deg, #0255ae, #1ba8f4) !important;
  color: white !important;
}

.snav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.85;
}
.snav-active .snav-icon {
  opacity: 1;
}
.snav-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

@media (max-width: 600px) {
  .snav-label {
    display: none;
  }
  .snav-btn {
    padding: 0.5rem 0.65rem;
  }
  .snav-icon svg {
    width: 16px;
    height: 16px;
  }
}

/* ═══════════════════════════════════════
   1. HERO
   ═══════════════════════════════════════ */
.hero {
  display: grid;
  grid-template-columns: 55% 45%;
  min-height: clamp(480px, 80vh, 94vh);
  background: var(--navy);
  border-radius: clamp(12px, 2vw, 24px);
  overflow: hidden;
  position: relative;
}

/* Tablet portrait */
@media (max-width: 1024px) {
  .hero {
    grid-template-columns: 60% 40%;
  }
}

/* Mobile */
@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
    min-height: auto;
  }
  .hero-right {
    height: clamp(220px, 40vw, 340px);
  }
}

.hero-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(2rem, 6vw, 5rem) clamp(1.5rem, 5vw, 4.5rem);
  position: relative;
  z-index: 2;
}

.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  margin-bottom: clamp(1.5rem, 4vw, 3rem);
}
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  flex-shrink: 0;
  animation: livepulse 2s ease-in-out infinite;
}
@keyframes livepulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
  }
  50% {
    box-shadow: 0 0 0 7px rgba(34, 197, 94, 0);
  }
}

.hero-heading {
  display: flex;
  flex-direction: column;
  margin: 0 0 clamp(1.5rem, 3vw, 2.25rem);
}
.h-top {
  font-family: 'Syne', sans-serif;
  font-size: clamp(0.72rem, 1.5vw, 1.1rem);
  font-weight: 500;
  color: var(--electric);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}
.h-main {
  font-family: 'Syne', sans-serif;
  font-size: clamp(3rem, 8vw, 8rem);
  font-weight: 800;
  color: white;
  line-height: 0.88;
  letter-spacing: -0.05em;
  margin-bottom: 0.5rem;
}
.h-arabic {
  font-size: clamp(1rem, 2.5vw, 2rem);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.3);
  direction: rtl;
  text-align: left;
  letter-spacing: 0.02em;
}

.hero-body {
  color: rgba(255, 255, 255, 0.55);
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  line-height: 1.8;
  max-width: 420px;
  margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
}

.hero-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: clamp(2rem, 4vw, 3.5rem);
}

/* Mini stats strip */
.hero-strip {
  display: grid;
  grid-template-columns: repeat(4, auto);
  gap: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 1.5rem;
}
@media (max-width: 480px) {
  .hero-strip {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  .strip-item {
    padding-right: 0 !important;
    margin-right: 0 !important;
    border-right: none !important;
  }
}
.strip-item {
  padding-right: 1.5rem;
  margin-right: 1.5rem;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}
.strip-item:last-child {
  border-right: none;
}
.strip-val {
  display: block;
  font-family: 'Syne', sans-serif;
  font-size: clamp(1.1rem, 2.5vw, 1.5rem);
  font-weight: 800;
  color: white;
  line-height: 1;
}
.strip-lbl {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.04em;
}

/* Right photo panel */
.hero-right {
  position: relative;
  overflow: hidden;
}
.hero-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.65) saturate(1.1);
  transition: transform 10s ease;
}
.hero:hover .hero-photo {
  transform: scale(1.04);
}
.hero-photo-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, var(--navy) 0%, transparent 40%);
}

.hero-glass-card {
  position: absolute;
  bottom: clamp(1rem, 4vw, 3rem);
  right: clamp(0.75rem, 3vw, 2rem);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  padding: clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 2.5vw, 1.75rem);
  color: white;
}

.glass-num {
  display: block;
  font-family: 'Syne', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 800;
  line-height: 1;
  color: var(--electric);
}
.glass-txt {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.03em;
  display: block;
  margin-top: 0.25rem;
}

.hero-badge-pill {
  position: absolute;
  top: clamp(0.75rem, 3vw, 2rem);
  right: clamp(0.75rem, 3vw, 2rem);
  background: rgba(34, 197, 94, 0.15);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.pill-dot {
  width: 6px;
  height: 6px;
  background: #22c55e;
  border-radius: 50%;
  animation: livepulse 2s ease-in-out infinite;
}

/* ═══════════════════════════════════════
   2. BENTO STATS
   ═══════════════════════════════════════ */
.bento-grid {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.8fr;
  grid-template-rows: auto;
  gap: clamp(0.6rem, 1.5vw, 1rem);
  align-items: stretch;
}

/* Tablet: 2-column */
@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: 1fr 1fr;
  }
  .bc-stack {
    flex-direction: row !important;
  }
  .bc-wide {
    grid-column: 1 / -1;
  }
}

/* Mobile: full-width single column */
@media (max-width: 480px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }
  .bc-big {
    grid-column: 1;
  }
  .bc-stack {
    grid-column: 1;
    flex-direction: row !important;
    gap: 0.6rem;
  }
  .bc-wide {
    grid-column: 1;
  }
}

/* Base card */
.bc {
  border-radius: clamp(12px, 2vw, 20px);
  padding: clamp(1.25rem, 3vw, 2.25rem);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: clamp(130px, 15vw, 180px);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.bc:hover {
  transform: translateY(-5px);
}

.bc-navy {
  background: var(--navy);
  color: white;
}
.bc-light {
  background: white;
  color: var(--navy);
  box-shadow: 0 2px 20px rgba(2, 85, 174, 0.07);
}
.bc-electric {
  background: var(--electric);
  color: white;
}
.bc-amber {
  background: var(--amber);
  color: white;
}

.bc-big {
  grid-column: 1;
}
.bc-stack {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  gap: clamp(0.6rem, 1.5vw, 1rem);
}
.bc-sm {
  min-height: auto;
  flex: 1;
}
.bc-wide {
  grid-column: 3;
}

.bc-ghost-txt {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  font-family: 'Syne', sans-serif;
  font-size: clamp(3rem, 6vw, 5.5rem);
  font-weight: 800;
  opacity: 0.05;
  line-height: 1;
  user-select: none;
  white-space: nowrap;
  color: white;
}

.bc-num {
  font-family: 'Syne', sans-serif;
  font-size: clamp(2rem, 4.5vw, 3.8rem);
  font-weight: 800;
  line-height: 1;
  margin-bottom: 0.35rem;
  position: relative;
  z-index: 1;
}
.bc-lbl {
  font-size: clamp(0.7rem, 1.2vw, 0.8rem);
  opacity: 0.65;
  letter-spacing: 0.04em;
  position: relative;
  z-index: 1;
}

.bc-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  margin-top: 1.25rem;
  overflow: hidden;
  position: relative;
  z-index: 1;
}
.bc-fill {
  height: 100%;
  background: var(--electric);
  border-radius: 2px;
  transition: width 2.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.bc-img {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 50%;
  object-fit: cover;
  opacity: 0.25;
  mask-image: linear-gradient(to left, rgba(0, 0, 0, 0.8), transparent);
  -webkit-mask-image: linear-gradient(to left, rgba(0, 0, 0, 0.8), transparent);
}

/* ═══════════════════════════════════════
   3. LEVELS
   ═══════════════════════════════════════ */
.levels-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: clamp(1.25rem, 3vw, 2rem);
  gap: 2rem;
}
@media (max-width: 768px) {
  .levels-top {
    flex-direction: column;
    align-items: flex-start;
  }
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(0.6rem, 1.5vw, 1rem);
}
@media (max-width: 768px) {
  .levels-grid {
    grid-template-columns: 1fr;
    max-width: 480px;
    margin: 0 auto;
    width: 100%;
  }
}

/* Level card */
.lc {
  position: relative;
  height: clamp(240px, 30vw, 400px);
  border-radius: clamp(12px, 2vw, 20px);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}
/* On mobile, restore fixed comfortable height */
@media (max-width: 768px) {
  .lc {
    height: clamp(220px, 50vw, 320px);
  }
}
.lc:hover {
  transform: scale(1.025) translateY(-4px);
}

.lc-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.lc:hover .lc-img {
  transform: scale(1.07);
}

.lc-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(4, 13, 31, 0.97) 0%,
    rgba(4, 13, 31, 0.5) 50%,
    rgba(4, 13, 31, 0.1) 100%
  );
  transition: background 0.4s;
}
.lc:hover .lc-veil {
  background: linear-gradient(
    to top,
    rgba(4, 13, 31, 0.98) 0%,
    rgba(4, 13, 31, 0.65) 60%,
    rgba(4, 13, 31, 0.2) 100%
  );
}

.lc-body {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: clamp(1.25rem, 3vw, 2rem);
  color: white;
}
.lc-ar {
  display: block;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  direction: rtl;
  text-align: left;
  margin-bottom: 0.3rem;
}
.lc-name {
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  font-weight: 800;
  margin: 0 0 0.4rem;
  letter-spacing: -0.03em;
  line-height: 1;
}
.lc-years {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 1.5rem;
  letter-spacing: 0.03em;
}
.lc-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.2rem;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 0.82rem;
  text-decoration: none;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.35s;
}
.lc:hover .lc-cta {
  opacity: 1;
  transform: translateY(0);
}
.lc-cta:hover {
  background: rgba(255, 255, 255, 0.22);
}

/* ═══════════════════════════════════════
   4. FEATURES
   ═══════════════════════════════════════ */
.features {
  background: white;
  border-radius: clamp(12px, 2vw, 24px);
  padding: clamp(1.75rem, 5vw, 4rem) clamp(1.25rem, 4vw, 3.5rem);
  box-shadow: 0 2px 32px rgba(2, 85, 174, 0.05);
}
.dark-mode .features {
  background: #080f20;
}

.features-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: clamp(1.5rem, 4vw, 3rem);
  gap: 2rem;
}
@media (max-width: 768px) {
  .features-top {
    flex-direction: column;
  }
}

.feat-side-img {
  width: clamp(180px, 22vw, 280px);
  height: clamp(140px, 18vw, 200px);
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}
@media (max-width: 768px) {
  .feat-side-img {
    width: 100%;
    height: 160px;
  }
}

.feat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid rgba(2, 85, 174, 0.08);
  border-left: 1px solid rgba(2, 85, 174, 0.08);
}
@media (max-width: 900px) {
  .feat-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 480px) {
  .feat-grid {
    grid-template-columns: 1fr;
  }
}

.feat-card {
  padding: clamp(1.25rem, 2.5vw, 2rem);
  border-right: 1px solid rgba(2, 85, 174, 0.08);
  border-bottom: 1px solid rgba(2, 85, 174, 0.08);
  position: relative;
  transition: background 0.25s;
  cursor: default;
}
.feat-card:hover {
  background: rgba(2, 85, 174, 0.03);
}
.dark-mode .feat-card:hover {
  background: rgba(27, 168, 244, 0.04);
}

.feat-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}
.feat-icon {
  font-size: 2rem;
  line-height: 1;
}
.feat-num {
  font-family: 'Syne', sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--electric);
}
.feat-title {
  font-size: clamp(0.875rem, 1.5vw, 0.98rem);
  font-weight: 700;
  color: var(--navy);
  margin: 0 0 0.6rem;
  line-height: 1.3;
}
.dark-mode .feat-title {
  color: white;
}
.feat-desc {
  font-size: clamp(0.8rem, 1.3vw, 0.875rem);
  color: var(--gray);
  line-height: 1.7;
  margin: 0;
}

/* Animated underline */
.feat-ruler {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0;
  background: var(--electric);
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.feat-card:hover .feat-ruler {
  width: 100%;
}

/* ═══════════════════════════════════════
   5. ABOUT
   ═══════════════════════════════════════ */
.about {
  background: white;
  border-radius: clamp(12px, 2vw, 24px);
  padding: clamp(1.75rem, 5vw, 4rem) clamp(1.25rem, 4vw, 3.5rem);
  box-shadow: 0 2px 32px rgba(2, 85, 174, 0.05);
}
.about.dark {
  background: #080f20;
}

.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(2rem, 5vw, 4.5rem);
  align-items: center;
}
@media (max-width: 768px) {
  .about-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
}

.about-vis {
  position: relative;
  height: clamp(280px, 35vw, 460px);
}
/* On mobile the layered images collapse — simplify layout */
@media (max-width: 768px) {
  .about-vis {
    height: clamp(220px, 50vw, 300px);
  }
  .av-chip {
    padding: 0.65rem 1rem;
  }
  .av-chip-num {
    font-size: 1.6rem !important;
  }
}

.av-frame {
  position: absolute;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.14);
}
.av-frame1 {
  top: 0;
  left: 0;
  width: 72%;
  height: 70%;
  z-index: 1;
}
.av-frame2 {
  bottom: 0;
  right: 0;
  width: 60%;
  height: 58%;
  z-index: 2;
  border: 5px solid var(--cream);
}
.about.dark .av-frame2 {
  border-color: #080f20;
}
.av-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.av-chip {
  position: absolute;
  top: 42%;
  right: 14%;
  background: var(--navy);
  color: white;
  border-radius: 16px;
  padding: 1rem 1.5rem;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 16px 40px rgba(4, 13, 31, 0.35);
}
.av-chip-num {
  font-family: 'Syne', sans-serif;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  font-weight: 800;
  color: var(--electric);
  line-height: 1;
}
.av-chip-lbl {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.5;
}

.av-ring {
  position: absolute;
  top: -16px;
  left: -16px;
  width: calc(72% + 32px);
  height: calc(70% + 32px);
  border-radius: 28px;
  border: 2px dashed rgba(2, 85, 174, 0.18);
  animation: ringturn 22s linear infinite;
  z-index: 0;
}
@keyframes ringturn {
  to {
    transform: rotate(360deg);
  }
}

.about-h {
  font-size: clamp(1.6rem, 3.5vw, 2.8rem);
  font-weight: 800;
  color: var(--navy);
  line-height: 1.1;
  margin: 0 0 1.5rem;
  letter-spacing: -0.03em;
}
.about.dark .about-h {
  color: white;
}

.about-desc {
  color: var(--gray);
  line-height: 1.8;
  font-size: clamp(0.85rem, 1.4vw, 0.95rem);
  margin-bottom: 2rem;
}
.about.dark .about-desc {
  color: rgba(255, 255, 255, 0.55);
}

.about-list {
  list-style: none;
  padding: 0;
  margin: 0 0 2.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.about-list li {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: clamp(0.82rem, 1.3vw, 0.9rem);
  color: var(--navy);
  font-weight: 500;
}
.about.dark .about-list li {
  color: rgba(255, 255, 255, 0.65);
}
.ck {
  width: 22px;
  height: 22px;
  min-width: 22px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  flex-shrink: 0;
  font-weight: 700;
}

.map-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.8rem 1.6rem;
  background: var(--navy);
  color: white;
  border-radius: 12px;
  font-weight: 600;
  font-size: clamp(0.82rem, 1.3vw, 0.9rem);
  text-decoration: none;
  transition: all 0.3s;
}
.map-btn:hover {
  background: var(--blue);
  transform: translateY(-2px);
}

/* ═══════════════════════════════════════
   6. TESTIMONIALS
   ═══════════════════════════════════════ */
.testi-layout {
  display: grid;
  /* FIX: was grid-template-columns: 340px 1fr — fixed px caused overflow on small screens */
  grid-template-columns: clamp(220px, 30%, 340px) 1fr;
  gap: clamp(1.5rem, 4vw, 3.5rem);
  align-items: center;
}
@media (max-width: 900px) {
  .testi-layout {
    grid-template-columns: 1fr;
  }
}

.testi-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 2rem;
}
.testi-thumb {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.25s;
  text-align: left;
  width: 100%;
}
.testi-thumb:hover {
  background: rgba(2, 85, 174, 0.06);
}
.testi-thumb.active {
  background: rgba(2, 85, 174, 0.08);
}

.tt-avatar {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 50%;
  color: white;
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.25s;
}
.testi-thumb.active .tt-avatar {
  transform: scale(1.1);
}

.tt-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.tt-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--navy);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dark-mode .tt-name {
  color: white;
}
.tt-role {
  font-size: 0.78rem;
  color: var(--gray);
}

/* Featured card */
.testi-card {
  background: white;
  border-radius: 22px;
  padding: clamp(1.5rem, 4vw, 3rem) clamp(1.5rem, 4vw, 3rem) clamp(1.25rem, 3vw, 2.5rem);
  position: relative;
  box-shadow: 0 4px 48px rgba(2, 85, 174, 0.07);
  border: 1px solid rgba(2, 85, 174, 0.06);
  overflow: hidden;
}
.dark-mode .testi-card {
  background: #080f20;
  border-color: rgba(255, 255, 255, 0.06);
}

.testi-bigquote {
  font-family: 'Syne', sans-serif;
  font-size: clamp(5rem, 10vw, 10rem);
  font-weight: 800;
  color: var(--electric);
  opacity: 0.07;
  line-height: 0.5;
  position: absolute;
  top: 1.5rem;
  left: 2.5rem;
  user-select: none;
}

.testi-stars {
  color: var(--amber);
  font-size: 1.1rem;
  letter-spacing: 0.06em;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
}

.testi-text {
  font-size: clamp(0.95rem, 2vw, 1.2rem);
  line-height: 1.8;
  color: var(--navy);
  font-style: italic;
  margin: 0 0 2rem;
  position: relative;
  z-index: 1;
}
.dark-mode .testi-text {
  color: rgba(255, 255, 255, 0.82);
}

.testi-author {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 1;
}
.ta-avatar {
  width: 46px;
  height: 46px;
  min-width: 46px;
  border-radius: 50%;
  color: white;
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ta-name {
  display: block;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--navy);
}
.dark-mode .ta-name {
  color: white;
}
.ta-role {
  display: block;
  font-size: 0.8rem;
  color: var(--gray);
}

/* Transitions */
.tslide-enter-active,
.tslide-leave-active {
  transition: all 0.42s cubic-bezier(0.16, 1, 0.3, 1);
}
.tslide-enter-from {
  opacity: 0;
  transform: translateX(28px);
}
.tslide-leave-to {
  opacity: 0;
  transform: translateX(-28px);
}

/* ═══════════════════════════════════════
   7. CTA
   ═══════════════════════════════════════ */
.cta {
  position: relative;
  border-radius: clamp(12px, 2vw, 24px);
  overflow: hidden;
  min-height: clamp(300px, 40vw, 520px);
  display: flex;
  align-items: center;
}

.cta-photo-wrap {
  position: absolute;
  inset: 0;
}
.cta-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.45) saturate(1.2);
}
.cta-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(4, 13, 31, 0.92) 40%, rgba(2, 85, 174, 0.5) 100%);
}

.cta-content {
  position: relative;
  z-index: 2;
  padding: clamp(2rem, 6vw, 5rem);
  max-width: 680px;
  width: 100%;
}

.cta-title {
  font-size: clamp(1.8rem, 5vw, 5rem);
  font-weight: 800;
  color: white;
  line-height: 1;
  letter-spacing: -0.04em;
  margin: 0 0 1.5rem;
}
.cta-sub {
  color: rgba(255, 255, 255, 0.55);
  font-size: clamp(0.875rem, 1.5vw, 1.05rem);
  margin-bottom: 2.75rem;
  line-height: 1.7;
}

/* ═══════════════════════════════════════
   DARK MODE — global overrides
   ═══════════════════════════════════════ */
.dark-mode .sec-sub {
  color: rgba(255, 255, 255, 0.5);
}
</style>
