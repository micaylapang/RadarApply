import { pollOnce } from "@/lib/notify";
import { isSupabaseConfigured } from "@/lib/supabase";
import { smsConfigured } from "@/lib/sms";

const globalForMonitor = globalThis as unknown as {
  __droptextMonitorStarted?: boolean;
  __droptextMonitorTimer?: ReturnType<typeof setTimeout>;
};

/**
 * Starts the 1s internship watch loop inside the Next.js Node process.
 * Safe to call multiple times (dev hot reload) — only one loop runs.
 */
export function startMonitorLoop() {
  if (process.env.MONITOR_ENABLED === "false") {
    console.log("[monitor] disabled via MONITOR_ENABLED=false");
    return;
  }

  if (globalForMonitor.__droptextMonitorStarted) {
    return;
  }
  globalForMonitor.__droptextMonitorStarted = true;

  const interval = Number(process.env.POLL_INTERVAL_MS ?? "1000");

  console.log(`[monitor] DropText watcher starting (every ${interval}ms)`);
  console.log(
    `[monitor] SMS: ${smsConfigured() ? "Twilio live" : "dev mode (console only)"}`,
  );
  console.log(
    `[monitor] Supabase: ${isSupabaseConfigured() ? "connected" : "NOT configured"}`,
  );

  const tick = async () => {
    const started = Date.now();
    try {
      if (isSupabaseConfigured()) {
        await pollOnce();
      }
    } catch (err) {
      console.error("[monitor] tick failed", err);
    }

    const elapsed = Date.now() - started;
    if (elapsed > interval) {
      console.warn(
        `[monitor] tick took ${elapsed}ms (> ${interval}ms interval)`,
      );
    }

    const wait = Math.max(0, interval - elapsed);
    globalForMonitor.__droptextMonitorTimer = setTimeout(() => {
      void tick();
    }, wait);
  };

  void tick();
}
