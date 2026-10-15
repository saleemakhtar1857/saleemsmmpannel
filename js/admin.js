/* ==========================================================================
   SALEEM SMM PANEL — ADMIN CONTROL CENTER & SAAS DASHBOARD LOGIC
   Authorized Admins: saleembaloch1857@gmail.com, yasinofficial03098158572@gmail.com
   ========================================================================== */

let activeAdminTab = 'overview';
let activeAdminChatUserId = null;
let activeModalUserId = null;
let currentDepositFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initAdminDashboard();
});

function initAdminDashboard() {
  // Strict Access Control: Only authorized administrators can access Admin Dashboard
  if (!AppState.isAdmin()) {
    alert('Access Denied! Only authorized administrators (saleembaloch1857@gmail.com / yasinofficial03098158572@gmail.com) can access the Admin Dashboard.');
    window.location.href = '../index.html#auth';
    return;
  }

  // Populate active admin profile banner in sidebar with distinct identity
  const curUser = AppState.currentUser;
  if (curUser) {
    const isSaleem = curUser.email && curUser.email.toLowerCase().trim() === 'saleembaloch1857@gmail.com';
    const isYasin = curUser.email && curUser.email.toLowerCase().trim() === 'yasinofficial03098158572@gmail.com';

    let adminDisplayName = curUser.name || 'Admin';
    let adminRoleTitle = 'Administrator';
    let adminInitial = 'A';

    if (isSaleem) {
      adminDisplayName = 'Saleem Akhtar';
      adminRoleTitle = 'Founder & Lead Admin';
      adminInitial = 'S';
    } else if (isYasin) {
      adminDisplayName = 'Yasin Official';
      adminRoleTitle = 'Co-Founder & Lead Admin';
      adminInitial = 'Y';
    } else {
      adminDisplayName = curUser.name || (curUser.email ? curUser.email.split('@')[0] : 'Admin');
      adminRoleTitle = 'Authorized Admin';
      adminInitial = (adminDisplayName[0] || 'A').toUpperCase();
    }

    const nameEl = document.getElementById('admin-sidebar-name');
    const emailEl = document.getElementById('admin-sidebar-email');
    const roleEl = document.getElementById('admin-sidebar-role');
    const avatarEl = document.getElementById('admin-sidebar-avatar');

    if (nameEl) nameEl.textContent = adminDisplayName;
    if (emailEl) emailEl.textContent = curUser.email;
    if (roleEl) roleEl.textContent = adminRoleTitle;
    if (avatarEl) avatarEl.textContent = adminInitial;
  }

  // Initial renders
  updateAdminStats();
  renderAdminAccessList();
  renderAdminUsersTable();
  renderPendingDeposits();
  renderAdminChatsConsole();
  renderAdminOrders();
  renderAdminServices();
  initCloudSettingsTab();
  updateCloudStatusBadges();
  setupAdminListeners();

  // Reactive listeners for realtime updates
  window.addEventListener('saleem_chats_updated', () => {
    updateAdminStats();
    renderAdminChatsConsole();
  });

  window.addEventListener('saleem_deposits_updated', () => {
    updateAdminStats();
    renderPendingDeposits();
  });

  window.addEventListener('saleem_users_updated', () => {
    updateAdminStats();
    renderAdminUsersTable();
  });

  window.addEventListener('saleem_orders_updated', () => {
    updateAdminStats();
    renderAdminOrders();
  });

  window.addEventListener('saleem_supabase_connected', () => {
    updateCloudStatusBadges();
    AppState.showToast('Supabase Cloud Database connected and synchronized!', 'success');
  });

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.CHATS) {
      updateAdminStats();
      renderAdminChatsConsole();
    }
    if (e.key === STORAGE_KEYS.DEPOSITS) {
      updateAdminStats();
      renderPendingDeposits();
    }
    if (e.key === STORAGE_KEYS.USERS) {
      updateAdminStats();
      renderAdminUsersTable();
    }
    if (e.key === STORAGE_KEYS.ORDERS) {
      updateAdminStats();
      renderAdminOrders();
    }
  });
}

/* ==========================================================================
   TAB NAVIGATION SYSTEM (SWITCH BETWEEN VIEWS SMOOTHLY)
   ========================================================================== */
