/** The honesty block. Verbatim on every plan page, never collapsed. DESIGN.md §8. */
export function HonestyBlock() {
  return (
    <section className="rounded-card border border-hairline bg-surface p-5">
      <h2 className="font-display text-display-m">How your money is held</h2>
      <div className="mt-3 space-y-2 text-body-s text-ink">
        <p>Your payments go straight to the shop&apos;s wallet. We don&apos;t hold your money and we can&apos;t move it.</p>
        <p>We check every payment on the Nimiq chain before counting it, and the books on this page are public.</p>
        <p>If you need a refund, the shop&apos;s policy is shown above.</p>
      </div>
    </section>
  );
}
