<template>
  <div class="platform-shell" dir="rtl">
    <!-- ── Sidebar ─────────────────────────────────────────── -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span>🏢</span>
        <span class="brand-name">Platform Admin</span>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeTab === item.key }"
          @click="activeTab = item.key"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </nav>
      <div class="sidebar-footer">
        <div class="admin-badge">{{ adminName }}</div>
        <button class="logout-btn" @click="handleLogout">تسجيل الخروج</button>
      </div>
    </aside>

    <main class="main-content">
      <!-- ── Stats ─────────────────────────────────────── -->
      <div v-if="activeTab === 'dashboard'">
        <div class="page-header">
          <h1 class="page-title">إحصائيات المنصة</h1>
          <button class="btn-primary" @click="loadStats">🔄 تحديث</button>
        </div>

        <div v-if="statsLoading" class="loading-state">
          <div class="spinner"></div>
          <span>تحميل الإحصائيات...</span>
        </div>
        <div v-else-if="statsError" class="error-state">⚠️ {{ statsError }}</div>

        <div v-else class="stats-grid">
          <div class="stat-card total">
            <div class="stat-icon">🏫</div>
            <div class="stat-value">{{ stats.total_schools || 0 }}</div>
            <div class="stat-label">إجمالي المدارس</div>
          </div>
          <div class="stat-card active">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ stats.active_schools || 0 }}</div>
            <div class="stat-label">نشطة</div>
          </div>
          <div class="stat-card trial">
            <div class="stat-icon">🔬</div>
            <div class="stat-value">{{ stats.trial_schools || 0 }}</div>
            <div class="stat-label">تجريبية</div>
          </div>
          <div class="stat-card pending">
            <div class="stat-icon">⏳</div>
            <div class="stat-value">{{ stats.pending_schools || 0 }}</div>
            <div class="stat-label">بانتظار الموافقة</div>
          </div>
          <div class="stat-card revenue">
            <div class="stat-icon">💰</div>
            <div class="stat-value">
              {{ Number(stats.total_revenue || 0).toLocaleString('ar-DZ') }} دج
            </div>
            <div class="stat-label">الإيرادات الإجمالية</div>
          </div>
        </div>

        <!-- Quick pending list -->
        <div v-if="pendingTenants.length > 0" class="pending-alert">
          <h3>🔔 طلبات بانتظار الموافقة ({{ pendingTenants.length }})</h3>
          <div v-for="t in pendingTenants" :key="t.id" class="pending-row">
            <div>
              <strong>{{ t.school_name }}</strong>
              <span style="color: #888; font-size: 0.8rem; margin-right: 8px">{{
                t.admin_email
              }}</span>
              <span style="color: #888; font-size: 0.8rem">{{ t.city || '—' }}</span>
            </div>
            <button
              class="action-btn approve"
              :disabled="approvingId === t.id"
              @click="approveSchool(t)"
            >
              {{ approvingId === t.id ? '⏳ جاري الإنشاء...' : 'موافقة وإنشاء 🛠️' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── Tenants ─────────────────────────────────────── -->
      <div v-if="activeTab === 'tenants'">
        <div class="page-header">
          <h1 class="page-title">إدارة المدارس</h1>
          <div class="header-actions">
            <input
              v-model="search"
              placeholder="بحث باسم المدرسة أو البريد..."
              class="search-input"
              @input="loadTenants"
            />
            <select
              v-model="filterStatus"
              class="search-input"
              style="min-width: 130px"
              @change="loadTenants"
            >
              <option value="">كل الحالات</option>
              <option value="pending">بانتظار الموافقة</option>
              <option value="trial">تجريبية</option>
              <option value="active">نشطة</option>
              <option value="suspended">موقوفة</option>
            </select>
          </div>
        </div>

        <div v-if="tenantsLoading" class="loading-state">
          <div class="spinner"></div>
          <span>تحميل قائمة المدارس...</span>
        </div>

        <div v-else-if="tenants.length === 0" class="loading-state" style="color: #888">
          لا توجد مدارس مطابقة للبحث
        </div>

        <div v-else class="tenants-table-wrap">
          <table class="tenants-table">
            <thead>
              <tr>
                <th>المدرسة</th>
                <th>الشعار</th>
                <th>المسؤول</th>
                <th>الولاية</th>
                <th>الباقة</th>
                <th>الحالة</th>
                <th>تاريخ التسجيل</th>
                <th>رابط الوصول</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="t in tenants"
                :key="t.id"
                :class="{ 'row-pending': t.status === 'pending' }"
              >
                <td>
                  <div class="school-cell">
                    <div class="school-color-dot" :style="{ background: t.primary_color }"></div>
                    <div>
                      <p class="school-name">{{ t.school_name }}</p>
                      <p class="school-slug">{{ t.slug }}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <img
                    v-if="t.logo_url"
                    :src="resolveLogoUrl(t.logo_url)"
                    alt="Logo"
                    style="
                      height: 32px;
                      width: 32px;
                      border-radius: 50%;
                      object-fit: cover;
                      border: 2px solid #eee;
                    "
                  />
                  <span v-else style="color: #ccc; font-size: 1.4rem">🏫</span>
                </td>
                <td>
                  <div>
                    <p style="font-size: 0.85rem">{{ t.admin_email }}</p>
                    <p v-if="t.admin_phone" style="font-size: 0.75rem; color: #888">
                      {{ t.admin_phone }}
                    </p>
                  </div>
                </td>
                <td>{{ t.city || '—' }}</td>
                <td>
                  <span class="badge plan">{{ t.plan_name || '—' }}</span>
                </td>
                <td>
                  <span class="badge" :class="t.status">{{ statusLabel(t.status) }}</span>
                </td>
                <td>{{ formatDate(t.created_at) }}</td>
                <td>
                  <!-- ── CLIENT ACCESS LINK ───────────────── -->
                  <div v-if="t.status !== 'pending'" class="link-cell">
                    <a
                      :href="schoolLink(t.slug)"
                      target="_blank"
                      class="school-link"
                      :title="schoolLink(t.slug)"
                    >
                      🔗 {{ t.slug }}
                    </a>
                    <button class="copy-btn" @click="copyLink(t.slug)" title="نسخ الرابط">
                      📋
                    </button>
                  </div>
                  <span v-else style="color: #aaa; font-size: 0.8rem">— لم يتم الإنشاء</span>
                </td>
                <td>
                  <div class="actions-cell">
                    <button
                      v-if="t.status === 'pending'"
                      class="action-btn approve"
                      :disabled="approvingId === t.id"
                      @click="approveSchool(t)"
                    >
                      {{ approvingId === t.id ? '⏳ جاري الإنشاء...' : 'موافقة وإنشاء 🛠️' }}
                    </button>
                    <button
                      v-if="t.status !== 'active' && t.status !== 'pending'"
                      class="action-btn activate"
                      @click="changeStatus(t, 'active')"
                    >
                      تفعيل
                    </button>
                    <button
                      v-if="t.status === 'active'"
                      class="action-btn suspend"
                      @click="changeStatus(t, 'suspended')"
                    >
                      إيقاف
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Invoices ─────────────────────────────────────── -->
      <div v-if="activeTab === 'invoices'">
        <div class="page-header">
          <h1 class="page-title">الفواتير</h1>
          <button class="btn-primary" @click="showInvoiceModal = true">+ إنشاء فاتورة</button>
        </div>

        <div v-if="invoicesLoading" class="loading-state">
          <div class="spinner"></div>
          <span>تحميل الفواتير...</span>
        </div>

        <div v-else class="tenants-table-wrap">
          <table class="tenants-table">
            <thead>
              <tr>
                <th>المدرسة</th>
                <th>المبلغ</th>
                <th>الباقة</th>
                <th>الحالة</th>
                <th>تاريخ الاستحقاق</th>
                <th>تاريخ الدفع</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in invoices" :key="inv.id">
                <td>{{ inv.school_name }}</td>
                <td>{{ Number(inv.amount_dzd).toLocaleString('ar-DZ') }} دج</td>
                <td>{{ inv.plan_name }}</td>
                <td>
                  <span class="badge" :class="inv.status">{{
                    invoiceStatusLabel(inv.status)
                  }}</span>
                </td>
                <td>{{ formatDate(inv.due_date) }}</td>
                <td>{{ inv.paid_at ? formatDate(inv.paid_at) : '—' }}</td>
              </tr>
              <tr v-if="invoices.length === 0">
                <td colspan="6" style="text-align: center; color: #888; padding: 2rem">
                  لا توجد فواتير
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Approval Success Modal — shows client link -->
    <div v-if="approvalResult" class="modal-overlay" @click.self="approvalResult = null">
      <div class="modal-card approval-modal">
        <div class="approval-success-icon">🎉</div>
        <h3>تمت الموافقة بنجاح!</h3>
        <p>تم إنشاء قاعدة بيانات المدرسة وهي جاهزة للاستخدام.</p>
        <div class="approval-link-box">
          <p class="link-label">رابط المدرسة الخاص بالعميل:</p>
          <div class="link-display">
            <a :href="approvalResult.link" target="_blank" class="approval-link">
              {{ approvalResult.link }}
            </a>
            <button @click="copyText(approvalResult.link)" class="copy-btn-lg">📋 نسخ</button>
          </div>
          <p class="link-hint">
            أرسل هذا الرابط للمدرسة — تسجيل الدخول بالبريد المسجل وكلمة المرور المختارة
          </p>
        </div>
        <button class="btn-primary" @click="approvalResult = null">حسناً</button>
      </div>
    </div>

    <!-- Invoice Modal -->
    <div v-if="showInvoiceModal" class="modal-overlay" @click.self="showInvoiceModal = false">
      <div class="modal-card">
        <h3>إنشاء فاتورة جديدة</h3>
        <div class="field">
          <label>المدرسة</label>
          <select v-model="newInvoice.tenantId">
            <option v-for="ten in tenants" :key="ten.id" :value="ten.id">
              {{ ten.school_name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>المبلغ (دج)</label>
          <input type="number" v-model="newInvoice.amountDzd" placeholder="3000" />
        </div>
        <div class="field">
          <label>تاريخ الاستحقاق</label>
          <input type="date" v-model="newInvoice.dueDate" />
        </div>
        <div class="field">
          <label>ملاحظة</label>
          <input v-model="newInvoice.note" placeholder="اشتراك شهر يناير..." />
        </div>
        <div class="modal-actions">
          <button @click="showInvoiceModal = false" class="btn-cancel">إلغاء</button>
          <button @click="createInvoice" class="btn-primary">إنشاء</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toastMessage" class="toast-notification" :class="toastType">
      <p>{{ toastMessage }}</p>
      <button @click="toastMessage = null" class="toast-close">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  platformGetStats,
  platformGetTenants,
  platformSetStatus,
  platformGetInvoices,
  platformCreateInvoice,
  platformApproveTenant,
} from '../services/api.js'

const router = useRouter()
const activeTab = ref('dashboard')
const adminName = JSON.parse(localStorage.getItem('platform_admin') || '{}')?.email || 'Admin'

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(
  '/api',
  '',
)
const FRONTEND_URL = window.location.origin // e.g. http://localhost:5173

const navItems = [
  { key: 'dashboard', label: 'الإحصائيات', icon: '📊' },
  { key: 'tenants', label: 'المدارس', icon: '🏫' },
  { key: 'invoices', label: 'الفواتير', icon: '🧾' },
]

const toastMessage = ref(null)
const toastType = ref('success')

const stats = ref({})
const statsLoading = ref(false)
const statsError = ref(null)

const tenants = ref([])
const tenantsLoading = ref(false)
const search = ref('')
const filterStatus = ref('')
const approvingId = ref(null)
const approvalResult = ref(null)

const invoices = ref([])
const invoicesLoading = ref(false)
const showInvoiceModal = ref(false)
const newInvoice = ref({ tenantId: '', amountDzd: '', dueDate: '', note: '' })

// Pending tenants shown as quick-action list on dashboard
const pendingTenants = computed(() => tenants.value.filter((t) => t.status === 'pending'))

onMounted(() => {
  loadStats()
  loadTenants()
  loadInvoices()
})

async function loadStats() {
  statsLoading.value = true
  statsError.value = null
  try {
    const data = await platformGetStats()
    if (data?.error) throw new Error(data.error)
    stats.value = data
  } catch (e) {
    statsError.value = e.message || 'فشل تحميل الإحصائيات'
    stats.value = {}
  } finally {
    statsLoading.value = false
  }
}

async function loadTenants() {
  tenantsLoading.value = true
  try {
    const params = new URLSearchParams()
    if (search.value) params.set('search', search.value)
    if (filterStatus.value) params.set('status', filterStatus.value)
    const data = await platformGetTenants(params.toString())
    tenants.value = data.tenants || []
  } catch {
    tenants.value = []
  } finally {
    tenantsLoading.value = false
  }
}

async function loadInvoices() {
  invoicesLoading.value = true
  try {
    invoices.value = await platformGetInvoices()
  } catch {
    invoices.value = []
  } finally {
    invoicesLoading.value = false
  }
}

// ── Build client-facing school link ──────────────────────────
function schoolLink(slug) {
  // Use path-based URL — works in dev without subdomain config
  return `${FRONTEND_URL}/school/${slug}`
}

function resolveLogoUrl(logoUrl) {
  if (!logoUrl) return ''
  if (logoUrl.startsWith('http')) return logoUrl
  return `${BACKEND_URL}${logoUrl}`
}

async function approveSchool(tenant) {
  if (
    !confirm(
      `هل تريد الموافقة على "${tenant.school_name}" وإنشاء قاعدة البيانات الخاصة بها؟\nهذه العملية قد تستغرق 30 ثانية.`,
    )
  )
    return

  approvingId.value = tenant.id
  try {
    const result = await platformApproveTenant(tenant.id)
    if (result.success) {
      const link = schoolLink(tenant.slug)
      approvalResult.value = {
        schoolName: tenant.school_name,
        slug: tenant.slug,
        link,
      }
      showToast(`✅ تمت الموافقة على "${tenant.school_name}" — قاعدة البيانات جاهزة!`, 'success')
    } else {
      showToast(`❌ ${result.error || 'حدث خطأ'}`, 'error')
    }
    await loadTenants()
    await loadStats()
  } catch (e) {
    showToast(`❌ ${e.message || 'حدث خطأ أثناء الإنشاء'}`, 'error')
  } finally {
    approvingId.value = null
  }
}

async function changeStatus(tenant, status) {
  const label = statusLabel(status)
  if (!confirm(`تغيير حالة "${tenant.school_name}" إلى: ${label}؟`)) return
  try {
    await platformSetStatus(tenant.id, status)
    showToast(`تم تغيير الحالة إلى: ${label}`, 'success')
    await loadTenants()
    await loadStats()
  } catch (e) {
    showToast('خطأ: ' + e.message, 'error')
  }
}

async function createInvoice() {
  try {
    await platformCreateInvoice(newInvoice.value)
    showInvoiceModal.value = false
    newInvoice.value = { tenantId: '', amountDzd: '', dueDate: '', note: '' }
    await loadInvoices()
    showToast('✅ تم إنشاء الفاتورة', 'success')
  } catch (e) {
    showToast('خطأ: ' + e.message, 'error')
  }
}

function handleLogout() {
  localStorage.removeItem('platform_token')
  localStorage.removeItem('platform_admin')
  router.push('/platform/login')
}

function showToast(msg, type = 'success') {
  toastMessage.value = msg
  toastType.value = type
  setTimeout(() => {
    toastMessage.value = null
  }, 5000)
}

function copyLink(slug) {
  copyText(schoolLink(slug))
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('✅ تم نسخ الرابط', 'success')
  } catch {
    showToast('الرابط: ' + text, 'info')
  }
}

const statusLabel = (s) =>
  ({
    active: 'نشطة',
    trial: 'تجريبية',
    suspended: 'موقوفة',
    cancelled: 'ملغاة',
    pending: 'بانتظار الموافقة',
  })[s] || s

const invoiceStatusLabel = (s) => ({ pending: 'معلقة', paid: 'مدفوعة', overdue: 'متأخرة' })[s] || s

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('ar-DZ') : '—')
</script>

<style scoped>
.platform-shell {
  display: flex;
  min-height: 100vh;
  background: #f0f2f5;
}

/* Sidebar */
.sidebar {
  width: 220px;
  background: #1a1a2e;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem;
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 2rem;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #aaa;
  cursor: pointer;
  text-align: right;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.nav-item.active,
.nav-item:hover {
  background: #16213e;
  color: #fff;
}
.sidebar-footer {
  border-top: 1px solid #333;
  padding-top: 1rem;
}
.admin-badge {
  font-size: 0.78rem;
  color: #aaa;
  margin-bottom: 0.5rem;
  word-break: break-all;
}
.logout-btn {
  width: 100%;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #555;
  background: transparent;
  color: #aaa;
  cursor: pointer;
}

/* Main */
.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
}
.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.search-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

/* Loading / Error */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #666;
  background: white;
  border-radius: 12px;
}
.error-state {
  padding: 1.5rem;
  background: #fff3f3;
  border: 1px solid #fcc;
  border-radius: 12px;
  color: #c00;
  text-align: center;
}
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e0e0e0;
  border-top-color: #1a73e8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}
