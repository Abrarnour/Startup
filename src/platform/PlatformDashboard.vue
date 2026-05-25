<template>
  <div class="platform-shell">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">🏫</span>
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

        <div v-else class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.total_schools || 0 }}</div>
            <div class="stat-label">إجمالي المدارس</div>
          </div>
          <div class="stat-card active">
            <div class="stat-value">{{ stats.active_schools || 0 }}</div>
            <div class="stat-label">نشطة</div>
          </div>
          <div class="stat-card trial">
            <div class="stat-value">{{ stats.trial_schools || 0 }}</div>
            <div class="stat-label">تجريبية</div>
          </div>
          <div class="stat-card pending">
            <div class="stat-value">{{ stats.pending_schools || 0 }}</div>
            <div class="stat-label">بانتظار الموافقة</div>
          </div>
          <div class="stat-card revenue">
            <div class="stat-value">
              {{ Number(stats.total_revenue || 0).toLocaleString('ar-DZ') }} دج
            </div>
            <div class="stat-label">الإيرادات الإجمالية</div>
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
            <select v-model="filterStatus" class="search-input" style="min-width:130px" @change="loadTenants">
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

        <div v-else-if="tenants.length === 0" class="loading-state" style="color:#888">
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
                      <p class="school-slug">{{ t.slug }}.plateforme.dz</p>
                    </div>
                  </div>
                </td>
                <td>
                  <img
                    v-if="t.logo_url"
                    :src="t.logo_url"
                    alt="Logo"
                    style="height:32px;width:32px;border-radius:50%;object-fit:cover;border:2px solid #eee"
                  />
                  <span v-else style="color:#ccc;font-size:1.4rem">🏫</span>
                </td>
                <td>
                  <div>
                    <p style="font-size:0.85rem">{{ t.admin_email }}</p>
                    <p v-if="t.admin_phone" style="font-size:0.75rem;color:#888">{{ t.admin_phone }}</p>
                  </div>
                </td>
                <td>{{ t.city || '—' }}</td>
                <td><span class="badge plan">{{ t.plan_name || '—' }}</span></td>
                <td><span class="badge" :class="t.status">{{ statusLabel(t.status) }}</span></td>
                <td>{{ formatDate(t.created_at) }}</td>
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
                    >تفعيل</button>
                    <button
                      v-if="t.status === 'active'"
                      class="action-btn suspend"
                      @click="changeStatus(t, 'suspended')"
                    >إيقاف</button>
                    <a
                      v-if="t.status !== 'pending'"
                      :href="`http://${t.slug}.localhost:5173`"
                      target="_blank"
                      class="action-btn view"
                    >فتح ↗</a>
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
                <td><span class="badge" :class="inv.status">{{ invoiceStatusLabel(inv.status) }}</span></td>
                <td>{{ formatDate(inv.due_date) }}</td>
                <td>{{ inv.paid_at ? formatDate(inv.paid_at) : '—' }}</td>
              </tr>
              <tr v-if="invoices.length === 0">
                <td colspan="6" style="text-align:center;color:#888;padding:2rem">لا توجد فواتير</td>
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
            <option v-for="ten in tenants" :key="ten.id" :value="ten.id">{{ ten.school_name }}</option>
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
import { ref, onMounted } from 'vue'
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

const navItems = [
  { key: 'dashboard', label: 'الإحصائيات', icon: '📊' },
  { key: 'tenants', label: 'المدارس', icon: '🏫' },
  { key: 'invoices', label: 'الفواتير', icon: '🧾' },
]

const toastMessage = ref(null)
const toastType = ref('success')

const stats = ref({})
const statsLoading = ref(false)

