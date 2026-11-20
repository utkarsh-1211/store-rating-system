# StoreRate — Full-Stack Store Rating Platform

A role-based full-stack web application that allows users to discover stores, submit and modify 1–5 star ratings, and manage platform operations through dedicated **System Administrator**, **Normal User**, and **Store Owner** interfaces.

## Tech Stack
- **Frontend:** React.js (Vite), React Router DOM, Context API, CSS
- **Backend:** Node.js, Express.js, JWT Authentication, `bcryptjs`
- **Database:** MySQL (`storerate_db`)

---

## Features by Role

### 1. System Administrator (`/admin`)
- Dashboard metrics: **Total Users**, **Total Stores**, and **Total Submitted Ratings**.
- Create new users (`USER`, `ADMIN`, `STORE_OWNER`) with strict validation.
- Create, edit, and delete stores, including assigning a **Store Owner**.
- Multi-field filtering on Stores (Name, Email, Address) and Users (Name, Email, Address, Role).
- Clickable ascending/descending (`ASC`/`DESC`) sorting on all tables.
- User detail view showing Name, Email, Address, Role, and **Average Store Rating** for Store Owners.

### 2. Normal User (`/` & `/profile`)
- Self-registration with Name, Email, Address, and Password.
- View all registered stores with **Name**, **Address**, **Overall Rating**, and **Your Submitted Rating**.
- Search stores by Name and Address, and sort columns ascending/descending.
- Submit or modify a 1–5 star rating inline per store (enforced via atomic upsert).
- Update password and manage personal review history from `/profile`.

### 3. Store Owner (`/owner` & `/profile`)
- View assigned store(s) and overall **Average Rating**.
- View a sortable table of users who have rated their store (Name, Email, Address, Rating, Review, Date).
- Update password from `/profile`.

---

## Form Validation Rules (Frontend & Backend)
- **Name:** 20–60 characters
- **Address:** Required, max 400 characters
- **Password:** 8–16 characters, at least 1 uppercase letter and 1 special character
- **Email:** Standard email format validation

---

## Project Structure
```text
store-rating-system/
├── backend/
│   ├── controllers/      # auth, admin, owner, store, rating controllers
│   ├── middleware/       # JWT auth & role guards (ADMIN, STORE_OWNER)
│   ├── routes/           # Express API routes
│   ├── utils/            # Shared input validators
│   ├── db.js             # MySQL connection setup
│   ├── schema.sql        # Database schema script
│   └── server.js         # Express entry point
└── frontend/
    └── src/
        ├── components/   # Navbar, ProtectedRoute, AdminRoute, OwnerRoute
        ├── context/      # AuthContext (JWT & user state)
        ├── pages/        # Login, Register, Profile, AdminDashboard, OwnerDashboard, StoreDetails
        ├── utils/        # Frontend form validators
        ├── App.jsx       # Route definitions
        └── Home.jsx      # Normal User store listing & inline rating
