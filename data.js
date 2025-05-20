
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwy0b0RMcUXo3xguOtukMryHNlYnebQdskaIWHXr3POx7fg9NfUHsMTGjOlDnkOJZybrWZ7r36NfB1/pub?output=csv';

function loadEvents() {
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
            const month = e['Månadsnummer'].padStart(2, '0');
            const namn = e['Månadsnamn'];
            const key = `${year}-${month}`;
            if (!grouped[key]) grouped[key] = { år: year, namn: namn, data: [] };
            grouped[key].data.push(e);
          });

          const container = document.getElementById('event-container');
          Object.keys(grouped)
            .sort()
            .forEach(key => {
              const { år, namn, data } = grouped[key];
              const groupDiv = document.createElement('div');
              groupDiv.className = 'event-group';
              groupDiv.innerHTML = `<h2>📅 ${år} – ${namn}</h2>`;

              data.forEach(e => {
                const card = document.createElement('div');
                card.className = 'event-card';
                card.innerHTML = `
                  <strong>${e['Namn på händelse']}</strong><br>
                  📍 ${e['Plats']} | 🏷 ${e['Typ av händelse']}<br>
                  📅 ${e['Datum från']} – ${e['Datum till']}<br>
                  ⏰ ${e['Samling Härnösand'] || ''} ${e['Samling på plats'] || ''}<br>
                  🏫 Ledig från skolan: ${e['Ledig från skolan?']}<br>
                  💰 Kostnad: ${e['Kostnad per spelare']}
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
