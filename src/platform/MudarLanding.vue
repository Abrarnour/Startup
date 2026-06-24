<template>
  <div class="ml-root">
    <!-- ── Navbar ── -->
    <nav class="ml-nav">
      <div class="ml-nav-brand">
        <img src="/logoMUDAR.png" alt="MUDAR" class="ml-logo-img" />
        <span class="ml-brand-name">MUDAR</span>
      </div>
      <div class="ml-nav-links">
        <a href="#features" class="ml-nav-link">المميزات</a>
        <a href="#about" class="ml-nav-link">إحصائيات</a>
      </div>
      <div class="ml-nav-cta">
        <router-link to="/register-school" class="ml-btn-outline">تسجيل مدرستك</router-link>
        <router-link to="/mudar/login" class="ml-btn-primary">تسجيل الدخول</router-link>
      </div>
    </nav>

    <!-- ── Hero ── -->
    <section class="ml-hero">
      <!-- Blobs -->
      <div class="ml-blob ml-blob-1"></div>
      <div class="ml-blob ml-blob-2"></div>
      <div class="ml-blob ml-blob-3"></div>
      <div class="ml-blob ml-blob-4"></div>
      <div class="ml-overlay"></div>

      <div class="ml-hero-content">
        <!-- Badge -->
        <div class="ml-badge">
          <span class="ml-badge-pill">جديد</span>
          <span class="ml-badge-text">منصة MUDAR v2.0 متاحة الآن</span>
        </div>

        <!-- Headline -->
        <h1 class="ml-headline">
          أطلق منصة<br />
          مدرستك <em>الخاصة</em>
        </h1>

        <p class="ml-subtitle">
          MUDAR تُنشئ في دقائق منصة إدارة متكاملة لمدرستك — مخصصة بشعارك وألوانك، مستقلة بالكامل،
          بدون كود.
        </p>

        <!-- Buttons -->
        <div class="ml-hero-btns">
          <router-link to="/register-school" class="ml-btn-hero-primary">
            ابدأ مجاناً ←
          </router-link>
          <a href="#features" class="ml-btn-hero-ghost"> ▶ اكتشف المميزات </a>
        </div>

        <!-- Social proof -->

        <!-- Browser mockup -->
        <div class="ml-mockup">
          <div class="ml-mockup-bar">
            <div class="ml-dots"><span></span><span></span><span></span></div>
            <div class="ml-mockup-url">mudar.dz/ibn-khaldoun</div>
          </div>
          <div class="ml-mockup-body">
            <div class="ml-mockup-navbar"></div>
            <div class="ml-mockup-cards">
              <div v-for="n in 3" :key="n" class="ml-mockup-card">
                <div class="ml-mockup-card-title"></div>
                <div class="ml-mockup-card-line"></div>
                <div class="ml-mockup-card-line short"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Stats bar ── -->
    <div id="about" class="ml-stats">
      <div v-for="(stat, i) in stats" :key="i" class="ml-stat">
        <div class="ml-stat-num">{{ displayed[i] }}{{ stat.suffix }}</div>
        <div class="ml-stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <!-- ── Features ── -->
    <section id="features" class="ml-features">
      <div class="ml-section-eyebrow">ما نقدمه لك</div>
      <h2 class="ml-section-title">كل ما تحتاجه مدرستك</h2>
      <div class="ml-features-grid">
        <div v-for="f in features" :key="f.title" class="ml-feature-card">
          <div class="ml-feature-icon" v-html="f.icon"></div>
          <div class="ml-feature-title">{{ f.title }}</div>
          <div class="ml-feature-desc">{{ f.desc }}</div>
        </div>
      </div>
    </section>

    <!-- ── CTA ── -->
    <div class="ml-cta-wrap">
      <div class="ml-cta">
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
import { ref, onMounted } from 'vue'

const stats = [
  { num: 3, suffix: ' دقائق', label: 'لإنشاء منصتك' },
  { num: 100, suffix: '%', label: 'بيانات مؤمّنة' },
  { num: '+', suffix: '+', label: 'مدرسة نشطة' },
  { num: 69, suffix: '', label: 'ولاية مغطّاة' },
]

const displayed = ref(stats.map(() => 0))

onMounted(() => {
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
})

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
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,300;0,400;1,300;1,400&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.ml-root {
  font-family: 'IBM Plex Sans Arabic', 'Plus Jakarta Sans', sans-serif;
  direction: rtl;
  background: #f9f7ff;
  color: #1e0a3c;
  min-height: 100vh;
}

