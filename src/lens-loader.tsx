export default function LensLoader({ label = 'Opening workspace' }: { label?: string }) {
  return <div className="t-lens-loader" role="status" aria-live="polite">
    <div className="t-lens-orbit" aria-hidden="true"><img src="/brand/telisik-lens.png" width="96" height="96" alt="" /></div>
    <span className="t-lens-wordmark" aria-hidden="true">TELISIK</span>
    <p>{label}<span aria-hidden="true">…</span></p>
  </div>;
}
