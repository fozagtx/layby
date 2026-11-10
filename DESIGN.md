# Layby — Design System & Design DNA

> **Drop this file into any coding agent (Claude Code, Cursor, v0, Lovable) as the single source of visual truth.**
> Product: *Layby — layaway for local shops, paid in NIM.*
> One line: **"Reserve it today, pay it off in NIM, take it home when it's paid."**

---

## 0. How to use this file

If you are a coding agent reading this:

1. Read §2 (Design DNA) first. Every later decision descends from it.
2. Implement §4 (tokens) verbatim as CSS variables + Tailwind config. Do not invent colors.
3. Build the components in §6 before building screens. Screens are compositions.
4. §7 is screen-by-screen spec. Build in the order given.
5. §10 is a hard "never do this" list. Treat it as a lint rule.

**Non-negotiables (if you remember nothing else):**
- Warm bone canvas, never pure white. Never a blue-gray "SaaS dashboard".
- Every monetary amount and every piece of chain data renders in **mono, tabular-nums**.
- Progress is shown as **discrete bricks** (one per installment), never a smooth bar.
- The receipt shows **all six on-chain checks** explicitly. That is the product.
- No crypto jargon anywhere on the customer path.

---

## 1. Inspiration sources & why

Scrolled the full SEESAW gallery, then studied the finance/commerce entries close up. The pick is a **blend**, not a copy:

| Source | What was taken | Why it fits Layby |
|---|---|---|
| **Pool** (poolmoney.com) | Structural base: warm bone canvas, deep forest green, goal-cards with photo + name + amount, mono uppercase pill buttons, dotted hairline dividers | Pool's entire UI is "money held toward a named thing, visible to more than one person." That is literally a layby plan. Closest structural match in the gallery. |
| **Goldsand** (goldsand.fi) | Tonal + typographic base: editorial high-contrast serif display, black ink woodcut illustrations in soft tiles, ochre/gold accent, calm generous spacing | Goldsand sells *ethical honesty in finance* ("high yield savings with no interest"). Layby sells the same thing: no escrow, no tricks, public chain-checked books. The visual voice of restraint = trust. |
| **Cash App** | Confidence at the transaction moment: huge high-contrast type, unapologetic black/bone QR panels, zero decoration when money moves | The scan/collect moment happens across a shop counter in bad light. It must read at arm's length. |
| **Bonside** | Warm dusk storefront photography, "brick and mortar" dignity | The shop is a real place. Shop identity deserves photographic weight, not a generic avatar circle. |

**Rejected and why:** Plasma / Kast / Legend / Ctrl (dark crypto-native, alienates a shop owner in a market stall); Stripe / Zazu-Manza (B2B dashboard grid, too corporate and cold for a customer paying ₦2,000 a week); Titan / Autonomous (wealth-management luxury, wrong class signal).

---

## 2. Design DNA — the five principles

### I. The ledger is the product
Competitors hide mechanics behind "escrow" and a spinner. Layby has no escrow — money goes straight to the merchant's wallet — so **the books are the trust mechanism and must be visually foregrounded**. Receipts, hashes, memo tags and the six verification checks are not fine print; they are hero content, set in mono, given space and dignity.

*Implication:* mono numerals everywhere money or chain data appears. Receipts get full screens, not toasts.

### II. Shop counter, not trading desk
This is used standing up, one-handed, in a market, on a cheap Android, in sunlight, possibly on 3G. Warm paper tones, enormous tap targets, high contrast, no hover-dependent affordances, no thin 300-weight text, no dark mode as default.

*Implication:* minimum 56px tap targets, 17px minimum body, works at 320px, every state has a non-color signal.

### III. Pay small small — progress is countable
A layby is not a percentage, it is **a number of payments you can count on your fingers**. 3 of 8. The core visual device is discrete filled bricks, like chalk tally marks on a shop wall. Never a smooth gradient bar — a smooth bar is a bank's abstraction; bricks are the customer's reality.

*Implication:* the `<PlanProgress>` component is the single most important piece of UI in the app.

