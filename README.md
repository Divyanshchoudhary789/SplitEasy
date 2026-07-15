# SplitEasy

A simple shared-expense splitter for groups. Add members, log expenses, and instantly see who owes whom — with suggested settlements to clear all debts in the minimum number of transactions.

# 🌐 Live Deployment

### Frontend (vercel)
https://split-easy-five.vercel.app/

### Backend (Render)
https://spliteasy-ujrz.onrender.com

---

## Features

- Add and manage group members
- Log expenses with description, amount, and who paid
- Split expenses equally, by exact amount, or by percentage
- Real-time per-person balance tracking
- Settle Up view with minimum-transaction debt resolution
- Input validation on both client and server
- Toast notifications for all user actions

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Axios |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas, Mongoose |

## Project Structure

```
SplitEasy/
├── backend/
│   ├── controllers/
│   │   ├── member.controller.js
│   │   └── expense.controller.js
│   ├── models/
│   │   ├── member.model.js
│   │   └── expense.model.js
│   ├── routes/
│   │   └── main.router.js
│   ├── .env
│   └── index.js
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Balances/
    │   │   │   ├── BalanceSummary.jsx
    │   │   │   └── SettleUp.jsx
    │   │   ├── Expenses/
    │   │   │   ├── AddExpenseForm.jsx
    │   │   │   └── ExpenseList.jsx
    │   │   ├── Members/
    │   │   │   └── MemberManager.jsx
    │   │   └── ui/
    │   │       ├── Spinner.jsx
    │   │       └── Toast.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   └── main.jsx
    └── index.html
```

## Getting Started

### Prerequisites

- Node.js v18+
- A MongoDB Atlas cluster (or local MongoDB instance)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=8080
MONGODB_URL=your_mongodb_connection_string
CLIENT_ORIGIN=http://localhost:5173
```

Start the server:

```bash
node index.js
```

The API will be available at `http://localhost:8080/api`.

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Start the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## API Reference

### Members

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/members` | Get all members |
| POST | `/api/members` | Add a member `{ name }` |
| DELETE | `/api/members/:id` | Remove a member |

### Expenses

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/expenses` | Get all expenses |
| POST | `/api/expenses` | Add an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |

### Balances

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/balances` | Get net balances and settlement suggestions |

#### Add Expense Payload

```json
{
  "description": "Dinner",
  "amount": 900,
  "paidBy": "<memberId>",
  "splits": [
    { "member": "<memberId>", "amount": 300 },
    { "member": "<memberId>", "amount": 300 },
    { "member": "<memberId>", "amount": 300 }
  ]
}
```

The sum of all split amounts must equal the total `amount`.

## How Balances Work

Each expense increases the payer's balance by the amount others owe them, and decreases each participant's balance by their share. A positive balance means the person is owed money; a negative balance means they owe money.

The Settle Up view uses a greedy creditor-debtor algorithm to suggest the minimum number of payments needed to clear all debts.

## Deployment

### Backend — Render (recommended free tier)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo, set root directory to `backend`
4. Configure the service:
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
5. Add environment variables in the Render dashboard:
   ```
   MONGODB_URL=your_atlas_connection_string
   CLIENT_ORIGIN=https://your-frontend-domain.vercel.app
   PORT=8080
   ```
6. After deploy you get a URL like `https://spliteasy-api.onrender.com`

### Frontend — Vercel (recommended)

1. Go to [vercel.com](https://vercel.com) → New Project
2. Connect your GitHub repo, set root directory to `frontend`
3. Add environment variable in the Vercel dashboard:
   ```
   VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
   ```
4. Deploy — Vercel auto-detects Vite and runs `npm run build` automatically

### MongoDB Atlas — Allow production traffic

In Atlas → Security → Network Access, add `0.0.0.0/0` to allow connections from Render's dynamic IPs.

> After both services are live, update `CLIENT_ORIGIN` in Render to your exact Vercel URL and redeploy the backend.

## 👨‍💻 Author

**Divyansh Choudhary**

Full Stack Developer | MERN STACK Developer

GitHub:  
https://github.com/Divyanshchoudhary789

LinkedIn:  
https://www.linkedin.com/in/divyansh--choudhary/
