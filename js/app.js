/* ==========================================================================
   SALEEM SMM PANEL — GLOBAL APP & STATE CONTROLLER
   With Complete Multi-User Registration & Authentication System
   ========================================================================== */

const STORAGE_KEYS = {
  THEME: 'saleem_theme_mode',
  CURRENCY: 'saleem_currency',
  USER: 'saleem_current_user',
  USERS_LIST: 'saleem_users_database',
  ORDERS: 'saleem_orders_db',
  DEPOSITS: 'saleem_deposits_db',
  TICKETS: 'saleem_tickets_db'
};

const ADMIN_EMAIL = 'saleembaloch1857@gmail.com';

// Default Pre-seeded Accounts
const DEFAULT_ACCOUNTS = [
  {
    id: "USR-001",
    name: "Saleem VIP Client",
    username: "saleem_vip",
    email: "client@saleemsmm.pk",
    phone: "03173983906",
    password: "saleem123",
    role: "client",
    balance_pkr: 5200.00,
    balance_usd: 18.57,
    spent_pkr: 14500.00,
    spent_usd: 51.78,
    apiKey: "smm_live_sec_99a8b7c6d5e4f3a2",
    joined_at: "2026-09-15"
  },
  {
    id: "USR-002",
    name: "Saleem Akhtar (Admin)",
    username: "saleem_admin",
    email: ADMIN_EMAIL,
    phone: "03173983906",
    password: "admin123",
    role: "admin",
    balance_pkr: 25000.00,
    balance_usd: 89.28,
    spent_pkr: 0.00,
    spent_usd: 0.00,
    apiKey: "smm_live_sec_admin_778899aabbcc",
    joined_at: "2026-08-01"
  }
];

