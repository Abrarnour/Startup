<template>
  <div class="platform-shell">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">🏛️</span>
        <div>
          <p class="brand-name">المنصة</p>
          <p class="brand-sub">لوحة الإدارة العليا</p>
        </div>
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
          {{ item.label }}
        </button>
      </nav>

      <div class="sidebar-footer">
        <p>{{ adminName }}</p>
        <button @click="handleLogout" class="logout-btn">تسجيل الخروج</button>
      </div>
    </aside>

    <!-- Main -->
    <main class="main-content">
      <!-- ── Dashboard Stats ─────────────────────────── -->
      <div v-if="activeTab === 'dashboard'">
        <h1 class="page-title">الإحصائيات العامة</h1>

        <div v-if="statsLoading" class="loading-state">جاري التحميل...</div>
        <div v-else class="stats-grid">
          <div class="stat-card blue">
            <span class="stat-icon">🏫</span>
            <div>
              <p class="stat-value">{{ stats.total_schools }}</p>
              <p class="stat-label">إجمالي المدارس</p>
            </div>
          </div>
          <div class="stat-card green">
            <span class="stat-icon">✅</span>
            <div>
              <p class="stat-value">{{ stats.active_schools }}</p>
              <p class="stat-label">مدارس نشطة</p>
            </div>
          </div>
          <div class="stat-card orange">
            <span class="stat-icon">⏳</span>
            <div>
              <p class="stat-value">{{ stats.trial_schools }}</p>
              <p class="stat-label">في فترة التجربة</p>
            </div>
          </div>
          <div class="stat-card red">
            <span class="stat-icon">⛔</span>
            <div>
              <p class="stat-value">{{ stats.suspended_schools }}</p>
              <p class="stat-label">موقوفة</p>
            </div>
          </div>
          <div class="stat-card purple" style="grid-column: span 2">
            <span class="stat-icon">💰</span>
            <div>
              <p class="stat-value">
                {{ Number(stats.total_revenue || 0).toLocaleString('ar-DZ') }} دج
              </p>
              <p class="stat-label">إجمالي الإيرادات</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tenants List ────────────────────────────── -->
      <div v-if="activeTab === 'tenants'">
        <div class="page-header">
          <h1 class="page-title">إدارة المدارس</h1>
          <div class="header-actions">
            <input
              v-model="search"
              placeholder="بحث..."
              class="search-input"
              @input="loadTenants"
            />
            <select v-model="filterStatus" class="filter-select" @change="loadTenants">
              <option value="">كل الحالات</option>
              <option value="active">نشطة</option>
              <option value="trial">تجريبية</option>
              <option value="suspended">موقوفة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>

        <div v-if="tenantsLoading" class="loading-state">جاري التحميل...</div>

        <div v-else class="tenants-table-wrap">
          <table class="tenants-table">
            <thead>
              <tr>
                <th>المدرسة</th>
                <th>المسؤول</th>
                <th>المدينة</th>
                <th>الباقة</th>
                <th>الحالة</th>
                <th>تاريخ التسجيل</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in tenants" :key="t.id">
                <td>
                  <div class="school-cell">
                    <div class="school-color-dot" :style="{ background: t.primary_color }"></div>
                    <div>
                      <p class="school-name">{{ t.school_name }}</p>
                      <p class="school-slug">{{ t.slug }}.yourdomain.dz</p>
                    </div>
                  </div>
                </td>
                <td>{{ t.admin_email }}</td>
                <td>{{ t.city || '—' }}</td>
                <td>
                  <span class="badge plan">{{ t.plan_name }}</span>
                </td>
                <td>
                  <span class="badge" :class="t.status">{{ statusLabel(t.status) }}</span>
                </td>
                <td>{{ formatDate(t.created_at) }}</td>
                <td>
                  <div class="actions-cell">
                    <button
                      v-if="t.status !== 'active'"
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
                    <a
                      :href="`https://${t.slug}.yourdomain.dz`"
                      target="_blank"
                      class="action-btn view"
                    >
                      فتح ↗
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Invoices ────────────────────────────────── -->
      <div v-if="activeTab === 'invoices'">
        <div class="page-header">
          <h1 class="page-title">الفواتير</h1>
          <button class="btn-primary" @click="showInvoiceModal = true">+ إنشاء فاتورة</button>
        </div>

        <div v-if="invoicesLoading" class="loading-state">جاري التحميل...</div>
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
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Invoice Modal -->
    <div v-if="showInvoiceModal" class="modal-overlay" @click.self="showInvoiceModal = false">
      <div class="modal-card">
        <h3>إنشاء فاتورة جديدة</h3>
        <div class="field">
          <label>المدرسة</label>
          <select v-model="newInvoice.tenantId">
            <option v-for="t in tenants" :key="t.id" :value="t.id">{{ t.school_name }}</option>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  platformGetStats,
  platformGetTenants,
  platformSetStatus,
  platformGetInvoices,
  platformCreateInvoice,
} from '../../services/api.js'

const router = useRouter()
const activeTab = ref('dashboard')

const adminName = JSON.parse(localStorage.getItem('platform_admin') || '{}')?.email || 'Admin'

const navItems = [
  { key: 'dashboard', label: 'الإحصائيات', icon: '📊' },
  { key: 'tenants', label: 'المدارس', icon: '🏫' },
  { key: 'invoices', label: 'الفواتير', icon: '🧾' },
]

// Stats
const stats = ref({})
const statsLoading = ref(false)

// Tenants
const tenants = ref([])
const tenantsLoading = ref(false)
const search = ref('')
const filterStatus = ref('')

// Invoices
const invoices = ref([])
const invoicesLoading = ref(false)
const showInvoiceModal = ref(false)
const newInvoice = ref({ tenantId: '', amountDzd: '', dueDate: '', note: '' })

