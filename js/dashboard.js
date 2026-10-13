/* ==========================================================================
   SALEEM SMM PANEL — PREMIUM CLIENT DASHBOARD CONTROLLER
   Powers 5-Screen Dil/Premium UI, 627+ Services, Order Cards, Payment Tiles,
   Transactions Table, Crimson Overview Panel & In-Panel Live Chat
   ========================================================================== */

let currentCategoryFilter = 'all';
let currentServiceList = [];
let selectedServiceObj = null;
let currentOrderStatusFilter = 'all';
let selectedActiveGatewayNumber = '03173983906';

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

function initDashboard() {
  if (!AppState.currentUser) {
    AppState.loadUser();
  }

  AppState.updateNavAuthUI();
  populateCategoriesSelect();
  populateCatalogFilter();
  renderUserOrders();
  renderUserDeposits();
  renderUserTransactions();
  renderServiceCatalog();
  renderDashboardChat();
  renderAllPrices();

  // Auto polling for live chat updates
  setInterval(() => {
    renderDashboardChat();
  }, 3000);

  window.addEventListener('saleem_chats_updated', () => {
    renderDashboardChat();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.CHATS) {
      renderDashboardChat();
    }
  });

  // Check URL params for deep links (?view=... or ?service=...)
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view');
  const serviceParam = params.get('service');

  if (viewParam) {
    switchDashView(viewParam);
  }
  if (serviceParam) {
    selectServiceById(parseInt(serviceParam));
  }
}

/* ==========================================================================
   SIDEBAR, MOBILE DRAWER & COLOR PICKER
   ========================================================================== */
function toggleDashSidebar() {
  const sb = document.getElementById('dash-sidebar');
  const bd = document.getElementById('dash-sidebar-backdrop');
  if (!sb) return;
  const isOpen = sb.classList.toggle('open');
  if (bd) bd.classList.toggle('active', isOpen);
}

function closeDashSidebar() {
  const sb = document.getElementById('dash-sidebar');
  const bd = document.getElementById('dash-sidebar-backdrop');
  if (sb) sb.classList.remove('open');
  if (bd) bd.classList.remove('active');
}

function toggleColorPicker() {
  const menu = document.getElementById('dil-color-menu');
  if (!menu) return;
  menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
}

function selectPanelColor(colorKey) {
  AppState.applyAccentColor(colorKey);
  const menu = document.getElementById('dil-color-menu');
  if (menu) menu.style.display = 'none';
  AppState.showToast(`Theme accent color updated to ${colorKey.toUpperCase()}!`, 'success');
}

function handleAppInstallPrompt() {
  AppState.showToast('Saleem SMM Panel Web App: Tap "Add to Home Screen" in your browser menu for 1-click app access!', 'info');
}

/* ==========================================================================
   VIEW NAVIGATION SWITCHER
   ========================================================================== */
function switchDashView(viewName) {
  document.querySelectorAll('.dash-view').forEach(v => {
    v.style.display = 'none';
  });

  document.querySelectorAll('.dil-menu-link').forEach(m => {
    m.classList.remove('active');
    if (m.getAttribute('data-view') === viewName) {
      m.classList.add('active');
    }
  });

  const ovBtn = document.getElementById('btn-overview-tab');
  if (ovBtn) {
    ovBtn.classList.toggle('active', viewName === 'overview');
  }

  document.querySelectorAll('.mob-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mob-view') === viewName);
  });

  const target = document.getElementById(`view-${viewName}`);
  if (target) {
    target.style.display = 'block';
  }

  if (viewName === 'chat') {
    markUserChatRead();
    renderDashboardChat();
  } else if (viewName === 'orders') {
    renderUserOrders();
  } else if (viewName === 'transactions') {
    renderUserTransactions();
  } else if (viewName === 'overview') {
    renderAllPrices();
  }

  closeDashSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   CURRENCY & USER STATS UPDATER
   ========================================================================== */
function toggleCurrency() {
  const next = AppState.currency === 'PKR' ? 'USD' : 'PKR';
  AppState.setCurrency(next);
}

function renderAllPrices() {
  const user = AppState.currentUser;
  const isPkr = AppState.currency === 'PKR';

  // Topbar & Sidebar Currency Labels
  const topSym = document.getElementById('top-curr-sym');
  const topCode = document.getElementById('top-curr-code');
  const sideCurr = document.getElementById('sidebar-curr-label');
  if (topSym) topSym.textContent = isPkr ? 'Rs' : '$';
  if (topCode) topCode.textContent = isPkr ? 'PKR' : 'USD';
  if (sideCurr) sideCurr.textContent = isPkr ? 'Rs PKR' : '$ USD';

  if (user) {
    const orders = AppState.getOrders();
    const balFormatted = isPkr
      ? `Rs ${Number(user.balance_pkr || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`
      : `$ ${Number(user.balance_usd || 0).toFixed(2)}`;
    const spentFormatted = isPkr
      ? `Rs ${Number(user.spent_pkr || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
      : `$ ${Number(user.spent_usd || 0).toFixed(2)}`;

    // Calculate Today's spend
    const todayPrefix = new Date().toISOString().substring(0, 10);
    const todayOrders = orders.filter(o => String(o.created_at || '').startsWith(todayPrefix));
    const todayPkr = todayOrders.reduce((acc, o) => acc + Number(o.charge_pkr || 0), 0);
    const todayFormatted = isPkr ? `Rs ${todayPkr.toFixed(1)}` : `$ ${(todayPkr / 280).toFixed(2)}`;

    // Sidebar Profile Card
    const uNameEl = document.getElementById('dash-username');
    const uEmailEl = document.getElementById('dash-email');
    if (uNameEl) uNameEl.textContent = user.username;
    if (uEmailEl) uEmailEl.textContent = '@' + (user.email || 'client@saleemsmm.pk');

    // Top Panel Welcome Card & Stats
    const rightName = document.getElementById('right-username');
    const stOrders = document.getElementById('stat-total-orders');
    const stBal = document.getElementById('stat-balance');
    const stSpent = document.getElementById('stat-spent');
    const stToday = document.getElementById('stat-today-spent');
    const panelUsersEl = document.getElementById('stat-panel-users');
    const panelOrdersEl = document.getElementById('stat-panel-orders');

    if (rightName) rightName.textContent = user.username;
    if (stOrders) stOrders.textContent = orders.length;
    if (stBal) stBal.textContent = balFormatted;
    if (stSpent) stSpent.textContent = spentFormatted;
    if (stToday) stToday.textContent = todayFormatted;
    if (panelUsersEl) panelUsersEl.textContent = '0';
    if (panelOrdersEl) panelOrdersEl.textContent = '0';

    // Crimson Overview Panel (Screenshot 5)
    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setEl('ov-username', user.username);
    setEl('ov-email', user.email || 'client@saleemsmm.pk');
    setEl('ov-balance', balFormatted);
    setEl('ov-orders', orders.length);
    setEl('ov-spent', spentFormatted);
    setEl('ov-today', todayFormatted);
    setEl('ov-fullname', user.name || user.username);
    setEl('ov-uname', user.username);
    setEl('ov-uemail', user.email || 'client@saleemsmm.pk');
    setEl('ov-uphone', user.phone || '03163846672');
    setEl('user-api-key', user.apiKey || 'smm_live_sec_99a8b7c6d5e4f3a2');
    setEl('user-ref-link', `https://saleemsmmpannel.vercel.app/?ref=${encodeURIComponent(user.username)}`);
  } else {
    const stOrders = document.getElementById('stat-total-orders');
    const stBal = document.getElementById('stat-balance');
    const stSpent = document.getElementById('stat-spent');
    const stToday = document.getElementById('stat-today-spent');
    const panelUsersEl = document.getElementById('stat-panel-users');
    const panelOrdersEl = document.getElementById('stat-panel-orders');
    if (stOrders) stOrders.textContent = '0';
    if (stBal) stBal.textContent = isPkr ? 'Rs 0.00' : '$ 0.00';
    if (stSpent) stSpent.textContent = isPkr ? 'Rs 0.00' : '$ 0.00';
    if (stToday) stToday.textContent = isPkr ? 'Rs 0.0' : '$ 0.0';
    if (panelUsersEl) panelUsersEl.textContent = '0';
    if (panelOrdersEl) panelOrdersEl.textContent = '0';
  }

  onServiceChange();
  renderUserOrders();
  renderUserDeposits();
  renderUserTransactions();
  renderServiceCatalog();
}