const AppState = {
  theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'nightmode',
  currency: localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'PKR',
  currentUser: null,

  init() {
    this.applyTheme(this.theme);
    this.initUsersDatabase();
    this.loadUser();
    this.initDefaultData();
    this.setupGlobalListeners();
    this.updateNavAuthUI();
  },

  isAdmin() {
    return Boolean(
      this.currentUser &&
      this.currentUser.email &&
      this.currentUser.email.toLowerCase().trim() === ADMIN_EMAIL
    );
  },

  /* ------------------- Theme Management ------------------- */
  applyTheme(theme) {
    this.theme = theme;
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'nightmode') {
      document.body.classList.add('nightmode');
    } else {
      document.body.classList.remove('nightmode');
    }

    const themeIcons = document.querySelectorAll('.theme-toggle-icon');
    themeIcons.forEach(icon => {
      icon.className = theme === 'nightmode' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });
  },

  toggleTheme() {
    const nextTheme = this.theme === 'nightmode' ? 'daymode' : 'nightmode';
    this.applyTheme(nextTheme);
  },

  /* ------------------- Currency Management ------------------- */
  setCurrency(curr) {
    this.currency = curr;
    localStorage.setItem(STORAGE_KEYS.CURRENCY, curr);
    document.querySelectorAll('.curr-symbol').forEach(el => {
      el.textContent = curr === 'PKR' ? '₨' : '$';
    });
    document.querySelectorAll('.curr-code').forEach(el => {
      el.textContent = curr;
    });
    if (typeof renderAllPrices === 'function') {
      renderAllPrices();
    }
  },

  formatMoney(amountUsd, amountPkr) {
    if (this.currency === 'PKR') {
      const val = amountPkr !== undefined ? amountPkr : (amountUsd * 280);
      return `₨ ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      const val = amountUsd !== undefined ? amountUsd : (amountPkr / 280);
      return `$ ${Number(val).toFixed(2)}`;
    }
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

    // Enforce that ONLY saleembaloch1857@gmail.com has admin role
    let hasAdmin = false;
    users = users.map(u => {
      if (u.email && u.email.toLowerCase().trim() === ADMIN_EMAIL) {
        hasAdmin = true;
        return { ...u, role: 'admin' };
      }
      // Remove old generic admin@saleemsmm.pk account if present
      return { ...u, role: 'client' };
    }).filter(u => u.email !== 'admin@saleemsmm.pk');

    if (!hasAdmin) {
      users.push(DEFAULT_ACCOUNTS[1]);
    }

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
        // Ensure role strictly matches ADMIN_EMAIL policy
        parsed.role = (parsed.email && parsed.email.toLowerCase().trim() === ADMIN_EMAIL) ? 'admin' : 'client';
        this.currentUser = parsed;
      } catch (e) {
        this.currentUser = DEFAULT_ACCOUNTS[0];
      }
    } else {
      this.currentUser = DEFAULT_ACCOUNTS[0];
      this.saveUser();
    }
  },

  saveUser() {
    if (this.currentUser) {
      this.currentUser.role = (this.currentUser.email && this.currentUser.email.toLowerCase().trim() === ADMIN_EMAIL) ? 'admin' : 'client';
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
      // Sync back to users list
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

    // Special handling if Admin registers/sets password with saleembaloch1857@gmail.com
    if (cleanEmail === ADMIN_EMAIL) {
      const existingAdminIdx = users.findIndex(u => u.email.toLowerCase().trim() === ADMIN_EMAIL);
      const adminUser = {
        id: "USR-002",
        name: name.trim() || "Saleem Akhtar (Admin)",
        username: cleanUsername || "saleem_admin",
        email: ADMIN_EMAIL,
        phone: phone ? phone.trim() : "03173983906",
        password: password,
        role: "admin",
        balance_pkr: existingAdminIdx !== -1 ? users[existingAdminIdx].balance_pkr : 25000.00,
        balance_usd: existingAdminIdx !== -1 ? users[existingAdminIdx].balance_usd : 89.28,
        spent_pkr: existingAdminIdx !== -1 ? users[existingAdminIdx].spent_pkr : 0.00,
        spent_usd: existingAdminIdx !== -1 ? users[existingAdminIdx].spent_usd : 0.00,
        apiKey: "smm_live_sec_admin_778899aabbcc",
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

    // Check unique username
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: "Username already taken! Please choose another." };
    }

    // Check unique email
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
      balance_pkr: 100.00, // ₨ 100 Signup Gift Bonus
      balance_usd: 0.36,
      spent_pkr: 0.00,
      spent_usd: 0.00,
      apiKey: "smm_live_sec_" + Math.random().toString(36).substring(2, 14),
      joined_at: new Date().toISOString().substring(0, 10)
    };

    users.push(newUser);
    this.saveUsers(users);

    // Auto login as new user
    this.currentUser = newUser;
    this.saveUser();
    return { success: true, user: newUser };
  },

  /* Log in Existing User */
  loginUser(loginInput, password) {
    const users = this.getUsers();
    const query = loginInput.toLowerCase().trim();

    const user = users.find(u =>
      (u.username.toLowerCase() === query || u.email.toLowerCase() === query) &&
      u.password === password
    );

    if (user) {
      user.role = (user.email.toLowerCase().trim() === ADMIN_EMAIL) ? 'admin' : 'client';
      this.currentUser = user;
      this.saveUser();
      return { success: true, user: user };
    } else {
      return { success: false, message: "Invalid username/email or password!" };
    }
  },

  /* Log out */
  logout() {
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.USER);
    if (window.location.pathname.includes('/pages/')) {
      window.location.href = '../index.html';
    } else {
      window.location.href = 'index.html';
    }
  },

  updateNavAuthUI() {
    const inPages = window.location.pathname.includes('/pages/');
    const dashLink = inPages ? 'dashboard.html' : 'pages/dashboard.html';
    const adminLink = inPages ? 'admin.html' : 'pages/admin.html';
    const loginLink = inPages ? '../index.html#auth' : 'index.html#auth';
    const signupLink = inPages ? 'signup.html' : 'pages/signup.html';

    // Show/hide admin links across the UI strictly for saleembaloch1857@gmail.com
    const isAdminUser = this.isAdmin();
    document.querySelectorAll('.admin-only-link').forEach(el => {
      el.style.display = isAdminUser ? '' : 'none';
    });

    const authBox = document.getElementById('nav-auth-container');
    if (!authBox) return;

    if (this.currentUser) {
      authBox.innerHTML = `
        ${isAdminUser ? `
          <a href="${adminLink}" class="btn-outline" style="padding:8px 14px;font-size:13px;border-color:var(--primary);color:var(--primary);">
            <i class="fa-solid fa-shield-halved"></i> Admin
          </a>
        ` : ''}
        <a href="${dashLink}" class="btn-primary-grad" style="padding:8px 18px;font-size:13px;">
          <i class="fa-solid fa-user"></i> ${this.currentUser.username} (${this.formatMoney(this.currentUser.balance_usd, this.currentUser.balance_pkr)})
        </a>
        <button onclick="AppState.logout()" class="btn-outline" style="padding:8px 14px;font-size:13px;" title="Logout">
          <i class="fa-solid fa-power-off"></i>
        </button>
      `;
    } else {
      authBox.innerHTML = `
        <a href="${loginLink}" class="btn-outline" style="padding:8px 16px;font-size:13px;">
          <i class="fa-solid fa-arrow-right-to-bracket"></i> Login
        </a>
        <a href="${signupLink}" class="btn-primary-grad" style="padding:8px 16px;font-size:13px;">
          <i class="fa-solid fa-user-plus"></i> Sign Up
        </a>
      `;
    }
  },

  /* ------------------- Initial Seed Data ------------------- */
  initDefaultData() {
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      const defaultOrders = [
        {
          id: 50412,
          service_id: 15210,
          service_name: "Instagram Followers | Speed 10K+ / DAY",
          link: "https://instagram.com/saleem_fashion_pk",
          quantity: 2000,
          charge_pkr: 145.60,
          charge_usd: 0.52,
          status: "Completed",
          start_count: 1420,
          remains: 0,
          created_at: "2026-10-11 14:22"
        },
        {
          id: 50413,
          service_id: 15038,
          service_name: "TikTok Video Views | Speed 1M+ / DAY",
          link: "https://tiktok.com/@saleem_official/video/7311",
          quantity: 25000,
          charge_pkr: 32.50,
          charge_usd: 0.12,
          status: "In progress",
          start_count: 530,
          remains: 6200,
          created_at: "2026-10-12 18:05"
        },
        {
          id: 50414,
          service_id: 14721,
          service_name: "YouTube Views [Non-Drop] | Min 5K",
          link: "https://youtube.com/watch?v=dQw4w9WgXcQ",
          quantity: 5000,
          charge_pkr: 1976.00,
          charge_usd: 7.05,
          status: "Processing",
          start_count: 320,
          remains: 1850,
          created_at: "2026-10-12 20:15"
        }
      ];
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(defaultOrders));
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
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      background: type === 'success' ? '#2ed573' : type === 'error' ? '#eb4d4b' : '#1e90ff',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '50px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '14px',
      fontWeight: '600',
      zIndex: '10000',
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
    }, 3200);
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

document.addEventListener('DOMContentLoaded', () => {
  AppState.init();
});
