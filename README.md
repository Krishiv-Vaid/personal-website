# krishvaid.me

Personal site of Krishiv Vaid. Plain HTML, CSS and a little JavaScript. No framework and no build step.

## Run locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Where things live

| File | What it is |
| --- | --- |
| `index.html` | All page content: hero, work, research, projects, about |
| `css/styles.css` | Design tokens (light and dark) at the top, then components |
| `js/main.js` | Theme toggle, scroll reveal, Toronto clock, visitor-counter display, double-pendulum canvas |
| `public/vaid-icon.svg` | The **वैद.** mark: वैद set in Poppins SemiBold and converted to an SVG path, plus the blue accent dot |
| `counter/` | Cloudflare Worker behind the visitor counter |
| `public/logos/` | Small org logos used inline |
| `404.html` | Not-found page |
| `experience.html`, `projects.html`, … | Redirects so old URLs still land on the right section |

To edit content, change the text in `index.html` directly. Each section is a `<section class="block">`, and each role is an `<li class="entry">`.

## Theme

The theme follows the system setting until the visitor clicks the toggle. After that the choice is saved in `localStorage`. An inline script in `<head>` applies it before first paint, so the page never flashes the wrong theme. To change colors, edit the variables in `:root` and `:root[data-theme="dark"]`.

## Visitor counter

Every page load, including a reload, adds one visit. The counter runs on a Cloudflare Worker (`counter/`), with a single Durable Object holding the count, so increments are atomic and a request takes about 50 ms.

- The request is sent from an inline script in `<head>` (`window.__visit`), so it doesn't wait for CSS, fonts or `main.js`. `main.js` only renders the result.
- Only krishvaid.me can bump the real count. Pages served from localhost count into a separate `dev` counter, and any other origin gets a 403.
- `START_COUNT` in `counter/wrangler.toml` was the count carried over when the counter launched. It's used only once, while storage is empty.

Deploy changes to the worker with:

```sh
cd counter && npx wrangler deploy
```

## Deploy

GitHub Pages serves `main` from the repository root, using the custom domain in `CNAME`. Merge to `main` and the site goes live in about a minute.