/* ==========================================================================
   NEW ORDER FORM & 14 PLATFORM ICON FILTERS (SCREENSHOT 1)
   ========================================================================== */
/* Helper: Get Unicode Social Platform Icon/Emoji */
function getPlatformIconEmoji(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('instagram') || t.includes('insta')) return '📸';
  if (t.includes('tiktok') || t.includes('tik tok')) return '🎵';
  if (t.includes('youtube') || t.includes('yt ') || t.includes('watchtime') || t.includes('subscriber')) return '🔴';
  if (t.includes('facebook') || t.includes('fb ') || t.includes('fb page')) return '🔵';
  if (t.includes('telegram') || t.includes('tg ')) return '✈️';
  if (t.includes('twitter') || t.includes(' x ') || t.startsWith('x »') || t.includes('x »') || t.includes('x -') || t.includes('tweets')) return '❌';
  if (t.includes('spotify')) return '🟢';
  if (t.includes('linkedin')) return '💼';
  if (t.includes('whatsapp') || t.includes('wa ')) return '💬';
  if (t.includes('capcut')) return '🎬';
  if (t.includes('gemini') || t.includes('google ai') || t.includes('sparkle')) return '✨';
  if (t.includes('muse ai') || t.includes('ai tool') || t.includes('chatgpt') || t.includes('openai') || t.includes('midjourney')) return '🤖';
  if (t.includes('custom') || t.includes('panel') || t.includes('banwayein')) return '👑';
  if (t.includes('traffic') || t.includes('website') || t.includes('seo') || t.includes('google')) return '🌐';
  if (t.includes('snapchat')) return '👻';
  if (t.includes('discord')) return '🎮';
  if (t.includes('threads')) return '🧵';
  if (t.includes('twitch')) return '🟣';
  if (t.includes('soundcloud')) return '🟠';
  if (t.includes('pinterest')) return '📌';
  return '⚡';
}

/* Helper: Get Platform Visual Badge Icon & Background */
function getPlatformBadgeMeta(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('instagram') || t.includes('insta')) return { icon: 'fa-brands fa-instagram', bg: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)' };
  if (t.includes('tiktok') || t.includes('tik tok')) return { icon: 'fa-brands fa-tiktok', bg: '#000000' };
  if (t.includes('youtube') || t.includes('yt ')) return { icon: 'fa-brands fa-youtube', bg: '#ff0000' };
  if (t.includes('facebook') || t.includes('fb ')) return { icon: 'fa-brands fa-facebook-f', bg: '#1877f2' };
  if (t.includes('telegram') || t.includes('tg ')) return { icon: 'fa-brands fa-telegram', bg: '#0088cc' };
  if (t.includes('twitter') || t.includes(' x ') || t.startsWith('x »') || t.includes('x »') || t.includes('tweets')) return { icon: 'fa-brands fa-x-twitter', bg: '#000000' };
  if (t.includes('spotify')) return { icon: 'fa-brands fa-spotify', bg: '#1db954' };
  if (t.includes('linkedin')) return { icon: 'fa-brands fa-linkedin-in', bg: '#0a66c2' };
  if (t.includes('whatsapp') || t.includes('wa ')) return { icon: 'fa-brands fa-whatsapp', bg: '#25d366' };
  if (t.includes('capcut')) return { icon: 'fa-solid fa-scissors', bg: '#111827' };
  if (t.includes('gemini') || t.includes('google ai')) return { icon: 'fa-solid fa-wand-magic-sparkles', bg: 'linear-gradient(135deg, #4285f4, #ea4335, #fbbc05, #34a853)' };
  if (t.includes('muse ai') || t.includes('ai') || t.includes('chatgpt')) return { icon: 'fa-solid fa-robot', bg: '#2563eb' };
  if (t.includes('custom') || t.includes('panel')) return { icon: 'fa-solid fa-crown', bg: 'linear-gradient(135deg, #f59e0b, #d97706)' };
  if (t.includes('traffic') || t.includes('website')) return { icon: 'fa-solid fa-globe', bg: '#0284c7' };
  if (t.includes('snapchat')) return { icon: 'fa-brands fa-snapchat', bg: '#fffc00' };
  if (t.includes('discord')) return { icon: 'fa-brands fa-discord', bg: '#5865f2' };
  if (t.includes('threads')) return { icon: 'fa-brands fa-threads', bg: '#000000' };
  return { icon: 'fa-solid fa-layer-group', bg: '#2563eb' };
}

