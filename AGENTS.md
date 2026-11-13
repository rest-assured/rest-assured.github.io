# Agent guidelines for rest-assured.github.io

This repository serves rest-assured.io.

* The site is the Astro Starlight site in `site/`. `.github/workflows/deploy-site.yml` deploys it to GitHub Pages on every push to `master`, so anything merged to `master` is live within minutes. Read `site/README.md` before changing it.
* Run `npm run check` in `site/` before you push. CI runs the same command on pull requests, and the deploy runs it before publishing.
* The docs moved here from the GitHub wiki, whose pages now only link to the site. Edit the docs in `site/src/content/docs/`. Don't run `site/scripts/convert.mjs` again: it would overwrite the site with the wiki's old content, and it refuses pages that are stubs.
