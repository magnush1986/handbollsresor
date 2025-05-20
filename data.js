// Bygger vidare exakt på v4-koden – med:
// - filtrering för USM/Cup/Ledig per URL
// - visa/dölj tidigare händelser (Datum till eller från < idag)
// - korrekt länk via Hemsida_URL

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

          events.sort((a, b) => new Date(a['Datum från']) - new Date(b['Datum från']));

          const grouped = {};
          events.forEach(e => {
            const year = e['År'];
            const monthNum = e['Månadsnummer'].padStart(2, '0');
            const monthName = e['Månadsnamn'];
            const key = `${year}-${monthNum}`;

            const typ = e['Typ av händelse']?.toLowerCase() || '';
            const ledighet = e['Ledig från skolan?']?.toLowerCase() || '';
            if (isUSM && typ !== 'usm') return;
            if (isCup && typ !== 'cup') return;
            if (isLedigt && !ledighet.includes('ja')) return;

            if (!grouped[key]) {
              grouped[key] = {
                namn: monthName,
                år: year,
                data: []
              };
            }
            grouped[key].data.push(e);
          });

          const container = document.getElementById('event-container');
          Object.keys(grouped)
            .sort()
            .forEach(key => {
              const { namn, år, data } = grouped[key];
              const groupDiv = document.createElement('div');
              groupDiv.className = 'event-group';
              groupDiv.innerHTML = `<h2>🗕️ ${år} – ${namn}</h2>`;

              data.forEach(e => {
                const card = document.createElement('div');
                card.className = 'event-card';

                const slutdatum = (e['Datum till'] || e['Datum från'])?.substring(0, 10);
                if (slutdatum < today) {
                  card.classList.add('past');
                  card.style.display = 'none';
                }

                card.innerHTML = `
                  <strong>${e['Namn på händelse']}</strong><br>
                  📍 ${e['Plats']} | 🏷 ${e['Typ av händelse']}<br>
                  🗓 ${e['Datum från']} – ${e['Datum till']}<br>
                  ⏰ ${e['Samling Härnösand'] || ''} ${e['Samling på plats'] || ''}<br>
                  🏫 Ledig från skolan: ${e['Ledig från skolan?']}<br>
                  💰 Kostnad: ${e['Kostnad per spelare']}<br>
                  🚗 Färdsätt: ${e['Färdsätt'] || ''}<br>
                  ${e["Hemsida_URL"] ? `🔗 <a href="${e["Hemsida_URL"]}" target="_blank">Mer info</a>` : ""}
                `;

                groupDiv.appendChild(card);
              });

              container.appendChild(groupDiv);
            });
        }
      });
    });
}

document.addEventListener("DOMContentLoaded", loadEvents);

function togglePast() {
  const past = document.querySelectorAll(".event-card.past");
  past.forEach(card => {
    card.style.display = card.style.display === "none" ? "block" : "none";
  });
}
