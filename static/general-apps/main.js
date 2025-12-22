const API_URL = "https://itunes.apple.com/lookup?id=1092956865&entity=software";
const FEATURED_APP_NAME = "LingVo";

const grid = document.getElementById("app-grid");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const heroTitle = document.getElementById("hero-title");
const heroGenre = document.getElementById("hero-genre");
const heroDescription = document.getElementById("hero-description");
const heroDownload = document.getElementById("hero-download");
const heroDetail = document.getElementById("hero-detail");
const heroPreview = document.getElementById("hero-preview");
const heroIcon = document.getElementById("hero-icon");
const heroCard = document.getElementById("hero-card");

function normalizeResults(results) {
  const apps = results.filter((item) => item.wrapperType === "software");

  const lingvoIndex = apps.findIndex((item) =>
    item.trackName && item.trackName.toLowerCase().includes(FEATURED_APP_NAME.toLowerCase())
  );

  if (lingvoIndex > 0) {
    const [lingvo] = apps.splice(lingvoIndex, 1);
    apps.unshift(lingvo);
  }

  return apps;
}

function formatDescription(text) {
  return (text || "").split("\n").filter(Boolean).slice(0, 2).join("\n");
}

function setHero(app) {
  heroTitle.textContent = app.trackName;
  heroGenre.textContent = app.primaryGenreName;
  heroDescription.textContent = formatDescription(app.description || "");
  heroDownload.href = app.trackViewUrl;
  heroDetail.href = `app.html?id=${encodeURIComponent(app.trackId)}`;

  heroIcon.src = app.artworkUrl512 || app.artworkUrl100;
  heroIcon.alt = `${app.trackName} icon`;

  const preview = (app.screenshotUrls || [])[0];
  if (preview) {
    heroPreview.style.backgroundImage = `url(${preview})`;
  }

  const accent = getAccentFromImage(app.artworkUrl512 || app.artworkUrl100);
  accent.then((color) => {
    heroCard.style.setProperty("--hero-accent", color);
  });
}

function createCard(app) {
  const card = document.createElement("article");
  card.className = "card";

  const link = document.createElement("a");
  link.href = `app.html?id=${encodeURIComponent(app.trackId)}`;
  link.className = "card-link";
  link.setAttribute("aria-label", `${app.trackName} details`);

  const media = document.createElement("div");
  media.className = "card-media";
  const screenshot = (app.screenshotUrls || [])[0];
  if (screenshot) {
    media.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.55)), url(${screenshot})`;
  }

  const icon = document.createElement("img");
  icon.src = app.artworkUrl100;
  icon.alt = `${app.trackName} icon`;
  icon.loading = "lazy";
  icon.className = "card-icon";

  const name = document.createElement("h3");
  name.textContent = app.trackName;

  const desc = document.createElement("p");
  desc.className = "muted";
  desc.textContent = formatDescription(app.description || "");

  const metaRow = document.createElement("div");
  metaRow.className = "meta-row";
  const genre = document.createElement("span");
  genre.className = "pill soft";
  genre.textContent = app.primaryGenreName;

  const rating = document.createElement("span");
  rating.className = "rating";
  rating.textContent = app.averageUserRating ? `${app.averageUserRating.toFixed(1)} ★` : "New";

  metaRow.append(genre, rating);
  media.appendChild(icon);
  link.append(media, name, desc, metaRow);
  card.appendChild(link);
  return card;
}

function renderApps(apps) {
  grid.innerHTML = "";

  if (!apps.length) {
    grid.innerHTML = '<p class="error">No apps found for this developer.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  apps.forEach((app, index) => {
    if (index === 0) {
      setHero(app);
    }
    fragment.appendChild(createCard(app));
  });

  grid.appendChild(fragment);
}

function getAccentFromImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let r = 0, g = 0, b = 0;
      const length = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      r = Math.round(r / length);
      g = Math.round(g / length);
      b = Math.round(b / length);
      resolve(`rgb(${r}, ${g}, ${b})`);
    };
    img.onerror = () => resolve("#5b7bff");
  });
}

async function loadApps() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const apps = normalizeResults(data.results || []);
    renderApps(apps);
  } catch (err) {
    console.error("Failed to load apps", err);
    loading?.setAttribute("hidden", "true");
    errorBox.hidden = false;
  } finally {
    loading?.setAttribute("hidden", "true");
  }
}

loadApps();
