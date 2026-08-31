import { useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput(props: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : "password"}
        className={`w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] pl-3.5 pr-14 py-2.5 text-sm outline-none focus:border-[var(--violet)] ${props.className ?? ""}`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}