window.switchAdminTab = function(tabName) {
  activeAdminTab = tabName;

  // 1. Toggle Panes
  document.querySelectorAll('.admin-tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  const targetPane = document.getElementById(`pane-${tabName}`);
  if (targetPane) targetPane.classList.add('active');

  // 2. Update Desktop Sidebar Active State
  document.querySelectorAll('.sidebar-nav .sidebar-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // 3. Update Mobile Bottom Nav Active State
  document.querySelectorAll('.mobile-bottom-nav .mob-nav-item').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 4. Update Header Title
  const titleEl = document.getElementById('admin-page-title');
  if (titleEl) {
    const titles = {
      overview: 'Admin Control Center & Analytics',
      users: 'Manage Clients & Wallet Balances',
      deposits: 'Payment Approvals (EasyPaisa & UPaisa)',
      chats: 'In-Panel Live User Chats',
      orders: 'Manage & Dispatch Orders',
      cloud: 'Supabase Cloud Database Sync',
      provider: 'Wholesale Provider API & Profit Margins'
    };
    titleEl.textContent = titles[tabName] || 'Admin Control Center';
  }

  // 5. Trigger sub-renders when opening specific tabs
  if (tabName === 'users') {
    renderAdminAccessList();
    renderAdminUsersTable();
  }
  if (tabName === 'deposits') renderPendingDeposits();
  if (tabName === 'chats') renderAdminChatsConsole();
  if (tabName === 'orders') renderAdminOrders();
  if (tabName === 'cloud') initCloudSettingsTab();

  // Close mobile sidebar if open
  closeAdminMobileSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.toggleAdminMobileSidebar = function() {
  const sb = document.getElementById('admin-sidebar');
  const bd = document.getElementById('admin-sidebar-backdrop');
  if (sb) {
    sb.classList.toggle('mobile-open');
    if (bd) bd.classList.toggle('active', sb.classList.contains('mobile-open'));
  }
};

window.closeAdminMobileSidebar = function() {
  document.getElementById('admin-sidebar')?.classList.remove('mobile-open');
  document.getElementById('admin-sidebar-backdrop')?.classList.remove('active');
};

/* ==========================================================================
   ADMIN STATS & KPI METRICS
   ========================================================================== */
function updateAdminStats() {
  const orders = AppState.getOrders();
  const deposits = AppState.getDeposits();
  const chats = AppState.getChats();
  const users = AppState.getUsers();

  const totalRevenuePkr = orders.reduce((sum, o) => sum + (o.charge_pkr || 0), 0);
  const totalRevEl = document.getElementById('admin-stat-revenue');
  if (totalRevEl) {
    totalRevEl.textContent = `₨ ${totalRevenuePkr.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  const totalOrdersEl = document.getElementById('admin-stat-orders');
  if (totalOrdersEl) totalOrdersEl.textContent = orders.length;

  const pendingDeps = deposits.filter(d => d.status === 'Pending');
  const pendingEl = document.getElementById('admin-stat-pending-deposits');
  if (pendingEl) pendingEl.textContent = pendingDeps.length;

  const depBadge = document.getElementById('badge-deposits-count');
  if (depBadge) {
    if (pendingDeps.length > 0) {
      depBadge.textContent = pendingDeps.length;
      depBadge.style.display = 'inline-block';
    } else {
      depBadge.style.display = 'none';
    }
  }

  const usersStatEl = document.getElementById('admin-stat-users-total');
  if (usersStatEl) usersStatEl.textContent = users.length;

  const unreadChatsCount = chats.reduce((sum, c) => sum + (c.unreadByAdmin || 0), 0);
  const chatBadge = document.getElementById('badge-chats-count');
  if (chatBadge) {
    if (unreadChatsCount > 0) {
      chatBadge.textContent = unreadChatsCount;
      chatBadge.style.display = 'inline-block';
    } else {
      chatBadge.style.display = 'none';
    }
  }
}

/* ==========================================================================
   ADMIN ACCESS CONTROL (SALEEM AKHTAR & YASIN OFFICIAL & PARTNER ADMINS)
   ========================================================================== */
function renderAdminAccessList() {
  const container = document.getElementById('admin-list-container');
  if (!container) return;

  const admins = AppState.getAdminList();
  container.innerHTML = admins.map(a => {
    return `
      <div class="admin-chip-card" style="background:var(--bg-surface);padding:10px 14px;border-radius:10px;border:1px solid var(--border-color);display:flex;align-items:center;gap:12px;min-width:240px;flex:1;">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;flex-shrink:0;">
          ${(a.name || 'A')[0].toUpperCase()}
        </div>
        <div style="min-width:0;flex:1;">
          <div style="font-weight:800;font-size:13px;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
            <span>${AppState.escapeHtml(a.name)}</span>
            ${a.isRoot ? `<span style="font-size:10px;background:rgba(220,38,38,0.15);color:#dc2626;padding:1px 6px;border-radius:4px;font-weight:800;">ROOT</span>` : ''}
          </div>
          <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${AppState.escapeHtml(a.email)}
          </div>
          <div style="font-size:10.5px;color:#7c3aed;font-weight:700;">${a.roleTitle}</div>
        </div>
        <div>
          ${!a.isRoot ? `
            <button type="button" class="btn-reject" onclick="handleRemoveAdmin('${AppState.escapeHtml(a.email)}')" style="padding:4px 8px;font-size:11px;" title="Revoke Admin Access">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          ` : `
            <span style="font-size:13px;color:#f59e0b;" title="Protected Root Founder"><i class="fa-solid fa-crown"></i></span>
          `}
        </div>
      </div>
    `;
  }).join('');
}

window.handleAddNewAdminSubmit = function(e) {
  e.preventDefault();
  const input = document.getElementById('input-new-admin-email');
  if (!input || !input.value.trim()) return;

  const email = input.value.trim();
  const res = AppState.addAdminByEmail(email);
  if (res && res.success) {
    input.value = '';
    renderAdminAccessList();
    renderAdminUsersTable();
  }
};

window.handleRemoveAdmin = function(email) {
  if (confirm(`Are you sure you want to revoke Admin privileges from ${email}?`)) {
    const res = AppState.removeAdminByEmail(email);
    if (res && res.success) {
      renderAdminAccessList();
      renderAdminUsersTable();
    }
  }
};

/* Admin Change Password Modal Controls */
window.openAdminPasswordModal = function() {
  const m = document.getElementById('admin-password-modal');
  if (m) {
    m.style.display = 'flex';
    const inp = document.getElementById('adm-old-pass');
    if (inp) inp.focus();
  }
};

window.closeAdminPasswordModal = function() {
  const m = document.getElementById('admin-password-modal');
  if (m) m.style.display = 'none';
};

window.handleAdminChangePassword = async function(e) {
  e.preventDefault();
  const oldPass = document.getElementById('adm-old-pass')?.value || '';
  const newPass = document.getElementById('adm-new-pass')?.value || '';
  const confPass = document.getElementById('adm-confirm-new-pass')?.value || '';

  if (newPass !== confPass) {
    AppState.showToast('New passwords do not match!', 'error');
    return;
  }
  if (newPass.length < 6) {
    AppState.showToast('Password must be at least 6 characters long.', 'error');
    return;
  }

  const res = await AppState.changePassword(oldPass, newPass);
  if (res && res.success) {
    closeAdminPasswordModal();
    document.getElementById('adm-old-pass').value = '';
    document.getElementById('adm-new-pass').value = '';
    document.getElementById('adm-confirm-new-pass').value = '';
  } else {
    AppState.showToast(res ? res.message : 'Error updating password.', 'error');
  }
};

/* ==========================================================================
   USER MANAGEMENT & WALLET BALANCES (KEY USER REQUIREMENT)
   ========================================================================== */
window.renderAdminUsersTable = function() {
  const tbody = document.getElementById('admin-users-table-body');
  if (!tbody) return;

  const searchInput = document.getElementById('admin-user-search-input');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let users = AppState.getUsers();

  if (query) {
    users = users.filter(u =>
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.username && u.username.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.phone && u.phone.includes(query))
    );
  }

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--text-muted);font-size:14px;">No matching client accounts found.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const initial = (u.name || u.username || 'U')[0].toUpperCase();
    const isAdmin = (u.role === 'admin') || (u.email && isUserAdmin(u.email));
    const phone = u.phone || '';
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '').replace(/^0/, '92') : '';
    const userIdentifier = u.id || u.username || u.email;

    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#7c3aed);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex-shrink:0;">
              ${initial}
            </div>
            <div>
              <div style="font-weight:700;color:var(--text-primary);font-size:13.5px;">${AppState.escapeHtml(u.name || 'Client User')}</div>
              <div style="font-size:11.5px;color:var(--text-muted);">${AppState.escapeHtml(u.email)}</div>
            </div>
          </div>
        </td>
        <td>
          <div style="font-weight:700;">@${AppState.escapeHtml(u.username || 'user')}</div>
          <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10.5px;font-weight:800;text-transform:uppercase;margin-top:2px;background:${isAdmin ? 'rgba(124,58,237,0.15)' : 'rgba(59,130,246,0.15)'};color:${isAdmin ? '#8b5cf6' : '#3b82f6'};">
            ${isAdmin ? 'Administrator' : 'Client'}
          </span>
        </td>
        <td>
          ${phone ? `
            <a href="https://wa.me/${cleanPhone}" target="_blank" class="user-wa-chip" title="Chat on WhatsApp">
              <i class="fa-brands fa-whatsapp" style="color:#22c55e;"></i>
              <span>${AppState.escapeHtml(phone)}</span>
            </a>
          ` : `
            <span style="font-size:12px;color:var(--text-muted);">Not provided</span>
          `}
        </td>
        <td>
          <strong style="color:#10b981;font-size:14.5px;">₨ ${Number(u.balance_pkr || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          <div style="font-size:11px;color:var(--text-muted);">$ ${Number(u.balance_usd || 0).toFixed(2)}</div>
        </td>
        <td>
          <span style="font-weight:700;color:var(--text-secondary);">₨ ${Number(u.spent_pkr || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </td>
        <td style="font-size:12px;color:var(--text-muted);white-space:nowrap;">
          ${u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
        </td>
        <td>
          <div class="user-wallet-actions">
            <button type="button" class="btn-wallet-add" onclick="openBalanceModal('${AppState.escapeHtml(userIdentifier)}', 'add')" title="Add Funds (+ Credit)">
              <i class="fa-solid fa-plus"></i> Add
            </button>
            <button type="button" class="btn-wallet-sub" onclick="openBalanceModal('${AppState.escapeHtml(userIdentifier)}', 'sub')" title="Deduct Balance (- Debit)">
              <i class="fa-solid fa-minus"></i> Deduct
            </button>
            <button type="button" class="btn-wallet-zero" onclick="quickZeroUserBalance('${AppState.escapeHtml(userIdentifier)}')" title="Reset Balance to ₨ 0.00">
              <i class="fa-solid fa-rotate-left"></i> Set ₨ 0
            </button>
            <button type="button" class="admin-action-btn" onclick="openChatWithUser('${AppState.escapeHtml(u.username || userIdentifier)}')" title="Live Chat In-Panel" style="padding:6px 10px;">
              <i class="fa-solid fa-comments"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

/* ==========================================================================
   BALANCE ADJUSTMENT MODAL (ADD FUNDS, DEDUCT FUNDS, RESET TO 0)
   ========================================================================== */
window.openBalanceModal = function(userId, initialAction = 'add') {
  activeModalUserId = userId;
  const users = AppState.getUsers();
  const user = users.find(u =>
    (u.id && String(u.id) === String(userId)) ||
    (u.username && u.username.toLowerCase() === String(userId).toLowerCase()) ||
    (u.email && u.email.toLowerCase() === String(userId).toLowerCase())
  );

  if (!user) {
    AppState.showToast('User account not found.', 'error');
    return;
  }

  const nameEl = document.getElementById('bm-user-name');
  const emailEl = document.getElementById('bm-user-email');
  const balEl = document.getElementById('bm-current-balance');
  const actionSel = document.getElementById('bm-action-type');
  const amountInput = document.getElementById('bm-amount-input');

  if (nameEl) nameEl.textContent = `${user.name || user.username} (@${user.username})`;
  if (emailEl) emailEl.textContent = user.email;
  if (balEl) balEl.textContent = `₨ ${Number(user.balance_pkr || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  if (actionSel) actionSel.value = initialAction;
  if (amountInput) {
    amountInput.value = '';
    amountInput.focus();
  }

  updateBalanceModalLabels();

  const modal = document.getElementById('admin-balance-modal');
  if (modal) modal.classList.add('active');
};

window.closeBalanceModal = function() {
  const modal = document.getElementById('admin-balance-modal');
  if (modal) modal.classList.remove('active');
  activeModalUserId = null;
};

window.setBalanceModalInput = function(amount, action) {
  const amountInput = document.getElementById('bm-amount-input');
  const actionSel = document.getElementById('bm-action-type');
  if (amountInput) amountInput.value = amount;
  if (action && actionSel) actionSel.value = action;
  updateBalanceModalLabels();
};

window.updateBalanceModalLabels = function() {
  const actionSel = document.getElementById('bm-action-type');
  const labelEl = document.getElementById('bm-amount-label');
  if (!actionSel || !labelEl) return;

  const act = actionSel.value;
  if (act === 'add') {
    labelEl.textContent = 'Amount to Add in PKR (+ ₨ Credit)';
  } else if (act === 'sub') {
    labelEl.textContent = 'Amount to Deduct in PKR (- ₨ Debit)';
  } else if (act === 'set') {
    labelEl.textContent = 'New Exact Balance in PKR (= ₨ Override)';
  }
};

window.handleApplyBalanceAdjustment = function(e) {
  e.preventDefault();
  if (!activeModalUserId) return;

  const actionSel = document.getElementById('bm-action-type');
  const amountInput = document.getElementById('bm-amount-input');
  if (!actionSel || !amountInput) return;

  const action = actionSel.value;
  const amount = parseFloat(amountInput.value);

  if (isNaN(amount) || amount < 0) {
    AppState.showToast('Please enter a valid numeric amount.', 'error');
    return;
  }

  if (action === 'add') {
    AppState.adminAdjustUserFunds(activeModalUserId, amount);
  } else if (action === 'sub') {
    AppState.adminAdjustUserFunds(activeModalUserId, -amount);
  } else if (action === 'set') {
    AppState.adminUpdateUserBalance(activeModalUserId, amount);
  }

  closeBalanceModal();
  renderAdminUsersTable();
  updateAdminStats();
};

window.handleQuickZeroBalance = function() {
  if (!activeModalUserId) return;
  if (confirm("Are you sure you want to completely RESET this user's balance to ₨ 0.00?")) {
    AppState.adminResetUserBalance(activeModalUserId);
    closeBalanceModal();
    renderAdminUsersTable();
    updateAdminStats();
  }
};

window.quickZeroUserBalance = function(userId) {
  if (confirm(`Are you sure you want to RESET user balance to ₨ 0.00?`)) {
    AppState.adminResetUserBalance(userId);
    renderAdminUsersTable();
    updateAdminStats();
  }
};

window.openChatWithUser = function(userId) {
  switchAdminTab('chats');
  activeAdminChatUserId = userId;
  renderAdminChatsConsole();
};

/* ==========================================================================
   ADMIN LIVE CHAT CONSOLE (IN-PANEL LIVE CLIENT SUPPORT)
   ========================================================================== */
function renderAdminChatsConsole() {
  const usersListEl = document.getElementById('admin-chat-users-list');
  const messagesBoxEl = document.getElementById('admin-chat-messages-box');
  if (!usersListEl || !messagesBoxEl) return;

  const chats = AppState.getChats();
  if (chats.length === 0) {
    usersListEl.innerHTML = `<div style="padding:24px;color:var(--text-muted);text-align:center;font-size:13px;">No user conversations yet.</div>`;
    messagesBoxEl.innerHTML = `<div style="padding:24px;color:var(--text-muted);text-align:center;font-size:13.5px;">Select a conversation to reply inside the user's panel.</div>`;
    return;
  }

  if (!activeAdminChatUserId || !chats.some(c => c.userId === activeAdminChatUserId)) {
    activeAdminChatUserId = chats[0].userId;
  }

  usersListEl.innerHTML = chats.map(c => {
    const lastMsg = c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
    const isSelected = c.userId === activeAdminChatUserId;
    return `
      <div class="admin-chat-user-item ${isSelected ? 'active' : ''}" onclick="selectAdminChatUser('${AppState.escapeHtml(c.userId)}')">
        <div style="min-width:0;flex:1;">
          <div style="font-weight:700;font-size:13.5px;display:flex;align-items:center;gap:6px;">
            <i class="fa-solid fa-user-circle" style="color:var(--primary);"></i>
            <span>${AppState.escapeHtml(c.username || c.userId)}</span>
          </div>
          <div style="font-size:11.5px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">
            ${lastMsg ? AppState.escapeHtml(lastMsg.text) : 'No messages'}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          ${c.unreadByAdmin > 0 ? `<span class="saleem-chat-badge" style="background:var(--primary);color:#fff;">${c.unreadByAdmin}</span>` : `<span style="font-size:10.5px;color:var(--text-muted);">${lastMsg ? lastMsg.time : ''}</span>`}
        </div>
      </div>
    `;
  }).join('');

  const activeThread = chats.find(c => c.userId === activeAdminChatUserId);
  if (!activeThread) return;

  const headerName = document.getElementById('admin-active-chat-user');
  const headerMeta = document.getElementById('admin-active-chat-meta');
  const waBtn = document.getElementById('admin-active-chat-wa');

  if (headerName) headerName.textContent = `${activeThread.name || activeThread.username} (@${activeThread.username})`;
  if (headerMeta) headerMeta.textContent = `${activeThread.email || 'Client'}${activeThread.phone ? ' • Phone: ' + activeThread.phone : ''}`;
  if (waBtn) {
    if (activeThread.phone) {
      const cleanPhone = activeThread.phone.replace(/[^0-9]/g, '').replace(/^0/, '92');
      waBtn.href = `https://wa.me/${cleanPhone}`;
      waBtn.style.display = 'inline-flex';
    } else {
      waBtn.style.display = 'none';
    }
  }

  messagesBoxEl.innerHTML = (activeThread.messages || []).map(m => `
    <div class="chat-bubble-row ${m.sender === 'admin' ? 'chat-row-user' : 'chat-row-admin'}">
      <div class="chat-bubble ${m.sender === 'admin' ? 'bubble-user' : 'bubble-admin'}">
        <div class="bubble-sender">${m.sender === 'admin' ? 'You (Saleem Admin)' : AppState.escapeHtml(m.senderName || activeThread.username)}</div>
        <div class="bubble-text">${AppState.escapeHtml(m.text)}</div>
        <div class="bubble-time">${m.time}</div>
      </div>
    </div>
  `).join('');

  messagesBoxEl.scrollTop = messagesBoxEl.scrollHeight;
}

window.selectAdminChatUser = function(userId) {
  activeAdminChatUserId = userId;
  const chats = AppState.getChats();
  const idx = chats.findIndex(c => c.userId === userId);
  if (idx !== -1 && chats[idx].unreadByAdmin > 0) {
    chats[idx].unreadByAdmin = 0;
    AppState.saveChats(chats);
  }
  renderAdminChatsConsole();
};

window.handleAdminChatReply = function(e) {
  e.preventDefault();
  const input = document.getElementById('admin-chat-reply-input');
  if (!input || !input.value.trim() || !activeAdminChatUserId) return;

  AppState.sendAdminChatReply(activeAdminChatUserId, input.value.trim());
  input.value = '';
  renderAdminChatsConsole();
  AppState.showToast(`Reply sent to @${activeAdminChatUserId} inside panel!`, 'success');
};

/* ==========================================================================
   DEPOSITS MANAGEMENT (EASYPAISA & UPAISA APPROVALS)
   ========================================================================== */
window.filterAdminDeposits = function(filter) {
  currentDepositFilter = filter;
  renderPendingDeposits();
};

function renderPendingDeposits() {
  const tbody = document.getElementById('admin-deposits-body');
  if (!tbody) return;

  let deposits = AppState.getDeposits();
  if (currentDepositFilter === 'Pending') {
    deposits = deposits.filter(d => d.status === 'Pending');
  }

  if (deposits.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);">No deposits found${currentDepositFilter === 'Pending' ? ' with Pending status' : ''}.</td></tr>`;
    return;
  }

  tbody.innerHTML = deposits.map(d => `
    <tr>
      <td><strong>#${d.id}</strong></td>
      <td>
        <div style="font-weight:700;">@${AppState.escapeHtml(d.userId || 'Client')}</div>
        <div style="font-size:11px;color:var(--text-muted);">${AppState.escapeHtml(d.userEmail || '')}</div>
      </td>
      <td><strong>${AppState.escapeHtml(d.method)}</strong></td>
      <td><code style="background:var(--bg-surface-soft);padding:3px 6px;border-radius:6px;font-size:12px;">${AppState.escapeHtml(d.tid)}</code></td>
      <td><strong style="color:#10b981;font-size:14px;">₨ ${Number(d.amount_pkr || 0).toLocaleString()}</strong></td>
      <td style="font-size:12px;color:var(--text-muted);">${d.created_at || 'Recent'}</td>
      <td>
        <span class="badge-status ${d.status === 'Approved' ? 'badge-completed' : d.status === 'Rejected' ? 'badge-canceled' : 'badge-pending'}">
          ${d.status}
        </span>
      </td>
      <td style="text-align:right;">
        ${d.status === 'Pending' ? `
          <button onclick="approveDeposit('${d.id}')" class="btn-approve" style="padding:6px 12px;font-size:12px;">
            <i class="fa-solid fa-check"></i> Approve
          </button>
          <button onclick="rejectDeposit('${d.id}')" class="btn-reject" style="margin-left:6px;padding:6px 12px;font-size:12px;">
            <i class="fa-solid fa-xmark"></i> Reject
          </button>
        ` : `
          <span style="font-size:12px;color:var(--text-muted);"><i class="fa-solid fa-check-circle" style="color:#10b981;"></i> Processed</span>
        `}
      </td>
    </tr>
  `).join('');
}

window.approveDeposit = function(depositId) {
  const deposits = AppState.getDeposits();
  const dep = deposits.find(d => String(d.id) === String(depositId));
  if (!dep) return;

  dep.status = 'Approved';
  AppState.saveDeposits(deposits);

  // Auto credit the user's wallet
  const users = AppState.getUsers();
  const targetUser = users.find(u =>
    (dep.userEmail && u.email && u.email.toLowerCase().trim() === dep.userEmail.toLowerCase().trim()) ||
    (dep.userId && u.username && u.username.toLowerCase().trim() === dep.userId.toLowerCase().trim())
  );

  if (targetUser) {
    targetUser.balance_pkr = Number(((targetUser.balance_pkr || 0) + dep.amount_pkr).toFixed(2));
    targetUser.balance_usd = Number(((targetUser.balance_usd || 0) + (dep.amount_usd || dep.amount_pkr / 280)).toFixed(2));
    AppState.saveUsers(users);

    if (AppState.currentUser && (AppState.currentUser.email === targetUser.email || AppState.currentUser.username === targetUser.username)) {
      AppState.currentUser.balance_pkr = targetUser.balance_pkr;
      AppState.currentUser.balance_usd = targetUser.balance_usd;
      AppState.saveUser();
    }

    // Send automated confirmation in live chat
    AppState.sendAdminChatReply(
      targetUser.username || targetUser.email,
      `🎉 Deposit #${depositId} Approved! ₨ ${dep.amount_pkr.toLocaleString()} has been credited to your wallet via ${dep.method}. Thank you!`
    );
  }

  // Sync to Supabase if connected
  if (SaleemSupabase.isConfigured() && SaleemSupabase.client) {
    SaleemSupabase.client
      .from('deposits')
      .update({ status: 'Approved' })
      .eq('id', depositId)
      .then();
  }

  updateAdminStats();
  renderPendingDeposits();
  renderAdminUsersTable();
  AppState.showToast(`Deposit #${depositId} Approved! ₨ ${dep.amount_pkr.toLocaleString()} credited to ${targetUser ? '@' + targetUser.username : 'user account'}.`, 'success');
};

window.rejectDeposit = function(depositId) {
  const deposits = AppState.getDeposits();
  const dep = deposits.find(d => String(d.id) === String(depositId));
  if (!dep) return;

  dep.status = 'Rejected';
  AppState.saveDeposits(deposits);

  if (dep.userId || dep.userEmail) {
    AppState.sendAdminChatReply(
      dep.userId || dep.userEmail,
      `⚠️ Deposit #${depositId} (₨ ${dep.amount_pkr}) could not be verified with TID: ${dep.tid}. Please verify your transaction receipt and contact admin support on WhatsApp: 03163846672.`
    );
  }

  // Sync to Supabase if connected
  if (SaleemSupabase.isConfigured() && SaleemSupabase.client) {
    SaleemSupabase.client
      .from('deposits')
      .update({ status: 'Rejected' })
      .eq('id', depositId)
      .then();
  }

  updateAdminStats();
  renderPendingDeposits();
  AppState.showToast(`Deposit #${depositId} marked as Rejected.`, 'error');
};

/* ==========================================================================
   ORDERS MANAGEMENT & DISPATCHER
   ========================================================================== */
function renderAdminOrders() {
  const tbody = document.getElementById('admin-orders-body');
  if (!tbody) return;

  const orders = AppState.getOrders();
  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted);">No orders placed yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>
        <div style="font-weight:700;font-size:13px;">${AppState.escapeHtml(o.service_name || 'Service #' + o.service_id)}</div>
        <div style="font-size:11px;color:var(--text-muted);">ID: ${o.service_id} • User: @${AppState.escapeHtml(o.user_id || 'client')}</div>
      </td>
      <td>
        <a href="${AppState.escapeHtml(o.link)}" target="_blank" style="color:var(--primary);text-decoration:underline;font-size:12.5px;">
          ${AppState.escapeHtml(o.link ? o.link.substring(0, 24) + '...' : 'Target Link')}
        </a>
      </td>
      <td><strong>${Number(o.quantity || 0).toLocaleString()}</strong></td>
      <td><strong style="color:#10b981;">₨ ${Number(o.charge_pkr || 0).toFixed(2)}</strong></td>
      <td>
        <select onchange="changeOrderStatus(${o.id}, this.value)" class="form-input" style="padding:4px 8px;font-size:12px;width:auto;">
          <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="In progress" ${o.status === 'In progress' ? 'selected' : ''}>In progress</option>
          <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Canceled" ${o.status === 'Canceled' ? 'selected' : ''}>Canceled (Auto-Refund)</option>
        </select>
      </td>
    </tr>
  `).join('');
}

window.changeOrderStatus = function(orderId, newStatus) {
  const orders = AppState.getOrders();
  const order = orders.find(o => o.id === parseInt(orderId));
  if (!order) return;

  const oldStatus = order.status;
  order.status = newStatus;

  if (newStatus === 'Canceled' && oldStatus !== 'Canceled') {
    // Refund charge to user wallet
    const users = AppState.getUsers();
    const targetUser = users.find(u =>
      (order.user_id && (u.username === order.user_id || u.email === order.user_id)) ||
      (order.user_email && u.email === order.user_email)
    );

    if (targetUser) {
      targetUser.balance_pkr = Number(((targetUser.balance_pkr || 0) + order.charge_pkr).toFixed(2));
      AppState.saveUsers(users);
      if (AppState.currentUser && (AppState.currentUser.email === targetUser.email || AppState.currentUser.username === targetUser.username)) {
        AppState.currentUser.balance_pkr = targetUser.balance_pkr;
        AppState.saveUser();
      }
    }

    AppState.showToast(`Order #${orderId} Canceled & ₨ ${order.charge_pkr} refunded to client wallet!`, 'info');
  } else {
    AppState.showToast(`Order #${orderId} status updated to: ${newStatus}`, 'success');
  }

  AppState.saveOrders(orders);
  updateAdminStats();
};

/* ==========================================================================
   WHOLESALE SERVICES & PROVIDER API
   ========================================================================== */
function renderAdminServices() {
  const tbody = document.getElementById('admin-services-body');
  if (!tbody || typeof MASTER_SERVICES === 'undefined') return;

  tbody.innerHTML = MASTER_SERVICES.slice(0, 100).map(s => `
    <tr>
      <td><code>#${s.id}</code></td>
      <td><strong>${AppState.escapeHtml(s.name)}</strong></td>
      <td><strong style="color:#10b981;">₨ ${s.rate_pkr}</strong></td>
      <td>$ ${s.rate_usd}</td>
      <td style="font-size:12px;color:var(--text-muted);">${Number(s.min).toLocaleString()} - ${Number(s.max).toLocaleString()}</td>
      <td><span style="color:#10b981;font-weight:700;font-size:12px;"><i class="fa-solid fa-circle-check"></i> Active</span></td>
    </tr>
  `).join('');
}

function setupAdminListeners() {
  const testApiBtn = document.getElementById('btn-test-provider-api');
  if (testApiBtn) {
    testApiBtn.addEventListener('click', () => {
      AppState.showToast('Connecting to Wholesale SMM Provider Gateway API (v2)...', 'info');
      setTimeout(() => {
        AppState.showToast('Peakerr Global Provider API connected! Wholesale balance: $148.20 USD.', 'success');
      }, 1000);
    });
  }

  const marginSlider = document.getElementById('profit-margin-slider');
  const marginLabel = document.getElementById('profit-margin-label');
  if (marginSlider && marginLabel) {
    marginSlider.addEventListener('input', () => {
      marginLabel.textContent = `${marginSlider.value}% Markup`;
    });
  }
}

/* ==========================================================================
   SUPABASE CLOUD DATABASE CONFIGURATION & 1-CLICK SCHEMA
   ========================================================================== */
function initCloudSettingsTab() {
  const cfg = SaleemSupabase.getConfig();
  const urlInput = document.getElementById('cfg-sp-url');
  const keyInput = document.getElementById('cfg-sp-key');

  if (urlInput && cfg.url) urlInput.value = cfg.url;
  if (keyInput && cfg.anonKey) keyInput.value = cfg.anonKey;

  updateCloudStatusBadges();
}

function updateCloudStatusBadges() {
  const isOnline = SaleemSupabase.isConfigured();

  // Topbar indicator
  const topInd = document.getElementById('admin-cloud-indicator');
  const topLbl = document.getElementById('admin-cloud-label');
  if (topInd && topLbl) {
    if (isOnline) {
      topInd.className = 'cloud-status-pill online';
      topLbl.textContent = 'Supabase Cloud';
    } else {
      topInd.className = 'cloud-status-pill offline';
      topLbl.textContent = 'Local Storage';
    }
  }

  // Cloud tab badge
  const badge = document.getElementById('cloud-connection-badge');
  const badgeText = document.getElementById('cloud-connection-text');
  if (badge && badgeText) {
    if (isOnline) {
      badge.className = 'cloud-status-pill online';
      badgeText.textContent = 'Connected & Synced with Supabase Cloud';
    } else {
      badge.className = 'cloud-status-pill offline';
      badgeText.textContent = 'Not Connected (Using Browser Storage)';
    }
  }
}

window.handleSaveSupabaseConfig = async function(e) {
  e.preventDefault();
  const urlInput = document.getElementById('cfg-sp-url');
  const keyInput = document.getElementById('cfg-sp-key');
  if (!urlInput || !keyInput) return;

  const url = urlInput.value.trim();
  const key = keyInput.value.trim();

  if (!url || !key) {
    AppState.showToast('Please enter both Project URL and Anon API Key.', 'error');
    return;
  }

  SaleemSupabase.saveConfig(url, key);
  AppState.showToast('Testing Supabase Cloud Database connection...', 'info');

  const ok = await SaleemSupabase.testConnection();
  updateCloudStatusBadges();

  if (ok) {
    AppState.showToast('Supabase Cloud connected successfully! Syncing live data...', 'success');
    await AppState.syncWithSupabase();
    renderAdminUsersTable();
    renderPendingDeposits();
    renderAdminChatsConsole();
    updateAdminStats();
  } else {
    AppState.showToast('Saved credentials, but connection failed. Please ensure the SQL Schema is executed.', 'warning');
  }
};

window.handleDisconnectSupabase = function() {
  if (confirm('Disconnect Supabase Cloud and revert back to offline Local Storage mode?')) {
    SaleemSupabase.clearConfig();
    updateCloudStatusBadges();
    const urlInput = document.getElementById('cfg-sp-url');
    const keyInput = document.getElementById('cfg-sp-key');
    if (urlInput) urlInput.value = '';
    if (keyInput) keyInput.value = '';
    AppState.showToast('Disconnected Supabase. Offline mode active.', 'info');
  }
};

window.copySupabaseSchema = function() {
  const schemaSQL = `-- ==============================================================================
-- SALEEM SMM PANEL — COMPLETE SUPABASE POSTGRESQL SCHEMA
-- Run this in your Supabase SQL Editor: SQL Editor -> New Query -> Run
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'client',
  balance_pkr NUMERIC(12, 2) DEFAULT 0.00,
  balance_usd NUMERIC(12, 2) DEFAULT 0.00,
  spent_pkr NUMERIC(12, 2) DEFAULT 0.00,
  spent_usd NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.deposits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  username TEXT,
  user_email TEXT,
  method TEXT NOT NULL,
  tid TEXT NOT NULL,
  amount_pkr NUMERIC(12, 2) NOT NULL,
  amount_usd NUMERIC(12, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  username TEXT,
  user_email TEXT,
  service_id INT NOT NULL,
  service_name TEXT NOT NULL,
  link TEXT NOT NULL,
  quantity INT NOT NULL,
  charge_pkr NUMERIC(12, 2) NOT NULL,
  charge_usd NUMERIC(12, 2) NOT NULL,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chats (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,
  sender TEXT NOT NULL,
  sender_name TEXT,
  message TEXT NOT NULL,
  is_read_by_admin BOOLEAN DEFAULT false,
  is_read_by_user BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Insert Profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Public Read Deposits" ON public.deposits FOR SELECT USING (true);
CREATE POLICY "Public Insert Deposits" ON public.deposits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Deposits" ON public.deposits FOR UPDATE USING (true);

CREATE POLICY "Public Read Orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Orders" ON public.orders FOR UPDATE USING (true);

CREATE POLICY "Public Read Chats" ON public.chats FOR SELECT USING (true);
CREATE POLICY "Public Insert Chats" ON public.chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Chats" ON public.chats FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, name, phone, role, balance_pkr)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    CASE
      WHEN new.email IN ('saleembaloch1857@gmail.com', 'yasinofficial03098158572@gmail.com') THEN 'admin'
      ELSE 'client'
    END,
    0.00
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    name = EXCLUDED.name;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(schemaSQL).then(() => {
      AppState.showToast('Supabase SQL Schema script copied! Paste it in Supabase SQL Editor and run.', 'success');
    }).catch(() => {
      prompt('Copy the SQL Schema below:', schemaSQL);
    });
  } else {
    prompt('Copy the SQL Schema below:', schemaSQL);
  }
};
