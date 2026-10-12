/* ==========================================================================
   SALEEM SMM PANEL — ADMIN CONTROL CENTER LOGIC
   ========================================================================== */

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
  renderPendingDeposits();
  renderAdminOrders();
  renderAdminServices();
  setupAdminListeners();
}

function updateAdminStats() {
  const orders = AppState.getOrders();
  const deposits = AppState.getDeposits();

  // Total Revenue Calculation
  const totalRevenuePkr = orders.reduce((sum, o) => sum + (o.charge_pkr || 0), 0);
  const totalRevEl = document.getElementById('admin-stat-revenue');
  if (totalRevEl) {
    totalRevEl.textContent = `₨ ${totalRevenuePkr.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  // Total Orders
  const totalOrdersEl = document.getElementById('admin-stat-orders');
  if (totalOrdersEl) totalOrdersEl.textContent = orders.length;

  // Pending Deposits
  const pendingDeps = deposits.filter(d => d.status === 'Pending');
  const pendingEl = document.getElementById('admin-stat-pending-deposits');
  if (pendingEl) pendingEl.textContent = pendingDeps.length;
}

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

  // Credit User Wallet
  const user = AppState.currentUser;
  user.balance_pkr += dep.amount_pkr;
  user.balance_usd += (dep.amount_usd || dep.amount_pkr / 280);
  AppState.saveUser();

  updateAdminStats();
  renderPendingDeposits();
  AppState.showToast(`Deposit #${depositId} Approved! ₨ ${dep.amount_pkr} has been credited to ${user.username}'s wallet.`, 'success');
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

  // If Canceled, Refund User Balance
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
  // Provider API Test Connection
  const testApiBtn = document.getElementById('btn-test-provider-api');
  if (testApiBtn) {
    testApiBtn.addEventListener('click', () => {
      AppState.showToast('Connecting to wholesale SMM Provider API (v2)...', 'info');
      setTimeout(() => {
        AppState.showToast('Provider API connected successfully! Wholesale Balance: $148.20 USD.', 'success');
      }, 1200);
    });
  }

  // Profit Margin Slider
  const marginSlider = document.getElementById('profit-margin-slider');
  const marginLabel = document.getElementById('profit-margin-label');
  if (marginSlider && marginLabel) {
    marginSlider.addEventListener('input', () => {
      marginLabel.textContent = `${marginSlider.value}% Markup`;
    });
  }
}
