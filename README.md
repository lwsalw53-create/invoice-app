# Invoice Management System (Node.js + Express + MySQL)

A full stack invoice management system with JWT authentication, CRUD modules for customers/products/invoices, invoice item support, tax calculation, and PDF generation.

## Features
- User registration and login with JWT
- Customers CRUD
- Products CRUD
- Invoices CRUD
- Invoice items per invoice
- Automatic tax and total calculations
- PDF invoice download endpoint
- Simple frontend dashboard in `public/`
- MySQL schema included in `schema.sql`

## Project Structure
```
invoice-app/
├── public/
│   ├── css/
│   ├── js/
│   └── index.html
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── schema.sql
├── .env.example
└── package.json
```

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create environment file:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your MySQL credentials and JWT secret.
4. Run SQL schema in MySQL:
   ```bash
   mysql -u root -p < schema.sql
   ```
5. Start app:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:3000`

## API Endpoints
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

## Example Invoice Payload
```json
{
  "customer_id": 1,
  "invoice_number": "INV-2026-001",
  "issue_date": "2026-01-01",
  "due_date": "2026-01-15",
  "notes": "Thanks for your business",
  "items": [
    {
      "product_id": 1,
      "description": "Website Design",
      "quantity": 2,
      "unit_price": 500,
      "tax_rate": 8
    }
  ]
}
```
