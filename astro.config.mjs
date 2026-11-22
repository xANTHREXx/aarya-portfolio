import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// Where the site is served. The deploy workflow sets these; locally the site sits at the root.
// For Aarya's own user site (Aaryap1.github.io) use SITE_URL=https://aaryap1.github.io and BASE_PATH=/.
export default defineConfig({
  site: process.env.SITE_URL ?? "https://aaryap1.github.io",
  base: process.env.BASE_PATH ?? "/",
  integrations: [react()],
  devToolbar: { enabled: false },
});