/* ── Navbar ── */
.ml-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(249, 247, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #ede9fe;
  padding: 0.85rem 2.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.ml-nav-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
}
.ml-logo-img {
  width: 130px; /* تكبير الحجم الإجمالي للرمز */
  height: auto;
  object-fit: contain;
  border-radius: 0; /* إزالة الحواف الدائرية */
  margin-top: -10px; /* تعديل الموضع الرأسي إذا كان الشعار يزيح شريط التنقل */

  /* هذه الخاصية تقوم بمسح اللون الأبيض برمجياً ودمج الرمز البنفسجي مع لون الخلفية */
  /* (تعمل فقط مع الخلفية البيضاء النقية، لا تعمل مع المربعات) */
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
  color: #6b5e7e;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}
.ml-nav-link:hover {
  color: #7c3aed;
}

.ml-nav-cta {
  display: flex;
  gap: 0.7rem;
  align-items: center;
}

.ml-btn-outline {
  padding: 0.5rem 1rem;
  border: 1.5px solid #7c3aed;
  border-radius: 8px;
  font-size: 0.83rem;
  font-weight: 600;
  color: #7c3aed;
  text-decoration: none;
  transition: background 0.2s;
}
.ml-btn-outline:hover {
  background: #f3e8ff;
}

.ml-btn-primary {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
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
  min-height: 720px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5rem 2.5rem 4rem;
  overflow: hidden;
  background: #f0eeff;
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
    #5b21b6 0%,
    #7c3aed 35%,
    #a78bfa 65%,
    transparent 85%
  );
  filter: blur(3px);
  opacity: 0.8;
  animation: blobFloat1 9s ease-in-out infinite;
}
.ml-blob-2 {
  width: 600px;
  height: 500px;
  top: 30px;
  right: -60px;
  background: radial-gradient(circle, #7c3aed 0%, #a855f7 45%, #c4b5fd 70%, transparent 90%);
  filter: blur(4px);
  opacity: 0.65;
  animation: blobFloat2 11s ease-in-out infinite;
}
.ml-blob-3 {
  width: 650px;
  height: 500px;
  top: -80px;
  left: -100px;
  background: radial-gradient(circle, #c4b5fd 0%, #ddd6fe 50%, #ede9fe 75%, transparent 90%);
  filter: blur(5px);
  opacity: 0.75;
  animation: blobFloat1 13s ease-in-out infinite reverse;
}
.ml-blob-4 {
  width: 380px;
  height: 300px;
  top: 120px;
  left: 100px;
  background: radial-gradient(circle, #e879f9 0%, #c084fc 45%, transparent 80%);
  filter: blur(4px);
  opacity: 0.45;
  animation: blobFloat2 8s ease-in-out infinite;
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
  position: relative;
  z-index: 2;
  max-width: 680px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 99px;
}
.ml-badge-text {
  font-size: 12px;
  color: #6b5e7e;
  font-weight: 500;
}

.ml-headline {
  font-family: 'Fraunces', serif;
  font-size: 58px;
  font-weight: 300;
  line-height: 1.06;
  letter-spacing: -2px;
  color: #1e0a3c;
}
.ml-headline em {
  font-style: italic;
  background: linear-gradient(135deg, #7c3aed, #e879f9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ml-subtitle {
  font-size: 16px;
  color: #7c6b99;
  line-height: 1.75;
  max-width: 500px;
}

.ml-hero-btns {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.ml-btn-hero-primary {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff;
  border: none;
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
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: border-color 0.2s;
}
.ml-btn-hero-ghost:hover {
  border-color: #a855f7;
}

/* Social proof */
.ml-proof {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
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
  margin-left: -8px;
}
.ml-avatars .ml-avatar:first-child {
  margin-left: 0;
}
.ml-proof-text {
  font-size: 13px;
  color: #7c6b99;
}
.ml-proof-text strong {
  color: #3b0764;
}

/* Mockup */
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
  color: rgba(255, 255, 255, 0.6);
  text-align: left;
  direction: ltr;
}
.ml-mockup-body {
  padding: 20px;
  background: #f9f7ff;
}
.ml-mockup-navbar {
  background: linear-gradient(135deg, #3b0764, #7c3aed);
  border-radius: 8px;
  height: 44px;
  margin-bottom: 14px;
}
.ml-mockup-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.ml-mockup-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ede9fe;
  padding: 12px;
}
.ml-mockup-card-title {
  height: 8px;
  width: 50%;
  border-radius: 3px;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  margin-bottom: 6px;
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

/* ── Stats ── */
.ml-stats {
  display: flex;
  background: #2e0652;
}
.ml-stat {
  flex: 1;
  padding: 1.4rem 2rem;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}
.ml-stat:last-child {
  border-right: none;
}
.ml-stat-num {
  font-family: 'Fraunces', serif;
  font-size: 26px;
  font-weight: 600;
  color: #e879f9;
  margin-bottom: 4px;
}
.ml-stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}

/* ── Features ── */
.ml-features {
  padding: 5rem 2.5rem;
  background: #f9f7ff;
}
.ml-section-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #a855f7;
  margin-bottom: 0.7rem;
}
.ml-section-title {
  font-family: 'Fraunces', serif;
  font-size: 32px;
  font-weight: 300;
  letter-spacing: -0.8px;
  color: #1e0a3c;
  margin-bottom: 2.5rem;
}
.ml-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}
.ml-feature-card {
  background: #fff;
  border-radius: 14px;
  border: 1.5px solid #ede9fe;
  padding: 1.3rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.ml-feature-card:hover {
  border-color: #a855f7;
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.1);
}
.ml-feature-icon {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.9rem;
  font-size: 18px;
}
.ml-feature-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #1e0a3c;
}
.ml-feature-desc {
  font-size: 12px;
  color: #7c6b99;
  line-height: 1.55;
}

/* ── CTA ── */
.ml-cta-wrap {
  padding: 0 2.5rem 4.5rem;
}
.ml-cta {
  background: linear-gradient(135deg, #3b0764 0%, #7c3aed 60%, #a855f7 100%);
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
  background: #1e0a3c;
  padding: 1.6rem 2.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.ml-footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}
/* ── شعار الفوتر المعدل ── */
.ml-footer-logo {
  width: 80px; /* تكبير حجم الرمز ليصبح واضحاً في التذييل */
  height: auto; /* المحافظة على أبعاد الشعار التناسبية تلقائياً */
  object-fit: contain;
  border-radius: 0; /* إلغاء الحواف الدائرية المستندة سابقاً */
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
  color: #a855f7;
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

@media (max-width: 768px) {
  .ml-headline {
    font-size: 36px;
  }
  .ml-nav-links {
    display: none;
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
}
.ml-feature-icon svg {
  width: 24px;
  height: 24px;
  color: #ffffff; /* لجعل الأيقونة بيضاء فوق الخلفية الملونة */
}
</style>
