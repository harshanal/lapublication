"use client";

import { useEffect, useState, type FormEvent } from "react";

type Props = {
  endpoint: string;
  copyTo: string[];
  returnUrl: string;
};

export function ListenerQuestionForm({ endpoint, copyTo, returnUrl }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [nextUrl, setNextUrl] = useState(returnUrl);
  const googleMode = endpoint === "/api/questions";
  const [challenge, setChallenge] = useState<{ id: string; issuedAt: number; signature: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!googleMode) return;
    const controller = new AbortController();
    setChallenge(null);
    fetch(endpoint, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.ok || !result.challenge) throw new Error("Unavailable");
        setChallenge(result.challenge);
      })
      .catch((reason) => {
        if (reason?.name !== "AbortError") setError("පෝරමය සූදානම් කළ නොහැකි විය. නැවත උත්සාහ කරන්න.");
      });
    return () => controller.abort();
  }, [endpoint, googleMode, attempt]);

  useEffect(() => {
    // Set before submission so React and the native POST use the same return URL.
    setNextUrl(new URL(new URL(returnUrl).pathname, window.location.origin).href);
    // Allow another attempt when returning from the provider using browser Back.
    const reset = (event: PageTransitionEvent) => {
      setSubmitting(false);
      if (googleMode && event.persisted) setAttempt((value) => value + 1);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, [returnUrl, googleMode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    if (googleMode) event.preventDefault();
    if (submitting) {
      event.preventDefault();
      return;
    }

    for (const name of ["name", "email", "topic", "question"]) {
      const field = form.elements.namedItem(name);
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) continue;
      field.value = field.value.trim();
    }

    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }

    setSubmitting(true);
    if (googleMode) {
      setError("");
      const values = new FormData(form);
      try {
        const response = await fetch(endpoint, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challenge, name: values.get("name"), email: values.get("email"), topic: values.get("topic"),
            question: values.get("question"), website: values.get("_honey")
          })
        });
        const result = await response.json();
        if (response.ok && result.ok) { window.location.assign(nextUrl); return; }
        if (result.code === "challenge" || result.code === "conflict") {
          setAttempt((value) => value + 1);
          setError(result.code === "conflict" ? "පෙර යැවීමක් හමු විය. වෙනස් කළ ප්‍රශ්නය යැවීමට මොහොතකින් නැවත Submit කරන්න." : "පෝරමයේ කාලය ඉකුත් වී හෝ ඉතා ඉක්මනින් යොමු කර ඇත. මොහොතකින් නැවත Submit කරන්න.");
        } else if (result.code === "rate_limit") {
          setError("කෙටි කාලයක් තුළ ප්‍රශ්න කිහිපයක් යොමු කර ඇත. කරුණාකර පසුව නැවත උත්සාහ කරන්න.");
        } else {
          setError("ප්‍රශ්නය යොමු කළ නොහැකි විය. ඔබ ලියූ විස්තර මෙහි ඇත. නැවත උත්සාහ කරන්න.");
        }
      } catch {
        setError("සම්බන්ධතාවයේ දෝෂයක් ඇති විය. ඔබ ලියූ විස්තර මෙහි ඇත. නැවත උත්සාහ කරන්න.");
      }
      setSubmitting(false);
    }
    // Native POST preserves FormSubmit's server-verified CAPTCHA flow.
  }

  return (
    <form className="question-form" action={endpoint} method="post" acceptCharset="UTF-8" onSubmit={handleSubmit} aria-describedby={googleMode ? undefined : "question-form-note"}>
      {!googleMode ? <>
      <input type="hidden" name="_subject" value="ශ්‍රාවක ප්‍රශ්න | Shraavaka Prashna" />
      <input type="hidden" name="_template" value="table" />
      <input type="hidden" name="_captcha" value="true" />
      <input type="hidden" name="_next" value={nextUrl} />
      {copyTo.length > 0 ? <input type="hidden" name="_cc" value={copyTo.join(",")} /> : null}
      </> : null}
      <div className="question-honeypot" aria-hidden="true">
        <label htmlFor="question-website">Leave this field empty</label>
        <input id="question-website" type="text" name="_honey" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="question-required-note">සියලු කොටස් පුරවන්න.</p>
      <div className="question-field-pair">
        <div className="question-field">
          <label htmlFor="question-name">නම <span lang="en">Name</span></label>
          <input id="question-name" name="name" type="text" autoComplete="name" required maxLength={120} />
        </div>
        <div className="question-field">
          <label htmlFor="question-email">ඊමේල් ලිපිනය <span lang="en">Email</span></label>
          <input id="question-email" name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} aria-describedby="question-email-help" />
          <p id="question-email-help" className="question-field-help">ඔබව සම්බන්ධ කර ගැනීමට පමණි.</p>
        </div>
      </div>
      <div className="question-field">
        <label htmlFor="question-topic">මාතෘකාව <span lang="en">Topic</span></label>
        <input id="question-topic" name="topic" type="text" required maxLength={160} placeholder="ඔබගේ ප්‍රශ්නයට අදාළ මාතෘකාව" />
      </div>
      <div className="question-field">
        <label htmlFor="question-text">ඔබගේ ප්‍රශ්නය <span lang="en">Your question</span></label>
        <textarea id="question-text" name="question" required minLength={10} maxLength={5000} rows={7} />
      </div>
      <div className="question-submit-area">
        {error ? <p className="question-form-error" role="alert">{error}</p> : null}
        {googleMode && error && !challenge ? <button type="button" className="button-secondary" onClick={() => { setError(""); setAttempt((value) => value + 1); }}>නැවත උත්සාහ කරන්න</button> : null}
        <button className="button-primary question-submit" type="submit" disabled={submitting || (googleMode && !challenge)}>
          {submitting ? "Submitting…" : "Submit"}
        </button>
        {!googleMode ? <p id="question-form-note" className="question-field-help">ස්පෑම් වැළැක්වීමට කෙටි ආරක්ෂක පරීක්ෂාවක් දිස් විය හැක.</p> : null}
        {googleMode ? <noscript>පෝරමය යැවීමට JavaScript සක්‍රිය කරන්න.</noscript> : null}
      </div>
    </form>
  );
}
