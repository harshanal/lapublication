import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { LISTENER_QUESTIONS } from "@/lib/listener-questions";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "si_LK",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: "/library/generated/buddha-hero.png", alt: SITE_NAME }]
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/library/generated/buddha-hero.png"]
  }
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
            <Link className="button-primary nav-question-link" href={LISTENER_QUESTIONS.path}>ශ්‍රාවක ප්‍රශ්න</Link>
            <Link href="/publications">සියලු ප්‍රකාශන</Link>
            <Link href="/publications?saved=1">♡ Bookmark</Link>
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
