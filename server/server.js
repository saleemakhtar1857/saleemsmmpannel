/**
 * SALEEM SMM PANEL — FULL-STACK NODE.JS BACKEND & SMM API v2
 * Standalone Express server with 625+ Wholesale SMM Services & Reseller API
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, '..');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Explicitly trace all static frontend files so Vercel's @vercel/nft bundler includes them
const FRONTEND_FILES = {
  index: path.join(__dirname, '../index.html'),
  dashboard: path.join(__dirname, '../views/dashboard.html'),
  admin: path.join(__dirname, '../views/admin.html'),
  signup: path.join(__dirname, '../views/signup.html'),
  styleCss: path.join(__dirname, '../css/style.css'),
  dashboardCss: path.join(__dirname, '../css/dashboard.css'),
  adminCss: path.join(__dirname, '../css/admin.css'),
  appJs: path.join(__dirname, '../js/app.js'),
  dashboardJs: path.join(__dirname, '../js/dashboard.js'),
  adminJs: path.join(__dirname, '../js/admin.js'),
  servicesDataJs: path.join(__dirname, '../js/services-data.js')
};

Object.values(FRONTEND_FILES).forEach(filePath => {
  try {
    fs.readFileSync(filePath);
  } catch (e) {
    console.warn('Static asset check:', filePath, e.message);
  }
});

// Serve static frontend from root directory and subdirectories
app.use(express.static(ROOT_DIR));
app.use('/views', express.static(path.join(__dirname, '../views')));
app.use('/pages', express.static(path.join(__dirname, '../views')));
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));

// Explicit HTML page routes
app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(FRONTEND_FILES.index);
});

app.get(['/dashboard', '/dashboard.html', '/views/dashboard.html', '/pages/dashboard.html'], (req, res) => {
  res.sendFile(FRONTEND_FILES.dashboard);
});

app.get(['/admin', '/admin.html', '/views/admin.html', '/pages/admin.html'], (req, res) => {
  res.sendFile(FRONTEND_FILES.admin);
});

app.get(['/signup', '/signup.html', '/views/signup.html', '/pages/signup.html'], (req, res) => {
  res.sendFile(FRONTEND_FILES.signup);
});

// Load services dynamically from services-data.js
let ALL_SERVICES = [];
try {
  const srvPath = FRONTEND_FILES.servicesDataJs;
  const code = fs.readFileSync(srvPath, 'utf8');
  const fn = new Function(code + '; return { cats: MASTER_CATEGORIES, srvs: MASTER_SERVICES };');
  const res = fn();
  ALL_SERVICES = res.srvs.map(s => ({
    service: s.id,
    name: s.name,
    type: "Default",
    category: s.category_name,
    rate: s.rate_pkr.toString(),
    min: s.min.toString(),
    max: s.max.toString(),
    avg_time: s.avg_time
  }));
  console.log(`Loaded ${ALL_SERVICES.length} services into SMM API v2 Engine.`);
} catch (e) {
  console.error("Error loading services-data.js:", e.message);
}

// In-Memory Database (Demo Engine)
const DB = {
  users: [
    {
      key: "smm_live_sec_99a8b7c6d5e4f3a2",
      username: "saleem_vip",
      balance: 5200.00,
      currency: "PKR"
    },
    {
      key: "smm_live_sec_admin_778899aabbcc",
      username: "admin",
      email: "saleembaloch1857@gmail.com",
      balance: 25000.00,
      currency: "PKR"
    }
  ],
  services: ALL_SERVICES,
  orders: {
    50412: { charge: "145.60", start_count: "1420", status: "Completed", remains: "0", currency: "PKR" },
    50413: { charge: "32.50", start_count: "530", status: "In progress", remains: "6200", currency: "PKR" },
    50414: { charge: "1976.00", start_count: "320", status: "Processing", remains: "1850", currency: "PKR" }
  },
  chats: [
    {
      threadId: "chat_saleem_vip",
      username: "saleem_vip",
      name: "Saleem VIP Reseller",
      email: "vip@saleemsmm.pk",
      phone: "03173983906",
      unreadAdmin: 1,
      unreadUser: 0,
      updatedAt: "Just now",
      messages: [
        {
          id: 1,
          sender: "admin",
          senderName: "Saleem Admin",
          text: "Assalam-o-Alaikum! Welcome to Saleem SMM Panel Live Chat 💬. Need help with an order, EasyPaisa/UPaisa deposit, or want to order your own Customize SMM Panel? Message here anytime!",
          time: "10:00 AM"
        },
        {
          id: 2,
          sender: "user",
          senderName: "Saleem VIP Reseller",
          text: "Salam Admin! Mujhe apna Customize SMM Panel banwana hai, details bata dein.",
          time: "10:05 AM"
        }
      ]
    }
  ]
};

/**
 * In-Panel Live Chat API (User <-> Admin Real-Time Messaging)
 */
app.get('/api/chat', (req, res) => {
  return res.json(DB.chats);
});

