import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import starlight from "@astrojs/starlight";
import starlightLinksValidator from "starlight-links-validator";
import starlightLlmActions from "starlight-llm-actions";
import remarkVersion from "./src/plugins/remark-version.mjs";

const wikiTopics = [
    { label: "Start", items: ["docs", "docs/getting-started", "docs/modules", "docs/snapshots"] },
    { label: "Writing tests", items: [{ autogenerate: { directory: "docs/usage" } }] },
    { label: "Frameworks and languages", items: ["docs/spring/mock-mvc", "docs/spring/web-test-client", "docs/kotlin", "docs/scala"] },
    { label: "Upgrading", items: ["docs/upgrading/preparing-for-7-0", { label: "Release notes", link: "/release-notes/" }] },
    {
        label: "Reference",
        items: [
            "docs/faq",
            "docs/support",
            { label: "Javadoc", link: "https://www.javadoc.io/doc/io.rest-assured/rest-assured/latest/index.html", attrs: { target: "_blank" } },
            { label: "Change log", link: "https://github.com/rest-assured/rest-assured/blob/master/changelog.txt", attrs: { target: "_blank" } },
            "docs/legacy/usage",
        ],
    },
    { label: "Release notes", collapsed: true, items: [{ autogenerate: { directory: "release-notes" } }] },
];

export default defineConfig({
    site: "https://rest-assured.io",
    markdown: { processor: unified({ remarkPlugins: [remarkVersion] }) },
    // Built CSS and JS keep the same file name from one deploy to the next. GitHub Pages lets a browser keep a page for
    // ten minutes, and a page it kept from before a deploy would otherwise ask for a hashed file the deploy removed, and
    // show without its styles.
    vite: {
        build: {
            rollupOptions: {
                output: {
                    entryFileNames: "_astro/[name].js",
                    chunkFileNames: "_astro/[name].js",
                    assetFileNames: "_astro/[name][extname]",
                },
            },
        },
    },
    integrations: [
        starlight({
            title: "REST Assured",
            description: "Java DSL for easy testing of REST services.",
            // The logo's black lines turn light on a dark page.
            logo: { light: "./src/assets/logo.png", dark: "./src/assets/logo-dark.png", alt: "REST Assured" },
            favicon: "/favicon.ico",
            social: [{ icon: "github", label: "GitHub", href: "https://github.com/rest-assured/rest-assured" }],
            editLink: { baseUrl: "https://github.com/rest-assured/rest-assured.github.io/edit/master/site/" },
            customCss: [
                "@fontsource-variable/bricolage-grotesque",
                "@fontsource/ibm-plex-sans/400.css",
                "@fontsource/ibm-plex-sans/500.css",
                "@fontsource/ibm-plex-sans/600.css",
                "@fontsource-variable/jetbrains-mono",
                "./src/styles/theme.css",
            ],
            // Code is light sage on a light page and deep green on a dark one, never black on white.
            expressiveCode: {
                themes: ["vitesse-dark", "vitesse-light"],
                styleOverrides: {
                    borderRadius: "12px",
                    borderColor: ({ theme }) => (theme.type === "dark" ? "#263127" : "#d5ddd0"),
                    codeBackground: ({ theme }) => (theme.type === "dark" ? "#141d16" : "#e9eee6"),
                    codeFontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
                    frames: {
                        editorTabBarBackground: ({ theme }) => (theme.type === "dark" ? "#101712" : "#dfe7dc"),
                        editorActiveTabBackground: ({ theme }) => (theme.type === "dark" ? "#141d16" : "#e9eee6"),
                        terminalTitlebarBackground: ({ theme }) => (theme.type === "dark" ? "#101712" : "#dfe7dc"),
                        terminalBackground: ({ theme }) => (theme.type === "dark" ? "#141d16" : "#e9eee6"),
                        frameBoxShadowCssValue: "none",
                    },
                },
            },
            sidebar: wikiTopics,
            plugins: [
                // The news pages and the landing page are Astro pages rather than Starlight content, so the validator
                // can't see them.
                // The docs show example URLs such as http://localhost:8080/lotto in the text.
                starlightLinksValidator({ exclude: ["/", "/news/", "/news/**/*"], errorOnLocalLinks: false }),
                starlightLlmActions({ renderMarkdown: "simple", linkAlternate: true }),
            ],
        }),
    ],
});