const tenants = ref([])
const tenantsLoading = ref(false)
const search = ref('')
const filterStatus = ref('')
const approvingId = ref(null)  // track which tenant is being approved

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
  try {
    stats.value = await platformGetStats()
  } catch {
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

async function approveSchool(tenant) {
  if (!confirm(`هل تريد الموافقة على "${tenant.school_name}" وإنشاء قاعدة البيانات الخاصة بها؟\nهذه العملية قد تستغرق 30 ثانية.`)) return

  approvingId.value = tenant.id
  try {
    const result = await platformApproveTenant(tenant.id)
    if (result.success) {
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
  setTimeout(() => { toastMessage.value = null }, 5000)
}

const statusLabel = (s) => ({
  active: 'نشطة', trial: 'تجريبية', suspended: 'موقوفة',
  cancelled: 'ملغاة', pending: 'بانتظار الموافقة',
})[s] || s

const invoiceStatusLabel = (s) => ({ pending: 'معلقة', paid: 'مدفوعة', overdue: 'متأخرة' })[s] || s
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('ar-DZ') : '—')
</script>

<style scoped>
.platform-shell { display: flex; min-height: 100vh; background: #f0f2f5; }

/* Sidebar */
.sidebar { width: 220px; background: #1a1a2e; color: #fff; display: flex; flex-direction: column; padding: 1.5rem 1rem; }
.sidebar-brand { display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; font-weight: 700; margin-bottom: 2rem; }
.sidebar-nav { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
.nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 8px; border: none; background: transparent; color: #aaa; cursor: pointer; text-align: right; font-size: 0.9rem; transition: all 0.2s; }
.nav-item.active, .nav-item:hover { background: #16213e; color: #fff; }
.sidebar-footer { border-top: 1px solid #333; padding-top: 1rem; }
.admin-badge { font-size: 0.78rem; color: #aaa; margin-bottom: 0.5rem; word-break: break-all; }
.logout-btn { width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid #555; background: transparent; color: #aaa; cursor: pointer; }

/* Main */
.main-content { flex: 1; padding: 2rem; overflow-y: auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
.page-title { font-size: 1.5rem; font-weight: 700; }
.header-actions { display: flex; gap: 0.75rem; align-items: center; }
.search-input { padding: 0.5rem 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 0.9rem; }

/* Loading */
.loading-state { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 3rem; color: #666; background: white; border-radius: 12px; }
.spinner { width: 24px; height: 24px; border: 3px solid #e0e0e0; border-top-color: #1a73e8; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Stats */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
.stat-card { background: #fff; border-radius: 12px; padding: 1.5rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.stat-value { font-size: 2rem; font-weight: 700; }
.stat-label { font-size: 0.85rem; color: #666; margin-top: 0.25rem; }
.stat-card.active .stat-value { color: #34a853; }
.stat-card.trial .stat-value { color: #fbbc04; }
.stat-card.pending .stat-value { color: #ea4335; }
.stat-card.revenue .stat-value { color: #1a73e8; }

/* Table */
.tenants-table-wrap { background: #fff; border-radius: 12px; overflow: auto; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.tenants-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.tenants-table th { background: #f8f9fa; padding: 0.875rem 1rem; text-align: right; font-weight: 600; border-bottom: 1px solid #eee; }
.tenants-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
.school-cell { display: flex; align-items: center; gap: 0.75rem; }
.school-color-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.school-name { font-weight: 600; }
.school-slug { font-size: 0.72rem; color: #888; }

/* Badges */
.badge { padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.78rem; font-weight: 500; }
.badge.active { background: #e8f5e9; color: #2e7d32; }
.badge.trial { background: #fff8e1; color: #f57c00; }
.badge.pending { background: #fce4ec; color: #c62828; }
.badge.suspended { background: #ffebee; color: #b71c1c; }
.badge.cancelled { background: #f5f5f5; color: #616161; }
.badge.plan { background: #e3f2fd; color: #1565c0; }
.badge.paid { background: #e8f5e9; color: #2e7d32; }
.badge.overdue { background: #ffebee; color: #b71c1c; }

/* Actions */
.actions-cell { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.action-btn { padding: 0.3rem 0.65rem; border-radius: 6px; border: none; cursor: pointer; font-size: 0.78rem; font-weight: 500; text-decoration: none; transition: all 0.2s; }
.action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.action-btn.approve { background: #e8f5e9; color: #2e7d32; }
.action-btn.activate { background: #e3f2fd; color: #1565c0; }
.action-btn.suspend { background: #ffebee; color: #b71c1c; }
.action-btn.view { background: #f3e5f5; color: #6a1b9a; }

/* Buttons */
.btn-primary { padding: 0.5rem 1.25rem; background: #1a73e8; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: opacity 0.2s; }
.btn-primary:hover { opacity: 0.9; }
.btn-cancel { padding: 0.5rem 1.25rem; background: #f5f5f5; color: #333; border: none; border-radius: 8px; cursor: pointer; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: #fff; border-radius: 12px; padding: 2rem; width: 400px; max-width: 90vw; display: flex; flex-direction: column; gap: 1rem; }
.modal-card h3 { font-size: 1.1rem; font-weight: 700; }
.field { display: flex; flex-direction: column; gap: 0.3rem; }
.field label { font-size: 0.83rem; color: #555; }
.field input, .field select { padding: 0.5rem 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 0.9rem; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 0.5rem; }

/* Toast */
.toast-notification { position: fixed; bottom: 1.5rem; right: 1.5rem; background: #323232; color: #fff; padding: 1rem 1.5rem; border-radius: 10px; display: flex; align-items: center; gap: 1rem; z-index: 9999; font-size: 0.9rem; max-width: 380px; }
.toast-notification.error { background: #c62828; }
.toast-notification.success { background: #2e7d32; }
.toast-close { background: none; border: none; color: #fff; font-size: 1.4rem; cursor: pointer; opacity: 0.7; }
.toast-close:hover { opacity: 1; }
</style>