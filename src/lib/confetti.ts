import confetti from "canvas-confetti";

export function fireGoalConfetti() {
  const colors = ["#2dd4bf", "#8b5cf6", "#ec4899", "#f59e0b", "#34d399"];
  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.6 },
    colors,
    startVelocity: 42,
    scalar: 0.9,
  });
  setTimeout(() => {
    confetti({ particleCount: 50, spread: 100, origin: { y: 0.5 }, colors, scalar: 0.8 });
  }, 180);
}
