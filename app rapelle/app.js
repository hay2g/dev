// ===== SECTIONS =====
const SECTIONS = {
  quotidien: "🏠 Vie quotidienne",
  travail: "💼 Travail",
  projets: "📋 Projets",
  relations: "👥 Relations",
  divers: "📦 Divers",
  alire: "📖 À lire tous les jours",
  sport: "🏋️ Sport",
  formation: "🎓 Formation",
  zikr: "🤲 Zikr"
};

const JOURS_MAP = {
  "Lun": 1, "Mar": 2, "Mer": 3,
  "Jeu": 4, "Ven": 5, "Sam": 6, "Dim": 0
};

// ===== LOCALSTORAGE =====
function getRappels() {
  return JSON.parse(localStorage.getItem('rappels') || '[]');
}

function saveRappels(rappels) {
  localStorage.setItem('rappels', JSON.stringify(rappels));
}

function getRappelsBySection(sectionId) {
  return getRappels().filter(r => r.section === sectionId);
}

// ===== COMPTEURS =====
function updateCounts() {
  const rappels = getRappels();
  Object.keys(SECTIONS).forEach(id => {
    const count = rappels.filter(r => r.section === id).length;
    const el = document.getElementById(`count-${id}`);
    if (el) el.textContent = count === 0 ? 'Aucun rappel' : `${count} rappel${count > 1 ? 's' : ''}`;
  });
}

// ===== NAVIGATION =====
let currentSection = null;

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(pageId).classList.remove('hidden');
}

// ===== OUVRIR SECTION =====
function openSection(sectionId) {
  currentSection = sectionId;
  document.getElementById('section-view-title').textContent = SECTIONS[sectionId];
  renderRappels(sectionId);
  showPage('section-view');
}

function renderRappels(sectionId) {
  const list = document.getElementById('rappels-list');
  const rappels = getRappelsBySection(sectionId);
  list.innerHTML = '';

  if (rappels.length === 0) {
    list.innerHTML = `<p style="color:var(--text-muted);text-align:center;margin-top:56px;font-size:1rem;">Aucun rappel pour l'instant.</p>`;
    return;
  }

  rappels.forEach(rappel => {
    const card = document.createElement('div');
    card.className = 'rappel-card';

    let meta = '';
    if (rappel.date) meta += `<span>📅 ${rappel.date}</span>`;
    if (rappel.jours && rappel.jours.length > 0) meta += `<span>🔁 ${rappel.jours.join(', ')}</span>`;

    card.innerHTML = `
      <h4>${rappel.titre}</h4>
      ${meta ? `<div class="rappel-meta">${meta}</div>` : ''}
    `;
    card.addEventListener('click', () => openRappelModal(rappel));
    list.appendChild(card);
  });
}

// ===== MODAL DÉTAIL =====
function openRappelModal(rappel) {
  document.getElementById('modal-title').textContent = rappel.titre;
  document.getElementById('modal-date').textContent = rappel.date ? `📅 Date limite : ${rappel.date}` : '';
  document.getElementById('modal-days').textContent = rappel.jours && rappel.jours.length > 0 ? `🔁 Jours : ${rappel.jours.join(', ')}` : '';
  document.getElementById('modal-description').textContent = rappel.description;
  document.getElementById('rappel-modal').classList.remove('hidden');
}

document.getElementById('close-modal-btn').addEventListener('click', () => {
  document.getElementById('rappel-modal').classList.add('hidden');
});

document.getElementById('rappel-modal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.add('hidden');
});

// ===== RETOUR =====
document.getElementById('back-btn').addEventListener('click', () => {
  showPage('home');
  updateCounts();
});

// ===== TAP & APPUI LONG =====
document.querySelectorAll('.section-card').forEach(card => {
  let pressTimer = null;
  let didLongPress = false;

  card.addEventListener('touchstart', () => {
    didLongPress = false;
    pressTimer = setTimeout(() => {
      didLongPress = true;
      showApercu(card.dataset.id);
    }, 600);
  });

  card.addEventListener('touchend', () => clearTimeout(pressTimer));
  card.addEventListener('touchmove', () => clearTimeout(pressTimer));

  card.addEventListener('click', () => {
    if (!didLongPress) openSection(card.dataset.id);
  });
});

