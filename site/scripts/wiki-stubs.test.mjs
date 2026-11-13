import assert from "node:assert/strict";
import { test } from "node:test";
import { inventoryPage } from "./inventory.mjs";
import { STUB_START } from "./convert.mjs";
import { stubPage } from "./wiki-stubs.mjs";

const entry = {
    address: "/docs/usage/",
    anchors: {
        contents: "/docs/usage/",
        cookies: "/docs/usage/request-data/#cookies",
        "cookies-1": "/docs/usage/verifying-responses/#cookies",
        specifications: "/docs/usage/specification-reuse/",
        "spec-reuse": "/docs/usage/specification-reuse/",
    },
};
const page = `# Contents
1. [Cookies](#cookies)

## Cookies ##
Send cookies.

\`\`\`java
## not a heading
\`\`\`

## Cookies ##
Check cookies.

### <a name="specifications"></a> Spec reuse ###
Text.
`;

test("a stub keeps every heading id, duplicates and in-heading anchors included, in order", () => {
    const stub = stubPage(page, entry);
    assert.deepEqual(
        inventoryPage(stub).anchors.map(({ id }) => id),
        inventoryPage(page).anchors.map(({ id }) => id),
    );
    assert.ok(stub.startsWith(`${STUB_START}[rest-assured.io/docs/usage/](https://rest-assured.io/docs/usage/).**`));
});

test("each heading links to where its section moved", () => {
    const stub = stubPage(page, entry);
    assert.match(stub, /## Cookies ##\n\nMoved to \[rest-assured.io\/docs\/usage\/request-data\/#cookies\]/);
    assert.match(stub, /## Cookies ##\n\nMoved to \[rest-assured.io\/docs\/usage\/verifying-responses\/#cookies\]/);
    assert.ok(!stub.includes("Send cookies") && !stub.includes("not a heading"));
});

test("an <a name> outside a heading is kept", () => {
    const stub = stubPage('Intro.\n\n<a name="old-id"></a>\n\n# Contents\n', { address: "/docs/usage/", anchors: { "old-id": "/docs/usage/ssl/" } });
    assert.match(stub, /<a name="old-id"><\/a>\n\nMoved to \[rest-assured.io\/docs\/usage\/ssl\/\]/);
});
