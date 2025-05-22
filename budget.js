const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwy0b0RMcUXo3xguOtukMryHNlYnebQdskaIWHXr3POx7fg9NfUHsMTGjOlDnkOJZybrWZ7r36NfB1/pub?output=csv';

function parseKostnad(kostnadStr) {
  if (!kostnadStr) return 0;
  return parseFloat(
    kostnadStr
      .replace(/\s/g, '')       // Ta bort alla mellanslag
      .replace('kr', '')        // Ta bort "kr"
      .replace(',', '.')        // Byt komma till punkt
  ) || 0;
}

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
            const month = e['Månadsnummer']?.padStart(2, '0');
            const monthName = e['Månadsnamn'];
            const key = `${year}-${month}`;
            const kostnad = parseKostnad(e['Kostnad per spelare']);

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
            summary.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.25rem 0;">
                <div><strong>${g.year} – ${g.monthName}</strong></div>
                <div>${g.events.length} händelse${g.events.length > 1 ? 'r' : ''}, <strong>${g.total.toFixed(0)} kr</strong></div>
              </div>
            `;
            details.appendChild(summary);

            const ul = document.createElement('ul');
            ul.className = 'budget-event-list';
            ul.style.marginLeft = '1rem';

            g.events.forEach(ev => {
              const li = document.createElement('li');
              li.style.marginBottom = '0.5rem';
              li.innerHTML = `
                <strong>${ev.namn}</strong><br>
                <span style="color: #555;">📅 ${ev.datum} | 📍 ${ev.plats} | 💰 ${ev.kostnad.toFixed(0)} kr</span>
              `;
              ul.appendChild(li);
            });

            details.appendChild(ul);
            container.appendChild(details);
          });

          const totalDiv = document.createElement('div');
          totalDiv.className = 'budget-total';
          totalDiv.style.marginTop = '1rem';
          totalDiv.style.fontSize = '1.2rem';
          totalDiv.style.fontWeight = 'bold';
          totalDiv.innerHTML = `Totalt: ${total.toFixed(0)} kr`;
          container.appendChild(totalDiv);
        }
      });
    });
}

document.addEventListener('DOMContentLoaded', loadBudget);
