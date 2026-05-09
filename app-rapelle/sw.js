const CACHE_NAME = 'agenda-papa-v6';
const FILES = [
  '/dev/app-rapelle/',
  '/dev/app-rapelle/index.html',
  '/dev/app-rapelle/style.css',
  '/dev/app-rapelle/app.js',
  '/dev/app-rapelle/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ===== NOTIFICATIONS PLANIFIÉES =====
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'PLANIFIER') {
    const rappels = e.data.rappels || [];
    planifierDepuisSW(rappels);
  }
});

function planifierDepuisSW(rappels) {
  const JOURS_MAP = {
    "Lun": 1, "Mar": 2, "Mer": 3,
    "Jeu": 4, "Ven": 5, "Sam": 6, "Dim": 0
  };

  rappels.forEach(rappel => {
    const now = Date.now();
    const h = rappel.heure ? parseInt(rappel.heure.split(':')[0]) : 9;
    const m = rappel.heure ? parseInt(rappel.heure.split(':')[1]) : 0;

    // Date fixe
    if (rappel.date && (!rappel.jours || rappel.jours.length === 0)) {
      const target = new Date(`${rappel.date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`).getTime();
      const delay = target - now;
      if (delay > 0) {
        setTimeout(() => {
          self.registration.showNotification(`📅 ${rappel.titre}`, {
            body: rappel.description,
            icon: '/dev/app-rapelle/icon-192.png',
            badge: '/dev/app-rapelle/icon-192.png',
            tag: `rappel-${rappel.id}`
          });
        }, delay);
      }
    }

    // Jours récurrents sans date limite
    if (!rappel.date && rappel.jours && rappel.jours.length > 0) {
      const jourActuel = new Date().getDay();
      rappel.jours.forEach(jour => {
        let diff = (JOURS_MAP[jour] - jourActuel + 7) % 7;
        if (diff === 0) diff = 7;
        const prochaine = new Date();
        prochaine.setDate(prochaine.getDate() + diff);
        prochaine.setHours(h, m, 0, 0);
        const delay = prochaine.getTime() - now;
        if (delay > 0) {
          setTimeout(() => {
            self.registration.showNotification(`🔁 ${rappel.titre}`, {
              body: rappel.description,
              icon: '/dev/app-rapelle/icon-192.png',
              badge: '/dev/app-rapelle/icon-192.png',
              tag: `rappel-${rappel.id}-${jour}`
            });
          }, delay);
        }
      });
    }
  });
}

// ===== NOTIF QUOTIDIENNE 8H =====
function planifierNotifMatin() {
  const now = new Date();
  const target = new Date();
  target.setHours(8, 0, 0, 0);
  if (now >= target) target.setDate(target.getDate() + 1);
  const delay = target.getTime() - now.getTime();
  setTimeout(() => {
    self.registration.showNotification('📖 Bonjour !', {
      body: "N'oublie pas de consulter tes rappels aujourd'hui.",
      icon: '/dev/app-rapelle/icon-192.png',
      tag: 'notif-matin'
    });
    planifierNotifMatin();
  }, delay);
}

planifierNotifMatin();