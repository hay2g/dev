// ===== DONNÉES =====
const SECTIONS = {
  quotidien: "🏠 Vie quotidienne",
  travail: "💼 Travail",
  projets: "📋 Projets",
  relations: "👥 Relations",
  divers: "📦 Divers",
  alire: "📖 À lire tous les jours"
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

// ===== COMPTEURS ACCUEIL =====
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

// ===== OUVRIR UNE SECTION =====
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
    list.innerHTML = `<p style="color:var(--text-muted);text-align:center;margin-top:48px;">Aucun rappel pour l'instant.</p>`;
    return;
  }

  rappels.forEach((rappel, index) => {
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

// ===== MODAL DÉTAIL RAPPEL =====
function openRappelModal(rappel) {
  document.getElementById('modal-title').textContent = rappel.titre;
  document.getElementById('modal-date').textContent = rappel.date ? `📅 ${rappel.date}` : '';
  document.getElementById('modal-days').textContent = rappel.jours && rappel.jours.length > 0 ? `🔁 ${rappel.jours.join(', ')}` : '';
  document.getElementById('modal-description').textContent = rappel.description;
  document.getElementById('rappel-modal').classList.remove('hidden');
}

document.getElementById('close-modal-btn').addEventListener('click', () => {
  document.getElementById('rappel-modal').classList.add('hidden');
});

// Fermer modal en cliquant dehors
document.getElementById('rappel-modal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.add('hidden');
});

// ===== RETOUR ACCUEIL =====
document.getElementById('back-btn').addEventListener('click', () => {
  showPage('home');
  updateCounts();
});

// ===== SECTIONS — TAP & APPUI LONG =====
document.querySelectorAll('.section-card').forEach(card => {
  let pressTimer = null;

  card.addEventListener('click', () => {
    openSection(card.dataset.id);
  });

  // Appui long = aperçu rapide
  card.addEventListener('touchstart', () => {
    pressTimer = setTimeout(() => {
      showApercu(card.dataset.id);
    }, 600);
  });

  card.addEventListener('touchend', () => clearTimeout(pressTimer));
  card.addEventListener('touchmove', () => clearTimeout(pressTimer));
});

// ===== APERÇU RAPIDE (appui long) =====
function showApercu(sectionId) {
  const rappels = getRappelsBySection(sectionId);
  const preview = rappels.slice(0, 3).map(r => `• ${r.titre}`).join('\n');
  alert(`${SECTIONS[sectionId]}\n\n${preview || 'Aucun rappel.'}`);
}

// ===== MODAL AJOUT RAPPEL =====
const addModal = document.getElementById('add-modal');

document.getElementById('fab').addEventListener('click', () => {
  // Reset formulaire
  document.getElementById('add-titre').value = '';
  document.getElementById('add-description').value = '';
  document.getElementById('add-date').value = '';
  document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('selected'));

  // Pré-sélectionner la section courante si on est dans une section
  if (currentSection) {
    document.getElementById('add-section').value = currentSection;
  }

  addModal.classList.remove('hidden');
});

document.getElementById('close-add-btn').addEventListener('click', () => {
  addModal.classList.add('hidden');
});

// Fermer en cliquant dehors
addModal.addEventListener('click', function(e) {
  if (e.target === this) this.classList.add('hidden');
});

// Sélection des jours
document.querySelectorAll('.day-btn').forEach(btn => {
  btn.addEventListener('click', () => btn.classList.toggle('selected'));
});

// ===== ENREGISTRER UN RAPPEL =====
document.getElementById('save-rappel-btn').addEventListener('click', () => {
  const titre = document.getElementById('add-titre').value.trim();
  const description = document.getElementById('add-description').value.trim();
  const date = document.getElementById('add-date').value;
  const section = document.getElementById('add-section').value;
  const jours = [...document.querySelectorAll('.day-btn.selected')].map(b => b.dataset.day);

  if (!titre) {
    alert('Le titre est obligatoire !');
    return;
  }
  if (!description) {
    alert('La description est obligatoire !');
    return;
  }

  const rappel = {
    id: Date.now(),
    section,
    titre,
    description,
    date: date || null,
    jours: jours.length > 0 ? jours : []
  };

  const rappels = getRappels();
  rappels.push(rappel);
  saveRappels(rappels);

  addModal.classList.add('hidden');
  updateCounts();

  // Si on est dans la section du rappel ajouté, rafraîchir
  if (currentSection === section) {
    renderRappels(section);
  }
});

// ===== NOTIFICATIONS QUOTIDIENNES =====
function demanderNotification() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function notificationQuotidienne() {
  if (Notification.permission === 'granted') {
    const now = new Date();
    const target = new Date();
    target.setHours(9, 0, 0, 0);
    if (now > target) target.setDate(target.getDate() + 1);
    const delay = target - now;

    setTimeout(() => {
      new Notification('📖 Bonjour !', {
        body: "N'oublie pas de consulter tes rappels aujourd'hui.",
        icon: '/icon-192.png'
      });
      notificationQuotidienne(); // relancer pour le lendemain
    }, delay);
  }
}

// ===== INIT =====
demanderNotification();
notificationQuotidienne();
updateCounts();
showPage('home');