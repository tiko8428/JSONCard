const state = {
  listings: [],
  filtered: [],
  providers: [],
  favorites: new Set(),
  map: null,
  markers: [],
};

const elements = {};

function select(id) {
  const el = document.getElementById(id);
  elements[id] = el;
  return el;
}

function loadFavorites() {
  try {
    const stored = localStorage.getItem('avalon:favorites');
    if (stored) {
      state.favorites = new Set(JSON.parse(stored));
    }
  } catch (err) {
    console.error('Failed to load favorites', err);
  }
}

function saveFavorites() {
  localStorage.setItem('avalon:favorites', JSON.stringify([...state.favorites]));
  updateFavoriteCount();
}

function currency(value) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

function getBadgeClass(offer) {
  return offer === 'Sale' ? 'buy' : 'rent';
}

function computeStats(list) {
  const sale = list.filter(l => l.offer === 'Sale');
  const rent = list.filter(l => l.offer === 'Rent');
  const avgPrice = list.length ? Math.round(list.reduce((sum, l) => sum + Number(l.price || 0), 0) / list.length) : 0;
  return { total: list.length, saleCount: sale.length, rentCount: rent.length, avgPrice };
}

async function loadData() {
  const [listingsResp, providerResp] = await Promise.all([
    fetch('data/listings.json'),
    fetch('data/providers.json'),
  ]);
  state.listings = await listingsResp.json();
  state.providers = await providerResp.json();
  renderProviders();
  updateSourceCount();
  applyFilters();
}

function renderProviders() {
  const grid = select('providerGrid');
  grid.innerHTML = '';
  state.providers.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'provider-card';
    card.innerHTML = `
      <p class="eyebrow">${p.focus}</p>
      <h4>${p.name}</h4>
      <a href="${p.url}" target="_blank" rel="noreferrer">Visit source →</a>
    `;
    grid.appendChild(card);
  });

  const list = select('sources');
  list.innerHTML = '';
  state.providers.slice(0, 8).forEach((p) => {
    const item = document.createElement('a');
    item.className = 'pill button';
    item.href = p.url;
    item.target = '_blank';
    item.rel = 'noreferrer';
    item.textContent = p.name;
    list.appendChild(item);
  });
}

function updateSourceCount() {
  const el = select('sourceCount');
  if (el) el.textContent = `${state.providers.length}`;
}

function attachEvents() {
  select('searchButton').addEventListener('click', applyFilters);
  select('query').addEventListener('input', debounce(applyFilters, 200));
  select('offerFilter').addEventListener('change', applyFilters);
  select('typeFilter').addEventListener('change', applyFilters);
  select('priceMin').addEventListener('input', debounce(applyFilters, 150));
  select('priceMax').addEventListener('input', debounce(applyFilters, 150));
  select('bedsFilter').addEventListener('change', applyFilters);
  select('energyFilter').addEventListener('change', applyFilters);
  select('sortSelect').addEventListener('change', applyFilters);
  select('favoritesOnly').addEventListener('change', applyFilters);
  select('lakefrontOnly').addEventListener('change', applyFilters);

  select('resetFilters').addEventListener('click', () => {
    ['query', 'priceMin', 'priceMax'].forEach((id) => select(id).value = '');
    ['offerFilter', 'typeFilter', 'bedsFilter', 'energyFilter', 'sortSelect'].forEach((id) => select(id).value = select(id).querySelector('option')?.value || 'any');
    ['favoritesOnly', 'lakefrontOnly'].forEach((id) => select(id).checked = false);
    applyFilters();
  });

  select('downloadJson').addEventListener('click', downloadCurrent);
  select('showFavorites').addEventListener('click', () => {
    select('favoritesOnly').checked = true;
    applyFilters();
  });
  select('clearFavorites').addEventListener('click', () => {
    state.favorites.clear();
    saveFavorites();
    applyFilters();
  });

  select('closeModal').addEventListener('click', closeModal);
  select('detailModal').addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') closeModal();
  });

  document.querySelectorAll('#quickTags button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const q = select('query');
      q.value = btn.dataset.tag;
      applyFilters();
    });
  });
}

