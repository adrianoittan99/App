import { motion } from "framer-motion";
import type { MoneyWeather } from "../../lib/types";
import { Card } from "../ui/Card";

const SKY: Record<MoneyWeather["kind"], string> = {
  sunny: "linear-gradient(180deg, #2b6cb0 0%, #4fa3d1 45%, #8fd7c4 100%)",
  "partly-cloudy": "linear-gradient(180deg, #35507a 0%, #5b7ba8 60%, #93a9c4 100%)",
  cloudy: "linear-gradient(180deg, #3a3f52 0%, #565c73 60%, #7a8095 100%)",
  stormy: "linear-gradient(180deg, #14151f 0%, #24263a 55%, #34364e 100%)",
  rainbow: "linear-gradient(180deg, #1c2a52 0%, #37518f 50%, #6f8fc9 100%)",
};

export function MoneyWeatherCard({ weather }: { weather: MoneyWeather }) {
  return (
    <Card className="!p-0 overflow-hidden relative" delay={0}>
      <div className="relative h-52 overflow-hidden" style={{ background: SKY[weather.kind] }}>
        <div className="absolute top-4 left-5 right-5 z-10 flex items-start justify-between gap-3">
          <div className="max-w-[62%]">
            <p className="text-white/70 text-xs uppercase tracking-wide font-medium">Money Weather</p>
            <p className="text-white font-display font-bold text-xl mt-0.5 drop-shadow-sm leading-snug">{weather.headline}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-white font-display font-bold text-3xl tabular leading-none">{weather.temperature}°</p>
            <p className="text-white/60 text-[10px] mt-1 uppercase tracking-wide">financial climate</p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 top-16">
          <WeatherScene kind={weather.kind} />
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{weather.detail}</p>
      </div>
    </Card>
  );
}

function WeatherScene({ kind }: { kind: MoneyWeather["kind"] }) {
  if (kind === "sunny") {
    return (
      <>
        <motion.div
          className="absolute rounded-full"
          style={{ width: 90, height: 90, right: 40, top: 30, background: "radial-gradient(circle, #ffe08a 0%, #ffcf5c 60%, transparent 75%)", boxShadow: "0 0 60px 20px rgba(255,207,92,0.5)" }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <Cloud x={20} y={95} scale={0.7} opacity={0.5} duration={16} />
      </>
    );
  }
  if (kind === "partly-cloudy") {
    return (
      <>
        <motion.div
          className="absolute rounded-full"
          style={{ width: 70, height: 70, right: 55, top: 24, background: "radial-gradient(circle, #ffe9ab 0%, #ffcf5c 60%, transparent 75%)" }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <Cloud x={10} y={70} scale={1} duration={18} />
        <Cloud x={150} y={100} scale={0.7} duration={14} delay={2} />
      </>
    );
  }
  if (kind === "cloudy") {
    return (
      <>
        <Cloud x={0} y={40} scale={1.1} duration={20} />
        <Cloud x={140} y={80} scale={0.9} duration={16} delay={1.5} />
        <Cloud x={70} y={110} scale={0.7} duration={22} delay={3} />
      </>
    );
  }
  if (kind === "stormy") {
    return (
      <>
        <Cloud x={0} y={20} scale={1.2} dark duration={20} />
        <Cloud x={130} y={40} scale={1} dark duration={17} delay={1} />
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-[2px] h-4 bg-[var(--blue)]/70 rounded-full"
            style={{ left: `${8 + i * 9}%`, top: 60 }}
            animate={{ y: [0, 90], opacity: [0, 1, 0] }}
            transition={{ duration: 1 + (i % 3) * 0.2, repeat: Infinity, delay: i * 0.15, ease: "linear" }}
          />
        ))}
        <motion.div
          className="absolute inset-0 bg-white/20"
          animate={{ opacity: [0, 0, 0.5, 0, 0, 0, 0.3, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
      </>
    );
  }
  // rainbow
  return (
    <>
      <motion.svg
        className="absolute left-1/2 -translate-x-1/2 -bottom-6"
        width="260"
        height="130"
        viewBox="0 0 260 130"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
      >
        {[
          "#f43f5e",
          "#f59e0b",
          "#facc15",
          "#34d399",
          "#60a5fa",
          "#8b5cf6",
        ].map((color, i) => (
          <path
            key={color}
            d="M10 130 A120 120 0 0 1 250 130"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            transform={`translate(0 ${i * 9}) scale(${1 - i * 0.035})`}
            style={{ transformOrigin: "130px 130px" }}
            opacity={0.9}
          />
        ))}
      </motion.svg>
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-white"
          style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 80}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4] }}
          transition={{ duration: 2 + (i % 4) * 0.4, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </>
  );
}

function Cloud({ x, y, scale = 1, dark = false, duration = 16, delay = 0, opacity = 1 }: { x: number; y: number; scale?: number; dark?: boolean; duration?: number; delay?: number; opacity?: number }) {
  const color = dark ? "#4a4d63" : "#ffffff";
  return (
    <motion.div
      className="absolute"
      style={{ left: x, top: y, opacity }}
      animate={{ x: [0, 26, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <svg width={90 * scale} height={44 * scale} viewBox="0 0 90 44">
        <ellipse cx="30" cy="26" rx="26" ry="16" fill={color} opacity="0.9" />
        <ellipse cx="55" cy="20" rx="22" ry="18" fill={color} />
        <ellipse cx="70" cy="28" rx="18" ry="13" fill={color} opacity="0.9" />
      </svg>
    </motion.div>
  );
}
