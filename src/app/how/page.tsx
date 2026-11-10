import Link from "next/link";
import { HonestyBlock } from "@/components/honesty";
import { Rule } from "@/components/ui";

export const metadata = { title: "How Layby works" };

const STEPS = [
  {
    who: "The shop",
    title: "Puts an item on layby",
    body: "Item, photo, price in the shop's own money, how many payments, and a refund policy. Layby gives back a QR code and a link.",
  },
  {
    who: "The customer",
    title: "Pays small small",
    body: "Opens the link in Nimiq Pay and pays the next payment in NIM. The rate is locked for 10 minutes so the amount shown is the amount counted.",
  },
  {
    who: "Layby",
    title: "Checks every payment on the chain",
    body: "Six checks before a payment counts: found, sent to this shop, tagged for this plan, executed, the right amount, and not counted before. Each payment gets a receipt.",
  },
  {
    who: "At the counter",
    title: "Takes it home",
    body: "When the last brick fills, the customer's screen shows a collect code. The shop scans it and marks the item collected.",
  },
];

export default function How() {
  return (
    <div className="space-y-8 pt-4">
      <div>
        <h1 className="font-display text-display-l">How Layby works.</h1>
        <p className="mt-3 text-body">
          Layby (layaway) is how many people buy a phone, a sewing machine or school uniforms: the shop holds the item
          and you pay it off over a few weeks. Layby puts the paper card inside Nimiq Pay.
        </p>
      </div>

      <ol className="space-y-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-card border border-hairline bg-surface p-5">
            <p className="num text-label text-ink-muted uppercase">
              {String(i + 1).padStart(2, "0")} · {s.who}
            </p>
            <h2 className="mt-2 font-display text-display-m">{s.title}</h2>
            <p className="mt-2 text-body-s">{s.body}</p>
          </li>
        ))}
      </ol>

      <HonestyBlock />

      <Rule label="Try it on testnet" />
      <ol className="list-decimal space-y-3 pl-5 text-body-s">
        <li>In Nimiq Pay, open the menu and hold Settings for 10 seconds. Choose Testnet.</li>
        <li>Tap Get free NIM on the home screen.</li>
        <li>Open Layby in Mini Apps. Create a plan and tap Use my Nimiq Pay wallet.</li>
        <li>Open the plan link, pay the first payment, and open its receipt.</li>
      </ol>

      <Rule label="What Layby doesn't do" />
      <ul className="list-disc space-y-3 pl-5 text-body-s text-ink-muted">
        <li>It never holds money. Payments go to the shop&apos;s wallet, and the shop&apos;s written refund policy applies.</li>
        <li>It doesn&apos;t take money automatically. You see the next amount and date, and pay when you&apos;re ready.</li>
        <li>Refunds are paid by the shop from its own wallet.</li>
      </ul>

      <Link href="/new" className="btn btn-primary">Create a plan</Link>
    </div>
  );
}
