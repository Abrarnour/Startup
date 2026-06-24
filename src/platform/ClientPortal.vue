<script setup>
import { ref, onMounted, computed } from 'vue'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const tenant = ref(null)
const invoices = ref([])
const loading = ref(true)
const error = ref('')

const statusConfig = {
  pending: {
    label: 'En attente',
    labelAr: 'قيد المراجعة',
    color: '#f59e0b',
    bg: '#fef3c7',
    icon: '',
  },
  trial: {
    label: "Période d'essai",
    labelAr: 'فترة تجريبية',
    color: '#3b82f6',
    bg: '#dbeafe',
    icon: '',
  },
  active: { label: 'Actif', labelAr: 'نشط', color: '#10b981', bg: '#d1fae5', icon: '✅' },
  suspended: { label: 'Suspendu', labelAr: 'موقوف', color: '#ef4444', bg: '#fee2e2', icon: '⛔' },
  cancelled: { label: 'Annulé', labelAr: 'ملغى', color: '#6b7280', bg: '#f3f4f6', icon: '❌' },
}

const statusInfo = computed(() => statusConfig[tenant.value?.status] || statusConfig.pending)

const schoolLink = computed(() => {
  if (!tenant.value?.slug) return null
  return `${window.location.origin}/school/${tenant.value.slug}`
})

