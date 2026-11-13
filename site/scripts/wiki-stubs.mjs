// Replaces the wiki pages with stubs that send readers to rest-assured.io. GitHub wikis can't redirect, so each stub
// keeps every heading and <a name> of its page, with the same ids, and puts a link to the new address under each one.
// A link such as wiki/Usage#cookies-1 still lands on the right heading, and the reader is one click from the new page.
//
//   git clone https://github.com/rest-assured/rest-assured.wiki.git /tmp/wiki
//   npm run wiki-stubs -- /tmp/wiki Usage      (from site/: only the Usage page)
//   npm run wiki-stubs -- /tmp/wiki            (every page, and the sidebar and footer)
//
// It writes into the clone and doesn't commit. Check the diff, then commit and push from the clone. It refuses to run
// when a page changed on the wiki since it was converted (npm run sync-check), because those edits would be lost.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inventoryPage } from "./inventory.mjs";
import { STUB_START } from "./convert.mjs";
import { wikiChanges } from "./sync-check.mjs";

export const SITE = "https://rest-assured.io";
const explicitAnchor = /<a\s(?:[^>]*\s)?(?:name|id)\s*=\s*["']([^"']+)["'][^>]*>\s*<\/a>/gi;

const absolute = (address) => (address.startsWith("/") ? `${SITE}${address}` : address);
const shown = (address) => absolute(address).replace(/^https:\/\//, "");
const link = (address) => `[${shown(address)}](${absolute(address)})`;

// The stub for one wiki page. Headings are copied line for line, so GitHub gives them the ids it gives them now.
export function stubPage(markdown, entry) {
    const original = inventoryPage(markdown);
    const lines = markdown.split("\n");
    const out = [`${STUB_START}${link(entry.address)}.** The headings below link to where each section is now.`, ""];
    const headingLines = new Set(original.anchors.filter(({ depth }) => depth !== null).map(({ line }) => line));
    for (const anchor of original.anchors) {
        // An <a name> inside a heading, such as Spring's "### <a name="specifications"></a> Spring Mock Mvc
        // Specifications", comes along with the heading line.
        if (anchor.depth === null && headingLines.has(anchor.line)) continue;
        const address = entry.anchors?.[anchor.id] ?? entry.address;
        if (anchor.depth !== null) {
            // A heading. Setext headings (text over === or ---) aren't used on this wiki, and inventoryPage would give
            // them a line that isn't the "#" line.
            const line = lines[anchor.line - 1];
            if (!/^\s{0,3}#{1,6}(\s|$)/.test(line)) throw new Error(`Line ${anchor.line} isn't an ATX heading: ${line}`);
            out.push(line.trim(), "", `Moved to ${link(address)}.`, "");
        } else {
            out.push(`<a name="${anchor.id}"></a>`, "", `Moved to ${link(address)}.`, "");
        }
    }
    const stub = `${out.join("\n").trimEnd()}\n`;
    // The stub must keep every id the page had, in the same order, or old links break.
    const before = original.anchors.map(({ id }) => id);
    const after = inventoryPage(stub).anchors.map(({ id }) => id);
    if (JSON.stringify(before) !== JSON.stringify(after)) {
        throw new Error(`The stub doesn't keep the page's ids.\nBefore: ${before.join(" ")}\nAfter:  ${after.join(" ")}`);
    }
    return stub;
}

// The sidebar and footer show on every wiki page, including pages nobody has stubbed yet.
export const SIDEBAR = `**The REST Assured documentation has moved to [rest-assured.io](${SITE}/docs/).**

* [Getting started](${SITE}/docs/getting-started/)
* [Which module do I need](${SITE}/docs/modules/)
* [Writing tests](${SITE}/docs/usage/)
* [Release notes](${SITE}/release-notes/)
* [FAQ](${SITE}/docs/faq/)
`;
export const FOOTER = `The REST Assured documentation has moved to [rest-assured.io](${SITE}/docs/). These wiki pages only link there.
`;

export function writeStubs(wikiDir, moveMap, pages) {
    const written = [];
    for (const page of pages) {
        const entry = moveMap.pages[page];
        if (!entry) throw new Error(`The move map has no wiki page ${page}`);
        const file = join(wikiDir, `${page}.md`);
        if (page === "_Sidebar") writeFileSync(file, SIDEBAR);
        else writeFileSync(file, stubPage(readFileSync(file, "utf8"), entry));
        written.push(`${page}.md`);
    }
    if (pages.includes("_Sidebar")) {
        writeFileSync(join(wikiDir, "_Footer.md"), FOOTER);
        written.push("_Footer.md");
    }
    return written;
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
    const [wikiDir, ...only] = process.argv.slice(2);
    if (!wikiDir) {
        console.error("Usage: npm run wiki-stubs -- <wiki clone> [page ...]");
        process.exit(1);
    }
    const site = join(dirname(fileURLToPath(import.meta.url)), "..");
    const moveMap = JSON.parse(readFileSync(join(site, "data/move-map.json"), "utf8"));
    const pages = only.length > 0 ? only : Object.keys(moveMap.pages);
    const changed = wikiChanges(wikiDir, moveMap).filter((problem) => pages.some((page) => problem.includes(`page ${page} `)));
    if (changed.length > 0) {
        console.error(`${changed.join("\n")}\n\nMove these changes to the site first (npm run convert), then run this again.`);
        process.exit(1);
    }
    const written = writeStubs(wikiDir, moveMap, pages);
    console.log(`Wrote ${written.join(", ")} in ${wikiDir}. Check git diff there, then commit and push.`);
}
