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
  try {
    return JSON.parse(localStorage.getItem('rappels') || '[]');
  } catch(e) {
    return [];
  }
}

function saveRappels(rappels) {
  try {
    localStorage.setItem('rappels', JSON.stringify(rappels));
    sessionStorage.setItem('rappels_backup', JSON.stringify(rappels));
  } catch(e) {
    console.error('Erreur sauvegarde:', e);
  }
}

function getRappelsBySection(sectionId) {
  return getRappels().filter(r => r.section === sectionId);
}

function initStorage() {
  const local = localStorage.getItem('rappels');
  const session = sessionStorage.getItem('rappels_backup');
  if (!local && session) {
    localStorage.setItem('rappels', session);
  }
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

// ===== AFFICHER RAPPELS =====
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
    if (rappel.heure) meta += `<span>⏰ ${rappel.heure}</span>`;
    if (rappel.jours && rappel.jours.length > 0) meta += `<span>🔁 ${rappel.jours.join(', ')}</span>`;

    card.innerHTML = `
      <div class="rappel-card-top">
        <h4>${rappel.titre}</h4>
        <button class="delete-btn" data-id="${rappel.id}">🗑️</button>
      </div>
      ${meta ? `<div class="rappel-meta">${meta}</div>` : ''}
    `;

    card.querySelector('h4').addEventListener('click', () => openRappelModal(rappel));
    const metaEl = card.querySelector('.rappel-meta');
    if (metaEl) metaEl.addEventListener('click', () => openRappelModal(rappel));

    card.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Supprimer "${rappel.titre}" ?`)) {
        const tous = getRappels().filter(r => r.id !== rappel.id);
        saveRappels(tous);
        renderRappels(sectionId);
        updateCounts();
      }
    });

    list.appendChild(card);
  });
}

// ===== MODAL DÉTAIL =====
function openRappelModal(rappel) {
  document.getElementById('modal-title').textContent = rappel.titre;
  document.getElementById('modal-date').textContent = rappel.date
    ? `📅 ${rappel.date}${rappel.heure ? ' à ' + rappel.heure : ''}`
    : rappel.heure ? `⏰ ${rappel.heure}` : '';
  document.getElementById('modal-days').textContent = rappel.jours && rappel.jours.length > 0
    ? `🔁 Jours : ${rappel.jours.join(', ')}${rappel.heure ? ' à ' + rappel.heure : ''}`
    : '';
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
  document.getElementById('add-heure').value = '';
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

// ===== BOUTONS EFFACER DATE & HEURE =====
document.getElementById('clear-date-btn').addEventListener('click', () => {
  document.getElementById('add-date').value = '';
});

document.getElementById('clear-heure-btn').addEventListener('click', () => {
  document.getElementById('add-heure').value = '';
});

// ===== ENREGISTRER RAPPEL =====
document.getElementById('save-rappel-btn').addEventListener('click', () => {
  const titre = document.getElementById('add-titre').value.trim();
  const description = document.getElementById('add-description').value.trim();
  const date = document.getElementById('add-date').value;
  const heure = document.getElementById('add-heure').value;
  const section = document.getElementById('add-section').value;
  const jours = [...document.querySelectorAll('.day-btn.selected')].map(b => b.dataset.day);

  if (!titre) { alert('Le titre est obligatoire !'); return; }
  if (!description) { alert('La description est obligatoire !'); return; }

  const rappel = {
    id: Date.now(),
    section, titre, description,
    date: date || null,
    heure: heure || null,
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

// ===== EXPORT CSV =====
document.getElementById('export-btn').addEventListener('click', () => {
  const rappels = getRappels();
  if (rappels.length === 0) { alert('Aucun rappel à exporter !'); return; }

  const headers = ['id', 'section', 'titre', 'description', 'date', 'heure', 'jours'];
  const csvRows = [headers.join(';')];

  rappels.forEach(r => {
    const values = [
      r.id,
      r.section,
      `"${(r.titre || '').replace(/"/g, '""')}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      r.date || '',
      r.heure || '',
      `"${(r.jours || []).join(',')}"`
    ];
    csvRows.push(values.join(';'));
  });

  const csvContent = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rappels-papa.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ===== IMPORT CSV =====
