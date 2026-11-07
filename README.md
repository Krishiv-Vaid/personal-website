# krishvaid.me

Krishiv Vaid’s personal site: physics, electronics, and software. Quiet typography, monochrome light/dark themes, static HTML, and space for real photographs and engineering documentation.

## Development

Python 3.10+ generates HTML using only the standard library. Node 20+ runs counter tests. There are no website runtime dependencies, package installation, or framework requirements.

```sh
python3 scripts/build.py
python3 scripts/check.py
node --test tests/*.test.mjs
node --check js/main.js
node --check js/theme.js
python3 -m http.server 8000
```

Visit http://localhost:8000. Build again after editing data; refresh the browser. HTML content and navigation work without JavaScript. JavaScript handles themes, photo viewing, the year, and the optional counter. All paths are root-relative for the custom domain.

## Content editing

Edit `data/` then run the build and checks. Generated HTML is committed so the existing GitHub Pages deployment needs no new build workflow.

- `profile.json`: introduction, interests, email, resume PDF path, counter endpoint.
- `socials.json`: link labels and URLs.
- `education.json`: verified institution, major, minor. Graduation is intentionally unspecified.
- `experience.json`: organization, role, status (`current` or `past`), dates, description, optional URL, responsibility/result arrays, and optional image objects.
- `projects.json`: software projects.
- `hardware.json`: hardware projects, with the same schema.
- `gallery.json`: all portrait, personal and project photographs.
- `notes.json`: published Markdown note index.

For experience, add an entry matching the existing examples. Empty dates or responsibilities are omitted. Add results only when verified. An organization URL can be null. Do not guess websites or dates.

### Projects and hardware write-ups

Add this shape to the appropriate JSON array. This is an authoring example, not a published project:

```json
{
  "slug": "your-build",
  "name": "Your actual build name",
  "category": "hardware",
  "description": "What you built and the problem it solves.",
  "stack": ["Confirmed component or technology"],
  "repository": null,
  "demo": null,
  "images": [],
  "sections": [
    {"title": "What it does", "text": "..."},
    {"title": "Components & materials", "text": "..."},
    {"title": "Circuit design", "text": "..."},
    {"title": "Programming & implementation", "text": "..."},
    {"title": "Testing & debugging", "text": "..."},
    {"title": "Results & what I learned", "text": "..."}
  ],
  "files": [{"label": "Schematic PDF", "url": "/public/files/your-schematic.pdf"}]
}
```

Omit unneeded sections and file links. The build creates `/projects/your-build.html`. Multiple photographs can be associated with its slug in the gallery. `demo` may link to an actual demonstration video. For software, include problem, implementation, test results, screenshots, repository, and demo where available. Use `category: "software"`.

### Photographs

Use real images only. Folders:

- `public/images/profile/`: portrait.
- `public/images/personal/`: university, events, everyday life.
- `public/images/hardware/`: circuits and physical builds.
- `public/images/projects/`: software screenshots and project images.

Export optimized WebP or JPEG, preferably 1200px maximum long edge and under 250KB. Remove location/EXIF metadata before uploading. Add an entry to `data/gallery.json`:

```json
{
  "path": "public/images/profile/krish.webp",
  "alt": "Describe the actual photograph of Krishiv",
  "caption": "Optional real caption",
  "category": "profile",
  "project": null,
  "order": 1,
  "width": 800,
  "height": 1000,
  "srcset": "/public/images/profile/krish-small.webp 400w, /public/images/profile/krish.webp 800w"
}
```

Use real intrinsic width/height; `srcset` is optional and every listed file must exist. The first profile entry replaces the labeled portrait placeholder. Categories `personal` and `hardware` appear in their galleries; set `project` to a project slug to appear on its detail page. Use category `projects` for software screenshots. Smaller `order` comes first. Replace a file at the same path or update its entry, then rebuild. Images have captions, reserved dimensions, lazy loading (except the portrait), and a keyboard-accessible native dialog. Without JavaScript they open as regular image links. No stock or generated portraits are used.

### Resume

Upload your real PDF to `public/files/resume.pdf`, set `resume` in `profile.json` to `/public/files/resume.pdf`, and rebuild. Until then, `/resume.html` clearly explains that the PDF is not available and offers the verified email. No fake PDF or broken download link is used.

### Notes

Create `notes/your-note.md`, then add:

```json
{"slug":"your-note","title":"Your title","date":"2026-11-07","category":"electronics","file":"notes/your-note.md"}
```

The intentionally small Markdown renderer supports paragraphs, `##`/`###` headings, **bold**, inline backticks, and fenced code blocks. Raw HTML is escaped; general Markdown tables, lists, images, and link syntax are not supported. Notes have individual static pages and are sorted newest first. There are no fabricated posts. `/blog.html` remains a working notes alias with `/notes.html` as its canonical URL. When removing a project/note, also remove its previously generated HTML file.

