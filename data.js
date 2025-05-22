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

            seasonSelect.addEventListener('change', loadEvents);
            typeSelect.addEventListener('change', loadEvents);
            placeSelect.addEventListener('change', loadEvents);
          }

          const selectedSeason = seasonSelect.value;
          const selectedType = typeSelect.value;
          const selectedPlace = placeSelect.value;
          const currentSeason = getCurrentSeason();

          const filtered = events.filter(e =>
            (!selectedSeason || e['Säsong'] === selectedSeason) &&
            (!selectedType || e['Typ av händelse'] === selectedType) &&
            (!selectedPlace || e['Plats'] === selectedPlace)
          ).filter(e => {
            const typ = e['Typ av händelse']?.toLowerCase() || '';
            const ledighet = e['Ledig från skolan?']?.toLowerCase() || '';
            if (isUSM && typ !== 'usm') return false;
            if (isCup && typ !== 'cup') return false;
            if (isLedigt && !ledighet.includes('ja')) return false;
            return true;
          });

          container.innerHTML = '';

          function renderGroup(title, list, target) {
            const grouped = {};
            list.forEach(e => {
              const key = `${e['År']}-${e['Månadsnummer'].padStart(2, '0')}`;
              if (!grouped[key]) {
                grouped[key] = {
                  year: e['År'],
                  name: e['Månadsnamn'],
                  data: []
                };
              }
              grouped[key].data.push(e);
            });

            const keys = Object.keys(grouped).sort();
            if (title) {
              const h2 = document.createElement('h2');
              h2.textContent = title;
              target.appendChild(h2);
            }

            keys.forEach(key => {
              const group = grouped[key];
              const groupDiv = document.createElement('div');
              groupDiv.className = 'event-group';
              groupDiv.innerHTML = `<h2>📅 ${group.year} – ${group.name}</h2>`;
              group.data.forEach(e => renderEventCard(e, groupDiv));
              target.appendChild(groupDiv);
            });
          }

          if (!selectedSeason) {
            const groupedBySeason = {};
            filtered.forEach(e => {
              const season = e['Säsong'] || 'Okänd';
              if (!groupedBySeason[season]) groupedBySeason[season] = [];
              groupedBySeason[season].push(e);
            });

            Object.keys(groupedBySeason).sort().reverse().forEach(season => {
              renderGroup(`📆 ${season}`, groupedBySeason[season], container);
            });

          } else if (selectedSeason === currentSeason) {
            const upcoming = [];
            const past = [];

            filtered.forEach(e => {
              const end = (e['Datum till'] || e['Datum från'])?.substring(0, 10);
              if (end && end < todayDate) {
                past.push(e);
              } else {
                upcoming.push(e);
              }
            });

            renderGroup(null, upcoming, container);

            if (past.length > 0) {
              const hr = document.createElement("hr");
              container.appendChild(hr);

              const details = document.createElement("details");
              details.className = "past-events-box";
              details.style.marginTop = "2rem";

              const summary = document.createElement("summary");
              summary.style.fontSize = "1.2rem";
              summary.style.cursor = "pointer";
              summary.style.fontWeight = "bold";
              summary.style.marginBottom = "1rem";
              summary.innerHTML = "⬇️ <strong>Tidigare händelser</strong>";
              details.appendChild(summary);

              const pastWrapper = document.createElement("div");
              pastWrapper.id = "past-container";
              pastWrapper.style.paddingLeft = "1rem";
              pastWrapper.style.paddingBottom = "1rem";
              pastWrapper.style.marginTop = "1rem";
              details.appendChild(pastWrapper);
              container.appendChild(details);

              renderGroup(null, past, pastWrapper);
            }

          } else {
            renderGroup(null, filtered, container);
          }
        }
      });
    });
}

function renderEventCard(e, target) {
  const card = document.createElement('div');
  card.className = 'event-card';

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

  card.innerHTML = `
    <div class="event-title">${e['Namn på händelse']}</div>
    <div class="event-line"><span class="icon">🏷️</span><span class="label">Typ:</span> <span class="value">${e['Typ av händelse']}</span></div>
    <div class="event-line"><span class="icon">📍</span><span class="label">Plats:</span> <span class="value">${e['Plats']}</span></div>
    <div class="event-line"><span class="icon">📅</span><span class="label">Period:</span> <span class="value">${e['Datum från']} – ${e['Datum till']}</span></div>
    ${samlingHTML}
    <div class="event-line"><span class="icon">🏫</span><span class="label">Ledig från skolan:</span> <span class="value">${e['Ledig från skolan?']}</span></div>
    ${ledighetHtml}
    <div class="event-line"><span class="icon">💰</span><span class="label">Kostnad:</span> <span class="value">${e['Kostnad per spelare']}</span></div>
    <div class="event-line"><span class="icon">🚗</span><span class="label">Färdsätt:</span> <span class="value">${e['Färdsätt'] || ''}</span></div>
    ${resvägHtml}
    ${hemsidaUrl}
    ${bilderHtml}
  `;

  target.appendChild(card);
}

}


document.addEventListener("DOMContentLoaded", loadEvents);
