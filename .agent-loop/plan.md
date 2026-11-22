# Plan: case-study pages for /work/[slug]/

## T1: Specs for case data and case pages
- executor: auto
- files: tests/helpers.mjs, tests/cases.test.mjs, tests/case-pages-core.test.mjs, tests/case-pages-detail.test.mjs, package.json
- test: node --test tests/cases.test.mjs
- depends_on: none

### Brief
This is an Astro 7 site (ESM, `"type": "module"` in package.json, Node 24). Case-study content lives in `src/data/cases.ts`, which exports `cases: CaseStudy[]` and `getCase(slug)`. The project list lives in `src/data/site.ts`, which exports `work: { slug, title, ... }[]`. Node 24 strips TypeScript types natively, so tests can `import { cases } from "../src/data/cases.ts"` directly. Do not edit any file under `src/`.

Use only `node:test`, `node:assert/strict`, `node:fs` and `node:path`. No new dependencies.

**package.json**: add `"test": "node --test tests/"` to `scripts`. Change nothing else.

**tests/helpers.mjs** exports:
- `read(slug)`: returns the text of `dist/work/<slug>/index.html` (path relative to the project root, resolved from `import.meta.dirname`), or throws an Error `missing built page for <slug>` if the file does not exist.
- `decode(html)`: replaces `&amp;` `&lt;` `&gt;` `&quot;` `&#39;` `&#x27;` `&#x2F;` and numeric entities `&#NNN;` / `&#xHH;` with their characters.
- `text(html)`: `decode` of the HTML with all tags removed and runs of whitespace collapsed to one space.
- `section(html, name)`: returns the outer HTML of the first element carrying `data-case-section="<name>"` up to its matching close tag (track nesting of that element's tag name), or `null` if absent.
- `ORDER`: the array `["clearbill", "ibm-batch", "taxi-pipeline", "fashion-recommender"]`.

**tests/cases.test.mjs** (data only, no build needed):
- `cases` has exactly 4 entries whose `slug`s equal `work.map(w => w.slug)` in the same order, and equal `ORDER`.
- Every case has a non-empty `title`, `lead`, at least one `problem` paragraph, at least 3 `flow` steps and at least 1 `facts` entry; every flow step has non-empty `where`, `title`, `detail`.
- Every `shots[].src` and `shippingShot.src` (when present) exists as a file under `public/` (strip the leading `/`).
- The `clearbill` case's `factsNote` contains the word `separate`.
- `getCase("taxi-pipeline").title === "Taxi data pipeline"` and `getCase("nope") === undefined`.
- No string anywhere in `cases` (walk all nested values) contains `@` or a run of 10 or more digits.

**tests/case-pages-core.test.mjs** (runs against the built `dist/`; it must fail with a clear message when `dist/` is missing). For each slug in `ORDER`, with `c = getCase(slug)` and `h = read(slug)`:
- `text(h)` contains `c.title`, `c.lead`, every `c.problem` paragraph, every flow step `title` and `detail`, every fact `value` and `label`, and every `meta` `value`.
- `h` contains an `<h1` whose text equals `c.title`.
- `section(h, "problem")`, `section(h, "flow")` and `section(h, "facts")` are all non-null.
- `h` contains `href="/#work"`.
- The next-project link: the element with attribute `data-next-case` has `href="/work/<next>/"` where `<next>` is the following slug in `ORDER`, wrapping from the last to the first; its text contains that case's title.
- `text(h)` does not contain `being written`.
- Every link in `c.links` appears as an `href` in `h`.

**tests/case-pages-detail.test.mjs** (also against `dist/`):
- `clearbill`: `section(h, "shots")` contains an `<img` for each of the 6 shot `src`s with its `alt` text, and every caption text. `section(h, "decisions")` text contains every decision `title` and `body`. `section(h, "shipping")` text contains every `trigger` and `route`, and an `<img` with src `/img/gh-actions.jpg`. `section(h, "next")` contains 4 `<li` elements whose texts equal the 4 `next` items. `text(h)` contains `c.closing`.
- `taxi-pipeline`: `section(h, "code")` contains at least 5 `<pre` elements; its text contains every snippet `file`, every snippet `title`, and the decoded code `overwrite=True` and `{{ ref('stg_taxi_trips') }}`. `section(h, "shots")` contains an `<img` with src `/img/sf-loaded.png`.
- `ibm-batch`: `section(h, "shots")`, `section(h, "code")`, `section(h, "shipping")` and `section(h, "next")` are all `null` (empty sections are not rendered), and `h` contains no `<pre`.
- `fashion-recommender`: `h` contains no `href` starting with `https://github.com/Aaryap1/` (a repo link). `section(h, "decisions")` is non-null.

### Done when
`node --test tests/cases.test.mjs` passes. The two page spec files exist and fail with the clear "missing built page" message when `dist/` is absent.

## T2: Case page skeleton
- executor: antigravity
- model: gemini-3.8-flash-high
- files: src/pages/work/[slug].astro, src/components/case/CaseSection.astro, src/components/case/Flow.astro, src/components/case/Facts.astro
- test: npm ci --no-audit --no-fund && npm run build && node --test tests/case-pages-core.test.mjs
- depends_on: T1

### Brief
Astro 7 site. Rewrite the existing placeholder `src/pages/work/[slug].astro` so it renders a full case study from `src/data/cases.ts`. Do not edit `src/data/*`, `src/pages/index.astro`, `src/layouts/Base.astro`, `src/styles/global.css`, `src/scripts/*` or anything under `src/components/ui/`.

**Data**: `import { cases, getCase, type CaseStudy } from "../../data/cases"`. `getStaticPaths()` returns one path per case: `{ params: { slug: c.slug }, props: { c } }`. Order for the next-project link is the order of `cases`; the last case links to the first.

**Layout**: wrap the page in `Base` from `../../layouts/Base.astro` with props `title={`${c.title} — Aarya Patil`}` and `description={c.lead}`. After the `<article>`, render the site footer exactly as the homepage does: `import SiteFooter from "../../components/SiteFooter";` then `<SiteFooter client:visible />` wrapped in `<div id="contact">`.

**Design system** (already global; use the CSS variables, add no new colours or fonts): `--bg #131210` page ground, `--ink` main text, `--ink-2` secondary, `--ink-3` tertiary, `--rule` hairlines, `--flag` the single vermilion accent, `--display` display face (use weights 300–420, tight negative letter-spacing), `--sans` body, `--mono` for data and file paths only, `--gutter` horizontal page padding, `--ease-out` easing. Global classes available: `.mono` (mono, small) and `.link-line` (animated underline on hover). No cards, no shadows, no gradients; hairline rules separate things.

**Page structure** (all styles in the page's own `<style>` block, scoped):
1. `<article class="case">`, padding `160px var(--gutter) 0`. A back link `<a href="/#work" class="link-line">All work</a>` in `--ink-2`.
2. Hero: `<h1>` with `c.title` in `--display`, weight 300, `font-size: clamp(3.4rem, 10vw, 9rem)`, line-height 0.92, letter-spacing -0.045em, margin-top 40px. Then `<p class="lead">` with `c.lead` in `--display` weight 330, `clamp(1.5rem, 2.6vw, 2.4rem)`, line-height 1.15, max-width 30ch, colour `--ink`. Then a `<dl class="meta">` grid of `c.meta` (label in `--ink-3` 0.85rem, value in `--ink-2`), 2 columns on desktop, 1 below 760px, top border `--rule`. Then, only when `c.links.length`, a row of links: the first is a pill button (border-radius 999px, padding 14px 22px, background `--ink`, colour `--bg`, weight 560) and the rest are `.link-line` text links; every external link gets `target="_blank" rel="noopener"`.
3. Sections, each rendered with `CaseSection` (see below), in this order: `problem` (label "The problem", paragraphs `c.problem` at 1.15rem, `--ink-2`, max-width 62ch), `flow` (label `c.flowTitle`, renders `Flow`), `facts` (label "What it shows" for clearbill and taxi-pipeline, "Results" for the others; renders `Facts`).
4. Leave a clearly marked spot after `facts` for later sections: a comment `<!-- detail sections -->`.
5. A next-project block: `<a data-next-case href={`/work/${next.slug}/`}>` containing a small label "Next project" (`--ink-3`) and `next.title` in `--display` weight 300 at `clamp(2.6rem, 7vw, 6rem)`; on hover the title colour changes to `--flag`. Padding `clamp(80px, 14vh, 160px) 0`, top border `--rule`.

**src/components/case/CaseSection.astro**: props `name: string`, `label: string`. Renders `<section class="case-section" data-case-section={name}>` with a 2-column grid on desktop (`minmax(0, 3fr) minmax(0, 9fr)`, gap `clamp(24px, 4vw, 64px)`), 1 column below 900px. Left: `<h2>` with `label` in `--sans`, 0.95rem, weight 560, `--ink-2`, sticky at `top: 96px` on desktop. Right: `<slot />`. Section padding `clamp(56px, 9vh, 96px) 0`, top border `--rule`.

**src/components/case/Flow.astro**: props `steps: Step[]`, `note?: string` (import the `Step` type from `../../data/cases`). Renders an `<ol>` where each step is a row: a two-digit index (`01`, `02`, …) in `--mono` `--ink-3`; then a block with `where` in `--mono` 0.78rem uppercase `--ink-3`, `title` in `--display` weight 380 at 1.5rem `--ink`, and `detail` in `--ink-2`. Rows are separated by `--rule` hairlines. A step with `key: true` gets its index in `--flag` and a 6px `--flag` dot before its title. When `note` is set, render it after the list in `--ink-2`.

**src/components/case/Facts.astro**: props `facts: Fact[]`, `note?: string`. Renders a `<dl>` of rows, each with the `value` in `--display` weight 330 at `clamp(2rem, 3.4vw, 3rem)` and tabular numerals, the `label` in `--ink`, and the optional `note` in `--ink-2` 0.92rem. Rows separated by `--rule`. Two columns of rows on desktop, one below 760px. When `note` is set, render it after the list as a `<p>` in `--ink-2`, starting with an em dash and a space.

Skip any section whose data is empty. Below 760px everything stacks into one column with no horizontal scroll.

### Done when
`npm run build` succeeds and `node --test tests/case-pages-core.test.mjs` passes for all four pages.

## T3: Case page detail sections
- executor: antigravity
- model: gemini-3.8-flash-high
- files: src/pages/work/[slug].astro, src/components/case/Shots.astro, src/components/case/CodeBlocks.astro, src/components/case/Decisions.astro, src/components/case/Shipping.astro, src/components/case/NextList.astro
- test: npm ci --no-audit --no-fund && npm run build && node --test tests/case-pages-core.test.mjs tests/case-pages-detail.test.mjs
- depends_on: T2

### Brief
Astro 7 site. `src/pages/work/[slug].astro` renders a case study `c` (type `CaseStudy` from `src/data/cases.ts`) using `CaseSection` from `src/components/case/CaseSection.astro` (props `name`, `label`; renders `<section data-case-section={name}>` with a left label and a right slot). It has a comment `<!-- detail sections -->` after the `facts` section. Replace that comment with the sections below, each wrapped in `CaseSection` and each rendered only when its data is non-empty. Do not edit `src/data/*`, `src/pages/index.astro`, `src/layouts/Base.astro`, `src/styles/global.css`, `src/scripts/*`, `src/components/case/CaseSection.astro`, `Flow.astro`, `Facts.astro`, or anything under `src/components/ui/`.

Use the site's CSS variables only (`--bg`, `--bg-raise`, `--ink`, `--ink-2`, `--ink-3`, `--rule`, `--flag`, `--display`, `--sans`, `--mono`, `--ease-out`); no new colours or fonts, no shadows, no gradients. Each component keeps its styles in its own scoped `<style>` block.

**Order and labels**: `shots` ("Screens", when `c.shots.length`), `code` ("The real code", when `c.snippets.length`), `decisions` ("Decisions", when `c.decisions.length`), `shipping` ("How it ships", when `c.shipping.length`), `next` ("What I'd fix next", when `c.next.length`). After the last section, when `c.closing` is set, render it as a `<p>` in `--ink-3` 0.88rem.

**src/components/case/Shots.astro**: props `shots: Shot[]`. When there is more than one shot, render a horizontal scroll-snap strip (`display: flex; gap: 20px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 12px`) of `<figure>`s, each `flex: 0 0 min(240px, 70%)`, `scroll-snap-align: start`. Each `<img src alt loading="lazy" decoding="async">` has `width: 100%`, `border-radius: 18px`, `border: 1px solid var(--rule)`; the `<figcaption>` below is 0.9rem `--ink-2`. When there is exactly one shot, render it full width of the column (no strip), border-radius 12px. Style the strip's scrollbar thin with `--rule`.

**src/components/case/CodeBlocks.astro**: props `snippets: Snippet[]`. For each, a `<figure>` with a `<figcaption>` row showing `title` (weight 560, `--ink`) and `file` (`--mono`, `--ink-3`) spread to both ends; then `<pre><code>{snippet.code}</code></pre>` with `background: var(--bg-raise)`, `font-family: var(--mono)`, 0.82rem, line-height 1.6, padding 18px 20px, `overflow-x: auto`, `border: 1px solid var(--rule)`, border-radius 10px; then the optional `note` in `--ink-2` 0.92rem. Render code as text so Astro escapes it (do not use `set:html`). Gap 28px between figures.

**src/components/case/Decisions.astro**: props `decisions: Decision[]`. A list where each item has the `title` in `--display` weight 380 at 1.4rem and the `body` in `--ink-2`, max-width 60ch, separated by `--rule` hairlines.

**src/components/case/Shipping.astro**: props `ships: Ship[]`, `shot?: Shot`. A list of rows: `trigger` in `--mono` 0.78rem uppercase `--flag`, then `route` in `--mono` 0.9rem `--ink-2` with `overflow-wrap: anywhere`. Rows separated by `--rule`. When `shot` is set, render it after the list as a full-width `<figure>` (img border-radius 12px, border `--rule`, caption 0.9rem `--ink-2`).

**src/components/case/NextList.astro**: props `items: string[]`. An `<ul>` whose `<li>` text is exactly each item, each row with a 6px `--ink-3` square marker before it, separated by `--rule` hairlines.

Pass `c.shippingShot` to `Shipping` as `shot`. Below 760px everything stays in one column with no horizontal page scroll (only the shots strip and code blocks may scroll inside themselves).

### Done when
`npm run build` succeeds and both `tests/case-pages-core.test.mjs` and `tests/case-pages-detail.test.mjs` pass.
