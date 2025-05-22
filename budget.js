const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwy0b0RMcUXo3xguOtukMryHNlYnebQdskaIWHXr3POx7fg9NfUHsMTGjOlDnkOJZybrWZ7r36NfB1/pub?output=csv';

function loadBudget() {
  fetch(SHEET_URL)
    .then(response => response.text())
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          const data = results.data;
          const grouped = {};
          let total = 0;

          data.forEach(e => {
            const year = e['År'];
            const month = e['Månadsnummer'].padStart(2, '0');
            const monthName = e['Månadsnamn'];
            const key = `${year}-${month}`;
            const kostnad = parseFloat(e['Kostnad per spelare']) || 0;

            if (!grouped[key]) {
              grouped[key] = {
                year,
                month,
                monthName,
                total: 0,
                events: []
              };
            }

            grouped[key].total += kostnad;
            grouped[key].events.push({
              namn: e['Namn på händelse'],
              datum: e['Datum från'],
              plats: e['Plats'],
              kostnad
            });

            total += kostnad;
          });

          const container = document.getElementById('budget-container');

          const sortedKeys = Object.keys(grouped).sort();
          sortedKeys.forEach(key => {
            const g = grouped[key];

            const details = document.createElement('details');
            details.className = 'budget-group';

            const summary = document.createElement('summary');
            summary.innerHTML = `<strong>${g.year} – ${g.monthName}</strong>: ${g.events.length} händelser, <strong>${g.total.toFixed(0)} kr</strong>`;
            details.appendChild(summary);

            const ul = document.createElement('ul');
            ul.className = 'budget-event-list';

            g.events.forEach(ev => {
              const li = document.createElement('li');
              li.innerHTML = `
                <strong>${ev.namn}</strong><br>
                📅 ${ev.datum} | 📍 ${ev.plats} | 💰 ${ev.kostnad.toFixed(0)} kr
              `;
              ul.appendChild(li);
            });

            details.appendChild(ul);
            container.appendChild(details);
          });

          const totalDiv = document.createElement('div');
          totalDiv.className = 'budget-total';
          totalDiv.innerHTML = `<strong>Totalt:</strong> ${total.toFixed(0)} kr`;
          container.appendChild(totalDiv);
        }
      });
    });
}

document.addEventListener('DOMContentLoaded', loadBudget);
