<template>
  <div class="ml-root">
    <!-- ── Navbar ── -->
    <nav class="ml-nav" :class="{ 'is-scrolled': scrolled }">
      <div class="ml-nav-brand">
        <img src="/logoMUDAR.png" alt="MUDAR" class="ml-logo-img" />
        <span class="ml-brand-name">MUDAR</span>
      </div>

      <div class="ml-nav-links">
        <a href="#product" class="ml-nav-link">المنصة</a>
        <a href="#features" class="ml-nav-link">المميزات</a>
        <a href="#how-it-works" class="ml-nav-link">كيف تعمل</a>
        <a href="#faq" class="ml-nav-link">الأسئلة الشائعة</a>
      </div>

      <div class="ml-nav-cta">
        <router-link to="/register-school" class="ml-btn-outline">تسجيل مدرستك</router-link>
        <router-link to="/mudar/login" class="ml-btn-primary">تسجيل الدخول</router-link>
      </div>

      <button
        class="ml-burger"
        :class="{ open: mobileOpen }"
        @click="mobileOpen = !mobileOpen"
        aria-label="فتح القائمة"
      >
        <span></span><span></span><span></span>
      </button>
    </nav>

    <transition name="ml-slide-down">
      <div v-if="mobileOpen" class="ml-mobile-panel">
        <a href="#product" @click="mobileOpen = false">المنصة</a>
        <a href="#features" @click="mobileOpen = false">المميزات</a>
        <a href="#how-it-works" @click="mobileOpen = false">كيف تعمل</a>
        <a href="#faq" @click="mobileOpen = false">الأسئلة الشائعة</a>
        <div class="ml-mobile-cta">
          <router-link to="/register-school" class="ml-btn-outline" @click="mobileOpen = false">
            تسجيل مدرستك
          </router-link>
          <router-link to="/mudar/login" class="ml-btn-primary" @click="mobileOpen = false">
            تسجيل الدخول
          </router-link>
        </div>
      </div>
    </transition>

    <!-- ── Hero ── -->
    <section class="ml-hero">
      <div class="ml-blob ml-blob-1"></div>
      <div class="ml-blob ml-blob-2"></div>
      <div class="ml-blob ml-blob-3"></div>
      <div class="ml-blob ml-blob-4"></div>
      <div class="ml-noise"></div>
      <div class="ml-overlay"></div>

      <div class="ml-hero-grid">
        <div class="ml-hero-content">
          <div class="ml-badge">
            <span class="ml-badge-pill">مباشر</span>
            <span class="ml-badge-text">جرّب تبديل الهوية البصرية أسفله — بدون تسجيل دخول</span>
          </div>

          <h1 class="ml-headline">
            منصّة مدرستك،<br />
            بهويتك <em>أنت</em>
          </h1>

          <p class="ml-subtitle">
            MUDAR تبني لمدرستك نظامًا إداريًا متكاملاً خلال دقائق — بشعارك، بألوانك، وبرابطك الخاص.
            أنت تدير مدرستك، ونحن نتكفّل بالتقنية.
          </p>

          <div class="ml-hero-btns">
            <router-link to="/register-school" class="ml-btn-hero-primary">
              ابدأ مجاناً ←
            </router-link>
            <a href="#product" class="ml-btn-hero-ghost"> ▶ شاهد المنصة من الداخل </a>
          </div>

          <div class="ml-proof">
            <div class="ml-avatars">
              <span
                v-for="t in tenants"
                :key="'proof-' + t.id"
                class="ml-avatar"
                :style="{ background: `linear-gradient(135deg, ${t.c1}, ${t.c2})` }"
                >{{ t.initial }}</span
              >
            </div>
            <span class="ml-proof-text"
              >مدارس مختلفة تمامًا، <strong>نفس المحرك</strong>، هوية مختلفة كليًا</span
            >
          </div>
        </div>

        <!-- ── Signature interactive element: live white-label switcher ── -->
        <div class="ml-switcher">
          <div class="ml-switcher-label">بدّل هوية مدرسة تجريبية</div>

          <div class="ml-switcher-pills">
            <button
              v-for="(t, i) in tenants"
              :key="t.id"
              class="ml-pill"
              :class="{ active: i === activeTenant }"
              :style="{ '--pill-c1': t.c1, '--pill-c2': t.c2 }"
              @click="selectTenant(i)"
              :aria-pressed="i === activeTenant"
            >
              {{ t.initial }}
            </button>
          </div>

          <div
            class="ml-mockup"
            :style="{
              '--mock-c1': currentTenant.c1,
              '--mock-c2': currentTenant.c2,
              '--mock-accent': currentTenant.accent,
            }"
          >
            <div class="ml-mockup-bar">
              <div class="ml-dots"><span></span><span></span><span></span></div>
              <div class="ml-mockup-url">mudar.dz/{{ currentTenant.slug }}</div>
            </div>
            <div class="ml-mockup-body">
              <div class="ml-mockup-navbar">
                <span class="ml-mockup-logo">{{ currentTenant.initial }}</span>
                <transition name="ml-fade" mode="out-in">
                  <span class="ml-mockup-name" :key="currentTenant.id">{{
                    currentTenant.name
                  }}</span>
                </transition>
              </div>
              <div class="ml-mockup-cards">
                <div v-for="n in 3" :key="n" class="ml-mockup-card">
                  <div class="ml-mockup-card-title"></div>
                  <div class="ml-mockup-card-line"></div>
                  <div class="ml-mockup-card-line short"></div>
                </div>
              </div>
            </div>
          </div>

          <p class="ml-switcher-caption">
            نفس اللوحة، نفس الميزات — لكن عند زوّار كل مدرسة، هي منصتهم فقط.
          </p>
        </div>
      </div>
    </section>

    <!-- ── Stats bar ── -->
    <div id="about" class="ml-stats reveal">
      <div v-for="(stat, i) in stats" :key="i" class="ml-stat">
        <div class="ml-stat-num">{{ displayed[i] }}{{ stat.suffix }}</div>
        <div class="ml-stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <!-- ── How it works ── -->
    <section id="how-it-works" class="ml-steps">
      <div class="ml-section-eyebrow reveal">مسار الإطلاق</div>
      <h2 class="ml-section-title reveal">من التسجيل إلى منصة كاملة، في ثلاث خطوات</h2>

      <div class="ml-steps-track">
        <div
          v-for="(s, i) in steps"
          :key="i"
          class="ml-step reveal"
          :style="{ '--d': i * 0.08 + 's' }"
        >
          <div class="ml-step-num">{{ String(i + 1).padStart(2, '0') }}</div>
          <div class="ml-step-body">
            <h3>{{ s.title }}</h3>
            <p>{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Features ── -->
    <section id="features" class="ml-features">
      <div class="ml-section-eyebrow reveal">ما نقدمه لك</div>
      <h2 class="ml-section-title reveal">كل ما تحتاجه مدرستك</h2>
      <div class="ml-features-grid">
        <div
          v-for="f in features"
          :key="f.title"
          class="ml-feature-card reveal"
          @mousemove="tiltMove"
          @mouseleave="tiltLeave"
        >
          <div class="ml-feature-icon" v-html="f.icon"></div>
          <div class="ml-feature-title">{{ f.title }}</div>
          <div class="ml-feature-desc">{{ f.desc }}</div>
        </div>
      </div>
    </section>

    <!-- ── Product showcase (tabbed) ── -->
    <section id="product" class="ml-product">
      <div class="ml-section-eyebrow reveal">جولة سريعة</div>
      <h2 class="ml-section-title reveal">شاهد المنصة من الداخل</h2>

      <div class="ml-product-wrap reveal">
        <div class="ml-product-tabs" role="tablist">
          <button
            v-for="(tab, i) in productTabs"
            :key="tab.id"
            class="ml-product-tab"
            :class="{ active: i === activeTab }"
            role="tab"
            :aria-selected="i === activeTab"
            @click="activeTab = i"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="ml-product-panel">
          <div class="ml-mockup-bar dark">
            <div class="ml-dots"><span></span><span></span><span></span></div>
            <div class="ml-mockup-url">app.mudar.dz/{{ productTabs[activeTab].path }}</div>
          </div>

          <transition name="ml-fade" mode="out-in">
            <!-- Dashboard -->
            <div v-if="activeTab === 0" key="dash" class="ml-prod-view ml-prod-dash">
              <div class="ml-prod-kpis">
                <div v-for="k in 3" :key="k" class="ml-prod-kpi">
                  <div class="ml-kpi-bar" :style="{ height: 30 + k * 18 + 'px' }"></div>
                </div>
              </div>
              <div class="ml-prod-chart">
                <div
                  v-for="b in 9"
                  :key="b"
                  class="ml-chart-col"
                  :style="{ height: chartHeights[b - 1] + '%' }"
                ></div>
              </div>
            </div>

            <!-- Students / Teachers -->
            <div v-else-if="activeTab === 1" key="ppl" class="ml-prod-view ml-prod-people">
              <div v-for="r in 4" :key="r" class="ml-prod-row">
                <span class="ml-prod-avatar"></span>
                <span class="ml-prod-line long"></span>
                <span class="ml-prod-line short"></span>
              </div>
            </div>

            <!-- Schedule -->
            <div v-else-if="activeTab === 2" key="sched" class="ml-prod-view ml-prod-schedule">
              <div
                v-for="c in 30"
                :key="c"
                class="ml-sched-cell"
                :class="{ filled: scheduleFilled.includes(c) }"
              ></div>
            </div>

            <!-- Payments -->
            <div v-else key="pay" class="ml-prod-view ml-prod-payments">
              <div v-for="p in 4" :key="p" class="ml-prod-row">
                <span class="ml-prod-line long"></span>
                <span class="ml-pay-pill" :class="p % 3 === 0 ? 'pending' : 'paid'">{{
                  p % 3 === 0 ? 'قيد الانتظار' : 'مدفوع'
                }}</span>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </section>

    <!-- ── Testimonials ── -->
    <section class="ml-testimonials">
      <div class="ml-section-eyebrow reveal">آراء تجريبية</div>
      <h2 class="ml-section-title reveal">لعرض توضيحي فقط — استبدليها بآراء مدارسك</h2>

      <div class="ml-testi-grid">
        <div
          v-for="(t, i) in testimonials"
          :key="i"
          class="ml-testi-card reveal"
          :style="{ '--d': i * 0.08 + 's' }"
        >
          <p class="ml-testi-quote">"{{ t.quote }}"</p>
          <div class="ml-testi-person">
            <span class="ml-avatar" :style="{ background: t.color }">{{ t.initial }}</span>
            <div>
              <div class="ml-testi-name">{{ t.name }}</div>
              <div class="ml-testi-role">{{ t.role }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FAQ ── -->
    <section id="faq" class="ml-faq">
      <div class="ml-section-eyebrow reveal">أسئلة متكررة</div>
      <h2 class="ml-section-title reveal">قبل أن تبدأ</h2>

      <div class="ml-faq-list reveal">
        <div v-for="(f, i) in faqs" :key="i" class="ml-faq-item" :class="{ open: openFaq === i }">
          <button
            class="ml-faq-q"
            @click="openFaq = openFaq === i ? -1 : i"
            :aria-expanded="openFaq === i"
          >
            <span>{{ f.q }}</span>
            <span class="ml-faq-icon">+</span>
          </button>
          <div class="ml-faq-a-wrap">
            <p class="ml-faq-a">{{ f.a }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA ── -->
    <div class="ml-cta-wrap">
      <div class="ml-cta reveal">
        <div class="ml-cta-text">
          <h3>جاهز لإطلاق منصتك؟</h3>
          <p>أكمل النموذج في 3 دقائق. منصتك تُنشأ فوراً.</p>
        </div>
        <router-link to="/register-school" class="ml-cta-btn"> سجّل مدرستك ← </router-link>
      </div>
    </div>

    <!-- ── Footer ── -->
    <footer class="ml-footer">
      <div class="ml-footer-brand">
        <img src="/logoMUDAR.png" alt="MUDAR" class="ml-footer-logo" />
        <span>MUDAR</span>
      </div>
      <div class="ml-footer-copy">© 2026 MUDAR — منصة إدارة المدارس — جميع الحقوق محفوظة</div>
      <router-link to="/mudar/login" class="ml-footer-admin">دخول الإدارة</router-link>
      <p style="color: white">
        Développé par
        <a
          href="https://www.linkedin.com/in/abrar-nour-lacida-96574239b"
          target="_blank"
          class="text-pink-400 hover:text-pink-300 underline underline-offset-2 transition-colors font-medium"
        >
          Abrar Nour LACIDA
        </a>
        · Géré par
        <a
          href="https://www.linkedin.com/in/hamza-zineb-052071390"
          target="_blank"
          class="text-pink-400 hover:text-pink-300 underline underline-offset-2 transition-colors font-medium"
        >
          Zineb HAMZA
        </a>
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'

/* ── Navbar state ── */
const scrolled = ref(false)
const mobileOpen = ref(false)
function onScroll() {
  scrolled.value = window.scrollY > 20
}

/* ── Stats (count-up) ── */
const stats = [
  { num: 3, suffix: ' دقائق', label: 'لإنشاء منصتك' },
  { num: 100, suffix: '%', label: 'بيانات مؤمّنة' },
  { num: 12, suffix: '+', label: 'مدرسة نشطة' },
  { num: 69, suffix: '', label: 'ولاية مغطّاة' },
]
const displayed = ref(stats.map(() => 0))
function animateStats() {
  stats.forEach((stat, i) => {
    const steps = 60
    const duration = 1800
    const increment = stat.num / steps
    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= stat.num) {
        displayed.value[i] = stat.num
        clearInterval(interval)
      } else {
        displayed.value[i] = Math.floor(current)
      }
    }, duration / steps)
  })
}

