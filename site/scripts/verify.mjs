// Checks that nothing on the wiki is lost in the move.
//
// The move map (data/move-map.json) must give every wiki page and every anchor in the inventory
// (data/wiki-inventory.json) a new address, and must not name pages or anchors the inventory doesn't have. That check
// always fails the run.
//
// Every code block on the moved wiki pages must also be in some page of the site, as written, apart from the version,
// which the site writes as %REST_ASSURED_VERSION%.
//
// Once the site is built (dist/), every address in the map must also exist there, page and anchor.
//
// The last two checks only report, unless you pass --strict. npm run check passes it.
//
//   npm run verify                 (from site/)
//   npm run verify -- --strict

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { VERSION_TOKEN } from "./convert.mjs";
import { codeBlockHash } from "./inventory.mjs";

const parser = unified().use(remarkParse).use(remarkGfm);

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

// `sources` are the Markdown texts of the site's pages.
export function checkCode(inventory, moveMap, sources) {
    const onSite = new Set();
    for (const source of sources) {
        visit(parser.parse(source), "code", (node) => {
            onSite.add(codeBlockHash(node.value.replaceAll(VERSION_TOKEN, inventory.version)));
        });
    }
    const problems = [];
    for (const [page, { codeBlocks }] of Object.entries(inventory.pages)) {
        const entry = moveMap.pages[page];
        if (!entry || entry.skip || !entry.address?.startsWith("/")) continue;
        for (const { line, hash } of codeBlocks) {
            if (!onSite.has(hash)) problems.push(`the code block at ${page}.md:${line} isn't on any page of the site`);
        }
    }
    return problems;
}

export function siteSources(siteDir) {
    const files = [];
    const walk = (dir) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const path = join(dir, entry.name);
            if (entry.isDirectory()) walk(path);
            else if (/\.mdx?$/.test(entry.name)) files.push(path);
        }
    };
    walk(join(siteDir, "src/content"));
    walk(join(siteDir, "src/pages"));
    return files.map((file) => readFileSync(file, "utf8"));
}

const hasId = (html, id) => new RegExp(`\\sid=["']?${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\\s>]`).test(html);

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
    const site = join(dirname(fileURLToPath(import.meta.url)), "..");
    const json = (path) => JSON.parse(readFileSync(join(site, path), "utf8"));
    const moveMap = json("data/move-map.json");
    const inventory = json("data/wiki-inventory.json");
    const strict = process.argv.includes("--strict");
    const report = strict ? console.error : console.log;

    const mapProblems = checkMap(inventory, moveMap);
    for (const problem of mapProblems) console.error(problem);

    const codeProblems = checkCode(inventory, moveMap, siteSources(site));
    for (const problem of codeProblems) report(problem);

    const dist = join(site, "dist");
    const siteProblems = existsSync(dist) ? checkSite(dist, moveMap) : [];
    for (const problem of siteProblems) report(problem);

    if (!existsSync(dist)) report("No built site in dist/ yet, so the new addresses weren't checked.");
    if (mapProblems.length === 0) console.log("Every wiki page and anchor has a new address.");
    console.log(codeProblems.length === 0 ? "Every wiki code block is on the site." : `${codeProblems.length} wiki code blocks aren't on the site yet.`);
    if (existsSync(dist)) console.log(siteProblems.length === 0 ? "Every new address exists on the built site." : `${siteProblems.length} new addresses don't exist on the built site yet.`);
    const unfinished = codeProblems.length > 0 || siteProblems.length > 0 || !existsSync(dist);
    if (mapProblems.length > 0 || (strict && unfinished)) process.exitCode = 1;
}
