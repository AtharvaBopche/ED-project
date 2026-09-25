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

To create sample data, run `npm run seed`. Demo login:

- Email: `demo@stockpilot.local`
- Password: `StockPilotDemo!`

Sample seeding is optional. You can also register a new business from the landing page. The demo password is for local evaluation only; change it before sharing a deployment.

## Production build

- `npm run build` creates the frontend bundle in `dist/`.
- `npm start` serves the production frontend and API from port 3001 after a build.
- For local development, use `npm run dev` so Vite serves the frontend and proxies API requests.

## Deploy with Vercel and Render

The frontend is deployed to Vercel and the Express API to Render. Set each project's root directory to this `stockpilot` folder (or `outputs/stockpilot` if your repository includes its parent folder). The included `vercel.json` configures pnpm installation, the Vite build, and `dist` output.

1. Push this folder to a GitHub repository.
2. On Render, create a **Web Service** from that repository. Set its root directory to this folder, build command to `pnpm install --frozen-lockfile`, and start command to `pnpm start`. Add `JWT_SECRET` using Render's generated secret option. Set `DB_PATH` to `/var/data/stockpilot.sqlite` and attach a persistent disk mounted at `/var/data`. Render free web services have ephemeral filesystems, so SQLite records can be lost on restart without a persistent disk.
3. After Render deploys, copy its service URL. Set Render's `CLIENT_ORIGIN` to the Vercel site URL after Vercel deploys.
4. On Vercel, import the same repository and set the project root directory to this folder. Add `VITE_API_URL` with the Render service URL (no trailing slash), then deploy or redeploy.
5. Set Render's `CLIENT_ORIGIN` to the final Vercel production URL and redeploy Render. Register a new business account on the live site; local demo data is not automatically deployed.

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
