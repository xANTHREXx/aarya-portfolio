import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://aaryap1.github.io",
  integrations: [react()],
  devToolbar: { enabled: false },
});
