# Deluxe Veneers — Frontend (ERP Web Client)

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Material--UI](https://img.shields.io/badge/MUI-v7-007FFF?logo=mui&logoColor=white)](https://mui.com/)
[![React Router](https://img.shields.io/badge/React%20Router-v8-CA4245?logo=react-router&logoColor=white)](https://reactrouter.com/)

Production-grade enterprise web frontend for the **Deluxe Veneers ERP System**. Built with **React 19**, **Vite**, **TypeScript**, and **Material-UI (MUI v7)**, following a modular feature-based architecture and a comprehensive enterprise design system.

---

## 📌 Table of Contents

- [Overview & Key Features](#-overview--key-features)
- [Architecture & Folder Structure](#-architecture--folder-structure)
- [Tech Stack](#-tech-stack)
- [Design System & UI Guidelines](#-design-system--ui-guidelines)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Development Server](#running-development-server)
- [Available Scripts](#-available-scripts)
- [Routing & Navigation](#-routing--navigation)
- [Building & Deployment](#-building--deployment)
- [Contributing & Code Conventions](#-contributing--code-conventions)

---

## 🚀 Overview & Key Features

The Deluxe Veneers Frontend serves as the central administrative and operational interface for manufacturing, inventory, warehouse management, and sales workflows.

### Core Capabilities:
- **Authentication & Security**: Role-based access control (RBAC), protected shell navigation, setup/reset password workflows, and session handling.
- **Warehouse Management**: Interactive dashboards and operations across multiple warehouse facilities (Warehouse A, Warehouse B, Warehouse C, and dynamic warehouse routes).
- **Inventory & Factory Operations**: Real-time tracking of veneer blocks, batches, stock movements, and factory stage management.
- **Dispatch & Packing**: Order fulfillment, packing lists, invoice/dispatch generation, editing, and status workflows.
- **Enterprise Masters**: Dedicated management interfaces for items, categories, sub-categories, units, colors, cuts, grades, GST, HSN, customers, suppliers, and transporters.
- **Interactive Component Library**: In-app live showcase (`/tools/component-library`) documenting enterprise design tokens, forms, data tables, dialogs, badges, and feedback components.

---

## 🏗 Architecture & Folder Structure

The application is structured around a modular, domain-driven architecture:

```text
deluxeveneer/
├── public/                 # Static assets and icons
├── src/
│   ├── assets/             # Images, logos, branding assets
│   ├── components/         # Reusable atomic & composite UI components
│   │   ├── button/         # Standardized buttons & action triggers
│   │   ├── data-display/   # Tables, status chips, badges, cards
│   │   ├── feedback/       # Alerts, snackbars, skeletons, loaders
│   │   ├── forms/          # Form inputs, selects, switches, pickers
│   │   ├── layout/         # Containers, headers, toolbars, dividers
│   │   ├── navigation/     # Breadcrumbs, tabs, steppers, pagination
│   │   └── overlay/        # Modals, drawers, tooltips, dialogs
│   ├── config/             # App-wide configuration and constants
│   ├── features/           # Domain feature slices
│   │   ├── auth/           # Login, auth provider, password setup
│   │   ├── dashboard/      # Executive & operational metrics
│   │   ├── dispatch/       # Dispatch creation, review, and management
│   │   ├── factory/        # Factory floor and production flows
│   │   ├── inventory/      # Stock tracking, batches, veneer blocks
│   │   ├── masters/        # Reference data CRUD (customers, items, etc.)
│   │   ├── order/          # Sales orders and processing
│   │   ├── packing/        # Packing slips and bundle assignments
│   │   ├── profile/        # User profile and preferences
│   │   ├── roles-permissions/ # Role definitions and permissions matrix
│   │   ├── user-management/# Admin user directory and role assignment
│   │   └── warehouses/     # Physical facility views & inventory maps
│   ├── layouts/            # App shell, navigation drawer, top bar
│   ├── lib/                # API client, HTTP interceptors, utilities
│   ├── pages/              # Standalone route pages (e.g., Component Library)
│   ├── routes/             # App router definitions (`AppRouter.tsx`)
│   ├── styles/             # Global CSS and CSS variables
│   ├── theme/              # MUI theme definitions, typography & tokens
│   └── main.tsx            # React application entry point
├── ERP_COMPONENT_LIBRARY.md# Comprehensive Enterprise Design System specification
├── index.html              # HTML entry template
├── tsconfig.json           # TypeScript configuration
├── vercel.json             # Vercel deployment configuration
└── vite.config.ts          # Vite build tool configuration
```

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| **Framework & Runtime** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool & Bundler** | [Vite 8](https://vitejs.dev/) |
| **Component Framework** | [MUI (Material-UI) v7](https://mui.com/) + Emotion |
| **Routing** | [React Router v8](https://reactrouter.com/) |
| **Validation** | [Zod](https://zod.dev/) |
| **Icons & Typography** | [Lucide React](https://lucide.dev/), `@fontsource/inter` |
| **Utility Libraries** | `country-state-city`, `libphonenumber-js` |

---

## 🎨 Design System & UI Guidelines

All UI components adhere to the **Deluxe Veneers ERP Design System** (`ERP_COMPONENT_LIBRARY.md`):
- **Enterprise Aesthetic**: Clean, light, warm-neutral surfaces with curated Deluxe maroon accents.
- **Zero Ad-Hoc Styling**: Colors, padding, elevation, and borders strictly consume theme tokens (`appTheme`).
- **Data-Dense Layouts**: Optimized for operational productivity with high-density data tables, standardized filter bars, and modal forms.
- **Component Documentation**: Review live components at `/tools/component-library` when running locally.

---

## 🏁 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` recommended
- **Package Manager**: `npm` (v10+), `pnpm`, or `yarn`

### Installation

1. Clone the repository and navigate to the frontend directory:
   ```bash
   cd deluxeveneer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the root of `deluxeveneer/` using `.env.example` as a reference:

```bash
cp .env.example .env
```

Configure your local environment variables:

```env
# Application Configuration
VITE_APP_NAME=Deluxe Veneers
VITE_APP_ENV=development

# Backend API Endpoint
VITE_API_URL=http://localhost:5000/api
```

### Running Development Server

Start the local development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be accessible at:
👉 **`http://localhost:5173`** (or the port specified in terminal output).

---

## 📜 Available Scripts

| Script | Command | Purpose |
|---|---|---|
| **Development** | `npm run dev` | Launches local Vite development server with HMR |
| **Type Check & Build** | `npm run build` | Runs TypeScript compilation (`tsc -b`) and builds production assets |
| **Preview** | `npm run preview` | Previews the production build locally |

---

## 🗺 Routing & Navigation

| Route Pattern | Feature / Page | Access |
|---|---|---|
| `/` | Login Screen | Public |
| `/setup-password`, `/reset-password` | Password setup / reset | Public |
| `/dashboard` | Executive Dashboard | Authenticated |
| `/masters/*` | Masters management (Items, Customers, Units, etc.) | Authenticated / Role restricted |
| `/warehouse-a`, `/warehouse-b`, `/warehouse-c` | Facility Warehouse views | Authenticated |
| `/warehouses/:warehouseSlug` | Dynamic warehouse management | Authenticated |
| `/inventory/*` | Raw veneer blocks, grading, batch movement | Authenticated |
| `/factory/*` | Factory floor status & logs | Authenticated |
| `/packing/*` | Packing lists & pallet allocation | Authenticated |
| `/dispatch/*` | Dispatch orders, invoices, and tracking | Authenticated |
| `/tools/component-library` | Design System & Component Reference | Authenticated |

---

## 📦 Building & Deployment

### Production Build
To create a fully optimized static build for production:

```bash
npm run build
```
Compiled output is generated in the `dist/` directory.

### Deployment (e.g., Vercel)
The project includes a ready-to-use [`vercel.json`](file:///c:/Users/user/Desktop/Work/Deluxe/deluxeveneer/vercel.json) configuring Single Page Application (SPA) rewrites:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Ensure the following environment variable is configured in your hosting platform:
- `VITE_API_URL`: Target production backend API URL (e.g., `https://api.yourdomain.com/api`).

---

## 🤝 Contributing & Code Conventions

1. **Feature Separation**: Place domain code inside `src/features/<feature-name>`.
2. **Component Reusability**: Extract generic UI elements to `src/components/` and document them in the Component Library.
3. **Form Validation**: Standardize all form schemas using Zod.
4. **Clean Commits**: Ensure `npm run build` passes with zero TypeScript warnings before opening pull requests.