/* Custom Dropdown Toggles and Option Selectors (Matches dilsmmpanel.com) */
window.toggleCustomDropdown = function(dropdownId, e) {
  if (e && e.stopPropagation) {
    e.stopPropagation();
  }
  const target = document.getElementById(dropdownId);
  if (!target) return;
  const isAlreadyOpen = target.classList.contains('open');
  document.querySelectorAll('.dil-custom-select').forEach(el => el.classList.remove('open'));
  if (!isAlreadyOpen) {
    target.classList.add('open');
  }
};

window.selectCustomCategory = function(catId) {
  const catSelect = document.getElementById('order-category');
  if (catSelect) {
    catSelect.value = catId;
    onCategoryChange();
  }
  document.getElementById('custom-cat-dropdown')?.classList.remove('open');
};

window.selectCustomService = function(srvId) {
  const srvSelect = document.getElementById('order-service');
  if (srvSelect) {
    srvSelect.value = srvId;
    onServiceChange();
  }
  document.getElementById('custom-srv-dropdown')?.classList.remove('open');
};

// Auto close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dil-custom-select')) {
    document.querySelectorAll('.dil-custom-select').forEach(el => el.classList.remove('open'));
  }
});

function filterCategoryByPlatform(platformKey, btnEl) {
  currentCategoryFilter = platformKey;
  document.querySelectorAll('#platform-filter-bar .dil-plat-icon').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  populateCategoriesSelect();
}

function populateCategoriesSelect() {
  const catSelect = document.getElementById('order-category');
  const catMenu = document.getElementById('custom-cat-menu');
  if (!catSelect) return;

  const filteredCats = MASTER_CATEGORIES.filter(cat => {
    if (currentCategoryFilter === 'all') return true;
    const nameLower = cat.name.toLowerCase();
    if (currentCategoryFilter === 'custom') return nameLower.includes('custom') || nameLower.includes('panel');
    if (currentCategoryFilter === 'ai') return nameLower.includes('ai') || nameLower.includes('chatgpt') || nameLower.includes('canva') || nameLower.includes('tool') || nameLower.includes('gemini');
    if (currentCategoryFilter === 'traffic') return nameLower.includes('traffic') || nameLower.includes('website') || nameLower.includes('seo');
    return cat.platform === currentCategoryFilter || nameLower.includes(currentCategoryFilter);
  });

  const listToUse = filteredCats.length > 0 ? filteredCats : MASTER_CATEGORIES;

  // 1. Populate native select
  catSelect.innerHTML = listToUse.map(c => {
    const iconEmoji = getPlatformIconEmoji(c.name);
    return `<option value="${c.id}">${iconEmoji} ${c.name}</option>`;
  }).join('');

  // 2. Populate custom dropdown menu with official brand icon badges
  if (catMenu) {
    catMenu.innerHTML = listToUse.map(c => {
      const meta = getPlatformBadgeMeta(c.name);
      const isSel = c.id === catSelect.value;
      return `
        <div class="dil-cs-option ${isSel ? 'selected' : ''}" onclick="selectCustomCategory('${c.id}')">
          <span class="dil-opt-brand-icon" style="background:${meta.bg};">
            <i class="${meta.icon}"></i>
          </span>
          <span class="dil-opt-text">${c.name}</span>
        </div>
      `;
    }).join('');
  }

  onCategoryChange();
}

function onCategoryChange() {
  const catSelect = document.getElementById('order-category');
  const srvSelect = document.getElementById('order-service');
  const srvMenu = document.getElementById('custom-srv-menu');
  if (!catSelect || !srvSelect) return;

  const selectedCatId = catSelect.value;
  currentServiceList = MASTER_SERVICES.filter(s => (s.category === selectedCatId || s.category_id === selectedCatId || selectedCatId === 'all'));
  if (!currentServiceList || currentServiceList.length === 0) {
    currentServiceList = MASTER_SERVICES.slice(0, 50);
  }

  // Update Category Badge Icon & Label on custom trigger (Matches Screenshot 1 & 4)
  const selectedCat = MASTER_CATEGORIES.find(c => c.id === selectedCatId);
  const catBadge = document.getElementById('category-badge-icon');
  const catLabel = document.getElementById('custom-cat-label');
  if (selectedCat) {
    const meta = getPlatformBadgeMeta(selectedCat.name);
    if (catBadge) {
      catBadge.style.background = meta.bg;
      catBadge.innerHTML = `<i class="${meta.icon}"></i>`;
    }
    if (catLabel) {
      catLabel.textContent = selectedCat.name;
    }
  }

  // Highlight selected option in custom category menu
  document.querySelectorAll('#custom-cat-menu .dil-cs-option').forEach(opt => {
    opt.classList.toggle('selected', opt.textContent.includes(selectedCat ? selectedCat.name : ''));
  });

  // 1. Populate native services select
  srvSelect.innerHTML = currentServiceList.map(s => {
    const priceStr = AppState.currency === 'PKR' ? `Rs ${s.rate_pkr}` : `$${s.rate_usd}`;
    const iconEmoji = getPlatformIconEmoji(s.name || s.category_name || (selectedCat ? selectedCat.name : ''));
    return `<option value="${s.id}">${iconEmoji} ${s.id} - ${s.name} — ${priceStr}</option>`;
  }).join('');

  // 2. Populate custom services dropdown menu with official brand badges & ID pills
  if (srvMenu) {
    srvMenu.innerHTML = currentServiceList.map(s => {
      const meta = getPlatformBadgeMeta(s.name || s.category_name || (selectedCat ? selectedCat.name : ''));
      const priceStr = AppState.currency === 'PKR' ? `Rs ${s.rate_pkr}` : `$${s.rate_usd}`;
      const isSel = s.id === parseInt(srvSelect.value);
      return `
        <div class="dil-cs-option ${isSel ? 'selected' : ''}" onclick="selectCustomService(${s.id})">
          <span class="dil-opt-brand-icon" style="background:${meta.bg};">
            <i class="${meta.icon}"></i>
          </span>
          <span class="dil-opt-srv-id">${s.id}</span>
          <span class="dil-opt-text">${s.name} — ${priceStr}</span>
        </div>
      `;
    }).join('');
  }

  onServiceChange();
}

