import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { checkMap, checkSite } from "./verify.mjs";

const inventory = {
    pages: {
        Usage: { anchors: [{ id: "ssl" }, { id: "cookies" }, { id: "cookies-1" }] },
        _Sidebar: { anchors: [] },
    },
};

const moveMap = () => ({
    pages: {
        Usage: {
            sha: "abc",
            address: "/docs/usage/",
            anchors: { ssl: "/docs/usage/ssl/", cookies: "/docs/usage/request-data/#cookies", "cookies-1": "/docs/usage/verifying-responses/#cookies" },
        },
        _Sidebar: { sha: "abc", skip: "navigation" },
    },
});

test("a complete move map has no problems", () => {
    assert.deepEqual(checkMap(inventory, moveMap()), []);
});

test("a wiki anchor without a new address is a problem", () => {
    const map = moveMap();
    delete map.pages.Usage.anchors["cookies-1"];
    assert.deepEqual(checkMap(inventory, map), ["Usage#cookies-1 has no new address"]);
});

test("a wiki page without an entry is a problem", () => {
    const map = moveMap();
    delete map.pages._Sidebar;
    assert.deepEqual(checkMap(inventory, map), ["wiki page _Sidebar has no entry in the move map"]);
});

test("an entry for a page or anchor the wiki doesn't have is a problem", () => {
    const map = moveMap();
    map.pages.Usage.anchors.gone = "/docs/usage/";
    map.pages.Gone = { sha: "abc", address: "/docs/gone/", anchors: {} };
    assert.deepEqual(checkMap(inventory, map), ["the move map has Usage#gone, which the wiki doesn't", "the move map has wiki page Gone, which the wiki doesn't"]);
});

test("a page without the wiki commit it was moved from is a problem", () => {
    const map = moveMap();
    delete map.pages.Usage.sha;
    assert.deepEqual(checkMap(inventory, map), ["wiki page Usage doesn't say which wiki commit it was moved from"]);
});

test("an address must be a site path or an https URL", () => {
    const map = moveMap();
    map.pages.Usage.anchors.ssl = "docs/usage/ssl/";
    assert.deepEqual(checkMap(inventory, map), ["Usage#ssl has no new address"]);
});

function builtSite(pages) {
    const dir = mkdtempSync(join(tmpdir(), "verify-"));
    for (const [path, html] of Object.entries(pages)) {
        mkdirSync(join(dir, path), { recursive: true });
        writeFileSync(join(dir, path, "index.html"), html);
    }
    return dir;
}

test("on a built site, every new page and anchor must exist", () => {
    const dir = builtSite({
        "docs/usage": "<h1>Usage</h1>",
        "docs/usage/ssl": "<h1>SSL</h1>",
        "docs/usage/request-data": '<h2 id="cookies">Cookies</h2>',
    });
    assert.deepEqual(checkSite(dir, moveMap()), ["Usage#cookies-1 moves to /docs/usage/verifying-responses/#cookies, which isn't built"]);
});

test("a built page without the anchor is a problem", () => {
    const dir = builtSite({
        "docs/usage": "",
        "docs/usage/ssl": "",
        "docs/usage/request-data": '<h2 id="cookies">Cookies</h2>',
        "docs/usage/verifying-responses": '<h2 id="cookies-from-response">Cookies</h2>',
    });
    assert.deepEqual(checkSite(dir, moveMap()), ["Usage#cookies-1 moves to /docs/usage/verifying-responses/#cookies, which has no #cookies"]);
});

test("addresses outside the site are not checked against it", () => {
    const map = { pages: { How_to_release: { sha: "abc", address: "https://github.com/rest-assured/rest-assured/blob/master/doc/how-to-release.md", anchors: {} } } };
    assert.deepEqual(checkSite(builtSite({}), map), []);
});
