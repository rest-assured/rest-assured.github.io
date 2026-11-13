// Puts the REST Assured version the docs describe wherever a page writes %REST_ASSURED_VERSION%: in text, code, link
// targets and component attributes. The version comes from src/version.mjs.

import { REST_ASSURED_VERSION } from "../version.mjs";

export const VERSION_TOKEN = "%REST_ASSURED_VERSION%";

const replace = (value) => (typeof value === "string" ? value.replaceAll(VERSION_TOKEN, REST_ASSURED_VERSION) : value);

function visit(node) {
    if ("value" in node) node.value = replace(node.value);
    if ("url" in node) node.url = replace(node.url);
    for (const attribute of Array.isArray(node.attributes) ? node.attributes : []) {
        if (attribute.type === "mdxJsxAttribute") attribute.value = replace(attribute.value);
    }
    for (const child of node.children ?? []) visit(child);
}

export default function remarkVersion() {
    return (tree) => visit(tree);
}
