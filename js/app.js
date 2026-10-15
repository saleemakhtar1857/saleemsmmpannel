/* ==========================================================================
   SALEEM SMM PANEL — GLOBAL APP, AUTH & LIVE CHAT CONTROLLER
   Exclusive Admin: saleembaloch1857@gmail.com | WhatsApp/EasyPaisa: 03173983906 | UPaisa: 03163846672
   ========================================================================== */

const STORAGE_KEYS = {
  THEME: 'saleem_theme_mode',
  CURRENCY: 'saleem_currency',
  USER: 'saleem_current_user',
  USERS_LIST: 'saleem_users_database',
  ORDERS: 'saleem_orders_db',
  DEPOSITS: 'saleem_deposits_db',
  TICKETS: 'saleem_tickets_db',
  CHATS: 'saleem_live_chats_db'
};

const ROOT_ADMIN_EMAILS = [
  'saleembaloch1857@gmail.com',
  'yasinofficial03098158572@gmail.com'
];
const ADMIN_EMAILS = ROOT_ADMIN_EMAILS;
const ADMIN_EMAIL = ROOT_ADMIN_EMAILS[0];

function getCustomAdminEmails() {
  try {
    return JSON.parse(localStorage.getItem('saleem_custom_admin_emails') || '[]');
  } catch (e) {
    return [];
  }
}

function getAllAdminEmails() {
  const custom = getCustomAdminEmails();
  const all = [...ROOT_ADMIN_EMAILS];
  custom.forEach(em => {
    const c = (em || '').toLowerCase().trim();
    if (c && !all.some(a => a.toLowerCase().trim() === c)) {
      all.push(c);
    }
  });
  return all;
}

function isUserAdmin(email) {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return getAllAdminEmails().some(ae => ae.toLowerCase().trim() === clean);
}

const OFFICIAL_WHATSAPP = '03163846672';
const OFFICIAL_WHATSAPP_INTL = '923163846672';
const OFFICIAL_EASYPAISA = '03173983906';
const OFFICIAL_UPAISA = '03163846672';

// Multi-Currency Engine
const CURRENCIES = {
  PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', rateToPkr: 1.0, decimals: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToPkr: 280.0, decimals: 2 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToPkr: 3.35, decimals: 2 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rateToPkr: 76.2, decimals: 2 },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', rateToPkr: 74.6, decimals: 2 },
  USDT: { code: 'USDT', symbol: '₮', name: 'Binance USDT', rateToPkr: 280.0, decimals: 2 }
};

// Official Binance Referral & Pay Gateway
const BINANCE_CONFIG = {
  payId: '1206973421',
  accountTitle: 'Saleem Akhtar (Binance Pay / USDT)',
  usdtAddress: 'TBN6XoYjJ4K5D5pA88H9Wp459XjZc3v12b',
  referralLink: 'https://account.binance.com/register?ref=1206973421&?registerChannel=user_center'
};

// Default Pre-seeded Accounts
const DEFAULT_ACCOUNTS = [
  {
    id: "USR-001",
    name: "Saleem VIP Client",
    username: "saleem_vip",
    email: "client@saleemsmm.pk",
    phone: "03163846672",
    password: "saleem123",
    role: "client",
    balance_pkr: 0.00,
    balance_usd: 0.00,
    spent_pkr: 0.00,
    spent_usd: 0.00,
    apiKey: "smm_live_sec_99a8b7c6d5e4f3a2",
    joined_at: "2026-09-15"
  },
  {
    id: "USR-002",
    name: "Saleem Akhtar (Admin)",
    username: "saleem_admin",
    email: "saleembaloch1857@gmail.com",
    phone: "03163846672",
    password: "admin123",
    role: "admin",
    balance_pkr: 25000.00,
    balance_usd: 89.28,
    spent_pkr: 0.00,
    spent_usd: 0.00,
    apiKey: "smm_live_sec_admin_778899aabbcc",
    joined_at: "2026-08-01"
  },
  {
    id: "USR-003",
    name: "Yasin Official (Admin)",
    username: "yasin_admin",
    email: "yasinofficial03098158572@gmail.com",
    phone: "03163846672",
    password: "admin123",
    role: "admin",
    balance_pkr: 25000.00,
    balance_usd: 89.28,
    spent_pkr: 0.00,
    spent_usd: 0.00,
    apiKey: "smm_live_sec_admin_yasin998877",
    joined_at: "2026-08-01"
  }
];