/* ── Signature element: live tenant / identity switcher ── */
const tenants = [
  {
    id: 1,
    name: 'مدرسة النخبة',
    slug: 'elite',
    initial: 'ن',
    c1: '#0ea5e9',
    c2: '#0369a1',
    accent: '#38bdf8',
  },
  {
    id: 2,
    name: 'أكاديمية التميز',
    slug: 'tamayoz',
    initial: 'ت',
    c1: '#16a34a',
    c2: '#166534',
    accent: '#4ade80',
  },
  {
    id: 3,
    name: 'مدرسة ابن خلدون',
    slug: 'ibn-khaldoun',
    initial: 'خ',
    c1: '#7c3aed',
    c2: '#5b21b6',
    accent: '#c084fc',
  },
  {
    id: 4,
    name: 'مدرسة الأمل',
    slug: 'amal',
    initial: 'أ',
    c1: '#ea580c',
    c2: '#9a3412',
    accent: '#fb923c',
  },
]
const activeTenant = ref(2)
const currentTenant = computed(() => tenants[activeTenant.value])
let cycleInterval = null
let resumeTimeout = null
function startCycle() {
  cycleInterval = setInterval(() => {
    activeTenant.value = (activeTenant.value + 1) % tenants.length
  }, 3200)
}
function stopCycle() {
  if (cycleInterval) clearInterval(cycleInterval)
}
function selectTenant(i) {
  activeTenant.value = i
  stopCycle()
  if (resumeTimeout) clearTimeout(resumeTimeout)
  resumeTimeout = setTimeout(startCycle, 6000)
}

