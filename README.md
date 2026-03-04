# Royal Wedding Collection - Billing App

A full-stack billing application for a men's wedding clothing merchant. Includes a **Node.js + MongoDB backend** with PDF invoice generation and a **React Native (Expo)** mobile app.

---

## Features

- Create and manage customer records
- Pre-loaded catalog of men's wedding garments (Sherwani, Suit, Blazer, Ethnic, Indo-Western, Accessories)
- Create itemized bills with discount, tax, and payment tracking
- Auto-generated bill numbers (`BILL-YYYYMMDD-001`)
- Professional PDF invoice generation (PDFKit)
- Print/share bills directly from the mobile app
- Dashboard with revenue stats and bill counts
- Search and filter bills by status, customer, or bill number

---

## Prerequisites

- **Node.js** v18+
- **MongoDB** running locally on `mongodb://localhost:27017`
- **Expo CLI** (`npm install -g expo-cli`)
- **Expo Go** app on your phone (for testing)

---

## Setup

### 1. Backend

```bash
cd backend
npm install
```

**Configure environment** (optional): edit `backend/.env` to set your shop name, address, GST number, etc.

**Seed the product catalog:**

```bash
npm run seed
```

**Start the server:**

```bash
npm run dev
```

The API will run at `http://localhost:5000`.

### 2. Mobile App

```bash
cd mobile
npm install
```

**Configure API URL:** In `mobile/src/services/api.js`, update `API_BASE` to your backend's IP:

- Android Emulator: `http://10.0.2.2:5000/api` (default)
- Physical device on same WiFi: `http://<your-pc-ip>:5000/api`
- iOS Simulator: `http://localhost:5000/api`

**Start the app:**

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

---

## API Endpoints

| Method | Endpoint               | Description              |
|--------|------------------------|--------------------------|
| GET    | `/api/products`        | List all products        |
| POST   | `/api/products`        | Add a product            |
| GET    | `/api/customers`       | List customers (search)  |
| POST   | `/api/customers`       | Create a customer        |
| GET    | `/api/bills`           | List bills (filter)      |
| GET    | `/api/bills/stats`     | Dashboard statistics     |
| POST   | `/api/bills`           | Create a new bill        |
| GET    | `/api/bills/:id`       | Get bill details         |
| GET    | `/api/bills/:id/pdf`   | Download bill as PDF     |
| PUT    | `/api/bills/:id`       | Update a bill            |
| DELETE | `/api/bills/:id`       | Delete a bill            |

---

## Project Structure

```
Billing/
├── backend/
│   ├── config/db.js          # MongoDB connection
│   ├── models/               # Mongoose schemas (Bill, Customer, Product)
│   ├── routes/               # Express REST routes
│   ├── services/pdfGenerator.js  # PDFKit invoice generator
│   ├── seed/seedProducts.js  # Product catalog seeder
│   ├── server.js             # Entry point
│   └── .env                  # Environment config
├── mobile/
│   ├── App.js                # Navigation setup
│   └── src/
│       ├── screens/          # HomeScreen, CreateBill, BillsList, BillDetail
│       ├── components/       # CustomerForm, ProductPicker, BillItemRow
│       ├── services/api.js   # Axios API client
│       └── utils/            # Currency formatting helpers
└── README.md
```

---

## Tech Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose, PDFKit
- **Mobile:** React Native, Expo, React Navigation, Axios, expo-print, expo-sharing