### IV. Honest typography
Editorial serif for human statements ("Reserve it today."). Neutral grotesque for interface. Mono for anything a person could audit. The type hierarchy itself encodes the honesty claim: *what we say* vs *what the chain says* look visibly different.

*Implication:* three typefaces, strictly assigned. Never a serif number, never a mono sentence.

### V. Quiet at the moment of money
No confetti, no bouncing checkmarks, no celebratory sound when a plan completes. Money is serious to someone saving for it. Completion is marked with a **letterpress-style "PAID IN FULL" stamp** — still, heavy, final. Motion is reserved for conveying state, never for delight.

---

## 3. Brand expression

- **Name treatment:** `Layby` — serif display, lowercase-sensitive, no logotype gimmicks.
- **Tagline lockup:** "Reserve it today, pay it off in NIM, take it home when it's paid." — set in body grotesque, never in the serif.
- **Mark:** a simple bracket/shelf glyph `⌐` or a three-brick stack. Avoid wallets, coins, chains, locks, handshakes.
- **Nimiq relationship:** the ochre accent `#B4802C` is a deliberately muted sibling of Nimiq's gold so the handoff into Nimiq Pay feels continuous rather than a jarring brand switch. Where Nimiq Pay is explicitly named, you may use full Nimiq gold `#E9B213`; everywhere else, use the muted ochre.

---

## 4. Tokens

### 4.1 Color

```css
:root {
  /* Canvas & surface — warm, never pure white */
  --canvas:        #F4F1EA;  /* page background */
  --canvas-sunk:   #EDE9E0;  /* inset wells, empty states */
  --surface:       #FFFDF8;  /* cards, sheets */
  --surface-alt:   #F9F6EF;  /* secondary card, table stripe */

  /* Ink */
  --ink:           #141413;  /* primary text */
  --ink-muted:     #6B6760;  /* secondary text, labels */
  --ink-faint:     #9A948A;  /* placeholder, disabled */
  --hairline:      #E0DACF;  /* 1px dividers, card borders */
  --hairline-firm: #CFC7B8;  /* input borders */

  /* Brand — deep green = paid, settled, done */
  --green:         #0E3B32;
  --green-soft:    #1B5E4F;  /* progress fill, hover */
  --green-wash:    #E4ECE7;  /* tinted badge bg */

  /* Accent — ochre = in progress, pending, attention-not-alarm */
  --ochre:         #B4802C;
  --ochre-wash:    #F6EEDC;
  --nimiq-gold:    #E9B213;  /* ONLY where Nimiq Pay is named */

  /* Alert — clay = overdue, failed, expired */
  --clay:          #B4502C;
  --clay-wash:     #F7E8E0;

  /* Chain-verified seal */
  --verify:        #1B5E4F;
}

[data-theme="dark"] {
  --canvas:        #14130F;
  --canvas-sunk:   #0F0E0B;
  --surface:       #1E1C17;
  --surface-alt:   #252219;
  --ink:           #F4F1EA;
  --ink-muted:     #A9A294;
  --ink-faint:     #6E685C;
  --hairline:      #2E2A22;
  --hairline-firm: #3D382E;
  --green:         #7FC9B2;
  --green-soft:    #5FAE97;
  --green-wash:    #16302A;
  --ochre:         #E0A94F;
  --ochre-wash:    #2F2516;
  --clay:          #E08A64;
  --clay-wash:     #2F1A12;
}
```

**Semantic status mapping (never color alone — always pair with a label):**

| Status | Color | Label | Icon |
|---|---|---|---|
| Open / collecting | `--ochre` | "3 of 8 paid" | half-brick |
| Paid in full | `--green` | "Paid in full" | filled square |
| Fulfilled / collected | `--green` | "Collected" | stamp |
| Overdue | `--clay` | "Past collect-by" | outline triangle |
| Refunded | `--ink-muted` | "Refunded" | reverse arrow |
| Verifying | `--ink-muted` | "Checking on-chain…" | pulsing dot |

### 4.2 Type

```css
:root {
  --font-display: "Instrument Serif", "Fraunces", Georgia, serif;
  --font-ui:      "Geist", "Inter", -apple-system, system-ui, sans-serif;
  --font-mono:    "Geist Mono", "JetBrains Mono", ui-monospace, monospace;
}
```

