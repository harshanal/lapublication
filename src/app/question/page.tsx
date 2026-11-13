import type { Metadata } from "next";
import Link from "next/link";
import { ListenerQuestionForm } from "@/components/ListenerQuestionForm";
import { LISTENER_QUESTIONS } from "@/lib/listener-questions";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const title = "ශ්‍රාවක ප්‍රශ්න | Shraavaka Prashna";
const description = "ධර්ම ශ්‍රවණයේදී හෝ කියවීමේදී මතු වූ ඔබගේ ප්‍රශ්න අප වෙත යොමු කරන්න. Send us your Dhamma questions.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: LISTENER_QUESTIONS.path },
  openGraph: { title, description, url: LISTENER_QUESTIONS.path, siteName: SITE_NAME, locale: "si_LK", type: "website" },
  twitter: { card: "summary", title, description }
};

export default function ListenerQuestionsPage() {
  const googleIntakeReady = Boolean(process.env.QUESTIONS_SCRIPT_URL && process.env.QUESTIONS_SHARED_SECRET);
  return (
    <main id="main-content" className="app-shell question-shell">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">මුල් පිටුව</Link><span aria-hidden="true">/</span><span aria-current="page">ශ්‍රාවක ප්‍රශ්න</span></nav>
      <section className="question-card" aria-labelledby="question-title">
        <div className="question-intro">
          <p className="eyebrow" lang="en">Shraavaka Prashna</p>
          <h1 id="question-title">ශ්‍රාවක ප්‍රශ්න</h1>
          <p>ධර්ම ශ්‍රවණයේදී හෝ කියවීමේදී මතු වූ ඔබගේ ප්‍රශ්න අප වෙත යොමු කරන්න.</p>
        </div>
        <ListenerQuestionForm endpoint={googleIntakeReady ? "/api/questions" : LISTENER_QUESTIONS.endpoint} copyTo={LISTENER_QUESTIONS.copyTo} returnUrl={`${SITE_URL}${LISTENER_QUESTIONS.thankYouPath}`} />
      </section>
    </main>
  );
}
