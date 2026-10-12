/* ==========================================================================
   SALEEM SMM PANEL — CLIENT DASHBOARD LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

let currentSelectedService = null;

function initDashboard() {
  updateUserUI();
  populateCategories();
  setupOrderListeners();
  renderOrdersTable();
  setupSidebarNavigation();
  setupDepositListeners();
  renderServicesCatalog();
}

function updateUserUI() {
  const user = AppState.currentUser;
  if (!user) return;

  const nameEls = document.querySelectorAll('.user-display-name');
  nameEls.forEach(el => el.textContent = user.username);

  const avatarEl = document.querySelector('.user-quick-avatar');
  if (avatarEl && user.username) {
    avatarEl.textContent = user.username.charAt(0).toUpperCase();
  }

  const balEls = document.querySelectorAll('.user-display-balance');
  balEls.forEach(el => {
    el.textContent = AppState.formatMoney(user.balance_usd, user.balance_pkr);
  });

  const spentEls = document.querySelectorAll('.user-display-spent');
  spentEls.forEach(el => {
    el.textContent = AppState.formatMoney(user.spent_usd, user.spent_pkr);
  });

  const orders = AppState.getOrders();
  const totalOrdersEl = document.getElementById('stat-total-orders');
  if (totalOrdersEl) totalOrdersEl.textContent = orders.length;

  const activeOrdersEl = document.getElementById('stat-active-orders');
  if (activeOrdersEl) {
    const active = orders.filter(o => ['Pending', 'Processing', 'In progress'].includes(o.status)).length;
    activeOrdersEl.textContent = active;
  }
}

// Populate Category & Service Selects
function populateCategories() {
  const catSelect = document.getElementById('order-category-select');
  if (!catSelect) return;

  catSelect.innerHTML = MASTER_CATEGORIES.map(cat => `
    <option value="${cat.id}">${cat.name}</option>
  `).join('');

  catSelect.addEventListener('change', () => {
    populateServices(catSelect.value);
  });

  // Populate first category by default
  populateServices(MASTER_CATEGORIES[0].id);
}

function populateServices(catId) {
  const srvSelect = document.getElementById('order-service-select');
  if (!srvSelect) return;

  const services = getServicesByCategory(catId);
  srvSelect.innerHTML = services.map(srv => {
    const priceStr = AppState.currency === 'PKR' ? `₨ ${srv.rate_pkr}` : `$ ${srv.rate_usd}`;
    return `<option value="${srv.id}">[ID: ${srv.id}] ${srv.name} — ${priceStr}/1K</option>`;
  }).join('');

  srvSelect.addEventListener('change', () => {
    onServiceSelected(srvSelect.value);
  });

  if (services.length > 0) {
    onServiceSelected(services[0].id);
  }
}

function onServiceSelected(serviceId) {
  currentSelectedService = getServiceById(serviceId);
  if (!currentSelectedService) return;

  const descBox = document.getElementById('service-description-text');
  if (descBox) descBox.textContent = currentSelectedService.description;

  const minMaxLabel = document.getElementById('service-min-max-badge');
  if (minMaxLabel) {
    minMaxLabel.textContent = `Min: ${currentSelectedService.min.toLocaleString()} | Max: ${currentSelectedService.max.toLocaleString()}`;
  }

  const ratePer1kEl = document.getElementById('summary-rate-per-1k');
  if (ratePer1kEl) {
    ratePer1kEl.textContent = AppState.formatMoney(currentSelectedService.rate_usd, currentSelectedService.rate_pkr);
  }

  const speedEl = document.getElementById('summary-delivery-speed');
  if (speedEl) {
    speedEl.textContent = currentSelectedService.avg_time || '35 minutes';
  }

  calculateOrderPrice();
}

function setupOrderListeners() {
  const qtyInput = document.getElementById('order-quantity-input');
  if (qtyInput) {
    qtyInput.addEventListener('input', calculateOrderPrice);
  }

  const orderForm = document.getElementById('new-order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', handleOrderSubmit);
  }
}

function calculateOrderPrice() {
  if (!currentSelectedService) return;

  const qtyInput = document.getElementById('order-quantity-input');
  const qty = parseInt(qtyInput ? qtyInput.value : 0) || 0;

  const ratePkrPerUnit = currentSelectedService.rate_pkr / 1000;
  const rateUsdPerUnit = currentSelectedService.rate_usd / 1000;

  const totalPkr = qty * ratePkrPerUnit;
  const totalUsd = qty * rateUsdPerUnit;

  const totalChargeEl = document.getElementById('summary-total-charge');
  if (totalChargeEl) {
    totalChargeEl.textContent = AppState.formatMoney(totalUsd, totalPkr);
  }
}

function handleOrderSubmit(e) {
  e.preventDefault();
  if (!currentSelectedService) return;

  const linkInput = document.getElementById('order-link-input');
  const qtyInput = document.getElementById('order-quantity-input');

  const link = linkInput.value.trim();
  const qty = parseInt(qtyInput.value) || 0;

  if (!link) {
    AppState.showToast('Please enter a valid link/URL for this service', 'error');
    return;
  }

  if (qty < currentSelectedService.min) {
    AppState.showToast(`Minimum quantity for this service is ${currentSelectedService.min}`, 'error');
    return;
  }

  if (qty > currentSelectedService.max) {
    AppState.showToast(`Maximum quantity for this service is ${currentSelectedService.max}`, 'error');
    return;
  }

  const chargePkr = (qty * currentSelectedService.rate_pkr) / 1000;
  const chargeUsd = (qty * currentSelectedService.rate_usd) / 1000;

  // Balance Check
  const user = AppState.currentUser;
  if (user.balance_pkr < chargePkr) {
    AppState.showToast(`Insufficient balance! Please Add Funds to place this order. Required: ${AppState.formatMoney(chargeUsd, chargePkr)}`, 'error');
    return;
  }

  // Deduct Balance
  user.balance_pkr -= chargePkr;
  user.balance_usd -= chargeUsd;
  user.spent_pkr += chargePkr;
  user.spent_usd += chargeUsd;
  AppState.saveUser();

  // Create Order Record
  const newOrder = {
    id: Math.floor(10000 + Math.random() * 90000),
    service_id: currentSelectedService.id,
    service_name: currentSelectedService.name,
    link: link,
    quantity: qty,
    charge_pkr: chargePkr,
    charge_usd: chargeUsd,
    status: "Pending",
    start_count: Math.floor(100 + Math.random() * 500),
    remains: qty,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  const orders = AppState.getOrders();
  orders.unshift(newOrder);
  AppState.saveOrders(orders);

  // Reset form
  linkInput.value = '';
  qtyInput.value = '';
  calculateOrderPrice();

  updateUserUI();
  renderOrdersTable();
  AppState.showToast(`Order #${newOrder.id} successfully placed! Status: Pending wholesale delivery.`, 'success');
}

// Render Orders History Table
function renderOrdersTable(filterStatus = 'all', searchQuery = '') {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  let orders = AppState.getOrders();

  if (filterStatus !== 'all') {
    orders = orders.filter(o => o.status.toLowerCase() === filterStatus.toLowerCase());
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    orders = orders.filter(o =>
      o.id.toString().includes(q) ||
      o.service_name.toLowerCase().includes(q) ||
      o.link.toLowerCase().includes(q)
    );
  }

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted);">No orders found for this filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    let badgeClass = 'badge-pending';
    if (o.status === 'In progress') badgeClass = 'badge-inprogress';
    if (o.status === 'Completed') badgeClass = 'badge-completed';
    if (o.status === 'Processing') badgeClass = 'badge-processing';
    if (o.status === 'Canceled') badgeClass = 'badge-canceled';

    return `
      <tr>
        <td><strong>#${o.id}</strong></td>
        <td>${o.created_at}</td>
        <td>
          <div style="font-weight:600;max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${o.service_name}
          </div>
        </td>
        <td>
          <a href="${o.link}" target="_blank" style="color:var(--primary);text-decoration:underline;font-size:12px;">
            ${o.link.substring(0, 24)}...
          </a>
        </td>
        <td><strong>${o.quantity.toLocaleString()}</strong></td>
        <td>${AppState.formatMoney(o.charge_usd, o.charge_pkr)}</td>
        <td><span class="badge-status ${badgeClass}">${o.status}</span></td>
        <td>
          <button onclick="requestRefill(${o.id})" class="btn-outline" style="padding:4px 8px;font-size:11px;border-radius:4px;">
            <i class="fa-solid fa-arrows-rotate"></i> Refill
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.requestRefill = function(orderId) {
  AppState.showToast(`Refill request for Order #${orderId} sent to server! Speed checks initiated.`, 'info');
};

// Sidebar Tab View Switching
function setupSidebarNavigation() {
  const navItems = document.querySelectorAll('.sidebar-item[data-view]');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const targetView = item.getAttribute('data-view');
      switchView(targetView);

      // Close mobile sidebar if open
      document.querySelector('.dashboard-sidebar')?.classList.remove('mobile-open');
      document.getElementById('sidebar-backdrop')?.classList.remove('active');
    });
  });

  // Mobile hamburger
  const mobBtn = document.querySelector('.topbar-mobile-btn');
  if (mobBtn) {
    mobBtn.addEventListener('click', () => {
      const sb = document.querySelector('.dashboard-sidebar');
      const bd = document.getElementById('sidebar-backdrop');
      if (sb) {
        sb.classList.toggle('mobile-open');
        if (bd) bd.classList.toggle('active', sb.classList.contains('mobile-open'));
      }
    });
  }

  // Orders Table Tabs
  document.querySelectorAll('.table-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.table-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const status = btn.getAttribute('data-status');
      const search = document.getElementById('orders-search-input')?.value || '';
      renderOrdersTable(status, search);
    });
  });

  const searchInput = document.getElementById('orders-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const activeTab = document.querySelector('.table-tab-btn.active')?.getAttribute('data-status') || 'all';
      renderOrdersTable(activeTab, e.target.value);
    });
  }
}

function switchView(viewId) {
  document.querySelectorAll('.content-view').forEach(view => {
    view.classList.remove('active');
  });

  const activeView = document.getElementById(`view-${viewId}`);
  if (activeView) activeView.classList.add('active');

  // Sync sidebar active item
  document.querySelectorAll('.sidebar-item[data-view]').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-view') === viewId);
  });

  // Sync mobile bottom nav active item
  document.querySelectorAll('.mobile-nav-item[data-mobile-view]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mobile-view') === viewId);
  });

  if (viewId === 'chat' && typeof renderDashboardChatMessages === 'function') {
    renderDashboardChatMessages();
  }

  const titleEl = document.querySelector('.topbar-title');
  if (titleEl) {
    const titles = {
      'new-order': 'Place New Order',
      'orders': 'Orders History & Tracking',
      'services': 'Master Services & Pricing',
      'add-funds': 'Deposit Funds & Wallet',
      'chat': 'Live Chat With Admin',
      'api': 'Reseller API Documentation',
      'tickets': 'Customer Support Tickets'
    };
    titleEl.textContent = titles[viewId] || 'Dashboard';
  }
}

// Deposit & Add Funds Listeners
function setupDepositListeners() {
  const methodCards = document.querySelectorAll('.deposit-method-card');
  methodCards.forEach(card => {
    card.addEventListener('click', () => {
      const method = card.getAttribute('data-method');
      if (card.classList.contains('coming-soon') || card.getAttribute('data-active') === 'false') {
        AppState.showToast(`${method} Coming Soon! Abhi sirf EasyPaisa (03173983906) ya UPaisa (03163846672) select karein.`, 'info');
        return;
      }

      methodCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      updateDepositInstructions(method);
    });
  });

  const depositForm = document.getElementById('deposit-submit-form');
  if (depositForm) {
    depositForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const amountInput = document.getElementById('deposit-amount-input');
      const tidInput = document.getElementById('deposit-tid-input');

      const amount = parseFloat(amountInput.value) || 0;
      const tid = tidInput.value.trim();

      if (amount < 100) {
        AppState.showToast('Minimum deposit amount is ₨ 100 / $1.00', 'error');
        return;
      }

      if (!tid) {
        AppState.showToast('Please enter your Transaction ID (TID) / Reference number', 'error');
        return;
      }

      const activeMethod = document.querySelector('.deposit-method-card.selected')?.getAttribute('data-method') || 'EasyPaisa';

      const newDeposit = {
        id: `DEP-${Math.floor(100 + Math.random() * 900)}`,
        method: activeMethod,
        account: getDepositAccount(activeMethod),
        tid: tid,
        amount_pkr: amount,
        amount_usd: amount / 280,
        status: "Pending",
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      const deps = AppState.getDeposits();
      deps.unshift(newDeposit);
      AppState.saveDeposits(deps);

      amountInput.value = '';
      tidInput.value = '';

      AppState.showToast(`Deposit of ₨ ${amount} submitted! Admin will verify TID and credit your wallet within 5-15 minutes.`, 'success');
      renderDepositsList();
    });
  }

  renderDepositsList();
}

function getDepositAccount(method) {
  const accounts = {
    'EasyPaisa': '03173983906 (EasyPaisa)',
    'UPaisa': '03163846672 (UPaisa)',
    'Bank Transfer': 'EasyPaisa: 03173983906 | UPaisa: 03163846672',
    'Crypto': 'Contact WhatsApp: 03173983906'
  };
  return accounts[method] || '03173983906 (EasyPaisa)';
}

function updateDepositInstructions(method) {
  const titleEl = document.getElementById('deposit-method-title');
  const accEl = document.getElementById('deposit-account-number');

  if (titleEl) titleEl.textContent = `${method} Payment Details`;
  if (accEl) accEl.textContent = getDepositAccount(method);
}

function renderDepositsList() {
  const container = document.getElementById('deposits-history-list');
  if (!container) return;

  const deps = AppState.getDeposits();
  if (deps.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:16px;">No deposits submitted yet.</p>`;
    return;
  }

  container.innerHTML = deps.map(d => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:var(--bg-surface-soft);border-radius:var(--radius-sm);margin-bottom:8px;">
      <div>
        <strong>${d.method}</strong> — ₨ ${d.amount_pkr.toLocaleString()}
        <div style="font-size:11.5px;color:var(--text-muted);">TID: ${d.tid} | ${d.created_at}</div>
      </div>
      <span class="badge-status ${d.status === 'Approved' ? 'badge-completed' : 'badge-pending'}">${d.status}</span>
    </div>
  `).join('');
}

// Services Catalog Tab
function renderServicesCatalog() {
  const tbody = document.getElementById('catalog-services-body');
  if (!tbody) return;

  tbody.innerHTML = MASTER_SERVICES.map(s => `
    <tr>
      <td><strong>${s.id}</strong></td>
      <td><strong>${s.name}</strong></td>
      <td>${AppState.formatMoney(s.rate_usd, s.rate_pkr)}</td>
      <td>${s.min.toLocaleString()}</td>
      <td>${s.max.toLocaleString()}</td>
      <td><span style="color:var(--success);font-weight:600;"><i class="fa-solid fa-bolt"></i> ${s.avg_time}</span></td>
      <td>
        <button onclick="orderThisService(${s.id})" class="btn-primary-grad" style="padding:4px 10px;font-size:11px;">
          Order
        </button>
      </td>
    </tr>
  `).join('');
}

window.orderThisService = function(serviceId) {
  switchView('new-order');
  const catSelect = document.getElementById('order-category-select');
  const srv = getServiceById(serviceId);
  if (srv && catSelect) {
    catSelect.value = srv.category;
    populateServices(srv.category);
    const srvSelect = document.getElementById('order-service-select');
    if (srvSelect) {
      srvSelect.value = srv.id;
      onServiceSelected(srv.id);
    }
  }
};
