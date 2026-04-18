<script setup>
import { defineProps, ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

defineProps({
  darkMode: { type: Boolean, default: false },
})

// ── Animated counters ──────────────────────────────────────────
const counters = ref([
  { label: 'Élèves formés', target: 320, current: 0, suffix: '+' },
  { label: 'Cours disponibles', target: 48, current: 0, suffix: '' },
  { label: 'Enseignants', target: 12, current: 0, suffix: '' },
  { label: "Années d'expérience", target: 8, current: 0, suffix: '+' },
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
})

onUnmounted(() => io?.disconnect())

// ── Features ──────────────────────────────────────────────────
const features = [
  {
    icon: '🎯',
    num: '01',
    title: 'Pédagogie Moderne',
    desc: 'Méthodes actives, supports numériques et suivi individualisé pour chaque élève.',
  },
  {
    icon: '📅',
    num: '02',
    title: 'Emploi du Temps Flexible',
    desc: 'Des créneaux adaptés à votre agenda avec un calendrier en temps réel.',
  },
  {
    icon: '👨‍🏫',
    num: '03',
    title: 'Enseignants Qualifiés',
    desc: 'Une équipe de professeurs expérimentés, passionnés et dévoués à la réussite.',
  },
  {
    icon: '📊',
    num: '04',
    title: 'Suivi de Progression',
    desc: "Accédez aux résultats et à l'évolution de chaque élève à tout moment.",
  },
  {
    icon: '📚',
    num: '05',
    title: 'Ressources Pédagogiques',
    desc: 'Des cours, exercices et fiches de révision téléchargeables à la demande.',
  },
  {
    icon: '🏆',
    num: '06',
    title: 'Excellence Reconnue',
    desc: "D'excellents taux de réussite au BEM et au BAC depuis notre création.",
  },
]

// ── Levels ────────────────────────────────────────────────────
const levels = [
  {
    name: 'Primaire',
    arabic: 'ابتدائي',
    years: '1ère → 5ème année',
    img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=85',
    accent: '#10b981',
  },
  {
    name: 'Moyen',
    arabic: 'متوسط',
    years: '1ère → 4ème année',
    img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=85',
    accent: '#3b82f6',
  },
  {
    name: 'Secondaire',
    arabic: 'ثانوي',
    years: '1ère → 3ème année',
    img: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=85',
    accent: '#8b5cf6',
  },
]

// ── Testimonials ──────────────────────────────────────────────
const testimonials = ref([
  {
    name: 'Amira B.',
    role: 'Parent',
    text: 'Grâce à Belmahi School, ma fille a gagné confiance et méthode. Les résultats sont là !',
    rating: 5,
    color: '#0255ae',
  },
  {
    name: 'Yacine M.',
    role: 'Étudiant',
    text: "Les cours sont clairs, les profs disponibles. J'ai eu mon BEM avec mention !",
    rating: 5,
    color: '#10b981',
  },
  {
    name: 'Nadia K.',
    role: 'Parent',
    text: 'Interface moderne, suivi rigoureux. Enfin une école qui utilise la technologie !',
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
    <section class="hero reveal">
      <!-- Left -->
      <div class="hero-left">
        <div class="hero-eyebrow">
          <span class="live-dot"></span>
          Oran, Algérie &nbsp;·&nbsp; École Privée
        </div>

        <h1 class="hero-heading">
          <span class="h-top">PORTAIL DE</span>
          <span class="h-main">BELMAHI</span>
          <span class="h-arabic">مدرسة بلماحي</span>
        </h1>

        <p class="hero-body">
          Une plateforme moderne pour suivre, gérer et accéder à vos cours — du primaire jusqu'au
          baccalauréat.
        </p>

        <div class="hero-actions">
          <RouterLink to="/courses" class="btn-electric">
            Explorer les Cours
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
          <RouterLink to="/login" class="btn-ghost">Se Connecter</RouterLink>
        </div>

        <!-- Tiny strip stats -->
        <div class="hero-strip">
          <div class="strip-item" v-for="c in counters" :key="c.label">
            <span class="strip-val">{{ c.target }}{{ c.suffix }}</span>
            <span class="strip-lbl">{{ c.label }}</span>
          </div>
        </div>
      </div>

      <!-- Right — full bleed photo -->
      <div class="hero-right">
        <img
          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1000&q=88"
          alt="Salle de classe Belmahi"
          class="hero-photo"
        />
        <div class="hero-photo-veil"></div>

        <!-- Floating glass card -->
        <div class="hero-glass-card">
          <span class="glass-num">320+</span>
          <span class="glass-txt">Élèves formés avec succès</span>
        </div>

        <!-- Floating badge top -->
        <div class="hero-badge-pill"><span class="pill-dot"></span> Inscription ouverte</div>
      </div>

      <!-- Scroll hint -->
      <div class="hero-scroll-hint" aria-hidden="true">
        <div class="scroll-track"><div class="scroll-thumb"></div></div>
        <span>Défiler</span>
      </div>
    </section>

    <!-- ══════════════════════════════════
         2. BENTO STATS
         ══════════════════════════════════ -->
    <section class="bento reveal" ref="countersRef">
      <div class="bento-grid">
        <!-- Big card -->
        <div class="bc bc-navy bc-big">
          <div class="bc-ghost-txt">ÉLÈVES</div>
          <div class="bc-num">{{ counters[0].current }}{{ counters[0].suffix }}</div>
          <div class="bc-lbl">{{ counters[0].label }}</div>
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
            <div class="bc-lbl">{{ counters[1].label }}</div>
          </div>
          <div class="bc bc-electric bc-sm">
            <div class="bc-num">{{ counters[2].current }}{{ counters[2].suffix }}</div>
            <div class="bc-lbl">{{ counters[2].label }}</div>
          </div>
        </div>

        <!-- Wide amber card -->
        <div class="bc bc-amber bc-wide">
          <div class="bc-ghost-txt">ANS</div>
          <div class="bc-num">{{ counters[3].current }}{{ counters[3].suffix }}</div>
          <div class="bc-lbl">{{ counters[3].label }}</div>
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
    <section class="levels reveal">
      <div class="levels-top">
        <div>
          <span class="eyetag">Niveaux</span>
          <h2 class="sec-title">Tous les Cycles<br /><em>Scolaires</em></h2>
        </div>
        <p class="sec-sub">De la première année primaire jusqu'au Baccalauréat</p>
      </div>

      <div class="levels-grid">
        <div v-for="lv in levels" :key="lv.name" class="lc">
          <img :src="lv.img" :alt="lv.name" class="lc-img" />
          <div class="lc-veil" :style="{ '--a': lv.accent }"></div>
          <div class="lc-body">
            <span class="lc-ar">{{ lv.arabic }}</span>
            <h3 class="lc-name">{{ lv.name }}</h3>
            <p class="lc-years">{{ lv.years }}</p>
            <RouterLink to="/courses" class="lc-cta">
              Voir les cours
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
    <section class="features reveal">
      <div class="features-top">
        <div>
          <span class="eyetag">Pourquoi nous</span>
          <h2 class="sec-title">Ce qui nous<br /><em>différencie</em></h2>
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
    <section class="about reveal" :class="{ dark: darkMode }">
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
            <span class="av-chip-lbl">Années<br />d'expérience</span>
          </div>
          <div class="av-ring"></div>
        </div>

        <!-- Text -->
        <div class="about-txt">
          <span class="eyetag">À propos</span>
          <h2 class="about-h">Qui Sommes-<br />Nous ?</h2>
          <p class="about-desc">
            <strong>Belmahi School</strong> est une institution éducative privée à Oran, dédiée à
            l'excellence académique. Nous combinons innovation pédagogique et encadrement humain
            pour accompagner chaque élève vers la réussite.
          </p>
          <ul class="about-list">
            <li
              v-for="pt in [
                'Primaire, Moyen et Secondaire',
                'Professeurs diplômés et expérimentés',
                'Suivi numérique en temps réel',
                'Excellents résultats au BEM et BAC',
              ]"
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
            Nous trouver sur Google Maps
          </a>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════
         6. TESTIMONIALS — featured quote
         ══════════════════════════════════ -->
    <section class="testi reveal">
      <div class="testi-layout">
        <!-- Sidebar -->
        <div class="testi-side">
          <span class="eyetag">Témoignages</span>
          <h2 class="sec-title">Ce que disent<br /><em>nos familles</em></h2>
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
    <section class="cta reveal">
      <div class="cta-photo-wrap">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=85"
          alt=""
          class="cta-photo"
        />
        <div class="cta-overlay"></div>
      </div>
      <div class="cta-content">
        <span class="eyetag eyetag-light">Rejoindre</span>
        <h2 class="cta-title">Prêt à rejoindre<br />notre école ?</h2>
        <p class="cta-sub">Créez votre compte et accédez à tous vos cours dès aujourd'hui.</p>
        <RouterLink to="/login" class="btn-electric btn-large">
          Commencer maintenant
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
.home {
  --navy: #040d1f;
  --blue: #0255ae;
  --electric: #1ba8f4;
  --amber: #f59e0b;
  --cream: #f4f3ef;
  --gray: #64748b;
  --white: #ffffff;

  font-family: 'DM Sans', sans-serif;
  background: var(--cream);
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  font-size: clamp(2rem, 4vw, 3.2rem);
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
  font-size: 1rem;
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
  font-size: 0.95rem;
  text-decoration: none;
  font-family: 'Syne', sans-serif;
  transition: all 0.3s;
  box-shadow: 0 6px 24px rgba(27, 168, 244, 0.35);
}
.btn-electric:hover {
  background: #0c9fe0;
  transform: translateY(-2px);
  box-shadow: 0 10px 32px rgba(27, 168, 244, 0.45);
}
.btn-electric svg {
  transition: transform 0.3s;
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
  font-size: 0.95rem;
  text-decoration: none;
  transition: all 0.3s;
}
.btn-ghost:hover {
  border-color: rgba(255, 255, 255, 0.6);
  color: white;
}

/* ═══════════════════════════════════════
   1. HERO
   ═══════════════════════════════════════ */
.hero {
  display: grid;
  grid-template-columns: 55% 45%;
  min-height: 94vh;
  background: var(--navy);
  border-radius: 24px;
  overflow: hidden;
  position: relative;
}
@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
    min-height: auto;
  }
  .hero-right {
    height: 340px;
  }
}

.hero-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 5rem 4.5rem;
  position: relative;
  z-index: 2;
}
@media (max-width: 600px) {
  .hero-left {
    padding: 3.5rem 2rem;
  }
}

