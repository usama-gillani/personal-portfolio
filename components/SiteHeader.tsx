"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "@/components/icons";

const links = [
  { label: "About", href: "/#about", id: "about" },
  { label: "Expertise", href: "/#expertise", id: "expertise" },
  { label: "Work", href: "/#work", id: "work" },
  { label: "Approach", href: "/#approach", id: "approach" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const onCase = pathname.startsWith("/work");
  const [active, setActive] = useState("");

  useEffect(() => {
    const sections = links
      .map((link) => document.getElementById(link.id))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function closeMenu(event: MouseEvent<HTMLAnchorElement>) {
    event.currentTarget.closest("details")?.removeAttribute("open");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-void/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-360 items-center justify-between px-5 py-4 sm:px-8 lg:px-14">
        <a
          href="/#top"
          aria-label="Usama Gillani — back to home"
          className="group flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime"
        >
          <span className="grid size-10 place-items-center bg-lime font-mono text-sm font-bold tracking-tight text-void transition-transform group-hover:-rotate-6">
            UG.
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Usama Gillani
            <span className="mt-0.5 block text-xs font-normal text-ink/50">
              AI Engineer
            </span>
          </span>
        </a>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 md:flex"
        >
          {links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              className={`nav-link ${(onCase ? link.id === "work" : active === link.id) ? "is-active" : ""}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a href="/#contact" className="button-signal hidden sm:inline-flex">
          Let&apos;s talk <ArrowUpRight />
        </a>

        <details className="mobile-menu relative md:hidden">
          <summary
            aria-label="Toggle navigation menu"
            className="grid size-11 cursor-pointer list-none place-items-center rounded-full border border-white/15 transition-colors hover:bg-lime hover:text-void focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime [&::-webkit-details-marker]:hidden"
          >
            <span className="menu-icon" aria-hidden="true">
              <span />
              <span />
            </span>
          </summary>

          <nav
            aria-label="Mobile navigation"
            className="absolute right-0 top-14 z-50 flex w-64 flex-col border border-white/10 bg-surface p-3 shadow-xl"
          >
            {[...links, { label: "Contact", href: "/#contact", id: "contact" }].map(
              (link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={`mobile-nav-link ${(onCase ? link.id === "work" : active === link.id) ? "is-active" : ""}`}
                >
                  {link.label}
                  <ArrowUpRight className="size-4" />
                </a>
              ),
            )}
          </nav>
        </details>
      </div>
    </header>
  );
}
