CREATE TABLE plans (
  id text PRIMARY KEY,
  network text NOT NULL CHECK (network IN ('mainnet','testnet')),
  merchant_name text NOT NULL,
  merchant_address text NOT NULL,
  item text NOT NULL,
  note text NOT NULL DEFAULT '',
  customer_name text NOT NULL DEFAULT '',
  price numeric(20,2) NOT NULL CHECK (price > 0),
  currency text NOT NULL,
  installments int NOT NULL CHECK (installments BETWEEN 1 AND 52),
  cadence text NOT NULL CHECK (cadence IN ('weekly','biweekly','monthly')),
  start_date date NOT NULL,
  policy text NOT NULL DEFAULT '',
  manage_token_hash text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','collected','cancelled')),
  collected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  hash text PRIMARY KEY,
  plan_id text NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  from_address text NOT NULL,
  value_luna bigint NOT NULL CHECK (value_luna > 0),
  rate numeric(30,12) NOT NULL,
  fiat_value numeric(20,2) NOT NULL,
  block_number bigint NOT NULL,
  paid_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payments_plan_idx ON payments(plan_id, paid_at);
CREATE INDEX plans_merchant_idx ON plans(merchant_address);

-- v2: photos, collect-by date, handover code, locked-rate provenance
ALTER TABLE plans ADD COLUMN item_photo text;
ALTER TABLE plans ADD COLUMN collect_by date;
ALTER TABLE plans ADD COLUMN collect_code text NOT NULL DEFAULT '';
ALTER TABLE plans ADD COLUMN shop_place text NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN rate_source text NOT NULL DEFAULT 'live' CHECK (rate_source IN ('locked','live'));