**Strict assignment — this is a rule, not a preference:**

| Face | Used for | Never used for |
|---|---|---|
| **Display serif** | Marketing headlines, screen titles, the one big human sentence per screen | Numbers, buttons, labels, body copy |
| **UI grotesque** | Body, labels, inputs, nav, descriptions | Monetary amounts, hashes |
| **Mono** | All money, all NIM amounts, plan IDs, tx hashes, memo tags, dates, button labels (uppercase, tracked) | Sentences, paragraphs |

**Scale** (mobile → desktop):

| Token | Size / line | Face | Use |
|---|---|---|---|
| `display-xl` | 44/48 → 72/76 | serif | marketing hero |
| `display-l` | 32/36 → 44/48 | serif | screen title |
| `display-m` | 24/30 | serif | section head, sheet title |
| `amount-hero` | 40/44, `tabular-nums`, `-0.02em` | mono | the big "paid so far" number |
| `amount-m` | 20/26, tabular | mono | card amounts, row totals |
| `amount-s` | 15/20, tabular | mono | receipt rows, secondary figures |
| `body` | 17/26 | ui | default body |
| `body-s` | 15/22 | ui | helper text, descriptions |
| `label` | 13/16, `0.08em`, uppercase | mono | field labels, pill text, buttons |
| `caption` | 12/16 | ui | legal, timestamps |

**Minimum body size is 17px.** Do not go to 14px body "to fit more in." Fit less in.

### 4.3 Space, radius, border

```css
:root {
  --s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px;
  --s-5: 24px; --s-6: 32px; --s-7: 48px; --s-8: 64px; --s-9: 96px;

  --r-tile:   12px;  /* item photos */
  --r-card:   16px;  /* plan cards, panels */
  --r-sheet:  24px;  /* bottom sheets — top corners only */
  --r-pill:   999px; /* all buttons, all badges */
  --r-input:  12px;

  --bw: 1px;

  /* Shadow is nearly banned. One elevation only. */
  --lift: 0 1px 2px rgba(20,20,19,.04), 0 8px 24px rgba(20,20,19,.06);
}
```

**Elevation policy:** cards get a `1px --hairline` border and **no shadow**. Only bottom sheets, the QR panel, and toasts may use `--lift`. Depth comes from warm tint and hairlines, not from drop shadows.

### 4.4 Layout

- App screens: `max-width: 420px`, centered, `padding: 0 20px`.
- Marketing / plan share page: `max-width: 1080px` with a 420px mobile column preserved inside.
- Merchant console (desktop, optional): `max-width: 1200px`, 12-col, 24px gutter.
- Base grid: 8pt. Vertical rhythm between sections: `--s-7` mobile, `--s-9` desktop.
- Safe-area-aware sticky bottom CTA bar on all app screens (`env(safe-area-inset-bottom)`).

---

## 5. Signature devices

These four things are what make it *Layby* and not a generic fintech template. Build them with care.

### 5.1 The brick progress (`<PlanProgress>`) — **the hero component**

One brick per installment. Filled = paid, hairline outline = outstanding. Not a bar.

```
┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐
│██││██││██││  ││  ││  ││  ││  │     3 of 8 paid
└──┘└──┘└──┘└──┘└──┘└──┘└──┘└──┘
```

- Brick height 32px (mobile), gap 4px, radius 3px, flexes to fill width.
- Filled: `--green`. Outstanding: transparent with `1px --hairline-firm`. Next-due brick: `1.5px dashed --ochre`.
- **Density rule:** ≤ 12 installments → bricks. 13–24 → thinner bricks (20px tall, 2px gap). > 24 → switch to the tally variant: grouped fives (`||||` crossed) in mono, which reads as a chalk wall count.
- Each brick is a **tap target** → opens that installment's receipt. Outstanding bricks are inert but show a tooltip/sheet with the due date.
- `role="progressbar"` with `aria-valuenow`, plus a visible text label — never bricks alone.
- Fill animation: on load, bricks fill left-to-right with a 40ms stagger, 240ms each, `cubic-bezier(.2,.8,.2,1)`. On a *new* payment, only the newly-paid brick animates — it scales 0.9 → 1 and fills over 320ms. Everything else is already filled, instantly.

