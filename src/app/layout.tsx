import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ලොව්තුරු අරණ ප්‍රකාශන",
    template: "%s | ලොව්තුරු අරණ ප්‍රකාශන"
  },
  description: "ලොව්තුරු අරණ සදහම් පොත්, පත්‍රිකා සහ ලිඛිත දේශනා නාමාවලිය."
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="si">
      <body>
        <a className="skip-link" href="#main-content">අන්තර්ගතයට යන්න</a>
        <header className="app-header">
          <Link className="brand-lockup" href="/" aria-label="ලොව්තුරු අරණ ප්‍රකාශන මුල් පිටුව">
            <Image src="/lowthuruarana-icon.jpg" alt="" aria-hidden="true" width={44} height={44} priority />
            <span>
              <strong>ලොව්තුරු අරණ ප්‍රකාශන</strong>
              <small>සදහම් පුස්තකාලය</small>
            </span>
          </Link>
          <nav className="main-nav" aria-label="ප්‍රධාන සංචාලනය">
            <Link href="/publications">සියලු ප්‍රකාශන</Link>
            <Link href="/publications?saved=1">♡ Saved</Link>
            <a href="https://lowthuruarana.net/">ප්‍රධාන වෙබ් අඩවිය</a>
          </nav>
        </header>
        {children}
        <footer className="app-footer">
          <span>ලොව්තුරු අරණ සදහම් ප්‍රකාශන නාමාවලිය</span>
          <a href="https://lowthuruarana.net/">lowthuruarana.net</a>
        </footer>
      </body>
    </html>
  );
}
