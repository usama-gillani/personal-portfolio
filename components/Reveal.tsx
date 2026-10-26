"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  as?: "div" | "section";
  className?: string;
  children: ReactNode;
  id?: string;
  ariaLabelledBy?: string;
};

export default function Reveal({
  as: Tag = "div",
  className = "",
  children,
  id,
  ariaLabelledBy,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      el.classList.add("reveal-in");
      return;
    }

    const markIn = () => {
      el.classList.remove("reveal-wait");
      el.classList.add("reveal-in");
    };

    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > 80;

    if (inView) {
      markIn();
      return;
    }

    el.classList.add("reveal-wait");

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          markIn();
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={`reveal ${className}`}
    >
      {children}
    </Tag>
  );
}
