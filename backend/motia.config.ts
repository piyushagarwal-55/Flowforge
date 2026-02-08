import { defineConfig } from "@motiadev/core";
import endpointPlugin from "@motiadev/plugin-endpoint/plugin";
import logsPlugin from "@motiadev/plugin-logs/plugin";

const port = parseInt(process.env.PORT || "3000", 10);

export default defineConfig({
  plugins: [
    endpointPlugin,
    logsPlugin,
  ],
  server: {
    port,
    host: "0.0.0.0",
    hmr: false,
    workbench: false,
  },
});
