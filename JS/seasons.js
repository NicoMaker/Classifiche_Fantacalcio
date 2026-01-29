// Function to create a season card HTML
function createSeasonCard(season, isCurrent) {
  const currentBadge = isCurrent
    ? '<div class="current-badge">In corso</div>'
    : "";
  const championBadge = season.champion
    ? `<div class="champion-badge">${season.champion}</div>`
    : "";

  return `
        <a href="${season.url}" class="season-card">
            ${currentBadge}
            <div class="season-card-header">
                <div class="season-year">${season.year}</div>
                <img src="${season.logo}" alt="Stagione ${season.year}">
            </div>
            <div class="season-card-content">
                ${championBadge}
                <h3>${season.title}</h3>
            </div>
        </a>
    `;
}

// Function to load and display seasons from JSON file
async function loadSeasons() {
  const seasonsGrid = document.getElementById("seasonsGrid");

  try {
    const response = await fetch("data/seasons-data.json");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    seasonsGrid.innerHTML = "";

    const sortedSeasons = data.seasons.sort((a, b) => {
      const yearA = Number.parseInt(a.year.split("-")[0]);
      const yearB = Number.parseInt(b.year.split("-")[0]);
      return yearB - yearA;
    });

    if (sortedSeasons.length === 0) {
      seasonsGrid.innerHTML =
        '<div class="error-message">Nessuna stagione trovata.</div>';
      return;
    }

    sortedSeasons.forEach((season, index) => {
      if (!("champion" in season)) {
        season.champion = null;
      }

      const isCurrent = index === 0 && season.champion === null;
      seasonsGrid.innerHTML += createSeasonCard(season, isCurrent);
    });

    console.log(`Caricate ${sortedSeasons.length} stagioni con successo`);
  } catch (error) {
    console.error("Errore nel caricamento delle stagioni:", error);
    let errorMessage = "Errore nel caricamento delle stagioni.";

    if (error.name === "TypeError" && error.message.includes("fetch")) {
      errorMessage =
        "Impossibile caricare il file seasons-data.json. Verifica che il file esista.";
    } else if (error.name === "SyntaxError") {
      errorMessage = "Il file JSON contiene errori di sintassi.";
    } else if (error.message.includes("404")) {
      errorMessage = "File seasons-data.json non trovato.";
    }

    seasonsGrid.innerHTML = `<div class="error-message">${errorMessage}</div>`;
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  console.log("Inizializzazione pagina Generale Stagioni");
  loadSeasons();
});

// Online/offline status
window.addEventListener("online", () => {
  console.log("Connessione ripristinata");
  loadSeasons();
});

window.addEventListener("offline", () => {
  console.log("Connessione persa");
});

document.querySelector(".main-footer .container").innerHTML = `
    <p>&copy; ${new Date().getFullYear()} Serie A Archive. Tutti i diritti riservati.</p>
`;

document.getElementById("currentYear").innerHTML = `
    <p>&copy; ${new Date().getFullYear()} Serie A Archive. Tutti i diritti riservati.</p>
`;