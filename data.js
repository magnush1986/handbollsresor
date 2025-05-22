const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwy0b0RMcUXo3xguOtukMryHNlYnebQdskaIWHXr3POx7fg9NfUHsMTGjOlDnkOJZybrWZ7r36NfB1/pub?output=csv';

function loadEvents() {
  const href = window.location.href.toLowerCase();
  const isUSM = href.includes("usm.html");
  const isCup = href.includes("cup.html");
  const isLedigt = href.includes("ledig.html");
  const today = new Date().toISOString().split("T")[0];

  fetch(SHEET_URL)
    .then(response => response.text())
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          const events = results.data;
          const container = document.getElementById('event-container');
          container.innerHTML = ''; // Rensa tidigare innehåll

          // Skapa filter-element om de inte redan finns
          let seasonSelect = document.getElementById('season-filter');
          let typeSelect = document.getElementById('type-filter');
          let placeSelect = document.getElementById('place-filter');

          if (!seasonSelect || !typeSelect || !placeSelect) {
            const filterWrapper = document.createElement('div');
            filterWrapper.className = 'event-filter-wrapper';

            // Säsong
            seasonSelect = document.createElement('select');
            seasonSelect.id = 'season-filter';
            const seasonLabel = document.createElement('label');
            seasonLabel.textContent = 'Säsong:';
            seasonLabel.setAttribute('for', 'season-filter');

            const seasons = [...new Set(events.map(e => e['Säsong']))].sort().reverse();
            seasons.forEach(season => {
              const option = document.createElement('option');
              option.value = season;
              option.textContent = season;
              seasonSelect.appendChild(option);
            });

            // Typ av händelse
            typeSelect = document.createElement('select');
            typeSelect.id = 'type-filter';
            const typeLabel = document.createElement('label');
            typeLabel.textContent = 'Typ:';
            typeLabel.setAttribute('for', 'type-filter');

            const types = [...new Set(events.map(e => e['Typ av händelse']))].sort();
            const allTypeOption = document.createElement('option');
            allTypeOption.value = '';
            allTypeOption.textContent = 'Alla typer';
            typeSelect.appendChild(allTypeOption);
            types.forEach(type => {
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

            const places = [...new Set(events.map(e => e['Plats']))].sort();
            const allPlaceOption = document.createElement('option');
            allPlaceOption.value = '';
            allPlaceOption.textContent = 'Alla platser';
            placeSelect.appendChild(allPlaceOption);
            places.forEach(place => {
              const option = document.createElement('option');
              option.value = place;
              option.textContent = place;
              placeSelect.appendChild(option);
            });

            // Lägg till i wrapper
            filterWrapper.appendChild(seasonLabel);
            filterWrapper.appendChild(seasonSelect);
            filterWrapper.appendChild(typeLabel);
            filterWrapper.appendChild(typeSelect);
            filterWrapper.appendChild(placeLabel);
            filterWrapper.appendChild(placeSelect);

            container.before(filterWrapper);

            // Eventlyssnare för filtrering
            [seasonSelect, typeSelect, placeSelect].forEach(select => {
              select.addEventListener('change', loadEvents);
            });
          }

          const selectedSeason = seasonSelect.value;
          const selectedType = typeSelect.value;
          const selectedPlace = placeSelect.value;

          // Gruppera händelser i upcoming och past
          const upcomingGrouped = {};
          const pastGrouped = {};

          events.forEach(e => {
            // Filtrera utifrån valda filter
            if (selectedSeason && e['Säsong'] !== selectedSeason) return;
            if (selectedType && selectedType !== '' && e['Typ av händelse'] !== selectedType) return;
            if (selectedPlace && selectedPlace !== '' && e['Plats'] !== selectedPlace) return;

            // Sida-specifik filtrering
            const typ = e['Typ av händelse']?.toLowerCase() || '';
            const ledighet = e['Ledig från skolan?']?.toLowerCase() || '';
            if (isUSM && typ !== 'usm') return;
            if (isCup && typ !== 'cup') return;
            if (isLedigt && !ledighet.includes('ja')) return;

            const year = e['År'];
            const monthNum = e['Månadsnummer'].padStart(2, '0');
            const monthName = e['Månadsnamn'];
            const key = `${year}-${monthNum}`;
            const groupEntry = { namn: monthName, år: year, data: [] };

            const slutdatumRaw = e['Datum till'] || e['Datum från'];
            const slutdatum = slutdatumRaw?.substring(0, 10) || "0000-00-00";
            const isPast = slutdatum < today;
            e._isPast = isPast;

            const target = isPast ? pastGrouped : upcomingGrouped;
            if (!target[key]) target[key] = { ...groupEntry, data: [] };
            target[key].data.push(e);
          });

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
                  ? `<br><strong>🔗 Hemsida:</strong> <a href="${länk}" target="_blank">${new URL(länk).hostname.replace("www.", "")}</a>`
                  : "";

                const bilderLänk = e["Länk till bilder"]?.trim();
                const bilderHtml = (bilderLänk && bilderLänk.startsWith("http"))
                  ? `<br>📷 <a href="${bilderLänk}" target="_blank">Se bilder</a>`
                  : "";

                let samlingHTML = '';
                const samlingH = e['Samling Härnösand']?.trim();
                const samlingP = e['Samling på plats']?.trim();

                if (samlingH && samlingP) {
                  samlingHTML = `
                    <strong><span class="icon">🚍</span><span class="label"> Samling Härnösand:</span></strong> ${samlingH}<br>
                    <strong><span class="icon">📍</span><span class="label"> Samling på plats:</span></strong> ${samlingP}<br>
                  `;
                } else if (samlingH) {
                  samlingHTML = `<strong><span class="icon">🚍</span><span class="label"> Samling Härnösand:</span></strong> ${samlingH}<br>`;
                } else if (samlingP) {
                  samlingHTML = `<strong><span class="icon">📍</span><span class="label"> Samling på plats:</span></strong> ${samlingP}<br>`;
                }

                card.innerHTML = `
                  <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 0.75rem;">
                    ${e['Namn på händelse']}
                  </div>
                  <strong><span class="icon">📍</span><span class="label"> Plats:</span></strong> ${e['Plats']} |
                  <strong><span class="icon">🏷</span><span class="label"> Typ:</span></strong> ${e['Typ av händelse']}<br>
                  <strong><span class="icon">📅</span><span class="label"> Period:</span></strong> ${e['Datum från']} – ${e['Datum till']}<br>
                  ${samlingHTML}
                  <strong><span class="icon">🏫</span><span class="label"> Ledig från skolan:</span></strong> ${e['Ledig från skolan?']}<br>
                  <strong><span class="icon">💰</span><span class="label"> Kostnad:</span></strong> ${e['Kostnad per spelare']}<br>
                  <strong><span class="icon">🚗</span><span class="label"> Färdsätt:</span></strong> ${e['Färdsätt'] || ''}<br>
                  ${hemsidaUrl}
                  ${bilderHtml}
                `;

                groupDiv.appendChild(card);
              });

              targetContainer.appendChild(groupDiv);
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
      });
    });
}

document.addEventListener("DOMContentLoaded", loadEvents);
