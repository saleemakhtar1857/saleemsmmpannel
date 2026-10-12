const path = require('path');
const fs = require('fs');

let ALL_SERVICES = [];
try {
  const srvPath = path.join(process.cwd(), 'js/services-data.js');
  if (fs.existsSync(srvPath)) {
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
  }
} catch (e) {
  console.error("API Error loading services:", e.message);
}

const DB = {
  users: [
    { key: "smm_live_sec_99a8b7c6d5e4f3a2", username: "saleem_vip", balance: 5200.00, currency: "PKR" },
    { key: "smm_live_sec_admin_778899aabbcc", username: "admin", balance: 25000.00, currency: "PKR" }
  ],
  orders: {
    50412: { charge: "145.60", start_count: "1420", status: "Completed", remains: "0", currency: "PKR" },
    50413: { charge: "32.50", start_count: "530", status: "In progress", remains: "6200", currency: "PKR" },
    50414: { charge: "1976.00", start_count: "320", status: "Processing", remains: "1850", currency: "PKR" }
  }
};

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const params = req.method === 'POST' ? req.body || req.query : req.query;
  const { key, action } = params || {};

  const user = DB.users.find(u => u.key === key);
  if (!user) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  if (action === 'services') {
    return res.json(ALL_SERVICES);
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
    const srv = ALL_SERVICES.find(s => s.service === parseInt(service));

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
};
