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

  useEffect(() => {
    // Set before submission so React and the native POST use the same return URL.
    setNextUrl(new URL(new URL(returnUrl).pathname, window.location.origin).href);
    // Allow another attempt when returning from the provider using browser Back.
    const reset = () => setSubmitting(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, [returnUrl]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
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
    // Native POST preserves FormSubmit's server-verified CAPTCHA flow.
  }

  return (
    <form className="question-form" action={endpoint} method="post" acceptCharset="UTF-8" onSubmit={handleSubmit} aria-describedby="question-form-note">
      <input type="hidden" name="_subject" value="ශ්‍රාවක ප්‍රශ්න | Shraavaka Prashna" />
      <input type="hidden" name="_template" value="table" />
      <input type="hidden" name="_captcha" value="true" />
      <input type="hidden" name="_next" value={nextUrl} />
      {copyTo.length > 0 ? <input type="hidden" name="_cc" value={copyTo.join(",")} /> : null}
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
        <button className="button-primary question-submit" type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit"}
        </button>
        <p id="question-form-note" className="question-field-help">ස්පෑම් වැළැක්වීමට කෙටි ආරක්ෂක පරීක්ෂාවක් දිස් විය හැක.</p>
      </div>
    </form>
  );
}
