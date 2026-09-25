# keshav-portfolio

Engineering portfolio and technical notebook for Keshav: professional work, personal projects,
and write-ups from real systems. A fully static site deployed to GitHub Pages.

## Architecture

```text
content/            Markdown + JSON — the only place facts live
  experience/       employer entries
  projects/         one file per project (professional | personal)
  writing/          articles
  notes/            about, now
  site/             homepage areas, motion storyboards (text alternative for each video)
  taxonomy.json     allowed tags, technologies and motion ids

apps/web            Astro site: typed content collections → static HTML
apps/motion         Remotion compositions → pre-rendered WebM / MP4 / poster
packages/motion-tokens   colours, durations, easing, spacing, type shared by both
public/             static files; public/generated holds rendered media (not committed)
scripts/            post-build link and route validation
```

Remotion never runs in the browser. It renders media at build time; pages reference the files
with `<video preload="none">`, a poster and a text sequence underneath.

## Stack

Astro 7 · TypeScript (strict) · MDX · Tailwind CSS 4 + CSS custom properties · Shiki · Mermaid
(lazy, client-side) · Lucide · Remotion 4 · satori + resvg for OG images · Vitest · ESLint ·
Prettier · pnpm workspaces · GitHub Actions · GitHub Pages.

## Development

```bash
pnpm install
pnpm dev              # http://localhost:4321/keshav-portfolio/
```

No environment variables, databases or services are needed. Without rendered media, motion
figures show their storyboard text instead of video.

| Command            | What it does                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `pnpm build`       | Static build to `apps/web/dist`                                                                                              |
| `pnpm preview`     | Serve the build                                                                                                              |
| `pnpm lint`        | ESLint + Prettier check                                                                                                      |
| `pnpm typecheck`   | `astro check` and `tsc` for every package                                                                                    |
| `pnpm test`        | Content validation, path helpers, component rendering                                                                        |
| `pnpm check:links` | After a build: internal links, anchors, required routes, sitemap, RSS. `--external` also probes outside URLs (warnings only) |

## Motion rendering

```bash
pnpm motion:studio                        # Remotion Studio
pnpm motion:render                        # all compositions → public/generated
pnpm motion:render GstReturnsArchitecture     # one composition
pnpm motion:render --poster-only          # posters only
pnpm motion:render --theme=light          # one theme only (default: both)
```

Each composition renders VP9 WebM, H.264 MP4 and a JPEG poster of the final frame, once per theme: `<name>.*` for dark and `<name>-light.*` for light, using the palettes in `packages/motion-tokens`. The site shows the variant that matches the active theme and switches when the theme changes.
Storyboards are in [`apps/motion/STORYBOARDS.md`](apps/motion/STORYBOARDS.md).

## Deployment

`.github/workflows/deploy.yml` runs on pushes to `main`:
install → lint → typecheck → test → render motion (cached on the motion sources) → build →
link check → upload `apps/web/dist` → deploy to Pages.

`SITE_URL` and `BASE_PATH` come from `actions/configure-pages`, so the same build works as a
project page (`/keshav-portfolio/`), a user page, or behind a custom domain. Enable Pages with
**Source: GitHub Actions** in the repository settings.

`ci.yml` runs the same checks (without rendering video) on pull requests and other branches.

## Content authoring

- **Facts come from the source document only.** Don't add metrics, dates, employers or features
  that aren't documented. If something is missing, leave it out or add an HTML comment for later.
- **Projects** — `content/projects/<slug>.md`. The filename must equal `slug`. `category` is
  `professional` or `personal`; `technologies` and `tags` must exist in `content/taxonomy.json`.
  Body sections are H2s (`## Problem`, `## Architecture`, …); use `<details>` for deep dives.
- **Writing** — `content/writing/<slug>.md`. Every article needs `relatedProjects` pointing at a
  real project. `draft: true` keeps it out of production builds, RSS and the sitemap.
- **Links** — write root-relative links (`/projects/fintax`); the base path is added at build time.
- **Diagrams** — fenced ` ```mermaid ` blocks.
- **Code** — fenced blocks with a language; add `title="file.ts"` and `{3-5}` for a filename and
  highlighted lines.
- **Now** — `content/notes/now.md`. Sections only render once they have content.
- **Contact links** — LinkedIn, email and résumé are `undefined` in `apps/web/src/site.config.ts`
  until real values are added; unset links are not rendered.

The build fails on schema errors, unknown tags or technologies, duplicate slugs, and references to
projects that don't exist. `pnpm test` and `pnpm check:links` catch orphaned articles and broken
links.