.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  margin-bottom: 3rem;
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
  margin: 0 0 2.25rem;
}
.h-top {
  font-family: 'Syne', sans-serif;
  font-size: clamp(0.85rem, 1.5vw, 1.1rem);
  font-weight: 500;
  color: var(--electric);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}
.h-main {
  font-family: 'Syne', sans-serif;
  font-size: clamp(4.5rem, 9vw, 8rem);
  font-weight: 800;
  color: white;
  line-height: 0.88;
  letter-spacing: -0.05em;
  margin-bottom: 0.5rem;
}
.h-arabic {
  font-size: clamp(1.3rem, 2.5vw, 2rem);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.3);
  direction: rtl;
  text-align: left;
  letter-spacing: 0.02em;
}

.hero-body {
  color: rgba(255, 255, 255, 0.55);
  font-size: 1rem;
  line-height: 1.8;
  max-width: 420px;
  margin-bottom: 2.5rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 3.5rem;
}

/* Mini stats strip */
.hero-strip {
  display: flex;
  gap: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 1.5rem;
  flex-wrap: wrap;
}
.strip-item {
  padding-right: 2rem;
  margin-right: 2rem;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}
.strip-item:last-child {
  border-right: none;
}
.strip-val {
  display: block;
  font-family: 'Syne', sans-serif;
  font-size: 1.5rem;
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
  bottom: 3rem;
  right: 2rem;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  padding: 1.25rem 1.75rem;
  color: white;
}
.glass-num {
  display: block;
  font-family: 'Syne', sans-serif;
  font-size: 2.8rem;
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
  top: 2rem;
  right: 2rem;
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

/* Scroll hint */
.hero-scroll-hint {
  position: absolute;
  bottom: 2.5rem;
  left: 4.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.25);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.scroll-track {
  width: 48px;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1px;
  overflow: hidden;
}
.scroll-thumb {
  height: 100%;
  background: var(--electric);
  border-radius: 1px;
  animation: scrollanim 2.2s ease-in-out infinite;
}
@keyframes scrollanim {
  0% {
    width: 0%;
    margin-left: 0%;
  }
  50% {
    width: 60%;
    margin-left: 20%;
  }
  100% {
    width: 0%;
    margin-left: 100%;
  }
}

/* ═══════════════════════════════════════
   2. BENTO STATS
   ═══════════════════════════════════════ */
.bento-grid {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.8fr;
  grid-template-rows: auto;
  gap: 1rem;
  align-items: stretch;
}
@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: 1fr 1fr;
  }
  .bc-stack {
    flex-direction: row;
  }
}

