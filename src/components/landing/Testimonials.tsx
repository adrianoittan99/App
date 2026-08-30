import { motion } from "framer-motion";

const QUOTES = [
  {
    quote: "The Subscription X-ray found $166 a month I'd completely forgotten about. Canceled two, funded my trip instead.",
    name: "Maya",
    role: "Product designer",
  },
  {
    quote: "Seeing my net worth in 20 years actually move when I change one slider made saving feel real for the first time.",
    name: "Jordan",
    role: "Software engineer",
  },
  {
    quote: "I've tried a lot of budget trackers. Aurora is the first one that tells me something I didn't already know.",
    name: "Priya",
    role: "Small business owner",
  },
];

export function Testimonials() {
  return (
    <section className="max-w-7xl mx-auto px-5 lg:px-8 py-20 lg:py-28">
      <div className="max-w-2xl mb-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)] mb-3">Early feedback</p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl leading-tight">Built with people who were tired of spreadsheets.</h2>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {QUOTES.map((q, i) => (
          <motion.div
            key={q.name}
            className="card p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <p className="text-sm leading-relaxed mb-5">"{q.quote}"</p>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full flex items-center justify-center font-display font-semibold text-sm text-white bg-[image:var(--aurora-gradient)]">
                {q.name[0]}
              </span>
              <div>
                <p className="text-sm font-medium">{q.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{q.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
