const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwy0b0RMcUXo3xguOtukMryHNlYnebQdskaIWHXr3POx7fg9NfUHsMTGjOlDnkOJZybrWZ7r36NfB1/pub?output=csv';

function parseKostnad(kostnadStr) {
  if (!kostnadStr) return 0;
  return parseFloat(
    kostnadStr
      .replace(/\s/g, '')
      .replace('kr', '')
      .replace(',', '.')
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
          const table = document.createElement('div');
          table.className = 'budget-table';

          Object.keys(grouped).sort().forEach(key => {
            const g = grouped[key];

            const details = document.createElement('details');
            details.className = 'budget-details';

            const summary = document.createElement('summary');
            summary.className = 'budget-summary';
            summary.innerHTML = `
              <span class="toggle-icon">＋</span>
              <span class="budget-label">📅 ${g.year} – ${g.monthName}</span>
              <span class="budget-value">${g.events.length} händelse${g.events.length > 1 ? 'r' : ''}, <strong>${g.total.toLocaleString('sv-SE')} kr</strong></span>
            `;
            details.appendChild(summary);

            const innerTable = document.createElement('table');
            innerTable.className = 'budget-inner-table';

            const thead = document.createElement('thead');
            thead.innerHTML = `
              <tr>
                <th>Händelse</th>
                <th>Datum</th>
                <th>Plats</th>
                <th>Kostnad</th>
              </tr>`;
            innerTable.appendChild(thead);

            const tbody = document.createElement('tbody');
            g.events.forEach(ev => {
              const row = document.createElement('tr');
              row.innerHTML = `
                <td data-label="Händelse">${ev.namn}</td>
                <td data-label="Datum">📅 ${ev.datum}</td>
                <td data-label="Plats">📍 ${ev.plats}</td>
                <td data-label="Kostnad">💰 ${ev.kostnad.toLocaleString('sv-SE')} kr</td>`;
              tbody.appendChild(row);
            });
            innerTable.appendChild(tbody);
            details.appendChild(innerTable);

            table.appendChild(details);
          });

          container.appendChild(table);

          const totalDiv = document.createElement('div');
          totalDiv.className = 'budget-total';
          totalDiv.innerHTML = `Totalt: ${total.toLocaleString('sv-SE'))} kr`;
          container.appendChild(totalDiv);

          document.querySelectorAll('.budget-details summary').forEach(summary => {
            const icon = summary.querySelector('.toggle-icon');
            const details = summary.parentElement;
            summary.addEventListener('click', () => {
              setTimeout(() => {
                icon.textContent = details.open ? '−' : '＋';
              }, 10);
            });
          });
        }
      });
    });
}

document.addEventListener('DOMContentLoaded', loadBudget);
