# Invoice Management System (React + Express + MySQL)

This project is now organized as a two-app setup:

- `client/`: modern React dashboard frontend (Vite)
- `server/`: Express + MySQL backend API

## Features

- JWT login flow
- Responsive dashboard layout with sidebar + top navbar
- Pages: Login, Customers, Products, Invoices
- CRUD tables with create/edit modals
- Invoice item editor in modal
- API integration with existing Express endpoints

## Project Structure

```txt
invoice-app/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── styles.css
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   ├── schema.sql
│   ├── .env.example
│   └── package.json
└── package.json
```

## Setup

1. Install root tooling and both app dependencies:

   ```bash
   npm install
   npm run install:all
   ```

2. Create backend environment file:

   ```bash
   cp server/.env.example server/.env
   ```

3. Configure `server/.env` with your MySQL credentials and JWT values.

4. Create the database/tables:

   ```bash
   mysql -u root -p < server/schema.sql
   ```

## Running the apps

### Run backend only

```bash
npm run dev:server
```

Backend API runs on `http://localhost:3000`.

### Run frontend only

```bash
npm run dev:client
```

Frontend runs on `http://localhost:5173` and proxies `/api` calls to backend.

### Run both together

```bash
npm run dev
```

## API Endpoints (server)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Customers (Bearer token)
- `GET /api/customers`
- `GET /api/customers/:id`
- `POST /api/customers`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`

### Products (Bearer token)
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Invoices (Bearer token)
- `GET /api/invoices`
- `GET /api/invoices/:id`
- `POST /api/invoices`
- `PUT /api/invoices/:id`
- `DELETE /api/invoices/:id`
- `GET /api/invoices/:id/pdf`