/* ── How it works ── */
const steps = [
  {
    title: 'سجّلي بيانات مدرستك',
    desc: 'نموذج بسيط لا يتجاوز 3 دقائق — اسم المدرسة، شعارك، وألوانك المفضّلة.',
  },
  {
    title: 'نراجع الطلب ونفعّل الحساب',
    desc: 'فريقنا يتحقق من البيانات ويجهّز بيئتك المستقلة خلال 24 ساعة كحد أقصى.',
  },
  {
    title: 'منصتك تنطلق فوراً',
    desc: 'رابطك الخاص، هويتك البصرية، وكل الأدوات جاهزة للاستعمال من اليوم الأول.',
  },
]

/* ── Features ── */
const features = [
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M4.098 19.902a3.75 3.75 0 0 1 0-5.304l6.402-6.401m-6.402 11.705c-1.218-1.218-1.218-3.19 0-4.408l6.402-6.401m0 0 5.304 5.304m-5.304-5.304 1.44-1.44a2.25 2.25 0 0 1 3.182 0l2.122 2.122a2.25 2.25 0 0 1 0 3.182l-1.44 1.44m-5.304-5.304 5.304 5.304" />
    </svg>`,
    title: 'هوية بصرية خاصة',
    desc: 'شعارك وألوانك على كل صفحة — لا أثر لـ MUDAR عند عميلك.',
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>`,
    title: 'قاعدة بيانات مستقلة',
    desc: 'كل مدرسة في بيئة معزولة تماماً عن الأخريات.',
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>`,
    title: 'إدارة الطلاب والمعلمين',
    desc: 'ملفات شاملة، حضور، نتائج، ومدفوعات.',
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>`,
    title: 'جدول الحصص',
    desc: 'توزيع تلقائي للحصص مع تقويم تفاعلي.',
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>`,
    title: 'رابط مخصص',
    desc: 'mudar.dz/اسم-مدرستك جاهز فور الموافقة.',
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>`,
    title: 'متوافق مع الجوال',
    desc: 'تجربة مثالية على كل الأجهزة.',
  },
]