// ===== APERÇU RAPIDE =====
function showApercu(sectionId) {
  const rappels = getRappelsBySection(sectionId).slice(0, 4);
  const overlay = document.createElement('div');
  overlay.className = 'apercu-overlay';

  const items = rappels.length > 0
    ? rappels.map(r => `<div class="apercu-item">• ${r.titre}</div>`).join('')
    : `<div class="apercu-empty">Aucun rappel pour l'instant.</div>`;

  overlay.innerHTML = `
    <div class="apercu-box">
      <h3>${SECTIONS[sectionId]}</h3>
      ${items}
      <button class="apercu-close">Fermer</button>
    </div>
  `;

  overlay.querySelector('.apercu-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ===== MODAL AJOUT =====
const addModal = document.getElementById('add-modal');

document.getElementById('fab').addEventListener('click', () => {
  document.getElementById('add-titre').value = '';
  document.getElementById('add-description').value = '';
  document.getElementById('add-date').value = '';
  document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('selected'));
  if (currentSection) document.getElementById('add-section').value = currentSection;
  addModal.classList.remove('hidden');
});

document.getElementById('close-add-btn').addEventListener('click', () => {
  addModal.classList.add('hidden');
});

addModal.addEventListener('click', function(e) {
  if (e.target === this) this.classList.add('hidden');
});

document.querySelectorAll('.day-btn').forEach(btn => {
  btn.addEventListener('click', () => btn.classList.toggle('selected'));
});

// ===== ENREGISTRER RAPPEL =====
document.getElementById('save-rappel-btn').addEventListener('click', () => {
  const titre = document.getElementById('add-titre').value.trim();
  const description = document.getElementById('add-description').value.trim();
  const date = document.getElementById('add-date').value;
  const section = document.getElementById('add-section').value;
  const jours = [...document.querySelectorAll('.day-btn.selected')].map(b => b.dataset.day);

  if (!titre) { alert('Le titre est obligatoire !'); return; }
  if (!description) { alert('La description est obligatoire !'); return; }

  const rappel = {
    id: Date.now(),
    section, titre, description,
    date: date || null,
    jours: jours.length > 0 ? jours : []
  };

  const rappels = getRappels();
  rappels.push(rappel);
  saveRappels(rappels);

  addModal.classList.add('hidden');
  updateCounts();
  planifierNotification(rappel);

  if (currentSection === section) renderRappels(section);
});

// ===== NOTIFICATIONS INTELLIGENTES =====
function demanderPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function envoyerNotif(titre, body) {
  if (Notification.permission === 'granted') {
    new Notification(titre, { body, icon: '/icon-192.png' });
  }
}

function planifierNotification(rappel) {
  if (Notification.permission !== 'granted') return;

  const now = new Date();

  // CAS 1 — Date seulement → notif le jour J à 9h
  if (rappel.date && rappel.jours.length === 0) {
    const target = new Date(rappel.date + 'T09:00:00');
    const delay = target - now;
    if (delay > 0) {
      setTimeout(() => {
        envoyerNotif(`📅 ${rappel.titre}`, rappel.description);
      }, delay);
    }
  }

  // CAS 2 — Date + jours → notif les jours choisis à 9h jusqu'à la date
  if (rappel.date && rappel.jours.length > 0) {
    const datelimite = new Date(rappel.date + 'T23:59:59');
    function planifierProchainJour() {
      const maintenant = new Date();
      if (maintenant > datelimite) return;
      const jourActuel = maintenant.getDay();
      const joursNumeriques = rappel.jours.map(j => JOURS_MAP[j]);
      let minDelay = Infinity;
      joursNumeriques.forEach(jour => {
        let diff = (jour - jourActuel + 7) % 7;
        if (diff === 0) diff = 7;
        const prochaine = new Date(maintenant);
        prochaine.setDate(prochaine.getDate() + diff);
        prochaine.setHours(9, 0, 0, 0);
        const delay = prochaine - maintenant;
        if (delay < minDelay) minDelay = delay;
      });
      if (minDelay !== Infinity && minDelay > 0) {
        setTimeout(() => {
          envoyerNotif(`🔁 ${rappel.titre}`, rappel.description);
          planifierProchainJour();
        }, minDelay);
      }
    }
    planifierProchainJour();
  }

  // CAS 3 — Jours seulement → notif ces jours toute l'année à 9h
  if (!rappel.date && rappel.jours.length > 0) {
    function planifierJourRecurrent() {
      const maintenant = new Date();
      const jourActuel = maintenant.getDay();
      const joursNumeriques = rappel.jours.map(j => JOURS_MAP[j]);
      let minDelay = Infinity;
      joursNumeriques.forEach(jour => {
        let diff = (jour - jourActuel + 7) % 7;
        if (diff === 0) diff = 7;
        const prochaine = new Date(maintenant);
        prochaine.setDate(prochaine.getDate() + diff);
        prochaine.setHours(9, 0, 0, 0);
        const delay = prochaine - maintenant;
        if (delay < minDelay) minDelay = delay;
      });
      if (minDelay !== Infinity) {
        setTimeout(() => {
          envoyerNotif(`🔁 ${rappel.titre}`, rappel.description);
          planifierJourRecurrent();
        }, minDelay);
      }
    }
    planifierJourRecurrent();
  }
}

// Replanifier tous les rappels au démarrage
function replanifierTous() {
  getRappels().forEach(r => planifierNotification(r));
}

// ===== NOTIFICATION QUOTIDIENNE =====
function notifQuotidienne() {
  if (Notification.permission !== 'granted') return;
  const now = new Date();
  const target = new Date();
  target.setHours(8, 0, 0, 0);
  if (now >= target) target.setDate(target.getDate() + 1);
  const delay = target - now;
  setTimeout(() => {
    envoyerNotif('📖 Bonjour !', "N'oublie pas de consulter tes rappels aujourd'hui.");
    notifQuotidienne();
  }, delay);
}

// ===== EXPORT EXCEL =====
document.getElementById('export-btn').addEventListener('click', () => {
  const rappels = getRappels();
  if (rappels.length === 0) {
    alert('Aucun rappel à exporter !');
    return;
  }

  const data = rappels.map(r => ({
    'Section': SECTIONS[r.section] || r.section,
    'Titre': r.titre,
    'Description': r.description,
    'Date': r.date || 'Pas de date',
    'Jours': r.jours.length > 0 ? r.jours.join(', ') : 'Tous les jours'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rappels');

  // Style colonnes
  ws['!cols'] = [
    { wch: 22 }, { wch: 28 }, { wch: 40 }, { wch: 14 }, { wch: 20 }
  ];

  XLSX.writeFile(wb, 'rappels-papa.xlsx');
});

// ===== INIT =====
demanderPermission();
notifQuotidienne();
replanifierTous();
updateCounts();
showPage('home');