const trialDaysLeft = computed(() => {
  if (!tenant.value?.trial_ends_at) return null
  const diff = new Date(tenant.value.trial_ends_at) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

async function fetchStatus() {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('client_token')
    const res = await fetch(`${API}/onboarding/client-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      if (res.status === 401) {
        logout()
        return
      }
      throw new Error('Erreur serveur')
    }
    const data = await res.json()
    tenant.value = data.tenant
    invoices.value = data.invoices
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function logout() {
  localStorage.removeItem('client_token')
  localStorage.removeItem('client_tenant')
  window.location.reload()
}

function copyLink() {
  if (schoolLink.value) {
    navigator.clipboard.writeText(schoolLink.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
}

const copied = ref(false)

onMounted(fetchStatus)

// Auto-refresh every 30s to catch approval
let refreshInterval
onMounted(() => {
  refreshInterval = setInterval(() => {
    if (tenant.value?.status === 'pending') fetchStatus()
  }, 30000)
})
import { onUnmounted } from 'vue'
onUnmounted(() => clearInterval(refreshInterval))
</script>

<template>
  <div class="cp-root">
    <!-- Ambient background -->
    <div class="cp-bg">
      <div class="cp-orb cp-orb-1"></div>
      <div class="cp-orb cp-orb-2"></div>
    </div>

    <!-- Navbar -->
    <nav class="cp-nav">
      <div class="cp-nav-brand">
        <img
          v-if="tenant?.logo_url"
          :src="`http://localhost:3000${tenant.logo_url}`"
          class="cp-nav-logo"
          alt="logo"
        />
        <div v-else class="cp-nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div>
          <span class="cp-nav-school">{{ tenant?.school_name || 'Mon école' }}</span>
          <span class="cp-nav-sub">Portail client</span>
        </div>
      </div>
      <button @click="logout" class="cp-logout-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Déconnexion
      </button>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="cp-loading">
      <div class="cp-spinner"></div>
      <p>Chargement de votre espace...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="cp-error-box">{{ error }}</div>

    <!-- Content -->
    <div v-else-if="tenant" class="cp-content">
      <!-- Status Hero Card -->
      <div
        class="cp-hero-card"
        :style="{ '--status-color': statusInfo.color, '--status-bg': statusInfo.bg }"
      >
        <div class="cp-hero-left">
          <div class="cp-status-badge">
            <span class="cp-status-icon">{{ statusInfo.icon }}</span>
            <span class="cp-status-label">{{ statusInfo.label }}</span>
          </div>
          <h1 class="cp-hero-title">
            {{
              tenant.status === 'pending'
                ? "Demande en cours d'examen"
                : tenant.status === 'trial'
                  ? 'Bienvenue ! Votre plateforme est prête'
                  : tenant.status === 'active'
                    ? 'Votre plateforme est active'
                    : 'Compte suspendu'
            }}
          </h1>
          <p class="cp-hero-desc">
            {{
              tenant.status === 'pending'
                ? "Notre équipe examine votre demande. Vous serez notifié dès l'approbation. Cette page se met à jour automatiquement."
                : tenant.status === 'trial'
                  ? `Vous disposez de ${trialDaysLeft} jours d'essai gratuit. Explorez toutes les fonctionnalités.`
                  : tenant.status === 'active'
                    ? 'Votre abonnement est actif. Accédez à votre plateforme ci-dessous.'
                    : "Votre compte a été suspendu. Contactez le support pour plus d'informations."
            }}
          </p>

          <!-- Progress for pending -->
          <div v-if="tenant.status === 'pending'" class="cp-progress-steps">
            <div class="cp-pstep cp-pstep--done">
              <div class="cp-pstep-dot">✓</div>
              <span>Inscription envoyée</span>
            </div>
            <div class="cp-pstep-line"></div>
            <div class="cp-pstep cp-pstep--active">
              <div class="cp-pstep-dot">2</div>
              <span>Examen SuperAdmin</span>
            </div>
            <div class="cp-pstep-line"></div>
            <div class="cp-pstep">
              <div class="cp-pstep-dot">3</div>
              <span>Plateforme créée</span>
            </div>
          </div>

          <!-- School link (when approved) -->
          <div
            v-if="tenant.status !== 'pending' && tenant.status !== 'cancelled' && schoolLink"
            class="cp-link-box"
          >
            <div class="cp-link-label">Lien de votre plateforme</div>
            <div class="cp-link-row">
              <a :href="schoolLink" target="_blank" class="cp-link-value">{{ schoolLink }}</a>
              <button @click="copyLink" class="cp-copy-btn">
                {{ copied ? '✓ Copié' : 'Copier' }}
              </button>
            </div>
          </div>
        </div>

        <div class="cp-hero-right">
          <div class="cp-hero-stats">
            <div class="cp-stat-item">
              <div class="cp-stat-val">{{ tenant.school_name }}</div>
              <div class="cp-stat-key">Nom de l'école</div>
            </div>
            <div class="cp-stat-item">
              <div class="cp-stat-val">{{ tenant.city || '—' }}</div>
              <div class="cp-stat-key">Ville</div>
            </div>
            <div class="cp-stat-item">
              <div class="cp-stat-val">{{ tenant.plan_name || 'Essai' }}</div>
              <div class="cp-stat-key">Forfait</div>
            </div>
            <div class="cp-stat-item">
              <div class="cp-stat-val">
                {{ new Date(tenant.created_at).toLocaleDateString('fr-FR') }}
              </div>
              <div class="cp-stat-key">Inscrit le</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoices -->
      <div class="cp-section">
        <div class="cp-section-header">
          <div class="cp-section-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h2>Factures & Paiements</h2>
        </div>

        <div v-if="invoices.length === 0" class="cp-plan-summary">
          <!-- Plan card -->
          <div class="cp-plan-card">
            <div class="cp-plan-badge">Forfait sélectionné</div>
            <div class="cp-plan-top">
              <div class="cp-plan-icon"></div>
              <div>
                <div class="cp-plan-name">
                  {{ tenant.plan_name_ar || tenant.plan_name || 'Essai gratuit' }}
                </div>
                <div class="cp-plan-name-fr">{{ tenant.plan_name || "Plan d'essai" }}</div>
              </div>
              <div class="cp-plan-price">
                <span v-if="tenant.price_dzd > 0"
                  >{{ Number(tenant.price_dzd).toLocaleString('fr-DZ') }}
                  <small>DZD/mois</small></span
                >
                <span v-else class="cp-plan-free">Gratuit</span>
              </div>
            </div>
            <div class="cp-plan-status-row">
              <div class="cp-plan-status-item">
                <span class="cp-psi-icon"></span>
                <div>
                  <strong>Statut paiement</strong>
                  <p>
                    {{
                      tenant.status === 'pending'
                        ? "En attente d'activation — aucune facturation avant approbation"
                        : 'Actif'
                    }}
                  </p>
                </div>
              </div>
              <div class="cp-plan-status-item">
                <span class="cp-psi-icon"></span>
                <div>
                  <strong>Première facture</strong>
                  <p>Générée automatiquement après activation de votre compte</p>
                </div>
              </div>
              <div class="cp-plan-status-item">
                <span class="cp-psi-icon"></span>
                <div>
                  <strong>Période d'essai</strong>
                  <p>14 jours gratuits dès l'activation — aucune carte requise</p>
                </div>
              </div>
            </div>
          </div>

          <!-- What happens next -->
          <div class="cp-next-steps">
            <div class="cp-next-title">Ce qui se passe après activation</div>
            <div class="cp-next-list">
              <div class="cp-next-item">
                <div class="cp-next-num">1</div>
                <div>SuperAdmin approuve votre demande</div>
              </div>
              <div class="cp-next-item">
                <div class="cp-next-num">2</div>
                <div>Votre base de données isolée est créée automatiquement</div>
              </div>
              <div class="cp-next-item">
                <div class="cp-next-num">3</div>
                <div>Vous recevez votre lien d'accès dédié</div>
              </div>
              <div class="cp-next-item">
                <div class="cp-next-num">4</div>
                <div>14 jours d'essai gratuit — la première facture arrive à J+14</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="cp-invoices-table">
          <div class="cp-table-header">
            <span>Référence</span>
            <span>Période</span>
            <span>Montant</span>
            <span>Échéance</span>
            <span>Statut</span>
          </div>
          <div v-for="inv in invoices" :key="inv.id" class="cp-table-row">
            <span class="cp-inv-ref">#{{ String(inv.id).padStart(4, '0') }}</span>
            <span class="cp-inv-period">
              {{
                inv.period_start
                  ? new Date(inv.period_start).toLocaleDateString('fr-FR', {
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'
              }}
              {{
                inv.period_end
                  ? ' → ' +
                    new Date(inv.period_end).toLocaleDateString('fr-FR', {
                      month: 'short',
                      year: 'numeric',
                    })
                  : ''
              }}
            </span>
            <span class="cp-inv-amount"
              >{{ Number(inv.amount_dzd).toLocaleString('fr-DZ') }} DZD</span
            >
            <span class="cp-inv-due">{{
              inv.due_date ? new Date(inv.due_date).toLocaleDateString('fr-FR') : '—'
            }}</span>
            <span class="cp-inv-status" :class="'cp-inv-status--' + inv.status">
              {{
                inv.status === 'paid'
                  ? '✓ Payé'
                  : inv.status === 'overdue'
                    ? '⚠ En retard'
                    : '◷ En attente'
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- Contact info -->
      <div class="cp-footer-info">
        <p>Besoin d'aide ? Contactez-nous à <strong>support@moudar.dz</strong></p>
        <p class="cp-footer-refresh">
          <button @click="fetchStatus" class="cp-refresh-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Actualiser
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cp-root {
  min-height: 100vh;
  background: #f8faff;
  font-family: 'Segoe UI', system-ui, sans-serif;
  position: relative;
  overflow-x: hidden;
}

/* Background */
.cp-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.cp-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
}
.cp-orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%);
  top: -100px;
  right: -100px;
}
.cp-orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  bottom: 0;
  left: -80px;
}

/* Nav */
.cp-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 32px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.06);
}
.cp-nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cp-nav-logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
}
.cp-nav-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cp-nav-icon svg {
  width: 20px;
  height: 20px;
  stroke: white;
}
.cp-nav-school {
  display: block;
  font-weight: 700;
  font-size: 15px;
  color: #1e1b4b;
}
.cp-nav-sub {
  display: block;
  font-size: 11px;
  color: #7c3aed;
  font-weight: 500;
}
.cp-logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  border: 1.5px solid #e5e7eb;
  background: white;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.cp-logout-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}
