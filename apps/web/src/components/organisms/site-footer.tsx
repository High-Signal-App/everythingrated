export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--border)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-6 text-[11px] text-[var(--muted-2)]">
        © {new Date().getFullYear()} EverythingRated · POC. Anonymous,
        cookie-bound ratings.
      </div>
    </footer>
  );
}