/* Base card */
.bc {
  border-radius: 20px;
  padding: 2.25rem;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 180px;
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
  gap: 1rem;
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
  font-size: 5.5rem;
  font-weight: 800;
  opacity: 0.05;
  line-height: 1;
  user-select: none;
  white-space: nowrap;
  color: white;
}

.bc-num {
  font-family: 'Syne', sans-serif;
  font-size: 3.8rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 0.35rem;
  position: relative;
  z-index: 1;
}
.bc-lbl {
  font-size: 0.8rem;
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
.levels {
}
.levels-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
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
  gap: 1rem;
}
@media (max-width: 768px) {
  .levels-grid {
    grid-template-columns: 1fr;
  }
}

/* Level card */
.lc {
  position: relative;
  height: 400px;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
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
  padding: 2rem;
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
  font-size: 2.4rem;
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
  border-radius: 24px;
  padding: 4rem 3.5rem;
  box-shadow: 0 2px 32px rgba(2, 85, 174, 0.05);
}
.dark-mode .features {
  background: #080f20;
}
@media (max-width: 600px) {
  .features {
    padding: 2.5rem 1.5rem;
  }
}

.features-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 3rem;
  gap: 2rem;
}
@media (max-width: 768px) {
  .features-top {
    flex-direction: column;
  }
}

