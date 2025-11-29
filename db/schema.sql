-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- MERCHANTS
CREATE TABLE IF NOT EXISTS merchants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    contact_email TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SHOPS (stores)
CREATE TABLE IF NOT EXISTS shops (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TERMINALS
-- public_id is what we encode into the QR (human-safe short string)
CREATE TABLE IF NOT EXISTS terminals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    public_id   TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RECEIPTS
-- pdf stored in Vercel Blob, only metadata here
CREATE TABLE IF NOT EXISTS receipts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_id    UUID NOT NULL REFERENCES terminals(id) ON DELETE CASCADE,
    blob_url       TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    downloaded_at  TIMESTAMPTZ
);

-- Helpful index to quickly fetch the latest receipt per terminal
CREATE INDEX IF NOT EXISTS idx_receipts_terminal_created_at
    ON receipts (terminal_id, created_at DESC);
