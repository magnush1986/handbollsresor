const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwy0b0RMcUXo3xguOtukMryHNlYnebQdskaIWHXr3POx7fg9NfUHsMTGjOlDnkOJZybrWZ7r36NfB1/pub?output=csv';

function getCurrentSeason() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  if (year === 2025 && month >= 5) return '2025-2026';
  return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function getEffectiveToday() {
  const today = new Date();
  if (today.getFullYear() === 2025 && (today.getMonth() + 1) < 7) {
    return new Date('2025-07-01');
  }
  return today;
}

let allEvents = [];

function loadEvents() {
  const href = window.location.href.toLowerCase();
  const isUSM = href.includes("usm.html");
  const isCup = href.includes("cup.html");
  const isLedigt = href.includes("ledig.html");
  const todayDate = getEffectiveToday().toISOString().split("T")[0];

  fetch(SHEET_URL)
    .then(res => res.text())
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          const events = results.data;
          allEvents = events;
          const container = document.getElementById('event-container');
          container.innerHTML = '';

          let seasonSelect = document.getElementById('season-filter');
          let typeSelect = document.getElementById('type-filter');
          let placeSelect = document.getElementById('place-filter');

          if (!seasonSelect || !typeSelect || !placeSelect) {
            const filterWrapper = document.createElement('div');
            filterWrapper.className = 'season-filter-wrapper';

            seasonSelect = document.createElement('select');
            seasonSelect.id = 'season-filter';
            const seasonLabel = document.createElement('label');
            seasonLabel.textContent = 'Säsong:';
            seasonLabel.setAttribute('for', 'season-filter');

            const allSeasons = [...new Set(events.map(e => e['Säsong']))].sort().reverse();
            const allOption = document.createElement('option');
            allOption.value = '';
            allOption.textContent = 'Alla säsonger';
            seasonSelect.appendChild(allOption);
            allSeasons.forEach(season => {
              const option = document.createElement('option');
              option.value = season;
              option.textContent = season;
              seasonSelect.appendChild(option);
            });

            const currentSeason = getCurrentSeason();
            seasonSelect.value = allSeasons.includes(currentSeason) ? currentSeason : '';

            typeSelect = document.createElement('select');
            typeSelect.id = 'type-filter';
            const typeLabel = document.createElement('label');
            typeLabel.textContent = 'Typ:';
            typeLabel.setAttribute('for', 'type-filter');

            const allTypes = [...new Set(events.map(e => e['Typ av händelse']))].sort();
            const allTypeOption = document.createElement('option');
            allTypeOption.value = '';
            allTypeOption.textContent = 'Alla typer';
            typeSelect.appendChild(allTypeOption);
            allTypes.forEach(type => {
              const option = document.createElement('option');
              option.value = type;
              option.textContent = type;
              typeSelect.appendChild(option);
            });

            placeSelect = document.createElement('select');
            placeSelect.id = 'place-filter';
            const placeLabel = document.createElement('label');
            placeLabel.textContent = 'Plats:';
            placeLabel.setAttribute('for', 'place-filter');

            const allPlaces = [...new Set(events.map(e => e['Plats']))].sort();
            const allPlaceOption = document.createElement('option');
            allPlaceOption.value = '';
            allPlaceOption.textContent = 'Alla platser';
            placeSelect.appendChild(allPlaceOption);
            allPlaces.forEach(place => {
              const option = document.createElement('option');
              option.value = place;
              option.textContent = place;
              placeSelect.appendChild(option);
            });

            filterWrapper.appendChild(seasonLabel);
            filterWrapper.appendChild(seasonSelect);
            filterWrapper.appendChild(typeLabel);
            filterWrapper.appendChild(typeSelect);
            filterWrapper.appendChild(placeLabel);
            filterWrapper.appendChild(placeSelect);
            container.before(filterWrapper);

            seasonSelect.addEventListener('change', updateFiltersAndRender);
            typeSelect.addEventListener('change', updateFiltersAndRender);
            placeSelect.addEventListener('change', updateFiltersAndRender);
          }

          updateFiltersAndRender();
        }
      });
    });
}

