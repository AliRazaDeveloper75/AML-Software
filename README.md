# Al Merak AML — UAE Compliance Platform

> Enterprise Anti-Money Laundering (AML) and KYC compliance software built for UAE banks, fintechs, and regulated entities. CBUAE compliant · FATF aligned · UAE AML Law No. 20/2018.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [How to Run](#how-to-run)
- [Environment Variables](#environment-variables)
- [Platform Workflow Logic](#platform-workflow-logic)
- [API Integrations](#api-integrations)
- [User Roles & Permissions](#user-roles--permissions)
- [AML Screening Logic](#aml-screening-logic)
- [Risk Scoring Logic](#risk-scoring-logic)
- [Transaction Monitoring Rules](#transaction-monitoring-rules)

---

## Overview

Al Merak AML is a full-stack SaaS compliance platform that automates the entire AML/KYC workflow for UAE-regulated businesses. It handles customer onboarding, identity verification, AML screening, risk assessment, compliance review, transaction monitoring, and regulatory reporting — all in one platform.

**Compliance Standard:** UAE Federal Decree-Law No. 20 of 2018 on AML/CFT  
**Regulatory Body:** CBUAE (Central Bank of the UAE)  
**Reporting:** UAE goAML (FIU submission)

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python 3.11 | Core language |
| Django 6 | Web framework |
| Django REST Framework | REST API |
| PostgreSQL | Primary database |
| Redis | Caching + task broker |
| Celery | Background tasks (screening, emails) |
| Django Channels | WebSocket real-time alerts |
| JWT (SimpleJWT) | Authentication |
| Azure Blob Storage | KYC document storage (UAE North) |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| TanStack Query | Server state management |
| React Router v6 | Navigation |
| Framer Motion | Animations |
| Recharts | Charts and graphs |
| Lucide React | Icons |

---

## Features

### KYC Management
- Add individual and corporate customers
- Emirates ID, Passport, Trade License upload
- OCR document scanning via Sumsub
- Face verification and liveness detection
- Workflow stepper: Documents → Screening → Compliance → Decision
- Approve / Reject / Suspend customers
- Customer status report (Safe / Caution / Do Not Proceed)

### AML Screening
- Real-time screening via ComplyAdvantage API
- Local fallback engine (OFAC, UN, EU, HM Treasury watchlists)
- PEP (Politically Exposed Person) checks
- Adverse media monitoring
- Fuzzy name matching with rapidfuzz
- Automatic re-screening for high-risk customers (monthly)

### Risk Scoring
- Automatic risk score at customer creation (0–100)
- Re-scored after every AML screening
- Factors: nationality, PEP, industry, sanctions, documents, source of funds
- Risk levels: Low / Medium / High / Critical

### Transaction Monitoring
- 8 pre-built AML rules (R001–R008)
- Real-time rule evaluation on every transaction
- Custom rule builder
- Alert generation with severity levels
- Live dashboard with 30-second auto-refresh

### Compliance Review
- AML alert management (Open / Under Review / Escalated / Closed)
- False positive marking
- SAR (Suspicious Activity Report) reference tracking
- Alert assignment to compliance officers
- WebSocket real-time notifications

### Accounting
- Invoices, Expenses, Transactions
- Profit & Loss, Balance Sheet
- VAT Returns (UAE FTA compliant)
- Corporate Tax calculations
- VAT filing deadline reminders

### Admin Panel
- Platform-level organization management
- User management with permanent delete
- Billing and subscription management
- Multi-tenant architecture

### Notifications
- Branded HTML email templates
- OTP verification, Password reset
- KYC status updates
- VAT deadline reminders
- User invitations with temp passwords

---

## Project Structure

```
Al Merak AML Software/
│
├── backend/                          # Django backend
│   ├── apps/
│   │   ├── authentication/           # Login, Register, OTP, 2FA, JWT
│   │   ├── users/                    # User model, roles, permissions
│   │   ├── tenants/                  # Organizations, multi-tenancy
│   │   ├── kyc/                      # Customer, Documents, UBOs
│   │   ├── aml/                      # Alerts, Screenings, Watchlists
│   │   ├── monitoring/               # Transaction rules & alerts
│   │   ├── accounting/               # Invoices, Transactions, P&L
│   │   ├── tax/                      # VAT, Corporate Tax
│   │   ├── reports/                  # Report generation
│   │   ├── billing/                  # Stripe subscriptions
│   │   ├── notifications/            # Email/SMS notifications
│   │   └── audit/                    # Audit trail logs
│   │
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py               # Shared settings
│   │   │   ├── development.py        # Dev settings
│   │   │   └── production.py         # Production settings
│   │   └── urls.py                   # Main URL router
│   │
│   ├── core/
│   │   ├── mixins.py                 # TenantQuerysetMixin, etc.
│   │   ├── permissions.py            # Custom DRF permissions
│   │   ├── exceptions.py             # Custom exceptions
│   │   └── admin_views.py            # Platform admin views
│   │
│   ├── services/
│   │   ├── aml_engine/
│   │   │   ├── sanctions.py          # Local sanctions screening engine
│   │   │   ├── pep.py                # PEP screening engine
│   │   │   ├── adverse_media.py      # News API adverse media
│   │   │   ├── risk_scorer.py        # Risk calculation engine
│   │   │   └── rule_engine.py        # Transaction rule engine
│   │   ├── external/
│   │   │   ├── complyadvantage.py    # ComplyAdvantage API client
│   │   │   ├── sumsub.py             # Sumsub KYC API client
│   │   │   ├── seon.py               # SEON fraud detection client
│   │   │   ├── azure_storage.py      # Azure Blob document storage
│   │   │   └── stripe_client.py      # Stripe billing client
│   │   ├── tax_engine/
│   │   │   ├── vat.py                # UAE VAT calculation engine
│   │   │   └── corporate_tax.py      # Corporate tax engine
│   │   └── report_generator/
│   │       ├── pdf.py                # PDF report generation
│   │       └── aml.py                # AML report builder
│   │
│   ├── tasks/
│   │   ├── aml_tasks.py              # Screening, watchlist refresh
│   │   └── notification_tasks.py     # Email/SMS async tasks
│   │
│   ├── templates/
│   │   └── email/                    # HTML email templates
│   │       ├── base.html
│   │       ├── otp_verify.html
│   │       ├── password_reset.html
│   │       ├── user_invitation.html
│   │       ├── kyc_notification.html
│   │       └── vat_reminder.html
│   │
│   ├── .env.example                  # Environment variable template
│   ├── requirements.txt              # Python dependencies
│   └── manage.py
│
├── frontend/                         # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/                 # Login, Register, OTP, 2FA
│   │   │   ├── kyc/                  # CustomerList, CustomerDetail, AddCustomer
│   │   │   ├── aml/                  # AMLScreening, AlertsTable, Watchlist
│   │   │   ├── monitoring/           # TransactionMonitoring
│   │   │   ├── accounting/           # Invoices, VAT, Tax, P&L
│   │   │   ├── reports/              # Reports
│   │   │   ├── users/                # UserManagement
│   │   │   ├── admin/                # AdminDashboard, AdminUsers, AdminOrgs
│   │   │   ├── site/                 # Home, Features, Pricing, About
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Billing.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── common/               # Button, Card, Badge, Modal, Table
│   │   │   ├── layout/               # Layout, Sidebar, PageHeader
│   │   │   ├── admin/                # AdminLayout, AdminRoute
│   │   │   └── site/                 # SiteLayout, Navbar, Footer
│   │   │
│   │   ├── hooks/                    # TanStack Query hooks
│   │   │   ├── useKYC.js
│   │   │   ├── useAML.js
│   │   │   ├── useMonitoring.js
│   │   │   ├── useAccounting.js
│   │   │   ├── useTax.js
│   │   │   ├── useReports.js
│   │   │   └── useBilling.js
│   │   │
│   │   ├── services/                 # Axios API service layer
│   │   │   └── kycService.js
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # JWT auth state
│   │   │   └── ThemeContext.jsx      # Light/dark mode
│   │   │
│   │   ├── lib/
│   │   │   ├── api.js                # Axios instance + interceptors
│   │   │   └── queryClient.js        # TanStack Query config
│   │   │
│   │   └── utils/
│   │       └── helpers.js            # formatDate, formatCurrency, etc.
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## How to Run

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

---

### Backend Setup

```bash
# 1. Navigate to backend
cd "d:\Al Merak\AML Software\backend"

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Copy environment file
copy .env.example .env
# Fill in your values in .env

# 6. Run database migrations
python manage.py migrate

# 7. Create superuser (platform admin)
python manage.py createsuperuser

# 8. Load initial watchlist data (optional)
python manage.py loaddata fixtures/watchlists.json

# 9. Start Django server
python manage.py runserver
```

Backend runs at: `http://localhost:8000`  
API docs at: `http://localhost:8000/api/docs/`

---

### Celery Workers (Background Tasks)

Open two separate terminals:

```bash
# Terminal 1 — Celery worker
cd backend
venv\Scripts\activate
celery -A config worker --loglevel=info

# Terminal 2 — Celery beat scheduler
cd backend
venv\Scripts\activate
celery -A config beat --loglevel=info
```

---

### Frontend Setup

```bash
# 1. Navigate to frontend
cd "d:\Al Merak\AML Software\frontend"

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

### Full Stack — Run All Together

```
Terminal 1:  python manage.py runserver        (Django API)
Terminal 2:  celery -A config worker           (Background jobs)
Terminal 3:  celery -A config beat             (Scheduled tasks)
Terminal 4:  npm run dev                       (React frontend)
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
# Django
SECRET_KEY=your-50-char-secret-key
DEBUG=True
DATABASE_URL=postgres://user:password@localhost:5432/almerak_db

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1

# Email (Gmail SMTP for dev)
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Azure Storage
AZURE_ACCOUNT_NAME=your-storage-account
AZURE_ACCOUNT_KEY=your-storage-key

# Sumsub (KYC)
SUMSUB_APP_TOKEN=sbx:your-token
SUMSUB_SECRET_KEY=your-secret
SUMSUB_LEVEL_NAME=basic-kyc-level

# ComplyAdvantage (AML)
COMPLYADVANTAGE_API_KEY=your-key

# SEON (Fraud)
SEON_API_KEY=your-key

# Stripe (Billing)
STRIPE_SECRET_KEY=sk_live_xxxx

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## Platform Workflow Logic

```
1. Company Registration
   └── Organization created → Owner account created → Email OTP verified

2. Add Customer
   └── Risk score auto-calculated on creation
   └── Factors: nationality, industry, PEP flag, source of funds

3. Upload Documents
   └── Emirates ID / Passport / Trade License uploaded to Azure Blob
   └── OR Sumsub Identity Verify → OCR + face match + liveness

4. AML Screening
   └── ComplyAdvantage API (if configured) → real-time global database
   └── Fallback → local sanctions engine (OFAC, UN, EU, HM Treasury)
   └── PEP check → adverse media check
   └── SEON fraud score checked (email + phone + IP)
   └── Risk score recalculated
   └── AML alerts created if matches found

5. Compliance Review
   └── Open alerts must be reviewed before approval
   └── False positive → resolved
   └── Confirmed match → SAR filed

6. Final Decision
   └── Approve → kyc_status = verified → monitoring begins
   └── Reject → kyc_status = rejected → reason stored
   └── Suspend → kyc_status = suspended → customer restricted

7. Transaction Monitoring
   └── Every transaction evaluated against 8 AML rules
   └── Alerts generated if rules fire
   └── Compliance officer notified in real-time via WebSocket

8. Reporting
   └── AML status reports generated per customer
   └── STR/SAR submitted to UAE goAML
```

---

## API Integrations

| Service | Purpose | Status |
|---|---|---|
| Sumsub | KYC · Emirates ID · Face verification | Integrated (needs API key) |
| ComplyAdvantage | AML screening · PEP · Sanctions | Integrated (needs API key) |
| SEON | Fraud detection · Email · IP risk | Integrated (needs API key) |
| Azure Blob | Document storage | Integrated |
| SendGrid / Gmail | Transactional emails | Integrated |
| Stripe | Subscription billing | Integrated |
| Twilio | SMS OTP | Integrated |
| UAE goAML | STR/SAR reporting | Registration required |
| Dubai DED | Trade license verification | Planned |

---

## User Roles & Permissions

| Role | Permissions |
|---|---|
| **Owner** | Full access to all features |
| **Compliance Officer** | KYC approve/reject, AML alerts, reports |
| **Analyst** | View customers, run screenings, view alerts |
| **Viewer** | Read-only access |
| **Platform Admin** | Cross-organization admin panel (is_staff=True) |

---

## AML Screening Logic

```python
screen_customer(customer_id):

  1. ComplyAdvantage API search (if key configured)
     └── Returns: is_sanctioned, is_pep, adverse_media, hits[]
     └── On match → screening_status = 'match'
     └── On partial → screening_status = 'potential_match'

  2. Fallback: Local sanctions engine
     └── OFAC SDN list (daily refresh)
     └── UN Security Council list (weekly refresh)
     └── EU Consolidated list
     └── HM Treasury list
     └── UAE local terrorist list
     └── Fuzzy matching: 92+ score = match, 78+ = potential match

  3. SEON fraud check
     └── Email + phone risk score
     └── Score >= 75 → fraud_risk AML alert created

  4. Risk re-scored with updated flags

  5. AML alert created if match found
     └── Severity: critical (match) / high (potential match)

  6. WebSocket notification → compliance officer
```

---

## Risk Scoring Logic

```
Score = 0 to 100 (calculated at creation + after every screening)

Factors:
  +50  Nationality from FATF grey/black list country
  +40  PEP (Politically Exposed Person)
  +30  UBO is a PEP (corporate customers)
  +50  Sanctions match
  +20  High-risk industry (crypto, gambling, weapons, shell companies)
  +15  No documents uploaded
  +10  No source of funds declared
  +10  Expected turnover > AED 10,000,000
  +10  Adverse media found

Risk Levels:
   0 – 29   → Low
  30 – 59   → Medium
  60 – 79   → High
  80 – 100  → Critical
```

---

## Transaction Monitoring Rules

| Rule | Description | Threshold |
|---|---|---|
| R001 | Cash transaction reporting | >= AED 55,000 |
| R002 | Large single transaction | >= AED 100,000 |
| R003 | Structuring detection | 3+ transactions < AED 40,000 in 24h |
| R004 | FATF high-risk country | Any transaction with grey/black list country |
| R005 | PEP customer transaction | Any transaction by PEP customer |
| R006 | Sanctioned customer transaction | Any transaction by sanctioned customer |
| R007 | Round amount suspicion | Round amount >= AED 50,000 |
| R008 | High velocity | 10+ transactions in 1 hour |

---

## Scheduled Tasks (Celery Beat)

| Task | Schedule | Purpose |
|---|---|---|
| `refresh_ofac_watchlist` | Daily 2:00 AM UTC | Sync OFAC SDN list |
| `refresh_un_watchlist` | Weekly Sunday 3:00 AM | Sync UN sanctions list |
| `reschedule_periodic_screening` | Monthly 1st | Re-screen high/critical risk customers |
| `send_vat_reminders` | Daily | Send VAT deadline reminders (14 days before) |

---

## API Endpoints Summary

```
Authentication
  POST   /api/v1/auth/register/
  POST   /api/v1/auth/login/
  POST   /api/v1/auth/logout/
  POST   /api/v1/auth/token/refresh/
  POST   /api/v1/auth/otp/verify/
  POST   /api/v1/auth/password/reset/

KYC
  GET    /api/v1/kyc/customers/
  POST   /api/v1/kyc/customers/
  GET    /api/v1/kyc/customers/{id}/
  POST   /api/v1/kyc/customers/{id}/screen/
  POST   /api/v1/kyc/customers/{id}/approve/
  POST   /api/v1/kyc/customers/{id}/reject/
  POST   /api/v1/kyc/customers/{id}/suspend/
  GET    /api/v1/kyc/customers/{id}/sumsub-link/
  POST   /api/v1/kyc/documents/

AML
  GET    /api/v1/aml/alerts/
  POST   /api/v1/aml/alerts/{id}/resolve/
  POST   /api/v1/aml/alerts/{id}/assign/
  GET    /api/v1/aml/alerts/summary/
  GET    /api/v1/aml/screenings/
  GET    /api/v1/aml/watchlists/

Monitoring
  GET    /api/v1/monitoring/rules/
  POST   /api/v1/monitoring/rules/{id}/toggle/
  GET    /api/v1/monitoring/alerts/
  POST   /api/v1/monitoring/alerts/{id}/review/

Accounting
  GET    /api/v1/accounting/invoices/
  GET    /api/v1/accounting/transactions/
  GET    /api/v1/accounting/profit-loss/
  GET    /api/v1/accounting/balance-sheet/

Tax
  GET    /api/v1/tax/vat-returns/
  GET    /api/v1/tax/corporate-tax/

Webhooks
  POST   /webhooks/sumsub/

Platform Admin
  GET    /api/v1/platform-admin/stats/
  GET    /api/v1/platform-admin/organizations/
  GET    /api/v1/platform-admin/users/
  DELETE /api/v1/platform-admin/users/{id}/
```

---

## License

Private & Confidential — Al Merak AML Platform  
© 2026 Anaya Star. All rights reserved.

---

## Contact

**Developer:** Ali Raza  
**Company:** Anaya Star  
**Email:** alirazadeveloper75@gmail.com  
**Platform:** Al Merak AML — UAE Compliance Software