/* ── Tilt effect on feature cards ── */
function tiltMove(e) {
  const card = e.currentTarget
  const rect = card.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  card.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`)
  card.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`)
}
function tiltLeave(e) {
  const card = e.currentTarget
  card.style.setProperty('--rx', '0deg')
  card.style.setProperty('--ry', '0deg')
}

/* ── Product showcase tabs ── */
const productTabs = [
  { id: 'dash', label: 'لوحة التحكم', path: 'dashboard' },
  { id: 'ppl', label: 'الطلاب والمعلمين', path: 'people' },
  { id: 'sched', label: 'الجدول والحصص', path: 'schedule' },
  { id: 'pay', label: 'المدفوعات', path: 'payments' },
]
const activeTab = ref(0)
const chartHeights = [40, 65, 50, 80, 55, 90, 60, 75, 45]
const scheduleFilled = [2, 5, 9, 11, 14, 18, 21, 23, 27]

/* ── Testimonials (placeholder — replace with real quotes) ── */
const testimonials = [
  {
    quote: 'خلال أسبوع كانت المنصة جاهزة بهويتنا الكاملة، وأولياء الأمور لاحظوا الفرق فوراً.',
    name: 'مدير مدرسة ابتدائية',
    role: 'وهران',
    initial: 'و',
    color: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  },
  {
    quote: 'توقفنا عن استعمال الدفاتر والجداول نهائياً، كل شيء أصبح في مكان واحد.',
    name: 'مديرة مركز دعم مدرسي',
    role: 'الجزائر العاصمة',
    initial: 'ج',
    color: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
  },
  {
    quote: 'الدعم سريع، والفريق يفهم احتياجات المدارس الجزائرية تحديداً.',
    name: 'مدير أكاديمية لغات',
    role: 'قسنطينة',
    initial: 'ق',
    color: 'linear-gradient(135deg, #16a34a, #166534)',
  },
]

