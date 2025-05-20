
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

          // Dagens datum i YYYY-MM-DD-format
          const todayStr = new Date().toISOString().split("T")[0];

          events.sort((a, b) => new Date(a['Datum från']) - new Date(b['Datum från']));

          const grouped = {};
          events.forEach(e => {
            const year = e['År'];
            const monthNum = e['Månadsnummer'].padStart(2, '0');
            const monthName = e['Månadsnamn'];
            const key = `${year}-${monthNum}`;
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

          let hasOld = false;
          const futureWrapper = document.createElement('div');
          const pastWrapper = document.createElement('div');
          pastWrapper.style.display = "none";

          Object.keys(grouped)
            .sort()
            .forEach(key => {
              const { namn, år, data } = grouped[key];
              const groupDiv = document.createElement('div');
              groupDiv.className = 'event-group';
              groupDiv.innerHTML = `<h2>📅 ${år} – ${namn}</h2>`;

              let isPastGroup = true;

              data.forEach(e => {
                const endDateStr = (e['Datum till'] || e['Datum från']).split(" ")[0]; // strip tid
                const isFuture = endDateStr >= todayStr;
                if (isFuture) isPastGroup = false;

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

              if (isPastGroup) {
                hasOld = true;
                pastWrapper.appendChild(groupDiv);
              } else {
                futureWrapper.appendChild(groupDiv);
              }
            });

          container.appendChild(futureWrapper);

          if (hasOld) {
            const toggleBtn = document.createElement('button');
            toggleBtn.textContent = "Visa tidigare händelser";
            toggleBtn.onclick = () => {
              pastWrapper.style.display = pastWrapper.style.display === "none" ? "block" : "none";
              toggleBtn.textContent = pastWrapper.style.display === "none" ? "Visa tidigare händelser" : "Dölj tidigare händelser";
            };
            container.appendChild(toggleBtn);
            container.appendChild(pastWrapper);
          }
        }
      });
    });
}

document.addEventListener("DOMContentLoaded", loadEvents);
