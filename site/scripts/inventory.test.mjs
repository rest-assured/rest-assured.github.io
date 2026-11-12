import assert from "node:assert/strict";
import { test } from "node:test";
import { codeBlockHash, inventoryPage } from "./inventory.mjs";

const ids = (markdown) => inventoryPage(markdown).anchors.map(({ id }) => id);

test("a heading's id is GitHub's slug of its text", () => {
    assert.deepEqual(ids("# Getting Response Data #\n## Header Merging/Overwriting\n## 4. Logging REST Assured logs to disk"), [
        "getting-response-data",
        "header-mergingoverwriting",
        "4-logging-rest-assured-logs-to-disk",
    ]);
});

// Ids that the wiki's own table-of-contents links use, so they are the ids GitHub gives these headings.
test("ids match the ones the wiki's own links use", () => {
    assert.deepEqual(ids("## Maven / Gradle Users ##\n### Version 2.x\n### Java 9+\n### Parameter values that aren't strings ###"), [
        "maven--gradle-users",
        "version-2x",
        "java-9",
        "parameter-values-that-arent-strings",
    ]);
});

test("a heading with the same text as an earlier one gets -1, then -2", () => {
    assert.deepEqual(ids("## Cookies ##\n## Headers ##\n## Cookies ##\n## Headers ##\n## Cookies"), [
        "cookies",
        "headers",
        "cookies-1",
        "headers-1",
        "cookies-2",
    ]);
});

test("code and links in a heading count by their text only", () => {
    assert.deepEqual(ids("## Using `given()` with [JsonPath](https://example.com)"), ["using-given-with-jsonpath"]);
});

test("HTML in a heading is left out of its id, and an <a name> in it is an anchor of its own", () => {
    const { anchors } = inventoryPage('### <a name="specifications"></a> Spring Mock Mvc Specifications ###');
    assert.deepEqual(
        anchors.map(({ id, text }) => [id, text]),
        [
            ["spring-mock-mvc-specifications", "Spring Mock Mvc Specifications"],
            ["specifications", null],
        ],
    );
});

test("a line starting with # inside a code block is not a heading", () => {
    const page = inventoryPage("## Real\n\n```bash\n# just a comment\n```\n");
    assert.deepEqual(page.anchors.map(({ id }) => id), ["real"]);
    assert.equal(page.codeBlocks.length, 1);
});

test("each code block is listed with its line, language and a hash of its trimmed content", () => {
    const { codeBlocks } = inventoryPage("text\n\n```java\nget(\"/x\");\n```\n\n    indented();\n");
    assert.deepEqual(codeBlocks, [
        { line: 3, lang: "java", hash: codeBlockHash('get("/x");') },
        { line: 7, lang: null, hash: codeBlockHash("indented();") },
    ]);
});

test("the current version is listed by where it is written: code, URL, HTML or text", () => {
    const markdown = [
        "Since REST Assured 7.0.0-RC1 this works.",
        "See the [javadoc](https://www.javadoc.io/doc/io.rest-assured/rest-assured/7.0.0-RC1/index.html).",
        "Use `7.0.0-RC1`.",
        "```xml\n<version>7.0.0-RC1</version>\n```",
        '<a href="https://example.com/7.0.0-RC1">x</a>',
        "Since REST Assured 6.3.0 it is older history.",
    ].join("\n\n");
    const kinds = inventoryPage(markdown, "7.0.0-RC1").versionHits.map(({ kind }) => kind);
    assert.deepEqual(kinds.sort(), ["code", "code", "html", "text", "url"]);
});
