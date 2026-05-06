import { ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full px-6 md:px-10 py-8 border-t border-white/[0.06] bg-[#0a1628]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <img
            src="/Logo_darkbg2.png"
            alt="TORO"
            className="h-5 w-auto object-contain opacity-60"
          />
          <span>Trustless Oceanic Record of Origin</span>
        </div>
        <div className="flex items-center gap-5 text-sm text-white/30">
          <a
            href="https://preview.cardanoscan.io/tokenPolicy/def68337867cb4f1f95b6b811fedbfcdd7780d10a95cc072077088ea"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-ocean transition-colors no-underline"
          >
            <ExternalLink className="w-3 h-3" />
            Policy
          </a>
          <span className="text-white/10">|</span>
          <span>Cardano Preview</span>
          <span className="text-white/10">|</span>
          <span>CIP-68</span>
        </div>
      </div>
    </footer>
  );
}