function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function applyFilters() {
  const query = select('query').value.toLowerCase().trim();
  const offer = select('offerFilter').value;
  const type = select('typeFilter').value;
  const priceMin = Number(select('priceMin').value || 0);
  const priceMax = Number(select('priceMax').value || Infinity);
  const beds = select('bedsFilter').value;
  const energy = select('energyFilter').value;
  const favoritesOnly = select('favoritesOnly').checked;
  const lakefront = select('lakefrontOnly').checked;

  let filtered = state.listings.filter((l) => {
    const haystack = `${l.title} ${l.city} ${l.neighbourhood} ${l.provider} ${l.tags.join(' ')}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesOffer = offer === 'any' || l.offer === offer;
    const matchesType = type === 'any' || l.type === type;
    const matchesBeds = beds === 'any' || (Number(l.beds || 0) >= Number(beds));
    const matchesEnergy = energy === 'any' || l.energy === energy;
    const matchesPrice = Number(l.price) >= priceMin && Number(l.price) <= priceMax;
    const matchesFavorites = !favoritesOnly || state.favorites.has(l.id);
    const matchesLake = !lakefront || (l.tags || []).some(t => t.toLowerCase().includes('lake'));
    return matchesQuery && matchesOffer && matchesType && matchesBeds && matchesEnergy && matchesPrice && matchesFavorites && matchesLake;
  });

  const sort = select('sortSelect').value;
  filtered.sort((a, b) => {
    if (sort === 'priceAsc') return a.price - b.price;
    if (sort === 'priceDesc') return b.price - a.price;
    if (sort === 'sizeDesc') return (b.areaSqm || 0) - (a.areaSqm || 0);
    return new Date(b.listedAt) - new Date(a.listedAt);
  });

  state.filtered = filtered;
  renderListings(filtered);
  renderFavorites();
  updateHeroStats(filtered);
  updateResultsMeta(filtered);
  updateMap(filtered);
}

function renderListings(list) {
  const container = select('cards');
  container.innerHTML = '';
  if (!list.length) {
    container.innerHTML = '<p class="muted">No listings match those filters yet.</p>';
    return;
  }

  list.forEach((l) => {
    const card = document.createElement('div');
    card.className = 'card listing';
    card.innerHTML = `
      <img src="${l.photo}" alt="${l.title}" />
      <div class="body">
        <div class="actions">
          <span class="price">${currency(l.price)} <span class="muted">${l.offer === 'Rent' ? '/mo' : ''}</span></span>
          <button class="ghost favorite-btn" data-id="${l.id}">${state.favorites.has(l.id) ? '★ Saved' : '☆ Save'}</button>
        </div>
        <h4>${l.title}</h4>
        <p class="muted">${l.city} · ${l.neighbourhood}</p>
        <div class="specs">
          <span>${l.beds || 0} bd</span>
          <span>${l.baths || 0} ba</span>
          <span>${l.areaSqm || '—'} m²</span>
          <span>Energy ${l.energy || '—'}</span>
        </div>
        <div class="badges">
          <span class="pill ${getBadgeClass(l.offer)}">${l.offer}</span>
          <span class="pill">${l.type}</span>
          <span class="pill pill-muted">${l.provider}</span>
        </div>
        <div class="badges">
          ${l.tags.map(t => `<span class="pill pill-muted">${t}</span>`).join('')}
        </div>
        <div class="actions">
          <button class="ghost" data-id="${l.id}" data-action="details">Details</button>
          <button class="ghost" onclick="window.open('${l.url}','_blank')">Open source</button>
        </div>
      </div>
    `;
    card.querySelector('[data-action="details"]').addEventListener('click', () => openModal(l));
    card.querySelector('.favorite-btn').addEventListener('click', () => toggleFavorite(l.id));
    container.appendChild(card);
  });
}

function renderFavorites() {
  const list = select('favoriteList');
  list.innerHTML = '';
  const favorites = state.listings.filter(l => state.favorites.has(l.id));
  if (!favorites.length) {
    list.innerHTML = '<p class="muted">No saved homes yet.</p>';
  } else {
    favorites.forEach((l) => {
      const item = document.createElement('div');
      item.className = 'favorite-item';
      item.innerHTML = `
        <div>
          <strong>${l.title}</strong>
          <p class="muted">${l.city} · ${l.neighbourhood}</p>
        </div>
        <div>
          <p class="price">${currency(l.price)}</p>
          <button class="link" onclick="window.open('${l.url}','_blank')">View</button>
        </div>
      `;
      list.appendChild(item);
    });
  }
  updateFavoriteCount();
}

function updateFavoriteCount() {
  select('favoriteCount').textContent = state.favorites.size;
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id); else state.favorites.add(id);
  saveFavorites();
  applyFilters();
}

function updateHeroStats(list) {
  const stats = computeStats(list);
  const hero = select('heroStats');
  hero.innerHTML = '';
  const statItems = [
    { label: 'Listings live', value: stats.total },
    { label: 'Buy', value: stats.saleCount },
    { label: 'Rent', value: stats.rentCount },
    { label: 'Avg. price', value: currency(stats.avgPrice) },
  ];
  statItems.forEach((s) => {
    const div = document.createElement('div');
    div.className = 'stat';
    div.innerHTML = `<p class="eyebrow">${s.label}</p><h3>${s.value}</h3>`;
    hero.appendChild(div);
  });
}

function updateResultsMeta(list) {
  select('resultsTitle').textContent = `${list.length} results`; 
  const newest = list[0]?.listedAt ? formatDate(list[0].listedAt) : '—';
  select('resultsMeta').textContent = `Newest: ${newest} • Source-backed listings with tags, energy class, and map pins`;
}

function initMap() {
  state.map = L.map('map').setView([48.2082, 16.3738], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(state.map);
}

const icons = {
  sale: new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41]
  }),
  rent: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41]
  })
};

function updateMap(list) {
  if (!state.map) initMap();
  state.markers.forEach(m => m.remove());
  state.markers = [];

  list.forEach((l) => {
    if (!l.lat || !l.lng) return;
    const marker = L.marker([l.lat, l.lng], { icon: l.offer === 'Sale' ? icons.sale : icons.rent })
      .addTo(state.map)
      .bindPopup(`<strong>${l.title}</strong><br>${currency(l.price)} ${l.offer === 'Rent' ? '/mo' : ''}<br>${l.city}`);
    state.markers.push(marker);
  });

  if (state.markers.length) {
    const group = L.featureGroup(state.markers);
    state.map.fitBounds(group.getBounds().pad(0.25));
  }
  select('mapCount').textContent = `${state.markers.length} pins`;
}

function downloadCurrent() {
  const blob = new Blob([JSON.stringify(state.filtered, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'avalon-listings.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function openModal(listing) {
  const body = select('modalBody');
  body.innerHTML = `
    <p class="eyebrow">${listing.provider}</p>
    <h3>${listing.title}</h3>
    <p class="muted">${listing.city} · ${listing.neighbourhood}</p>
    <p>${listing.description}</p>
    <div class="specs">
      <span>${listing.beds} bd</span>
      <span>${listing.baths} ba</span>
      <span>${listing.areaSqm} m²</span>
      <span>Energy ${listing.energy}</span>
    </div>
    <div class="badges">
      ${listing.tags.map(t => `<span class='pill pill-muted'>${t}</span>`).join('')}
    </div>
    <p class="price">${currency(listing.price)} ${listing.offer === 'Rent' ? '/mo' : ''}</p>
    <div class="actions">
      <button class="ghost" onclick="window.open('${listing.url}','_blank')">Open source</button>
      <button class="ghost" onclick="window.open('${listing.providerUrl}','_blank')">Provider</button>
      <button onclick="toggleFavorite('${listing.id}')">${state.favorites.has(listing.id) ? '★ Saved' : '☆ Save'}</button>
    </div>
  `;
  select('detailModal').classList.add('open');
  select('detailModal').setAttribute('aria-hidden', 'false');
}

function closeModal() {
  select('detailModal').classList.remove('open');
  select('detailModal').setAttribute('aria-hidden', 'true');
}

function bootstrap() {
  loadFavorites();
  ['query','offerFilter','typeFilter','priceMin','priceMax','bedsFilter','energyFilter','sortSelect','favoritesOnly','lakefrontOnly','cards','heroStats','resultsTitle','resultsMeta','favoriteCount','sources','sourceCount','providerGrid','downloadJson','showFavorites','clearFavorites','map','mapCount','favoriteList','resetFilters','searchButton','quickTags','detailModal','closeModal','modalBody','topSourcesCard'].forEach(select);
  attachEvents();
  loadData().catch((err) => console.error('Failed to load data', err));
}

bootstrap();