const AppState = {
  theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'daymode',
  accentColor: localStorage.getItem('saleem_accent_color') || 'red',
  currency: localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'PKR',
  currentUser: null,

  init() {
    this.applyTheme(this.theme);
    this.applyAccentColor(this.accentColor);
    this.initUsersDatabase();
    this.loadUser();
    this.initDefaultData();
    this.setupGlobalListeners();
    this.updateNavAuthUI();
    this.initFloatingSupportWidgets();
    this.syncChatsFromServer();
    this.syncWithSupabase();
    setInterval(() => {
      this.syncChatsFromServer();
      this.syncWithSupabase();
    }, 4000);
  },

  isAdmin(user) {
    const u = user || this.currentUser;
    if (!u) return false;
    if (u.role === 'admin') return true;
    if (u.email && isUserAdmin(u.email)) return true;
    return false;
  },

  /* ------------------- Theme & Color Management ------------------- */
  applyTheme(theme) {
    this.theme = theme;
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'nightmode') {
      document.body.classList.add('nightmode');
      document.body.classList.remove('daymode');
    } else {
      document.body.classList.remove('nightmode');
      document.body.classList.add('daymode');
    }

    const themeIcons = document.querySelectorAll('.theme-toggle-icon');
    themeIcons.forEach(icon => {
      icon.className = theme === 'nightmode' ? 'theme-toggle-icon fa-solid fa-sun' : 'theme-toggle-icon fa-solid fa-sun';
    });

    const themeLabels = document.querySelectorAll('.theme-toggle-label');
    themeLabels.forEach(lbl => {
      lbl.textContent = theme === 'nightmode' ? 'Day' : 'Night';
    });
  },

  toggleTheme() {
    const nextTheme = this.theme === 'nightmode' ? 'daymode' : 'nightmode';
    this.applyTheme(nextTheme);
  },

  applyAccentColor(colorKey) {
    const palettes = {
      red:    { primary: '#dc2626', hover: '#b91c1c', glow: 'rgba(220, 38, 38, 0.25)', soft: '#fff1f2', border: '#fca5a5' },
      blue:   { primary: '#2563eb', hover: '#1d4ed8', glow: 'rgba(37, 99, 235, 0.25)', soft: '#eff6ff', border: '#93c5fd' },
      green:  { primary: '#059669', hover: '#047857', glow: 'rgba(5, 150, 105, 0.25)', soft: '#ecfdf5', border: '#6ee7b7' },
      purple: { primary: '#7c3aed', hover: '#6d28d9', glow: 'rgba(124, 58, 237, 0.25)', soft: '#f5f3ff', border: '#c4b5fd' },
      orange: { primary: '#ea580c', hover: '#c2410c', glow: 'rgba(234, 88, 12, 0.25)', soft: '#fff7ed', border: '#fdba74' }
    };
    const chosen = palettes[colorKey] || palettes.red;
    this.accentColor = colorKey in palettes ? colorKey : 'red';
    localStorage.setItem('saleem_accent_color', this.accentColor);
    document.documentElement.style.setProperty('--primary', chosen.primary);
    document.documentElement.style.setProperty('--primary-hover', chosen.hover);
    document.documentElement.style.setProperty('--primary-glow', chosen.glow);
    document.documentElement.style.setProperty('--primary-soft-bg', chosen.soft);
    document.documentElement.style.setProperty('--primary-soft-border', chosen.border);
  },

  /* ------------------- Multi-Currency Management (PKR, USD, INR, AED, SAR, USDT) ------------------- */
  setCurrency(curr) {
    const validCurr = CURRENCIES[curr] ? curr : 'PKR';
    this.currency = validCurr;
    localStorage.setItem(STORAGE_KEYS.CURRENCY, validCurr);
    const c = CURRENCIES[validCurr];

    document.querySelectorAll('.curr-symbol').forEach(el => {
      el.textContent = c.symbol;
    });
    document.querySelectorAll('.curr-code').forEach(el => {
      el.textContent = c.code;
    });

    const topSym = document.getElementById('top-curr-sym');
    const topCode = document.getElementById('top-curr-code');
    const sideCurr = document.getElementById('sidebar-curr-label');
    const navCurr = document.getElementById('nav-curr-label');
    const mobDrawerCurr = document.getElementById('mob-drawer-curr-label');

    if (topSym) topSym.textContent = c.symbol;
    if (topCode) topCode.textContent = c.code;
    if (sideCurr) sideCurr.textContent = `${c.symbol} ${c.code}`;
    if (navCurr) navCurr.textContent = `${c.code} (${c.symbol})`;
    if (mobDrawerCurr) mobDrawerCurr.textContent = `${c.code} (${c.symbol})`;

    window.dispatchEvent(new CustomEvent('saleem_currency_changed', { detail: { currency: validCurr, config: c } }));

    if (typeof renderAllPrices === 'function') renderAllPrices();
    if (typeof onServiceChange === 'function') onServiceChange();
    if (typeof renderServiceCatalog === 'function') renderServiceCatalog();
  },

  formatMoney(amountUsd, amountPkr) {
    const pkr = amountPkr !== undefined ? Number(amountPkr) : (Number(amountUsd) * 280.0);
    const c = CURRENCIES[this.currency] || CURRENCIES.PKR;
    const converted = pkr / c.rateToPkr;
    return `${c.symbol} ${Number(converted).toLocaleString(undefined, { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals })}`;
  },

  convertFromPkr(amountPkr, targetCurrency) {
    const c = CURRENCIES[targetCurrency || this.currency] || CURRENCIES.PKR;
    return Number((Number(amountPkr) / c.rateToPkr).toFixed(c.decimals));
  },

  getCurrencyList() {
    return Object.values(CURRENCIES);
  },

  /* ------------------- User Authentication Database ------------------- */
  initUsersDatabase() {
    let users = [];
    const raw = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
    if (!raw) {
      users = DEFAULT_ACCOUNTS;
    } else {
      try {
        users = JSON.parse(raw);
      } catch (e) {
        users = DEFAULT_ACCOUNTS;
      }
    }

    // Enforce that both authorized admin accounts have admin role
    users = users.map(u => {
      if (u.email && isUserAdmin(u.email)) {
        return { ...u, role: 'admin' };
      }
      return { ...u, role: u.role === 'admin' && !isUserAdmin(u.email) ? 'client' : (u.role || 'client') };
    }).filter(u => u.email !== 'admin@saleemsmm.pk');

    // Ensure default admin accounts are seeded
    ADMIN_EMAILS.forEach((admEmail, idx) => {
      if (!users.some(u => u.email && u.email.toLowerCase().trim() === admEmail.toLowerCase().trim())) {
        users.push(DEFAULT_ACCOUNTS[idx + 1]);
      }
    });

    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
  },

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS_LIST) || '[]');
    } catch (e) {
      return DEFAULT_ACCOUNTS;
    }
  },

  saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
  },

  loadUser() {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          parsed.role = isUserAdmin(parsed.email) ? 'admin' : (parsed.role || 'client');
          this.currentUser = parsed;
        } else {
          this.currentUser = DEFAULT_ACCOUNTS[0];
          this.saveUser();
        }
      } catch (e) {
        this.currentUser = DEFAULT_ACCOUNTS[0];
        this.saveUser();
      }
    } else {
      this.currentUser = DEFAULT_ACCOUNTS[0];
      this.saveUser();
    }
  },

  saveUser() {
    if (this.currentUser) {
      this.currentUser.role = (this.currentUser.email && isUserAdmin(this.currentUser.email)) ? 'admin' : (this.currentUser.role || 'client');
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
      const users = this.getUsers();
      const idx = users.findIndex(u => u.email.toLowerCase() === this.currentUser.email.toLowerCase());
      if (idx !== -1) {
        users[idx] = this.currentUser;
        this.saveUsers(users);
      }
    }
  },

  /* Register a New User */
  registerUser(name, username, email, phone, password) {
    const users = this.getUsers();
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    if (password.length < 6) {
      return { success: false, message: "Password must be at least 6 characters long." };
    }

    // Try Supabase Sign Up if active
    if (window.SaleemSupabase && SaleemSupabase.isConfigured()) {
      SaleemSupabase.signUp(cleanEmail, password, { name: name.trim(), username: cleanUsername, phone: phone ? phone.trim() : '' })
        .then(res => {
          if (res && res.success) console.log('✅ Supabase user registered:', res.user);
        }).catch(() => {});
    }

    if (isUserAdmin(cleanEmail)) {
      const existingAdminIdx = users.findIndex(u => u.email.toLowerCase().trim() === cleanEmail);
      const isYasin = cleanEmail === 'yasinofficial03098158572@gmail.com';
      const defaultName = isYasin ? "Yasin Official (Admin)" : "Saleem Akhtar (Admin)";
      const defaultUsername = isYasin ? "yasin_admin" : "saleem_admin";
      const defaultId = isYasin ? "USR-003" : "USR-002";

      const adminUser = {
        id: defaultId,
        name: name.trim() || defaultName,
        username: cleanUsername || defaultUsername,
        email: cleanEmail,
        phone: phone ? phone.trim() : OFFICIAL_WHATSAPP,
        password: password,
        role: "admin",
        balance_pkr: existingAdminIdx !== -1 ? users[existingAdminIdx].balance_pkr : 25000.00,
        balance_usd: existingAdminIdx !== -1 ? users[existingAdminIdx].balance_usd : 89.28,
        spent_pkr: existingAdminIdx !== -1 ? users[existingAdminIdx].spent_pkr : 0.00,
        spent_usd: existingAdminIdx !== -1 ? users[existingAdminIdx].spent_usd : 0.00,
        apiKey: "smm_live_sec_admin_" + Math.random().toString(36).substring(2, 12),
        joined_at: new Date().toISOString().substring(0, 10)
      };
      if (existingAdminIdx !== -1) {
        users[existingAdminIdx] = adminUser;
      } else {
        users.push(adminUser);
      }
      this.saveUsers(users);
      this.currentUser = adminUser;
      this.saveUser();
      return { success: true, user: adminUser };
    }

    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: "Username already taken! Please choose another." };
    }

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: "Email is already registered! Please login." };
    }

    const newUser = {
      id: "USR-" + Math.floor(1000 + Math.random() * 9000),
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      phone: phone ? phone.trim() : "",
      password: password,
      role: "client",
      balance_pkr: 0.00,
      balance_usd: 0.00,
      spent_pkr: 0.00,
      spent_usd: 0.00,
      apiKey: "smm_live_sec_" + Math.random().toString(36).substring(2, 14),
      joined_at: new Date().toISOString().substring(0, 10)
    };

    users.push(newUser);
    this.saveUsers(users);

    this.currentUser = newUser;
    this.saveUser();
    return { success: true, user: newUser };
  },

  /* Log in Existing User */
  loginUser(loginInput, password) {
    const users = this.getUsers();
    const query = loginInput.toLowerCase().trim();

    // Direct Supabase Authentication attempt if email & active
    if (window.SaleemSupabase && SaleemSupabase.isConfigured() && query.includes('@')) {
      SaleemSupabase.signIn(query, password).then(res => {
        if (res && res.success && res.profile) {
          const u = {
            id: res.profile.id,
            name: res.profile.name || res.profile.username,
            username: res.profile.username,
            email: res.profile.email,
            phone: res.profile.phone || '',
            role: isUserAdmin(res.profile.email) ? 'admin' : (res.profile.role || 'client'),
            balance_pkr: Number(res.profile.balance_pkr || 0),
            balance_usd: Number(res.profile.balance_usd || 0),
            spent_pkr: Number(res.profile.spent_pkr || 0),
            spent_usd: Number(res.profile.spent_usd || 0),
            joined_at: res.profile.created_at ? res.profile.created_at.substring(0, 10) : '2026-10-01'
          };
          AppState.currentUser = u;
          AppState.saveUser();
        }
      }).catch(() => {});
    }

    const user = users.find(u =>
      (u.username.toLowerCase() === query || u.email.toLowerCase() === query) &&
      u.password === password
    );

    if (user) {
      user.role = isUserAdmin(user.email) ? 'admin' : (user.role || 'client');
      this.currentUser = user;
      this.saveUser();
      return { success: true, user: user };
    } else {
      return { success: false, message: "Invalid username/email or password!" };
    }
  },

  /* Log out */
  logout() {
    if (window.SaleemSupabase && SaleemSupabase.isConfigured()) {
      SaleemSupabase.signOut().catch(() => {});
    }
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.USER);
    if (window.location.pathname.includes('/views/') || window.location.pathname.includes('/pages/')) {
      window.location.href = '../index.html';
    } else {
      window.location.href = 'index.html';
    }
  },

  /* Reset Password */
  async resetPassword(email) {
    const clean = (email || '').toLowerCase().trim();
    if (!clean) return { success: false, message: 'Please enter your email address.' };

    if (window.SaleemSupabase && SaleemSupabase.isConfigured()) {
      const res = await SaleemSupabase.resetPassword(clean);
      if (res && res.success) {
        return { success: true, message: 'Password reset link has been emailed to you via Supabase!' };
      }
    }

    const users = this.getUsers();
    const found = users.find(u => u.email && u.email.toLowerCase().trim() === clean);
    if (found) {
      return {
        success: true,
        message: `Account found for ${found.name || found.username}! Please verify via WhatsApp (03163846672) to receive your instant reset PIN.`
      };
    }
    return { success: false, message: 'No registered account found with this email address.' };
  },

  /* ------------------- Password Change Engine ------------------- */
  async changePassword(oldPassword, newPassword) {
    if (!this.currentUser) {
      return { success: false, message: 'Please log in to change your password.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }
    if (this.currentUser.password && this.currentUser.password !== oldPassword) {
      return { success: false, message: 'Current password is incorrect! Please verify.' };
    }

    // Update active session & database
    this.currentUser.password = newPassword;
    this.saveUser();

    const users = this.getUsers();
    const idx = users.findIndex(u =>
      (u.id && u.id === this.currentUser.id) ||
      (u.email && u.email.toLowerCase() === this.currentUser.email.toLowerCase())
    );
    if (idx !== -1) {
      users[idx].password = newPassword;
      this.saveUsers(users);
    }

    // Sync to Supabase auth if connected
    if (window.SaleemSupabase && SaleemSupabase.isConfigured() && SaleemSupabase.client) {
      try {
        await SaleemSupabase.client.auth.updateUser({ password: newPassword });
      } catch (err) {
        console.warn('Supabase password sync:', err);
      }
    }

    this.showToast('Password changed successfully!', 'success');
    return { success: true, message: 'Password updated successfully!' };
  },

  /* ------------------- Dynamic Admin Access Management ------------------- */
  getAdminList() {
    const allEmails = getAllAdminEmails();
    const users = this.getUsers();
    return allEmails.map(email => {
      const u = users.find(x => x.email && x.email.toLowerCase().trim() === email.toLowerCase().trim());
      const isSaleem = email.toLowerCase() === 'saleembaloch1857@gmail.com';
      const isYasin = email.toLowerCase() === 'yasinofficial03098158572@gmail.com';
      const isRoot = isSaleem || isYasin;
      return {
        email: email,
        name: isSaleem ? 'Saleem Akhtar' : (isYasin ? 'Yasin Official' : (u?.name || u?.username || 'Admin')),
        username: isSaleem ? 'saleem_admin' : (isYasin ? 'yasin_admin' : (u?.username || 'admin')),
        roleTitle: isSaleem ? 'Founder & Owner' : (isYasin ? 'Co-Founder & Lead Admin' : 'Administrator'),
        isRoot: isRoot,
        phone: u?.phone || OFFICIAL_WHATSAPP
      };
    });
  },

  addAdminByEmail(rawEmail) {
    const email = (rawEmail || '').toLowerCase().trim();
    if (!email || !email.includes('@') || !email.includes('.')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    const all = getAllAdminEmails();
    if (all.some(a => a.toLowerCase() === email)) {
      return { success: false, message: 'This email is already an Administrator!' };
    }

    const custom = getCustomAdminEmails();
    custom.push(email);
    localStorage.setItem('saleem_custom_admin_emails', JSON.stringify(custom));

    // Update existing user role if account exists
    const users = this.getUsers();
    const idx = users.findIndex(u => u.email && u.email.toLowerCase().trim() === email);
    if (idx !== -1) {
      users[idx].role = 'admin';
      this.saveUsers(users);
    }

    // Sync to Supabase profile if connected
    if (window.SaleemSupabase && SaleemSupabase.isConfigured() && SaleemSupabase.client) {
      SaleemSupabase.client
        .from('profiles')
        .update({ role: 'admin' })
        .eq('email', email)
        .then();
    }

    this.showToast(`Admin privileges granted to: ${email}`, 'success');
    return { success: true, message: `Admin added successfully: ${email}` };
  },

  removeAdminByEmail(rawEmail) {
    const email = (rawEmail || '').toLowerCase().trim();
    if (ROOT_ADMIN_EMAILS.some(r => r.toLowerCase() === email)) {
      return { success: false, message: 'Root Founder accounts (Saleem & Yasin) cannot be removed!' };
    }

    let custom = getCustomAdminEmails();
    custom = custom.filter(a => a.toLowerCase().trim() !== email);
    localStorage.setItem('saleem_custom_admin_emails', JSON.stringify(custom));

    // Update user role to client
    const users = this.getUsers();
    const idx = users.findIndex(u => u.email && u.email.toLowerCase().trim() === email);
    if (idx !== -1) {
      users[idx].role = 'client';
      this.saveUsers(users);
    }

    // Sync to Supabase profile if connected
    if (window.SaleemSupabase && SaleemSupabase.isConfigured() && SaleemSupabase.client) {
      SaleemSupabase.client
        .from('profiles')
        .update({ role: 'client' })
        .eq('email', email)
        .then();
    }

    this.showToast(`Admin privileges removed from: ${email}`, 'info');
    return { success: true, message: `Admin removed: ${email}` };
  },

  /* ------------------- Admin User Wallet Controls ------------------- */
  adminUpdateUserBalance(userIdOrEmail, newBalancePkr) {
    const users = this.getUsers();
    const query = String(userIdOrEmail).toLowerCase().trim();
    const idx = users.findIndex(u =>
      (u.id && String(u.id).toLowerCase() === query) ||
      (u.email && u.email.toLowerCase().trim() === query) ||
      (u.username && u.username.toLowerCase().trim() === query)
    );

    if (idx === -1) return false;

    const valPkr = Math.max(0, Number(Number(newBalancePkr).toFixed(2)));
    const valUsd = Number((valPkr / 280).toFixed(2));

    users[idx].balance_pkr = valPkr;
    users[idx].balance_usd = valUsd;
    this.saveUsers(users);

    // If target user is the active logged-in user in this browser, synchronize immediately
    if (this.currentUser && (
      this.currentUser.email?.toLowerCase() === users[idx].email?.toLowerCase() ||
      this.currentUser.username?.toLowerCase() === users[idx].username?.toLowerCase()
    )) {
      this.currentUser.balance_pkr = valPkr;
      this.currentUser.balance_usd = valUsd;
      this.saveUser();
    }

    // Update in Supabase if active
    if (window.SaleemSupabase && SaleemSupabase.isConfigured()) {
      SaleemSupabase.updateUserBalance(users[idx].email || users[idx].id, valPkr).catch(() => {});
    }

    window.dispatchEvent(new CustomEvent('saleem_users_updated'));
    return true;
  },

  adminAdjustUserFunds(userIdOrEmail, deltaPkr) {
    const users = this.getUsers();
    const query = String(userIdOrEmail).toLowerCase().trim();
    const target = users.find(u =>
      (u.id && String(u.id).toLowerCase() === query) ||
      (u.email && u.email.toLowerCase().trim() === query) ||
      (u.username && u.username.toLowerCase().trim() === query)
    );

    if (!target) return false;
    const current = Number(target.balance_pkr || 0);
    const newBal = current + Number(deltaPkr);
    return this.adminUpdateUserBalance(userIdOrEmail, newBal);
  },

  adminResetUserBalance(userIdOrEmail) {
    return this.adminUpdateUserBalance(userIdOrEmail, 0.00);
  },

  updateNavAuthUI() {
    const inSubfolder = window.location.pathname.includes('/views/') || window.location.pathname.includes('/pages/');
    const dashLink = inSubfolder ? 'dashboard.html' : 'views/dashboard.html';
    const adminLink = inSubfolder ? 'admin.html' : 'views/admin.html';
    const loginLink = inSubfolder ? '../index.html#auth' : 'index.html#auth';
    const signupLink = inSubfolder ? 'signup.html' : 'views/signup.html';

    // Show/hide admin links strictly for saleembaloch1857@gmail.com
    const isAdminUser = this.isAdmin();
    document.querySelectorAll('.admin-only-link').forEach(el => {
      el.style.display = isAdminUser ? '' : 'none';
    });

    const authBox = document.getElementById('nav-auth-container');
    if (!authBox) return;

    if (this.currentUser) {
      authBox.innerHTML = `
        ${isAdminUser ? `
          <a href="${adminLink}" class="btn-outline nav-btn-compact" style="padding:7px 12px;font-size:12.5px;border-color:var(--primary);color:var(--primary);">
            <i class="fa-solid fa-shield-halved"></i> <span class="hide-xs">Admin</span>
          </a>
        ` : ''}
        <a href="${dashLink}" class="btn-primary-grad nav-btn-compact" style="padding:7px 14px;font-size:12.5px;">
          <i class="fa-solid fa-user"></i> <span>${this.currentUser.username}</span> <span class="hide-sm">(${this.formatMoney(this.currentUser.balance_usd, this.currentUser.balance_pkr)})</span>
        </a>
        <button onclick="AppState.logout()" class="btn-outline nav-btn-compact hide-xs" style="padding:7px 11px;font-size:12.5px;" title="Logout">
          <i class="fa-solid fa-power-off"></i>
        </button>
      `;
    } else {
      authBox.innerHTML = `
        <a href="${loginLink}" class="btn-outline nav-btn-compact" style="padding:7px 13px;font-size:12.5px;">
          <i class="fa-solid fa-arrow-right-to-bracket"></i> Login
        </a>
        <a href="${signupLink}" class="btn-primary-grad nav-btn-compact hide-sm" style="padding:7px 13px;font-size:12.5px;">
          <i class="fa-solid fa-user-plus"></i> Sign Up
        </a>
      `;
    }

    const mobDrawerAuth = document.getElementById('mob-drawer-auth-box');
    if (mobDrawerAuth) {
      if (this.currentUser) {
        mobDrawerAuth.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:38px;height:38px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;">
              ${(this.currentUser.username || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style="font-weight:800;font-size:14px;color:var(--text-primary);">${this.currentUser.username}</div>
              <div style="font-size:12px;color:var(--primary);font-weight:700;">Balance: ${this.formatMoney(this.currentUser.balance_usd, this.currentUser.balance_pkr)}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <a href="${dashLink}" class="btn-primary-grad" style="flex:1;text-align:center;padding:9px;font-size:13px;justify-content:center;">
              <i class="fa-solid fa-gauge-high"></i> Dashboard
            </a>
            <button onclick="AppState.logout()" class="btn-outline" style="padding:9px 12px;font-size:13px;" title="Logout">
              <i class="fa-solid fa-power-off"></i> Logout
            </button>
          </div>
        `;
      } else {
        mobDrawerAuth.innerHTML = `
          <div style="font-size:12.5px;color:var(--text-secondary);margin-bottom:8px;">Welcome to Saleem SMM Panel</div>
          <div style="display:flex;gap:8px;">
            <a href="${loginLink}" class="btn-outline" style="flex:1;text-align:center;padding:9px;font-size:13px;justify-content:center;" onclick="if(typeof closeMobileNav==='function')closeMobileNav()">
              <i class="fa-solid fa-arrow-right-to-bracket"></i> Login
            </a>
            <a href="${signupLink}" class="btn-primary-grad" style="flex:1;text-align:center;padding:9px;font-size:13px;justify-content:center;" onclick="if(typeof closeMobileNav==='function')closeMobileNav()">
              <i class="fa-solid fa-user-plus"></i> Sign Up
            </a>
          </div>
        `;
      }
    }
  },

  /* ------------------- Supabase Realtime Cloud Sync ------------------- */
  async syncWithSupabase() {
    if (!window.SaleemSupabase || !SaleemSupabase.isConfigured()) return;
    try {
      // 1. Sync Profiles
      const spProfiles = await SaleemSupabase.fetchUsers();
      if (spProfiles && spProfiles.length > 0) {
        let localUsers = this.getUsers();
        spProfiles.forEach(p => {
          const idx = localUsers.findIndex(u => (u.email && p.email && u.email.toLowerCase().trim() === p.email.toLowerCase().trim()) || (u.id === p.id));
          const mapped = {
            id: p.id,
            name: p.name || p.username || 'User',
            username: p.username || (p.email ? p.email.split('@')[0] : 'user'),
            email: p.email,
            phone: p.phone || '',
            role: isUserAdmin(p.email) ? 'admin' : (p.role || 'client'),
            balance_pkr: Number(p.balance_pkr || 0),
            balance_usd: Number(p.balance_usd || 0),
            spent_pkr: Number(p.spent_pkr || 0),
            spent_usd: Number(p.spent_usd || 0),
            joined_at: p.created_at ? p.created_at.substring(0, 10) : '2026-10-01'
          };
          if (idx !== -1) {
            localUsers[idx] = { ...localUsers[idx], ...mapped };
          } else {
            localUsers.push(mapped);
          }
          if (this.currentUser && this.currentUser.email && p.email && this.currentUser.email.toLowerCase().trim() === p.email.toLowerCase().trim()) {
            this.currentUser.balance_pkr = mapped.balance_pkr;
            this.currentUser.balance_usd = mapped.balance_usd;
            this.currentUser.role = mapped.role;
            this.saveUser();
          }
        });
        this.saveUsers(localUsers);
        window.dispatchEvent(new CustomEvent('saleem_users_updated'));
      }

      // 2. Sync Deposits
      const spDeposits = await SaleemSupabase.fetchDeposits();
      if (spDeposits && spDeposits.length > 0) {
        let localDeps = this.getDeposits();
        spDeposits.forEach(sd => {
          const idx = localDeps.findIndex(d => String(d.id) === String(sd.id) || (d.tid && sd.tid && d.tid === sd.tid));
          const mappedDep = {
            id: sd.id,
            userId: sd.username || 'Client',
            userEmail: sd.user_email || '',
            method: sd.method,
            tid: sd.tid,
            amount_pkr: Number(sd.amount_pkr || 0),
            amount_usd: Number(sd.amount_usd || (sd.amount_pkr / 280)),
            status: sd.status,
            created_at: sd.created_at ? sd.created_at.replace('T', ' ').substring(0, 16) : new Date().toISOString().substring(0, 16)
          };
          if (idx !== -1) {
            localDeps[idx] = mappedDep;
          } else {
            localDeps.unshift(mappedDep);
          }
        });
        this.saveDeposits(localDeps);
        window.dispatchEvent(new CustomEvent('saleem_deposits_updated'));
      }

      // 3. Sync Orders
      const spOrders = await SaleemSupabase.fetchOrders();
      if (spOrders && spOrders.length > 0) {
        let localOrders = this.getOrders();
        spOrders.forEach(so => {
          const idx = localOrders.findIndex(o => String(o.id) === String(so.id));
          const mappedOrder = {
            id: so.id,
            username: so.username || 'Client',
            userEmail: so.user_email || '',
            service_id: so.service_id,
            service_name: so.service_name,
            link: so.link,
            quantity: so.quantity,
            charge_pkr: Number(so.charge_pkr || 0),
            charge_usd: Number(so.charge_usd || 0),
            status: so.status,
            created_at: so.created_at ? so.created_at.replace('T', ' ').substring(0, 16) : new Date().toISOString().substring(0, 16)
          };
          if (idx !== -1) {
            localOrders[idx] = mappedOrder;
          } else {
            localOrders.unshift(mappedOrder);
          }
        });
        this.saveOrders(localOrders);
        window.dispatchEvent(new CustomEvent('saleem_orders_updated'));
      }

      // 4. Sync Live Chats
      const spChats = await SaleemSupabase.fetchChats();
      if (spChats && spChats.length > 0) {
        let allChats = this.getChats();
        spChats.forEach(sc => {
          const threadUserId = sc.user_id;
          let thread = allChats.find(t => t.userId === threadUserId);
          if (!thread) {
            thread = {
              userId: threadUserId,
              username: sc.user_name || threadUserId,
              name: sc.user_name || threadUserId,
              email: sc.user_email || '',
              phone: '',
              unreadByAdmin: 0,
              unreadByUser: 0,
              updatedAt: sc.created_at ? sc.created_at.replace('T', ' ').substring(0, 16) : '',
              messages: []
            };
            allChats.unshift(thread);
          }
          if (!thread.messages.some(m => m.id === 'SP-' + sc.id || (m.text === sc.message && m.sender === sc.sender))) {
            thread.messages.push({
              id: 'SP-' + sc.id,
              sender: sc.sender,
              senderName: sc.sender_name || (sc.sender === 'admin' ? 'Saleem Akhtar (Admin)' : thread.username),
              text: sc.message,
              time: sc.created_at ? new Date(sc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
            });
          }
        });
        this.saveChats(allChats);
        window.dispatchEvent(new CustomEvent('saleem_chats_updated'));
      }
    } catch (err) {
      console.warn('Sync with Supabase failed:', err);
    }
  },

  /* ------------------- Initial Seed Data ------------------- */
  initDefaultData() {
    // Reset orders so mock data is 0 and users start with a clean slate
    const existingOrders = this.getOrders();
    const hasOldMocks = existingOrders.some(o => o.id === 50412 || o.id === 50413 || o.id === 50414);
    if (hasOldMocks || !localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      const cleanOrders = existingOrders.filter(o => o.id !== 50412 && o.id !== 50413 && o.id !== 50414);
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(cleanOrders));
    }

    if (!localStorage.getItem(STORAGE_KEYS.DEPOSITS)) {
      const defaultDeposits = [
        {
          id: "DEP-901",
          method: "EasyPaisa",
          account: "03173983906 (EasyPaisa)",
          tid: "EP9876543210",
          amount_pkr: 2500,
          amount_usd: 8.92,
          status: "Approved",
          created_at: "2026-10-10 11:30"
        },
        {
          id: "DEP-902",
          method: "UPaisa",
          account: "03163846672 (UPaisa)",
          tid: "UP1122334455",
          amount_pkr: 5000,
          amount_usd: 17.85,
          status: "Pending",
          created_at: "2026-10-12 19:40"
        }
      ];
      localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(defaultDeposits));
    }

    if (!localStorage.getItem(STORAGE_KEYS.CHATS)) {
      const defaultChats = [
        {
          userId: "saleem_vip",
          username: "saleem_vip",
          name: "Saleem VIP Client",
          email: "client@saleemsmm.pk",
          phone: "03173983906",
          unreadByAdmin: 1,
          unreadByUser: 0,
          updatedAt: "2026-10-13 03:50",
          messages: [
            {
              id: "MSG-101",
              sender: "admin",
              senderName: "Saleem Akhtar (Admin)",
              text: "Assalam-o-Alaikum! Welcome to Saleem SMM Panel Live Support. Aap yahan panel ke andar direct Admin se baat kar sakte hain ya apna Customize SMM Panel banwane ke liye order de sakte hain. WhatsApp: 03163846672",
              time: "03:45 AM"
            },
            {
              id: "MSG-102",
              sender: "user",
              senderName: "saleem_vip",
              text: "Assalam-o-Alaikum bhai, mujhe apna customize SMM panel banwana hai aur deposit verify karwana hai.",
              time: "03:50 AM"
            }
          ]
        }
      ];
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(defaultChats));
    }
  },

  getOrders() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
  },

  saveOrders(orders) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  },

  getDeposits() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DEPOSITS) || '[]');
  },

  saveDeposits(deps) {
    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deps));
  },

  /* ------------------- In-Panel Live Chat System ------------------- */
  getChats() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '[]');
    } catch (e) {
      return [];
    }
  },

  saveChats(chats) {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    window.dispatchEvent(new CustomEvent('saleem_chats_updated'));
  },

  getCurrentChatIdentity() {
    if (this.currentUser) {
      return {
        userId: this.currentUser.username || this.currentUser.email,
        username: this.currentUser.username,
        name: this.currentUser.name || this.currentUser.username,
        email: this.currentUser.email || '',
        phone: this.currentUser.phone || ''
      };
    }
    let guestId = localStorage.getItem('saleem_guest_chat_id');
    if (!guestId) {
      guestId = 'guest_' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('saleem_guest_chat_id', guestId);
    }
    return {
      userId: guestId,
      username: guestId,
      name: 'Visitor (' + guestId + ')',
      email: 'visitor@saleemsmm.pk',
      phone: ''
    };
  },

  getUserChatThread(targetUserId) {
    const chats = this.getChats();
    const identity = this.getCurrentChatIdentity();
    const uid = targetUserId || identity.userId;
    let thread = chats.find(c => c.userId === uid);

    if (!thread) {
      thread = {
        userId: uid,
        username: identity.username,
        name: identity.name,
        email: identity.email,
        phone: identity.phone,
        unreadByAdmin: 0,
        unreadByUser: 0,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        messages: [
          {
            id: 'MSG-' + Date.now(),
            sender: 'admin',
            senderName: 'Saleem Akhtar (Admin)',
            text: 'Assalam-o-Alaikum! Welcome to Saleem SMM Panel Live Chat. Kisi bhi order, EasyPaisa/UPaisa deposit, ya apna Customize SMM Panel banwane ke liye yahan message likhein. Admin aapko isi panel mein reply karega!',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      };
      chats.unshift(thread);
      this.saveChats(chats);
    }
    return thread;
  },

  sendUserChatMessage(text) {
    const clean = (text || '').trim();
    if (!clean) return null;

    const chats = this.getChats();
    const identity = this.getCurrentChatIdentity();
    let idx = chats.findIndex(c => c.userId === identity.userId);

    if (idx === -1) {
      this.getUserChatThread(identity.userId);
      return this.sendUserChatMessage(clean);
    }

    const msg = {
      id: 'MSG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      sender: 'user',
      senderName: identity.username,
      text: clean,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    chats[idx].messages.push(msg);
    chats[idx].unreadByAdmin = (chats[idx].unreadByAdmin || 0) + 1;
    chats[idx].unreadByUser = 0;
    chats[idx].updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updatedThread = chats.splice(idx, 1)[0];
    chats.unshift(updatedThread);
    this.saveChats(chats);

    // Sync to Supabase Realtime DB if active
    if (window.SaleemSupabase && SaleemSupabase.isConfigured()) {
      SaleemSupabase.sendChatMessage({
        userId: identity.userId,
        userName: identity.name || identity.username,
        userEmail: identity.email,
        sender: 'user',
        senderName: identity.username,
        message: clean
      }).catch(() => {});
    }

    // Sync to backend server
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'user_message',
        userId: identity.userId,
        username: identity.username,
        name: identity.name,
        email: identity.email,
        phone: identity.phone,
        message: msg
      })
    }).catch(() => {});

    return msg;
  },

  sendAdminChatReply(targetUserId, text) {
    const clean = (text || '').trim();
    if (!clean || !targetUserId) return null;

    const chats = this.getChats();
    let idx = chats.findIndex(c => c.userId === targetUserId);
    if (idx === -1) return null;

    const msg = {
      id: 'MSG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      sender: 'admin',
      senderName: 'Saleem Akhtar (Admin)',
      text: clean,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    chats[idx].messages.push(msg);
    chats[idx].unreadByAdmin = 0;
    chats[idx].unreadByUser = (chats[idx].unreadByUser || 0) + 1;
    chats[idx].updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updatedThread = chats.splice(idx, 1)[0];
    chats.unshift(updatedThread);
    this.saveChats(chats);

    // Sync to Supabase Realtime DB if active
    if (window.SaleemSupabase && SaleemSupabase.isConfigured()) {
      SaleemSupabase.sendChatMessage({
        userId: targetUserId,
        userName: updatedThread.name || targetUserId,
        userEmail: updatedThread.email || '',
        sender: 'admin',
        senderName: 'Saleem Akhtar (Admin)',
        message: clean
      }).catch(() => {});
    }

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'admin_reply',
        userId: targetUserId,
        message: msg
      })
    }).catch(() => {});

    return msg;
  },

  async syncChatsFromServer() {
    try {
      const res = await fetch('/api/chat');
      if (!res.ok) return;
      const payload = await res.json();
      const serverChats = Array.isArray(payload) ? payload : (payload && Array.isArray(payload.chats) ? payload.chats : []);
      if (serverChats.length === 0) return;

      const localChats = this.getChats();
      let changed = false;

      serverChats.forEach(sThread => {
        const sid = sThread.userId || sThread.username || sThread.threadId;
        if (!sid) return;
        const lIdx = localChats.findIndex(c => (c.userId || c.username || c.threadId) === sid);
        if (lIdx === -1) {
          localChats.push({
            ...sThread,
            userId: sThread.userId || sThread.username || sid
          });
          changed = true;
        } else {
          const localIds = new Set(localChats[lIdx].messages.map(m => m.id));
          (sThread.messages || []).forEach(m => {
            if (!localIds.has(m.id)) {
              localChats[lIdx].messages.push(m);
              if (m.sender === 'admin') {
                localChats[lIdx].unreadByUser = (localChats[lIdx].unreadByUser || 0) + 1;
              } else {
                localChats[lIdx].unreadByAdmin = (localChats[lIdx].unreadByAdmin || 0) + 1;
              }
              localChats[lIdx].updatedAt = sThread.updatedAt || localChats[lIdx].updatedAt;
              changed = true;
            }
          });
        }
      });

      if (changed) {
        this.saveChats(localChats);
      }
    } catch (e) {
      // Offline or local file mode fallback
    }
  },

  /* ------------------- Floating Live Chat + WhatsApp Widget ------------------- */
  initFloatingSupportWidgets() {
    // Do not mount client floating widget on admin page
    if (window.location.pathname.includes('admin.html')) return;

    // Remove old static floating whatsapp button if present so we render unified floating bar
    document.querySelectorAll('.floating-whatsapp').forEach(el => el.remove());

    if (document.getElementById('saleem-floating-support-root')) return;

    const root = document.createElement('div');
    root.id = 'saleem-floating-support-root';
    root.innerHTML = `
      <!-- Premium Dark Floating Chat Card (Matches Screenshots) -->
      <div class="saleem-dark-chat-card" id="saleem-dark-chat-card">
        <button type="button" class="dark-chat-close-x" onclick="document.getElementById('saleem-dark-chat-card').classList.add('minimized')" title="Minimize / Dismiss">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="dark-chat-top">
          <div>
            <div class="dark-chat-title">Questions? Chat with us.</div>
            <div class="dark-chat-online">
              <span class="online-pulse-dot"></span> We are online
            </div>
          </div>
          <div class="dark-chat-avatars">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces" alt="Support">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces" alt="Admin">
            <span class="dark-chat-blue-icon"><i class="fa-solid fa-comment-dots"></i></span>
          </div>
        </div>
        <div class="dark-chat-bottom">
          <button type="button" class="dark-chat-red-cta" onclick="window.toggleSaleemLiveChat()">
            <i class="fa-solid fa-message"></i> Chat with SaleemSMMPanel
            <span class="saleem-chat-badge" id="floating-chat-badge" style="display:none;">1</span>
          </button>
          <a href="https://wa.me/${OFFICIAL_WHATSAPP_INTL}?text=assalamualaikum%20sir%20I%20have%20placed%20the%20order"
             target="_blank"
             class="dark-chat-wa-circle"
             title="WhatsApp Support (${OFFICIAL_WHATSAPP})">
            <i class="fa-brands fa-whatsapp"></i>
          </a>
        </div>
      </div>

      <!-- Minimized Floating Trigger Button -->
      <button type="button" class="saleem-mini-chat-trigger" id="saleem-mini-chat-trigger" onclick="document.getElementById('saleem-dark-chat-card').classList.remove('minimized')" title="Open Support Chat">
        <i class="fa-solid fa-headset"></i>
        <span class="online-pulse-dot" style="position:absolute;top:4px;right:4px;"></span>
      </button>

      <!-- In-Panel Live Chat Popup Window -->
      <div class="saleem-chat-popup" id="saleem-chat-popup">
        <div class="saleem-chat-header">
          <div class="saleem-chat-header-info">
            <div class="saleem-chat-avatar">
              <i class="fa-solid fa-headset"></i>
              <span class="online-dot"></span>
            </div>
            <div>
              <h4>Saleem SMM Live Chat</h4>
              <p>Admin Online • Replies Inside Panel</p>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <a href="https://wa.me/${OFFICIAL_WHATSAPP_INTL}?text=assalamualaikum%20sir%20I%20have%20placed%20the%20order"
               target="_blank"
               class="chat-wa-mini-btn"
               title="Open WhatsApp ${OFFICIAL_WHATSAPP}">
              <i class="fa-brands fa-whatsapp"></i> ${OFFICIAL_WHATSAPP}
            </a>
            <button type="button" class="saleem-chat-close" onclick="window.toggleSaleemLiveChat()">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div class="saleem-chat-quick-chips">
          <button type="button" onclick="window.sendQuickChatPreset('Assalam-o-Alaikum! Mujhe apna Customize SMM Panel banwana hai, details aur price bata dein.')">
            👑 Customize SMM Panel
          </button>
          <button type="button" onclick="window.sendQuickChatPreset('Assalam-o-Alaikum! Maine EasyPaisa / UPaisa par payment bhej di hai, mera deposit approve kar dein.')">
            💳 Deposit Verify
          </button>
          <button type="button" onclick="window.sendQuickChatPreset('Assalam-o-Alaikum! Mere order ki speed/status check kar dein.')">
            ⚡ Order Help
          </button>
        </div>

        <div class="saleem-chat-messages" id="floating-chat-messages"></div>

        <form class="saleem-chat-input-bar" onsubmit="window.handleFloatingChatSubmit(event)">
          <input type="text"
                 id="floating-chat-input"
                 placeholder="Type message for Admin..."
                 autocomplete="off"
                 required>
          <button type="submit" title="Send Message">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(root);
    this.renderFloatingChatMessages();

    window.addEventListener('saleem_chats_updated', () => {
      this.renderFloatingChatMessages();
    });
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.CHATS) {
        this.renderFloatingChatMessages();
      }
    });
  },

  renderFloatingChatMessages() {
    const container = document.getElementById('floating-chat-messages');
    if (!container) return;

    const thread = this.getUserChatThread();
    container.innerHTML = thread.messages.map(m => `
      <div class="chat-bubble-row ${m.sender === 'user' ? 'chat-row-user' : 'chat-row-admin'}">
        <div class="chat-bubble ${m.sender === 'user' ? 'bubble-user' : 'bubble-admin'}">
          <div class="bubble-sender">${m.sender === 'user' ? 'You' : 'Saleem Admin'}</div>
          <div class="bubble-text">${this.escapeHtml(m.text)}</div>
          <div class="bubble-time">${m.time}</div>
        </div>
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  },

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  showToast(message, type = 'success') {
    const existing = document.querySelector('.saleem-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `saleem-toast toast-${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '90px',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      background: type === 'success' ? '#2ed573' : type === 'error' ? '#eb4d4b' : '#1e90ff',
      color: '#fff',
      padding: '12px 22px',
      borderRadius: '50px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '13.5px',
      fontWeight: '600',
      zIndex: '10005',
      maxWidth: '92vw',
      opacity: '0',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    });

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 350);
    }, 3400);
  },

  setupGlobalListeners() {
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        item.classList.toggle('active');
      });
    });
  }
};

