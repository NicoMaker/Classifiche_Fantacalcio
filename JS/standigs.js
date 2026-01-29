// Global variables
let teamsData = [],
  criteriaLabels = {},
  zonesData = {},
  currentSortCriteria = "points",
  currentFilter = "all",
  searchTerm = "";

// Normalizza nome zona
function normalizeZoneName(name) {
  return name
    ? name.toString().trim().toLowerCase().replace(/\s+/g, "-")
    : "none";
}

// NON calcola punti, li legge dal JSON
function updateTeamStats(teams) {
  teams.forEach((team) => {
    if (team.fantapunti === undefined) {
      team.fantapunti = 0;
    }
  });
}

const teamdata = document.getElementById("teamdata").getAttribute("link"),
  zonedata = document.getElementById("zonedata").getAttribute("link");

// Caricamento dati
async function loadTeamsData() {
  try {
    showLoading(true);
    hideError();
    hideNoResults();

    const teamsResponse = await fetch(teamdata);
    if (!teamsResponse.ok)
      throw new Error("Errore nel caricamento dei dati delle squadre");

    teamsData = await teamsResponse.json();
    updateTeamStats(teamsData.teams);

    const labelsResponse = await fetch("../../data/criteri.json");
    if (!labelsResponse.ok)
      throw new Error("Errore nel caricamento delle etichette");
    criteriaLabels = await labelsResponse.json();

    const zonesResponse = await fetch(zonedata);
    if (!zonesResponse.ok)
      throw new Error("Errore nel caricamento dei dati delle zone");
    zonesData = await zonesResponse.json();

    sortTable("points"); // ordina e poi stampa
    generateLegend();
    updateFooterDate();
    showLoading(false);
  } catch (error) {
    console.error("Errore nel caricamento dei dati:", error);
    showError();
    showLoading(false);
  }
}

// Footer
function updateFooterDate() {
  const footer = document.getElementById("info");
  if (!footer) return;

  const footerText = footer.querySelector("p");
  if (!footerText) return;

  const seasonHasChampion =
    teamsData.champion && teamsData.champion.trim() !== "";

  if (seasonHasChampion) {
    footerText.textContent = `© Info Serie A ${teamsData.endDate}`;
  } else {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, "0");
    const month = today.toLocaleString("it-IT", { month: "long" });
    const year = today.getFullYear();
    footerText.textContent = `© Info Serie A ${day} ${month} ${year}`;
  }
}

function showLoading(show) {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (!loadingOverlay) return;
  loadingOverlay.style.display = show ? "flex" : "none";
}

function showError() {
  const errorMessage = document.getElementById("error-message");
  if (!errorMessage) return;
  errorMessage.style.display = "flex";
}

function hideError() {
  const errorMessage = document.getElementById("error-message");
  if (!errorMessage) return;
  errorMessage.style.display = "none";
}

function showNoResults() {
  const noResultsMessage = document.getElementById("no-results-message");
  if (!noResultsMessage) return;
  noResultsMessage.style.display = "flex";
}

function hideNoResults() {
  const noResultsMessage = document.getElementById("no-results-message");
  if (!noResultsMessage) return;
  noResultsMessage.style.display = "none";
}

// Zona per posizione
function getTeamZone(position) {
  if (!zonesData.zones) return { raw: "none", normalized: "none" };

  for (const zone of zonesData.zones) {
    if (zone.positions.includes(position)) {
      return {
        raw: zone.name,
        normalized: normalizeZoneName(zone.name),
      };
    }
  }
  return { raw: "none", normalized: "none" };
}

// SOLO posizione, nome+logo, punti, fantapunti
function loadTableData(teams) {
  const table = document.getElementById("league-table");
  if (!table) return;

  const tableBody = table.getElementsByTagName("tbody")[0];
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (teams.length === 0) {
    showNoResults();
    return;
  }

  hideNoResults();

  teams.forEach((team, index) => {
    const row = tableBody.insertRow();
    const position = index + 1;

    const zoneInfo = getTeamZone(position);
    if (zoneInfo.normalized !== "none") {
      row.classList.add(`${zoneInfo.normalized}-zone`);
      row.dataset.zone = zoneInfo.normalized; // es. "fascia-1"
      row.dataset.zoneRaw = zoneInfo.raw;
    }

    // Posizione
    const positionCell = row.insertCell();
    positionCell.textContent = position;
    positionCell.classList.add("pos-col");

    // Nome + logo (nome squadra / fantallenatore)
    const teamCell = row.insertCell();
    teamCell.innerHTML = `
      <img src="${team.image}" alt="${team.name}" width="36" height="36" />
      ${team.name}
    `;
    teamCell.classList.add("team-col");

    // Punti
    const pointsCell = row.insertCell();
    pointsCell.textContent = team.points;
    pointsCell.classList.add("pts-col");

    // Fantapunti
    const fantapuntiCell = row.insertCell();
    fantapuntiCell.textContent =
      team.fantapunti !== undefined ? team.fantapunti : "-";
    fantapuntiCell.classList.add("fantapunti-col");
  });
}

