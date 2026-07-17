// Firebase Cloud Messaging service worker.
// This file must live at the web root (/firebase-messaging-sw.js) — Vite
// serves anything in /public as-is, unbundled, which is required here since
// service workers can't use ES module imports from node_modules directly.

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// These values aren't secrets (the same values ship in the client bundle via
// VITE_ env vars) — but this file is served as a static asset, so it can't
// read import.meta.env. Replace the placeholders below with your actual
// Firebase config values (same ones as your .env VITE_FIREBASE_* vars).
firebase.initializeApp({
  apiKey: "REPLACE_WITH_VITE_FIREBASE_API_KEY",
  projectId: "REPLACE_WITH_VITE_FIREBASE_PROJECT_ID",
  messagingSenderId: "REPLACE_WITH_VITE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_VITE_FIREBASE_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "DailySpark", {
    body: body || "You have a new notification.",
    icon: "/icon-192.png",
  });
});
