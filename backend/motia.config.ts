import { defineConfig } from '@motiadev/core'
import endpointPlugin from '@motiadev/plugin-endpoint/plugin'
import logsPlugin from '@motiadev/plugin-logs/plugin'
import observabilityPlugin from '@motiadev/plugin-observability/plugin'
import statesPlugin from '@motiadev/plugin-states/plugin'
// REMOVED: BullMQ causes restart loop with Redis Memory Server
// import bullmqPlugin from '@motiadev/plugin-bullmq/plugin'

const isProd = process.env.NODE_ENV === 'production'
const port = parseInt(process.env.PORT || '3000', 10)

export default defineConfig({
  plugins: [observabilityPlugin, statesPlugin, endpointPlugin, logsPlugin],
  server: {
    port,
    host: '0.0.0.0', // Railway requires binding to all interfaces
    ...(isProd ? {
      hmr: false,
      workbench: false,
    } : {}),
  },
})
