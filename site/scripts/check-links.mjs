// Checks the built site before it is deployed:
//
// * every internal link and asset on every page resolves to a built file;
// * every address the old Jekyll site served still exists (data/old-addresses.json), and the front page still has the
//   old section ids, such as #news;
// * dist/CNAME names rest-assured.io, so a deploy keeps the custom domain.
//
//   npm run check-links            (from site/, after npm run build)

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DOMAIN = "rest-assured.io";

const htmlFiles = (dir) =>
    readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return htmlFiles(path);
        return name.endsWith(".html") ? [path] : [];
    });

// "/docs/x/" -> docs/x/index.html, "/intro" -> intro.html or intro/index.html, as GitHub Pages serves them.
export function resolves(siteDir, url) {
    const path = decodeURIComponent(url.split(/[?#]/)[0]);
    const candidates = path.endsWith("/") ? [join(path, "index.html")] : [path, `${path}.html`, join(path, "index.html")];
    return candidates.some((candidate) => existsSync(join(siteDir, candidate)) && statSync(join(siteDir, candidate)).isFile());
}

export function checkLinks(siteDir, old) {
    const problems = [];
    for (const file of htmlFiles(siteDir)) {
        const html = readFileSync(file, "utf8");
        for (const [, url] of html.matchAll(/(?:href|src)="(\/(?!\/)[^"]*)"/g)) {
            if (!resolves(siteDir, url)) problems.push(`${file.slice(siteDir.length)} links to ${url}, which isn't built`);
        }
    }
    for (const url of old.addresses) {
        if (!resolves(siteDir, url)) problems.push(`${url} was served by the old site but isn't built`);
    }
    const front = existsSync(join(siteDir, "index.html")) ? readFileSync(join(siteDir, "index.html"), "utf8") : "";
    for (const id of old.anchorsOnFrontPage) {
        if (!new RegExp(`\\sid="${id}"`).test(front)) problems.push(`the front page has no #${id}, which the old site had`);
    }
    const cname = join(siteDir, "CNAME");
    if (!existsSync(cname) || readFileSync(cname, "utf8").trim() !== DOMAIN) problems.push(`CNAME doesn't name ${DOMAIN}, so a deploy would drop the domain`);
    return [...new Set(problems)];
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
    const site = join(dirname(fileURLToPath(import.meta.url)), "..");
    const old = JSON.parse(readFileSync(join(site, "data/old-addresses.json"), "utf8"));
    const problems = checkLinks(join(site, "dist"), old);
    if (problems.length === 0) console.log("Every internal link resolves, every old address still exists, and CNAME is in place.");
    else {
        console.error(`${problems.join("\n")}\n\n${problems.length} problems.`);
        process.exitCode = 1;
    }
}
