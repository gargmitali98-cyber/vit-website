// Injects sidebar + topbar into .layout shells
function renderLayout(pageTitle, breadcrumb) {
  const nav = [
    { page: 'dashboard.html',              icon: iconGrid,     label: 'Dashboard',            section: null },
    { page: null,                          icon: null,         label: 'Configuration',         section: true },
    { page: 'disease-master.html',         icon: iconDisease,  label: 'Disease Master' },
    { page: 'questionnaire-builder.html',  icon: iconQuiz,     label: 'Questionnaire Builder' },
    { page: 'risk-factors.html',           icon: iconSliders,  label: 'Risk Factors' },
    { page: 'rules-engine.html',           icon: iconRules,    label: 'Rules Engine' },
    { page: 'decision-matrix.html',        icon: iconMatrix,   label: 'Decision Matrix' },
    { page: null,                          icon: null,         label: 'Operations',            section: true },
    { page: 'applications.html',           icon: iconApps,     label: 'Applications' },
    { page: 'workbench.html',              icon: iconWorkbench,label: 'UW Workbench' },
    { page: null,                          icon: null,         label: 'Governance',            section: true },
    { page: 'audit-trail.html',            icon: iconAudit,    label: 'Audit Trail' },
  ];

  const cur = window.location.pathname.split('/').pop();
  const user = getUser() || {};

  const navHtml = nav.map(item => {
    if (item.section) return `<div class="nav-section">${item.label}</div>`;
    const active = item.page === cur ? 'active' : '';
    return `<a class="nav-item ${active}" href="/admin/${item.page}" data-page="${item.page}">${item.icon(16)}${item.label}</a>`;
  }).join('');

  const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  document.getElementById('sidebar').innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-mark">D</div>
      <div class="sidebar-logo-text">Daman Health<span>Underwriting Platform</span></div>
    </div>
    <nav class="sidebar-nav">${navHtml}</nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="avatar" id="sidebar-avatar">${initials}</div>
        <div class="sidebar-user-info">
          <strong id="sidebar-name">${user.name || ''}</strong>
          <small id="sidebar-role">${(user.role || '').replace('_',' ')}</small>
        </div>
      </div>
      <button class="logout-btn" onclick="logout()">
        ${iconLogout(14)} Sign out
      </button>
    </div>`;

  document.getElementById('topbar').innerHTML = `
    <div class="breadcrumb">
      <span>Daman UW</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      <strong>${breadcrumb || pageTitle}</strong>
    </div>`;
}

// ── Icons (inline SVG helpers) ──────────────────────────────
const icon = (d, s=24) => (sz=s) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const iconGrid      = icon('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>');
const iconDisease   = icon('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>');
const iconQuiz      = icon('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>');
const iconSliders   = icon('<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>');
const iconRules     = icon('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>');
const iconMatrix    = icon('<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>');
const iconApps      = icon('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>');
const iconWorkbench = icon('<path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>');
const iconAudit     = icon('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>');
const iconLogout    = icon('<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>');
const iconPlus      = icon('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>');
const iconEdit      = icon('<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>');
const iconTrash     = icon('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>');
const iconSearch    = icon('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>');
const iconEye       = icon('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>');
const iconCheck     = icon('<polyline points="20 6 9 17 4 12"/>');
const iconX         = icon('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>');
const iconFilter    = icon('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>');
const iconDownload  = icon('<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>');
