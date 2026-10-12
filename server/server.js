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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend from root directory
app.use(express.static(path.join(__dirname, '..')));

// Load services dynamically from services-data.js
let ALL_SERVICES = [];
try {
  const srvPath = path.join(__dirname, '../js/services-data.js');
  const code = fs.readFileSync(srvPath, 'utf8');
  // Evaluate services array in a sandbox or closure
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
      balance: 25000.00,
      currency: "PKR"
    }
  ],
  services: ALL_SERVICES,
  orders: {
    50412: { charge: "145.60", start_count: "1420", status: "Completed", remains: "0", currency: "PKR" },
    50413: { charge: "32.50", start_count: "530", status: "In progress", remains: "6200", currency: "PKR" },
    50414: { charge: "1976.00", start_count: "320", status: "Processing", remains: "1850", currency: "PKR" }
  }
};

/**
 * Standard SMM Reseller API v2 Endpoint
 * Used by external panels, WordPress plugins, and automated clients
 */
app.all('/api/v2', (req, res) => {
  const params = req.method === 'POST' ? req.body : req.query;
  const { key, action } = params;

  // Validate API Key
  const user = DB.users.find(u => u.key === key);
  if (!user) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  // Action: Services
  if (action === 'services') {
    return res.json(DB.services.length > 0 ? DB.services : ALL_SERVICES);
  }

  // Action: Balance
  if (action === 'balance') {
    return res.json({ balance: user.balance.toFixed(2), currency: user.currency });
  }

  // Action: Status
  if (action === 'status') {
    const orderId = params.order;
    if (!orderId || !DB.orders[orderId]) {
      return res.status(404).json({ error: "Incorrect order ID" });
    }
    return res.json(DB.orders[orderId]);
  }

  // Action: Add (Create Order)
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

    // Deduct user balance
    user.balance -= cost;

    // Generate Order ID
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

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` SALEEM SMM PANEL — SERVER RUNNING`);
  console.log(` Loaded:         ${ALL_SERVICES.length} Active Services (+30% Price, +20m Speed)`);
  console.log(` Public Website: http://localhost:${PORT}`);
  console.log(` Sign Up Page:   http://localhost:${PORT}/signup.html`);
  console.log(` Dashboard:      http://localhost:${PORT}/dashboard.html`);
  console.log(` Admin Center:   http://localhost:${PORT}/admin.html`);
  console.log(` Reseller API:   http://localhost:${PORT}/api/v2`);
  console.log(`====================================================`);
});
