import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { checkLinks, resolves } from "./check-links.mjs";

const site = (files) => {
    const dir = mkdtempSync(join(tmpdir(), "dist-"));
    for (const [path, content] of Object.entries(files).filter(([, content]) => content !== undefined)) {
        mkdirSync(join(dir, path, ".."), { recursive: true });
        writeFileSync(join(dir, path), content);
    }
    return dir;
};
const old = { addresses: ["/", "/intro", "/docs.html", "/news"], anchorsOnFrontPage: ["intro", "news"] };
const complete = {
    "index.html": '<section id="intro"></section><section id="news"><a href="/docs/">Docs</a></section>',
    "docs/index.html": '<img src="/img/logo.png">',
    "img/logo.png": "png",
    "intro.html": "",
    "docs.html": "",
    "news/index.html": "",
    CNAME: "rest-assured.io\n",
};

test("addresses resolve the way GitHub Pages serves them", () => {
    const dir = site(complete);
    for (const url of ["/", "/docs/", "/docs", "/intro", "/intro.html", "/news", "/docs/#ssl"]) assert.ok(resolves(dir, url), url);
    assert.ok(!resolves(dir, "/who"));
});

test("a complete site has no problems", () => {
    assert.deepEqual(checkLinks(site(complete), old), []);
});

test("a broken link, a lost old address, a lost section id and a missing CNAME are problems", () => {
    const dir = site({ ...complete, "index.html": '<section id="intro"><a href="/gone/">x</a></section>', "intro.html": undefined, CNAME: "example.com" });
    const problems = checkLinks(dir, { ...old, addresses: [...old.addresses, "/who"] });
    assert.deepEqual(problems, [
        "/index.html links to /gone/, which isn't built",
        "/intro was served by the old site but isn't built",
        "/who was served by the old site but isn't built",
        "the front page has no #news, which the old site had",
        "CNAME doesn't name rest-assured.io, so a deploy would drop the domain",
    ]);
});
