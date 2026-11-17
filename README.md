# FinTrack — Modern Personal Finance & Budget Management Application

FinTrack is a full-featured, responsive, production-ready personal finance and budget management web application built with **React 19**, **TypeScript**, **Tailwind CSS**, **FastAPI**, and **PostgreSQL** (with zero-configuration SQLite fallback for instant local execution).

It gives you a 360-degree command center over your wealth:
- **Total Balance**: Real-time aggregated liquidity across all your bank accounts, wallets, and cash reserves.
- **My Banks**: Dedicated manual bank manager with opening balances, transaction auditing, and balance reconciliation.
- **Money Sent (+ Outgoing)**: Easily record expenses that automatically deduct from the selected account with payee tracking.
- **Money Received (+ Incoming)**: Record salary, client earnings, refunds, and gifts that automatically credit the selected bank account.
- **Transfer Money**: Dedicated internal transfer ledger that reallocates funds between your accounts without distorting income or expense analytics.
- **People & Contacts**: Track net sent/received amounts with friends, roommates, and vendors with single-click settlement summaries.
- **Budget Management**: Monthly overall spending targets and category budgets with automatic 80% warning and exceeded alerts.
- **Financial Analytics & 10 Reports**: Monthly, daily, yearly, bank-wise, person-wise, category breakdown, and savings trend charts.
- **Data Export & Integrity**: Dual-entry balance audit ledger, reversal upon transaction deletion, and one-click Excel (.xlsx) / CSV exports.

---

## 🚀 Quick Start

### Option 1: One-Click Run (Local Development)

Double click `start-local.bat` or run:

