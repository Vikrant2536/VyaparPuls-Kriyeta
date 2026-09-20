# VyaparPulse — Smart Supermarket Ledger

> Instant Hinglish voice transactions, 7-day automated cashflow forecasting, and 1-click WhatsApp payment reminders, built for the neighborhood supermarket owner.

Built for **HACK IT BROS '26** (SlowBros Labs × PyData Indore) · **Track 2: FinTech & Local Commerce**

<!-- Add a hero screenshot: ![VyaparPulse](docs/screenshots/home.png) -->

---

## The problem

A neighborhood supermarket sells to 150–200 customers on credit (_udhaar_). The owner tracks it in a paper diary, an Excel sheet, or several billing tools. He knows who owes him money, but not:

- How much will actually come in **next week**?
- Which customers are overdue, and **who should I call first**?
- Where will I face a **cash shortage**?

## The solution

VyaparPulse turns a spoken or typed Hinglish sentence into a structured ledger entry, then converts the ledger into cash-flow insight and one-tap reminders.

> _"Sharma ji ne ₹2,400 ka saaman 7 din udhaar pe liya."_
> → customer, amount, credit days and due date are extracted, saved to the ledger, and the dashboard updates instantly.

**Example insight the app produces:** "₹1,87,200 expected in next 7 days; ₹1,52,400 overdue from 31 customers. Call Verma Ji first."

---

## Features

**Core**

- Fast transaction / invoice creation by voice or text
- Customer-wise ledger with running balance
- Udhaar (credit) and receivables tracking, including partial payments
- Due-date tracking with clear status: paid / due soon / overdue
- Payment reminder generation with a 1-click WhatsApp link
- Cash-flow view for the next 7 / 14 days
- Actionable daily insight ("who to call first")

**Extras**

- Hinglish voice entry (Web Speech API)
- Late-payment pattern detection per customer
- English / Hindi (हिन्दी) UI toggle
- Confirmation card with editable fields before anything is saved
- Fuzzy customer-name matching ("Sharma ji" ≈ "Sharma Ji")

**Design principle:** every number shown in the app is computed from the database. The LLM is only used to extract fields from text, never to calculate money.

---

## Demo flow (90 seconds)

1. Speak or type: _"Sharma ji ne ₹2,400 ka saaman 7 din udhaar pe liya."_
2. Review the parsed confirmation card and save.
3. The customer ledger updates and the due date is set.
4. The dashboard recalculates receivables and the 7-day inflow chart.
5. Tap **Send Reminder** to open a pre-filled WhatsApp message.

The app ships with seeded historical data so dashboards look realistic. New entries always run through the real pipeline (parse → confirm → save → recalculate).

---

## Screenshots

| Landing                                  | Home                               | Quick Entry                                      |
| ---------------------------------------- | ---------------------------------- | ------------------------------------------------ |
| ![Landing](docs/screenshots/landing.png) | ![Home](docs/screenshots/home.png) | ![Quick Entry](docs/screenshots/quick-entry.png) |

---

## Tech stack

| Layer     | Technology                                                               |
| --------- | ------------------------------------------------------------------------ |
| Frontend  | React, Vite, TypeScript, Tailwind CSS, Recharts, Framer Motion           |
| Backend   | Python, FastAPI, SQLAlchemy, Pydantic v2                                 |
| Database  | SQLite (schema is Postgres-portable)                                     |
| AI        | Configurable LLM for field extraction, with a rule-based fallback parser |
| Voice     | Browser Web Speech API (`hi-IN` / `en-IN`)                               |
| Reminders | WhatsApp click-to-chat (`wa.me`) links                                   |
| Tests     | pytest                                                                   |

---

## Architecture

```
Voice / Text input
        │
        ▼
  Parse API  ──►  LLM extraction  ──(on failure)──►  Rule-based fallback
        │
        ▼
 Confirmation card (user edits / approves)
        │
        ▼
  Save API  ──►  SQLite  ──►  FIFO payment allocation
        │
        ▼
 Dashboard · Ledger · Cash-flow · Insights · Reminders
```

---

## Getting started

### Prerequisites

- Node.js 18+
- Python 3.10+

### 1. Clone

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # add your LLM API key
python seed.py                   # load demo customers and transactions
uvicorn app.main:app --reload    # http://localhost:8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

### Environment variables

| Variable       | Description                                  |
| -------------- | -------------------------------------------- |
| `LLM_PROVIDER` | Which LLM provider to use for extraction     |
| `LLM_API_KEY`  | API key for the provider (never commit this) |
| `DATABASE_URL` | Defaults to a local SQLite file              |
| `VITE_API_URL` | Backend URL used by the frontend             |

If no API key is set, the app falls back to the rule-based parser so the core flow still works.

---

## API overview

| Method | Endpoint                        | Purpose                                   |
| ------ | ------------------------------- | ----------------------------------------- |
| POST   | `/api/transactions/parse`       | Text to structured fields (does not save) |
| POST   | `/api/transactions`             | Save a confirmed entry                    |
| POST   | `/api/payments`                 | Record a payment (allocated FIFO)         |
| GET    | `/api/customers`                | Customers with balance and status         |
| GET    | `/api/customers/{id}/ledger`    | Customer transaction timeline             |
| GET    | `/api/dashboard/summary`        | Total receivable, due this week, overdue  |
| GET    | `/api/insights/cashflow?days=7` | Expected inflow and insights              |
| POST   | `/api/reminders/generate`       | Reminder message and WhatsApp link        |

## Data model

- **customers**: id, name, phone, created_at
- **transactions**: id, customer_id, type (`credit_sale` / `payment`), amount, items_note, credit_days, txn_date, due_date, amount_settled, status
- **reminders**: id, customer_id, transaction_id, message, channel, created_at

---

## Project structure

```
.
├── backend/
│   ├── app/            # FastAPI app, models, services, routes
│   ├── tests/          # parsing, FIFO allocation, cash-flow tests
│   ├── seed.py         # demo data
│   └── .env.example
├── frontend/
│   ├── src/
│   └── public/
├── docs/
│   └── screenshots/
└── README.md
```

---

## Testing

```bash
cd backend
pytest
```

Covers Hinglish parsing edge cases, FIFO payment allocation, and cash-flow math.

## Roadmap

- Handwritten bill OCR
- Offline-first mode with background sync
- 14-day cash forecast with supplier payments
- Direct WhatsApp Business API integration

## Team

<!-- Replace with your team details -->

- **Vikrant** — [GitHub](https://github.com/<your-username>) · [LinkedIn](https://linkedin.com/in/<your-handle>)

## License

MIT — see [LICENSE](LICENSE).

---

_Built at HACK IT BROS '26 · Track 2: FinTech & Local Commerce_
