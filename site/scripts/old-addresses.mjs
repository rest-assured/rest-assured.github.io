// Lists every address the old Jekyll site serves, so the new site can be checked against it before it replaces the old
// one. Build the old site first, from the repository root:
//
//   BUNDLE_GEMFILE=.github/jekyll/Gemfile bundle exec jekyll build -d /tmp/old-site
//   npm run old-addresses -- /tmp/old-site      (from site/, writes data/old-addresses.json)
//   npm run old-addresses -- /tmp/old-site --check
//
// With --check it writes nothing and fails if the build serves something else than data/old-addresses.json lists. CI
// uses that to see that a change to the old site, such as its exclude list, didn't drop or add a file.

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// The old site's own scripts and styles. Nothing outside the old page links to them, and the new site has its own.
const notKept = new Set(["/combo.css", "/site.js"]);

// Ids of the old page's layout rather than its content. Nobody links to them.
const layoutIds = new Set(["main", "footer", "forkongithub"]);

const files = (dir) =>
    readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? files(path) : [path];
    });

// GitHub Pages serves news.html at both /news.html and /news, and index.html at /.
export function addressesOf(file) {
    const address = `/${file.split(sep).join("/")}`;
    if (address === "/index.html") return ["/"];
    if (address.endsWith("/index.html")) return [address.slice(0, -"index.html".length)];
    if (address.endsWith(".html")) return [address.slice(0, -".html".length), address];
    return [address];
}

export function idsOf(html) {
    return [...new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(([, id]) => id))].filter((id) => !layoutIds.has(id)).sort();
}

export function oldAddresses(siteDir) {
    const addresses = files(siteDir)
        .map((path) => relative(siteDir, path))
        .flatMap(addressesOf)
        .filter((address) => !notKept.has(address))
        .sort();
    return { addresses, anchorsOnFrontPage: idsOf(readFileSync(join(siteDir, "index.html"), "utf8")) };
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
    const siteDir = process.argv[2];
    if (!siteDir) {
        console.error("Usage: npm run old-addresses -- <directory the old Jekyll site was built into>");
        process.exit(1);
    }
    const out = join(dirname(fileURLToPath(import.meta.url)), "../data/old-addresses.json");
    const json = `${JSON.stringify(oldAddresses(siteDir), null, 2)}\n`;
    if (!process.argv.includes("--check")) {
        writeFileSync(out, json);
        console.log(`Wrote ${out}`);
    } else if (json === readFileSync(out, "utf8")) {
        console.log("The old site serves exactly the addresses in data/old-addresses.json.");
    } else {
        console.error(`The old site no longer serves exactly the addresses in data/old-addresses.json. It serves:\n${json}`);
        process.exitCode = 1;
    }
}
