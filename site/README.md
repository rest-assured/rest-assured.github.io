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
npm run check     # tests the scripts, builds the site into dist/ and checks every wiki address
npm run preview   # serves dist/ at http://localhost:4321
```

The build fails on a broken internal link. `check` also lists every wiki anchor whose new address doesn't exist yet. Until the docs have moved, that list is long and doesn't fail the run.

## Where things are

* `src/pages/index.astro` is the landing page. Its sections keep the ids of the old one-page site (`#intro`, `#news`, `#release-notes`, `#docs`, `#documentation`, `#who`), so old links still land on the right section.
* `src/content/docs/` holds the docs and release notes, one Markdown or MDX file per page. The sidebar is in `astro.config.mjs`.
* `src/content/news/` holds one file per news item. `/news/` lists them all and the landing page shows the latest three.
* `src/version.mjs` holds the current version. Write `%REST_ASSURED_VERSION%` in a docs page and the build puts the version in.
* `src/styles/theme.css` and the `expressiveCode` settings in `astro.config.mjs` give the docs the same colours as the landing page.

## After a release

1. Set the new version in `src/version.mjs`.
2. Add a news file to `src/content/news/`, named `YYYY-MM-DD-<version>.md` with a `title` and `date`.
3. For a major or minor release, add its release notes page to `src/content/docs/release-notes/`.

## The move from the wiki

## What's here

* `data/wiki-inventory.json` lists every wiki page, every anchor a link can point to (each heading, with the id GitHub gives it, and each `<a name>`), every code block, and every place the current version is written out. `scripts/inventory.mjs` writes it from a clone of the wiki.
* `data/move-map.json` gives every wiki page and anchor its new address. It also records the wiki commit each page was moved from, so edits made on the wiki after that can be found and moved over too.
* `data/old-addresses.json` lists every address the Jekyll site serves today, and the anchors on its front page. `scripts/old-addresses.mjs` writes it from a build of the Jekyll site. The new site must serve all of them before it replaces the old one.
* `scripts/verify.mjs` fails if a wiki page or anchor has no new address. Once the site is built, it also reports every new address that doesn't exist yet. With `--strict` it fails on those too.

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
