/*
  # Create Orders and Customers Tables

  1. New Tables
    - `customers` - Store customer information
      - `id` (uuid, primary key)
      - `name` (text)
      - `phone` (text)
      - `created_at` (timestamp)
    - `orders` - Store order information
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `amount` (numeric)
      - `status` (text: pending, completed, cancelled)
      - `description` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access (for demo)
    - Add policies for service role to write data
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read customers"
  ON customers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role insert customers"
  ON customers
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow public read orders"
  ON orders
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role insert orders"
  ON orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role update orders"
  ON orders
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);
