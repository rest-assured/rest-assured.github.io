import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

export const collections = {
    docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
    // One file per news item, newest shown first on /news/ and the latest three on the landing page.
    news: defineCollection({
        loader: glob({ pattern: "*.md", base: "./src/content/news" }),
        schema: z.object({
            title: z.string(),
            date: z.coerce.date(),
        }),
    }),
};