## Deployment

Verified existing configuration: GitHub Pages serves `main`, repository root, with legacy Pages builds. `CNAME` must remain exactly `krishvaid.me`. `.nojekyll` makes these generated assets directly publishable. Keep root `index.html` and `blog.html` URLs.

```sh
python3 scripts/build.py
python3 scripts/check.py
node --test tests/*.test.mjs
git diff --check
git add <reviewed files>
git commit -m "Update portfolio content"
git push origin main
```

Check GitHub’s Pages build and https://krishvaid.me after pushing. Do not switch the hosting provider or Pages source. The audit found HTTPS available but GitHub’s “Enforce HTTPS” disabled; the setting has been preserved. Canonicals use HTTPS.

## Persistent page-load counter

The frontend is complete but **not connected until you deploy the backend**. No counter value is simulated. `counter/worker.mjs` implements a Cloudflare Worker with a SQLite-backed Durable Object. A transaction increments the same stored key for every accepted POST; one stable object name shares the count across visitors and deployments. Do not change the Worker name, Durable Object namespace/class/migration history, or the object ID name when updating the service.

Normal homepage loads and refreshes each send one POST. Other pages, OPTIONS, GET, prefetches, and prerendering before activation do not increment. Duplicate initialization is guarded. No automatic retries can double-count a load. Responses use `no-store`. Errors produce a quiet unavailable message. A back/forward cache restoration is not a new page load. The counter measures page loads, including automated traffic, not unique people.

### Cloudflare setup

1. Sign into your Cloudflare account. Install the official Wrangler CLI (`npm install --global wrangler`) and run `wrangler login` locally.
2. From `counter/`, run `wrangler deploy`. The included `wrangler.toml` creates the Durable Object binding and SQLite migration. For multiple accounts, configure your account ID locally or through `CLOUDFLARE_ACCOUNT_ID`.
3. Copy the resulting Worker URL and append `/visits`. Test twice:

   ```sh
   curl -i -X POST https://YOUR-WORKER.workers.dev/visits -H 'Origin: https://krishvaid.me'
   ```

   Expect 200, `Cache-Control: no-store`, the allowed origin, and increasing JSON `count`. A GET must return 405; a different origin must return 403. These test POSTs count as visits.
4. Set `counterEndpoint` in `data/profile.json` to that HTTPS URL. Rebuild, test, commit and push.
5. Visit the deployed homepage and refresh. Confirm exactly one POST per navigation in Network and an increasing count. Test from another device and redeploy the Worker to confirm retention.

Configuration: `ALLOWED_ORIGINS` in Wrangler restricts browsers to the exact production origins. HTTP variants are included because the existing Pages site does not enforce HTTPS. Remove them if HTTPS enforcement is enabled. Add `http://localhost:8000` only to a local development override when testing; never point local tests at production if you want to avoid test counts. CORS is not authentication and does not stop bots forging Origin. There are no visitor identifiers or client secrets. You can add Cloudflare rate limiting if abuse becomes an issue.

For CI deployment only: configure `CLOUDFLARE_API_TOKEN` (appropriate Worker/account permissions) and `CLOUDFLARE_ACCOUNT_ID` as private CI secrets. Never put them in profile JSON, HTML, or Git. No environment variables are required by the static website. Local `.env`, `.dev.vars`, `.wrangler`, and `node_modules` are ignored.

## Verification and design notes

`tests/counter.test.mjs` tests routing, origin restrictions, non-cacheable responses, errors, concurrent calls and object recreation using transactional mock storage. It is not a deployed Cloudflare persistence test. `scripts/check.py` checks generated local links, assets, fragments, one h1 per page, metadata and CNAME.

Responsive breakpoints cover narrow phones, tablets and desktop. Keyboard focus, skip links, native dialog focus, readable theme colors and reduced-motion styles are included. This environment’s browser host was unavailable: actual browser screenshots, mobile/tablet/desktop interaction checks and a full accessibility audit remain unverified. Test 375px, 768px and 1440px widths, both themes, keyboard photo viewing and storage-disabled theme behavior before considering visual QA complete.

Reference content was reviewed at [Vedant Sheel](https://www.vedantsheel.com/), [Eric Chen](https://ericzxchen.com/) and [Jerry Li](https://www.yuzeli.ca/). The direction takes the compact introduction/current/past structure and personal photography emphasis from Vedant, quiet navigation/footer from Eric, and explicit technical project sections from Jerry. No reference code or personal content was copied; desktop/mobile visual inspection was unavailable.

The typography-only social preview is committed as a 1200×630 PNG. To regenerate it, use Pillow and `python3 scripts/social-preview.py /path/to/font.ttf`; this optional asset step is not required for normal builds.
