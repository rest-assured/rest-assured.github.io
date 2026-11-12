// Lists everything on the GitHub wiki that the new site has to give a home: every page, every anchor a link can point
// to, every code block, and every place the current REST Assured version is written out. verify.mjs checks the move
// map and, later, the built site against this list.
//
//   git clone https://github.com/rest-assured/rest-assured.wiki.git /tmp/wiki
//   npm run inventory -- /tmp/wiki 7.0.0-RC1      (from site/, writes data/wiki-inventory.json)
//
// The second argument is the version the wiki documents today, the one update_wiki.sh would replace on a release.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const parser = unified().use(remarkParse).use(remarkGfm);

// <a name="specifications"></a> or <a id="x"> in the page's HTML. GitHub keeps both as link targets.
const explicitAnchor = /<a\s[^>]*\b(?:name|id)\s*=\s*["']([^"']+)["']/gi;

export const codeBlockHash = (code) => createHash("sha256").update(code.trim()).digest("hex").slice(0, 16);

// Where a version string sits decides what the move does with it: code and URLs follow the version, text is history.
function versionHits(tree, version) {
    const hits = [];
    const add = (kind, node, value) => {
        if (value?.includes(version)) hits.push({ line: node.position.start.line, kind });
    };
    visit(tree, (node) => {
        if (node.type === "code" || node.type === "inlineCode") add("code", node, node.value);
        else if (node.type === "text") add("text", node, node.value);
        else if (node.type === "html") add("html", node, node.value);
        else if (node.type === "link" || node.type === "image" || node.type === "definition") add("url", node, node.url);
    });
    return hits;
}

// The ids GitHub gives a page's headings: the heading's text, without HTML, through GitHub's own slug rules. A second
// heading with the same text gets -1, a third -2.
export function inventoryPage(markdown, version) {
    const tree = parser.parse(markdown);
    const slugger = new GithubSlugger();
    const anchors = [];
    const codeBlocks = [];
    visit(tree, (node) => {
        if (node.type === "heading") {
            const text = toString(node, { includeHtml: false }).trim();
            anchors.push({ id: slugger.slug(text), text, depth: node.depth, line: node.position.start.line });
        } else if (node.type === "html") {
            for (const [, id] of node.value.matchAll(explicitAnchor)) {
                anchors.push({ id, text: null, depth: null, line: node.position.start.line });
            }
        } else if (node.type === "code") {
            codeBlocks.push({ line: node.position.start.line, lang: node.lang ?? null, hash: codeBlockHash(node.value) });
        }
    });
    return { anchors, codeBlocks, versionHits: version ? versionHits(tree, version) : [] };
}

export function inventory(wikiDir, version) {
    const pages = {};
    for (const file of readdirSync(wikiDir).filter((name) => name.endsWith(".md")).sort()) {
        pages[file.slice(0, -".md".length)] = inventoryPage(readFileSync(join(wikiDir, file), "utf8"), version);
    }
    const wikiSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: wikiDir, encoding: "utf8" }).trim();
    return { wikiSha, version, pages };
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
    const [wikiDir, version] = process.argv.slice(2);
    if (!wikiDir || !version) {
        console.error("Usage: npm run inventory -- <wiki clone> <version the wiki documents, such as 7.0.0-RC1>");
        process.exit(1);
    }
    const out = join(dirname(fileURLToPath(import.meta.url)), "../data/wiki-inventory.json");
    writeFileSync(out, `${JSON.stringify(inventory(wikiDir, version), null, 2)}\n`);
    console.log(`Wrote ${out}`);
}
