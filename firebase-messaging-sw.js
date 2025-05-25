// firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Ton config Firebase (copié de ton Firebase Console)
firebase.initializeApp({
  apiKey: "AIzaSyAgXFtEtlxPNcHwAHSxT2i4uWMql3EzjL0",
  authDomain: "sigpe-7aef8.firebaseapp.com",
  projectId: "sigpe-7aef8",
  storageBucket: "sigpe-7aef8.firebasestorage.app",
  messagingSenderId: "336925196017",
  appId: "1:336925196017:web:f9a0a0f3b2b95cfa55f350",
  measurementId: "G-1YBZ37QQ2Q"
});

const messaging = firebase.messaging();

// Notification reçue en arrière-plan (navigateur fermé ou onglet inactif)
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Message reçu : ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/icons/icon-72x72.png', // Facultatif, tu peux changer le chemin
    data: {
      url: payload.fcmOptions?.link || payload.data?.redirect || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Ouvrir un nouvel onglet si aucun n'est ouvert avec l'app
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