app.post('/api/chat', (req, res) => {
  const body = req.body || {};
  const { action, userId, threadId, username, name, email, phone, text, time, message } = body;
  const uid = userId || threadId || username || 'guest';
  const msgObj = message || (text ? {
    id: 'MSG-' + Date.now(),
    sender: action === 'admin_reply' ? 'admin' : 'user',
    senderName: action === 'admin_reply' ? 'Saleem Akhtar (Admin)' : (name || username || 'User'),
    text: String(text).trim(),
    time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } : null);

  if (!msgObj || !msgObj.text) {
    return res.status(400).json({ error: "Message text is required" });
  }

  if (action === 'user_message') {
    let thread = DB.chats.find(c => (c.userId || c.threadId) === uid);
    if (!thread) {
      thread = {
        userId: uid,
        threadId: uid,
        username: username || uid,
        name: name || username || 'Visitor',
        email: email || '',
        phone: phone || '',
        unreadByAdmin: 0,
        unreadByUser: 0,
        updatedAt: msgObj.time || 'Just now',
        messages: [
          {
            id: 'MSG-INIT-' + Date.now(),
            sender: 'admin',
            senderName: 'Saleem Akhtar (Admin)',
            text: 'Assalam-o-Alaikum! Welcome to Saleem SMM Panel Live Support 💬. How can we help you today?',
            time: msgObj.time || 'Just now'
          }
        ]
      };
      DB.chats.unshift(thread);
    }

    thread.messages.push(msgObj);
    thread.unreadByAdmin = (thread.unreadByAdmin || 0) + 1;
    thread.updatedAt = msgObj.time || 'Just now';

    return res.json({ success: true, thread, chats: DB.chats });
  }

  if (action === 'admin_reply') {
    const thread = DB.chats.find(c => (c.userId || c.threadId) === uid);
    if (!thread) {
      return res.status(404).json({ error: "Chat thread not found" });
    }
    thread.messages.push(msgObj);
    thread.unreadByAdmin = 0;
    thread.unreadByUser = (thread.unreadByUser || 0) + 1;
    thread.updatedAt = msgObj.time || 'Just now';

    return res.json({ success: true, thread, chats: DB.chats });
  }

  return res.status(400).json({ error: "Invalid chat action" });
});

/**
 * Standard SMM Reseller API v2 Endpoint
 * Used by external panels, WordPress plugins, and automated clients
 */
app.all(['/api/v2', '/v2'], (req, res) => {
  const params = req.method === 'POST' ? req.body : req.query;
  const { key, action } = params;

  const user = DB.users.find(u => u.key === key);
  if (!user) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  if (action === 'services') {
    return res.json(DB.services.length > 0 ? DB.services : ALL_SERVICES);
  }

  if (action === 'balance') {
    return res.json({ balance: user.balance.toFixed(2), currency: user.currency });
  }

  if (action === 'status') {
    const orderId = params.order;
    if (!orderId || !DB.orders[orderId]) {
      return res.status(404).json({ error: "Incorrect order ID" });
    }
    return res.json(DB.orders[orderId]);
  }

  if (action === 'add') {
    const { service, link, quantity } = params;
    const qty = parseInt(quantity);
    const srv = (DB.services.length > 0 ? DB.services : ALL_SERVICES).find(s => s.service === parseInt(service));

    if (!srv) {
      return res.status(400).json({ error: "Incorrect service ID" });
    }
    if (!link) {
      return res.status(400).json({ error: "Target link is required" });
    }
    if (isNaN(qty) || qty < parseInt(srv.min) || qty > parseInt(srv.max)) {
      return res.status(400).json({ error: `Quantity must be between ${srv.min} and ${srv.max}` });
    }

    const cost = (parseFloat(srv.rate) * qty) / 1000;
    if (user.balance < cost) {
      return res.status(400).json({ error: "Not enough funds on balance" });
    }

    user.balance -= cost;

    const newOrderId = Math.floor(10000 + Math.random() * 90000);
    DB.orders[newOrderId] = {
      charge: cost.toFixed(2),
      start_count: "0",
      status: "Pending",
      remains: qty.toString(),
      currency: "PKR"
    };

    return res.json({ order: newOrderId });
  }

  return res.status(400).json({ error: "Invalid action parameter" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` SALEEM SMM PANEL — SERVER RUNNING`);
    console.log(` Loaded:         ${ALL_SERVICES.length} Active Services (+30% Price, +20m Speed)`);
    console.log(` Public Website: http://localhost:${PORT}`);
    console.log(` Sign Up Page:   http://localhost:${PORT}/views/signup.html`);
    console.log(` Dashboard:      http://localhost:${PORT}/views/dashboard.html`);
    console.log(` Admin Center:   http://localhost:${PORT}/views/admin.html`);
    console.log(` Reseller API:   http://localhost:${PORT}/api/v2`);
    console.log(`====================================================`);
  });
}

module.exports = app;
