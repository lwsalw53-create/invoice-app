-- PostgreSQL schema for Manasik Pro

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('admin', 'operations', 'agent', 'accountant');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'card');
CREATE TYPE subscription_plan AS ENUM ('basic', 'pro', 'enterprise');

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  plan subscription_plan NOT NULL DEFAULT 'basic',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  phone VARCHAR(30),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(180) NOT NULL,
  city VARCHAR(80) NOT NULL DEFAULT 'Makkah',
  total_rooms INT NOT NULL CHECK (total_rooms >= 0),
  occupied_rooms INT NOT NULL DEFAULT 0 CHECK (occupied_rooms >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bus_type VARCHAR(80) NOT NULL,
  driver_name VARCHAR(120) NOT NULL,
  seats INT NOT NULL CHECK (seats > 0),
  plate_number VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  days INT NOT NULL CHECK (days > 0),
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name VARCHAR(140) NOT NULL,
  nationality VARCHAR(80),
  phone VARCHAR(30) NOT NULL,
  passport_number VARCHAR(40) NOT NULL,
  companions_count INT NOT NULL DEFAULT 0 CHECK (companions_count >= 0),
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  booking_status booking_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  qr_code_value TEXT,
  assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (departure_date >= arrival_date),
  UNIQUE(tenant_id, passport_number)
);

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE RESTRICT,
  route_name VARCHAR(160) NOT NULL,
  trip_time TIMESTAMPTZ NOT NULL,
  seats_reserved INT NOT NULL DEFAULT 0 CHECK (seats_reserved >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  method payment_method NOT NULL,
  status payment_status NOT NULL,
  note TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'sms')),
  template_key VARCHAR(60) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_tenant_arrival ON customers(tenant_id, arrival_date);
CREATE INDEX idx_customers_tenant_departure ON customers(tenant_id, departure_date);
CREATE INDEX idx_customers_tenant_status ON customers(tenant_id, booking_status, payment_status);
CREATE INDEX idx_payments_tenant_paidat ON payments(tenant_id, paid_at);
CREATE INDEX idx_trips_tenant_time ON trips(tenant_id, trip_time);
