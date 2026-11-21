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
| `js/main.js` | Theme toggle, scroll reveal, Toronto clock, visitor counter, double-pendulum canvas |
| `public/favicon.svg` | The **KV.** mark. The K's leg runs into the V, with an accent dot |
| `public/logos/` | Small org logos used inline |
| `404.html` | Not-found page |
| `experience.html`, `projects.html`, … | Redirects so old URLs still land on the right section |

To edit content, change the text in `index.html` directly. Each section is a `<section class="block">`, and each role is an `<li class="entry">`.

## Theme

The theme follows the system setting until the visitor clicks the toggle. After that the choice is saved in `localStorage`. An inline script in `<head>` applies it before first paint, so the page never flashes the wrong theme. To change colors, edit the variables in `:root` and `:root[data-theme="dark"]`.

## Visitor counter

Every page load, including a reload, adds one visit. The counter uses the free [Abacus](https://abacus.jasoncameron.dev) API, with no account or server to run:

- production key: `krishvaid.me/visits` (used only when served from krishvaid.me)
- any other host (for example localhost) counts into `krishvaid.me/visits-dev`, so testing doesn't inflate the real number

Abacus sometimes returns an error even though it already counted the hit. In that case the script retries with read-only `get` calls, never with a second `hit`. If the counter can't be reached at all, it hides itself.

## Deploy

GitHub Pages serves `main` from the repository root, using the custom domain in `CNAME`. Merge to `main` and the site goes live in about a minute.
