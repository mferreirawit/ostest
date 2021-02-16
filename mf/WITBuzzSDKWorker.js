self.addEventListener('install', onServiceWorkerInstalled);
self.addEventListener('activate', onServiceWorkerActivated);
self.addEventListener('push', event => event.waitUntil(onPushReceived(event)));
self.addEventListener('notificationclick', event => event.waitUntil(onNotificationClicked(event)));

function onServiceWorkerInstalled(event) {
    Log.info("Installing service worker...");
    event.waitUntil(self.skipWaiting());
}

function onServiceWorkerActivated(event) {
    Log.info('WITBuzz Service Worker activated');
    event.waitUntil(self.clients.claim());
}

async function onPushReceived(event) {
    if (event.data) {
        const msg = event.data.json();
        self.registration.showNotification(msg.title, msg.options);
    }
}

async function onNotificationClicked(event) {
    event.notification.close();
    const notificationData = event.notification;
    Log.info('WITBuzz onNotificationClicked', notificationData);
    const urlToOpen = notificationData.data;
    if (urlToOpen) {
        let openClient = null;
        const allClients = await self.clients.matchAll({includeUncontrolled: true, type: 'window'});
        for (const client of allClients) {
            if (client.url === urlToOpen) {
                openClient = client;
                break;
            }
        }
        if (openClient) {
            await openClient.navigate(urlToOpen);
        } else {
            await openUrl(urlToOpen);
        }
    }
}

async function openUrl(url) {
    Log.debug('Opening notification URL:', url);
    try {
        return await self.clients.openWindow(url);
    } catch (e) {
        Log.warn(`Failed to open the URL '${url}':`, e);
        return null;
    }
}

async function needToShowNotification() {
    const allClients = await self.clients.matchAll({includeUncontrolled: true});
    for (const client of allClients) {
        if (client.visibilityState === 'visible') {
            return false;
        }
    }
    return true;
}

