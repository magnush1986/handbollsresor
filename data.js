const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwy0b0RMcUXo3xguOtukMryHNlYnebQdskaIWHXr3POx7fg9NfUHsMTGjOlDnkOJZybrWZ7r36NfB1/pub?output=csv';

function getCurrentSeason() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  if (year === 2025 && month >= 5) return '2025-2026';
  return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function loadEvents() {
  const href = window.location.href.toLowerCase();
  const isUSM = href.includes("usm.html");
  const isCup = href.includes("cup.html");
  const isLedigt = href.includes("ledig.html");

  const todayDate = new Date().toISOString().split("T")[0];
  const currentSeason = getCurrentSeason();
  const virtualToday = (currentSeason === '2025-2026' && todayDate < '2025-07-01') ? '2025-07-01' : todayDate;

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

            // Säsong
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
            if (allSeasons.includes(currentSeason)) {
              seasonSelect.value = currentSeason;
            } else {
              seasonSelect.selectedIndex = 0;
            }

            // Typ
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

            // Plats
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

          if (selectedSeason === '') {
            const groupedBySeason = {};
            filtered.forEach(e => {
              const season = e['Säsong'] || 'Okänd säsong';
              if (!groupedBySeason[season]) groupedBySeason[season] = [];
              groupedBySeason[season].push(e);
            });

            Object.keys(groupedBySeason).sort().reverse().forEach(season => {
              const seasonHeader = document.createElement('h2');
              seasonHeader.textContent = `📆 ${season}`;
              container.appendChild(seasonHeader);

              groupedBySeason[season]
                .sort((a, b) => (a['Datum från'] || '').localeCompare(b['Datum från'] || ''))
                .forEach(e => renderEventCard(e, container));
            });

          } else if (selectedSeason === currentSeason) {
            const upcoming = [];
            const past = [];

            filtered.forEach(e => {
              const end = (e['Datum till'] || e['Datum från'])?.substring(0, 10);
              if (end && end < virtualToday) {
                past.push(e);
              } else {
                upcoming.push(e);
              }
            });

            upcoming
              .sort((a, b) => (a['Datum från'] || '').localeCompare(b['Datum från'] || ''))
              .forEach(e => renderEventCard(e, container));

            if (past.length > 0) {
              const hr = document.createElement('hr');
              container.appendChild(hr);

              const details = document.createElement('details');
              details.className = 'past-events-box';
              details.style.marginTop = '2rem';

              const summary = document.createElement('summary');
              summary.style.fontSize = '1.2rem';
              summary.style.cursor = 'pointer';
              summary.style.fontWeight = 'bold';
              summary.style.marginBottom = '1rem';
              summary.innerHTML = '⬇️ <strong>Tidigare händelser</strong>';
              details.appendChild(summary);

              const pastWrapper = document.createElement('div');
              pastWrapper.id = 'past-container';
              pastWrapper.style.paddingLeft = '1rem';
              pastWrapper.style.paddingBottom = '1rem';
              pastWrapper.style.marginTop = '1rem';
              details.appendChild(pastWrapper);
              container.appendChild(details);

              past
                .sort((a, b) => (a['Datum från'] || '').localeCompare(b['Datum från'] || ''))
                .forEach(e => renderEventCard(e, pastWrapper));
            }

          } else {
            filtered
              .sort((a, b) => (a['Datum från'] || '').localeCompare(b['Datum från'] || ''))
              .forEach(e => renderEventCard(e, container));
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
      <div class="event-line sampling-line"><span class="icon">📍</span><span class="label">Samling på plats:</span> <span class="value">${samlingP}</span></div>
    `;
  } else if (samlingH) {
    samlingHTML = `<div class="event-line sampling-line"><span class="icon">🚍</span><span class="label">Samling Härnösand:</span> <span class="value">${samlingH}</span></div>`;
  } else if (samlingP) {
    samlingHTML = `<div class="event-line sampling-line"><span class="icon">📍</span><span class="label">Samling på plats:</span> <span class="value">${samlingP}</span></div>`;
  }

  card.innerHTML = `
    <div class="event-title">${e['Namn på händelse']}</div>
    <div class="event-line"><span class="icon">🏷️</span><span class="label">Typ:</span> <span class="value">${e['Typ av händelse']}</span></div>
    <div class="event-line"><span class="icon">📍</span><span class="label">Plats:</span> <span class="value">${e['Plats']}</span></div>
    <div class="event-line"><span class="icon">📅</span><span class="label">Period:</span> <span class="value">${e['Datum från']} – ${e['Datum till']}</span></div>
    ${samlingHTML}
    <div class="event-line"><span class="icon">🏫</span><span class="label">Ledig från skolan:</span> <span class="value">${e['Ledig från skolan?']}</span></div>
    <div class="event-line"><span class="icon">💰</span><span class="label">Kostnad:</span> <span class="value">${e['Kostnad per spelare']}</span></div>
    <div class="event-line"><span class="icon">🚗</span><span class="label">Färdsätt:</span> <span class="value">${e['Färdsätt'] || ''}</span></div>
    ${hemsidaUrl}
    ${bilderHtml}
  `;

  target.appendChild(card);
}

document.addEventListener("DOMContentLoaded", loadEvents);