.stat-value {
  font-size: 2rem;
  font-weight: 700;
}
.stat-label {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.25rem;
}
.stat-card.active .stat-value {
  color: #34a853;
}
.stat-card.trial .stat-value {
  color: #fbbc04;
}
.stat-card.pending .stat-value {
  color: #ea4335;
}
.stat-card.revenue .stat-value {
  color: #1a73e8;
}

/* Pending Alert */
.pending-alert {
  background: #fffbe6;
  border: 1px solid #ffd666;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-top: 1.5rem;
}
.pending-alert h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
}
.pending-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #ffe58f;
}
.pending-row:last-child {
  border-bottom: none;
}

/* Table */
.tenants-table-wrap {
  background: #fff;
  border-radius: 12px;
  overflow: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.tenants-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}
.tenants-table th {
  padding: 1rem;
  background: #f8f9fa;
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
}
.tenants-table td {
  padding: 0.85rem 1rem;
  border-top: 1px solid #f0f0f0;
  vertical-align: middle;
}
.tenants-table .row-pending {
  background: #fffbe6;
}

.school-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.school-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.school-name {
  font-weight: 600;
}
.school-slug {
  font-size: 0.75rem;
  color: #888;
}

/* Link cell */
.link-cell {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.school-link {
  color: #1a73e8;
  text-decoration: none;
  font-size: 0.8rem;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.school-link:hover {
  text-decoration: underline;
}
.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.15s;
}
.copy-btn:hover {
  background: #eee;
}

/* Actions */
.actions-cell {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.action-btn {
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  border: none;
  font-size: 0.78rem;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}
.action-btn.approve {
  background: #1a73e8;
  color: white;
}
.action-btn.approve:hover:not(:disabled) {
  background: #1557b0;
}
.action-btn.approve:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.action-btn.activate {
  background: #34a853;
  color: white;
}
.action-btn.activate:hover {
  background: #2d9248;
}
.action-btn.suspend {
  background: #ea4335;
  color: white;
}
.action-btn.suspend:hover {
  background: #c62828;
}

/* Badges */
.badge {
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge.active {
  background: #e6f4ea;
  color: #1e7e34;
}
.badge.trial {
  background: #fff8e1;
  color: #b06000;
}
.badge.pending {
  background: #fce8e6;
  color: #c62828;
}
.badge.suspended {
  background: #f1f3f4;
  color: #666;
}
.badge.plan {
  background: #e8f0fe;
  color: #1a73e8;
}
.badge.paid {
  background: #e6f4ea;
  color: #1e7e34;
}
.badge.overdue {
  background: #fce8e6;
  color: #c62828;
}

/* Buttons */
.btn-primary {
  padding: 0.5rem 1.25rem;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}
.btn-primary:hover {
  background: #1557b0;
}
.btn-cancel {
  padding: 0.5rem 1.25rem;
  background: #f1f3f4;
  color: #333;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  min-width: 360px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}
.modal-card h3 {
  margin: 0 0 1.5rem;
  font-size: 1.2rem;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
.field {
  margin-bottom: 1rem;
}
.field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
}
.field input,
.field select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  box-sizing: border-box;
}

/* Approval success modal */
.approval-modal {
  text-align: center;
}
.approval-success-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}
.approval-link-box {
  background: #f0f7ff;
  border: 1px solid #bdd7ff;
  border-radius: 10px;
  padding: 1rem;
  margin: 1.25rem 0;
  text-align: right;
}
.link-label {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #444;
}
.link-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.approval-link {
  flex: 1;
  color: #1a73e8;
  font-weight: 600;
  word-break: break-all;
  font-size: 0.9rem;
  text-decoration: none;
  direction: ltr;
}
.approval-link:hover {
  text-decoration: underline;
}
.link-hint {
  font-size: 0.78rem;
  color: #888;
  margin: 0;
}
.copy-btn-lg {
  padding: 0.4rem 0.8rem;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
}

/* Toast */
.toast-notification {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 9999;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
.toast-notification.success {
  background: #1e7e34;
}
.toast-notification.error {
  background: #c62828;
}
.toast-notification.info {
  background: #1a73e8;
}
.toast-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}
</style>
