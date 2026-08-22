import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-b from-[#0a1628] via-[#091426] to-[#050e1a] border-t border-white/[0.06]">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-8">
          {/* Left: Logo and CTA */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <img
                src="/Logo_darkbg2.png"
                alt="TORO"
                className="h-8 w-auto object-contain"
              />
              <span className="text-lg font-semibold text-white">TORO</span>
            </div>
            <Link
              href="/trace"
              className="inline-block px-4 py-2 rounded-lg bg-ocean text-white font-medium text-sm hover:bg-ocean/80 transition-colors no-underline"
            >
              Start Tracing
            </Link>
          </div>

          {/* About TORO */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">About Toro</h3>
            <div className="space-y-3">
              <a href="/#about" className="block text-white/60 hover:text-white text-sm transition-colors no-underline">
                About
              </a>
              <a href="/#team" className="block text-white/60 hover:text-white text-sm transition-colors no-underline">
                Team
              </a>
              <a href="https://solscan.io/account/2cbYretd93guxpURxqhq1UedBtwSHzT2NX6MsrBc4FWc?cluster=devnet" target="_blank" rel="noopener noreferrer" className="block text-white/60 hover:text-ocean text-sm transition-colors no-underline flex items-center gap-1.5">
                Contracts
                <ExternalLink className="w-3 h-3" />
              </a>
              <a href="#" className="block text-white/60 hover:text-white text-sm transition-colors no-underline">
                Investor
              </a>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Social</h3>
            <div className="space-y-3">
              <a href="#" className="block text-white/60 hover:text-white text-sm transition-colors no-underline">
                X / Twitter
              </a>
              <a href="#" className="block text-white/60 hover:text-white text-sm transition-colors no-underline">
                Telegram
              </a>
              <a href="#" className="block text-white/60 hover:text-white text-sm transition-colors no-underline">
                Discord
              </a>
              <a href="#" className="block text-white/60 hover:text-white text-sm transition-colors no-underline">
                GitHub
              </a>
            </div>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Contact Us</h3>
            <div className="space-y-3">
              <a href="mailto:hello@toro.io" className="block text-white/60 hover:text-ocean text-sm transition-colors no-underline">
                Email
              </a>
              <a href="#" className="block text-white/60 hover:text-white text-sm transition-colors no-underline">
                Support
              </a>
              <a href="#" className="block text-white/60 hover:text-white text-sm transition-colors no-underline">
                FAQs
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="border-t border-white/[0.06]" />

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
        <p>© {new Date().getFullYear()} TORO. All rights reserved.</p>
        <div className="flex items-center gap-4 text-xs">
          <span>Arbitrum Sepolia Testnet</span>
          <span className="text-white/10">•</span>
          <span>Soulbound NFT Traceability</span>
        </div>
      </div>
    </footer>
  );
}
