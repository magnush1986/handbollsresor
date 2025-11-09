const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRjWqqqO7FHa-re2G6iIemdPD12hUJK15z2InQoSUIhZ08Szlg_tO8muapx6cAGVYF6egrltGC60tuE/pub?output=csv';

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
const selectedTypes = new Set();

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
          let placeSelect = document.getElementById('place-filter');
          let schoolSelect = document.getElementById('school-filter');

          // --- Bygg filter-UI om det inte redan finns
          if (!seasonSelect || !placeSelect || !schoolSelect || !document.getElementById('type-filter')) {
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
            const currentSeason = getCurrentSeason();
            seasonSelect.value = allSeasons.includes(currentSeason) ? currentSeason : '';

            // --- FLERVAL Typ (checkboxpanel likt Gantt)
            const typeWrapper = document.createElement('div');
            typeWrapper.id = 'type-filter';
            typeWrapper.className = 'type-multiselect';

            const typeLabel = document.createElement('label');
            typeLabel.textContent = 'Typ:';
            typeLabel.setAttribute('for', 'type-filter');

            const typeButton = document.createElement('button');
            typeButton.type = 'button';
            typeButton.className = 'type-ms-button';
            typeButton.textContent = 'Typ (alla)';
            typeButton.setAttribute('aria-expanded', 'false');

            const typePanel = document.createElement('div');
            typePanel.className = 'type-ms-panel';
            typePanel.hidden = true;

            const typeList = document.createElement('div');
            typeList.className = 'type-ms-list';
            typePanel.appendChild(typeList);

            const actions = document.createElement('div');
            actions.className = 'type-ms-actions';
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.textContent = 'Rensa val';
            actions.appendChild(clearBtn);
            typePanel.appendChild(actions);

            typeWrapper.appendChild(typeButton);
            typeWrapper.appendChild(typePanel);

            function updateTypeButtonText() {
              if (selectedTypes.size === 0) {
                typeButton.textContent = 'Typ (alla)';
              } else if (selectedTypes.size === 1) {
                typeButton.textContent = `Typ (${Array.from(selectedTypes)[0]})`;
              } else {
                typeButton.textContent = `Typ (${selectedTypes.size} val)`;
              }
            }

            function rebuildTypeOptions() {
              const selectedSeason = seasonSelect.value;
              const selectedSchool = schoolSelect?.value || '';

              // Filtrera kandidater för Typ baserat på säsong + skola
              const filteredForTypes = allEvents
                .filter(e => (!selectedSeason || e['Säsong'] === selectedSeason))
                .filter(e => (!selectedSchool || (e['Ledig från skolan?']?.toLowerCase() === selectedSchool)));

              const uniqueTypes = [...new Set(filteredForTypes.map(e => e['Typ av händelse']).filter(Boolean))].sort();

              // Rensa bort val som inte längre finns
              for (const t of Array.from(selectedTypes)) {
                if (!uniqueTypes.includes(t)) selectedTypes.delete(t);
              }

              typeList.innerHTML = '';
              uniqueTypes.forEach(type => {
                const id = `type-${type.replace(/\s+/g, '_')}`;
                const row = document.createElement('label');
                row.className = 'type-ms-row';
                row.htmlFor = id;

                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.id = id;
                cb.value = type;
                cb.checked = selectedTypes.has(type);
                cb.addEventListener('change', () => {
                  if (cb.checked) selectedTypes.add(type);
                  else selectedTypes.delete(type);
                  updateTypeButtonText();
                  rebuildPlaceOptions(); // kaskad mot plats
                  loadFilteredEvents();  // render
                });

                const span = document.createElement('span');
                span.textContent = type;

                row.appendChild(cb);
                row.appendChild(span);
                typeList.appendChild(row);
              });

              updateTypeButtonText();
            }

            typeButton.addEventListener('click', () => {
              const open = typePanel.hidden;
              typePanel.hidden = !open;
              typeButton.setAttribute('aria-expanded', String(open));
            });

            document.addEventListener('click', (e) => {
              if (!typeWrapper.contains(e.target)) {
                typePanel.hidden = true;
                typeButton.setAttribute('aria-expanded', 'false');
              }
            });

            clearBtn.addEventListener('click', () => {
              selectedTypes.clear();
              rebuildTypeOptions();
              rebuildPlaceOptions();
              loadFilteredEvents();
            });

            // Plats
            placeSelect = document.createElement('select');
            placeSelect.id = 'place-filter';
            const placeLabel = document.createElement('label');
            placeLabel.textContent = 'Plats:';
            placeLabel.setAttribute('for', 'place-filter');

            // Ledig från skolan
            schoolSelect = document.createElement('select');
            schoolSelect.id = 'school-filter';
            const schoolLabel = document.createElement('label');
            schoolLabel.textContent = 'Ledig från skolan:';
            schoolLabel.setAttribute('for', 'school-filter');

            const allSchoolOption = document.createElement('option');
            allSchoolOption.value = '';
            allSchoolOption.textContent = 'Alla';
            schoolSelect.appendChild(allSchoolOption);
            ['Ja', 'Nej'].forEach(val => {
              const option = document.createElement('option');
              option.value = val.toLowerCase();
              option.textContent = val;
              schoolSelect.appendChild(option);
            });

            function addFilter(wrapper, label, control) {
              const filterDiv = document.createElement('div');
              filterDiv.className = 'filter-item';
              filterDiv.appendChild(label);
              filterDiv.appendChild(control);
              wrapper.appendChild(filterDiv);
            }

            addFilter(filterWrapper, seasonLabel, seasonSelect);
            addFilter(filterWrapper, typeLabel, typeWrapper);
            addFilter(filterWrapper, placeLabel, placeSelect);
            addFilter(filterWrapper, schoolLabel, schoolSelect);
            container.before(filterWrapper);

            function rebuildPlaceOptions() {
              const selectedSeason = seasonSelect.value;
              const selectedSchool = schoolSelect.value;
              const typesArr = Array.from(selectedTypes);

              const filteredForPlaces = allEvents.filter(e =>
                (!selectedSeason || e['Säsong'] === selectedSeason) &&
                (typesArr.length === 0 || typesArr.includes(e['Typ av händelse'])) &&
                (!selectedSchool || (e['Ledig från skolan?']?.toLowerCase() === selectedSchool))
              );

              const allPlaces = [...new Set(filteredForPlaces.map(e => e['Plats']).filter(Boolean))].sort();

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
            }

            // Exponera så vi kan använda i andra funktioner
            window.__rebuildTypeOptions = rebuildTypeOptions;
            window.__rebuildPlaceOptions = rebuildPlaceOptions;

            // Initiera beroenden
            rebuildTypeOptions();
            rebuildPlaceOptions();

            // Lyssnare
            seasonSelect.addEventListener('change', () => {
              rebuildTypeOptions();
              rebuildPlaceOptions();
              loadFilteredEvents();
            });
            schoolSelect.addEventListener('change', () => {
              rebuildTypeOptions();
              rebuildPlaceOptions();
              loadFilteredEvents();
            });
            placeSelect.addEventListener('change', loadFilteredEvents);
          }

          updateFiltersAndRender();
        }
      });
    });
}

