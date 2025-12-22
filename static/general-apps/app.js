const detailsContainer = document.getElementById("app-details");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const appNameHeading = document.getElementById("app-name");

function getAppId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function buildFeatureList(app) {
  const list = document.createElement("ul");
  list.className = "feature-list";

  const features = [
    ["Category", app.primaryGenreName],
    ["Price", app.formattedPrice],
    ["Minimum iOS", app.minimumOsVersion && `iOS ${app.minimumOsVersion}`],
    ["Size", app.fileSizeBytes && `${(Number(app.fileSizeBytes) / (1024 * 1024)).toFixed(1)} MB`],
    ["Seller", app.sellerName],
  ].filter(([, value]) => Boolean(value));

  features.forEach(([label, value]) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${label}:</strong> ${value}`;
    list.appendChild(li);
  });

  return list;
}

function renderApp(app) {
  detailsContainer.innerHTML = "";

  const header = document.createElement("div");
  header.className = "app-hero";

  const cover = document.createElement("img");
  cover.className = "app-cover";
  cover.src = app.artworkUrl512 || app.artworkUrl100;
  cover.alt = `${app.trackName} icon`;

  const titleBlock = document.createElement("div");

  const title = document.createElement("h2");
  title.textContent = app.trackName;

  const subtitle = document.createElement("p");
  subtitle.className = "subtext";
  subtitle.textContent = app.artistName;

  const download = document.createElement("a");
  download.className = "primary-button";
  download.href = app.trackViewUrl;
  download.target = "_blank";
  download.rel = "noopener noreferrer";
  download.textContent = "Download on the App Store";

  titleBlock.append(title, subtitle, download);
  header.append(cover, titleBlock);

  const description = document.createElement("p");
  description.className = "description";
  description.textContent = app.description;

  const whatsNew = document.createElement("div");
  whatsNew.className = "panel";
  whatsNew.innerHTML = `
    <h3>What's New</h3>
    <p>${app.releaseNotes || "Release notes not available."}</p>
  `;

  const features = document.createElement("div");
  features.className = "panel";
  features.innerHTML = "<h3>App Info</h3>";
  features.appendChild(buildFeatureList(app));

  detailsContainer.append(header, description, whatsNew, features);
  appNameHeading.textContent = app.trackName;
}

async function loadApp() {
  const id = getAppId();
  if (!id) {
    loading?.setAttribute("hidden", "true");
    errorBox.hidden = false;
    errorBox.textContent = "Missing app id.";
    return;
  }

  try {
    const response = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const app = (data.results || []).find((item) => item.wrapperType === "software");

    if (!app) {
      throw new Error("App not found");
    }

    renderApp(app);
  } catch (err) {
    console.error("Failed to load app", err);
    errorBox.hidden = false;
  } finally {
    loading?.setAttribute("hidden", "true");
  }
}

loadApp();
