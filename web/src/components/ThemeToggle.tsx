import { useState } from "react";

const LIGHT = "lemonade";
const DARK = "forest";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => document.documentElement.dataset.theme === DARK);

  function toggle() {
    const next = isDark ? LIGHT : DARK;
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
    setIsDark(!isDark);
  }

  return (
    <button className="btn btn-ghost btn-sm" onClick={toggle} aria-label="Toggle theme">
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
