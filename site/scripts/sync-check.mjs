// Finds what changed on the wiki after the move, so it can be moved over too: wiki pages edited since the wiki commit
// that data/move-map.json records for them, and wiki pages the map doesn't have at all.
//
//   git clone https://github.com/rest-assured/rest-assured.wiki.git /tmp/wiki
//   npm run sync-check -- /tmp/wiki      (from site/)
//
// It exits with 1 when something needs moving. Then run npm run convert again.

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

export function wikiChanges(wikiDir, moveMap) {
    const problems = [];
    const pages = readdirSync(wikiDir).filter((name) => name.endsWith(".md")).map((name) => name.slice(0, -".md".length));
    for (const page of pages) {
        const entry = moveMap.pages[page];
        if (!entry) {
            problems.push(`wiki page ${page} is new and has no entry in the move map`);
            continue;
        }
        const changed = git(wikiDir, "diff", "--name-only", entry.sha, "HEAD", "--", `${page}.md`);
        if (changed) problems.push(`wiki page ${page} changed since ${entry.sha.slice(0, 7)}`);
    }
    for (const page of Object.keys(moveMap.pages)) {
        if (!pages.includes(page)) problems.push(`wiki page ${page} is gone from the wiki`);
    }
    return problems;
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
    const [wikiDir] = process.argv.slice(2);
    if (!wikiDir) {
        console.error("Usage: npm run sync-check -- <wiki clone>");
        process.exit(1);
    }
    const site = join(dirname(fileURLToPath(import.meta.url)), "..");
    const moveMap = JSON.parse(readFileSync(join(site, "data/move-map.json"), "utf8"));
    const problems = wikiChanges(wikiDir, moveMap);
    for (const problem of problems) console.error(problem);
    if (problems.length === 0) console.log("Nothing changed on the wiki since the move.");
    else process.exitCode = 1;
}