/* ── FAQ ── */
const openFaq = ref(0)
const faqs = [
  { q: 'هل أحتاج معرفة برمجية لإدارة منصتي؟', a: 'لا، كل شيء بواجهة بسيطة وبدون كتابة أي كود.' },
  {
    q: 'هل بياناتنا معزولة عن المدارس الأخرى؟',
    a: 'نعم، كل مدرسة لها قاعدة بيانات مستقلة تماماً عن باقي المدارس.',
  },
  { q: 'كم يستغرق تفعيل المنصة؟', a: 'عادةً خلال 24 ساعة كحد أقصى بعد مراجعة طلبك.' },
  {
    q: 'هل يمكن استعمال رابط خاص بنا لاحقاً؟',
    a: 'نعم، رابط mudar.dz/اسمك جاهز فوراً، ويمكن ربط نطاق مخصص لاحقاً.',
  },
  { q: 'هل التطبيق متوافق مع الهاتف؟', a: 'نعم بالكامل، التصميم متجاوب على كل الأجهزة.' },
]

/* ── Scroll reveal ── */
let observer = null
function setupReveal() {
  const els = document.querySelectorAll('.reveal')
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.15 },
  )
  els.forEach((el) => observer.observe(el))
}

onMounted(() => {
  animateStats()
  startCycle()
  window.addEventListener('scroll', onScroll, { passive: true })
  setupReveal()
})
onBeforeUnmount(() => {
  stopCycle()
  if (resumeTimeout) clearTimeout(resumeTimeout)
  window.removeEventListener('scroll', onScroll)
  if (observer) observer.disconnect()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.ml-root {
  --ink: #1e0a3c;
  --ink-soft: #7c6b99;
  --paper: #f9f7ff;
  --violet-900: #2e0652;
  --violet-700: #5b21b6;
  --violet-600: #7c3aed;
  --violet-400: #a855f7;
  --orchid: #e879f9;
  --line: #ede9fe;
  --gold: #f5b942;

  font-family: 'IBM Plex Sans Arabic', 'Plus Jakarta Sans', sans-serif;
  direction: rtl;
  background: var(--paper);
  color: var(--ink);
  min-height: 100vh;
  overflow-x: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .ml-root * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ── Navbar ── */
.ml-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(249, 247, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid transparent;
  padding: 0.95rem 2.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  transition:
    box-shadow 0.25s,
    border-color 0.25s,
    padding 0.25s;
}
.ml-nav.is-scrolled {
  border-bottom-color: var(--line);
  box-shadow: 0 8px 24px rgba(91, 33, 182, 0.08);
  padding: 0.65rem 2.5rem;
}

.ml-nav-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
}
.ml-logo-img {
  width: 130px;
  height: auto;
  object-fit: contain;
  border-radius: 0;
  margin-top: -10px;
  mix-blend-mode: multiply;
}
.ml-brand-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: #3b0764;
  letter-spacing: -0.3px;
}

.ml-nav-links {
  display: flex;
  gap: 1.5rem;
}
.ml-nav-link {
  font-size: 0.88rem;
  color: var(--ink-soft);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}
.ml-nav-link:hover,
.ml-nav-link:focus-visible {
  color: var(--violet-600);
}

.ml-nav-cta {
  display: flex;
  gap: 0.7rem;
  align-items: center;
}

.ml-burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 34px;
  height: 34px;
  background: none;
  border: none;
  cursor: pointer;
}
.ml-burger span {
  height: 2px;
  background: var(--ink);
  border-radius: 2px;
  transition:
    transform 0.25s,
    opacity 0.25s;
}
.ml-burger.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.ml-burger.open span:nth-child(2) {
  opacity: 0;
}
.ml-burger.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.ml-mobile-panel {
  display: none;
  flex-direction: column;
  gap: 0.9rem;
  background: #fff;
  border-bottom: 1px solid var(--line);
  padding: 1.2rem 2rem 1.6rem;
}
.ml-mobile-panel a {
  color: var(--ink);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
}
.ml-mobile-cta {
  display: flex;
  gap: 0.7rem;
  margin-top: 0.6rem;
}
.ml-slide-down-enter-active,
.ml-slide-down-leave-active {
  transition: all 0.25s ease;
}
.ml-slide-down-enter-from,
.ml-slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.ml-btn-outline,
.ml-btn-primary {
  *:focus-visible {
    outline: 2px solid var(--violet-600);
  }
}
.ml-btn-outline:focus-visible,
.ml-btn-primary:focus-visible,
.ml-nav-link:focus-visible {
  outline: 2px solid var(--violet-600);
  outline-offset: 2px;
}

.ml-btn-outline {
  padding: 0.5rem 1rem;
  border: 1.5px solid var(--violet-600);
  border-radius: 8px;
  font-size: 0.83rem;
  font-weight: 600;
  color: var(--violet-600);
  text-decoration: none;
  transition: background 0.2s;
}
.ml-btn-outline:hover {
  background: #f3e8ff;
}

.ml-btn-primary {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, var(--violet-600), var(--violet-400));
  border-radius: 8px;
  font-size: 0.83rem;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
  transition: opacity 0.2s;
}
.ml-btn-primary:hover {
  opacity: 0.88;
}

/* ── Hero ── */
.ml-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4.5rem 2.5rem 5rem;
  overflow: hidden;
  background: #f0eeff;
}

.ml-hero-grid {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1180px;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 3rem;
  align-items: center;
}

