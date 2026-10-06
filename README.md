# LogiDist Pro — Enterprise Distribution & Delivery Management System (Admin Panel)

**LogiDist Pro** is an enterprise-grade, production-ready Admin Panel built for modern distribution, sales, and delivery management systems. It provides robust tools for tracking supply chains, inventory, sales agents, customer credit limits, real-time GPS monitoring, and financial flows.

---

## 🚀 Tech Stack

- **Framework:** React 18 + Vite (SPA)
- **Language:** TypeScript (Strict Type Safety)
- **Styling:** Tailwind CSS (Dark Mode & Responsive Design)
- **State Management:** Zustand (with Persist Middleware)
- **Data Fetching:** TanStack React Query v5
- **Icons:** Lucide React
- **Routing:** React Router DOM v6
- **Charts:** Custom SVG / Recharts-ready architecture

------------------

## 📦 Core Modules Implemented (11 Modules)

1. **Dashboard (4.1.1):** Daily/weekly/monthly sales statistics, active orders count, deliveries count, total debt summary, low stock alerts, and sales trend charts.
2. **Products (4.1.2):** Product CRUD, Category & Subcategory CRUD, multi-tier pricing (Base, Wholesale, Discount), Barcode/SKU fields, unit types (Piece, Box, Kg, Liter), and image preview.
3. **Warehouse (4.1.3):** Warehouse list, stock management, inventory tracking, IN/OUT/TRANSFER stock movements, and low stock warnings.
4. **CRM (4.1.4):** Customer list, customer detail drawer, order history, payment history, debt summary, and customer segments (`VIP`, `Standard`, `New`, `Wholesale`, `Risky`).
5. **Employees (4.1.5):** Employee CRUD, Role management, RBAC Permission Matrix, Territory assignment, and Agent KPI dashboard.
6. **Orders (4.1.6):** Orders list, order detail modal, status workflow (`NEW` ➔ `CONFIRMED` ➔ `PICKING` ➔ `ON_THE_WAY` ➔ `DELIVERED` ➔ `CANCELLED`), courier assignment, partial delivery, returns (`Vozvrat`), and status timeline.
7. **Territories & Routes (4.1.7):** Territory CRUD, route planning, agent/courier assignment, and polygon map visualization.
8. **Finance (4.1.8):** Payment tracking, debt management, credit limit control and blocking rules, cash flow summary, and pricing policies.
9. **GPS Monitoring (4.1.9):** Live map interface, vehicle and driver tracking list, route history mock, distance statistics, and 5-second real-time coordinate updates.
10. **Reports (4.1.10):** Sales, debt, warehouse, KPI, and GPS reports with filters and Excel export simulation.
11. **Settings (4.1.11):** Users, roles, notification templates, discounts, and integration settings.

---

## ⚙️ Installation & Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 1. Clone the repository / Open project directory
```bash
cd D:/Agent
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```

The application will be available at **`http://localhost:3000`**.

### 4. Build for production
```bash
npm run build
```

---

## 📂 Project Folder Structure

```tree
src/
├── components/
│   ├── layout/       # Sidebar, Header, DashboardLayout
│   └── shared/       # DataTable, PermissionGuard, SalesChart
├── pages/            # Feature pages (Dashboard, Products, Orders, CRM, etc.)
├── store/            # Zustand stores with persist middleware
├── types/            # TypeScript interfaces & types
├── utils/            # Formatters (Currency, Date)
├── App.tsx           # Main application with React Router
├── main.tsx          # React DOM entry point
└── index.css         # Tailwind CSS directives & custom scrollbars
```

---

## 🛡️ License
Private & Confidential. Built for Enterprise Distribution Systems.
