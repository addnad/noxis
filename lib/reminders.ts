// Daily journaling reminders via Web Push. After unlock we register the service
// worker, request permission, and subscribe — the server cron sends the daily push.

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export function notificationsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function sendSubscription(sub: PushSubscription): Promise<void> {
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  }).catch(() => {});
}

// Register SW, request permission (once), subscribe to push, persist subscription.
export async function enableRemindersIfNeeded(): Promise<void> {
  if (!notificationsSupported() || !VAPID_PUBLIC) return;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");

    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
    } else if (Notification.permission !== "granted") {
      return;
    }

    // Reuse an existing subscription or create one.
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
    }
    await sendSubscription(sub);
  } catch {
    // best-effort; ignore failures
  }
}
