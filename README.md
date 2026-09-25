# StockPilot

StockPilot is a full-stack prototype for independent retailers. It includes a public product site, business registration and login, a private retailer workspace, SQLite persistence, checkout and purchasing flows, and a deterministic recommendation engine based on the business's saved records. The server uses `sql.js` (SQLite compiled to WebAssembly) to avoid native compiler setup; it saves the database as a standard SQLite file.

The recommendation engine uses transparent rules. It is not a generative AI model. Recommendations are guidance; the retailer makes the final decision.

## Requirements

- Node.js 20 or newer
- pnpm 10 (`npx pnpm@10` also works)

## Run locally

1. Open a terminal in this folder.
2. Install packages with `pnpm install` (or `npx pnpm@10 install`).
3. Copy `.env.example` to `.env` and set a private random `JWT_SECRET` for your environment.
4. Start the backend and frontend with `pnpm dev` (or `npx pnpm@10 dev`).
5. Open `http://localhost:5173`.

The Express API listens on port 3001. Vite forwards `/api` requests to it. The SQLite database is created at `data/stockpilot.sqlite` when the API starts.

To create sample data locally, run `pnpm seed`. Demo login:

- Email: `demo@stockpilot.local`
- Password: `StockPilotDemo!`

Sample seeding is optional. You can also register a new business from the landing page. The demo password is for local evaluation only; change it before sharing a deployment.

## Production build

- `pnpm build` creates the frontend bundle in `dist/`.
- `pnpm start` serves the production frontend and API from port 3001 after a build.
- For local development, use `pnpm dev` so Vite serves the frontend and proxies API requests.

## Deploy on Render

Render can serve both the frontend and Express API from one web service. The included `vercel.json` is optional if you are only deploying on Render.

1. Create a Render **Web Service** from the GitHub repository. Set the build command to `pnpm install --frozen-lockfile && pnpm build` and the start command to `pnpm start`.
2. Set `NODE_ENV=production` and add a private random `JWT_SECRET` in Render's environment settings.
3. To automatically create demo data on a fresh database, set `SEED_DEMO=true`. The seed runs only if `demo@stockpilot.local` does not already exist. Sign in with `StockPilotDemo!` as its password.
4. For persistent SQLite records, set `DB_PATH=/var/data/stockpilot.sqlite` and attach a persistent disk mounted at `/var/data`. Render free web services have ephemeral filesystems, so data can be lost on restart without a disk.

Use persistent storage before entering real business records. This SQLite prototype is not intended for multi-instance scaling or production-critical financial records.

## What works

- Business registration and login with bcrypt password hashes and signed, expiring JWTs.
- Business-scoped data queries for products, parties, sales, purchases, and recommendations.
- Product creation, archive, search, and inventory fields for SKU, barcode, brand, GST, supplier, batch, and expiry.
- POS cart with quantity controls, discount, tax, customer, and payment method. Checkout is atomic, records sale items, and reduces stock.
- Purchase entry increases stock and records inventory movements.
- Manual inventory adjustments, movement history, sales receipt printing, operational dashboard, reports, suppliers, customers, and employee list.
- Light/dark theme preference saved in local storage.
- Responsive public landing page and workspace layouts.
- 60-day starter period metadata created when a business registers.

## Current prototype limits

This is a local prototype, not a production-ready hosted ERP. Team invitations, granular employee permissions, password reset, GST filing, online payments, barcode scanning, multi-location stock, full purchase-order lifecycle, subscription enforcement, and cloud deployment are not implemented. The employee screen shows the account owner and explains the current limit. There is no real payment processing. Do not use the demo account for sensitive business information.

## Project structure

```text
stockpilot/
├── index.html
├── package.json
├── vite.config.js
├── server/
│   ├── aiService.js
│   ├── database.js
│   ├── index.js
│   ├── schema.sql
│   └── seed.js
└── src/
    ├── main.jsx
    └── style.css
```

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/dashboard`
- `GET/POST/PUT/DELETE /api/products`
- `POST /api/inventory/adjust`, `GET /api/inventory/movements`
- `GET/POST/PUT /api/parties?kind=customer|supplier`
- `GET/POST /api/sales`, `GET /api/sales/:id`
- `GET/POST /api/purchases`
- `GET /api/ai/insights`
- `GET /api/employees`, `PUT /api/business`

All workspace endpoints require a bearer token and constrain records to the authenticated business.