function updateFiltersAndRender() {
  const seasonSelect = document.getElementById('season-filter');
  const typeSelect = document.getElementById('type-filter');
  const placeSelect = document.getElementById('place-filter');

  const selectedSeason = seasonSelect.value;
  const selectedType = typeSelect.value;

  const filteredForTypes = allEvents.filter(e =>
    (!selectedSeason || e['Säsong'] === selectedSeason)
  );

  const filteredForPlaces = allEvents.filter(e =>
    (!selectedSeason || e['Säsong'] === selectedSeason) &&
    (!selectedType || e['Typ av händelse'] === selectedType)
  );

  const allTypes = [...new Set(filteredForTypes.map(e => e['Typ av händelse']))].sort();
  const currentType = typeSelect.value;
  typeSelect.innerHTML = '';
  const allTypeOption = document.createElement('option');
  allTypeOption.value = '';
  allTypeOption.textContent = 'Alla typer';
  typeSelect.appendChild(allTypeOption);
  allTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    if (type === currentType) option.selected = true;
    typeSelect.appendChild(option);
  });

  const allPlaces = [...new Set(filteredForPlaces.map(e => e['Plats']))].sort();
  const currentPlace = placeSelect.value;
  placeSelect.innerHTML = '';
  const allPlaceOption = document.createElement('option');
  allPlaceOption.value = '';
  allPlaceOption.textContent = 'Alla platser';
  placeSelect.appendChild(allPlaceOption);
  allPlaces.forEach(place => {
    const option = document.createElement('option');
    option.value = place;
    option.textContent = place;
    if (place === currentPlace) option.selected = true;
    placeSelect.appendChild(option);
  });

  loadFilteredEvents();
}

function loadFilteredEvents() {
  const seasonSelect = document.getElementById('season-filter');
  const typeSelect = document.getElementById('type-filter');
  const placeSelect = document.getElementById('place-filter');

  const selectedSeason = seasonSelect.value;
  const selectedType = typeSelect.value;
  const selectedPlace = placeSelect.value;
  const currentSeason = getCurrentSeason();
  const todayDate = getEffectiveToday().toISOString().split("T")[0];

  const filtered = allEvents.filter(e =>
    (!selectedSeason || e['Säsong'] === selectedSeason) &&
    (!selectedType || e['Typ av händelse'] === selectedType) &&
    (!selectedPlace || e['Plats'] === selectedPlace)
  );

  const container = document.getElementById('event-container');
  container.innerHTML = '';

  let firstEventRendered = false;

  filtered.forEach(e => {
    renderEventCard(e, container, !firstEventRendered);
    firstEventRendered = true;
  });
}

