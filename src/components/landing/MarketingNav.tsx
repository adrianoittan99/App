import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { Button } from "../ui/Button";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#compare", label: "Why Aurora" },
];

export function MarketingNav() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all ${scrolled ? "glass border-b border-[var(--border)]" : ""}`}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 flex items-center justify-between h-16">
        <a href="#top" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-display font-bold bg-[image:var(--aurora-gradient)]">A</span>
          <span className="font-display font-bold text-lg">Aurora</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="w-9 h-9 rounded-full hidden sm:flex items-center justify-center bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors text-sm" aria-label="Toggle theme">
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <Link to="/login" className="hidden sm:inline text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            Sign in
          </Link>
          <Link to="/app">
            <Button size="sm">Launch demo</Button>
          </Link>
          <button className="md:hidden w-9 h-9 rounded-full flex items-center justify-center bg-[var(--surface-2)] text-sm" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="md:hidden px-5 pb-4 flex flex-col gap-3">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-sm font-medium text-[var(--text-muted)]">
              {l.label}
            </a>
          ))}
          <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-[var(--text-muted)]">
            Sign in
          </Link>
        </nav>
      )}
    </header>
  );
}