.ml-blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.ml-blob-1 {
  width: 800px;
  height: 600px;
  bottom: -200px;
  right: -200px;
  background: radial-gradient(
    circle at 40% 60%,
    var(--violet-700) 0%,
    var(--violet-600) 35%,
    #a78bfa 65%,
    transparent 85%
  );
  filter: blur(3px);
  opacity: 0.75;
  animation: blobFloat1 9s ease-in-out infinite;
}
.ml-blob-2 {
  width: 600px;
  height: 500px;
  top: 30px;
  right: -60px;
  background: radial-gradient(
    circle,
    var(--violet-600) 0%,
    var(--violet-400) 45%,
    #c4b5fd 70%,
    transparent 90%
  );
  filter: blur(4px);
  opacity: 0.6;
  animation: blobFloat2 11s ease-in-out infinite;
}
.ml-blob-3 {
  width: 650px;
  height: 500px;
  top: -80px;
  left: -100px;
  background: radial-gradient(circle, #c4b5fd 0%, #ddd6fe 50%, #ede9fe 75%, transparent 90%);
  filter: blur(5px);
  opacity: 0.7;
  animation: blobFloat1 13s ease-in-out infinite reverse;
}
.ml-blob-4 {
  width: 380px;
  height: 300px;
  top: 120px;
  left: 100px;
  background: radial-gradient(circle, var(--orchid) 0%, #c084fc 45%, transparent 80%);
  filter: blur(4px);
  opacity: 0.4;
  animation: blobFloat2 8s ease-in-out infinite;
}
.ml-noise {
  position: absolute;
  inset: 0;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  pointer-events: none;
}
.ml-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(240, 238, 255, 0.5) 0%,
    rgba(240, 238, 255, 0.1) 60%,
    transparent 100%
  );
}

.ml-hero-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: start;
  gap: 1.5rem;
}

.ml-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #e9d5ff;
  border-radius: 99px;
  padding: 5px 14px 5px 6px;
}
.ml-badge-pill {
  background: linear-gradient(135deg, var(--violet-600), var(--violet-400));
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 3px 9px;
  border-radius: 99px;
}
.ml-badge-text {
  font-size: 12px;
  color: var(--ink-soft);
  font-weight: 500;
}

.ml-headline {
  font-family: 'Fraunces', serif;
  font-size: 54px;
  font-weight: 300;
  line-height: 1.08;
  letter-spacing: -1.6px;
  color: var(--ink);
}
.ml-headline em {
  font-style: italic;
  background: linear-gradient(135deg, var(--violet-600), var(--orchid));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ml-subtitle {
  font-size: 16px;
  color: var(--ink-soft);
  line-height: 1.75;
  max-width: 460px;
}

.ml-hero-btns {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ml-btn-hero-primary {
  background: linear-gradient(135deg, var(--violet-600), var(--violet-400));
  color: #fff;
  border-radius: 10px;
  padding: 13px 28px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.35);
  transition:
    opacity 0.2s,
    transform 0.15s;
}
.ml-btn-hero-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.ml-btn-hero-ghost {
  background: #fff;
  color: #3b0764;
  border: 1px solid #e9d5ff;
  border-radius: 10px;
  padding: 13px 26px;
  font-size: 14px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: border-color 0.2s;
}
.ml-btn-hero-ghost:hover {
  border-color: var(--violet-400);
}

.ml-proof {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ml-avatars {
  display: flex;
}
.ml-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #faf8ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  margin-inline-start: -8px;
  flex-shrink: 0;
}
.ml-avatars .ml-avatar:first-child {
  margin-inline-start: 0;
}
.ml-proof-text {
  font-size: 13px;
  color: var(--ink-soft);
}
.ml-proof-text strong {
  color: #3b0764;
}

/* ── Signature switcher ── */
.ml-switcher {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
}
.ml-switcher-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: var(--violet-700);
  text-transform: uppercase;
}
.ml-switcher-pills {
  display: flex;
  gap: 8px;
}
.ml-pill {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: linear-gradient(135deg, var(--pill-c1), var(--pill-c2));
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(30, 10, 60, 0.15);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.ml-pill:hover {
  transform: translateY(-2px);
}
.ml-pill.active {
  box-shadow:
    0 0 0 3px var(--gold),
    0 4px 14px rgba(30, 10, 60, 0.25);
  transform: scale(1.08);
}
.ml-pill:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 3px;
}

