
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
            const key = `${e['År']}_${e['Månadsnummer'].padStart(2, '0')}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(e);
          });

          const container = document.getElementById('event-container');
          Object.keys(grouped)
            .sort()
            .forEach(monthKey => {
              const [year, month] = monthKey.split('_');
              const groupDiv = document.createElement('div');
              groupDiv.className = 'event-group';
              groupDiv.innerHTML = `<h2>📅 ${month} – ${year}</h2>`;

              grouped[monthKey].forEach(e => {
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