function onServiceChange() {
  const srvSelect = document.getElementById('order-service');
  if (!srvSelect) return;

  const srvId = parseInt(srvSelect.value);
  selectedServiceObj = MASTER_SERVICES.find(s => s.id === srvId) || currentServiceList[0];
  if (!selectedServiceObj) return;

  // Update Service ID Pill & Label on custom trigger (Matches Screenshot 1)
  const idPill = document.getElementById('selected-srv-id-pill');
  const srvLabel = document.getElementById('custom-srv-label');
  const isPkr = AppState.currency === 'PKR';
  const rateText = isPkr ? `Rs ${selectedServiceObj.rate_pkr}` : `$ ${selectedServiceObj.rate_usd}`;

  if (idPill) {
    const srvMeta = getPlatformBadgeMeta(selectedServiceObj.name || selectedServiceObj.category_name);
    idPill.style.background = srvMeta.bg;
    idPill.textContent = selectedServiceObj.id;
  }
  if (srvLabel) {
    srvLabel.textContent = `${selectedServiceObj.id} - ${selectedServiceObj.name} — ${rateText}`;
  }

  // Highlight selected option in custom service menu
  document.querySelectorAll('#custom-srv-menu .dil-cs-option').forEach(opt => {
    opt.classList.toggle('selected', opt.textContent.includes(String(selectedServiceObj.id)));
  });

  const descName = document.getElementById('desc-srv-name');
  const descRate = document.getElementById('desc-srv-rate');
  const descTime = document.getElementById('desc-srv-time');
  const descMinMax = document.getElementById('desc-srv-minmax');
  const avgBox = document.getElementById('order-avg-time-box');
  const qtyHint = document.getElementById('quantity-hint');
  const qtyInput = document.getElementById('order-quantity');

  if (idPill) idPill.textContent = selectedServiceObj.id;
  if (descName) descName.textContent = `${selectedServiceObj.name} 🔥`;
  if (descRate) descRate.textContent = rateText;
  if (descTime) descTime.textContent = selectedServiceObj.avg_time;
  if (descMinMax) descMinMax.textContent = `${selectedServiceObj.min.toLocaleString()} / ${selectedServiceObj.max.toLocaleString()}`;
  if (avgBox) avgBox.value = selectedServiceObj.avg_time;
  if (qtyHint) qtyHint.textContent = `Min: ${selectedServiceObj.min.toLocaleString()} — Max: ${selectedServiceObj.max.toLocaleString()}`;

  if (qtyInput) {
    qtyInput.min = selectedServiceObj.min;
    qtyInput.max = selectedServiceObj.max;
    if (!qtyInput.value) {
      qtyInput.value = selectedServiceObj.min;
    }
  }

  calculateOrderTotal();
}

function calculateOrderTotal() {
  if (!selectedServiceObj) return;
  const qtyInput = document.getElementById('order-quantity');
  const chargeBox = document.getElementById('order-total-charge');
  if (!qtyInput || !chargeBox) return;

  const qty = parseFloat(qtyInput.value) || 0;
  const totalUsd = (qty / 1000) * selectedServiceObj.rate_usd;
  const totalPkr = (qty / 1000) * selectedServiceObj.rate_pkr;

  chargeBox.value = AppState.currency === 'PKR'
    ? `Rs ${totalPkr.toFixed(2)}`
    : `$ ${totalUsd.toFixed(3)}`;
}

function handleQuickServiceSearch(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    populateCategoriesSelect();
    return;
  }

  const matched = MASTER_SERVICES.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.id.toString().includes(q) ||
    s.category_name.toLowerCase().includes(q)
  ).slice(0, 60);

  const srvSelect = document.getElementById('order-service');
  if (matched.length > 0 && srvSelect) {
    currentServiceList = matched;
    srvSelect.innerHTML = matched.map(s => {
      const priceStr = AppState.currency === 'PKR' ? `Rs ${s.rate_pkr}` : `$${s.rate_usd}`;
      const iconEmoji = getPlatformIconEmoji(s.name || s.category_name);
      return `<option value="${s.id}">${iconEmoji} ${s.id} - ${s.name} — ${priceStr}</option>`;
    }).join('');
    onServiceChange();
  }
}

function selectServiceById(serviceId) {
  const srv = MASTER_SERVICES.find(s => s.id === serviceId);
  if (!srv) return;

  switchDashView('new-order');
  currentCategoryFilter = 'all';
  populateCategoriesSelect();

  const catSelect = document.getElementById('order-category');
  if (catSelect) {
    catSelect.value = srv.category || srv.category_id || 'cat_5';
    onCategoryChange();
  }

  const srvSelect = document.getElementById('order-service');
  if (srvSelect) {
    srvSelect.value = srv.id;
    onServiceChange();
  }
}

