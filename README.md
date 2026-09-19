# 💜 FinanceBuddy

**A budgeting app that locks your emergency fund behind a real approval — not just a suggestion.**

FinanceBuddy is a family finance platform that enforces strict rules around money management instead of merely suggesting them. A user's income (allowance or salary) is automatically split into three buckets — **Everyday Spending**, **Emergency Fund**, and **Savings Goals** — following a plan recommended by an AI Financial Assistant based on their income. Everyday spending is freely usable. The Emergency Fund and Savings are **locked**: releasing money requires the user to submit a request (amount, category, reason), have their parent/guardian approve or reject it, and — once approved — upload a bill or receipt as proof of spend. Any unspent amount is flagged for return before the request can be closed.

## 🚩 Why

In India, an estimated 70% of people only start saving once they have a job, leaving them exposed to financial strain the moment an emergency or new responsibility hits. FinanceBuddy exists to build the habit earlier: it helps students and teenagers start managing and saving money while parents keep visibility into how it's spent.

The core insight: in most budgeting apps, the "emergency fund" is the first thing people raid for non-emergencies. Adding a **human approval step** and a **proof-of-spend requirement** keeps that money reserved for what it was actually meant for.

---

## ✨ Features

- **Automatic 3-way allocation** — every deposit a parent funds is split 50% Everyday / 20% Emergency / 30% Savings
- **Approval-gated withdrawals** — children submit an amount + reason; parents approve or reject before funds move
- **Proof-of-spend loop** — approved requests expect a bill/receipt upload, with unspent balances flagged for return
- **Role-based accounts** — Parent and Child roles with separate views and permissions
- **Token-based sessions** — signed, expiring auth tokens (HMAC), no third-party auth service required
- **Persistent storage** — data survives restarts via a local SQLite database
- **Zero external dependencies** — runs on Node's built-in `http` and `node:sqlite` modules only
- **Full family experience** — dashboard, kids wallet, chores & allowance, savings goals, family activity/ledger, AI Financial Academy, and an Emergency Vault

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22.5+ (uses built-in `node:sqlite`) |
| Server | Native `node:http` — no Express, no framework |
| Database | SQLite (file-based, auto-created at `data/finance-buddy.sqlite`) |
| Auth | Custom HMAC-signed session tokens + `scrypt` password hashing |
| Frontend | Static HTML/CSS + `client.js` for API integration |
| Config | `.env.example` documents supported environment variables |

This project deliberately avoids external npm packages — everything needed (HTTP server, database, hashing, sessions) ships in Node.js itself.

---

## 📂 Project Structure

```
FinanceBuddy/
├── server.js              # HTTP server, REST API, and SQLite schema/logic
├── client.js              # Frontend integration layer, injected into every page
├── package.json           # npm scripts (start / dev)
├── .env.example           # Supported environment variables
├── data/                  # SQLite database (auto-created, gitignored)
└── public/                # Static frontend pages served as-is
    ├── lending.html
    ├── login.html / register.html
    ├── dashboard.html         # Parent view
    ├── kids.html / child.html  # Child wallet / purchase review
    ├── allownance.html          # Chores & allowance hub
    ├── savinggoals.html          # Family activity & approvals
    ├── savinggoals1.html          # Savings goals & milestones
    ├── learning.html              # AI Financial Academy
    ├── emergency.html              # Emergency Vault
    └── *.css
```

---

## 🚀 Run Locally

**Requirements:** Node.js **22.5+** (for built-in SQLite support)

```bash
git clone https://github.com/dhruvpatel09cg/Finance-Buddy.git
cd Finance-Buddy
npm start
```

Then open **[http://localhost:3000](http://localhost:3000)**.

For auto-restart on file changes during development:

```bash
npm run dev
```

On first run, the SQLite database is created automatically at `data/finance-buddy.sqlite` (excluded from Git). Copy `.env.example` to `.env` and set `SESSION_SECRET` to a long random value before deploying anywhere beyond localhost.

---

## 🧭 How to Use It

1. **Register** as a Parent or Child at `/register`
2. **Sign in** at `/login`
3. As a **Parent**: fund a child's wallet from `/dashboard` — the amount is auto-split 50/20/30 across Everyday/Emergency/Savings
4. As a **Child**: view your wallet at `/kids`, and raise a request from `/goals` or `/child` when you need to draw from Savings or Emergency
5. As a **Parent**: review pending requests from `/activity` and approve or reject
6. Explore chores (`/allowance`), lessons (`/learning`), and the locked reserve (`/emergency`)

---

## 🔌 API Overview

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a Parent or Child account |
| `POST` | `/api/auth/login` | Sign in and receive a session token |
| `GET` | `/api/me` | Get the current authenticated user |
| `GET` | `/api/dashboard` | Balances, pending approval, and goal progress |
| `POST` | `/api/funds` | *(Parent only)* Fund a wallet — auto-split 50/20/30 |
| `POST` | `/api/approvals` | *(Child only)* Request a withdrawal (amount + reason) |
| `POST` | `/api/approvals/:id/review` | *(Parent only)* Approve or reject a pending request |
| `POST` | `/api/events` | Log an in-app action (used by allowance/goal/academy/AI-plan screens) |

All authenticated routes expect an `Authorization: Bearer <token>` header, using the token returned by login/register.

### Page Routes
`/`, `/login`, `/register`, `/dashboard`, `/kids`, `/child`, `/allowance`, `/goals`, `/activity`, `/learning`, `/emergency`

---

## 🗺️ Roadmap

- [ ] File upload handling for bill/receipt proof-of-spend
- [ ] Automated flagging + refund flow for unspent approved amounts
- [ ] Real AI model integration for allocation recommendations (currently rule-based 50/20/30)
- [ ] Push/SMS notifications for approvals and declines
- [ ] Multi-child support per parent account

---

## 🏆 Built For

This project was built as a submission for **[Hackathon Name]**, under the **Fintech / Financial Literacy** track.

## 👥 Team

- Dhruv Patel — [GitHub](https://github.com/dhruvpatel09cg)
- Aditya Katariya
- Om Vaniya
- Kashyap Katariya

## 📄 License

Open source, available under the [MIT License](LICENSE).

---

<p align="center">Made with 💜 to help families build smarter money habits, together.</p>
