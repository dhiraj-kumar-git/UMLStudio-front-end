import React, { useEffect } from "react";
import "./GlobalClickEffect.css";

const GlobalClickEffect: React.FC = () => {
  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      try {
        const t = ev.target as HTMLElement | null;
        if (!t) return;
        // find closest clickable element: button tag or element with .btn or .button class
        const btn = t.closest("button, .btn, .button") as HTMLElement | null;
        if (!btn) return;
        // create ripple
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement("span");
        ripple.className = "gclick-ripple";
        const size = Math.max(rect.width, rect.height) * 1.2;
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        const x = ev.clientX - rect.left - size / 2;
        const y = ev.clientY - rect.top - size / 2;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        // append
        btn.style.position = btn.style.position || "relative";
        btn.appendChild(ripple);
        // remove after animation
        setTimeout(() => {
          try { ripple.remove(); } catch {};
        }, 600);
      } catch (err) {}
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);
  return null;
};

export default GlobalClickEffect;