import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../ui/Button";

export function CTASection() {
  return (
    <section className="max-w-7xl mx-auto px-5 lg:px-8 pb-20 lg:pb-28">
      <motion.div
        className="relative rounded-[28px] overflow-hidden p-10 sm:p-16 text-center"
        style={{ background: "var(--aurora-gradient)" }}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div className="absolute inset-0 noise-veil" />
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-white max-w-xl mx-auto leading-tight">
          Your financial forecast is one click away.
        </h2>
        <p className="text-white/85 mt-4 max-w-md mx-auto">No account. No spreadsheet import. Just open Aurora and see where you actually stand.</p>
        <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
          <Link to="/app">
            <Button size="lg" variant="secondary" className="!bg-white !text-[#171325] hover:!brightness-95 !border-0">
              Launch the live demo →
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
