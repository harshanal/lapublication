# Google Sheet question intake

The Sheet belongs to **harshanal@gmail.com**. Share it with named editors through Google Sheets. Its `Status` dropdown has **New**, **In progress**, and **Answered**. Marking a submitted row **Answered** sets `Answered on`; reopening it clears that date. `Assigned to`, `Answer / reference link` and `Notes` are manual review fields. Changing review fields does not send email.

Native Sheet: https://docs.google.com/spreadsheets/d/1tyOztqEpn_pkO0vWawbWCs-luKcgFvZ0QtjxheBv9ng/edit

For recipient changes in Google mode, update `QUESTION_RECIPIENT` and `QUESTION_COPY` in `Code.gs`, prepare/upload the script and update its deployment version. Keep the FormSubmit fallback recipient settings in `src/lib/listener-questions.ts` consistent.

## Flow

The website submits to `/api/questions`. The server validates a short-lived signed form token, origin, input sizes and a hidden spam trap, then signs the request for a standalone Google Apps Script project. The script rejects unauthenticated writes, applies persistent submission limits, saves the question and sends email to **harshanal@gmail.com** with **ladhammaquestion@gmail.com** in CC. Google credentials and the signing secret never go to the browser. Visitors need no Google account, form activation or CAPTCHA in this mode.

Public library pages remain prerendered. Next.js now serves a small intake API, so use `pnpm start` for production preview; `out` and `scripts/serve-static.mjs` are not the Google-mode deployment. FormSubmit remains the fallback until both Google server settings are present at build time.

## Owner setup

1. Sign in to Google Apps Script as **harshanal@gmail.com**. Enable the Apps Script API in its user settings if using `clasp`, and authorize the Google-maintained `@google/clasp` CLI through its browser login. Keep its credentials outside Git.
2. Create a **standalone** script project. Keep it private; sharing the review Sheet does not require sharing the script project.
3. Run `node scripts/prepare-google-questions.mjs`. It copies the tracked script and manifest to `.library/google-questions` and creates a private random signing secret. It preserves an existing secret on repeated runs. Upload that private directory with `clasp`; do not upload the public source directory alone when using this bootstrap flow.
4. Run `setupQuestionIntake` once in the script editor and complete Google's owner authorization. It checks the Sheet headers, sets the signing secret, creates the internal ledger, installs the answer-date edit trigger and installs a 15-minute pending-mail retry trigger. It does not send a test email. Requested permissions cover spreadsheet access, sending mail and managing this script's triggers.
5. Deploy the script as a web app, **Execute as: Me**, **Who has access: Anyone**, as declared in `appsscript.json`. The public endpoint validates every write with HMAC; do not change `doPost` to accept unsigned payloads. Copy its deployed `/exec` URL, not the editor or `/dev` URL.
6. Add `QUESTIONS_SCRIPT_URL` and `QUESTIONS_SHARED_SECRET` to the linked Vercel project's production environment. Feed the ignored `.library/question-shared-secret.txt` file to `vercel env add QUESTIONS_SHARED_SECRET production --type secret` through stdin; never place its value in command arguments, logs or chat. Set the same values in `.env.local` for local testing. Preserve the existing environment file.
7. Rebuild/deploy, submit one identifiable test on the final public domain, check the new row and both inboxes, and test **Answered → In progress**. Retry the same submission ID to confirm it does not create another row or send duplicate email.

## Delivery and limits

The Sheet is written before email is attempted. If fewer than two email-recipient slots remain, `Email status` stays **Pending** and the trigger retries later. A provider error with an uncertain delivery outcome is marked **Review**; check both inboxes before manually changing that field to **Pending**. A process interrupted while sending is also flagged for review. These cases avoid automatic duplicate email, but Google does not provide a transaction spanning mail delivery and Sheet updates.

Signed submission IDs provide idempotency. Limits are three questions per email in one hour, eight per email in 24 hours, twenty per network in one hour, and one hundred total in 24 hours. Network addresses and email addresses are keyed hashes in the private 48-hour rate ledger; raw network addresses are not stored. Rate limits, signed tokens and the hidden trap deter automated/repeated submissions; they are not human verification and cannot eliminate all determined spam. Keep the Sheet and script private to their intended editors/owner.

Google consumer accounts currently allow 100 email recipients per day for Apps Script, shared with other script use. Two recipients per question permit at most about 50 questions per day before other usage. The expected fewer-than-25 daily questions fit this allowance. Normal Sheets API usage within quotas has no additional API charge; existing Vercel plan limits and Google's changing quotas still apply. See [Google quotas](https://developers.google.com/apps-script/guides/services/quotas) and [Sheets usage limits](https://developers.google.com/workspace/sheets/api/limits).

For a script update, upload the reviewed source and create a new script version, then update the existing deployment ID to preserve its `/exec` URL. Re-run setup only when trigger/config changes require it; setup avoids duplicate triggers. Do not rotate one side of the shared secret without updating the other.
