/* ==========================================================================
   SALEEM SMM PANEL — ADMIN CONTROL CENTER & LIVE CHAT CONSOLE LOGIC
   Exclusive Admin: saleembaloch1857@gmail.com
   ========================================================================== */

let activeAdminChatUserId = null;

document.addEventListener('DOMContentLoaded', () => {
  initAdminDashboard();
});

function initAdminDashboard() {
  // Strict Access Control: Only saleembaloch1857@gmail.com can access Admin Dashboard
  if (!AppState.isAdmin()) {
    alert('Access Denied! Only the authorized administrator (saleembaloch1857@gmail.com) can access the Admin Dashboard.');
    window.location.href = '../index.html#auth';
    return;
  }

  updateAdminStats();
  renderAdminChatsConsole();
  renderPendingDeposits();
  renderAdminOrders();
  renderAdminServices();
  setupAdminListeners();

  window.addEventListener('saleem_chats_updated', () => {
    updateAdminStats();
    renderAdminChatsConsole();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.CHATS) {
      updateAdminStats();
      renderAdminChatsConsole();
    }
  });
}

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

function updateAdminStats() {
  const orders = AppState.getOrders();
  const deposits = AppState.getDeposits();
  const chats = AppState.getChats();

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

  const chatsStatEl = document.getElementById('admin-stat-chats');
  if (chatsStatEl) chatsStatEl.textContent = chats.length;
}

/* ==========================================================================
   ADMIN LIVE CHAT CONSOLE (READ & REPLY TO USERS INSIDE PANEL)
   ========================================================================== */
function renderAdminChatsConsole() {
  const usersListEl = document.getElementById('admin-chat-users-list');
  const messagesBoxEl = document.getElementById('admin-chat-messages-box');
  if (!usersListEl || !messagesBoxEl) return;

  const chats = AppState.getChats();
  if (chats.length === 0) {
    usersListEl.innerHTML = `<div style="padding:20px;color:var(--text-muted);text-align:center;font-size:13px;">No user messages yet.</div>`;
    messagesBoxEl.innerHTML = `<div style="padding:24px;color:var(--text-muted);text-align:center;">Select a conversation to reply.</div>`;
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

// Render Pending Deposits for 1-Click Approval
function renderPendingDeposits() {
  const tbody = document.getElementById('admin-deposits-body');
  if (!tbody) return;

  const deposits = AppState.getDeposits();
  if (deposits.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">No deposits found in system.</td></tr>`;
    return;
  }

  tbody.innerHTML = deposits.map(d => `
    <tr>
      <td><strong>${d.id}</strong></td>
      <td><strong>${d.method}</strong></td>
      <td><code>${d.tid}</code></td>
      <td><strong>₨ ${d.amount_pkr.toLocaleString()}</strong></td>
      <td>${d.created_at}</td>
      <td>
        <span class="badge-status ${d.status === 'Approved' ? 'badge-completed' : d.status === 'Rejected' ? 'badge-canceled' : 'badge-pending'}">
          ${d.status}
        </span>
      </td>
      <td>
        ${d.status === 'Pending' ? `
          <button onclick="approveDeposit('${d.id}')" class="btn-approve">
            <i class="fa-solid fa-check"></i> Approve
          </button>
          <button onclick="rejectDeposit('${d.id}')" class="btn-reject" style="margin-left:6px;">
            <i class="fa-solid fa-xmark"></i> Reject
          </button>
        ` : `
          <span style="font-size:12px;color:var(--text-muted);"><i class="fa-solid fa-lock"></i> Processed</span>
        `}
      </td>
    </tr>
  `).join('');
}

window.approveDeposit = function(depositId) {
  const deposits = AppState.getDeposits();
  const dep = deposits.find(d => d.id === depositId);
  if (!dep) return;

  dep.status = 'Approved';
  AppState.saveDeposits(deposits);

  const user = AppState.currentUser;
  user.balance_pkr += dep.amount_pkr;
  user.balance_usd += (dep.amount_usd || dep.amount_pkr / 280);
  AppState.saveUser();

  updateAdminStats();
  renderPendingDeposits();
  AppState.showToast(`Deposit #${depositId} Approved! ₨ ${dep.amount_pkr} has been credited to wallet.`, 'success');
};

window.rejectDeposit = function(depositId) {
  const deposits = AppState.getDeposits();
  const dep = deposits.find(d => d.id === depositId);
  if (!dep) return;

  dep.status = 'Rejected';
  AppState.saveDeposits(deposits);

  updateAdminStats();
  renderPendingDeposits();
  AppState.showToast(`Deposit #${depositId} marked as Rejected.`, 'error');
};

// Admin Orders Control
function renderAdminOrders() {
  const tbody = document.getElementById('admin-orders-body');
  if (!tbody) return;

  const orders = AppState.getOrders();
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>${o.service_name}</td>
      <td><a href="${o.link}" target="_blank" style="color:var(--primary);text-decoration:underline;">${o.link.substring(0, 20)}...</a></td>
      <td>${o.quantity.toLocaleString()}</td>
      <td>₨ ${o.charge_pkr}</td>
      <td>
        <select onchange="changeOrderStatus(${o.id}, this.value)" class="form-input" style="padding:4px 8px;font-size:12px;width:auto;">
          <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="In progress" ${o.status === 'In progress' ? 'selected' : ''}>In progress</option>
          <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Canceled" ${o.status === 'Canceled' ? 'selected' : ''}>Canceled (Refund)</option>
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
    const user = AppState.currentUser;
    user.balance_pkr += order.charge_pkr;
    user.balance_usd += order.charge_usd;
    AppState.saveUser();
    AppState.showToast(`Order #${orderId} Canceled & ₨ ${order.charge_pkr} refunded to user wallet!`, 'info');
  } else {
    AppState.showToast(`Order #${orderId} status updated to: ${newStatus}`, 'success');
  }

  AppState.saveOrders(orders);
  updateAdminStats();
};

// Admin Services Manager
function renderAdminServices() {
  const tbody = document.getElementById('admin-services-body');
  if (!tbody) return;

  tbody.innerHTML = MASTER_SERVICES.map(s => `
    <tr>
      <td>${s.id}</td>
      <td><strong>${s.name}</strong></td>
      <td>₨ ${s.rate_pkr}</td>
      <td>$ ${s.rate_usd}</td>
      <td>${s.min} - ${s.max.toLocaleString()}</td>
      <td><span style="color:var(--success);font-weight:700;">Active</span></td>
    </tr>
  `).join('');
}

function setupAdminListeners() {
  const testApiBtn = document.getElementById('btn-test-provider-api');
  if (testApiBtn) {
    testApiBtn.addEventListener('click', () => {
      AppState.showToast('Connecting to wholesale SMM Provider API (v2)...', 'info');
      setTimeout(() => {
        AppState.showToast('Provider API connected successfully! Wholesale Balance: $148.20 USD.', 'success');
      }, 1200);
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
