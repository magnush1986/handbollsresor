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

          const upcomingGrouped = {};
          const pastGrouped = {};

          events.forEach(e => {
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

          const container = document.getElementById('event-container');

          function renderGrouped(grouped, targetContainer) {
            Object.keys(grouped)
              .sort((a, b) => {
                const [ay, am] = a.split('-').map(Number);
                const [by, bm] = b.split('-').map(Number);
                return ay !== by ? ay - by : am - bm;
              })
              .forEach(key => {
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

                  // Samlingstider - separata rader
                  let samlingHTML = '';
                  const samlingH = e['Samling Härnösand']?.trim();
                  const samlingP = e['Samling på plats']?.trim();

                  if (samlingH && samlingP) {
                    samlingHTML = `
                      <span class="label">🚍 Samling Härnösand:</span> ${samlingH}<br>
                      <span class="label">📍 Samling på plats:</span> ${samlingP}<br>
                    `;
                  } else if (samlingH) {
                    samlingHTML = `<span class="label">🚍 Samling Härnösand:</span> ${samlingH}<br>`;
                  } else if (samlingP) {
                    samlingHTML = `<span class="label">📍 Samling på plats:</span> ${samlingP}<br>`;
                  }


                  card.innerHTML = `
                    <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 0.75rem;">
                      ${e['Namn på händelse']}
                    </div>
                    <span class="label">📍 Plats:</span> ${e['Plats']} |
                    <span class="label">🏷 Typ:</span> ${e['Typ av händelse']}<br>
                    <span class="label">📅 Period:</span> ${e['Datum från']} – ${e['Datum till']}<br>
                    ${samlingHTML}
                    <span class="label">🏫 Ledig från skolan:</span> ${e['Ledig från skolan?']}<br>
                    <span class="label">💰 Kostnad:</span> ${e['Kostnad per spelare']}<br>
                    <span class="label">🚗 Färdsätt:</span> ${e['Färdsätt'] || ''}<br>
                    ${hemsidaUrl}
                  `;


                  groupDiv.appendChild(card);
                });

                targetContainer.appendChild(groupDiv);
              });
          }

          // Rendera kommande direkt
          renderGrouped(upcomingGrouped, container);

          // Skapa collapsible box för tidigare händelser
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

            renderGrouped(pastGrouped, pastWrapper);
          }
        }
      });
    });
}

document.addEventListener("DOMContentLoaded", loadEvents);
