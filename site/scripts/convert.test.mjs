import assert from "node:assert/strict";
import { test } from "node:test";
import { keepsVersions, renderPieces, resolveWikiLink, splitPage, VERSION_TOKEN } from "./convert.mjs";

const moveMap = {
    pages: {
        Usage: {
            address: "/docs/usage/",
            anchors: {
                contents: "/docs/usage/",
                examples: "/docs/usage/examples/",
                "example-1---json": "/docs/usage/examples/#example-1---json",
                ssl: "/docs/usage/ssl/",
                specifications: "/docs/usage/examples/#example-1---json",
            },
        },
        GettingStarted: { address: "/docs/getting-started/", anchors: {} },
        ReleaseNotes70: { address: "/release-notes/7-0/", anchors: {} },
        How_to_release: { address: "https://github.com/rest-assured/rest-assured/blob/master/doc/how-to-release.md", anchors: {} },
        _Sidebar: { skip: "navigation" },
    },
};
const version = "7.0.0-RC1";
const convert = (markdown, page = "Usage") => {
    const byPath = new Map();
    for (const piece of splitPage(markdown, { page, moveMap, version })) byPath.set(piece.path, [...(byPath.get(piece.path) ?? []), piece]);
    return Object.fromEntries([...byPath].map(([path, pieces]) => [path, renderPieces(pieces)]));
};

test("wiki links of every form point to the new addresses", () => {
    assert.equal(resolveWikiLink("#ssl", "Usage", moveMap), "/docs/usage/ssl/");
    assert.equal(resolveWikiLink("Usage#ssl", "GettingStarted", moveMap), "/docs/usage/ssl/");
    assert.equal(resolveWikiLink("usage", "GettingStarted", moveMap), "/docs/usage/");
    assert.equal(resolveWikiLink("https://github.com/rest-assured/rest-assured/wiki/Usage#ssl", "Kotlin", moveMap), "/docs/usage/ssl/");
    assert.equal(resolveWikiLink("https://github.com/rest-assured/rest-assured/wiki", "Kotlin", moveMap), "/docs/");
    assert.equal(resolveWikiLink("How_to_release", "Usage", moveMap), moveMap.pages.How_to_release.address);
});

test("a link to an anchor the wiki doesn't have goes to the page", () => {
    assert.equal(resolveWikiLink("Usage#Specification_Re-use", "Kotlin", moveMap), "/docs/usage/");
});

test("other links are left alone", () => {
    assert.equal(resolveWikiLink("https://example.com/Usage", "Usage", moveMap), null);
    assert.equal(resolveWikiLink("mailto:x@example.com", "Usage", moveMap), null);
    assert.equal(resolveWikiLink("_Sidebar", "Usage", moveMap), null);
});

test("a page is cut at its headings, and the title heading and table of contents are dropped", () => {
    const pages = convert("Intro.\n\n# Contents\n1. [Examples](#examples)\n\n# Examples\n\n## Example 1 - JSON ##\n\nSee [SSL](#ssl).\n\n## SSL\n\nText.\n");
    assert.deepEqual(Object.keys(pages), ["/docs/usage/", "/docs/usage/examples/", "/docs/usage/ssl/"]);
    assert.equal(pages["/docs/usage/"], "Intro.\n");
    assert.equal(pages["/docs/usage/examples/"], "## Example 1 - JSON\n\nSee [SSL](/docs/usage/ssl/).\n");
    assert.equal(pages["/docs/usage/ssl/"], "Text.\n");
});

test("an anchor inside a heading goes on its own line, so the heading keeps its id", () => {
    const pages = convert('# Examples\n\n## <a name="specifications"></a> Example 1 - JSON\n\nText.\n');
    assert.equal(pages["/docs/usage/examples/"], '<a name="specifications"></a>\n\n## Example 1 - JSON\n\nText.\n');
});

test("the version becomes the placeholder in code and link URLs, not in text", () => {
    const markdown = `# Examples\n\nSince REST Assured ${version}, see [javadoc](https://javadoc.io/rest-assured/${version}/x.html) and \`rest-assured:${version}\`.\n\n\`\`\`xml\n<version>${version}</version>\n\`\`\`\n`;
    const page = convert(markdown)["/docs/usage/examples/"];
    assert.ok(page.includes(`Since REST Assured ${version},`));
    assert.ok(page.includes(`https://javadoc.io/rest-assured/${VERSION_TOKEN}/x.html`));
    assert.ok(page.includes(`\`rest-assured:${VERSION_TOKEN}\``));
    assert.ok(page.includes(`<version>${VERSION_TOKEN}</version>`));
});

test("release notes keep the versions they name", () => {
    assert.ok(keepsVersions("ReleaseNotes70") && keepsVersions("OldNews") && keepsVersions("Usage_Legacy"));
    const page = convert(`Use \`rest-assured:${version}\`.\n`, "ReleaseNotes70")["/release-notes/7-0/"];
    assert.equal(page, `Use \`rest-assured:${version}\`.\n`);
});

test("a code fence indented by a space keeps its indentation", () => {
    const page = convert("# Examples\n\n ```java\n given();\n```\n")["/docs/usage/examples/"];
    assert.equal(page, " ```java\n given();\n```\n");
});
