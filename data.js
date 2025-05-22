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
  const today = new Date().toISOString().split("T")[0];

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
            filterWrapper.className = 'event-filter-wrapper';

            // Säsong-filter
            seasonSelect = document.createElement('select');
            seasonSelect.id = 'season-filter';
            const seasonLabel = document.createElement('label');
            seasonLabel.textContent = 'Säsong:';
            seasonLabel.setAttribute('for', 'season-filter');

            const allSeasons = [...new Set(events.map(e => e['Säsong']))].sort().reverse();
            allSeasons.forEach(season => {
              const option = document.createElement('option');
              option.value = season;
              option.textContent = season;
              seasonSelect.appendChild(option);
            });

            const currentSeason = getCurrentSeason();
            if (allSeasons.includes(currentSeason)) {
              seasonSelect.value = currentSeason;
            } else {
              seasonSelect.selectedIndex = 0;
            }

            // Typ-filter
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

            // Plats-filter
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

            let isUpdating = false;
            function onFilterChange() {
              if (isUpdating) return;
              isUpdating = true;
              updateFiltersAndRender();
              isUpdating = false;
            }

            seasonSelect.addEventListener('change', onFilterChange);
            typeSelect.addEventListener('change', onFilterChange);
            placeSelect.addEventListener('change', onFilterChange);
          }

          function updateFiltersAndRender() {
            const selectedSeason = seasonSelect.value;
            const selectedType = typeSelect.value;
            const selectedPlace = placeSelect.value;

            // Uppdatera filterval baserat på andra filter
            const filteredForSeason = events.filter(e =>
              (!selectedType || selectedType === '' || e['Typ av händelse'] === selectedType) &&
              (!selectedPlace || selectedPlace === '' || e['Plats'] === selectedPlace)
            );
            updateSelectOptions(seasonSelect, [...new Set(filteredForSeason.map(e => e['Säsong']))].sort().reverse(), selectedSeason, 'Alla säsonger');

            const filteredForType = events.filter(e =>
              (!selectedSeason || selectedSeason === '' || e['Säsong'] === selectedSeason) &&
              (!selectedPlace || selectedPlace === '' || e['Plats'] === selectedPlace)
            );
            updateSelectOptions(typeSelect, [...new Set(filteredForType.map(e => e['Typ av händelse']))].sort(), selectedType, 'Alla typer');

            const filteredForPlace = events.filter(e =>
              (!selectedSeason || selectedSeason === '' || e['Säsong'] === selectedSeason) &&
              (!selectedType || selectedType === '' || e['Typ av händelse'] === selectedType)
            );
            updateSelectOptions(placeSelect, [...new Set(filteredForPlace.map(e => e['Plats']))].sort(), selectedPlace, 'Alla platser');

            renderEvents();
          }

          function updateSelectOptions(selectElem, options, currentValue, allText) {
            const oldValue = selectElem.value;
            selectElem.innerHTML = '';
            const allOption = document.createElement('option');
            allOption.value = '';
            allOption.textContent = allText;
            selectElem.appendChild(allOption);

            options.forEach(opt => {
              const option = document.createElement('option');
              option.value = opt;
              option.textContent = opt;
              selectElem.appendChild(option);
            });

            if (options.includes(oldValue)) {
              selectElem.value = oldValue;
            } else {
              selectElem.value = '';
            }
          }

          function renderEvents() {
            const selectedSeason = seasonSelect.value;
            const selectedType = typeSelect.value;
            const selectedPlace = placeSelect.value;

            const filteredEvents = events.filter(e =>
              (!selectedSeason || e['Säsong'] === selectedSeason) &&
              (!selectedType || selectedType === '' || e['Typ av händelse'] === selectedType) &&
              (!selectedPlace || selectedPlace === '' || e['Plats'] === selectedPlace)
            );

            // Sida-specifika filter
            const typFilter = e => {
              const typ = e['Typ av händelse']?.toLowerCase() || '';
              const ledighet = e['Ledig från skolan?']?.toLowerCase() || '';
              if (isUSM && typ !== 'usm') return false;
              if (isCup && typ !== 'cup') return false;
              if (isLedigt && !ledighet.includes('ja')) return false;
              return true;
            };

            const upcomingGrouped = {};
            const pastGrouped = {};

            const todayDate = new Date().toISOString().split("T")[0];

            filteredEvents.filter(typFilter).forEach(e => {
              const year = e['År'];
              const monthNum = e['Månadsnummer'].padStart(2, '0');
              const monthName = e['Månadsnamn'];
              const key = `${year}-${monthNum}`;
              const groupEntry = { namn: monthName, år: year, data: [] };

              const slutdatumRaw = e['Datum till'] || e['Datum från'];
              const slutdatum = slutdatumRaw?.substring(0, 10) || "0000-00-00";
              const isPast = slutdatum < todayDate;
              e._isPast = isPast;

              const target = isPast ? pastGrouped : upcomingGrouped;
              if (!target[key]) target[key] = { ...groupEntry, data: [] };
              target[key].data.push(e);
            });

            container.innerHTML = '';

            function renderGrouped(grouped, targetContainer, reverse = false) {
              const keys = Object.keys(grouped).sort((a, b) => {
                const [ay, am] = a.split('-').map(Number);
                const [by, bm] = b.split('-').map(Number);
                return reverse
                  ? (by !== ay ? by - ay : bm - am)
                  : (ay !== by ? ay - by : am - bm);
              });

              keys.forEach(key => {
                const { namn, år, data } = grouped[key];
                const groupDiv = document.createElement('div');
                groupDiv.className = 'event-group';
                groupDiv.innerHTML = `<h2>📅 ${år} – ${namn}</h2>`;

                data.forEach(e => {
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
                      <div class="event-line sampling-line"><strong>🚍 Samling Härnösand:</strong> ${samlingH}</div>
                      <div class="event-line sampling-line"><strong>📍 Samling på plats:</strong> ${samlingP}</div>
                    `;
                  } else if (samlingH) {
                    samlingHTML = `<div class="event-line sampling-line"><strong>🚍 Samling Härnösand:</strong> ${samlingH}</div>`;
                  } else if (samlingP) {
                    samlingHTML = `<div class="event-line sampling-line"><strong>📍 Samling på plats:</strong> ${samlingP}</div>`;
                  }

                  card.innerHTML = `
                    <div class="event-title">${e['Namn på händelse']}</div>

                    <div class="event-line place-type">
                      <span class="icon">📍</span><span class="label">Plats:</span> ${e['Plats']}
                      <span class="icon" style="margin-left: 2rem;">🏷</span><span class="label">Typ:</span> ${e['Typ av händelse']}
                    </div>

                    <div class="event-line">
                      <span class="icon">📅</span><span class="label">Period:</span> ${e['Datum från']} – ${e['Datum till']}
                    </div>

                    ${samlingHTML}

                    <div class="event-line">
                      <span class="icon">🏫</span><span class="label">Ledig från skolan:</span> ${e['Ledig från skolan?']}
                    </div>

                    <div class="event-line">
                      <span class="icon">💰</span><span class="label">Kostnad:</span> ${e['Kostnad per spelare']}
                    </div>

                    <div class="event-line">
                      <span class="icon">🚗</span><span class="label">Färdsätt:</span> ${e['Färdsätt'] || ''}
                    </div>

                    ${hemsidaUrl}
                    ${bilderHtml}
                  `;

                  groupDiv.appendChild(card);
                });

                container.appendChild(groupDiv);
              });
            }

            renderGrouped(upcomingGrouped, container);

            if (Object.keys(pastGrouped).length > 0) {
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

              renderGrouped(pastGrouped, pastWrapper, true);
            }
          }

          function updateFiltersAndRender() {
            updateFiltersAndRender = updateFiltersAndRender || function() {};
            const selectedSeason = seasonSelect.value;
            const selectedType = typeSelect.value;
            const selectedPlace = placeSelect.value;

            // Uppdatera filterval baserat på andra filter
            const filteredForSeason = events.filter(e =>
              (!selectedType || selectedType === '' || e['Typ av händelse'] === selectedType) &&
              (!selectedPlace || selectedPlace === '' || e['Plats'] === selectedPlace)
            );
            updateSelectOptions(seasonSelect, [...new Set(filteredForSeason.map(e => e['Säsong']))].sort().reverse(), selectedSeason, 'Alla säsonger');

            const filteredForType = events.filter(e =>
              (!selectedSeason || selectedSeason === '' || e['Säsong'] === selectedSeason) &&
              (!selectedPlace || selectedPlace === '' || e['Plats'] === selectedPlace)
            );
            updateSelectOptions(typeSelect, [...new Set(filteredForType.map(e => e['Typ av händelse']))].sort(), selectedType, 'Alla typer');

            const filteredForPlace = events.filter(e =>
              (!selectedSeason || selectedSeason === '' || e['Säsong'] === selectedSeason) &&
              (!selectedType || selectedType === '' || e['Typ av händelse'] === selectedType)
            );
            updateSelectOptions(placeSelect, [...new Set(filteredForPlace.map(e => e['Plats']))].sort(), selectedPlace, 'Alla platser');

            renderEvents();
          }

          // Initiera första rendering och filteruppdatering
          updateFiltersAndRender();
        }
      });
    });
}

document.addEventListener("DOMContentLoaded", loadEvents);