function updateFiltersAndRender() {
  // Kaskad för Typ hanteras redan i rebuildTypeOptions() när säsong/skola ändras.
  // Här uppdaterar vi bara Plats och render.
  if (typeof window.__rebuildPlaceOptions === 'function') {
    window.__rebuildPlaceOptions();
  }
  loadFilteredEvents();
}

function loadFilteredEvents() {
  const seasonSelect = document.getElementById('season-filter');
  const placeSelect = document.getElementById('place-filter');
  const href = window.location.href.toLowerCase();
  const isLedigt = href.includes("ledig.html");
  const selectedSeason = seasonSelect.value;
  const selectedPlace = placeSelect.value;
  const currentSeason = getCurrentSeason();
  const todayDate = getEffectiveToday().toISOString().split("T")[0];
  const schoolSelect = document.getElementById('school-filter');
  const selectedSchool = schoolSelect.value;
  const typesArr = Array.from(selectedTypes); // tom => alla

  const filtered = allEvents.filter(e =>
    (!selectedSeason || e['Säsong'] === selectedSeason) &&
    (typesArr.length === 0 || typesArr.includes(e['Typ av händelse'])) &&
    (!selectedPlace || e['Plats'] === selectedPlace) &&
    (!selectedSchool || (e['Ledig från skolan?']?.toLowerCase() === selectedSchool))
  );

  const container = document.getElementById('event-container');
  container.innerHTML = '';

  let firstEventRendered = false;

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
      groupDiv.innerHTML = `<h2>🗓️ ${group.year} – ${group.name}</h2>`;
      group.data
      .sort((a, b) => new Date(a['Datum från']) - new Date(b['Datum från']))
      .forEach(e => {
        renderEventCard(e, groupDiv, !firstEventRendered);
        firstEventRendered = true;
      });
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
      renderGroup(`🗓️ ${season}`, groupedBySeason[season], container);
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

function renderEventCard(e, target, isFirst = false) {
  const card = document.createElement('details');
  card.className = 'event-card';
  if (isFirst) card.open = true;

  const summary = document.createElement('summary');
  summary.className = 'event-title';
  summary.innerHTML = `
    <span class="summary-text">${e['Namn på händelse']}</span>
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

  const boendeLänk = e["Länk till boendes hemsida"]?.trim();
  const boendeLänkHtml = (boendeLänk && boendeLänk.startsWith("http"))
    ? `<div class="event-line">🌐 <a href="${boendeLänk}" target="_blank">Länk till boendets hemsida</a></div>`
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

  const sistaBetalningsdag = e['Sista betalningsdag']?.trim();
  const sistaBetalningsdagHtml = sistaBetalningsdag
    ? `<div class="event-line"><span class="icon">⏳</span><span class="label">Sista betalningsdag:</span> <span class="value">${sistaBetalningsdag}</span></div>`
    : "";
  
  const betalningsmottagare = e['Betalningsmottagare']?.trim();
  const betalningsmottagareHtml = betalningsmottagare
    ? `<div class="event-line"><span class="icon">🏦</span><span class="label">Betalningsmottagare:</span> <span class="value">${betalningsmottagare}</span></div>`
    : "";
  
  const färdsätt = e['Färdsätt']?.trim();
  const färdsättHtml = färdsätt
    ? `<div class="event-line"><span class="icon">🚗</span><span class="label">Färdsätt:</span> <span class="value">${färdsätt}</span></div>`
    : "";
  
  const ledigFrånSkolan = e['Ledig från skolan?']?.trim().toLowerCase();
  let ledigFrånSkolanHtml = '';
  
  if (ledigFrånSkolan === 'ja') {
    ledigFrånSkolanHtml = `<div class="event-line">
      <span class="icon">✅</span>
      <span class="label">Ledig från skolan:</span>
      <span class="value">Ja</span>
    </div>`;
  } else if (ledigFrånSkolan === 'nej') {
    ledigFrånSkolanHtml = `<div class="event-line">
      <span class="icon">❌</span>
      <span class="label">Ledig från skolan:</span>
      <span class="value">Nej</span>
    </div>`;
  }

  const adress = e['Adress till boende']?.trim();
  const adressTillBoendeHtml = adress
  ? `<div class="event-line adress-line">
       <div class="main-row">
         <span class="icon">📬</span>
         <span class="label">Adress till boende:</span>
         <span class="value">${adress}</span>
       </div>
       <div class="maps-links">
         <br><span class="google-link"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adress)}" target="_blank">Visa på Google Maps</a></span><br>
         <span class="google-link"><a href="https://maps.apple.com/?q=${encodeURIComponent(adress)}" target="_blank">Visa på Apple Kartor</a></span>
       </div>
     </div>`
  : "";

  const övrigInformation = e['Övrig information']?.trim();
  const övrigInformationHtml = övrigInformation
    ? `<div class="event-line long-text">
        <span class="icon">🗒️</span>
        <span class="value">${övrigInformation}</span>
      </div>`
    : "";

  contentDiv.innerHTML = `
    <div class="event-section">
      <h3>Grundläggande info</h3>
      <div class="event-line"><span class="icon">🏷️</span><span class="label">Typ:</span> <span class="value">${e['Typ av händelse']}</span></div>
      <div class="event-line"><span class="icon">📍</span><span class="label">Plats:</span> <span class="value">${e['Plats']}</span></div>
      <div class="event-line"><span class="icon">🗓️</span><span class="label">Period:</span> <span class="value">${e['Datum från']} – ${e['Datum till']}</span></div>
      ${övrigInformationHtml}
    </div>
    ${ (ledigFrånSkolanHtml || ledighetHtml) ? `
    <div class="event-section">
      <h3>Ledig från skolan</h3>
      ${ledigFrånSkolanHtml}
      ${ledighetHtml}
    </div>` : '' }
    ${ (kostnadHtml || sistaBetalningsdagHtml || betalningsmottagareHtml) ? `
    <div class="event-section">
      <h3>Kostnader</h3>
      ${kostnadHtml}
      ${sistaBetalningsdagHtml}
      ${betalningsmottagareHtml}
    </div>` : '' }
    ${ (samlingHTML || resvägHtml || färdsättHtml) ? `
    <div class="event-section">
      <h3>Resan</h3>
      ${samlingHTML}
      ${resvägHtml}
      ${färdsättHtml}
    </div>` : '' }
    ${ (typAvBoendeHtml || namnPåBoendeHtml || tillgångTillBoendeHtml || adressTillBoendeHtml) ? `
    <div class="event-section">
      <h3>Boende</h3>
      ${typAvBoendeHtml}
      ${namnPåBoendeHtml}
      ${tillgångTillBoendeHtml}
      ${adressTillBoendeHtml}
    </div>` : '' }
    ${ (hemsidaUrl || bilderHtml || boendeLänkHtml) ? `
    <div class="event-section">
      <h3>Länkar</h3>
      ${hemsidaUrl}
      ${bilderHtml}
      ${boendeLänkHtml}
    </div>` : '' }
  `;

  card.appendChild(contentDiv);
  target.appendChild(card);
}

document.addEventListener("DOMContentLoaded", loadEvents);
