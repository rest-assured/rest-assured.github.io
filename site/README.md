# The new rest-assured.io

This folder will hold the new rest-assured.io, an Astro Starlight site, and the docs that move here from the [GitHub wiki](https://github.com/rest-assured/rest-assured/wiki). It isn't live. The live site is still the Jekyll site in the repository root, and `_config.yml` keeps this folder out of it.

For now it holds the checks that make sure nothing is lost in the move. You need Node 22 or later.

```bash
cd site
npm install
npm test
npm run verify
```

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