function submitNewOrder(e) {
  e.preventDefault();
  if (!selectedServiceObj) return;

  const user = AppState.currentUser;
  if (!user) {
    AppState.showToast('Please login to place an order!', 'error');
    window.location.replace('../index.html#auth');
    return;
  }

  const link = document.getElementById('order-link').value.trim();
  const qty = parseInt(document.getElementById('order-quantity').value);

  if (qty < selectedServiceObj.min || qty > selectedServiceObj.max) {
    AppState.showToast(`Quantity must be between ${selectedServiceObj.min} and ${selectedServiceObj.max}`, 'error');
    return;
  }

  const chargePkr = Number(((qty / 1000) * selectedServiceObj.rate_pkr).toFixed(2));
  const chargeUsd = Number(((qty / 1000) * selectedServiceObj.rate_usd).toFixed(4));
  const userBal = Number(user.balance_pkr || 0);

  // STRICT BALANCE CHECK: Empty balance cannot place order!
  if (userBal <= 0) {
    AppState.showToast('❌ Wallet Balance Empty (Rs 0.00)! Pehle Add Funds se EasyPaisa ya UPaisa par payment karein aur Admin approval ka wait karein.', 'error');
    switchDashView('add-funds');
    return;
  }

  if (userBal < chargePkr) {
    AppState.showToast(`❌ Insufficient Balance! Order cost Rs ${chargePkr} hai lekin aapka balance Rs ${userBal.toFixed(2)} hai. Please Add Funds karein.`, 'error');
    switchDashView('add-funds');
    return;
  }

  // Deduct balance from user
  user.balance_pkr = Number((user.balance_pkr - chargePkr).toFixed(2));
  user.balance_usd = Number((user.balance_usd - chargeUsd).toFixed(4));
  user.spent_pkr = Number(((user.spent_pkr || 0) + chargePkr).toFixed(2));
  user.spent_usd = Number(((user.spent_usd || 0) + chargeUsd).toFixed(4));
  AppState.saveUser();

  const newOrder = {
    id: Math.floor(3900000 + Math.random() * 99999),
    userId: user.username,
    userEmail: user.email,
    service_id: selectedServiceObj.id,
    service_name: selectedServiceObj.name,
    link: link,
    quantity: qty,
    charge_pkr: chargePkr,
    charge_usd: chargeUsd,
    start_count: Math.floor(10 + Math.random() * 400),
    remains: qty,
    status: 'In progress',
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  const orders = AppState.getOrders();
  orders.unshift(newOrder);
  AppState.saveOrders(orders);

  renderAllPrices();
  document.getElementById('order-link').value = '';

  // WhatsApp Instant Message Text: "hi sir! I have placed the order" with Service ID (Matches Dil Panel)
  const waMsgText = encodeURIComponent(
    `hi sir! I have placed the order\n\n` +
    `📦 Order ID: #${newOrder.id}\n` +
    `🔢 Service ID: ${selectedServiceObj.id}\n` +
    `⚡ Service: ${selectedServiceObj.name}\n` +
    `🔢 Quantity: ${qty}\n` +
    `🔗 Link: ${link}\n` +
    `💰 Charge: Rs ${chargePkr}\n` +
    `👤 Username: @${user.username}`
  );
  const waOrderUrl = `https://wa.me/923163846672?text=${waMsgText}`;

  // Show Order Placed Notification with 1-Click WhatsApp Button
  showOrderSuccessPopup(newOrder, waOrderUrl);
}

function showOrderSuccessPopup(order, waUrl) {
  const existing = document.getElementById('saleem-order-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'saleem-order-modal';
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    z-index: 10010; display: flex; align-items: center; justify-content: center; padding: 16px;
  `;

  modal.innerHTML = `
    <div style="background:var(--bg-surface);border:2px solid var(--primary);border-radius:18px;max-width:440px;width:100%;padding:24px;text-align:center;box-shadow:0 16px 40px rgba(0,0,0,0.5);">
      <div style="width:60px;height:60px;background:#22c55e;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 14px;">
        <i class="fa-solid fa-check"></i>
      </div>
      <h3 style="font-size:20px;font-weight:900;color:var(--text-primary);margin-bottom:6px;">Order Placed Successfully!</h3>
      <p style="font-size:13.5px;color:var(--text-secondary);margin-bottom:16px;">
        Order <strong>#${order.id}</strong> has been submitted to automated queue.
      </p>

      <div style="background:var(--bg-surface-2);border-radius:12px;padding:12px;text-align:left;font-size:12.5px;margin-bottom:18px;line-height:1.7;">
        <div><strong>Service ID:</strong> <span style="background:var(--primary);color:#fff;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:800;">${order.service_id}</span></div>
        <div><strong>Service:</strong> ${AppState.escapeHtml(order.service_name)}</div>
        <div><strong>Quantity:</strong> ${order.quantity.toLocaleString()}</div>
        <div><strong>Charged:</strong> Rs ${order.charge_pkr}</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;">
        <a href="${waUrl}" target="_blank" class="dil-wa-btn" style="padding:12px;font-size:14px;background:#25d366;" onclick="document.getElementById('saleem-order-modal').remove()">
          <i class="fa-brands fa-whatsapp"></i> Send to WhatsApp: 03163846672
        </a>
        <button type="button" class="dil-submit-btn" style="padding:10px;background:var(--bg-surface-2);color:var(--text-primary);border:1px solid var(--border-color);" onclick="document.getElementById('saleem-order-modal').remove()">
          Close & View Orders
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

/* ==========================================================================
   VIEW 2: MY ORDERS (2-COLUMN RICH RED-HEADER CARDS — SCREENSHOT 2)
   ========================================================================== */
function filterOrdersByStatus(statusKey, btnEl) {
  currentOrderStatusFilter = statusKey;
  document.querySelectorAll('#order-status-pills .dil-order-pill').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderUserOrders();
}

function renderUserOrders() {
  const grid = document.getElementById('user-orders-cards-grid');
  if (!grid) return;

  const query = (document.getElementById('order-search-input')?.value || '').toLowerCase().trim();
  const allOrders = AppState.getOrders();

  const filtered = allOrders.filter(o => {
    const st = (o.status || 'Completed').toLowerCase();
    if (currentOrderStatusFilter !== 'all') {
      const target = currentOrderStatusFilter.toLowerCase();
      if (target === 'in progress' && !(st.includes('progress') || st.includes('processing'))) return false;
      else if (target !== 'in progress' && !st.includes(target)) return false;
    }
    if (query) {
      return (
        String(o.id).includes(query) ||
        String(o.service_id).includes(query) ||
        String(o.service_name || '').toLowerCase().includes(query) ||
        String(o.link || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="dil-red-card" style="grid-column:1 / -1;text-align:center;padding:40px 20px;">
        <i class="fa-solid fa-box-open" style="font-size:38px;color:var(--primary);margin-bottom:10px;"></i>
        <h4 style="font-size:16px;font-weight:800;">No Matching Orders Found</h4>
        <p style="font-size:13px;color:var(--text-muted);margin-top:4px;">Place a new order from the New Order tab to see live delivery tracking here.</p>
      </div>
    `;
    return;
  }

  const isPkr = AppState.currency === 'PKR';

  grid.innerHTML = filtered.map(o => {
    const qty = Number(o.quantity || 1000);
    const stLower = String(o.status || 'Completed').toLowerCase();
    const isComp = stLower.includes('comp');
    const isCancel = stLower.includes('cancel');
    const remains = o.remains !== undefined ? Number(o.remains) : (isComp ? 0 : Math.floor(qty * 0.25));
    const startCnt = o.start_count !== undefined ? o.start_count : 142;
    const delivered = isCancel ? 0 : Math.max(0, qty - remains);
    const pct = isCancel ? 0 : Math.min(100, Math.round((delivered / Math.max(1, qty)) * 100));

    let badgeClass = 'st-completed';
    let badgeIcon = 'fa-check';
    let badgeText = o.status || 'Completed';
    if (stLower.includes('progress') || stLower.includes('process')) {
      badgeClass = 'st-progress';
      badgeIcon = 'fa-arrows-rotate';
    } else if (stLower.includes('pend')) {
      badgeClass = 'st-pending';
      badgeIcon = 'fa-clock';
    } else if (isCancel) {
      badgeClass = 'st-canceled';
      badgeIcon = 'fa-xmark';
      badgeText = 'Cancel Refunded';
    }

    const chargeVal = isPkr ? Number(o.charge_pkr || 0).toFixed(2) : Number(o.charge_usd || 0).toFixed(3);

    return `
      <div class="dil-order-card">
        <div class="dil-order-card-head">
          <div>
            <div class="dil-order-id-line">
              <input type="checkbox" style="accent-color:#fff;width:15px;height:15px;">
              <span>#${o.id}</span>
              <i class="fa-regular fa-copy" style="cursor:pointer;font-size:13px;opacity:0.9;" onclick="AppState.copyText('${o.id}')" title="Copy Order ID"></i>
            </div>
            <div class="dil-order-date">
              <i class="fa-regular fa-calendar"></i> ${o.created_at}
            </div>
          </div>

          <span class="dil-order-status-pill ${badgeClass}">
            <i class="fa-solid ${badgeIcon}"></i> ${badgeText}
          </span>
        </div>

        <div class="dil-order-card-body">
          <div class="dil-order-srv-title">
            ${o.service_id} - ${AppState.escapeHtml(o.service_name)} | Lifetime Guarantee | ✅🔥⚡
          </div>

          <div class="dil-order-link-bar">
            <span class="dil-link-badge">LINK</span>
            <a href="${AppState.escapeHtml(o.link)}" target="_blank" class="dil-link-url">${AppState.escapeHtml(o.link)}</a>
            <a href="${AppState.escapeHtml(o.link)}" target="_blank" class="dil-link-icon-btn" title="Open Link">
              <i class="fa-solid fa-up-right-from-square"></i>
            </a>
            <button type="button" class="dil-link-icon-btn" onclick="AppState.copyText('${AppState.escapeHtml(o.link)}')" title="Copy Link">
              <i class="fa-regular fa-copy"></i>
            </button>
          </div>

          <div class="dil-order-metrics-2x2">
            <div class="dil-om-box">
              <div class="dil-om-ic ic-green"><i class="fa-solid fa-dollar-sign"></i></div>
              <div>
                <div class="dil-om-lbl">CHARGE</div>
                <div class="dil-om-val" style="color:#16a34a;">${chargeVal}</div>
              </div>
            </div>

            <div class="dil-om-box">
              <div class="dil-om-ic ic-blue"><i class="fa-solid fa-play"></i></div>
              <div>
                <div class="dil-om-lbl">START</div>
                <div class="dil-om-val">${startCnt}</div>
              </div>
            </div>

            <div class="dil-om-box">
              <div class="dil-om-ic ic-red"><i class="fa-solid fa-box"></i></div>
              <div>
                <div class="dil-om-lbl">QUANTITY</div>
                <div class="dil-om-val">${qty.toLocaleString()}</div>
              </div>
            </div>

            <div class="dil-om-box">
              <div class="dil-om-ic ic-purple"><i class="fa-solid fa-clock-rotate-left"></i></div>
              <div>
                <div class="dil-om-lbl">REMAINS</div>
                <div class="dil-om-val">${remains.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div class="dil-order-footer">
            <div class="dil-prog-wrap">
              <div class="dil-prog-labels">
                <span style="color:var(--primary);"><i class="fa-solid fa-circle-check"></i> Delivered ${pct}%</span>
                <span>${delivered.toLocaleString()} of ${qty.toLocaleString()}</span>
              </div>
              <div class="dil-prog-bar">
                <div class="dil-prog-fill" style="width:${pct}%;"></div>
              </div>
            </div>

            <div class="dil-order-actions">
              <button type="button" class="dil-btn-reorder" onclick="AppState.showToast('Refill request submitted for Order #${o.id}!', 'success')">Refill</button>
              <button type="button" class="dil-btn-reorder" onclick="selectServiceById(${o.service_id})">Reorder</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ==========================================================================
   VIEW 3: ADD FUNDS (PAYMENT TILES — SCREENSHOT 3)
   ========================================================================== */
function selectPaymentGateway(gatewayKey) {
  const isUpaisa = gatewayKey === 'upaisa';
  selectedActiveGatewayNumber = isUpaisa ? '03163846672' : '03173983906';

  const epTile = document.getElementById('tile-easypaisa');
  const upTile = document.getElementById('tile-upaisa');
  if (epTile) epTile.classList.toggle('active', !isUpaisa);
  if (upTile) upTile.classList.toggle('active', isUpaisa);

  const titleEl = document.getElementById('selected-gateway-title');
  const lblEl = document.getElementById('selected-gateway-label');
  const numEl = document.getElementById('selected-gateway-number');
  const hiddenInput = document.getElementById('deposit-method');
  const selBox = document.getElementById('deposit-method-select');

  if (titleEl) titleEl.textContent = isUpaisa ? 'Send Payment via UPaisa (Active)' : 'Send Payment via EasyPaisa (Active)';
  if (lblEl) lblEl.textContent = isUpaisa ? 'OFFICIAL UPAISA ACCOUNT NUMBER' : 'OFFICIAL EASYPAISA ACCOUNT NUMBER';
  if (numEl) numEl.textContent = selectedActiveGatewayNumber;
  if (hiddenInput) hiddenInput.value = isUpaisa ? 'UPaisa (03163846672)' : 'EasyPaisa (03173983906)';
  if (selBox) selBox.value = isUpaisa ? 'upaisa' : 'easypaisa';
}

function copySelectedGatewayNumber() {
  AppState.copyText(selectedActiveGatewayNumber);
}

function showComingSoonPayment(gatewayName) {
  AppState.showToast(`${gatewayName} is Coming Soon! Please use EasyPaisa (03173983906) or UPaisa (03163846672).`, 'info');
}

function submitDepositRequest(e) {
  e.preventDefault();
  const user = AppState.currentUser;
  if (!user) {
    AppState.showToast('Please login to submit deposit!', 'error');
    window.location.replace('../index.html#auth');
    return;
  }

  const method = document.getElementById('deposit-method').value;
  const amountPkr = parseFloat(document.getElementById('deposit-amount').value);
  const tid = document.getElementById('deposit-tid').value.trim();

  if (isNaN(amountPkr) || amountPkr < 100) {
    AppState.showToast('Minimum deposit amount is Rs 100', 'error');
    return;
  }

  if (!tid) {
    AppState.showToast('Please enter the Transaction ID (TID) from your receipt', 'error');
    return;
  }

  const amountUsd = Number((amountPkr / 280).toFixed(2));
  const deposits = AppState.getDeposits();

  // Create PENDING deposit request for Admin verification
  const newDep = {
    id: Math.floor(4300000 + Math.random() * 99999),
    userId: user.username,
    userEmail: user.email,
    userName: user.name || user.username,
    userPhone: user.phone || '',
    method: method,
    account: method.includes('EasyPaisa') ? '03173983906' : '03163846672',
    tid: tid,
    amount_pkr: amountPkr,
    amount_usd: amountUsd,
    status: 'Pending', // PENDING: Waiting for Admin approval!
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  deposits.unshift(newDep);
  AppState.saveDeposits(deposits);

  renderUserDeposits();
  renderUserTransactions();
  document.getElementById('deposit-amount').value = '';
  document.getElementById('deposit-tid').value = '';

  // Prompt WhatsApp quick verification
  const waDepText = encodeURIComponent(
    `Assalam-o-Alaikum Admin!\n\n` +
    `Maine Saleem SMM Panel par payment send ki hai, please mera deposit approve kar dein.\n\n` +
    `💳 Deposit ID: #${newDep.id}\n` +
    `💰 Amount: Rs ${amountPkr}\n` +
    `🧾 TID / Ref: ${tid}\n` +
    `🏦 Method: ${method}\n` +
    `👤 Username: @${user.username}`
  );
  const waDepUrl = `https://wa.me/923163846672?text=${waDepText}`;

  AppState.showToast(`✅ Deposit request #${newDep.id} submitted (Pending)! Admin approval ke baad wallet mein balance add ho jayega.`, 'success');

  // Also prompt live chat preset
  if (typeof AppState.sendUserChatMessage === 'function') {
    AppState.sendUserChatMessage(`Assalam-o-Alaikum Admin! Maine Rs ${amountPkr} bhej diye hain via ${method} (TID: ${tid}). Please mera deposit approve kar dein.`);
    renderDashboardChat();
  }
}

function renderUserDeposits() {
  const tbody = document.getElementById('user-deposits-tbody');
  if (!tbody) return;

  const user = AppState.currentUser;
  const allDeps = AppState.getDeposits();
  // Filter deposits for this specific user
  const userDeps = user ? allDeps.filter(d => d.userEmail === user.email || d.userId === user.username || !d.userEmail) : allDeps;

  if (userDeps.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-muted);">No deposits yet. Submit payment above.</td></tr>`;
    return;
  }

  tbody.innerHTML = userDeps.map(d => {
    const amt = AppState.formatMoney(d.amount_usd, d.amount_pkr);
    const isPending = d.status === 'Pending';
    const isApproved = d.status === 'Approved';
    const badgeClass = isApproved ? 'status-completed' : (isPending ? 'status-pending' : 'status-rejected');
    const badgeLabel = isApproved ? 'Approved' : (isPending ? 'Pending Approval' : 'Rejected');

    return `
      <tr>
        <td><strong>#${d.id}</strong></td>
        <td>${d.method}</td>
        <td><code>${d.tid}</code></td>
        <td style="font-weight:700;color:${isApproved ? '#16a34a' : 'var(--primary)'};">+${amt}</td>
        <td>
          <span class="status-badge ${badgeClass}">${badgeLabel}</span>
          ${isPending ? `
            <a href="https://wa.me/923163846672?text=${encodeURIComponent('Assalam-o-Alaikum! Please approve my deposit #' + d.id + ' (TID: ' + d.tid + ')')}" target="_blank" style="margin-left:6px;font-size:11px;color:#16a34a;font-weight:700;text-decoration:none;" title="Send TID to WhatsApp">
              <i class="fa-brands fa-whatsapp"></i> Verify
            </a>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

/* ==========================================================================
   VIEW 4: TRANSACTIONS TABLE (SOLID RED HEADER — SCREENSHOT 4)
   ========================================================================== */
function renderUserTransactions() {
  const tbody = document.getElementById('user-transactions-tbody');
  if (!tbody) return;

  const orders = AppState.getOrders();
  const deposits = AppState.getDeposits();
  const isPkr = AppState.currency === 'PKR';

  const txRows = [];

  orders.forEach((o, idx) => {
    const amt = isPkr ? `Rs ${Number(o.charge_pkr || 0).toFixed(0)}` : `$ ${Number(o.charge_usd || 0).toFixed(2)}`;
    txRows.push({
      txId: 4442150 + idx,
      type: 'deduction',
      amountStr: amt,
      date: o.created_at || '2026-10-12 18:05:00',
      orderId: o.id,
      note: 'New Order Placed'
    });
  });

  deposits.forEach((d, idx) => {
    const amt = isPkr ? `Rs ${Number(d.amount_pkr || 0).toFixed(0)}` : `$ ${Number(d.amount_usd || 0).toFixed(2)}`;
    txRows.push({
      txId: 4387060 + idx,
      type: 'addition',
      amountStr: amt,
      date: d.created_at || '2026-10-11 11:30:00',
      orderId: d.id,
      note: `${d.method} Wallet Deposit`
    });
  });

  tbody.innerHTML = txRows.map(tx => `
    <tr>
      <td style="font-weight:600;">${tx.txId}</td>
      <td>${tx.type}</td>
      <td style="font-weight:700;">${tx.amountStr}</td>
      <td>${tx.date}</td>
      <td>
        <div>Order ID: <span style="color:var(--primary);font-weight:700;">${tx.orderId}</span></div>
        <div style="font-size:12.5px;color:var(--text-secondary);">${tx.note}</div>
      </td>
    </tr>
  `).join('');
}

/* ==========================================================================
   VIEW 6: 627+ SERVICES CATALOG
   ========================================================================== */
function populateCatalogFilter() {
  const catFilter = document.getElementById('catalog-cat-filter');
  if (!catFilter) return;

  catFilter.innerHTML = `<option value="all">All Categories (${MASTER_SERVICES.length} Services)</option>` +
    MASTER_CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function renderServiceCatalog() {
  const container = document.getElementById('services-catalog-container');
  if (!container) return;

  const searchVal = (document.getElementById('catalog-search')?.value || '').toLowerCase().trim();
  const catFilterVal = document.getElementById('catalog-cat-filter')?.value || 'all';

  let catsToRender = MASTER_CATEGORIES;
  if (catFilterVal !== 'all') {
    catsToRender = MASTER_CATEGORIES.filter(c => c.id === catFilterVal);
  }

  let html = '';

  catsToRender.forEach(cat => {
    let srvs = MASTER_SERVICES.filter(s => s.category_id === cat.id);
    if (searchVal) {
      srvs = srvs.filter(s =>
        s.name.toLowerCase().includes(searchVal) ||
        s.id.toString().includes(searchVal)
      );
    }
    if (srvs.length === 0) return;

    html += `
      <div style="margin-bottom:24px;">
        <div style="background:var(--primary);color:#fff;padding:11px 16px;border-radius:10px 10px 0 0;font-weight:800;font-size:14px;">
          ${cat.name}
        </div>
        <div class="table-responsive" style="border:1px solid var(--border-color);border-top:none;border-radius:0 0 10px 10px;">
          <table class="smm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Service Name</th>
                <th>Rate / 1K</th>
                <th>Min / Max</th>
                <th>Avg. Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${srvs.map(s => {
                const rateFormatted = AppState.currency === 'PKR' ? `Rs ${s.rate_pkr}` : `$${s.rate_usd}`;
                return `
                  <tr>
                    <td><span class="srv-id-badge">${s.id}</span></td>
                    <td style="font-weight:600;">${s.name}</td>
                    <td style="font-weight:800;color:var(--primary);">${rateFormatted}</td>
                    <td>${s.min.toLocaleString()} / ${s.max.toLocaleString()}</td>
                    <td>${s.avg_time}</td>
                    <td>
                      <button class="dil-btn-reorder" onclick="selectServiceById(${s.id})">Order</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  container.innerHTML = html || `<div style="padding:30px;text-align:center;">No matching services found.</div>`;
}

/* ==========================================================================
   CUSTOM SMM PANEL & IN-PANEL LIVE CHAT
   ========================================================================== */
function quickOrderService(srvId) {
  selectServiceById(srvId);
  AppState.showToast('Custom SMM Panel service selected! Enter your WhatsApp or domain link to order.', 'success');
}

function openCustomPanelChatInquiry() {
  switchDashView('chat');
  sendDashboardChatPreset('Assalam-o-Alaikum Admin! Mujhe apna Customize SMM Panel banwana hai, details aur price bata dein.');
}

function markUserChatRead() {
  const chats = AppState.getChats();
  const identity = AppState.getCurrentChatIdentity();
  const idx = chats.findIndex(c => c.userId === identity.userId);
  if (idx !== -1 && chats[idx].unreadByUser > 0) {
    chats[idx].unreadByUser = 0;
    AppState.saveChats(chats);
  }
}

function renderDashboardChat() {
  const container = document.getElementById('dash-chat-messages');
  const thread = AppState.getUserChatThread();

  const unreadBadge = document.getElementById('dash-chat-unread-badge');
  if (unreadBadge) {
    const count = thread.unreadByUser || 0;
    unreadBadge.textContent = count;
    unreadBadge.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  if (!container) return;

  container.innerHTML = thread.messages.map(m => `
    <div class="chat-bubble-row ${m.sender === 'user' ? 'chat-row-user' : 'chat-row-admin'}">
      <div class="chat-bubble ${m.sender === 'user' ? 'bubble-user' : 'bubble-admin'}">
        <div class="bubble-sender">${m.sender === 'user' ? 'You (' + AppState.escapeHtml(m.senderName) + ')' : 'Saleem Admin (Official)'}</div>
        <div class="bubble-text">${AppState.escapeHtml(m.text)}</div>
        <div class="bubble-time">${m.time}</div>
      </div>
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}

function handleDashboardChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('dash-chat-input');
  if (!input || !input.value.trim()) return;

  AppState.sendUserChatMessage(input.value);
  input.value = '';
  renderDashboardChat();
  AppState.showToast('Message sent to Admin!', 'success');
}

function sendDashboardChatPreset(presetText) {
  AppState.sendUserChatMessage(presetText);
  renderDashboardChat();
  AppState.showToast('Inquiry sent to Admin in Live Chat!', 'success');
}

window.sendDashboardChatPreset = sendDashboardChatPreset;
window.handleDashboardChatSubmit = handleDashboardChatSubmit;
window.renderDashboardChat = renderDashboardChat;

function regenerateApiKey() {
  const newKey = 'smm_live_sec_' + Math.random().toString(36).substring(2, 15);
  const el = document.getElementById('user-api-key');
  if (el) el.textContent = newKey;
  if (AppState.currentUser) {
    AppState.currentUser.apiKey = newKey;
    AppState.saveUser();
  }
  AppState.showToast('New Secret API Key generated!', 'success');
}

// Explicitly expose all functions to window for 100% reliable HTML event handling
window.switchDashView = switchDashView;
window.toggleDashSidebar = toggleDashSidebar;
window.closeDashSidebar = closeDashSidebar;
window.toggleColorPicker = toggleColorPicker;
window.selectPanelColor = selectPanelColor;
window.handleAppInstallPrompt = handleAppInstallPrompt;
window.toggleCurrency = toggleCurrency;
window.filterCategoryByPlatform = filterCategoryByPlatform;
window.toggleCustomDropdown = toggleCustomDropdown;
window.selectCustomCategory = selectCustomCategory;
window.selectCustomService = selectCustomService;
window.onCategoryChange = onCategoryChange;
window.onServiceChange = onServiceChange;
window.calculateOrderTotal = calculateOrderTotal;
window.submitNewOrder = submitNewOrder;
window.handleQuickServiceSearch = handleQuickServiceSearch;
window.selectServiceById = selectServiceById;
window.filterOrdersByStatus = filterOrdersByStatus;
window.copySelectedGatewayNumber = copySelectedGatewayNumber;
window.selectPaymentGateway = selectPaymentGateway;
window.submitDepositRequest = submitDepositRequest;
window.renderServiceCatalog = renderServiceCatalog;
window.quickOrderService = quickOrderService;
window.openCustomPanelChatInquiry = openCustomPanelChatInquiry;
window.sendDashboardChatPreset = sendDashboardChatPreset;
window.handleDashboardChatSubmit = handleDashboardChatSubmit;
window.renderDashboardChat = renderDashboardChat;
window.regenerateApiKey = regenerateApiKey;
