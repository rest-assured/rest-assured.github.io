// Checks that nothing on the wiki is lost in the move.
//
// The move map (data/move-map.json) must give every wiki page and every anchor in the inventory
// (data/wiki-inventory.json) a new address, and must not name pages or anchors the inventory doesn't have. That check
// always fails the run.
//
// Once the site is built (dist/), every address in the map must also exist there, page and anchor. While the content is
// still moving, that check only reports. With --strict it fails the run too.
//
//   npm run verify                 (from site/)
//   npm run verify -- --strict

import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function checkMap(inventory, moveMap) {
    const problems = [];
    for (const [page, { anchors }] of Object.entries(inventory.pages)) {
        const entry = moveMap.pages[page];
        if (!entry) {
            problems.push(`wiki page ${page} has no entry in the move map`);
            continue;
        }
        if (!entry.sha) problems.push(`wiki page ${page} doesn't say which wiki commit it was moved from`);
        if (entry.skip) continue;
        if (!isAddress(entry.address)) problems.push(`wiki page ${page} has no new address`);
        const mapped = entry.anchors ?? {};
        for (const { id } of anchors) {
            if (!isAddress(mapped[id])) problems.push(`${page}#${id} has no new address`);
        }
        const known = new Set(anchors.map(({ id }) => id));
        for (const id of Object.keys(mapped)) {
            if (!known.has(id)) problems.push(`the move map has ${page}#${id}, which the wiki doesn't`);
        }
    }
    for (const page of Object.keys(moveMap.pages)) {
        if (!inventory.pages[page]) problems.push(`the move map has wiki page ${page}, which the wiki doesn't`);
    }
    return problems;
}

const isAddress = (value) => typeof value === "string" && (value.startsWith("/") || value.startsWith("https://"));

// "/docs/x/#y" -> dist/docs/x/index.html, and the page must have an element with id="y".
export function checkSite(siteDir, moveMap) {
    const problems = [];
    const pages = new Map();
    const read = (path) => {
        const candidates = path.endsWith("/") ? [join(path, "index.html")] : [path, `${path}.html`, join(path, "index.html")];
        const file = candidates.map((candidate) => join(siteDir, candidate)).find((file) => existsSync(file) && statSync(file).isFile());
        if (file === undefined) return null;
        if (!pages.has(file)) pages.set(file, readFileSync(file, "utf8"));
        return pages.get(file);
    };
    for (const [page, entry] of Object.entries(moveMap.pages)) {
        if (entry.skip) continue;
        for (const [id, address] of [["", entry.address], ...Object.entries(entry.anchors ?? {})]) {
            if (typeof address !== "string" || !address.startsWith("/")) continue;
            const [path, anchor] = address.split("#");
            const html = read(path);
            const from = id ? `${page}#${id}` : page;
            if (html === null) problems.push(`${from} moves to ${address}, which isn't built`);
            else if (anchor && !hasId(html, decodeURIComponent(anchor))) problems.push(`${from} moves to ${address}, which has no #${anchor}`);
        }
    }
    return [...new Set(problems)];
}

const hasId = (html, id) => new RegExp(`\\sid=["']?${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\\s>]`).test(html);

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
    const site = join(dirname(fileURLToPath(import.meta.url)), "..");
    const json = (path) => JSON.parse(readFileSync(join(site, path), "utf8"));
    const moveMap = json("data/move-map.json");
    const mapProblems = checkMap(json("data/wiki-inventory.json"), moveMap);
    for (const problem of mapProblems) console.error(problem);

    const strict = process.argv.includes("--strict");
    const dist = join(site, "dist");
    const siteProblems = existsSync(dist) ? checkSite(dist, moveMap) : [];
    for (const problem of siteProblems) (strict ? console.error : console.log)(problem);

    if (!existsSync(dist)) (strict ? console.error : console.log)("No built site in dist/ yet, so only the move map was checked.");
    if (mapProblems.length === 0) console.log("Every wiki page and anchor has a new address.");
    if (existsSync(dist) && siteProblems.length === 0) console.log("Every new address exists on the built site.");
    if (siteProblems.length > 0) console.log(`${siteProblems.length} new addresses don't exist on the built site yet.`);
    if (mapProblems.length > 0 || (strict && (siteProblems.length > 0 || !existsSync(dist)))) process.exitCode = 1;
}
