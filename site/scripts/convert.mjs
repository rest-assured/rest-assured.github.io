// Moves the wiki into the site. Each wiki page is cut at its headings, and each heading goes to the page and anchor
// that data/move-map.json gives it, together with everything up to the next heading. The text is copied as it is on the
// wiki. Only these change:
//
// * The heading that a new page is named after is dropped, since the page title shows it, and the other headings move
//   up so that each page's top headings are h2.
// * Tables of contents ("Contents", "Menu") are dropped. Starlight shows its own.
// * Links to the wiki point to the new addresses: Usage#ssl, #ssl within a page, and full wiki URLs.
// * The current version becomes %REST_ASSURED_VERSION% in code and in link URLs, so a release only changes
//   src/version.mjs. Text such as "Since REST Assured 6.3.0" keeps its version, and so do pages that describe a release
//   of their own (release notes, OldNews and Usage_Legacy), as update_wiki.sh did.
//
//   npm run convert -- /tmp/wiki      (from site/)
//
// It writes every docs page that has wiki content, keeping the page's frontmatter, and rewrites wiki links in the news
// files. Run it again after the wiki changes. Hand edits to converted pages are lost, so make them on the wiki first or
// redo them after.

import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const parser = unified().use(remarkParse).use(remarkGfm);
export const VERSION_TOKEN = "%REST_ASSURED_VERSION%";
const WIKI_URL = /^(?:https?:\/\/github\.com)?\/rest-assured\/rest-assured\/wiki\/?/i;
const TABLE_OF_CONTENTS = /^(contents|table of contents|menu)$/i;

// Pages that describe one release keep the versions they name, like update_wiki.sh left them alone.
export const keepsVersions = (page) => /^ReleaseNotes/.test(page) || page === "OldNews" || page === "Usage_Legacy";

// Overview pages written for the site. On the wiki they were link lists, which the sidebar now does.
export const HAND_WRITTEN = new Set(["/docs/", "/docs/usage/", "/release-notes/"]);

const pathOf = (address) => address.split("#")[0];
const isLocal = (address) => address.startsWith("/");

