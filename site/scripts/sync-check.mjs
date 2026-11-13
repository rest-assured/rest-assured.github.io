// Finds what changed at the old sources after the move, so it can be moved over too:
//
// * wiki pages edited since the wiki commit that data/move-map.json records for them, and wiki pages the map doesn't
//   have at all;
// * news items on the old Jekyll site (_posts/ in the repository root) without a news file in src/content/news.
//
//   git clone https://github.com/rest-assured/rest-assured.wiki.git /tmp/wiki
//   npm run sync-check -- /tmp/wiki      (from site/)
//
// It exits with 1 when something needs moving. For a wiki page, run npm run convert again and redo any hand edits; for
// a news item, add the file by hand.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
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

// The old site lists news as "* 2026-11-12: REST Assured 7.0.0-RC1 is released. ..." in a _posts file.
export function newsChanges(postsText, newsFiles) {
    const dates = new Set(newsFiles.map((name) => name.slice(0, "YYYY-MM-DD".length)));
    const problems = [];
    for (const [, date, text] of postsText.matchAll(/^\* (\d{4}-\d{2}-\d{2}): (.{0,60})/gm)) {
        if (!dates.has(date)) problems.push(`the news item of ${date} ("${text}...") has no file in src/content/news`);
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
    const posts = join(site, "../_posts");
    if (existsSync(posts)) {
        const text = readdirSync(posts).filter((name) => name.endsWith("-news.md")).map((name) => readFileSync(join(posts, name), "utf8")).join("\n");
        problems.push(...newsChanges(text, readdirSync(join(site, "src/content/news"))));
    }
    for (const problem of problems) console.error(problem);
    if (problems.length === 0) console.log("Nothing changed on the wiki or the old site since the move.");
    else process.exitCode = 1;
}
