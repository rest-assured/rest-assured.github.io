# Agent guidelines for rest-assured.github.io

This repository serves rest-assured.io.

* The live site is the Jekyll site in the repository root. Classic GitHub Pages builds it from `master`, so anything merged to `master` is live within minutes.
* `site/` holds the new Astro Starlight site, which isn't live yet. `_config.yml` keeps it out of the Jekyll build. Read `site/README.md` before changing it.
* Run `npm run check` in `site/` before you push a change to `site/`. CI runs the same command, plus a Jekyll build that fails if the live site starts serving different files.
* Don't change anything that makes the new site live, or replace wiki pages with links to it, until the maintainer has checked the whole site locally with `npm run check` and `npm run preview` and approved it.
