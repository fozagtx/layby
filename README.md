<div align="center">

<img src="./public/logo.svg" alt="Layby" width="260" />

# Layby

**Reserve it today, pay it off in NIM, take it home when it's paid.**

Layaway for local shops, inside Nimiq Pay.

[Live app](https://laybyapp.vercel.app) · [How it works](https://laybyapp.vercel.app/how) · [Design system](./DESIGN.md)

`Nimiq Mini Apps Competition · Cycle III · Save category` · `MIT`

</div>

---

## Deployment

| | |
| --- | --- |
| **Live app** | https://laybyapp.vercel.app |
| **Open in Nimiq Pay** | Mini Apps → Custom URL → `laybyapp.vercel.app` |
| **Networks** | **Nimiq mainnet** and testnet. The app follows the network Nimiq Pay is on. |
| **Smart contracts** | None. Payments are native NIM transactions straight to the shop's wallet, so there is nothing to deploy on chain. |
| **Hosting** | Vercel (Next.js 16) · Neon Postgres |

| Nimiq Pay network | Plans created | Payments verified against |
| --- | --- | --- |
| Mainnet (default) | Mainnet plans, marked `MAINNET` | `rpc.nimiqwatch.com` |
| Testnet (dev menu) | Testnet plans, marked `TESTNET` | `rpc.testnet.nimiqwatch.com` |

Each plan records its network, so testnet and mainnet payments never mix.

---

## Contents

1. [The problem](#1-the-problem)
2. [What Layby does](#2-what-layby-does)
3. [Who it is for](#3-who-it-is-for)
4. [How it uses Nimiq Pay](#4-how-it-uses-nimiq-pay)
5. [How a payment is verified](#5-how-a-payment-is-verified)
6. [Trust model](#6-trust-model)
7. [Screens](#7-screens)
8. [Architecture](#8-architecture)
9. [Run it locally](#9-run-it-locally)
10. [Try it on testnet](#10-try-it-on-testnet)
11. [Project structure](#11-project-structure)
12. [Tests](#12-tests)
13. [Limitations and roadmap](#13-limitations-and-roadmap)

---

## 1. The problem

Lay-by (layaway) is how many people buy a phone, a sewing machine, school uniforms or holiday gifts: the shop puts
the item aside and the customer pays it off over a few weeks. Today it runs on a paper card or a notebook behind
the counter.

- The customer can't see their balance without visiting the shop.
- The shop chases people by phone and keeps the books by hand.
- NIM sitting in a wallet can't be used for any of it.

## 2. What Layby does

| Step | Who | What happens |
| --- | --- | --- |
| 1 | Shop | Creates a plan: item photo, price in local currency, number of payments, collect-by date and a refund policy. Gets a QR code and a link. |
| 2 | Customer | Opens the link in Nimiq Pay and pays the next payment in NIM. The rate is locked for 10 minutes, so the amount shown is the amount counted. |
| 3 | Layby | Reads every payment back from the Nimiq chain and runs six checks before it fills a brick. Each payment gets a receipt. |
| 4 | Both | When the last brick fills, the customer's screen shows a collect code. The shop scans it and marks the item collected. |

Progress is shown as **bricks, one per payment** ("3 of 8 paid"), because a layby is a number of payments you can
count, not a percentage.

## 3. Who it is for

Small shops (phone sellers, tailors, fabric stalls, school suppliers) and their customers in places where layaway
is already normal and money moves in small, regular amounts.

## 4. How it uses Nimiq Pay

| Need | Nimiq Mini App SDK |
| --- | --- |
| Shop picks the wallet that receives payments | `listAccounts()`: first address is the stable wallet address |
| Customer pays a payment, tagged for the plan | `sendBasicTransactionWithData({ recipient, value, data: "layby:<planId>" })` |
| Testnet and mainnet never mix | `getHostNetwork()`; every plan records its network |
| Default price currency | `getHostFiat()` |
| Clear wallet errors | `NimiqProviderError`: cancelled, insufficient funds, outcome unknown (never retried) |

## 5. How a payment is verified

The app only sends the server a transaction hash. Everything else is read from the chain with
`getTransactionByHash` on the plan's network:

| # | Check | Rule |
| --- | --- | --- |
| 1 | Transaction found | The hash exists on the plan's network |
| 2 | Recipient is this shop | `to` equals the shop's wallet |
| 3 | Memo tag | `recipientData` decodes to exactly `layby:<planId>` |
| 4 | Executed successfully | `executionResult` is true |
| 5 | Amount | Value above zero; the receipt re-checks it matches the record |
| 6 | Not a duplicate | The hash is the primary key, so it can only be counted once |

- **Receipts re-run all six checks live** each time they are opened, and say so.
- **Missed payments are recovered.** If the app closes mid-payment, the plan page re-scans the shop's recent
  transactions (`getTransactionsByAddress`, at most once per plan every 20 seconds) and records anything tagged for
  the plan through the same checks.
- **Locked rates are signed.** The server signs each 10-minute quote (HMAC). A payment that lands before the quote
  expires is counted at that rate; otherwise at the live rate. Receipts show which.

## 6. Trust model

| Question | Answer |
| --- | --- |
| Who holds the money? | Nobody but the shop. Payments go straight to the shop's wallet. Layby has no wallet and no keys. |
| Why no escrow contract? | Nimiq Pay mini apps can't create contracts, so the shop's written refund policy is shown on every plan, verbatim. |
| Who can close a plan? | Only the holder of the shop's private link (a random token; the server stores its SHA-256 hash) **and** with the customer's 6-character collect code. |
| Who can see a plan? | Anyone with the link, like a paper layby card. The books are public on purpose. |

## 7. Screens

| Screen | Route | Notes |
| --- | --- | --- |
| Home | `/` | Shop's plans as cards with brick progress |
| Create plan | `/new` | Camera-first photo, live NIM conversion, brick preview stepper, required refund policy |
| Plan / pay | `/p/[id]` | Bricks, next payment with locked rate, memo disclosure, shop panel with QR, schedule, policy, honesty block |
| Receipt | `/r/[hash]` | Till-style receipt with all six checks, hash, explorer link |
| Hand over | `/p/[id]/fulfil` | Scan the collect code (camera) or type it; confirmation sheet; full-screen "Collected" |
| How it works | `/how` | Walkthrough for first-time users and judges |

The visual system (warm paper, deep green, ochre, serif headlines, mono numbers, bricks not bars) is documented
in [DESIGN.md](./DESIGN.md).

## 8. Architecture

```
Nimiq Pay (Android / iOS WebView)
 └── Next.js 16 app  (React 19, Tailwind v4, App Router)
      ├── Pages ................ /  /new  /p/[id]  /p/[id]/fulfil  /r/[hash]  /how
      └── API routes
           ├── POST /api/plans                     create a plan
           ├── GET  /api/plans/[id]                plan, payments, progress (+ background chain re-scan)
           ├── GET  /api/plans/[id]/photo          item photo (cached)
           ├── POST /api/plans/[id]/payments       verify a transaction hash on chain
           ├── POST /api/plans/[id]/collect        hand-over (shop token + collect code)
           ├── GET  /api/receipts/[hash]           receipt with live six-check re-run
           ├── GET  /api/quote                     signed 10-minute NIM rate
           └── GET  /api/merchants/[address]       plans paying to a wallet
                │
                ├── Neon Postgres ........ plans, payments
                ├── Nimiq RPC ............ mainnet rpc.nimiqwatch.com · testnet rpc.testnet.nimiqwatch.com
                └── CoinGecko ............ NIM price, cached 60s
```

## 9. Run it locally

**Requirements:** Node 22+, pnpm, a Postgres database (Neon free tier works).

```bash
git clone https://github.com/fozagtx/layby.git
cd layby
pnpm install
cp .env.example .env.local        # set DATABASE_URL and QUOTE_SECRET
psql "$DATABASE_URL" -f db/schema.sql
pnpm dev --hostname 0.0.0.0
```

Open `http://<your-LAN-IP>:3000` in **Nimiq Pay → Mini Apps → Custom URL** (phone on the same Wi-Fi).

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `QUOTE_SECRET` | yes | Signs rate quotes |
| `NIMIQ_RPC_MAINNET` | no | Override mainnet RPC |
| `NIMIQ_RPC_TESTNET` | no | Override testnet RPC |

## 10. Try it on testnet

1. In Nimiq Pay, open the menu and hold **Settings** for 10 seconds. Choose **Testnet**.
2. Tap **Get free NIM** on the home screen.
3. Open Layby in Mini Apps (`laybyapp.vercel.app`). Tap **Create a plan**, then **Use my Nimiq Pay wallet**.
4. Open the plan link and pay the first payment. Watch the brick fill and open its receipt.
5. Pay the rest, then use **Hand over the item** and enter the collect code from the customer screen.

## 11. Project structure

```
src/
├── app/
│   ├── api/                 route handlers (see Architecture)
│   ├── new/                 create plan
│   ├── p/[id]/              plan page, shop panel, fulfil (hand-over)
│   ├── r/[hash]/            receipt
│   ├── how/                 walkthrough
│   └── globals.css          design tokens (DESIGN.md §4)
├── components/              PlanProgress (bricks), Receipt, ShopHeader, PlanCard, Qr, HonestyBlock, ui
└── lib/
    ├── shared.ts            types, schedule maths, formatting, address checksum
    ├── client/              Nimiq SDK wrapper, hooks, photo resize
    └── server/              db, Nimiq RPC + checks, signed quotes, payments, tokens, price
db/schema.sql                database schema
tests/verify.test.ts         unit tests
DESIGN.md                    design system
```

## 12. Tests

```bash
pnpm test
```

Covers the six-check rules (accept and every reject reason), memo decoding, Nimiq address checksums, the payment
schedule (due dates, overdue, uneven splits, fully paid), mapping each brick to the payment that filled it, and
signed quotes (honoured, expired, tampered, wrong currency).

## 13. Limitations and roadmap

| Today | Next |
| --- | --- |
| Refunds are paid by the shop from its own wallet | In-app refund tracking with a `layby-refund:<id>` memo |
| No automatic payments (no background signing on the platform) | Payment reminders the customer opts into |
| Shop access is a private link | Wallet-signature login for shops |
| Paying happens in Nimiq Pay only | Desktop payments through the Nimiq Hub |
| Shop photo uses an illustration | Storefront photo upload |
| English only | Use `window.nimiqPay.language` for translations |

---

MIT License. See [LICENSE](./LICENSE).
