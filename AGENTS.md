# Agent guidelines for rest-assured.github.io

This repository serves rest-assured.io.

* The site is the Astro Starlight site in `site/`. `.github/workflows/deploy-site.yml` deploys it to GitHub Pages on every push to `master`, so anything merged to `master` is live within minutes. Read `site/README.md` before changing it.
* Run `npm run check` in `site/` before you push. CI runs the same command on pull requests, and the deploy runs it before publishing.
* Most docs pages are converted from the GitHub wiki by `site/scripts/convert.mjs`. Until the wiki pages are replaced by links to the site, change those docs on the wiki and convert again, because a converted page is overwritten.
