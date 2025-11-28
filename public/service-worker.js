self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icon-192x192.png', // Certifique-se de ter este ícone
    badge: '/icon-192x192.png',
    vibrate: [500, 1000, 500, 1000, 500], // Vibra: 0.5s, Pausa 1s, Vibra 0.5s...
    tag: 'waiter-call', // Impede flood, atualiza a mesma notificação
    renotify: true, // Vibra novamente se chegar outra notificação com a mesma tag
    requireInteraction: true, // A notificação fica na tela até o usuário interagir
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // Se o app já estiver aberto, foca nele
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não, abre
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});