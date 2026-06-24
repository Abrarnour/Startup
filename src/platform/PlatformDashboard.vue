<template>
  <div class="pd-shell" dir="rtl">
    <!-- ── Sidebar ─────────────────────────────── -->
    <aside class="pd-sidebar">
      <div class="pd-sidebar-top">
        <div class="pd-brand">
          <div class="pd-brand-icon">
            <img
              src="/logoMUDAR.png"
              alt="MUDAR"
              style="width: 100%; height: 100%; object-fit: contain; border-radius: 6px"
            />
          </div>
          <span>MUDAR</span>
        </div>

        <nav class="pd-nav">
          <button
            v-for="item in navItems"
            :key="item.key"
            class="pd-nav-item"
            :class="{ active: activeTab === item.key }"
            @click="activeTab = item.key"
          >
            <span class="pd-nav-icon" v-html="item.icon"></span>
            <span>{{ item.label }}</span>
            <span v-if="item.key === 'tenants' && pendingTenants.length > 0" class="pd-badge-count">
              {{ pendingTenants.length }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Demo link -->
      <div class="pd-demo-wrap">
        <a :href="demoSchoolLink" target="_blank" class="pd-demo-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          فتح المنصة
        </a>
      </div>

      <div class="pd-sidebar-footer">
        <div class="pd-admin-info">
          <div class="pd-admin-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div class="pd-admin-text">
            <span class="pd-admin-role">Super Admin</span>
            <span class="pd-admin-email">{{ adminName }}</span>
          </div>
        </div>
        <button class="pd-logout-btn" @click="handleLogout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          خروج
        </button>
      </div>
    </aside>

    <!-- ── Main ──────────────────────────────────── -->
    <main class="pd-main">
      <!-- ═══ DASHBOARD TAB ═══════════════════════ -->
      <div v-if="activeTab === 'dashboard'">
        <div class="pd-page-header">
          <div>
            <h1 class="pd-page-title">إحصائيات المنصة</h1>
            <p class="pd-page-subtitle">نظرة عامة على جميع المدارس والإيرادات</p>
          </div>
          <div class="pd-header-actions">
            <a :href="demoSchoolLink" target="_blank" class="pd-btn-outline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              فتح المنصة
            </a>
            <button class="pd-btn-primary" @click="loadStats">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              تحديث
            </button>
          </div>
        </div>

        <div v-if="statsLoading" class="pd-loading">
          <div class="pd-spinner"></div>
          <span>تحميل الإحصائيات...</span>
        </div>
        <div v-else-if="statsError" class="pd-error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {{ statsError }}
        </div>
        <div v-else class="pd-stats-grid">
          <div class="pd-stat-card pd-stat-total">
            <div class="pd-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div class="pd-stat-value">{{ stats.total_schools || 0 }}</div>
            <div class="pd-stat-label">إجمالي المدارس</div>
          </div>
          <div class="pd-stat-card pd-stat-active">
            <div class="pd-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div class="pd-stat-value">{{ stats.active_schools || 0 }}</div>
            <div class="pd-stat-label">نشطة</div>
          </div>
          <div class="pd-stat-card pd-stat-trial">
            <div class="pd-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path
                  d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0a2 2 0 1 1-4 0m4 0a2 2 0 1 0 4 0m-4 0h4m4-11v11m0 0a2 2 0 1 1-4 0m4 0a2 2 0 1 0 4 0"
                />
              </svg>
            </div>
            <div class="pd-stat-value">{{ stats.trial_schools || 0 }}</div>
            <div class="pd-stat-label">تجريبية</div>
          </div>
          <div class="pd-stat-card pd-stat-pending">
            <div class="pd-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div class="pd-stat-value">{{ stats.pending_schools || 0 }}</div>
            <div class="pd-stat-label">بانتظار الموافقة</div>
          </div>
          <div class="pd-stat-card pd-stat-revenue">
            <div class="pd-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div class="pd-stat-value">
              {{ Number(stats.total_revenue || 0).toLocaleString('ar-DZ') }} دج
            </div>
            <div class="pd-stat-label">الإيرادات الإجمالية</div>
          </div>
        </div>

        <!-- Pending alert -->
        <div v-if="pendingTenants.length > 0" class="pd-pending-alert">
          <div class="pd-pending-alert-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <h3>طلبات بانتظار الموافقة ({{ pendingTenants.length }})</h3>
          </div>
          <div v-for="t in pendingTenants" :key="t.id" class="pd-pending-row">
            <div class="pd-pending-info">
              <div class="pd-school-dot" :style="{ background: t.primary_color }"></div>
              <div>
                <strong>{{ t.school_name }}</strong>
                <span class="pd-meta">{{ t.admin_email }}</span>
                <span class="pd-meta">{{ t.city || '—' }}</span>
              </div>
            </div>
            <button
              class="pd-btn-approve"
              :disabled="approvingId === t.id"
              @click="approveSchool(t)"
            >
              <svg
                v-if="approvingId !== t.id"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span v-if="approvingId === t.id" class="pd-spinner-sm"></span>
              {{ approvingId === t.id ? 'جاري الإنشاء...' : 'موافقة وإنشاء' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ═══ TENANTS TAB ══════════════════════════ -->
      <div v-if="activeTab === 'tenants'">
        <div class="pd-page-header">
          <div>
            <h1 class="pd-page-title">إدارة المدارس</h1>
            <p class="pd-page-subtitle">جميع المدارس المسجلة في المنصة</p>
          </div>
          <div class="pd-header-actions">
            <div class="pd-search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                v-model="search"
                placeholder="بحث باسم أو بريد..."
                class="pd-search-input"
                @input="loadTenants"
              />
            </div>
            <select v-model="filterStatus" class="pd-select" @change="loadTenants">
              <option value="">كل الحالات</option>
              <option value="pending">بانتظار الموافقة</option>
              <option value="trial">تجريبية</option>
              <option value="active">نشطة</option>
              <option value="suspended">موقوفة</option>
            </select>
          </div>
        </div>

        <div v-if="tenantsLoading" class="pd-loading">
          <div class="pd-spinner"></div>
          <span>تحميل قائمة المدارس...</span>
        </div>
        <div v-else-if="tenants.length === 0" class="pd-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p>لا توجد مدارس مطابقة</p>
        </div>
        <div v-else class="pd-table-wrap">
          <table class="pd-table">
            <thead>
              <tr>
                <th>المدرسة</th>
                <th>الشعار</th>
                <th>المسؤول</th>
                <th>الولاية</th>
                <th>الباقة</th>
                <th>الحالة</th>
                <th>التسجيل</th>
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
                  <div class="pd-school-cell">
                    <div class="pd-school-dot" :style="{ background: t.primary_color }"></div>
                    <div>
                      <p class="pd-school-name">{{ t.school_name }}</p>
                      <p class="pd-school-slug">/{{ t.slug }}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <img
                    v-if="t.logo_url"
                    :src="resolveLogoUrl(t.logo_url)"
                    alt="Logo"
                    class="pd-logo-img"
                  />
                  <div v-else class="pd-logo-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                  </div>
                </td>
                <td>
                  <p class="pd-email">{{ t.admin_email }}</p>
                  <p v-if="t.admin_phone" class="pd-phone">{{ t.admin_phone }}</p>
                </td>
                <td>{{ t.city || '—' }}</td>
                <td>
                  <span class="pd-chip pd-chip-plan">{{ t.plan_name || '—' }}</span>
                  <br />
                  <button class="pd-btn-plan-change" @click="openPlanModal(t)">تغيير الباقة</button>
                </td>
                <td>
                  <span class="pd-chip" :class="'pd-chip-' + t.status">{{
                    statusLabel(t.status)
                  }}</span>
                </td>
                <td>{{ formatDate(t.created_at) }}</td>
                <td>
                  <div v-if="t.status !== 'pending'" class="pd-link-cell">
                    <a
                      :href="schoolLink(t.slug)"
                      target="_blank"
                      class="pd-school-link"
                      :title="schoolLink(t.slug)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      {{ t.slug }}
                    </a>
                    <button class="pd-icon-btn" @click="copyLink(t.slug)" title="نسخ">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                  </div>
                  <span v-else class="pd-no-link">— لم يُنشأ بعد</span>
                </td>
                <td>
                  <div class="pd-actions-cell">
                    <!-- Approve -->
                    <button
                      v-if="t.status === 'pending'"
                      class="pd-act-btn pd-act-approve"
                      :disabled="approvingId === t.id"
                      @click="approveSchool(t)"
                    >
                      <span v-if="approvingId === t.id" class="pd-spinner-sm"></span>
                      <svg
                        v-else
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {{ approvingId === t.id ? '...' : 'موافقة' }}
                    </button>
                    <!-- Activate -->
                    <button
                      v-if="t.status !== 'active' && t.status !== 'pending'"
                      class="pd-act-btn pd-act-activate"
                      @click="changeStatus(t, 'active')"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      تفعيل
                    </button>
                    <!-- Suspend -->
                    <button
                      v-if="t.status === 'active' || t.status === 'trial'"
                      class="pd-act-btn pd-act-suspend"
                      @click="changeStatus(t, 'suspended')"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                      إيقاف
                    </button>
                    <!-- Delete -->
                    <button class="pd-act-btn pd-act-delete" @click="deleteTenant(t)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ═══ INVOICES TAB ══════════════════════════ -->
      <div v-if="activeTab === 'invoices'">
        <div class="pd-page-header">
          <div>
            <h1 class="pd-page-title">الفواتير والاشتراكات</h1>
            <p class="pd-page-subtitle">متابعة فواتير المدارس في الوقت الفعلي</p>
          </div>
          <div style="display: flex; gap: 0.75rem; align-items: center">
            <button class="pd-btn-outline pd-btn-sm" @click="loadBillingSummary" title="تحديث">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                style="width: 15px; height: 15px"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              تحديث
            </button>
            <button class="pd-btn-primary" @click="showInvoiceModal = true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              فاتورة جديدة
            </button>
          </div>
        </div>

        <!-- ── KPI strip ────────────────────────────────── -->
        <div class="inv-kpi-row">
          <div class="inv-kpi inv-kpi-blue">
            <div class="inv-kpi-val">{{ invoiceKpi.total_schools }}</div>
            <div class="inv-kpi-lbl">مدرسة نشطة</div>
          </div>
          <div class="inv-kpi inv-kpi-green">
            <div class="inv-kpi-val">
              {{ Number(invoiceKpi.total_paid).toLocaleString('ar-DZ') }} <small>دج</small>
            </div>
            <div class="inv-kpi-lbl">إجمالي المحصّل</div>
          </div>
          <div class="inv-kpi inv-kpi-orange">
            <div class="inv-kpi-val">
              {{ Number(invoiceKpi.total_pending).toLocaleString('ar-DZ') }} <small>دج</small>
            </div>
            <div class="inv-kpi-lbl">في انتظار الدفع</div>
          </div>
          <div class="inv-kpi inv-kpi-red">
            <div class="inv-kpi-val">{{ invoiceKpi.overdue_count }}</div>
            <div class="inv-kpi-lbl">فاتورة متأخرة</div>
          </div>
          <div class="inv-kpi inv-kpi-purple">
            <div class="inv-kpi-val">{{ invoiceKpi.trial_expiring }}</div>
            <div class="inv-kpi-lbl">تجريبية تنتهي قريباً</div>
          </div>
        </div>

        <!-- ── View toggle ──────────────────────────────── -->
        <div class="inv-toolbar">
          <div class="inv-view-toggle">
            <button :class="{ active: invoiceView === 'schools' }" @click="invoiceView = 'schools'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              حسب المدرسة
            </button>
            <button :class="{ active: invoiceView === 'list' }" @click="invoiceView = 'list'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              قائمة الفواتير
            </button>
          </div>
          <div class="inv-filters">
            <select v-model="invoiceFilterStatus" class="pd-select" @change="filterInvoiceList">
              <option value="">كل الحالات</option>
              <option value="pending">معلقة</option>
              <option value="paid">مدفوعة</option>
              <option value="overdue">متأخرة</option>
            </select>
          </div>
        </div>

        <div v-if="invoicesLoading" class="pd-loading">
          <div class="pd-spinner"></div>
          <span>تحميل البيانات...</span>
        </div>

        <!-- ══ SCHOOLS VIEW ════════════════════════════════ -->
        <div v-else-if="invoiceView === 'schools'" class="inv-schools-grid">
          <div
            v-for="school in billingSummary"
            :key="school.id"
            class="inv-school-card"
            :class="{
              'inv-card-overdue': school.overdue_count > 0,
              'inv-card-trial': school.tenant_status === 'trial',
              'inv-card-ok': school.tenant_status === 'active' && school.overdue_count === 0,
            }"
          >
            <!-- Card header -->
            <div class="inv-card-header">
              <div class="inv-card-logo" :style="{ background: school.primary_color || '#7c3aed' }">
                <img v-if="school.logo_url" :src="resolveLogoUrl(school.logo_url)" alt="" />
                <span v-else>{{ (school.school_name || '؟')[0] }}</span>
              </div>
              <div class="inv-card-meta">
                <div class="inv-card-name">{{ school.school_name }}</div>
                <a :href="schoolLink(school.slug)" target="_blank" class="inv-card-slug">
                  /school/{{ school.slug }}
                </a>
              </div>
              <div class="inv-card-status-badge" :class="'inv-status-' + school.tenant_status">
                {{ statusLabel(school.tenant_status) }}
              </div>
            </div>

            <!-- Trial countdown -->
            <div
              v-if="school.tenant_status === 'trial' && school.trial_ends_at"
              class="inv-trial-bar"
            >
              <div class="inv-trial-bar-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{{ trialCountdown(school.trial_ends_at) }}</span>
              </div>
              <div class="inv-trial-progress">
                <div
                  class="inv-trial-fill"
                  :style="{ width: trialProgress(school.trial_ends_at) + '%' }"
                ></div>
              </div>
            </div>

            <!-- Plan info -->
            <div class="inv-card-plan">
              <div class="inv-plan-chip" :class="'inv-plan-' + (school.plan_name || 'trial')">
                {{ school.plan_name_ar || school.plan_name || 'تجريبية' }}
              </div>
              <span class="inv-plan-price">
                {{
                  school.plan_price_dzd > 0
                    ? Number(school.plan_price_dzd).toLocaleString() + ' دج/شهر'
                    : 'مجاناً'
                }}
              </span>
            </div>

            <!-- Billing stats -->
            <div class="inv-card-stats">
              <div class="inv-stat">
                <div class="inv-stat-val inv-stat-green">
                  {{ Number(school.total_paid).toLocaleString('ar-DZ') }} دج
                </div>
                <div class="inv-stat-lbl">محصّل</div>
              </div>
              <div class="inv-stat">
                <div
                  class="inv-stat-val"
                  :class="school.total_pending > 0 ? 'inv-stat-orange' : ''"
                >
                  {{ Number(school.total_pending).toLocaleString('ar-DZ') }} دج
                </div>
                <div class="inv-stat-lbl">معلق</div>
              </div>
              <div class="inv-stat">
                <div class="inv-stat-val" :class="school.overdue_count > 0 ? 'inv-stat-red' : ''">
                  {{ school.overdue_count }}
                </div>
                <div class="inv-stat-lbl">متأخر</div>
              </div>
            </div>

            <!-- Next due / last paid -->
            <div class="inv-card-dates">
              <div v-if="school.next_due_date" class="inv-date-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span
                  >استحقاق: <strong>{{ formatDate(school.next_due_date) }}</strong></span
                >
                <span
                  class="inv-due-badge"
                  :class="isDueUrgent(school.next_due_date) ? 'inv-due-urgent' : 'inv-due-normal'"
                >
                  {{ dueIn(school.next_due_date) }}
                </span>
              </div>
              <div v-if="school.last_paid_at" class="inv-date-row inv-date-muted">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>آخر دفع: {{ formatDate(school.last_paid_at) }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="inv-card-actions">
              <button class="inv-btn-new-inv" @click="openInvoiceForSchool(school)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                فاتورة
              </button>
              <button class="inv-btn-view-inv" @click="viewSchoolInvoices(school)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                الفواتير ({{ school.pending_count + school.overdue_count }})
              </button>
            </div>
          </div>
        </div>

        <!-- ══ LIST VIEW ═══════════════════════════════════ -->
        <div v-else class="inv-list-wrap">
          <div
            v-for="inv in filteredInvoices"
            :key="inv.id"
            class="inv-list-row"
            :class="{
              'inv-row-paid': inv.status === 'paid',
              'inv-row-overdue': inv.status === 'overdue',
              'inv-row-pending': inv.status === 'pending',
            }"
          >
            <!-- School avatar -->
            <div class="inv-row-logo" :style="{ background: inv.primary_color || '#7c3aed' }">
              <img v-if="inv.logo_url" :src="resolveLogoUrl(inv.logo_url)" alt="" />
              <span v-else>{{ (inv.school_name || '؟')[0] }}</span>
            </div>

            <!-- Main info -->
            <div class="inv-row-main">
              <div class="inv-row-school">{{ inv.school_name }}</div>
              <div class="inv-row-sub">
                <span class="pd-chip pd-chip-plan" style="font-size: 0.7rem; padding: 1px 7px">{{
                  inv.plan_name_ar || inv.plan_name || '—'
                }}</span>
                <span class="inv-row-period" v-if="inv.period_start">
                  {{ formatDate(inv.period_start) }} → {{ formatDate(inv.period_end) }}
                </span>
                <span v-if="inv.note" class="inv-row-note">{{ inv.note }}</span>
              </div>
            </div>

            <!-- Amount -->
            <div class="inv-row-amount">
              {{ Number(inv.amount_dzd).toLocaleString('ar-DZ') }}
              <small>دج</small>
            </div>

            <!-- Payment method -->
            <div class="inv-row-method">
              <span class="pd-chip" :class="'pd-chip-payment-' + (inv.payment_method || 'manual')">
                {{ paymentMethodLabel(inv.payment_method) }}
              </span>
            </div>

            <!-- Status + dates -->
            <div class="inv-row-dates">
              <span class="pd-chip" :class="'pd-chip-' + inv.status">{{
                invoiceStatusLabel(inv.status)
              }}</span>
              <div class="inv-due-line" v-if="inv.status !== 'paid'">
                استحقاق: {{ formatDate(inv.due_date) }}
                <span
                  class="inv-due-badge"
                  :class="isDueUrgent(inv.due_date) ? 'inv-due-urgent' : 'inv-due-normal'"
                >
                  {{ dueIn(inv.due_date) }}
                </span>
              </div>
              <div class="inv-paid-line" v-else>دُفع: {{ formatDate(inv.paid_at) }}</div>
            </div>

            <!-- Action -->
            <div class="inv-row-action">
              <button
                v-if="inv.status !== 'paid'"
                class="pd-btn-pay-now"
                @click="markInvoicePaid(inv)"
              >
                ✓ دفع
              </button>
              <span v-else class="inv-paid-check">✓</span>
            </div>
          </div>
          <div v-if="filteredInvoices.length === 0" class="pd-empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            لا توجد فواتير
          </div>
        </div>

        <!-- School invoices drawer -->
        <div
          v-if="schoolInvoicesDrawer"
          class="inv-drawer-overlay"
          @click.self="schoolInvoicesDrawer = null"
        >
          <div class="inv-drawer">
            <div class="inv-drawer-header">
              <h3>فواتير: {{ schoolInvoicesDrawer.school_name }}</h3>
              <button class="pd-icon-btn" @click="schoolInvoicesDrawer = null">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div class="inv-drawer-body">
              <div v-if="drawerInvoicesLoading" class="pd-loading">
                <div class="pd-spinner"></div>
              </div>
              <div
                v-for="inv in drawerInvoices"
                :key="inv.id"
                class="inv-drawer-row"
                :class="'inv-row-' + inv.status"
              >
                <div>
                  <div class="inv-drawer-amount">
                    {{ Number(inv.amount_dzd).toLocaleString('ar-DZ') }} دج
                  </div>
                  <div class="inv-drawer-sub">
                    <span class="pd-chip" :class="'pd-chip-' + inv.status">{{
                      invoiceStatusLabel(inv.status)
                    }}</span>
                    <span
                      class="pd-chip"
                      :class="'pd-chip-payment-' + (inv.payment_method || 'manual')"
                      >{{ paymentMethodLabel(inv.payment_method) }}</span
                    >
                    <span v-if="inv.note" style="font-size: 0.75rem; color: #7c6f9a">{{
                      inv.note
                    }}</span>
                  </div>
                  <div class="inv-drawer-dates">
                    استحقاق: {{ formatDate(inv.due_date) }}
                    <span v-if="inv.paid_at"> · دُفع: {{ formatDate(inv.paid_at) }}</span>
                  </div>
                </div>
                <button
                  v-if="inv.status !== 'paid'"
                  class="pd-btn-pay-now"
                  @click="handlePayNow(inv)"
                >
                  ✓
                </button>
              </div>
              <div v-if="!drawerInvoicesLoading && drawerInvoices.length === 0" class="pd-td-empty">
                لا توجد فواتير لهذه المدرسة
              </div>
            </div>
            <div class="inv-drawer-footer">
              <button class="pd-btn-primary" @click="openInvoiceForSchool(schoolInvoicesDrawer)">
                + فاتورة جديدة
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ── Approval Success Modal ──────────────── -->
    <div v-if="approvalResult" class="pd-overlay" @click.self="approvalResult = null">
      <div class="pd-modal pd-modal-approval">
        <div class="pd-modal-success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h3>تمت الموافقة بنجاح</h3>
        <p>قاعدة بيانات المدرسة جاهزة للاستخدام.</p>
        <div class="pd-link-box">
          <p class="pd-link-box-label">رابط المدرسة للعميل</p>
          <div class="pd-link-row">
            <a :href="approvalResult.link" target="_blank" class="pd-approval-link">{{
              approvalResult.link
            }}</a>
            <button class="pd-btn-copy" @click="copyText(approvalResult.link)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              نسخ
            </button>
          </div>
          <p class="pd-link-hint">
            أرسل هذا الرابط للمدرسة — تسجيل الدخول بالبريد وكلمة المرور المختارة
          </p>
        </div>
        <button class="pd-btn-primary" @click="approvalResult = null">حسناً</button>
      </div>
    </div>

    <!-- ── Invoice Modal ──────────────────────── -->
    <div v-if="showInvoiceModal" class="pd-overlay" @click.self="showInvoiceModal = false">
      <div class="pd-modal">
        <div class="pd-modal-header">
          <h3>إنشاء فاتورة جديدة</h3>
          <button class="pd-icon-btn" @click="showInvoiceModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="pd-modal-body">
          <div class="pd-mfield">
            <label>المدرسة</label>
            <select v-model="newInvoice.tenantId" class="pd-minput">
              <option v-for="ten in tenants" :key="ten.id" :value="ten.id">
                {{ ten.school_name }}
              </option>
            </select>
          </div>
          <div class="pd-mfield">
            <label>المبلغ (دج)</label>
            <input
              type="number"
              v-model="newInvoice.amountDzd"
              placeholder="3000"
              class="pd-minput"
            />
          </div>
          <div class="pd-mfield">
            <label>طريقة الدفع</label>
            <select v-model="newInvoice.paymentMethod" class="pd-minput">
              <option value="manual">نقداً (يدوي)</option>
              <option value="ccp">بريد الجزائر / CCP</option>
              <option value="baridimob">بريدي موب</option>
              <option value="virement">تحويل بنكي</option>
            </select>
          </div>
          <div class="pd-field-row">
            <div class="pd-mfield">
              <label>بداية الفترة</label>
              <input type="date" v-model="newInvoice.periodStart" class="pd-minput" />
            </div>
            <div class="pd-mfield">
              <label>نهاية الفترة</label>
              <input type="date" v-model="newInvoice.periodEnd" class="pd-minput" />
            </div>
          </div>
          <div class="pd-mfield">
            <label>تاريخ الاستحقاق</label>
            <input type="date" v-model="newInvoice.dueDate" class="pd-minput" />
          </div>
          <div class="pd-mfield">
            <label>ملاحظة</label>
            <input v-model="newInvoice.note" placeholder="اشتراك شهر يناير..." class="pd-minput" />
          </div>
        </div>
        <div class="pd-modal-actions">
          <button @click="showInvoiceModal = false" class="pd-btn-ghost">إلغاء</button>
          <button @click="createInvoice" class="pd-btn-primary">إنشاء</button>
        </div>
      </div>
    </div>

    <!-- ── Plan Change Modal ──────────────────── -->
    <div v-if="showPlanModal" class="pd-overlay" @click.self="showPlanModal = false">
      <div class="pd-modal">
        <div class="pd-modal-header">
          <h3>تغيير الباقة — {{ planModalTenant?.school_name }}</h3>
          <button class="pd-icon-btn" @click="showPlanModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="pd-modal-body">
          <p style="font-size: 0.82rem; color: #7c6f9a; margin: 0 0 1rem">
            الباقة الحالية: <strong>{{ planModalTenant?.plan_name || '—' }}</strong>
          </p>
          <div
            v-for="p in plans"
            :key="p.id"
            class="pd-plan-option"
            :class="{ selected: selectedPlan === p.id }"
            @click="selectedPlan = p.id"
          >
            <input type="radio" :value="p.id" v-model="selectedPlan" />
            <div class="pd-plan-option-info">
              <div class="pd-plan-option-name">{{ p.name_ar }}</div>
              <div class="pd-plan-option-price">
                {{ p.price_dzd == 0 ? 'مجاناً' : p.price_dzd + ' دج/شهر' }}
              </div>
              <div class="pd-plan-option-limits">
                {{ p.max_students }} طالب · {{ p.max_teachers }} أستاذ
              </div>
            </div>
          </div>
        </div>
        <div class="pd-modal-actions">
          <button @click="showPlanModal = false" class="pd-btn-ghost">إلغاء</button>
          <button @click="savePlanChange" class="pd-btn-primary" :disabled="!selectedPlan">
            حفظ
          </button>
        </div>
      </div>
    </div>

    <!-- ── Toast ─────────────────────────────── -->
    <transition name="pd-toast">
      <div v-if="toastMessage" class="pd-toast" :class="'pd-toast-' + toastType">
        <svg
          v-if="toastType === 'success'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <svg
          v-else-if="toastType === 'error'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ toastMessage }}</span>
        <button @click="toastMessage = null" class="pd-toast-close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  platformGetStats,
  platformGetTenants,
  platformSetStatus,
  platformGetInvoices,
  platformCreateInvoice,
  platformApproveTenant,
  platformDeleteTenant,
} from '../services/api.js'

const router = useRouter()
const activeTab = ref('dashboard')
const adminName = JSON.parse(localStorage.getItem('platform_admin') || '{}')?.email || 'Admin'

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(
  '/api',
  '',
)
const FRONTEND_URL = window.location.origin
const DEMO_SLUG = import.meta.env.VITE_DEMO_SLUG || 'mudar'
const demoSchoolLink = `${FRONTEND_URL}/school/${DEMO_SLUG}`

const navItems = [
  {
    key: 'dashboard',
    label: 'الإحصائيات',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  },
  {
    key: 'tenants',
    label: 'المدارس',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  {
    key: 'invoices',
    label: 'الفواتير',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  },
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
const billingSummary = ref([])
const invoicesLoading = ref(false)
const showInvoiceModal = ref(false)
const invoiceView = ref('schools')
const invoiceFilterStatus = ref('')
const schoolInvoicesDrawer = ref(null)
const drawerInvoices = ref([])
const drawerInvoicesLoading = ref(false)
const now = ref(new Date())

// Real-time clock tick every second for countdowns
let clockInterval = null
const newInvoice = ref({
  tenantId: '',
  amountDzd: '',
  dueDate: '',
  note: '',
  paymentMethod: 'manual',
  periodStart: '',
  periodEnd: '',
})
const showPlanModal = ref(false)
const planModalTenant = ref(null)
const plans = ref([])
const selectedPlan = ref(null)

const pendingTenants = computed(() => tenants.value.filter((t) => t.status === 'pending'))

onMounted(() => {
  loadStats()
  loadTenants()
  loadInvoices()
  loadBillingSummary()
  clockInterval = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

// ── Cleanup on unmount ─────────────────────────────────────
onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval)
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

async function loadBillingSummary() {
  try {
    const token = localStorage.getItem('platform_token')
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const r = await fetch(`${API}/platform/invoices/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    billingSummary.value = await r.json()
  } catch {
    billingSummary.value = []
  }
}

// ── KPI computed ──────────────────────────────────────────
const invoiceKpi = computed(() => {
  const s = billingSummary.value
  return {
    total_schools: s.length,
    total_paid: s.reduce((a, x) => a + Number(x.total_paid || 0), 0),
    total_pending: s.reduce((a, x) => a + Number(x.total_pending || 0), 0),
    overdue_count: s.reduce((a, x) => a + Number(x.overdue_count || 0), 0),
    trial_expiring: s.filter((x) => {
      if (x.tenant_status !== 'trial' || !x.trial_ends_at) return false
      const days = Math.ceil((new Date(x.trial_ends_at) - new Date()) / 86400000)
      return days >= 0 && days <= 5
    }).length,
  }
})

const filteredInvoices = computed(() => {
  if (!invoiceFilterStatus.value) return invoices.value
  return invoices.value.filter((i) => i.status === invoiceFilterStatus.value)
})

function filterInvoiceList() {
  /* reactive via computed */
}

// ── Trial helpers ─────────────────────────────────────────
function trialCountdown(endsAt) {
  const ms = new Date(endsAt) - now.value
  if (ms <= 0) return 'انتهت التجربة'
  const days = Math.floor(ms / 86400000)
  const hrs = Math.floor((ms % 86400000) / 3600000)
  const mins = Math.floor((ms % 3600000) / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  if (days > 0) return `متبقي ${days} يوم و ${hrs} ساعة`
  if (hrs > 0) return `متبقي ${hrs} ساعة و ${mins} دقيقة`
  if (mins > 0) return `متبقي ${mins} دقيقة و ${secs} ثانية`
  return `متبقي ${secs} ثانية`
}

function trialProgress(endsAt) {
  // 14-day trial — return % used
  const total = 14 * 86400000
  const end = new Date(endsAt)
  const start = new Date(end - total)
  const elapsed = now.value - start
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

function isDueUrgent(dueDate) {
  if (!dueDate) return false
  const days = Math.ceil((new Date(dueDate) - now.value) / 86400000)
  return days <= 3
}

function dueIn(dueDate) {
  if (!dueDate) return ''
  const days = Math.ceil((new Date(dueDate) - now.value) / 86400000)
  if (days < 0) return `تأخر ${Math.abs(days)} يوم`
  if (days === 0) return 'اليوم'
  if (days === 1) return 'غداً'
  return `خلال ${days} يوم`
}

function openInvoiceForSchool(school) {
  newInvoice.value = {
    tenantId: school.id,
    amountDzd: school.plan_price_dzd || '',
    dueDate: '',
    note: '',
    paymentMethod: 'manual',
    periodStart: '',
    periodEnd: '',
  }
  showInvoiceModal.value = true
}

async function viewSchoolInvoices(school) {
  schoolInvoicesDrawer.value = school
  await loadDrawerInvoices(school)
}

async function loadDrawerInvoices(school) {
  drawerInvoicesLoading.value = true
  try {
    const token = localStorage.getItem('platform_token')
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const r = await fetch(`${API}/platform/invoices?tenant_id=${school.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    drawerInvoices.value = await r.json()
  } catch {
    drawerInvoices.value = []
  } finally {
    drawerInvoicesLoading.value = false
  }
}

function schoolLink(slug) {
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
      approvalResult.value = { schoolName: tenant.school_name, slug: tenant.slug, link }
      showToast(`تمت الموافقة على "${tenant.school_name}" — قاعدة البيانات جاهزة`, 'success')
    } else {
      showToast(result.error || 'حدث خطأ', 'error')
    }
    await loadTenants()
    await loadStats()
  } catch (e) {
    showToast(e.message || 'حدث خطأ أثناء الإنشاء', 'error')
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

async function deleteTenant(tenant) {
  if (
    !confirm(
      `⚠️ حذف "${tenant.school_name}" نهائياً؟\nسيتم حذف قاعدة البيانات وجميع البيانات. هذا الإجراء لا يمكن التراجع عنه.`,
    )
  )
    return
  try {
    await platformDeleteTenant(tenant.id)
    showToast(`تم حذف "${tenant.school_name}" بنجاح`, 'success')
    await loadTenants()
    await loadStats()
  } catch (e) {
    showToast('خطأ أثناء الحذف: ' + e.message, 'error')
  }
}

async function createInvoice() {
  try {
    await platformCreateInvoice(newInvoice.value)
    showInvoiceModal.value = false
    newInvoice.value = {
      tenantId: '',
      amountDzd: '',
      dueDate: '',
      note: '',
      paymentMethod: 'manual',
      periodStart: '',
      periodEnd: '',
    }
    await loadInvoices()
    showToast('تم إنشاء الفاتورة', 'success')
    await loadBillingSummary()
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
    showToast('تم نسخ الرابط', 'success')
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
    pending: 'بانتظار',
  })[s] || s
const invoiceStatusLabel = (s) => ({ pending: 'معلقة', paid: 'مدفوعة', overdue: 'متأخرة' })[s] || s

const paymentMethodLabel = (m) =>
  ({
    manual: 'نقداً',
    ccp: 'CCP بريد',
    baridimob: 'بريدي موب',
    virement: 'تحويل بنكي',
  })[m] || 'نقداً'

async function markInvoicePaid(inv) {
  const method = prompt(
    'طريقة الدفع:\n1. نقداً (manual)\n2. CCP بريد (ccp)\n3. بريدي موب (baridimob)\n4. تحويل بنكي (virement)\nاكتب: manual / ccp / baridimob / virement',
    inv.payment_method || 'manual',
  )
  if (!method) return
  const validMethods = ['manual', 'ccp', 'baridimob', 'virement']
  const finalMethod = validMethods.includes(method.trim()) ? method.trim() : 'manual'
  try {
    const token = localStorage.getItem('platform_token')
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    await fetch(`${API}/platform/invoices/${inv.id}/paid`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paymentMethod: finalMethod }),
    })
    await loadInvoices()
    await loadBillingSummary()
    showToast('تم تحديث الفاتورة كمدفوعة', 'success')
  } catch (err) {
    showToast('خطأ في تحديث الفاتورة', 'error')
  }
}
async function handlePayNow(inv) {
  await markInvoicePaid(inv)
  await loadDrawerInvoices(schoolInvoicesDrawer.value)
}
async function openPlanModal(tenant) {
  planModalTenant.value = tenant
  selectedPlan.value = tenant.plan_id || null
  showPlanModal.value = true
  if (!plans.value.length) {
    try {
      const token = localStorage.getItem('platform_token')
      const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      const r = await fetch(`${API}/platform/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      plans.value = await r.json()
    } catch {}
  }
}

async function savePlanChange() {
  if (!selectedPlan.value || !planModalTenant.value) return
  try {
    const token = localStorage.getItem('platform_token')
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const r = await fetch(`${API}/platform/tenants/${planModalTenant.value.id}/plan`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ planId: selectedPlan.value }),
    })
    if (!r.ok) throw new Error()
    showPlanModal.value = false
    await loadTenants()
    showToast('تم تغيير الباقة بنجاح', 'success')
  } catch {
    showToast('خطأ في تغيير الباقة', 'error')
  }
}
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('ar-DZ') : '—')
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');

* {
  box-sizing: border-box;
}

.pd-shell {
  display: flex;
  min-height: 100vh;
  background: #faf9ff;
  font-family: 'IBM Plex Sans Arabic', 'Segoe UI', sans-serif;
  direction: rtl;
}

/* ── Sidebar ────────────────────────────────────── */
.pd-sidebar {
  width: 230px;
  background: linear-gradient(180deg, #1e0a3c 0%, #2d0f54 60%, #3b0764 100%);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.pd-sidebar-top {
  flex: 1;
}

.pd-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 2rem;
  padding: 0 0.25rem;
}
.pd-brand-icon {
  width: 34px;
  height: 34px;
  background: rgba(167, 139, 250, 0.2);
  border: 1px solid rgba(167, 139, 250, 0.3);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pd-brand-icon svg {
  width: 16px;
  height: 16px;
  color: #c4b5fd;
}
.pd-brand span:last-child {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
}

.pd-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.pd-nav-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: #a78bfa;
  cursor: pointer;
  font-size: 0.88rem;
  font-family: inherit;
  text-align: right;
  transition: all 0.18s;
  position: relative;
}
.pd-nav-item:hover {
  background: rgba(167, 139, 250, 0.12);
  color: #e9d5ff;
}
.pd-nav-item.active {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.4), rgba(167, 139, 250, 0.2));
  color: #fff;
  border: 1px solid rgba(167, 139, 250, 0.3);
}
.pd-nav-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pd-nav-icon :deep(svg) {
  width: 17px;
  height: 17px;
}
.pd-badge-count {
  margin-right: auto;
  background: #dc2626;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 100px;
}

/* Demo link */
.pd-demo-wrap {
  padding: 1rem 0 0.5rem;
}
.pd-demo-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.55rem;
  background: rgba(167, 139, 250, 0.12);
  border: 1px dashed rgba(167, 139, 250, 0.3);
  color: #c4b5fd;
  border-radius: 10px;
  text-decoration: none;
  font-size: 0.82rem;
  transition: all 0.18s;
}
.pd-demo-btn svg {
  width: 14px;
  height: 14px;
}
.pd-demo-btn:hover {
  background: rgba(167, 139, 250, 0.2);
  color: #e9d5ff;
}

/* Sidebar footer */
.pd-sidebar-footer {
  border-top: 1px solid rgba(167, 139, 250, 0.15);
  padding-top: 1rem;
  margin-top: 1rem;
}
.pd-admin-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
}
.pd-admin-avatar {
  width: 32px;
  height: 32px;
  background: rgba(167, 139, 250, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pd-admin-avatar svg {
  width: 16px;
  height: 16px;
  color: #a78bfa;
}
.pd-admin-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.pd-admin-role {
  font-size: 0.7rem;
  color: #a78bfa;
  font-weight: 600;
}
.pd-admin-email {
  font-size: 0.73rem;
  color: #c4b5fd;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pd-logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.82rem;
  font-family: inherit;
  transition: all 0.18s;
}
.pd-logout-btn svg {
  width: 14px;
  height: 14px;
}
.pd-logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fecaca;
}

/* ── Main ────────────────────────────────────────── */
.pd-main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  min-width: 0;
}

.pd-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.75rem;
}
.pd-page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e0a3c;
  margin: 0 0 0.2rem;
}
.pd-page-subtitle {
  font-size: 0.85rem;
  color: #7c6f9a;
  margin: 0;
}
.pd-header-actions {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  flex-wrap: wrap;
}

/* Buttons */
.pd-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #5b21b6, #7c3aed);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition:
    opacity 0.2s,
    transform 0.15s;
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.25);
}
.pd-btn-primary svg {
  width: 15px;
  height: 15px;
}
.pd-btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.pd-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.2rem;
  background: #fff;
  color: #5b21b6;
  border: 2px solid #ddd6fe;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  font-family: inherit;
  transition: all 0.18s;
}
.pd-btn-outline svg {
  width: 15px;
  height: 15px;
}
.pd-btn-outline:hover {
  background: #f5f3ff;
  border-color: #a78bfa;
}

.pd-btn-ghost {
  padding: 0.6rem 1.2rem;
  background: #f5f3ff;
  color: #5b21b6;
  border: none;
  border-radius: 10px;
  font-size: 0.88rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.18s;
}
.pd-btn-ghost:hover {
  background: #ede9fe;
}

/* Search / Filter */
.pd-search-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #fff;
  border: 2px solid #e9d5ff;
  border-radius: 10px;
  padding: 0 0.75rem;
}
.pd-search-wrap svg {
  width: 15px;
  height: 15px;
  color: #a78bfa;
  flex-shrink: 0;
}
.pd-search-input {
  border: none;
  outline: none;
  background: transparent;
  padding: 0.55rem 0;
  font-size: 0.88rem;
  font-family: inherit;
  color: #1e0a3c;
  min-width: 180px;
}
.pd-select {
  padding: 0.6rem 0.75rem;
  border: 2px solid #e9d5ff;
  border-radius: 10px;
  font-size: 0.88rem;
  font-family: inherit;
  color: #3b0764;
  background: #fff;
  outline: none;
  cursor: pointer;
}

/* Loading / Error / Empty */
.pd-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  background: #fff;
  border-radius: 16px;
  color: #7c6f9a;
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.07);
}
.pd-error-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #dc2626;
}
.pd-error-state svg {
  width: 18px;
  height: 18px;
}
.pd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 4rem;
  background: #fff;
  border-radius: 16px;
  color: #9d8bbf;
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.07);
}
.pd-empty svg {
  width: 40px;
  height: 40px;
}
.pd-empty p {
  margin: 0;
  font-size: 0.9rem;
}

.pd-spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid #e9d5ff;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: pd-spin 0.7s linear infinite;
}
.pd-spinner-sm {
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: pd-spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes pd-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Stats grid */
.pd-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.75rem;
}
.pd-stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 16px rgba(124, 58, 237, 0.07);
  border: 1px solid #f0ebff;
  transition: transform 0.2s;
}
.pd-stat-card:hover {
  transform: translateY(-2px);
}
.pd-stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
}
.pd-stat-icon svg {
  width: 20px;
  height: 20px;
}
.pd-stat-value {
  font-size: 1.9rem;
  font-weight: 700;
  color: #1e0a3c;
}
.pd-stat-label {
  font-size: 0.82rem;
  color: #7c6f9a;
  margin-top: 0.25rem;
}

.pd-stat-total .pd-stat-icon {
  background: #f5f3ff;
  color: #7c3aed;
}
.pd-stat-active .pd-stat-icon {
  background: #f0fdf4;
  color: #16a34a;
}
.pd-stat-active .pd-stat-value {
  color: #16a34a;
}
.pd-stat-trial .pd-stat-icon {
  background: #fefce8;
  color: #ca8a04;
}
.pd-stat-trial .pd-stat-value {
  color: #ca8a04;
}
.pd-stat-pending .pd-stat-icon {
  background: #fff7ed;
  color: #ea580c;
}
.pd-stat-pending .pd-stat-value {
  color: #ea580c;
}
.pd-stat-revenue .pd-stat-icon {
  background: #eff6ff;
  color: #2563eb;
}
.pd-stat-revenue .pd-stat-value {
  color: #2563eb;
  font-size: 1.3rem;
}

/* Pending alert */
.pd-pending-alert {
  background: #fff;
  border: 1px solid #fed7aa;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 2px 16px rgba(234, 88, 12, 0.08);
}
.pd-pending-alert-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.pd-pending-alert-header svg {
  width: 18px;
  height: 18px;
  color: #ea580c;
}
.pd-pending-alert-header h3 {
  margin: 0;
  font-size: 0.95rem;
  color: #7c2d12;
}
.pd-pending-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 0;
  border-bottom: 1px solid #fed7aa;
  gap: 1rem;
}
.pd-pending-row:last-child {
  border-bottom: none;
}
.pd-pending-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.pd-meta {
  color: #9d8bbf;
  font-size: 0.78rem;
  margin-right: 6px;
}

.pd-btn-approve {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #5b21b6, #7c3aed);
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.18s;
}
.pd-btn-approve svg {
  width: 14px;
  height: 14px;
}
.pd-btn-approve:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Table */
.pd-table-wrap {
  background: #fff;
  border-radius: 16px;
  overflow: auto;
  box-shadow: 0 2px 16px rgba(124, 58, 237, 0.07);
  border: 1px solid #f0ebff;
}
.pd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}
.pd-table th {
  padding: 0.9rem 1rem;
  background: #faf5ff;
  font-weight: 600;
  color: #5b21b6;
  text-align: right;
  white-space: nowrap;
  border-bottom: 2px solid #ede9fe;
}
.pd-table td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #f5f3ff;
  vertical-align: middle;
  color: #2d1b69;
}
.pd-table tr:last-child td {
  border-bottom: none;
}
.pd-table tr.row-pending {
  background: #fffbf0;
}
.pd-table tbody tr:hover {
  background: #faf5ff;
}

.pd-school-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.pd-school-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.pd-school-name {
  font-weight: 600;
  margin: 0;
}
.pd-school-slug {
  font-size: 0.73rem;
  color: #a78bfa;
  margin: 2px 0 0;
}

.pd-logo-img {
  height: 32px;
  width: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ede9fe;
}
.pd-logo-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pd-logo-placeholder svg {
  width: 14px;
  height: 14px;
  color: #a78bfa;
}

.pd-email {
  margin: 0;
  font-size: 0.82rem;
}
.pd-phone {
  margin: 0;
  font-size: 0.75rem;
  color: #a78bfa;
}
.pd-amount {
  font-weight: 600;
  color: #2563eb;
}
.pd-td-empty {
  text-align: center;
  color: #9d8bbf;
  padding: 2rem;
}

/* Chips */
.pd-chip {
  padding: 0.22rem 0.7rem;
  border-radius: 100px;
  font-size: 0.74rem;
  font-weight: 600;
  white-space: nowrap;
}
.pd-chip-active {
  background: #dcfce7;
  color: #166534;
}
.pd-chip-trial {
  background: #fef9c3;
  color: #854d0e;
}
.pd-chip-pending {
  background: #fff7ed;
  color: #9a3412;
}
.pd-chip-suspended {
  background: #f3f4f6;
  color: #4b5563;
}
.pd-chip-cancelled {
  background: #fef2f2;
  color: #991b1b;
}
.pd-chip-plan {
  background: #f5f3ff;
  color: #5b21b6;
}
.pd-chip-paid {
  background: #dcfce7;
  color: #166534;
}
.pd-chip-overdue {
  background: #fef2f2;
  color: #991b1b;
}
/* Payment method chips */
.pd-chip-payment-manual {
  background: #f3f4f6;
  color: #374151;
}
.pd-chip-payment-ccp {
  background: #fef3c7;
  color: #92400e;
}
.pd-chip-payment-baridimob {
  background: #dbeafe;
  color: #1e40af;
}
.pd-chip-payment-virement {
  background: #d1fae5;
  color: #065f46;
}
/* Pay now button */
.pd-btn-pay-now {
  padding: 0.3rem 0.7rem;
  background: #16a34a;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.pd-btn-pay-now:hover {
  background: #15803d;
}
/* Change plan button */
.pd-btn-plan-change {
  padding: 0.3rem 0.7rem;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  margin-top: 4px;
}
.pd-btn-plan-change:hover {
  background: #5b21b6;
}
.pd-field-row {
  display: flex;
  gap: 0.75rem;
}
.pd-field-row .pd-mfield {
  flex: 1;
}
.pd-plan-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 2px solid #e9d5ff;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}
.pd-plan-option:hover {
  border-color: #7c3aed;
  background: #f5f3ff;
}
.pd-plan-option.selected {
  border-color: #7c3aed;
  background: #f5f3ff;
}
.pd-plan-option input[type='radio'] {
  accent-color: #7c3aed;
}
.pd-plan-option-info {
  flex: 1;
}
.pd-plan-option-name {
  font-weight: 700;
  color: #1e0a3c;
  font-size: 0.9rem;
}
.pd-plan-option-price {
  font-size: 0.8rem;
  color: #7c6f9a;
}
.pd-plan-option-limits {
  font-size: 0.75rem;
  color: #5b21b6;
  margin-top: 2px;
}

/* Link cell */
.pd-link-cell {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.pd-school-link {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #7c3aed;
  text-decoration: none;
  font-size: 0.78rem;
  font-weight: 500;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pd-school-link svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}
.pd-school-link:hover {
  text-decoration: underline;
}
.pd-no-link {
  color: #c4b5fd;
  font-size: 0.78rem;
}

/* Icon btn */
.pd-icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a78bfa;
  transition:
    background 0.15s,
    color 0.15s;
}
.pd-icon-btn svg {
  width: 15px;
  height: 15px;
}
.pd-icon-btn:hover {
  background: #f5f3ff;
  color: #7c3aed;
}

/* Action buttons */
.pd-actions-cell {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.pd-act-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.65rem;
  border-radius: 8px;
  border: none;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition:
    opacity 0.18s,
    transform 0.15s;
}
.pd-act-btn svg {
  width: 12px;
  height: 12px;
}
.pd-act-btn:hover:not(:disabled) {
  opacity: 0.85;
  transform: translateY(-1px);
}
.pd-act-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pd-act-approve {
  background: linear-gradient(135deg, #5b21b6, #7c3aed);
  color: #fff;
}
.pd-act-activate {
  background: #dcfce7;
  color: #166534;
}
.pd-act-suspend {
  background: #fff7ed;
  color: #9a3412;
}
.pd-act-delete {
  background: #fef2f2;
  color: #991b1b;
}
.pd-act-delete:hover:not(:disabled) {
  background: #fee2e2;
}

/* Modals */
.pd-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30, 10, 60, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.pd-modal {
  background: #fff;
  border-radius: 20px;
  padding: 2rem;
  min-width: 340px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 24px 64px rgba(30, 10, 60, 0.25);
  border: 1px solid #ede9fe;
}
.pd-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.pd-modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #1e0a3c;
}
.pd-modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.pd-modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.pd-mfield {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.pd-mfield label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #3b0764;
}
.pd-minput {
  padding: 0.6rem 0.8rem;
  border: 2px solid #e9d5ff;
  border-radius: 10px;
  font-size: 0.88rem;
  font-family: inherit;
  color: #1e0a3c;
  outline: none;
  transition: border-color 0.2s;
}
.pd-minput:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

/* Approval modal */
.pd-modal-approval {
  text-align: center;
}
.pd-modal-success-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.3);
}
.pd-modal-success-icon svg {
  width: 26px;
  height: 26px;
  color: #fff;
}
.pd-modal-approval h3 {
  margin: 0 0 0.4rem;
  font-size: 1.2rem;
  color: #1e0a3c;
}
.pd-modal-approval > p {
  color: #7c6f9a;
  font-size: 0.88rem;
  margin: 0 0 1.25rem;
}

.pd-link-box {
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.25rem;
  text-align: right;
}
.pd-link-box-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #5b21b6;
  margin: 0 0 0.5rem;
}
.pd-link-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}
.pd-approval-link {
  flex: 1;
  color: #7c3aed;
  font-weight: 600;
  word-break: break-all;
  font-size: 0.85rem;
  text-decoration: none;
  direction: ltr;
}
.pd-approval-link:hover {
  text-decoration: underline;
}
.pd-link-hint {
  font-size: 0.76rem;
  color: #a78bfa;
  margin: 0;
}

.pd-btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.8rem;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.78rem;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.18s;
}
.pd-btn-copy svg {
  width: 13px;
  height: 13px;
}
.pd-btn-copy:hover {
  opacity: 0.88;
}

/* Toast */
.pd-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1.25rem;
  border-radius: 12px;
  z-index: 9999;
  max-width: 380px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  font-size: 0.88rem;
  font-weight: 500;
}
.pd-toast svg {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
}
.pd-toast span {
  flex: 1;
}
.pd-toast-success {
  background: #166534;
  color: #dcfce7;
}
.pd-toast-error {
  background: #991b1b;
  color: #fee2e2;
}
.pd-toast-info {
  background: #1e3a8a;
  color: #dbeafe;
}
.pd-toast-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 2px;
  display: flex;
  opacity: 0.7;
}
.pd-toast-close svg {
  width: 15px;
  height: 15px;
}
.pd-toast-close:hover {
  opacity: 1;
}

.pd-toast-enter-active,
.pd-toast-leave-active {
  transition: all 0.3s ease;
}
.pd-toast-enter-from,
.pd-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
</style>
<style>
/* ══════════════════════════════════════════════════════════
   INVOICES TAB — Rich Billing UI
   ══════════════════════════════════════════════════════════ */

/* ── KPI Row ──────────────────────────────────────────────── */
.inv-kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  direction: rtl;
}
@media (max-width: 900px) {
  .inv-kpi-row {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 600px) {
  .inv-kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

.inv-kpi {
  border-radius: 16px;
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.inv-kpi-val {
  font-size: 1.55rem;
  font-weight: 800;
  line-height: 1;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
}
.inv-kpi-val small {
  font-size: 0.75rem;
  font-weight: 500;
}
.inv-kpi-lbl {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.75;
}
.inv-kpi-blue {
  background: #eff6ff;
  color: #1d4ed8;
}
.inv-kpi-green {
  background: #f0fdf4;
  color: #15803d;
}
.inv-kpi-orange {
  background: #fff7ed;
  color: #c2410c;
}
.inv-kpi-red {
  background: #fef2f2;
  color: #b91c1c;
}
.inv-kpi-purple {
  background: #f5f3ff;
  color: #6d28d9;
}

/* ── Toolbar ─────────────────────────────────────────────── */
.inv-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  direction: rtl;
  gap: 1rem;
  flex-wrap: wrap;
}
.inv-view-toggle {
  display: flex;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}
.inv-view-toggle button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.45rem 1rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.inv-view-toggle button svg {
  width: 14px;
  height: 14px;
}
.inv-view-toggle button.active {
  background: #fff;
  color: #1e0a3c;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
.inv-filters {
  display: flex;
  gap: 0.5rem;
}
.pd-btn-outline.pd-btn-sm {
  padding: 0.4rem 0.9rem;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── Schools Grid ────────────────────────────────────────── */
.inv-schools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
  direction: rtl;
}

.inv-school-card {
  background: #fff;
  border-radius: 18px;
  border: 2px solid #f1f5f9;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition:
    box-shadow 0.25s,
    border-color 0.25s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.inv-school-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
  border-color: #c4b5fd;
}
.inv-card-ok {
  border-left: 4px solid #22c55e;
}
.inv-card-overdue {
  border-left: 4px solid #ef4444;
}
.inv-card-trial {
  border-left: 4px solid #f59e0b;
}

/* Card header */
.inv-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.inv-card-logo {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  font-weight: 800;
  font-size: 1.1rem;
  color: #fff;
}
.inv-card-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.inv-card-meta {
  flex: 1;
  min-width: 0;
}
.inv-card-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: #1e0a3c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.inv-card-slug {
  font-size: 0.72rem;
  color: #a78bfa;
  text-decoration: none;
}
.inv-card-slug:hover {
  text-decoration: underline;
}
.inv-card-status-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}
.inv-status-active {
  background: #dcfce7;
  color: #166534;
}
.inv-status-trial {
  background: #fef3c7;
  color: #92400e;
}
.inv-status-suspended {
  background: #fef2f2;
  color: #991b1b;
}
.inv-status-pending {
  background: #f1f5f9;
  color: #475569;
}

/* Trial bar */
.inv-trial-bar {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 0.6rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.inv-trial-bar-inner {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: #92400e;
}
.inv-trial-bar-inner svg {
  width: 14px;
  height: 14px;
  color: #f59e0b;
}
.inv-trial-progress {
  height: 5px;
  background: #fde68a;
  border-radius: 3px;
  overflow: hidden;
}
.inv-trial-fill {
  height: 100%;
  background: #f59e0b;
  border-radius: 3px;
  transition: width 0.5s;
}

/* Plan chip */
.inv-card-plan {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.inv-plan-chip {
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}
.inv-plan-trial {
  background: #f1f5f9;
  color: #475569;
}
.inv-plan-basic {
  background: #dbeafe;
  color: #1d4ed8;
}
.inv-plan-pro {
  background: #ede9fe;
  color: #5b21b6;
}
.inv-plan-احترافية {
  background: #ede9fe;
  color: #5b21b6;
}
.inv-plan-enterprise {
  background: #fce7f3;
  color: #9d174d;
}
.inv-plan-مؤسسية {
  background: #fce7f3;
  color: #9d174d;
}
.inv-plan-أساسية {
  background: #dbeafe;
  color: #1d4ed8;
}
.inv-plan-price {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 600;
}

/* Stats row */
.inv-card-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
}
.inv-stat {
  padding: 0.65rem 0.5rem;
  text-align: center;
  border-left: 1px solid #e2e8f0;
}
.inv-stat:last-child {
  border-left: none;
}
.inv-stat-val {
  font-size: 1rem;
  font-weight: 800;
  color: #1e0a3c;
}
.inv-stat-lbl {
  font-size: 0.68rem;
  color: #94a3b8;
  font-weight: 600;
  margin-top: 2px;
}
.inv-stat-green {
  color: #16a34a;
}
.inv-stat-orange {
  color: #ea580c;
}
.inv-stat-red {
  color: #dc2626;
}

/* Dates */
.inv-card-dates {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.inv-date-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #374151;
}
.inv-date-row svg {
  width: 13px;
  height: 13px;
  color: #7c3aed;
  flex-shrink: 0;
}
.inv-date-muted {
  color: #94a3b8;
}
.inv-due-badge {
  padding: 1px 8px;
  border-radius: 20px;
  font-size: 0.68rem;
  font-weight: 700;
  margin-right: auto;
}
.inv-due-normal {
  background: #eff6ff;
  color: #1d4ed8;
}
.inv-due-urgent {
  background: #fef2f2;
  color: #b91c1c;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Card actions */
.inv-card-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.25rem;
}
.inv-btn-new-inv,
.inv-btn-view-inv {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0.5rem;
  border-radius: 10px;
  border: none;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.inv-btn-new-inv svg,
.inv-btn-view-inv svg {
  width: 13px;
  height: 13px;
}
.inv-btn-new-inv {
  background: #7c3aed;
  color: #fff;
}
.inv-btn-new-inv:hover {
  background: #5b21b6;
}
.inv-btn-view-inv {
  background: #f1f5f9;
  color: #374151;
}
.inv-btn-view-inv:hover {
  background: #e2e8f0;
}

/* ── List View ───────────────────────────────────────────── */
.inv-list-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  direction: rtl;
}
.inv-list-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fff;
  border-radius: 14px;
  padding: 1rem 1.25rem;
  border: 1.5px solid #f1f5f9;
  transition: box-shadow 0.2s;
}
.inv-list-row:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.inv-row-paid {
  border-left: 4px solid #22c55e;
}
.inv-row-overdue {
  border-left: 4px solid #ef4444;
}
.inv-row-pending {
  border-left: 4px solid #f59e0b;
}
.inv-row-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #fff;
  font-size: 0.9rem;
  overflow: hidden;
}
.inv-row-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.inv-row-main {
  flex: 1;
  min-width: 0;
}
.inv-row-school {
  font-weight: 700;
  font-size: 0.9rem;
  color: #1e0a3c;
}
.inv-row-sub {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 3px;
  flex-wrap: wrap;
}
.inv-row-period {
  font-size: 0.72rem;
  color: #94a3b8;
}
.inv-row-note {
  font-size: 0.72rem;
  color: #7c6f9a;
  font-style: italic;
}
.inv-row-amount {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1e0a3c;
  white-space: nowrap;
}
.inv-row-amount small {
  font-size: 0.7rem;
  font-weight: 500;
  color: #94a3b8;
}
.inv-row-method {
  white-space: nowrap;
}
.inv-row-dates {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: flex-end;
  min-width: 140px;
}
.inv-due-line {
  font-size: 0.75rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.inv-paid-line {
  font-size: 0.75rem;
  color: #16a34a;
  font-weight: 600;
}
.inv-row-action {
  flex-shrink: 0;
}
.inv-paid-check {
  font-size: 1.1rem;
  color: #16a34a;
  font-weight: 800;
}

/* ── Drawer ─────────────────────────────────────────────── */
.inv-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 0, 40, 0.35);
  backdrop-filter: blur(4px);
  z-index: 900;
  display: flex;
  justify-content: flex-start;
}
.inv-drawer {
  width: min(460px, 100vw);
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 32px rgba(0, 0, 0, 0.15);
  direction: rtl;
  animation: slideInDrawer 0.25s ease;
}
@keyframes slideInDrawer {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}
.inv-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #faf5ff;
}
.inv-drawer-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #1e0a3c;
  margin: 0;
}
.inv-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.inv-drawer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1.5px solid #f1f5f9;
  background: #fff;
}
.inv-drawer-row.inv-row-paid {
  border-left: 4px solid #22c55e;
}
.inv-drawer-row.inv-row-overdue {
  border-left: 4px solid #ef4444;
}
.inv-drawer-row.inv-row-pending {
  border-left: 4px solid #f59e0b;
}
.inv-drawer-amount {
  font-size: 1rem;
  font-weight: 800;
  color: #1e0a3c;
}
.inv-drawer-sub {
  display: flex;
  gap: 0.4rem;
  margin-top: 4px;
  flex-wrap: wrap;
}
.inv-drawer-dates {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 4px;
}
.inv-drawer-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #faf5ff;
}
.inv-drawer-footer .pd-btn-primary {
  width: 100%;
  justify-content: center;
}

/* pd-empty-state */
.pd-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: #94a3b8;
}
.pd-empty-state svg {
  width: 48px;
  height: 48px;
}
</style>