.feat-side-img {
  width: 280px;
  height: 200px;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}
@media (max-width: 768px) {
  .feat-side-img {
    width: 100%;
    height: 180px;
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
@media (max-width: 580px) {
  .feat-grid {
    grid-template-columns: 1fr;
  }
}

.feat-card {
  padding: 2rem;
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
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--navy);
  margin: 0 0 0.6rem;
  line-height: 1.3;
}
.dark-mode .feat-title {
  color: white;
}
.feat-desc {
  font-size: 0.875rem;
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
  border-radius: 24px;
  padding: 4rem 3.5rem;
  box-shadow: 0 2px 32px rgba(2, 85, 174, 0.05);
}
.about.dark {
  background: #080f20;
}
@media (max-width: 600px) {
  .about {
    padding: 2.5rem 1.5rem;
  }
}

.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4.5rem;
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
  height: 460px;
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
  font-size: 2.2rem;
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
  font-size: clamp(2rem, 3.5vw, 2.8rem);
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
  font-size: 0.95rem;
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
  font-size: 0.9rem;
  color: var(--navy);
  font-weight: 500;
}
.about.dark .about-list li {
  color: rgba(255, 255, 255, 0.65);
}
.ck {
  width: 22px;
  height: 22px;
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
  font-size: 0.9rem;
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
.testi {
}
.testi-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 3.5rem;
  align-items: center;
}
@media (max-width: 900px) {
  .testi-layout {
    grid-template-columns: 1fr;
  }
}

.testi-side {
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
}
.tt-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--navy);
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
  padding: 3rem 3rem 2.5rem;
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
  font-size: 10rem;
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
  font-size: 1.2rem;
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
  border-radius: 24px;
  overflow: hidden;
  min-height: 520px;
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
  padding: 5rem 5rem;
  max-width: 680px;
}
@media (max-width: 600px) {
  .cta-content {
    padding: 3.5rem 2rem;
  }
}

.cta-title {
  font-size: clamp(2.8rem, 6vw, 5rem);
  font-weight: 800;
  color: white;
  line-height: 1;
  letter-spacing: -0.04em;
  margin: 0 0 1.5rem;
}
.cta-sub {
  color: rgba(255, 255, 255, 0.55);
  font-size: 1.05rem;
  margin-bottom: 2.75rem;
  line-height: 1.7;
}
</style>
