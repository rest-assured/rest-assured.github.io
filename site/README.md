# The new rest-assured.io

This folder holds the new rest-assured.io, an Astro Starlight site, and the docs that move here from the [GitHub wiki](https://github.com/rest-assured/rest-assured/wiki). It isn't live. The live site is still the Jekyll site in the repository root, and `_config.yml` keeps this folder out of it.

## Run it locally

You need Node 22.23.4 or later.

```bash
cd site
npm install
npm run dev       # http://localhost:4321, reloads as you edit
```

To check the whole site the way it will be deployed:

```bash
npm run check     # tests the scripts, builds the site into dist/, checks links, old addresses and every wiki address
npm run preview   # serves dist/ at http://localhost:4321
```

The build fails on a broken internal link. `check` also fails if a wiki page, anchor or code block has no place on the site.

## Where things are

* `src/pages/index.astro` is the landing page. Its sections keep the ids of the old one-page site (`#intro`, `#news`, `#release-notes`, `#docs`, `#documentation`, `#who`), so old links still land on the right section.
* `src/content/docs/` holds the docs and release notes, one Markdown or MDX file per page. The sidebar is in `astro.config.mjs`. Most pages are converted from the wiki (see below), so change those on the wiki until the wiki pages are replaced by links. `/docs/`, `/docs/usage/` and `/release-notes/` are written for the site.
* `src/content/news/` holds one file per news item. `/news/` lists them all and the landing page shows the latest three.
* `src/version.mjs` holds the current version. Write `%REST_ASSURED_VERSION%` in a docs page and the build puts the version in.
* `src/styles/theme.css` and the `expressiveCode` settings in `astro.config.mjs` give the docs the same colours as the landing page.

## Deploy

`.github/workflows/deploy-site.yml` builds the site, runs `npm run check` and publishes `dist/` to GitHub Pages. Until the switch from the Jekyll site, it only runs when started by hand. The steps to go live and to roll back are at the top of the workflow.

The new site keeps every address the old one served. `/intro`, `/who` and the `.html` forms are small pages in `public/` that point to where the content moved, and the front page keeps the old section ids. `npm run check-links` fails if one goes missing, if a link points to a page that isn't built, or if `CNAME` no longer names rest-assured.io.

## After a release

1. Set the new version in `src/version.mjs`.
2. Add a news file to `src/content/news/`, named `YYYY-MM-DD-<version>.md` with a `title` and `date`.
3. For a major or minor release, add its release notes page to `src/content/docs/release-notes/`.

## The move from the wiki

`scripts/convert.mjs` writes the docs pages from a clone of the wiki. It cuts each wiki page at its headings, puts each part on the page that `data/move-map.json` names, points wiki links to the new addresses and writes the current version as `%REST_ASSURED_VERSION%` in code and link URLs. The text is otherwise copied as it is. To pick up wiki edits:

```bash
git clone https://github.com/rest-assured/rest-assured.wiki.git /tmp/wiki
npm run sync-check -- /tmp/wiki   # lists wiki pages and old-site news changed since the move
npm run convert -- /tmp/wiki
npm run check
```

After converting, set the wiki commit in `data/move-map.json` (each page's `sha`) to the one you converted from, so `sync-check` starts from there.

## What's here

* `data/wiki-inventory.json` lists every wiki page, every anchor a link can point to (each heading, with the id GitHub gives it, and each `<a name>`), every code block, and every place the current version is written out. `scripts/inventory.mjs` writes it from a clone of the wiki.
* `data/move-map.json` gives every wiki page and anchor its new address. It also records the wiki commit each page was moved from, so edits made on the wiki after that can be found and moved over too.
* `data/old-addresses.json` lists every address the Jekyll site serves today, and the anchors on its front page. `scripts/old-addresses.mjs` writes it from a build of the Jekyll site. The new site must serve all of them before it replaces the old one.
* `scripts/verify.mjs` fails if a wiki page or anchor has no new address. It also reports wiki code blocks that aren't on any page, and, once the site is built, new addresses that don't exist. With `--strict`, which `npm run check` passes, it fails on those too.
* `scripts/sync-check.mjs` lists what changed on the wiki and in the old site's news since the move.

## Update the inventory

```bash
git clone https://github.com/rest-assured/rest-assured.wiki.git /tmp/wiki
npm run inventory -- /tmp/wiki 7.0.0-RC1
npm run verify
```

The second argument is the version the wiki documents. If `verify` then reports an anchor without a new address, a heading was added or renamed on the wiki. Add it to `data/move-map.json`.

## Update the old addresses

From the repository root:

```bash
BUNDLE_GEMFILE=.github/jekyll/Gemfile bundle install
BUNDLE_GEMFILE=.github/jekyll/Gemfile bundle exec jekyll build -d /tmp/old-site
cd site
npm run old-addresses -- /tmp/old-site
```
