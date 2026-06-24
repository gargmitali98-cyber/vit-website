const API = '/api';

function getToken() { return localStorage.getItem('daman_token'); }
function getUser()  { const u = localStorage.getItem('daman_user'); return u ? JSON.parse(u) : null; }

function requireAuth() {
  if (!getToken()) { window.location.href = '/admin/login.html'; return false; }
  return true;
}

async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + path, { headers, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
  if (res.status === 401) { localStorage.clear(); window.location.href = '/admin/login.html'; return; }
  return res.json();
}

function toast(msg, type = 'info') {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.className = type + ' show';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3000);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-AE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function badge(status) {
  const map = {
    ACCEPTED: 'accepted', REFERRED: 'referred', DECLINED: 'declined',
    SUBMITTED: 'submitted', DRAFT: 'draft', ACTIVE: 'active',
    INACTIVE: 'inactive', PENDING: 'pending', ACCEPT: 'accepted',
    ACCEPT_WITH_LOADING: 'referred', REFER: 'referred', DECLINE: 'declined',
  };
  const label = { ACCEPT_WITH_LOADING: 'Accept+Loading' };
  const cls = map[status] || 'info';
  return `<span class="badge badge-${cls}">${label[status] || status}</span>`;
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

function initNav() {
  const user = getUser();
  if (!user) return;
  const nameEl = document.getElementById('sidebar-name');
  const roleEl = document.getElementById('sidebar-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role.replace('_', ' ');
  if (avatarEl) avatarEl.textContent = user.name.split(' ').map(w => w[0]).join('').slice(0, 2);

  // mark active nav
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    if (el.dataset.page === path) el.classList.add('active');
  });
}

function logout() {
  localStorage.clear();
  window.location.href = '/admin/login.html';
}