onMounted(() => {
  loadStats()
  loadTenants()
  loadInvoices()
})

async function loadStats() {
  statsLoading.value = true
  stats.value = await platformGetStats().catch(() => ({}))
  statsLoading.value = false
}

async function loadTenants() {
  tenantsLoading.value = true
  const params = new URLSearchParams()
  if (search.value) params.set('search', search.value)
  if (filterStatus.value) params.set('status', filterStatus.value)
  const data = await platformGetTenants(params.toString()).catch(() => ({ tenants: [] }))
  tenants.value = data.tenants || []
  tenantsLoading.value = false
}

async function loadInvoices() {
  invoicesLoading.value = true
  invoices.value = await platformGetInvoices().catch(() => [])
  invoicesLoading.value = false
}

async function changeStatus(tenant, status) {
  const label = statusLabel(status)
  if (!confirm(`تغيير حالة "${tenant.school_name}" إلى: ${label}؟`)) return
  await platformSetStatus(tenant.id, status)
  loadTenants()
  loadStats()
}

async function createInvoice() {
  await platformCreateInvoice(newInvoice.value)
  showInvoiceModal.value = false
  newInvoice.value = { tenantId: '', amountDzd: '', dueDate: '', note: '' }
  loadInvoices()
}

function handleLogout() {
  localStorage.removeItem('platform_token')
  localStorage.removeItem('platform_admin')
  router.push('/login')
}

const statusLabel = (s) =>
  ({ active: 'نشطة', trial: 'تجريبية', suspended: 'موقوفة', cancelled: 'ملغاة' })[s] || s
const invoiceStatusLabel = (s) => ({ pending: 'معلقة', paid: 'مدفوعة', overdue: 'متأخرة' })[s] || s
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('ar-DZ') : '—')
</script>

<style scoped>
.platform-shell {
  display: flex;
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, sans-serif;
  direction: rtl;
  background: #f4f6fb;
}

/* Sidebar */
.sidebar {
  width: 240px;
  background: #1a1a2e;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  flex-shrink: 0;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.brand-icon {
  font-size: 2rem;
}
.brand-name {
  font-weight: bold;
  font-size: 1rem;
  margin: 0;
}
.brand-sub {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 0.95rem;
  text-align: right;
  transition: all 0.2s;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}
.nav-item.active {
  background: #1a73e8;
  color: white;
}
.nav-icon {
  font-size: 1.1rem;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.sidebar-footer p {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 8px;
}
.logout-btn {
  width: 100%;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 0.85rem;
}

/* Main */
.main-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.page-title {
  font-size: 1.6rem;
  color: #1a1a2e;
  margin: 0 0 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}
.page-header .page-title {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}
.search-input {
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  outline: none;
  font-size: 0.9rem;
  width: 200px;
}
.filter-select {
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  outline: none;
  font-size: 0.9rem;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.stat-icon {
  font-size: 2rem;
}
.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #1a1a2e;
  margin: 0;
}
.stat-label {
  font-size: 0.8rem;
  color: #888;
  margin: 0;
}
.stat-card.blue {
  border-right: 4px solid #1a73e8;
}
.stat-card.green {
  border-right: 4px solid #34a853;
}
.stat-card.orange {
  border-right: 4px solid #f9a825;
}
.stat-card.red {
  border-right: 4px solid #e53935;
}
.stat-card.purple {
  border-right: 4px solid #8e24aa;
}

/* Table */
.tenants-table-wrap {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
.tenants-table {
  width: 100%;
  border-collapse: collapse;
}
.tenants-table th {
  background: #f8f9fa;
  padding: 14px 16px;
  font-size: 0.85rem;
  color: #555;
  font-weight: 600;
  text-align: right;
}
.tenants-table td {
  padding: 14px 16px;
  border-top: 1px solid #f0f0f0;
  font-size: 0.9rem;
  color: #333;
}
.tenants-table tr:hover td {
  background: #fafafa;
}

.school-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.school-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.school-name {
  font-weight: 600;
  margin: 0;
}
.school-slug {
  font-size: 0.75rem;
  color: #888;
  margin: 0;
  direction: ltr;
}

.badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge.active {
  background: #e8f5e9;
  color: #2e7d32;
}
.badge.trial {
  background: #fff8e1;
  color: #f57f17;
}
.badge.suspended {
  background: #ffebee;
  color: #c62828;
}
.badge.cancelled {
  background: #f5f5f5;
  color: #757575;
}
.badge.paid {
  background: #e8f5e9;
  color: #2e7d32;
}
.badge.pending {
  background: #fff8e1;
  color: #f57f17;
}
.badge.overdue {
  background: #ffebee;
  color: #c62828;
}
.badge.plan {
  background: #e3f2fd;
  color: #1565c0;
}

.actions-cell {
  display: flex;
  gap: 6px;
}
.action-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  transition: opacity 0.2s;
}
.action-btn:hover {
  opacity: 0.8;
}
.action-btn.activate {
  background: #e8f5e9;
  color: #2e7d32;
}
.action-btn.suspend {
  background: #ffebee;
  color: #c62828;
}
.action-btn.view {
  background: #e3f2fd;
  color: #1565c0;
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
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 420px;
}
.modal-card h3 {
  margin: 0 0 24px;
  font-size: 1.2rem;
}
.field {
  margin-bottom: 16px;
}
.field label {
  display: block;
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 6px;
}
.field input,
.field select {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  box-sizing: border-box;
}
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 24px;
}
.btn-primary {
  padding: 10px 20px;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
}
.btn-cancel {
  padding: 10px 20px;
  background: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.loading-state {
  text-align: center;
  padding: 48px;
  color: #888;
}
</style>