document.getElementById('import-input').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const text = event.target.result;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      const rappels = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/(".*?"|[^;]+)(?=;|$)/g) || [];
        const clean = v => v ? v.replace(/^"|"$/g, '').replace(/""/g, '"').trim() : '';

        const rappel = {
          id: parseInt(clean(values[0])) || Date.now() + i,
          section: clean(values[1]),
          titre: clean(values[2]),
          description: clean(values[3]),
          date: clean(values[4]) || null,
          heure: clean(values[5]) || null,
          jours: clean(values[6]) ? clean(values[6]).split(',').filter(j => j.trim()) : []
        };

        if (rappel.titre && SECTIONS[rappel.section]) {
          rappels.push(rappel);
        }
      }

      if (rappels.length === 0) {
        alert('Aucun rappel valide trouvé dans le fichier.');
        return;
      }

      const existants = getRappels();
      const idsExistants = new Set(existants.map(r => r.id));
      const nouveaux = rappels.filter(r => !idsExistants.has(r.id));
      const fusion = [...existants, ...nouveaux];

      saveRappels(fusion);
      updateCounts();
      fusion.forEach(r => planifierNotification(r));

      alert(`✅ ${nouveaux.length} rappel(s) importé(s) avec succès !`);

    } catch(err) {
      alert('Erreur lors de la lecture du fichier.');
    }
  };
  reader.readAsText(file, 'UTF-8');
  this.value = '';
});

// ===== NOTIFICATIONS =====
function demanderPermission() {
  const btn = document.getElementById('notif-btn');
  if (!btn) return;

  if (Notification.permission === 'granted') {
    btn.textContent = '✅ Notifications activées';
    btn.classList.add('active');
    return;
  }

  if (Notification.permission === 'denied') {
    btn.textContent = '❌ Notifications bloquées (réglages iPhone)';
    return;
  }

  btn.addEventListener('click', () => {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        btn.textContent = '✅ Notifications activées';
        btn.classList.add('active');
        notifQuotidienne();
        replanifierTous();
      } else {
        btn.textContent = '❌ Notifications refusées';
      }
    });
  });
}

function envoyerNotif(titre, body) {
  if (Notification.permission === 'granted') {
    new Notification(titre, { body, icon: '/icon-192.png' });
  }
}

function getHeureRappel(rappel) {
  if (rappel.heure) {
    const [h, m] = rappel.heure.split(':').map(Number);
    return { h, m };
  }
  return { h: 9, m: 0 };
}

function planifierNotification(rappel) {
  if (Notification.permission !== 'granted') return;
  const now = new Date();
  const { h, m } = getHeureRappel(rappel);

  if (rappel.date && rappel.jours.length === 0) {
    const target = new Date(`${rappel.date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
    const delay = target - now;
    if (delay > 0) setTimeout(() => envoyerNotif(`📅 ${rappel.titre}`, rappel.description), delay);
  }

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
        prochaine.setHours(h, m, 0, 0);
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
        prochaine.setHours(h, m, 0, 0);
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

function replanifierTous() {
  getRappels().forEach(r => planifierNotification(r));
}

// ===== NOTIF QUOTIDIENNE =====
function notifQuotidienne() {
  if (Notification.permission !== 'granted') return;
  const now = new Date();
  const target = new Date();
  target.setHours(8, 0, 0, 0);
  if (now >= target) target.setDate(target.getDate() + 1);
  setTimeout(() => {
    envoyerNotif('📖 Bonjour !', "N'oublie pas de consulter tes rappels aujourd'hui.");
    notifQuotidienne();
  }, target - now);
}

// ===== INIT =====
initStorage();
demanderPermission();
if (Notification.permission === 'granted') {
  notifQuotidienne();
  replanifierTous();
}
updateCounts();
showPage('home');