window.toggleSaleemLiveChat = function(forceOpen) {
  const popup = document.getElementById('saleem-chat-popup');
  if (!popup) return;
  if (forceOpen === true) {
    popup.classList.add('open');
  } else if (forceOpen === false) {
    popup.classList.remove('open');
  } else {
    popup.classList.toggle('open');
  }
  if (popup.classList.contains('open')) {
    AppState.renderFloatingChatMessages();
    const input = document.getElementById('floating-chat-input');
    if (input) setTimeout(() => input.focus(), 100);
  }
};

window.openSaleemLiveChat = function(prefillText) {
  // If user is on dashboard and has the full chat view, we can also open the popup or switch to chat view
  const popup = document.getElementById('saleem-chat-popup');
  if (popup) {
    popup.classList.add('open');
    AppState.renderFloatingChatMessages();
    const input = document.getElementById('floating-chat-input');
    if (input) {
      if (prefillText) input.value = prefillText;
      setTimeout(() => input.focus(), 100);
    }
  }
};

window.sendQuickChatPreset = function(text) {
  AppState.sendUserChatMessage(text);
  AppState.renderFloatingChatMessages();
  if (typeof renderDashboardChatMessages === 'function') {
    renderDashboardChatMessages();
  }
  AppState.showToast('Message sent to Admin! Admin will reply here shortly.', 'success');
};