function renderEventCard(e, target, isFirst = false) {
  const card = document.createElement('details');
  card.className = 'event-card';
  if (isFirst) card.open = true;

  const summary = document.createElement('summary');
  summary.className = 'event-title';
  summary.innerHTML = `
    <span class="summary-text">${e['Namn på händelse']}</span>
    <span class="summary-icon">${isFirst ? '▲' : '▼'}</span>
  `;
  card.appendChild(summary);

  card.addEventListener('toggle', () => {
    const icon = summary.querySelector('.summary-icon');
    if (card.open) {
      icon.textContent = '▲';
    } else {
      icon.textContent = '▼';
    }
  });

  const contentDiv = document.createElement('div');
  contentDiv.className = 'event-content';

  const länk = e["Länk till hemsida"]?.trim();
  const hemsidaUrl = (länk && länk.startsWith("http"))
    ? `<div class="event-line"><strong>🔗 Hemsida:</strong> <a href="${länk}" target="_blank">${new URL(länk).hostname.replace("www.", "")}</a></div>`
    : "";

  const bilderLänk = e["Länk till bilder"]?.trim();
  const bilderHtml = (bilderLänk && bilderLänk.startsWith("http"))
    ? `<div class="event-line">📷 <a href="${bilderLänk}" target="_blank">Se bilder</a></div>`
    : "";

  let samlingHTML = '';
  const samlingH = e['Samling Härnösand']?.trim();
  const samlingP = e['Samling på plats']?.trim();
  if (samlingH && samlingP) {
    samlingHTML = `
      <div class="event-line sampling-line"><span class="icon">🚍</span><span class="label">Samling Härnösand:</span> <span class="value">${samlingH}</span></div>
      <div class="event-line sampling-line"><span class="icon">⏱️</span><span class="label">Samling på plats:</span> <span class="value">${samlingP}</span></div>
    `;
  } else if (samlingH) {
    samlingHTML = `<div class="event-line sampling-line"><span class="icon">🚍</span><span class="label">Samling Härnösand:</span> <span class="value">${samlingH}</span></div>`;
  } else if (samlingP) {
    samlingHTML = `<div class="event-line sampling-line"><span class="icon">⏱️</span><span class="label">Samling på plats:</span> <span class="value">${samlingP}</span></div>`;
  }

  const resväg = e['Resväg']?.trim();
  const resvägHtml = resväg
    ? `<div class="event-line long-text">
         <span class="icon">🗺️</span>
         <span class="value">${resväg}</span>
       </div>`
    : "";

  const ledighet = e['Ledighet']?.trim();
  const ledighetHtml = ledighet
    ? `<div class="event-line long-text">
        <span class="icon">📝</span>
        <span class="value">${ledighet}</span>
      </div>`
    : "";

  const typAvBoende = e['Typ av boende']?.trim();
  const typAvBoendeHtml = typAvBoende
    ? `<div class="event-line"><span class="icon">🛏️</span><span class="label">Typ av boende:</span> <span class="value">${typAvBoende}</span></div>`
    : "";
  
  const namnPåBoende = e['Namn på boende']?.trim();
  const namnPåBoendeHtml = namnPåBoende
    ? `<div class="event-line"><span class="icon">🪧</span><span class="label">Namn på boende:</span> <span class="value">${namnPåBoende}</span></div>`
    : "";
  
  const tillgångTillBoende = e['Tillgång till boende']?.trim();
  const tillgångTillBoendeHtml = tillgångTillBoende
    ? `<div class="event-line"><span class="icon">🔑</span><span class="label">Tillgång till boende:</span> <span class="value">${tillgångTillBoende}</span></div>`
    : "";

  const kostnad = e['Kostnad per spelare']?.trim();
  const kostnadHtml = kostnad
    ? `<div class="event-line"><span class="icon">💰</span><span class="label">Kostnad:</span> <span class="value">${kostnad}</span></div>`
    : "";
  
  const färdsätt = e['Färdsätt']?.trim();
  const färdsättHtml = färdsätt
    ? `<div class="event-line"><span class="icon">🚗</span><span class="label">Färdsätt:</span> <span class="value">${färdsätt}</span></div>`
    : "";
  
  const ledigFrånSkolan = e['Ledig från skolan?']?.trim();
  const ledigFrånSkolanHtml = ledigFrånSkolan
    ? `<div class="event-line"><span class="icon">🏫</span><span class="label">Ledig från skolan:</span> <span class="value">${ledigFrånSkolan}</span></div>`
    : "";

  const adress = e['Adress till boende']?.trim();
  const adressTillBoendeHtml = adress
    ? `<div class="event-line adress-line">
         <div class="main-row">
           <span class="icon">📬</span>
           <span class="label">Adress till boende:</span>
           <span class="value">${adress}</span>
         </div>
         <span class="google-link"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adress)}" target="_blank">Visa på Google Maps</a></span>
       </div>`
    : "";

  contentDiv.innerHTML = `
    <div class="event-section">
      <h3>Grundläggande info</h3>
      <div class="event-line"><span class="icon">🏷️</span><span class="label">Typ:</span> <span class="value">${e['Typ av händelse']}</span></div>
      <div class="event-line"><span class="icon">📍</span><span class="label">Plats:</span> <span class="value">${e['Plats']}</span></div>
      <div class="event-line"><span class="icon">📅</span><span class="label">Period:</span> <span class="value">${e['Datum från']} – ${e['Datum till']}</span></div>
    </div>

    <div class="event-section">
      <h3>Inför resa</h3>
      ${ledigFrånSkolanHtml}
      ${ledighetHtml}
      ${kostnadHtml}
    </div>

    <div class="event-section">
      <h3>Resan</h3>
      ${samlingHTML}
      ${resvägHtml}
      ${färdsättHtml}
    </div>

    <div class="event-section">
      <h3>Boende</h3>
      ${typAvBoendeHtml}
      ${namnPåBoendeHtml}
      ${tillgångTillBoendeHtml}
      ${adressTillBoendeHtml}
    </div>

    <div class="event-section">
      <h3>Länkar</h3>
      ${hemsidaUrl}
      ${bilderHtml}
    </div>
  `;

  card.appendChild(contentDiv);
  target.appendChild(card);
}


document.addEventListener("DOMContentLoaded", loadEvents);
 