```bash
# Terminal 1: Backend
cd backend
venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

Then visit:
- **Web Application**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

#### Pre-configured Demo Login:
- Click the **"One-Click Demo Account"** button on the login screen, or sign in with:
  - **Email**: `demo@example.com`
  - **Password**: `demo123456`

---

### Option 2: Docker Compose (PostgreSQL + FastAPI + React/Nginx)

```bash
docker compose up --build
```

- **Frontend Web App**: [http://localhost](http://localhost) (or [http://localhost:3000](http://localhost:3000))
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **PostgreSQL Database**: Port `5432`

---

## 🛠 Technology Stack

### Frontend
- **React 19 & TypeScript**: High-performance UI components with type safety.
- **Tailwind CSS v4**: Modern fintech dark theme with responsive layout.
- **Recharts**: Responsive financial charts (Area charts, Bar charts, Donut charts).
- **Lucide React**: Clean icons.
- **XLSX**: Native Excel `.xlsx` spreadsheet generation and export.

### Backend
- **Python FastAPI**: Asynchronous REST API framework with automatic OpenAPI docs.
- **SQLAlchemy 2.0 ORM**: Clean data modeling with transaction boundaries.
- **PostgreSQL / SQLite**: Configurable via `DATABASE_URL` (PostgreSQL in Docker, SQLite locally).
- **Pydantic v2**: Strict schema validation (amounts > 0, dates, email formats).
- **JWT & BCrypt**: Password hashing and token authentication.

---

## 📊 Application Modules

### 1. Main Dashboard
- **6 Key Stat Cards**: Total Balance, Total Income, Total Expenses, Net Savings (with savings rate), Number of Bank Accounts, Current Month Spending.
- **Overall Budget Meter**: Visual consumption meter with 80% warning and exceeded flags.
- **Interactive Charts**:
  - Daily spending and income trends (Area chart).
  - Expense breakdown by category (Donut chart).
  - Bank balance distribution across accounts.
- **Dynamic Smart Insights**:
  - *"Your highest expense category is Food & Dining (₹5,000.00)"*
  - *"You sent ₹15,000 to Rahul"*
  - *"Spending decreased by 12% vs last month"*
- **Global Timeframe Filter**: Today, Yesterday, Last 7 Days, This Month, Last Month, This Year, All Time.

### 2. My Banks & Accounts
- Add, edit, and deactivate accounts:
  - Savings Account
  - Current Account
  - Cash in Hand
  - Digital Wallets (Paytm, Amazon Pay, etc.)
- Automatic masked account numbers (e.g. `•••• 4892`).
- Opening balance vs Current balance tracking.
- Dedicated bank ledger view to audit all transactions linked to a specific bank.
- Balance audit tool to recalculate current balance from historical transactions.

### 3. Money Sent (+ Outgoing Transactions)
- Deducts amount from the selected bank account immediately.
- Autocomplete / select payee from Contacts or type a new payee name.
- Tag category (Food, Groceries, Rent, Electricity, Fuel, Shopping, etc.).
- Tag payment method (UPI, Net Banking, Debit Card, Credit Card, Cash, Cheque).
- Record UPI Reference / Txn ID for search and reconciliation.

### 4. Money Received (+ Incoming Transactions)
- Adds amount to the selected bank account immediately.
- Source tracking (Salary, Freelance, Business, Refunds, Gifts, Loans).
- Increases total income and liquidity.

### 5. Transfer Money Between Accounts
- Reallocates funds between two personal bank accounts (e.g., ₹10,000 from SBI to HDFC).
- Dual-entry linked transactions (`TRANSFER_OUT` and `TRANSFER_IN`).
- **Critical business rule**: Transfers do not count as income or expense in reports.
- Deleting or reversing a transfer restores both account balances cleanly.

### 6. People & Contacts
- Track payees and payers.
- Displays:
  - Total Money Sent to person.
  - Total Money Received from person.
  - Net Position: `"You Sent ₹7,000 more"` or `"Received ₹5,000 more"`.
- Drill-down transaction history by person.

### 7. Category Management
- Predefined Expense Categories: Food & Dining, Groceries, Shopping, Transportation, Fuel, Electricity, Internet & Mobile, Rent, Medical, Entertainment, Education, Travel, EMIs & Loans, Personal, Other.
- Predefined Income Categories: Salary, Freelancing, Business Income, Investments, Interest, Refunds, Gifts, Borrowed Money, Other.
- Custom categories with custom color badges.

### 8. Budget Management
- Overall monthly spending ceiling.
- Granular category budgets (e.g. Food: ₹5,000, Shopping: ₹8,000).
- Real-time remaining balance and % consumed.
- Visual alerts at 80% consumption and warning badge when exceeded (> 100%).

### 9. Transaction Management & Ledger
- Search by description, reference number, payee name, or notes.
- Multi-dimensional filters (Type, Bank, Category, Date range).
- Sort by amount or date.
- Modal transaction editing with balance recalculation.
- Deletion with balance reversal.
- Export to Excel (`.xlsx`) and CSV.

### 10. Financial Analytics & 10 Reports
1. **Daily Expense Report**: Day-by-day cash flow for the selected month.
2. **Weekly Expense Report**: Aggregated weekly spending patterns.
3. **Monthly Expense Report**: Month-by-month income, expense, and savings comparison for the year.
4. **Yearly Expense Report**: Multi-year macro financial trajectory.
5. **Bank-wise Report**: Complete audit of all inflows, outflows, and transfers per bank.
6. **Person-wise Sent Report**: Ranking of top payees.
7. **Person-wise Received Report**: Ranking of top income sources.
8. **Category-wise Expense Report**: Percentage and Rupee share of each spending category.
9. **Income vs Expense Report**: Net cash retention analysis.
10. **Savings & Growth Report**: Net savings trajectory and savings rate.

---

## 🔒 Security & Data Integrity

1. **No Real Banking Credentials**: Designed specifically for private manual tracking without requiring sensitive net banking passwords, OTPs, CVVs, or UPI PINs.
2. **Masked Identifiers**: Account numbers are masked (`•••• 1234`).
3. **Cryptographic Protection**: Passwords salted and hashed with BCrypt; authentication verified via JWT.
4. **Atomic Transactions**: All balance modifications execute within SQLAlchemy database transactions with rollback capability on error.
5. **Complete User Isolation**: All bank accounts, categories, budgets, and transactions are strictly scoped to the authenticated `user_id`.

---

## 📁 Project Structure

```
d:\personal\
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI application setup & CORS
│   │   ├── config.py                   # Pydantic settings & environment vars
│   │   ├── database.py                 # SQLAlchemy engine & session maker
│   │   ├── models.py                   # ORM models (User, Bank, Txn, Budget, etc.)
│   │   ├── schemas.py                  # Pydantic validation schemas
│   │   ├── auth.py                     # JWT token & BCrypt password hashing
│   │   ├── seed.py                     # Predefined categories & demo user seed
│   │   ├── routers/
│   │   │   ├── auth.py                 # /auth/register, /auth/login, /auth/me
│   │   │   ├── banks.py                # /banks/ CRUD, balances, ledger
│   │   │   ├── transactions.py         # /transactions/ CRUD, filters, CSV export
│   │   │   ├── transfers.py            # /transfers/ internal bank transfers
│   │   │   ├── people.py               # /people/ contacts & net sent/received
│   │   │   ├── categories.py           # /categories/ income & expense taxonomy
│   │   │   ├── budgets.py              # /budgets/ monthly limits & alerts
│   │   │   └── analytics.py            # /analytics/ dashboard metrics & 10 reports
│   │   └── services/
│   │       ├── balance_service.py      # Balance calculation & reversal engine
│   ├── requirements.txt
│   ├── Dockerfile
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── api/client.ts               # Axios API client
│   │   ├── components/
│   │   │   ├── Layout/                 # Sidebar, Header, Navigation
│   │   │   └── Modals/                 # AddBank, MoneySent, MoneyReceived, Transfer
│   │   ├── context/AuthContext.tsx     # JWT auth provider & demo login
│   │   ├── pages/                      # Dashboard, Banks, Transactions, etc.
│   │   ├── types/index.ts              # TypeScript interfaces
│   │   └── utils/format.ts             # INR Currency & Date formatting
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml                  # Full stack Postgres + FastAPI + React/Nginx
├── start-local.bat                     # Windows one-click local launcher
├── .env.example
└── README.md
```

---

## 📄 License
MIT License. Built for personal privacy, wealth tracking, and financial peace of mind.