window.handleFloatingChatSubmit = function(e) {
  e.preventDefault();
  const input = document.getElementById('floating-chat-input');
  if (!input || !input.value.trim()) return;
  AppState.sendUserChatMessage(input.value.trim());
  input.value = '';
  AppState.renderFloatingChatMessages();
  if (typeof renderDashboardChatMessages === 'function') {
    renderDashboardChatMessages();
  }
};

/* copyText helper used across dashboard */
AppState.copyText = function(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
    });
  } else {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    el.remove();
  }
  AppState.showToast('Copied to clipboard!', 'success');
};

/* requireLogin — redirect to login page if not authenticated */
AppState.requireLogin = function(redirectIfAdmin) {
  if (!AppState.currentUser) {
    const inViews = window.location.pathname.includes('/views/') || window.location.pathname.includes('/pages/');
    window.location.replace(inViews ? '../index.html#auth' : 'index.html#auth');
    return false;
  }
  if (redirectIfAdmin && AppState.isAdmin()) {
    const inViews = window.location.pathname.includes('/views/') || window.location.pathname.includes('/pages/');
    window.location.replace(inViews ? 'admin.html' : 'views/admin.html');
    return false;
  }
  return true;
};

document.addEventListener('DOMContentLoaded', () => {
  AppState.init();
});
