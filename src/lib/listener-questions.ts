// FormSubmit sends a one-time activation email to this inbox on first use.
// After activation, its private endpoint token can replace the email in the URL.
export const LISTENER_QUESTIONS = {
  path: "/question",
  thankYouPath: "/question/thank-you",
  endpoint: "https://formsubmit.co/harshanal@gmail.com",
  // FormSubmit fallback copies. Google-mode recipients are in Code.gs.
  copyTo: ["ladhammaquestion@gmail.com"]
};
