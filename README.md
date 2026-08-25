# CoinPay — Credit Card Bill Payments & Rewards Dashboard

A modern, full-stack consumer application for managing credit card bill payments, earning reward coins, and analyzing spending behavior. This project was developed as a Software Engineering hiring assignment for **Digital Alpha Technologies**.

## 🔗 Live Links
- **Frontend (Live Demo)**: [https://coin-pay-zeta.vercel.app](https://coin-pay-zeta.vercel.app)
- **Backend API**: Deployed on Render

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Vanilla CSS with Design Tokens (No component libraries used) |
| **Data Visualization** | Recharts |
| **Backend** | Python, FastAPI |
| **Database** | SQLite (Local) / PostgreSQL (Production) |
| **ORM** | SQLAlchemy 2.0 |

---

## ✨ Key Features

### Frontend Experience
- **Custom UI Components**: Fully hand-built reusable component library (Modals, Buttons, Badges, Spinners) built from scratch without external component libraries like Material UI or Tailwind.
- **Advanced Data Table**: A highly performant transaction table handling 10,000+ records via server-side pagination, sorting, and debounced filtering.
- **Interactive Analytics**: Dynamic spending breakdown charts (Category Pie Chart, Monthly Trend Bar Chart).
- **Cross-Filtering**: Two-way interactive filtering between charts and the data table (e.g., clicking a pie chart category filters the table).
- **Modern Aesthetics**: Glassmorphism elements, CSS-variable based design token system, staggered animations, and fully responsive layout (down to 360px).

### Backend Architecture
- **Performant API**: FastAPI endpoints optimized for fast data retrieval with server-side pagination and filtering to prevent large payloads.
- **Robust Rewards Engine**: A transactional rewards system with pessimistic database locking to prevent race conditions during coin redemption.
- **Data Integrity**: Advanced ETL processing that normalizes mixed timestamp formats, handles timezones appropriately, and sanitizes unstructured category and currency data.
- **Clean Architecture**: Strong separation of concerns across API routing, business logic services, and data access layers.

---

## 🚀 Local Setup (Under 3 Minutes)

The project is designed to be completely plug-and-play locally using SQLite.

### Prerequisites
- Node.js 18+
- Python 3.12+

### 1. Clone the Repository
```bash
git clone https://github.com/yash0260/CoinPay.git
cd CoinPay
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# Seed the database (processes and loads 10,000 records into SQLite)
python seed.py

# Start the server
uvicorn app.main:app --reload --port 8000
```
The API will be available at `http://localhost:8000/docs` (Swagger UI).

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Visit **[http://localhost:3000](http://localhost:3000)** to view the application.

---

## 📁 Project Structure

```text
CoinPay/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application entry point
│   │   ├── config.py        # Environment configuration
│   │   ├── database.py      # SQLAlchemy engine and session management
│   │   ├── models.py        # Relational database models
│   │   ├── schemas.py       # Pydantic validation schemas
│   │   ├── routes/          # API endpoints (Controllers)
│   │   └── services/        # Business logic and database operations
│   ├── seed.py              # Data processing and seeding script
│   └── transactions.json    # Raw dataset (10k records)
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks for state and data fetching
│   │   ├── lib/             # API client and utility functions
│   │   └── styles/          # Vanilla CSS architecture (tokens, globals, modules)
├── ASSUMPTIONS.md           # Business logic and technical assumptions
├── DECISIONS.md             # Architecture and design decisions
└── README.md                # Project documentation
```

---

*Note: For deeper insights into the technical architecture and choices made during development, please refer to [DECISIONS.md](./DECISIONS.md) and [ASSUMPTIONS.md](./ASSUMPTIONS.md).*
