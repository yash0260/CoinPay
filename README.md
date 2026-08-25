# CoinPay — Credit Card Bill Payments & Rewards Dashboard

A consumer app for paying credit-card bills, earning reward coins on payments, and analyzing spending. Built as an assignment for **Digital Alpha Technologies**.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Vanilla CSS with design tokens (no component libraries for the table) |
| **Charts** | Recharts |
| **Backend** | Python, FastAPI |
| **Database** | PostgreSQL 16+ |
| **ORM** | SQLAlchemy 2.0 |

## ✅ What's Done

### Core (all complete)
- [x] **Hand-built transaction table** on full 10k rows with server-side pagination, sorting, and filtering
- [x] **Both spend charts**: Category breakdown (pie/donut) and Monthly trend (bar chart)
- [x] **One-way chart-to-table filtering** (click a pie slice → filters table)
- [x] **Two-way cross-filtering** between charts and table filters
- [x] **Rewards system**: visible coin balance, catalogue of 5 rewards, working redeem flow
- [x] **Backend validation**: rejects invalid/unaffordable redemptions with proper status codes
- [x] **PostgreSQL** with designed schema and one-command seed
- [x] **Optimistic balance update** with clean rollback on failed redeem
- [x] **Hand-built modal** with focus trap, Escape to close, click outside to close

### Frontend Highlights
- [x] Design token system (CSS custom properties)
- [x] Reusable component library (Button, Badge, Modal, Spinner, Card)
- [x] Sticky table header, hover/focus states, sort indicators
- [x] Loading skeleton, empty state, error state with retry
- [x] Responsive layout down to 360px
- [x] Debounced merchant search
- [x] Multi-select filter dropdowns with active filter chips
- [x] Transaction detail drawer with full info
- [x] Staggered animations, smooth transitions
- [x] Glassmorphism header, gradient accents

### Backend Highlights
- [x] Server-side pagination, filtering, sorting (not shipping all 10k to browser)
- [x] Proper separation: routes → services → data access
- [x] Analytics aggregation endpoints (category, monthly)
- [x] Pessimistic locking on redemption for race condition safety
- [x] Proper error codes: 400 (insufficient), 404 (not found), 500 (failed)

### Data Quality Handling
- [x] 3 timestamp formats normalized (ISO, epoch ms, date-only)
- [x] Timezone-aware parsing (+05:30 offsets)
- [x] Null/missing categories → "Uncategorized"
- [x] String amounts cast to numeric
- [x] Negative amounts treated as refunds (excluded from coin calc)
- [x] Duplicate IDs handled with auto-increment PK
- [x] Outlier amounts capped in coin calculation

## ❌ Not Done / Known Issues
- [ ] Deployment to cloud (Vercel + Render + Neon)
- [ ] Automated tests
- [ ] Accessibility audit (basic a11y is in place)
- [ ] Dark/light theme toggle

## 🚀 Local Setup (Under 5 Minutes)

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 16+ running locally

### 1. Clone the repo
```bash
git clone <repo-url>
cd coinpay
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Create the database
psql -U postgres -c "CREATE DATABASE coinpay;"

# Copy and edit .env if needed
cp .env.example .env
# Edit DATABASE_URL if your Postgres credentials differ

# Seed the database (creates schema + loads all 10k transactions)
python seed.py
```

### 3. Start the Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 5. Open the app
Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure
```
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── config.py        # Environment config
│   │   ├── database.py      # SQLAlchemy session
│   │   ├── models.py        # ORM models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── routes/          # API endpoints
│   │   └── services/        # Business logic
│   ├── seed.py              # DB schema + data seed
│   ├── transactions.json    # Dataset (10k records)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API client, utilities
│   │   └── styles/          # CSS (tokens, globals, components)
│   └── .env.local
├── ASSUMPTIONS.md
├── DECISIONS.md
├── AI-USAGE.md
└── README.md
```

## 🔗 Live URLs
- Frontend: _Not yet deployed_
- Backend API: _Not yet deployed_
- Demo Video: _Link to be added_
