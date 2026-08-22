"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide navbar on trace detail pages
  if (pathname.startsWith("/trace/")) return null;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a1628]/70 backdrop-blur-md border-b border-white/[0.06]"
          : "bg-[#0a1628]/40 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline">
          <img
            src="/Logo_darkbg2.png"
            alt="TORO"
            className="h-10 w-auto object-contain"
          />
          <span className="text-xl font-semibold tracking-tight text-white hidden sm:inline">
            TORO
          </span>
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm">
          <Link
            href="/"
            className={`transition-colors no-underline font-medium ${
              pathname === "/"
                ? "text-white"
                : "text-white/50 hover:text-white"
            }`}
          >
            Home
          </Link>
          <a
            href="/#docs"
            className="transition-colors no-underline font-medium text-white/50 hover:text-white"
          >
            Docs
          </a>
          <a
            href="/#about"
            className="transition-colors no-underline font-medium text-white/50 hover:text-white"
          >
            About
          </a>
          <a
            href="/#team"
            className="transition-colors no-underline font-medium text-white/50 hover:text-white"
          >
            Team
          </a>
          <Link
            href="/trustgraph"
            className={`transition-colors no-underline font-medium ${
              pathname === "/trustgraph"
                ? "text-white"
                : "text-white/50 hover:text-white"
            }`}
          >
            Review Graph
          </Link>
        </div>

        {/* Right CTAs */}
        <div className="flex items-center gap-3">
          <a
            href="https://solscan.io/account/2cbYretd93guxpURxqhq1UedBtwSHzT2NX6MsrBc4FWc?cluster=devnet"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex px-4 py-2 rounded-lg border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20 transition-all text-sm font-medium no-underline"
          >
            Contracts
          </a>
          <Link
            href="/trace"
            className="px-5 py-2 rounded-lg bg-ocean text-white font-medium text-sm hover:bg-ocean/80 transition-colors no-underline"
          >
            Start Tracing
          </Link>
        </div>
      </div>
    </nav>
  );
}
