export function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-display font-bold text-sm bg-[image:var(--aurora-gradient)]">A</span>
          <span className="font-display font-semibold">Aurora</span>
          <span className="text-xs text-[var(--text-faint)] ml-2">— budgeting that forecasts your future</span>
        </div>
        <p className="text-xs text-[var(--text-faint)]">
          Built by <span className="font-medium text-[var(--text-muted)]">Adrian Ibarra</span>
        </p>
      </div>
    </footer>
  );
}
