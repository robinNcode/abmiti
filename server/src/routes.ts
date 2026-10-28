import { Express } from 'express';
import authRouter from './modules/auth/auth.routes';
import entryRouter from './modules/entry/entry.routes';
import categoryRouter from './modules/category/category.routes';
import summaryRouter from './modules/summary/summary.routes';
import accountRouter from './modules/account/account.routes';
import budgetRouter from './modules/budget/budget.routes';
import adminRouter from './modules/admin/admin.routes';

import { env } from './config/env';

const API_V1 = env.API_PREFIX;

/** Derive the public frontend URL from env or fall back to localhost. */
function frontendUrl(): string {
  // In production, the first CLIENT_URL is the deployed SPA origin.
  if (env.NODE_ENV === 'production' && env.CLIENT_URLS.length > 0) {
    const origin = env.CLIENT_URLS.find((u) => u.startsWith('https://')) ?? env.CLIENT_URLS[0];
    return `${origin}/abmiti`;
  }
  return 'http://localhost:5173/abmiti';
}

export const registerRoutes = (app: Express): void => {
  // ── Welcome page ─────────────────────────────────────────────
  app.get('/', (_req, res) => {
    const fe = frontendUrl();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Abmiti API — Halal Personal Finance</title>
  <meta name="description" content="Abmiti (আয় ব্যয় মিতি) is a halal-friendly personal finance tracker with Bangladesh payment rails, EN/BN UI, and a Flutter mobile app."/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --terra: #c0541c;
      --terra-light: #e8714a;
      --sage: #4a7c59;
      --mustard: #d4a72c;
      --ink: #1a1a2e;
      --paper: #fdf8f3;
    }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: var(--ink);
      color: #e8e8f0;
      min-height: 100vh;
      line-height: 1.6;
    }
    .hero {
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0d1f17 100%);
      padding: 80px 24px 60px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 0%, rgba(192,84,28,.18) 0%, transparent 65%);
      pointer-events: none;
    }
    .badge {
      display: inline-block;
      background: rgba(192,84,28,.15);
      border: 1px solid rgba(192,84,28,.4);
      color: var(--terra-light);
      font-size: .75rem;
      font-weight: 600;
      letter-spacing: .08em;
      text-transform: uppercase;
      padding: 4px 14px;
      border-radius: 100px;
      margin-bottom: 20px;
    }
    .logo {
      font-size: 3.5rem;
      font-weight: 800;
      background: linear-gradient(120deg, var(--terra-light), var(--mustard));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -1px;
    }
    .bn { font-size: 1.1rem; color: rgba(255,255,255,.45); margin-top: 4px; }
    .tagline { font-size: 1.2rem; color: rgba(255,255,255,.7); margin: 18px auto 0; max-width: 520px; }
    .cta-row {
      margin-top: 36px;
      display: flex;
      gap: 14px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 13px 28px;
      border-radius: 12px;
      font-weight: 600; font-size: .95rem;
      text-decoration: none;
      transition: transform .15s, box-shadow .15s;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.35); }
    .btn-primary { background: var(--terra); color: #fff; }
    .btn-outline { background: transparent; border: 1.5px solid rgba(255,255,255,.25); color: #fff; }
    .section { padding: 60px 24px; max-width: 1000px; margin: 0 auto; }
    .section-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 32px; color: #fff; text-align: center; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
    .card {
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 16px;
      padding: 28px 24px;
      transition: border-color .2s, transform .2s;
    }
    .card:hover { border-color: rgba(192,84,28,.5); transform: translateY(-3px); }
    .card-icon { font-size: 2rem; margin-bottom: 12px; }
    .card h3 { font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 8px; }
    .card p { font-size: .88rem; color: rgba(255,255,255,.55); }
    .api-box {
      background: rgba(0,0,0,.35);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 12px;
      padding: 20px 24px;
      font-family: 'Fira Code', 'Courier New', monospace;
      font-size: .85rem;
      color: #a8e6b8;
      overflow-x: auto;
    }
    .api-box span.label { color: rgba(255,255,255,.4); }
    .footer {
      text-align: center;
      padding: 36px 24px;
      border-top: 1px solid rgba(255,255,255,.07);
      color: rgba(255,255,255,.3);
      font-size: .85rem;
    }
    .footer a { color: var(--terra-light); text-decoration: none; }
    .pill {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(74,124,89,.15); border: 1px solid rgba(74,124,89,.35);
      border-radius: 100px; padding: 3px 12px;
      font-size: .78rem; color: #7ecf94; font-weight: 600; margin: 3px;
    }
  </style>
</head>
<body>
  <div class="hero">
    <div class="badge">✦ Halal Finance · আয় ব্যয় মিতি</div>
    <div class="logo">Abmiti</div>
    <div class="bn">আয় ব্যয় মিতি — API Server</div>
    <p class="tagline">A halal-friendly personal finance tracker with Bangladesh payment rails, bilingual UI, and a Flutter mobile shell.</p>
    <div class="cta-row">
      <a href="${fe}" class="btn btn-primary">🚀 Open Web App</a>
      <a href="${API_V1}/health" class="btn btn-outline">❤ Health Check</a>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Features</h2>
    <div class="cards">
      <div class="card">
        <div class="card-icon">📒</div>
        <h3>Ledger & Budgets</h3>
        <p>Monthly named budgets with income, expense, savings, investment, payable & receivable entries.</p>
      </div>
      <div class="card">
        <div class="card-icon">🇧🇩</div>
        <h3>Bangladesh Rails</h3>
        <p>Bank, bKash, Nagad, Rocket — all major payment gateways supported out of the box.</p>
      </div>
      <div class="card">
        <div class="card-icon">🌐</div>
        <h3>EN / BN UI</h3>
        <p>Full bilingual interface — switch between English and বাংলা at any time without reload.</p>
      </div>
      <div class="card">
        <div class="card-icon">📱</div>
        <h3>Flutter Mobile</h3>
        <p>Native Android/iOS shell wrapping the web SPA — haptics, secure storage, offline splash.</p>
      </div>
      <div class="card">
        <div class="card-icon">🔒</div>
        <h3>Halal First</h3>
        <p>No interest-product or riba framing. Default budget template follows halal finance principles.</p>
      </div>
      <div class="card">
        <div class="card-icon">⚡</div>
        <h3>Dual Database</h3>
        <p>Run on MySQL (cPanel/shared hosting) or MongoDB. Switch with a single env variable.</p>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">API Base</h2>
    <div class="api-box">
      <span class="label">Base URL &nbsp;</span>${env.NODE_ENV === 'production' ? `https://robin.adovasoft.com${API_V1}` : `http://localhost:5000${API_V1}`}<br/>
      <span class="label">Health &nbsp;&nbsp;&nbsp;</span><a href="${API_V1}/health" style="color:#a8e6b8">${API_V1}/health</a><br/>
      <span class="label">Auth &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>${API_V1}/auth/login  |  /register  |  /google
    </div>
    <br/>
    <div style="text-align:center">
      <span class="pill">✅ MySQL</span>
      <span class="pill">✅ MongoDB</span>
      <span class="pill">✅ JWT Auth</span>
      <span class="pill">✅ Google OAuth</span>
      <span class="pill">✅ SSLCommerz</span>
      <span class="pill">✅ Rate Limiting</span>
    </div>
  </div>

  <div class="footer">
    Abmiti API &mdash; Built with Express + TypeScript &mdash;
    <a href="${fe}">Web App</a> &middot;
    <a href="${API_V1}/health">Status</a>
  </div>
</body>
</html>`);
  });

  // ── Health ────────────────────────────────────────────────────
  app.get('/health', (_, res) => res.json({ status: 'ok', service: 'abmiti-api' }));
  app.get(`${API_V1}/health`, (_, res) => res.json({ status: 'ok', service: 'abmiti-api' }));
  app.use(`${API_V1}/auth`, authRouter);
  app.use(`${API_V1}/entries`, entryRouter);
  app.use(`${API_V1}/categories`, categoryRouter);
  app.use(`${API_V1}/summary`, summaryRouter);
  app.use(`${API_V1}/accounts`, accountRouter);
  app.use(`${API_V1}/budgets`, budgetRouter);
  app.use(`${API_V1}`, adminRouter);
};