.cp-logout-btn svg {
  width: 15px;
  height: 15px;
}

/* Loading */
.cp-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;
  position: relative;
  z-index: 1;
}
.cp-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e5e7eb;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.cp-error-box {
  margin: 40px auto;
  max-width: 600px;
  padding: 20px;
  background: #fee2e2;
  border-radius: 12px;
  color: #dc2626;
  text-align: center;
  position: relative;
  z-index: 1;
}

/* Content */
.cp-content {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Hero Card */
.cp-hero-card {
  background: white;
  border-radius: 20px;
  padding: 36px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  align-items: start;
}
.cp-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 100px;
  background: var(--status-bg);
  color: var(--status-color);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
  border: 1.5px solid var(--status-color);
}
.cp-status-icon {
  font-size: 16px;
}
.cp-hero-title {
  font-size: 24px;
  font-weight: 800;
  color: #1e1b4b;
  margin: 0 0 10px;
  line-height: 1.3;
}
.cp-hero-desc {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 24px;
  max-width: 500px;
}

/* Progress steps */
.cp-progress-steps {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 8px;
}
.cp-pstep {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 100px;
}
.cp-pstep span {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
}
.cp-pstep--done .cp-pstep-dot {
  background: #10b981;
  color: white;
  border-color: #10b981;
}
.cp-pstep--done span {
  color: #10b981;
  font-weight: 600;
}
.cp-pstep--active .cp-pstep-dot {
  background: #7c3aed;
  color: white;
  border-color: #7c3aed;
  animation: pulse-dot 2s ease-in-out infinite;
}
.cp-pstep--active span {
  color: #7c3aed;
  font-weight: 600;
}
.cp-pstep-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #9ca3af;
}
.cp-pstep-line {
  flex: 1;
  height: 2px;
  background: #e5e7eb;
  margin-bottom: 22px;
  min-width: 40px;
}
@keyframes pulse-dot {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(124, 58, 237, 0);
  }
}