### 5.2 The receipt (`<Receipt>`) — **the trust artifact**

A full-width card styled as a till receipt: `--surface`, perforated top and bottom edge (repeating radial-gradient notches), dotted 1px divider rows, everything in mono.

It must list **all six checks, explicitly, as passed/failed rows**:

```
VERIFIED ON-CHAIN
·····························
✓  Transaction found
✓  Recipient is this shop
✓  Memo tag  layby:a7f3c2
✓  Executed successfully
✓  Amount  412.5000 NIM
✓  Not a duplicate
·····························
HASH   7fa2…c91e   [copy] [↗]
```

- Check glyph: a 16px square with a stroke tick, `--verify`. Failed: `--clay` with a cross and a one-line plain-English reason.
- Hash is truncated `first6…last4`, monospace, with copy and block-explorer link.
- A "PAID IN FULL" or "COLLECTED" stamp overlays at ~8° rotation, `--green` at 14% opacity fill with a 1.5px stroke, letterpress feel. **Never animated beyond a 400ms fade-and-settle.**
- Printable: `@media print` strips chrome, keeps the receipt at 80mm width.

### 5.3 The QR panel (`<CollectCode>` / `<PayCode>`)

- Black-on-bone, maximum contrast, **never** a gradient or logo-in-the-middle QR.
- 280px minimum, 24px quiet zone, `--r-card` container, `--lift`.
- Screen brightness is forced to max when a QR is shown (where available).
- Shop name above in `display-m`, instruction below in `body`: "Show this to the shop."
- A live 6-character short code in `amount-m` mono underneath as a fallback when the camera fails. **Always provide the manual fallback** — market lighting defeats scanners.

### 5.4 The shop identity strip (`<ShopHeader>`)

