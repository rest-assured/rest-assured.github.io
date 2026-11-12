import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { addressesOf, idsOf, oldAddresses } from "./old-addresses.mjs";

test("a page is served with and without .html, and index.html at its directory", () => {
    assert.deepEqual(addressesOf("news.html"), ["/news", "/news.html"]);
    assert.deepEqual(addressesOf("index.html"), ["/"]);
    assert.deepEqual(addressesOf(join("docs", "index.html")), ["/docs/"]);
    assert.deepEqual(addressesOf(join("img", "logo.png")), ["/img/logo.png"]);
});

test("ids of the page's layout are left out", () => {
    assert.deepEqual(idsOf('<div id="main"><div id="news" class="section"><h2 id="news">News</h2></div><div id="footer"></div></div>'), ["news"]);
});

test("the old site's own script and stylesheet are not kept", () => {
    const dir = mkdtempSync(join(tmpdir(), "old-site-"));
    mkdirSync(join(dir, "img"));
    writeFileSync(join(dir, "index.html"), '<div id="who"></div>');
    writeFileSync(join(dir, "who.html"), "");
    writeFileSync(join(dir, "combo.css"), "");
    writeFileSync(join(dir, "site.js"), "");
    writeFileSync(join(dir, "img", "logo.png"), "");
    assert.deepEqual(oldAddresses(dir), { addresses: ["/", "/img/logo.png", "/who", "/who.html"], anchorsOnFrontPage: ["who"] });
});
