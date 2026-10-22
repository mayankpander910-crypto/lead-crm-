# PulseCRM — Vue 3 + PrimeVue CRM Lead Management Dashboard (JavaScript Edition)

A modern, responsive SaaS **CRM Lead Management Dashboard** built in **100% pure JavaScript (ES Modules)** with **Vue 3 (`<script setup>`)**, **Vite**, **PrimeVue 4 (`@primeuix/themes/aura`)**, **PrimeIcons**, **Tailwind CSS v4**, **Pinia**, **Vue Router**, and **Chart.js (`vue-chartjs`)**.

---

## Project Architecture & Developer Flowchart

Visual diagrams are included in [`docs/pulsecrm-flowchart.svg`](docs/pulsecrm-flowchart.svg) and [`docs/pulsecrm-flowchart.png`](docs/pulsecrm-flowchart.png).

```mermaid
flowchart TD
    Boot["1. App Boot<br/>index.html → src/main.js → App.vue<br/>Vue 3 + Pinia + Router + PrimeVue + Chart.js + Theme/Text Scale"]
    Guard["2. Route Guard<br/>src/router/index.js<br/>Checks store.isAuthenticated & role route access"]
    Login["Auth Screen (/login)<br/>src/views/LoginView.vue<br/>Email/Password or 1-Click Role Login"]

    Admin["Admin<br/>Full access to all 42 leads & tasks,<br/>delete permissions, user & system settings"]
    Manager["Sales Manager<br/>Team-wide pipeline & analytics,<br/>rep assignment & /team directory"]
    Worker["Sales Worker<br/>Scoped strictly to own assigned leads,<br/>tasks, Kanban & personal quota"]

    Store["4. Central Pinia Store (src/stores/crmStore.js)<br/>• Dynamic role filtering (store.permissions)<br/>• Live KPIs, funnel metrics & notifications<br/>• Lead/Task CRUD, bulk updates, CSV export & Demo Reset<br/>• Theme Presets & Global Text Size (XS · S · M · LG · XL)"]
    Storage["Local Persistence (storageService.js)<br/>src/data/*.json seeds ↔ Browser LocalStorage"]

    Shell["5. UI Shell (MainLayout.vue)<br/>AppSidebar + AppTopbar + RouterView + Global Drawers<br/>Overview (/) · Leads (/leads) · Pipeline (/pipeline) · Tasks (/tasks) · Analytics (/analytics) · Team (/team) · Settings (/settings)"]

    Boot --> Guard
    Guard -- "No active session" --> Login
    Login -- "Valid credentials" --> Guard
    Guard --> Admin & Manager & Worker
    Admin & Manager & Worker --> Store
    Store <--> Storage
    Store --> Shell
```

---

## Key Features

- **Role-Based Authentication (`Admin`, `Sales Manager`, `Sales Worker`):** Instant role session switching and scoped data visibility persisted in `LocalStorage`.
- **Global Dashboard Text Size (`XS`, `S`, `M [Default]`, `LG`, `XL`):** Scales every heading, table header/row, sidebar link, KPI metric, badge, button, form drawer, and Chart.js canvas axis/legend/tooltip smoothly from both **Settings** and the **Topbar Appearance Popover**.
- **Interactive Analytics & Kanban Pipeline:** 7-stage drag-and-drop Kanban board, Chart.js data visualizations, multi-criteria filtering, bulk actions, and CSV export.

---

## Quick Start (Run on `localhost`)

```bash
# 1. Install dependencies
npm install

# 2. Start local dev server
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## Demo Login Accounts

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | Elena Rostova | `elena.rostova@pulsecrm.io` | `Admin@123` |
| **Sales Manager** | Marcus Vance | `marcus.vance@pulsecrm.io` | `Manager@123` |
| **Sales Worker** | Sofia Alvarez | `sofia.alvarez@pulsecrm.io` | `Worker@123` |