/* Link box */
.cp-link-box {
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  border-radius: 12px;
  padding: 16px 20px;
  margin-top: 8px;
}
.cp-link-label {
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}
.cp-link-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cp-link-value {
  font-size: 14px;
  color: #1e40af;
  text-decoration: none;
  font-weight: 600;
  word-break: break-all;
}
.cp-link-value:hover {
  text-decoration: underline;
}
.cp-copy-btn {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1.5px solid #16a34a;
  background: white;
  color: #16a34a;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  flex-shrink: 0;
}
.cp-copy-btn:hover {
  background: #16a34a;
  color: white;
}

/* Hero right stats */
.cp-hero-right {
  min-width: 220px;
}
.cp-hero-stats {
  background: #faf9ff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.cp-stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cp-stat-val {
  font-size: 14px;
  font-weight: 700;
  color: #1e1b4b;
  word-break: break-word;
}
.cp-stat-key {
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Section */
.cp-section {
  background: white;
  border-radius: 20px;
  padding: 28px 32px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.cp-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.cp-section-icon {
  width: 40px;
  height: 40px;
  background: #f0f9ff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cp-section-icon svg {
  width: 20px;
  height: 20px;
  stroke: #3b82f6;
}
.cp-section-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: #1e1b4b;
  margin: 0;
}

/* Empty */
/* Plan summary (no invoices yet) */
.cp-plan-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cp-plan-card {
  border: 1.5px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
}
.cp-plan-badge {
  background: #f5f3ff;
  color: #7c3aed;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 8px 20px;
  border-bottom: 1px solid #ede9fe;
}
.cp-plan-top {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 20px 16px;
}
.cp-plan-icon {
  font-size: 32px;
  flex-shrink: 0;
}
.cp-plan-name {
  font-size: 18px;
  font-weight: 800;
  color: #1e1b4b;
}
.cp-plan-name-fr {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}
.cp-plan-price {
  margin-left: auto;
  text-align: right;
  font-size: 22px;
  font-weight: 800;
  color: #7c3aed;
}
.cp-plan-price small {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
}
.cp-plan-free {
  font-size: 18px;
  font-weight: 800;
  color: #10b981;
}

.cp-plan-status-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid #f3f4f6;
}
.cp-plan-status-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 16px 20px;
  border-right: 1px solid #f3f4f6;
}
.cp-plan-status-item:last-child {
  border-right: none;
}
.cp-psi-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}
.cp-plan-status-item strong {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 4px;
}
.cp-plan-status-item p {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
}

/* Next steps */
.cp-next-steps {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px 24px;
}
.cp-next-title {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.cp-next-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cp-next-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #374151;
}
.cp-next-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #7c3aed;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 640px) {
  .cp-plan-status-row {
    grid-template-columns: 1fr;
  }
  .cp-plan-status-item {
    border-right: none;
    border-bottom: 1px solid #f3f4f6;
  }
}

/* Table */
.cp-invoices-table {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}
.cp-table-header {
  display: grid;
  grid-template-columns: 80px 1fr 120px 100px 120px;
  padding: 12px 20px;
  background: #f9fafb;
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.cp-table-row {
  display: grid;
  grid-template-columns: 80px 1fr 120px 100px 120px;
  padding: 14px 20px;
  border-top: 1px solid #f3f4f6;
  font-size: 13px;
  color: #374151;
  align-items: center;
  transition: background 0.15s;
}
.cp-table-row:hover {
  background: #f9fafb;
}
.cp-inv-ref {
  font-weight: 600;
  color: #6b7280;
  font-family: monospace;
}
.cp-inv-amount {
  font-weight: 700;
  color: #1e1b4b;
}
.cp-inv-status {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 100px;
  text-align: center;
}
.cp-inv-status--paid {
  background: #d1fae5;
  color: #065f46;
}
.cp-inv-status--pending {
  background: #fef3c7;
  color: #92400e;
}
.cp-inv-status--overdue {
  background: #fee2e2;
  color: #991b1b;
}

/* Footer */
.cp-footer-info {
  text-align: center;
  padding: 16px;
  font-size: 13px;
  color: #9ca3af;
}
.cp-refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.2s;
}
.cp-refresh-btn:hover {
  border-color: #7c3aed;
  color: #7c3aed;
}
.cp-refresh-btn svg {
  width: 13px;
  height: 13px;
}

@media (max-width: 768px) {
  .cp-hero-card {
    grid-template-columns: 1fr;
  }
  .cp-nav {
    padding: 12px 16px;
  }
  .cp-content {
    padding: 16px;
  }
  .cp-table-header,
  .cp-table-row {
    grid-template-columns: 60px 1fr 90px;
  }
  .cp-table-header span:nth-child(3),
  .cp-table-header span:nth-child(4),
  .cp-table-row span:nth-child(3),
  .cp-table-row span:nth-child(4) {
    display: none;
  }
  .cp-progress-steps {
    flex-wrap: wrap;
  }
}
</style>
