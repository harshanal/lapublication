import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ස්තුතියි | Thank you",
  robots: { index: false, follow: true }
};

export default function QuestionThankYouPage() {
  return (
    <main id="main-content" className="app-shell question-shell">
      <section className="question-card question-thanks" aria-labelledby="thanks-title">
        <span className="question-thanks-icon" aria-hidden="true">✓</span>
        <p className="eyebrow" lang="en">Shraavaka Prashna</p>
        <h1 id="thanks-title">ඔබගේ ප්‍රශ්නය යොමු කළා. ස්තුතියි!</h1>
        <p>ඔබගේ ප්‍රශ්නයට ඉදිරි කාලයේදී දේශනාවක් තුළදී හෝ ලොව්තුරු අරණ සදහම් පුස්තකාලයේ ලිපියක් ලෙස පිළිතුරු ලැබෙනු ඇත.</p>
        <p>තෙරුවන් සරණයි!</p>
        <Link className="button-primary" href="/">මුල් පිටුවට</Link>
      </section>
    </main>
  );
}
