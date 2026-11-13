# Lowthuru Arana library

A Sinhala-first publication library with a fully static public website and a local management studio. PDFs stay in Google Drive. Catalogue metadata is versionable JSON; covers and generated thumbnails are small static assets. There is no database, scheduled sync, hosted admin backend or runtime AI dependency.

Read [REVIEW.md](REVIEW.md) for the review findings, architecture decisions, cost assumptions and remaining work. No Vercel deployment has been made as part of this review.

## Run locally

Use Node.js 22.12 or later and pnpm. Install dependencies with `pnpm install`. Copy `.env.example` to `.env.local` if needed; an existing `.env.local` should be preserved.

```powershell
pnpm dev
```

Open http://127.0.0.1:3012 for the public library. In a second terminal:

```powershell
pnpm manage
```

Open http://127.0.0.1:3013 for the management studio. It binds only to this computer and is never included in the public static deployment. The public website adapts to desktop, tablet and phone widths; the local manager also has a narrow-screen layout.

## Update publications

1. Add new PDFs to [02 – Incoming PDFs](https://drive.google.com/drive/folders/19uQcNti6reAQDPQb9mKOo2G8ujzJZWHc) while preparing their names, metadata and covers. Move approved PDFs into the matching category inside [01 – Published Library](https://drive.google.com/drive/folders/13c8bRvGo7Q8PXgodwPIULewzQfsjP0Nq). Its top-level folders become website categories; nested folders are scanned recursively. Use Drive's file-version replacement to retain the same file ID when revising an existing publication.
2. Open the manager and choose **Scan Drive**. Review added, updated and missing files.
3. Choose **Apply this scan locally**. Missing files require an explicit acknowledgement. Only thumbnails are downloaded; the original PDFs remain in Drive. No Drive files are modified or deleted.
4. Select publications to edit titles, summaries, language, dates, categories, search tags, series, visibility or featured status. Saves update the local catalogue immediately. Existing public URL slugs are preserved when titles change.
5. Check the public preview. Run the tests and production build before publishing.

The complete file structure is under [Dhamma Library – Managed Collection](https://drive.google.com/drive/folders/1rVYKcpBQCZWQM3ayd1FLfIXlyh1LUOzB). Publication PDFs come only from **01 – Published Library**. Original covers, generated thumbnails and reusable series artwork belong under [03 – Covers and Thumbnails](https://drive.google.com/drive/folders/18KFQE__ScMFYZijBBkAfcnC2NaEsQxg0); this asset tree does not create publications. Replaced files belong in **04 – Archive**.

The scanner uses a Drive API key stored only in `.env.local`. Enable the Google Drive API for that key's project and give anyone with the link viewer access to **01 – Published Library** and **03 – Covers and Thumbnails**. Private Drive documents require a different authentication design; do not place private material in these public catalogue folders.

The optional Google Sheet mechanism from the previous prototype has been retired in favour of the local visual editor. If `GOOGLE_CATALOG_SHEET_ID` is set, the scan stops with a migration message instead of silently discarding Sheet metadata. This checkout has no configured catalogue Sheet.

## Covers and series artwork

The automatic thumbnail priority is **original cover → individual generated image → shared series image → PDF first page**. You can explicitly choose a different source for each publication. The manager's **Drive files** panel sets file roles to main, cover or ignore. Associate a separate cover file with its publication; scan again after changing file roles or explicit cover IDs.

For recurring newsletters, monthly issues or multiple parts, create a series and assign its publications. Generate or upload one shared image, select **Shared series image**, and set a short **Thumbnail title** plus a **Part, issue or date**. These labels appear directly over the generated artwork as readable website text. They can differ for each issue while the art stays recognisable. Original cover lettering is preserved.

**Prepare image requests** writes `src/data/thumbnail-queue.generated.json`. Each request records its destination, prompt and any local cover-reference images. Ask Codex to generate selected requests using the built-in image tool. This workflow uses your available image-generation allowance; it does not require a paid image API in the website. Costs and limits of your Codex account still apply.

Generated images can be uploaded through the manager or saved to the queue's exact path. Use PNG files. Before rebuilding after saving files directly:

```powershell
pnpm images:optimize
pnpm catalogue:build
pnpm thumbnails:queue
```

Original book covers do not enter the default generation queue. First-page scans are offered for optional improvement. Review the title, publication context and any reference cover before generating; filenames alone are not enough to infer detailed content. Keep generated artwork symbolic and respectful. Titles, part numbers and dates are rendered by the website, avoiding generated Sinhala lettering errors.

The `pabasara-sitha` series demonstrates this with parts I and II. Its generated artwork and prompt provenance are saved in the project. Image uploads retain a local backup of the previous image under `.library/image-history`.

## Files and safeguards

| File or folder | Purpose |
| --- | --- |
| `src/data/library.source.json` | Last applied Drive inventory, including records hidden from the public catalogue |
| `src/data/catalog.overrides.json` | Editorial metadata, series definitions, cover choices and source file roles |
| `src/data/library.generated.json` | Derived public catalogue; do not edit directly |
| `src/data/thumbnail-queue.generated.json` | Selected generation candidates and reference paths |
| `public/library/thumbnails` | Small cached Drive covers and first-page images |
| `public/library/generated` | Individual generated images |
| `public/library/series` | Reusable series artwork |
| `.library` | Ignored local scan previews, thumbnail cache signatures and image backups |

A scan previews changes without replacing the published catalogue. Apply requires a scan less than an hour old, unchanged source configuration, and explicit acceptance of removals. Metadata writes use temporary files and rename. A failed Drive scan leaves the previous catalogue intact. Thumbnail failures produce warnings and fallbacks; missing image paths are not published. Hiding a publication retains its source record for later restoration.

The manager accepts writes only from its own local origin and serialises mutations. It has no public API in the deployed site. Keep `.env.local`, `.library`, and local image history out of Git. Commit the source inventory, overrides, public catalogue and all used image assets together.

## Listener questions — Shraavaka Prashna

The prominent **ශ්‍රාවක ප්‍රශ්න** button in the top menu and the homepage text link **ඔබට දහම් ප්‍රශ්නයක් ඇත්නම් යොමු කරන්න.** below the publication search link to `/question`, a mobile-friendly form with Sinhala/English labels for name, email, topic and a free-text question. Instructions are in Sinhala and the button is labelled **Submit**. Once deployed, other websites can link directly to `https://lapublication.vercel.app/question`; no library account or prior visit is needed. Use the same path on a future custom domain.

The form uses [FormSubmit](https://formsubmit.co/) to email submissions to **harshanal@gmail.com**, with a duplicate copy to **ladhammaquestion@gmail.com**, preserving the static export without a backend, API key or database. The sender's email becomes Reply-To. Visitors submit a normal POST, complete FormSubmit's security check if prompted, and return to `/question/thank-you` on the same host. No success message is shown locally before the provider accepts the submission. With JavaScript disabled, the native form still works and returns to the canonical production domain.

**One-time setup before sharing the form:**

1. Open the form on the local HTTP preview or deployed site, submit an identifiable test question, and complete FormSubmit's CAPTCHA if shown.
2. Open the activation email sent to **harshanal@gmail.com** (check Spam too) and confirm that this inbox may receive submissions from the form. Only the inbox owner does this; listeners never verify their email or create an account. Activation may be needed again for another website origin or a changed recipient.
3. Submit another test and check that its name, email, topic and question arrive correctly, including Sinhala text, and that replying targets the listener. Do this on the final public domain before launch; a local test does not verify production delivery.

The local preview was activated and a test email was received on 13 November 2026; Gmail placed it in Spam. Mark the message **Not spam** and check delivery again on the public domain. CAPTCHA reduces unwanted submissions but does not determine inbox placement. If Gmail continues classifying legitimate submissions as spam, an inbox filter or a mail provider with a verified sending domain may be needed.

Recipient settings live in `src/lib/listener-questions.ts`. Change `endpoint` to change the primary recipient, or add addresses to `copyTo` to CC additional recipients, then rebuild and redeploy. FormSubmit also supplies a random endpoint token after activation; replace the email portion of `endpoint` with that token to hide the primary inbox address from page source. These are public form settings, not secrets.

Spam protection includes FormSubmit's server-verified reCAPTCHA (kept enabled), its `_honey` spam-trap field, browser validation and field-length limits. The submit button also prevents accidental double clicks while navigating. Browser checks are usability safeguards; they do not provide a server-side submission quota or stop a determined human spammer. Keep CAPTCHA enabled and use the regular POST endpoint; AJAX delivery does not provide the same CAPTCHA flow. See the [FormSubmit documentation](https://formsubmit.co/documentation).

Submissions contain personal information and pass through FormSubmit before reaching the recipients' email inboxes. No questions or email addresses are stored in this repository or the site's static hosting. FormSubmit documents a 30-day submission archive; review its [privacy policy](https://formsubmit.co/privacy.pdf) before public launch.

## Checks and production preview

```powershell
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

`pnpm build` rebuilds the catalogue from the source inventory and overrides, then generates static output in `out`. It never scans Drive or generates images. `pnpm start` serves the static output on http://127.0.0.1:3012; stop the development server first to free that port.

## Vercel setup when ready

Import the repository as a Next.js project in Vercel. Use the repository's `pnpm build` command and the static export produced by Next.js. No production environment variables, database or cron jobs are required. All public pages are generated in advance.

The current working directory has no initial Git commit or remote, and read-only Git verification reports missing objects in the existing index. Preserve the working files and resolve that repository state before setting up Git-based deployment. Do not reset or discard the staged files. This review did not change the Git index or publish anything.
