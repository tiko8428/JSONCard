const API_URL = "https://itunes.apple.com/lookup?id=1092956865&entity=software";
const FEATURED_APP_NAME = "LingVo";
const grid = document.getElementById("app-grid");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");

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

function renderApps(apps) {
  grid.innerHTML = "";

  if (!apps.length) {
    grid.innerHTML = '<p class="error">No apps found for this developer.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  apps.forEach((app) => {
    const card = document.createElement("article");
    card.className = "card";

    const link = document.createElement("a");
    link.href = `app.html?id=${encodeURIComponent(app.trackId)}`;
    link.className = "card-link";
    link.setAttribute("aria-label", `${app.trackName} details`);

    const image = document.createElement("img");
    image.src = app.artworkUrl100;
    image.alt = `${app.trackName} icon`;
    image.loading = "lazy";

    const name = document.createElement("h3");
    name.textContent = app.trackName;

    const genre = document.createElement("p");
    genre.className = "subtext";
    genre.textContent = app.primaryGenreName;

    link.append(image, name, genre);
    card.appendChild(link);
    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
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
