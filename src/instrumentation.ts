export async function register() {
  // Only run in the Node.js server runtime (not Edge / not Vercel serverless)
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.VERCEL === "1") {
    console.log(
      "[monitor] skipping in-process loop on Vercel — use /api/cron/poll (1 min)",
    );
    return;
  }

  const { startMonitorLoop } = await import("@/lib/monitor-loop");
  startMonitorLoop();
}
