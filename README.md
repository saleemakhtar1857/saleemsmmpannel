# Saleem SMM Panel (Ø³Ù„ÛŒÙ… Ø§ÛŒØ³ Ø§ÛŒÙ… Ø§ÛŒÙ… Ù¾ÛŒÙ†Ù„)
### Pakistan's Best & Most Affordable Wholesale SMM Provider Platform

---

## ðŸš€ Overview

**Saleem SMM Panel** is an end-to-end, high-converting social media marketing reseller platform designed specifically for the Pakistani and international market. Modeled after top tier panels like DilSMMPanel, it features high-retention services (Instagram, TikTok, YouTube 4000h watch time, Facebook, Telegram, WhatsApp) with instant local payment support (EasyPaisa, JazzCash, Bank Alfalah, Meezan Bank, and Binance USDT).

---

## ðŸ“‚ Project Structure

```
saleem-smm-panel/
â”œâ”€â”€ index.html               # Public Marketing Portal & Landing Page (DilSMMPanel-Style UI - ROOT)
â”œâ”€â”€ views/
â”‚   â”œâ”€â”€ dashboard.html       # Client User Dashboard (New Order, Orders, Add Funds, API, Tickets)
â”‚   â”œâ”€â”€ admin.html           # Super Admin Control Center (Analytics, 1-Click TID Approvals, Orders)
â”‚   â””â”€â”€ signup.html          # Registration Page (with â‚¨ 100 bonus)
â”œâ”€â”€ api/
â”‚   â””â”€â”€ v2.js                # Vercel Serverless Function for SMM Reseller API v2
â”œâ”€â”€ css/
â”‚   â”œâ”€â”€ style.css            # Core brand theme (Red/Black gradient, Day/Night mode)
â”‚   â”œâ”€â”€ dashboard.css        # Client dashboard layout, price calculator & data tables
â”‚   â””â”€â”€ admin.css            # Admin control center layout & controls
â”œâ”€â”€ js/
â”‚   â”œâ”€â”€ app.js               # Global state controller (Wallet, Theme, Currency switcher, Toast alerts)
â”‚   â”œâ”€â”€ services-data.js     # Master catalog of 625+ wholesale SMM services (+30% price, +20m speed)
â”‚   â”œâ”€â”€ dashboard.js         # Client order placement, dynamic price calculator & deposit logic
â”‚   â””â”€â”€ admin.js             # Admin analytics, 1-click deposit approvals, status overrides
â”œâ”€â”€ server/                  # Standalone local Node.js Express server (optional)
â”œâ”€â”€ vercel.json              # Vercel configuration (clean URLs & route rewrites)
â”œâ”€â”€ .vercelignore            # Ignores server/ to prevent build conflicts on Vercel
â””â”€â”€ README.md                # Deployment and user guide
```

---

## âš¡ How to Run & Test Instantly

### Option A: Direct Browser Preview (Zero Installation Needed)
You can directly open `index.html` in your web browser (Google Chrome, Microsoft Edge):
1. Double-click `index.html` to open the public landing page.
2. Click **"Log In to Dashboard"** or click **"Dashboard"** in the top navigation bar.
3. Test placing a new order:
   - Select a Category (e.g. *Instagram Followers* or *TikTok Views*).
   - Enter your target link and quantity. Notice the live total price calculated instantly.
   - Click **"Place Order Now"**. Check that your order appears in **Orders History** with a "Pending" status badge.
4. Test depositing funds (EasyPaisa / JazzCash):
   - Navigate to **"Add Funds / Deposit"**.
   - Copy the account number, enter amount (e.g. â‚¨ 2,000) and any TID (e.g. `EP8899001122`), then submit.
5. Open `admin.html` (Admin Control Center):
   - In the **"Pending Deposits"** table, you will see the deposit slip you just submitted.
   - Click the green **"Approve"** button.
   - Switch back to `dashboard.html` and notice the â‚¨ 2,000 is credited to your wallet balance.

### Option B: Node.js Server & Standard Reseller API v2
If you have Node.js installed:
```bash
cd saleem-smm-panel/server
npm install
npm start
```
The server will start at `http://localhost:3000`:
- Public Landing Page: `http://localhost:3000/`
- User Portal: `http://localhost:3000/dashboard.html`
- Admin Center: `http://localhost:3000/admin.html`
- Reseller REST API (v2): `http://localhost:3000/api/v2`

---

## ðŸ”Œ Reseller REST API (v2) Endpoints

Saleem SMM Panel adheres to the standard SMM API v2 protocol:

- **Endpoint URL:** `POST /api/v2`
- **Supported Actions:**
  - `action=services`: Fetch all available services, categories, rates, min and max limits.
  - `action=add`: Create a new wholesale order (`service`, `link`, `quantity`).
  - `action=status`: Check order status, start count, and remains (`order`).
  - `action=balance`: Check reseller wallet balance and currency.

---

## ðŸŒ Live Web Hosting & Deployment

### Deploy to Vercel (1-Click via GitHub)
1. Push this folder to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Saleem SMM Panel with pages subfolder and vercel config"
   git branch -M main
   git remote add origin https://github.com/<your-username>/saleem-smm-panel.git
   git push -u origin main
   ```
2. Log in to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your GitHub repository.
4. **Important Deployment Settings:**
   - **Framework Preset:** Select **"Other"** (or Static Site).
   - **Root Directory:** `./` (Leave as default).
   - **Build & Output Settings:** Leave empty / default (no build required).
5. Click **"Deploy"** â€” It deploys within seconds with 0 errors!
6. All routes (`/`, `/dashboard`, `/admin`, `/signup`, `/api/v2`) will work immediately.

---

### Deploy to cPanel / Shared Hosting
1. Purchase a domain name and cPanel web hosting (from providers like HosterPK, Hostinger, Namecheap).
2. Compress the files in `saleem-smm-panel/` into a `.zip` archive.
3. Open cPanel -> **File Manager** -> go to `public_html/`.
4. Upload and extract the files so that `index.html` is in the root directory.
5. Your website will be live immediately with SSL!


