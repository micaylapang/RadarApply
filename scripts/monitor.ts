/**
 * Optional standalone monitor (same loop as Next.js instrumentation).
 * Prefer just `npm run dev` — the watch loop starts automatically with the site.
 *
 * Use this only if you deploy the web app on serverless (e.g. Vercel)
 * and need a always-on process elsewhere: `npm run monitor`
 */
import "dotenv/config";
import { startMonitorLoop } from "../src/lib/monitor-loop";

startMonitorLoop();

// Keep the process alive (loop uses setTimeout, not a while(true))
setInterval(() => {}, 1 << 30);
