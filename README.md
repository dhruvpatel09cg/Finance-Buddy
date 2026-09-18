# Finance-Buddy
### Budgeting app with an approval-gated emergency fund and mandatory bill submission.

A personal finance web app that enforces strict rule for money management instead of just suggesting it. A user's monthly income is automatically divided in buckets like Daily expenses, Savings, Emergency funds or any other saving specified for any expense in future(Buying laptop, Buying car) according to the plan accepted by user from multiple suggestion given by AI Financial Assistant after analyzing pocket money or salary of user. The Daily expenses bucket is freely spendable, but the emergency fund and savings is locked: it can be accessed after permission of parent, the user raises a request stating the amount, category, and reason. Their manager/parent reviews and approves or rejects it, and funds are released only on approval. The user must then upload a bill or receipt as proof, and any unspent amount is flagged for return before the request can be closed.

In India this is a common mistake made by 70% of people that they only start savings only after they get job, suffers a financial burden after emergency or after the burden of responsibilities. By making this platform we want our youth to be aware of money managing. It helps students and teenagers to start saving money from an early age with their parents have an eye on their expenses.

The goal is to solve a common problem with budgeting apps — that the emergency fund is the first thing people raid for non-emergencies. By adding a human approval step and a proof-of-spend requirement, the money stays reserved for what it was meant for.

## Run locally

This repository now includes a zero-dependency Node.js backend with a SQLite database. Use Node.js 22.5 or newer (the project uses its built-in SQLite support), then run:

```powershell
npm start
```

Open [http://localhost:3000](http://localhost:3000). Register an account as a Parent or Child, then sign in. The SQLite database is created automatically at `data/finance-buddy.sqlite` and is excluded from Git. Set `SESSION_SECRET` to a long random value before deploying; `.env.example` lists the supported environment variables.

The backend serves the original `login.html`, `register.html`, and `dashboard.html` unchanged, adding the client integration at response time. It provides registration and login, protected dashboard data, parent funding (50% spending / 20% emergency / 30% savings), child approval requests, and parent request decisions.