.ml-mockup {
  width: 100%;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e9d5ff;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(91, 33, 182, 0.15);
  max-width: 600px;
}
.ml-mockup-bar {
  background: #3b0764;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.ml-mockup-bar.dark {
  background: var(--violet-900);
}
.ml-dots {
  display: flex;
  gap: 5px;
}
.ml-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: block;
}
.ml-mockup-url {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  color: rgba(255, 255, 255, 0.65);
  text-align: left;
  direction: ltr;
}
.ml-mockup-body {
  padding: 20px;
  background: #f9f7ff;
}
.ml-mockup-navbar {
  background: linear-gradient(135deg, var(--mock-c1, #3b0764), var(--mock-c2, #7c3aed));
  border-radius: 8px;
  height: 44px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  transition: background 0.4s ease;
}
.ml-mockup-logo {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ml-mockup-name {
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}
.ml-mockup-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.ml-mockup-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--line);
  padding: 12px;
}
.ml-mockup-card-title {
  height: 8px;
  width: 50%;
  border-radius: 3px;
  background: linear-gradient(135deg, var(--mock-c1, #7c3aed), var(--mock-accent, #a855f7));
  margin-bottom: 6px;
  transition: background 0.4s ease;
}
.ml-mockup-card-line {
  height: 6px;
  border-radius: 3px;
  background: #e9d5ff;
  margin-bottom: 5px;
}
.ml-mockup-card-line.short {
  width: 65%;
}

.ml-switcher-caption {
  font-size: 12px;
  color: var(--ink-soft);
  text-align: center;
  max-width: 320px;
}

.ml-fade-enter-active,
.ml-fade-leave-active {
  transition: opacity 0.25s ease;
}
.ml-fade-enter-from,
.ml-fade-leave-to {
  opacity: 0;
}

/* ── Stats ── */
.ml-stats {
  display: flex;
  background: var(--violet-900);
}
.ml-stat {
  flex: 1;
  padding: 1.4rem 2rem;
  border-inline-end: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}
.ml-stat:last-child {
  border-inline-end: none;
}
.ml-stat-num {
  font-family: 'Fraunces', serif;
  font-size: 26px;
  font-weight: 600;
  color: var(--orchid);
  margin-bottom: 4px;
}
.ml-stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}

/* ── Reveal ── */
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.6s ease,
    transform 0.6s ease;
  transition-delay: var(--d, 0s);
}
.reveal.in-view {
  opacity: 1;
  transform: translateY(0);
}

/* ── Section shells ── */
.ml-section-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--violet-400);
  margin-bottom: 0.7rem;
}
.ml-section-title {
  font-family: 'Fraunces', serif;
  font-size: 32px;
  font-weight: 300;
  letter-spacing: -0.8px;
  color: var(--ink);
  margin-bottom: 2.5rem;
}

/* ── Steps ── */
.ml-steps {
  padding: 5rem 2.5rem 1rem;
  background: var(--paper);
}
.ml-steps-track {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  position: relative;
}
.ml-step {
  background: #fff;
  border: 1.5px solid var(--line);
  border-radius: 16px;
  padding: 1.6rem;
  display: flex;
  gap: 1rem;
}
.ml-step-num {
  font-family: 'Fraunces', serif;
  font-size: 30px;
  font-weight: 300;
  color: var(--violet-400);
  flex-shrink: 0;
}
.ml-step-body h3 {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--ink);
}
.ml-step-body p {
  font-size: 13px;
  color: var(--ink-soft);
  line-height: 1.6;
}

/* ── Features ── */
.ml-features {
  padding: 5rem 2.5rem;
  background: var(--paper);
}
.ml-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}
.ml-feature-card {
  --rx: 0deg;
  --ry: 0deg;
  background: #fff;
  border-radius: 14px;
  border: 1.5px solid var(--line);
  padding: 1.3rem;
  transform: perspective(600px) rotateX(var(--rx)) rotateY(var(--ry));
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.12s ease-out;
}
.ml-feature-card:hover {
  border-color: var(--violet-400);
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.15);
}
.ml-feature-icon {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, var(--violet-600), var(--violet-400));
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.9rem;
}
.ml-feature-icon svg {
  width: 24px;
  height: 24px;
  color: #ffffff;
}
.ml-feature-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--ink);
}
.ml-feature-desc {
  font-size: 12px;
  color: var(--ink-soft);
  line-height: 1.55;
}

/* ── Product showcase ── */
.ml-product {
  padding: 1rem 2.5rem 5rem;
  background: var(--paper);
}
.ml-product-wrap {
  max-width: 780px;
  margin: 0 auto;
}
.ml-product-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1rem;
}
.ml-product-tab {
  background: #fff;
  border: 1.5px solid var(--line);
  border-radius: 99px;
  padding: 8px 16px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-soft);
  cursor: pointer;
  transition: all 0.2s;
}
.ml-product-tab.active {
  background: linear-gradient(135deg, var(--violet-600), var(--violet-400));
  border-color: transparent;
  color: #fff;
}
.ml-product-tab:focus-visible {
  outline: 2px solid var(--violet-600);
  outline-offset: 2px;
}

.ml-product-panel {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e9d5ff;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(91, 33, 182, 0.12);
}
.ml-prod-view {
  padding: 24px;
  min-height: 220px;
}

.ml-prod-dash {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.ml-prod-kpis {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}
.ml-prod-kpi {
  flex: 1;
  background: #f3e8ff;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  padding: 8px;
}
.ml-kpi-bar {
  width: 100%;
  border-radius: 6px;
  background: linear-gradient(180deg, var(--violet-400), var(--violet-600));
}
.ml-prod-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 90px;
}
.ml-chart-col {
  flex: 1;
  background: linear-gradient(180deg, var(--orchid), var(--violet-600));
  border-radius: 4px 4px 0 0;
}

