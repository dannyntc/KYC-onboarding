// Shown under the top bar on the online demo, where every saving button is switched off.
export function LookOnlyBanner() {
  return (
    <div className="lookonly-banner" role="note" data-testid="look-only-banner">
      <strong>You&apos;re viewing the online demo.</strong> Everything is visible, but saving is turned off. Follow the
      guided tour, or run it locally to try every button.
    </div>
  );
}

// Small note placed under a group of buttons that are switched off in the online demo.
export function LookOnlyCaption() {
  return <p className="muted lookonly-note">Disabled in the online demo</p>;
}
