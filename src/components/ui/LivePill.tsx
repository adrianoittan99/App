/** Shown only while browsing a past month, on cards that always reflect today regardless. */
export function LivePill() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--teal)]/15 text-[var(--teal)] shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)]" />
      Always today
    </span>
  );
}