.ml-prod-people,
.ml-prod-payments {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ml-prod-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ml-prod-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--violet-600), var(--violet-400));
  flex-shrink: 0;
}
.ml-prod-line {
  height: 8px;
  border-radius: 4px;
  background: var(--line);
}
.ml-prod-line.long {
  flex: 1;
}
.ml-prod-line.short {
  width: 60px;
}
.ml-pay-pill {
  font-size: 11px;
  font-weight: 700;
  border-radius: 99px;
  padding: 4px 10px;
  flex-shrink: 0;
}
.ml-pay-pill.paid {
  background: #dcfce7;
  color: #166534;
}
.ml-pay-pill.pending {
  background: #fef3c7;
  color: #92400e;
}

.ml-prod-schedule {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: 28px;
  gap: 6px;
}
.ml-sched-cell {
  border-radius: 5px;
  background: #f3e8ff;
}
.ml-sched-cell.filled {
  background: linear-gradient(135deg, var(--violet-600), var(--orchid));
}

/* ── Testimonials ── */
.ml-testimonials {
  padding: 5rem 2.5rem;
  background: #fff;
}
.ml-testi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}
.ml-testi-card {
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 14px;
  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.ml-testi-quote {
  font-size: 14px;
  color: var(--ink);
  line-height: 1.7;
}
.ml-testi-person {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ml-testi-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}
.ml-testi-role {
  font-size: 11px;
  color: var(--ink-soft);
}

/* ── FAQ ── */
.ml-faq {
  padding: 5rem 2.5rem;
  background: var(--paper);
}
.ml-faq-list {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ml-faq-item {
  background: #fff;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}
.ml-faq-q {
  width: 100%;
  background: none;
  border: none;
  padding: 1rem 1.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  cursor: pointer;
  text-align: start;
}
.ml-faq-q:focus-visible {
  outline: 2px solid var(--violet-600);
  outline-offset: -2px;
}
.ml-faq-icon {
  font-size: 18px;
  color: var(--violet-600);
  transition: transform 0.25s;
  flex-shrink: 0;
}
.ml-faq-item.open .ml-faq-icon {
  transform: rotate(45deg);
}
.ml-faq-a-wrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s ease;
}
.ml-faq-item.open .ml-faq-a-wrap {
  grid-template-rows: 1fr;
}
.ml-faq-a-wrap > .ml-faq-a {
  overflow: hidden;
  font-size: 13px;
  color: var(--ink-soft);
  line-height: 1.7;
  padding: 0 1.2rem;
  min-height: 0;
}
.ml-faq-item.open .ml-faq-a {
  padding-bottom: 1.1rem;
}

/* ── CTA ── */
.ml-cta-wrap {
  padding: 0 2.5rem 4.5rem;
}
.ml-cta {
  background: linear-gradient(
    135deg,
    var(--violet-900) 0%,
    var(--violet-600) 60%,
    var(--violet-400) 100%
  );
  border-radius: 18px;
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}
.ml-cta-text h3 {
  font-family: 'Fraunces', serif;
  font-size: 27px;
  font-weight: 300;
  color: #fff;
  margin-bottom: 7px;
}
.ml-cta-text p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}
.ml-cta-btn {
  background: #fff;
  color: #6d28d9;
  border-radius: 9px;
  padding: 13px 26px;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  display: inline-block;
  transition: opacity 0.2s;
}
.ml-cta-btn:hover {
  opacity: 0.9;
}

/* ── Footer ── */
.ml-footer {
  background: var(--ink);
  padding: 1.6rem 2.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.ml-footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}
.ml-footer-logo {
  width: 80px;
  height: auto;
  object-fit: contain;
  border-radius: 0;
}
.ml-footer-copy {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}
.ml-footer-admin {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  transition: color 0.2s;
}
.ml-footer-admin:hover {
  color: var(--violet-400);
}

@keyframes blobFloat1 {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-22px) rotate(4deg);
  }
}
@keyframes blobFloat2 {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(18px) rotate(-3deg);
  }
}

@media (max-width: 900px) {
  .ml-hero-grid {
    grid-template-columns: 1fr;
  }
  .ml-hero-content {
    align-items: center;
    text-align: center;
  }
  .ml-subtitle {
    max-width: 100%;
  }
  .ml-steps-track {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .ml-headline {
    font-size: 36px;
  }
  .ml-nav-links,
  .ml-nav-cta {
    display: none;
  }
  .ml-burger {
    display: flex;
  }
  .ml-mobile-panel {
    display: flex;
  }
  .ml-stats {
    flex-wrap: wrap;
  }
  .ml-stat {
    flex: 1 1 50%;
  }
  .ml-cta {
    flex-direction: column;
    align-items: flex-start;
  }
  .ml-hero-btns {
    flex-direction: column;
    width: 100%;
  }
  .ml-mockup-cards {
    grid-template-columns: 1fr;
  }
  .ml-prod-schedule {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
