import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { newsChanges, wikiChanges } from "./sync-check.mjs";

const git = (cwd, ...args) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { cwd, encoding: "utf8" }).trim();

test("wiki pages edited, added or removed since the move are reported", () => {
    const wiki = mkdtempSync(join(tmpdir(), "wiki-"));
    git(wiki, "init", "-q");
    writeFileSync(join(wiki, "Usage.md"), "# Usage\n");
    writeFileSync(join(wiki, "FAQ.md"), "# FAQ\n");
    writeFileSync(join(wiki, "Old.md"), "# Old\n");
    git(wiki, "add", ".");
    git(wiki, "commit", "-qm", "first");
    const sha = git(wiki, "rev-parse", "HEAD");
    const moveMap = { pages: { Usage: { sha }, FAQ: { sha }, Old: { sha } } };
    assert.deepEqual(wikiChanges(wiki, moveMap), []);

    writeFileSync(join(wiki, "Usage.md"), "# Usage\n\nMore.\n");
    writeFileSync(join(wiki, "New.md"), "# New\n");
    git(wiki, "rm", "-q", "Old.md");
    git(wiki, "add", ".");
    git(wiki, "commit", "-qm", "second");
    assert.deepEqual(wikiChanges(wiki, moveMap).sort(), [
        "wiki page New is new and has no entry in the move map",
        "wiki page Old is gone from the wiki",
        `wiki page Usage changed since ${sha.slice(0, 7)}`,
    ]);
});

test("a news item on the old site without a news file is reported", () => {
    const posts = "## News\n* 2026-11-12: REST Assured 7.0.0-RC1 is released.\n* 2026-12-01: REST Assured 7.0.0 is released.\n";
    assert.deepEqual(newsChanges(posts, ["2026-11-12-7.0.0-RC1.md"]), [
        'the news item of 2026-12-01 ("REST Assured 7.0.0 is released....") has no file in src/content/news',
    ]);
});