// Where a link to the wiki goes now. `page` is the wiki page the link is on, for links such as #ssl. Anything that isn't
// a wiki link comes back as null.
export function resolveWikiLink(url, page, moveMap) {
    let target = url;
    const wikiUrl = WIKI_URL.exec(target);
    if (wikiUrl) target = target.slice(wikiUrl[0].length);
    else if (/^[a-z][a-z0-9+.-]*:|^\/\/|^\//i.test(target) || target.startsWith("mailto:")) return null;
    target = target.replace(/^\.\//, "");
    const [name, anchor] = target.split("#");
    const pageName = name === "" ? (wikiUrl ? "Home" : page) : name;
    const key = Object.keys(moveMap.pages).find((candidate) => candidate.toLowerCase() === pageName.toLowerCase());
    if (!key) {
        if (!wikiUrl) return null;
        return name === "" ? "/docs/" : null;
    }
    const entry = moveMap.pages[key];
    if (entry.skip || !entry.address) return null;
    if (anchor) {
        const anchors = entry.anchors ?? {};
        const found = anchors[anchor] ?? anchors[anchor.toLowerCase()];
        if (found) return found;
    }
    return entry.address;
}

// Rewrites the link URLs and, unless the page keeps its versions, the version in code and URLs. Each change is a span
// of the source text, so the rest of the Markdown stays exactly as written. Spans never overlap: a link's URL comes
// after its text, and code holds no other nodes.
function spans(tree, source, { page, moveMap, version, substitute }) {
    const list = [];
    const sub = (value) => (substitute && version ? value.replaceAll(version, VERSION_TOKEN) : value);
    const raw = (node) => source.slice(node.position.start.offset, node.position.end.offset);
    visit(tree, (node) => {
        if (node.type === "link" || node.type === "definition" || node.type === "image") {
            const resolved = node.type === "image" ? null : resolveWikiLink(node.url, page, moveMap);
            const url = resolved ?? sub(node.url);
            if (url === node.url) return;
            const text = raw(node);
            const at = node.type === "definition" ? text.indexOf(node.url, text.indexOf("]:")) : text.lastIndexOf(node.url);
            if (at < 0) throw new Error(`Couldn't find the URL ${node.url} in ${text}`);
            const start = node.position.start.offset + at;
            list.push({ start, end: start + node.url.length, to: url });
        } else if (node.type === "code" || node.type === "inlineCode") {
            if (!substitute || !version) return;
            const text = raw(node);
            for (let at = text.indexOf(version); at >= 0; at = text.indexOf(version, at + version.length)) {
                const start = node.position.start.offset + at;
                list.push({ start, end: start + version.length, to: VERSION_TOKEN });
            }
        } else if (node.type === "html") {
            for (const match of raw(node).matchAll(/href\s*=\s*"([^"]*)"/g)) {
                const url = match[1];
                const to = resolveWikiLink(url, page, moveMap) ?? sub(url);
                if (to === url) continue;
                const start = node.position.start.offset + match.index + match[0].indexOf(`"`) + 1;
                list.push({ start, end: start + url.length, to });
            }
        }
    });
    return list;
}

// Applies spans to the part of the source that starts at `offset`.
function applySpans(text, list, offset = 0) {
    let out = text;
    for (const { start, end, to } of [...list].sort((a, b) => b.start - a.start)) {
        out = out.slice(0, start - offset) + to + out.slice(end - offset);
    }
    return out;
}

// Splits one wiki page into the pieces that go to each new page, in the order they appear.
export function splitPage(markdown, { page, moveMap, version }) {
    const entry = moveMap.pages[page];
    const tree = parser.parse(markdown);
    const slugger = new GithubSlugger();
    const substitute = !keepsVersions(page);
    const pieces = [];
    let target = entry.address;
    let dropping = false;
    for (const node of tree.children) {
        let kind = "body";
        if (node.type === "heading") {
            const text = toString(node, { includeHtml: false }).trim();
            const id = slugger.slug(text);
            const address = entry.anchors?.[id];
            if (address) target = address;
            dropping = TABLE_OF_CONTENTS.test(text);
            if (dropping) continue;
            kind = address && !address.includes("#") ? "title" : "heading";
        } else if (dropping) {
            continue;
        }
        if (!isLocal(target)) continue;
        // Start at the beginning of the line. A fence indented by a space is part of its code's indentation.
        const lineStart = markdown.lastIndexOf("\n", node.position.start.offset - 1) + 1;
        const indent = markdown.slice(lineStart, node.position.start.offset);
        const start = /^[ \t]*$/.test(indent) ? lineStart : node.position.start.offset;
        const end = node.position.end.offset;
        const text = applySpans(markdown.slice(start, end), spans(node, markdown, { page, moveMap, version, substitute }), start);
        const path = pathOf(target);
        const last = pieces.at(-1);
        const block = { kind, depth: node.depth, text };
        if (last && last.path === path) last.blocks.push(block);
        else pieces.push({ path, page, blocks: [block] });
    }
    return pieces;
}

// Turns the pieces for one new page into its Markdown body.
export function renderPieces(pieces) {
    const parts = [];
    for (const piece of pieces) {
        // The first heading that stays becomes h2 and the others move by as much, but never above h2. On the wiki,
        // GettingStarted has h2s under its "Contents" h1 and then more h1s, and Spring has "Spring MVC Authentication"
        // as an h2 next to the h3s of the Mock Mvc section. Both come out as h2.
        const first = piece.blocks.find((block) => block.kind === "heading");
        const shift = first ? 2 - first.depth : 0;
        for (const block of piece.blocks) {
            if (block.kind === "title") continue;
            if (block.kind === "heading") {
                const depth = Math.min(6, Math.max(2, block.depth + shift));
                let text = block.text.replace(/^\s*#{1,6}\s*/, "").replace(/\s+#+\s*$/, "");
                // An anchor inside a heading would end up in the heading's id. Put it on its own line before it.
                const anchor = /^(<a\s[^>]*><\/a>)\s*/.exec(text);
                if (anchor) {
                    text = text.slice(anchor[0].length);
                    parts.push(anchor[1]);
                }
                parts.push(`${"#".repeat(depth)} ${text}`);
            } else {
                parts.push(block.text);
            }
        }
    }
    return `${parts.join("\n\n").replace(/^\n+|\s+$/g, "")}\n`;
}

const contentDir = (siteDir) => join(siteDir, "src/content/docs");

// The docs file for an address such as /docs/usage/ (docs/usage/index or docs/usage) with its extension.
export function fileFor(siteDir, path) {
    const base = join(contentDir(siteDir), path.replace(/^\/|\/$/g, ""));
    for (const candidate of [`${base}.md`, `${base}.mdx`, join(base, "index.md"), join(base, "index.mdx")]) {
        if (existsSync(candidate)) return candidate;
    }
    return null;
}

const frontmatterOf = (text) => /^---\n[\s\S]*?\n---\n/.exec(text)?.[0] ?? "";

export function convert(wikiDir, siteDir, { moveMap, version }) {
    const byPath = new Map();
    for (const [page, entry] of Object.entries(moveMap.pages)) {
        if (entry.skip || !entry.address || !isLocal(entry.address)) continue;
        const markdown = readFileSync(join(wikiDir, `${page}.md`), "utf8");
        for (const piece of splitPage(markdown, { page, moveMap, version })) {
            // A page's own content comes before content that other wiki pages add to it, such as Downloads under
            // Getting started.
            piece.primary = pathOf(entry.address) === piece.path && !entry.address.includes("#");
            if (!byPath.has(piece.path)) byPath.set(piece.path, []);
            byPath.get(piece.path).push(piece);
        }
    }
    const written = [];
    for (const [path, pieces] of byPath) {
        if (path === "/news/") {
            // The old news list goes under the news items on /news/.
            const file = join(siteDir, "src/pages/news/_old-news.md");
            writeFileSync(file, renderPieces(pieces));
            written.push(file);
            continue;
        }
        if (HAND_WRITTEN.has(path)) continue;
        const file = fileFor(siteDir, path);
        if (!file) throw new Error(`No page for ${path}. Add one to src/content/docs first.`);
        pieces.sort((a, b) => Number(b.primary) - Number(a.primary));
        const out = file.replace(/\.mdx$/, ".md");
        writeFileSync(out, `${frontmatterOf(readFileSync(file, "utf8"))}\n${renderPieces(pieces)}`);
        if (out !== file) rmSync(file);
        written.push(out);
    }
    // News items were written with links to the wiki.
    const newsDir = join(siteDir, "src/content/news");
    for (const name of readdirSync(newsDir).filter((file) => file.endsWith(".md"))) {
        const file = join(newsDir, name);
        const text = readFileSync(file, "utf8");
        const tree = parser.parse(text);
        const list = spans(tree, text, { page: "Home", moveMap, version, substitute: false });
        if (list.length > 0) {
            writeFileSync(file, applySpans(text, list));
            written.push(file);
        }
    }
    return written;
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
    const [wikiDir] = process.argv.slice(2);
    if (!wikiDir) {
        console.error("Usage: npm run convert -- <wiki clone>");
        process.exit(1);
    }
    const siteDir = join(dirname(fileURLToPath(import.meta.url)), "..");
    const moveMap = JSON.parse(readFileSync(join(siteDir, "data/move-map.json"), "utf8"));
    const { version } = JSON.parse(readFileSync(join(siteDir, "data/wiki-inventory.json"), "utf8"));
    const written = convert(wikiDir, siteDir, { moveMap, version });
    console.log(`Wrote ${written.length} files.`);
}