// sort per punti decrescenti
function sortTeamsByPointsDescending(teams) {
  return [...teams].sort((a, b) => b.points - a.points);
}

// gestore sort
function sortTable(criteria) {
  currentSortCriteria = criteria;
  const sortedTeams = sortTeamsByCriteria(teamsData.teams, criteria);
  const filteredTeams = filterTeamsBySearchTerm(sortedTeams);
  loadTableData(filteredTeams);
  highlightSelectedButton(criteria);
  displaySortingCriteria(criteria);
  if (currentFilter !== "all") filterTableByZone(currentFilter);
}

function sortTeamsByCriteria(teams, criteria) {
  switch (criteria) {
    case "points":
      return sortTeamsByPointsDescending(teams);
    case "name":
      return [...teams].sort((a, b) => a.name.localeCompare(b.name));
    case "fantapunti":
      return [...teams].sort(
        (a, b) => (b.fantapunti || 0) - (a.fantapunti || 0)
      );
    default:
      return teams;
  }
}

function filterTeamsBySearchTerm(teams) {
  return searchTerm
    ? teams.filter((team) =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : teams;
}

function highlightSelectedButton(criteria) {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach((button) => {
    button.classList.remove("selected");
    if (button.dataset.criteria === criteria)
      button.classList.add("selected");
  });
}

function displaySortingCriteria(criteria) {
  const sortingCriteria = document.getElementById("sorting-criteria");
  if (!sortingCriteria) return;
  const sortingText = sortingCriteria.querySelector("span");
  if (!sortingText) return;
  sortingText.textContent =
    criteriaLabels[criteria] || "Nessun criterio selezionato";
}

// Filtri per zone (incluse fasce)
function filterTableByZone(zone) {
  currentFilter = zone;
  highlightLegendItem(zone);

  const rows = document.querySelectorAll("#league-table tbody tr");
  if (!rows.length) return;

  // Caso speciale: pulsante "Champions" che accorpa champions + championship
  if (zone === "champions") {
    rows.forEach((row) => {
      if (
        row.dataset.zone === "champions" ||
        row.dataset.zone === "championship"
      ) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
    return;
  }

  if (zone === "all") {
    rows.forEach((row) => {
      row.style.display = "";
    });
    return;
  }

  // Fasce e altre zone: matching diretto con dataset.zone (es. "fascia-1")
  rows.forEach((row) => {
    row.style.display = row.dataset.zone === zone ? "" : "none";
  });
}

function highlightLegendItem(zone) {
  const legendItems = document.querySelectorAll(".legend-item");
  legendItems.forEach((item) => {
    item.classList.remove("selected-legend");
  });

  if (zone !== "all") {
    const selectedItem = document.querySelector(`.legend-item.${zone}`);
    if (selectedItem) selectedItem.classList.add("selected-legend");
  }
}

function generateLegend() {
  const legend = document.querySelector(".legend");
  if (!legend) return;

  legend.innerHTML = "";
  if (!zonesData.zones) return;

  zonesData.zones.forEach((zone) => {
    const normalizedName = normalizeZoneName(zone.name); // es. "fascia-1"
    const legendItem = document.createElement("div");
    legendItem.className = `legend-item ${normalizedName}`;
    legendItem.innerHTML = `
      <span class="legend-color" style="background-color: ${zone.color}"></span>
      <span>${zone.label}</span>
    `;
    legendItem.style.cursor = "pointer";
    legendItem.addEventListener("click", () => {
      filterTableByZone(normalizedName);
    });
    legend.appendChild(legendItem);
  });

  const resetButton = document.createElement("div");
  resetButton.className = "legend-item reset";
  resetButton.innerHTML = `
    <span class="legend-color" style="background-color: #64748b"></span>
    <span>Mostra tutte</span>
  `;
  resetButton.style.cursor = "pointer";
  resetButton.addEventListener("click", () => {
    filterTableByZone("all");
  });
  legend.appendChild(resetButton);
}

function searchTeams(term) {
  searchTerm = term.trim();
  showLoading(true);
  setTimeout(() => {
    const filteredTeams = teamsData.teams.filter((team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    loadTableData(filteredTeams);
    showLoading(false);
    if (filteredTeams.length === 0) showNoResults();
  }, 300);
}

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      const criteria = this.dataset.criteria;
      sortTable(criteria);
    });
  });

  const retryButton = document.getElementById("retry-button");
  if (retryButton) {
    retryButton.addEventListener("click", loadTeamsData);
  }

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      searchTeams(this.value);
    });
  }

  loadTeamsData();
});