- 4:3 or 16:9 storefront photo, `--r-tile`, with a warm multiply overlay so it never fights the canvas.
- Shop name in `display-m`, locality in `body-s --ink-muted`.
- A small chain-verified seal: a pill, `--green-wash` bg, `--green` text, mono label `VERIFIED ON-CHAIN`.
- If no photo: `--canvas-sunk` tile with a woodcut-style ink illustration of a shopfront (Goldsand's illustration register — black line art, no color, no gradients).

---

## 6. Component library

Build these first. All are mobile-first.

### Buttons
| Variant | Fill | Text | Use |
|---|---|---|---|
| `primary` | `--green` | `--surface` | one per screen, the money action |
| `secondary` | transparent, `1px --hairline-firm` | `--ink` | cancel, back, alternates |
| `accent` | `--ochre` | `#fff` | "Pay in Nimiq Pay" handoff only |
| `ghost` | none | `--ink-muted` | tertiary, text links |
| `danger` | transparent, `1px --clay` | `--clay` | refund, cancel plan |

- Shape: `--r-pill`. Height **56px** mobile / 48px desktop. Full-width on mobile.
- Label: `label` token — mono, uppercase, `0.08em` tracking. e.g. `PAY 412.50 NIM`.
- Press state: `scale(.985)`, 120ms. No hover-only affordances on mobile.
- Loading: label swaps to `WORKING…` with a 3-dot mono ellipsis animation. Never a spinner inside the button that hides the label.
- Disabled: `--canvas-sunk` fill, `--ink-faint` text, and **always** an adjacent one-line reason.

### Input / field
- Label above in `label` token, `--ink-muted`.
- 56px height, `--r-input`, `1px --hairline-firm`, `--surface` fill.
- Focus: border `--green`, plus a 3px `--green-wash` ring. Never a browser-default blue outline.
- Money inputs: `--font-mono`, `inputmode="decimal"`, right-aligned, with a persistent currency suffix chip.
- Error: border `--clay`, message below in `body-s --clay`, with a small triangle glyph.

### Plan card (`<PlanCard>`)
```
┌─────────────────────────────┐
│ [item photo 4:3, r-tile]    │
│                             │
│ Singer sewing machine       │  body, ink
│ Mama Ngozi Fabrics          │  body-s, ink-muted
│                             │
│ ██ ██ ██ ░░ ░░ ░░ ░░ ░░     │  bricks
│                             │
│ 1,237.50 / 3,300.00 NIM     │  amount-m mono
│ ⬤ 3 of 8 paid   Due Fri     │  label + pill
└─────────────────────────────┘
```
`--surface`, `--r-card`, `1px --hairline`, no shadow. Entire card tappable.

### Pill / badge
`--r-pill`, 28px high, `label` token, wash background + solid text from the status table in §4.1. Always carries a glyph **and** a word.

### Bottom sheet
`--r-sheet` on top corners only, `--surface`, `--lift`, 20px grab handle in `--hairline-firm`. Enters 280ms `cubic-bezier(.2,.8,.2,1)`. Backdrop `rgba(20,20,19,.32)`. Used for: confirm payment, installment detail, refund policy, share plan.

### Empty / loading / error states
- **Empty:** woodcut ink illustration (shopfront, parcel, tally wall), one serif line, one `body-s` line, one primary button. Never an emoji.
- **Loading:** skeletons in `--canvas-sunk` with a slow 1.6s shimmer. Never a centered spinner on a full page.
- **Offline:** persistent bar at top, `--ochre-wash` bg, `--ink`, mono label `OFFLINE — SHOWING LAST SAVED`. The plan page must render from cache.
- **Chain check pending:** the receipt renders greyed with `CHECKING ON-CHAIN…` and a pulsing dot. Never show a payment as confirmed before the six checks pass.

---

## 7. Screens

### 7.1 Create plan (merchant)
Single column, one question per block, generous vertical rhythm.

1. Serif `display-l`: "Set up a layby."
2. Item photo upload — big dashed `--r-tile` drop zone, camera-first on mobile.
3. Item name.
4. Price in **local currency** (the merchant thinks in naira/cedis/rand, never in NIM). Below it, a live mono conversion line: `≈ 3,300.0000 NIM · rate locked 10 min` in `amount-s --ink-muted`.
5. Number of installments — a segmented stepper that **previews the bricks live** as you change it, with the per-installment amount in mono underneath. This is the moment the core metaphor is taught.
6. Collect-by date — plain date picker. *(Shown as a neutral field; the app states it, never uses it to pressure.)*
7. Refund policy — a required choice from 2–3 preset options plus free text. Displayed verbatim to the customer later. Non-skippable: this is the honest-design commitment.
8. Sticky primary: `CREATE PLAN`.
9. Success → share sheet: big QR + short link + `COPY LINK` + `SHARE`.

### 7.2 Plan page / pay installment (customer)
The screen most people will see. Must work from a cold link, unauthenticated, on 3G.

1. `<ShopHeader>` with storefront photo and verified seal.
2. Item photo, large, `--r-tile`.
3. Item name in `display-m`.
4. `amount-hero` mono: amount paid. Directly beneath in `amount-s --ink-muted`: `of 3,300.0000 NIM`.
5. `<PlanProgress>` bricks + `3 of 8 paid` label.
6. Next installment card: amount in mono, due date, and the `--ochre` accent button `PAY 412.50 NIM` → hands off to Nimiq Pay with the `layby:<planId>` memo pre-filled.
7. **Memo disclosure**, always visible, never collapsed: a mono line `MEMO  layby:a7f3c2` with a copy button and the plain sentence "This tag is how we match your payment to this plan."
8. Paid installments list — each row tappable to its receipt.
9. Refund policy, verbatim, in a `--canvas-sunk` well.
10. Plain-language honesty block (see §8), always present.
11. When 100%: the next-installment card is replaced by the `<CollectCode>` QR panel and a `PAID IN FULL` stamp settles onto the amount.

### 7.3 Receipt
Full screen, `--canvas`, the `<Receipt>` component centered with air around it. Actions at the bottom: `SHARE`, `COPY HASH`, `VIEW ON EXPLORER`. Back returns to the plan.

### 7.4 Merchant fulfil (scan)
Highest-contrast screen in the app, designed for a counter.

1. Camera viewport fills the screen, with a bone-colored frame cut-out and `--r-card` corners.
2. Instruction in `display-m` over a scrim: "Scan the customer's collect code."
3. Manual entry fallback button: `ENTER CODE INSTEAD` → 6-char mono input.
4. On scan, a confirmation sheet rises: item photo, item name, customer short ID, `PAID IN FULL` stamp, all eight payment hashes listed in mono.
5. Primary `MARK AS COLLECTED` — requires a deliberate press, no swipe-to-confirm (gloves, wet hands, market).
6. Result: full-screen `--green-wash` with a `COLLECTED` stamp, the date in mono, and `DONE`. Holds for 2s minimum so both parties can see it.

---

## 8. Voice & copy

**Register:** shop-counter English. Short declaratives. Second person. No exclamation marks.

**The honesty block** — appears on every plan page, verbatim, never in a collapsed accordion:

> **How your money is held**
> Your payments go straight to the shop's wallet. We don't hold your money and we can't move it.
> We check every payment on the Nimiq chain before counting it, and the books on this page are public.
> If you need a refund, the shop's policy is shown above.

**Word list:**

| Say | Never say |
|---|---|
| plan, layby | contract, escrow, vault |
| payment, installment | tranche, deposit |
| the shop, the seller | the merchant (customer-side), the counterparty |
| paid, outstanding | settled, unsettled, pending liability |
| we checked it on the chain | trustless, verified by smart contract |
| tag / memo | calldata, payload |
| take it home | redeem, claim |

Customer path: **zero** crypto jargon. The word "blockchain" appears at most once, in the honesty block, as "the Nimiq chain." Merchant path may be slightly more technical but still plain.

**Numbers:** NIM to 4 decimals in receipts and chain rows; 2 decimals in UI summaries. Local currency to its normal precision. Always show both when converting, always timestamp the rate: `rate locked 10 min · 14:32`.

---

## 9. Motion

| Event | Treatment |
|---|---|
| Page enter | 160ms opacity only. No slide. |
| Bottom sheet | 280ms `cubic-bezier(.2,.8,.2,1)` translate-Y |
| Brick fill (initial) | 240ms each, 40ms stagger |
| Brick fill (new payment) | single brick, scale .9→1 + fill, 320ms |
| Stamp settle | 400ms fade + 2° rotation settle, once |
| Button press | 120ms `scale(.985)` |
| Chain-check pending | 1.6s pulsing dot, indefinite |

`prefers-reduced-motion: reduce` → all of the above become instant opacity changes. The brick fill becomes a static render.

**Banned:** confetti, parallax, scroll-jacking, number count-up animations on money (a counting number is an unreadable number), looping background gradients, spring bounces on anything financial.

---

## 10. Hard rules (treat as lint)

1. ❌ Pure white `#FFFFFF` as a page background. Use `--canvas`.
2. ❌ Any monetary figure not in `--font-mono` with `tabular-nums`.
3. ❌ A smooth/continuous progress bar for installments.
4. ❌ Status conveyed by color alone.
5. ❌ Drop shadows on cards.
6. ❌ Body text below 17px, or any font-weight below 400.
7. ❌ Hover-only affordances.
8. ❌ Tap targets under 56px on the customer path.
9. ❌ A payment shown as confirmed before all six checks pass.
10. ❌ The words escrow, trustless, vault, or guaranteed anywhere in the product.
11. ❌ Confetti or celebratory animation on plan completion.
12. ❌ Collapsing the refund policy or the memo disclosure behind a toggle.
13. ❌ Deadline/urgency pressure framing ("only 2 days left!"). State the collect-by date neutrally.

---

## 11. Accessibility & field conditions

- WCAG AA minimum; AAA for all monetary figures. Verify `--ochre` on `--surface` (use `--ink` text on `--ochre-wash`, not ochre text on bone, for small sizes).
- Full keyboard path through create-plan and pay flows.
- `aria-live="polite"` on the progress label and on chain-check status.
- Works at 320px width and at 200% browser zoom without horizontal scroll.
- Designed for sunlight: the default light theme is the high-contrast theme. Dark mode is an option, not the hero.
- Target < 120KB initial JS for the plan page; it must be openable from a QR on a slow connection.
- `window.nimiqPay.language` is read for locale; fall back to English. Never block render on locale.

---

## 12. Tailwind config (drop-in)

```js
// tailwind.config.js
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas:   { DEFAULT: 'var(--canvas)', sunk: 'var(--canvas-sunk)' },
        surface:  { DEFAULT: 'var(--surface)', alt: 'var(--surface-alt)' },
        ink:      { DEFAULT: 'var(--ink)', muted: 'var(--ink-muted)', faint: 'var(--ink-faint)' },
        hairline: { DEFAULT: 'var(--hairline)', firm: 'var(--hairline-firm)' },
        green:    { DEFAULT: 'var(--green)', soft: 'var(--green-soft)', wash: 'var(--green-wash)' },
        ochre:    { DEFAULT: 'var(--ochre)', wash: 'var(--ochre-wash)' },
        clay:     { DEFAULT: 'var(--clay)', wash: 'var(--clay-wash)' },
        nimiq:    'var(--nimiq-gold)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans:    ['var(--font-ui)'],
        mono:    ['var(--font-mono)'],
      },
      fontSize: {
        'display-xl': ['2.75rem', { lineHeight: '3rem',    letterSpacing: '-0.02em' }],
        'display-l':  ['2rem',    { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        'display-m':  ['1.5rem',  { lineHeight: '1.875rem',letterSpacing: '-0.01em' }],
        'amount-hero':['2.5rem',  { lineHeight: '2.75rem', letterSpacing: '-0.02em' }],
        'amount-m':   ['1.25rem', { lineHeight: '1.625rem' }],
        'amount-s':   ['0.9375rem',{lineHeight: '1.25rem' }],
        'body':       ['1.0625rem',{lineHeight: '1.625rem' }],
        'body-s':     ['0.9375rem',{lineHeight: '1.375rem' }],
        'label':      ['0.8125rem',{lineHeight: '1rem', letterSpacing: '0.08em' }],
        'caption':    ['0.75rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        tile: 'var(--r-tile)', card: 'var(--r-card)',
        sheet:'var(--r-sheet)', pill: 'var(--r-pill)', input:'var(--r-input)',
      },
      boxShadow: { lift: 'var(--lift)' },
      maxWidth: { app: '420px', page: '1080px' },
    },
  },
}
```

> In this repo the same tokens live in `src/app/globals.css` under Tailwind v4's `@theme inline`, which replaces `tailwind.config.js`.

Utility to apply globally:
```css
.num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
```
Apply `.num` to **every** money/chain figure.

---

## 13. Build order for the 1-day scope

1. Tokens + Tailwind config + the three fonts. (30 min)
2. `<PlanProgress>` and `<Receipt>`. These are the product. (90 min)
3. `<PlanCard>`, `<ShopHeader>`, buttons, inputs, pills, sheet. (90 min)
4. Screen 2 (plan page / pay) — the one that must be perfect. (90 min)
5. Screen 1 (create plan). (60 min)
6. Screen 3 (receipt) — mostly composition of step 2. (30 min)
7. Screen 4 (merchant fulfil / scan). (60 min)
8. Empty / loading / offline / failed-check states. (45 min)
9. Freeze. Last 4 hours: real mainnet runs, demo video, 250-word description, builder story, X + Skool posts.

---

## 14. How the design serves the rubric

- **Real need** — the warm, photographic, non-corporate register signals a market stall, not a trading desk. A shop owner recognizes themselves in it.
- **Clear audience** — two distinct paths with distinct visual weight: merchant screens are denser and more technical; customer screens are large, calm, and jargon-free.
- **Repeat value** — the brick progress is built to be *returned to weekly*. Each visit, one more brick. That is the retention mechanic, rendered.
- **Originality** — bricks-not-bars, the six-check receipt as hero content, and the storefront identity strip are a visual language no "savings jar" app has.
- **Nimiq integration** — the memo tag is surfaced, not hidden; the ochre accent bridges into Nimiq Pay; every verified payment is a receipt the customer can hold.
- **Honest design** — the honesty block, the verbatim refund policy, and the six explicit checks make the absence of escrow a *feature you can see*, which is exactly what Kitty and Kuza were praised for.
