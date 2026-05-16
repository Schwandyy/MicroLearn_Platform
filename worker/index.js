// Custom service-worker logic merged by next-pwa into the generated sw.js.
// Handles Web-Push events for the MicroLearn notifications system.

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "MicroLearn", body: event.data.text(), url: "/" };
  }
  const title = payload.title || "MicroLearn";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: payload.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          try {
            const url = new URL(client.url);
            if (url.origin === self.location.origin && "focus" in client) {
              client.navigate(target);
              return client.focus();
            }
          } catch {
            // ignore parse errors
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(target);
        }
        return undefined;
      }),
  );
});
