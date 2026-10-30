# Library usability and architecture review

Reviewed on 30 October 2026. The recommendation is to retain Next.js, simplify the public website to static pages, keep PDFs in Google Drive, and maintain a JSON catalogue through a local visual editor. A new database or a complete framework rewrite would add complexity without solving a current need.

The verified collection contains 24 publications across six Drive categories. The saved catalogue and the live Drive scan agree; no publications were added or removed during this review. The intended Vercel URL in the old README was not a confirmed deployment. Nothing has been deployed during this work.

## Main findings and changes

| Priority | Finding in the checkout | Result |
| --- | --- | --- |
| Critical | The catalogue, category and publication route files were absent, although the homepage linked to them. | Restored the catalogue, all category pages and every publication page, generated statically. |
| Critical | All saved PDF and thumbnail URLs pointed at missing local files. | PDFs now use public Drive preview and download links. Available covers and first-page images were downloaded and checked locally. |
| High | Reader logs showed different PDF.js and worker versions, preventing documents from opening. | Replaced the custom rendering stack with the Drive viewer, open-in-new-tab and download fallbacks. Removed the unused PDF rendering dependencies. |
| High | Maintenance required manual JSON editing and a scan immediately overwrote the catalogue. | Added a local studio for metadata, visibility, categories, file roles, covers and series; Drive scans preview additions, modifications and removals before applying. |
| High | Thumbnail requests only covered entirely missing images and had no series identity. | Added explicit image-source choices, shared series artwork, cover reference paths and a generation queue that can also improve text-heavy first pages. |
| High | Generated artwork needed a clear publication identity. | Added readable title and part or issue labels directly over generated thumbnails. The same image can identify a series while each part remains distinct. |
| Medium | Browsing offered no shareable filter state or reading list. | Search, category, language, series, sort and grid/list selections are encoded in the URL. Saved publications remain on the same browser without accounts. |
| Medium | The mobile layout hid summaries and some metadata and could crop original covers. | Restored mobile summaries and details, preserved full covers, added touch-sized controls, responsive cards, keyboard focus and skip navigation. |
| Medium | Large original images would waste mobile transfer. | Optimised 28 thumbnail assets to about 0.50 MB combined, from 8.86 MB before optimisation including the new series artwork. |

## Organisation and discovery

Use three separate concepts:

- **Category** describes the kind of publication, initially inherited from the top-level Drive folder.
- **Series** connects recurring publications or related volumes across time. Series assignments are explicit so unrelated files are not grouped by a loose filename guess.
- **Tags** improve metadata search without creating more folders.

The homepage now starts with search, then categories and series. A publication page provides a cover, metadata, reading and download actions, a save-for-later control, and related publications. Both cover-grid and compact-list browsing are available.

The two existing Pabasara Sitha parts demonstrate the series workflow. They share a generated lotus illustration, with the series title and individual part label over the image. Existing original book covers take priority in automatic mode. Sinhala titles are rendered as real text rather than generated pixels.

Metadata quality is the next editorial improvement: many titles still contain print size, revision wording, underscores or dates from source filenames. Most records lack a summary, author and explicit publication date. The editor allows these to be corrected without renaming the PDF or changing its public page link. Dates should be checked against the document; event dates should not automatically become publication dates.

## Maintenance and image generation

The intended flow is **upload or replace in Drive → scan → review changes → apply locally → edit metadata and images → preview → build → deploy**. There is no background polling or automatic AI processing.

The studio reads Drive and writes local project files. New normal PDFs become catalogue candidates. Cover and ignore roles remain explicit where filename inference is ambiguous. A revised Drive file is detected using its modification time rather than file size alone. Duplicate main mappings and duplicate public URL slugs are rejected. Unclear sibling covers are not automatically assigned to multiple publications.

For image generation, use an existing cover as the visual reference where available. For a series, generate one reusable composition and put the issue title, number or date in the thumbnail text fields. The queue includes actual local reference paths. Generate selected requests on demand, inspect the results, and upload or save them to their specified paths. Nineteen current first-page thumbnails are optional candidates for improvement; they already have a working fallback and do not require immediate generation.

## Hosting and cost

| Component | Choice | Reason |
| --- | --- | --- |
| Public website | Static Next.js export on Vercel | No application server or database requests for browsing |
| PDF storage and delivery | Existing public Google Drive collection | Avoids copying roughly 95 MiB of PDFs into every deployment and serving those bytes through Vercel |
| Metadata | Versioned JSON in the project | Appropriate for one maintainer and occasional batches |
| Thumbnails | Optimised static files deployed with the website | Fast, predictable display without expiring Drive thumbnail URLs |
| Administration | Local management studio | No hosted authentication system or server file writes |
| Image generation | Built-in Codex image tool when requested | No runtime paid API dependency in the website |
| Scheduled work | None | All updates are demand driven |

This architecture is designed to fit small usage on free hosting, but a zero-cost outcome depends on traffic and eligibility. Vercel currently includes 100 GB of monthly fast data transfer on Hobby and describes Hobby as limited to personal, non-commercial use. Confirm the library's eligibility before choosing that plan. [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)

Drive is convenient here but can impose download restrictions and its embedded viewer depends on Google availability, public file permissions and browser behaviour. The site always offers separate opening and download links. Google's documented browser-download method is the file's `webContentLink`, which the scan uses when available. [Google Drive download guidance](https://developers.google.com/workspace/drive/api/guides/manage-downloads)

JSON in this design is edited locally and deployed again. It is not writable production storage. The public website works on mobile; the management studio intentionally remains on the maintainer's computer. Remote editing from any device would require an authenticated publishing path, such as a Git-backed editor, or a small backend with durable storage.

## When a database would become useful

Consider Neon through Vercel only when there is a concrete need for multiple editors, immediate remote saves without rebuilding, approval history, user accounts, or synchronised reading progress across devices. Keep PDF files in Drive even then; store only catalogue metadata in the database. None of those requirements currently justifies a database migration or a hosted PDF processing pipeline.

## Verification and remaining work

The catalogue safety tests cover hidden-source retention, category counts, stable links, cover precedence, shared artwork, missing-image fallback, duplicate records, Drive updates and Sinhala search normalisation. The static production build generates every category and publication route. Browser checks passed at 1280 px desktop width and 390 px phone width, with no horizontal overflow in the catalogue, publication page or manager. Sinhala search, language filtering, empty results, grid and list views, saving and removing a publication, and manager metadata saves were exercised. The public Drive PDF viewer displayed page 1 successfully. All 24 exported publication pages and referenced thumbnails exist. Thirteen regression tests, type checking and the static production build pass. Screenshots are saved locally under `.verification`.

The remaining editorial work is to clean source-derived titles, add useful summaries and dates, and generate any selected replacement thumbnails. Before publication, confirm Drive access in the target users' browsers, choose an eligible hosting plan, and resolve the repository's initial Git state. The checkout has no commits or remote and its existing index refers to missing objects; working files are present. No index reset, commit or deployment was performed.

