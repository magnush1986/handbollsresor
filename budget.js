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
          const table = document.createElement('table');
          table.className = 'budget-table';
          table.style.width = '100%';
          table.style.borderCollapse = 'collapse';

          Object.keys(grouped).sort().forEach(key => {
            const g = grouped[key];

            const tbody = document.createElement('tbody');
            const headerRow = document.createElement('tr');

            const expandCell = document.createElement('td');
            expandCell.colSpan = 3;
            expandCell.innerHTML = `
              <details class="budget-details">
                <summary class="budget-summary">
                  <span class="toggle-icon">＋</span>
                  <span>📅 ${g.year} – ${g.monthName}</span>
                  <span>${g.events.length} händelse${g.events.length > 1 ? 'r' : ''}, <strong>${g.total.toFixed(0)} kr</strong></span>
                </summary>
                <table class="budget-inner-table">
                  <thead>
                    <tr>
                      <td>Händelse</td>
                      <td>Datum</td>
                      <td>Plats</td>
                      <td>Kostnad</td>
                    </tr>
                  </thead>
                  <tbody>
                    ${g.events.map(ev => `
                      <tr>
                        <td>${ev.namn}</td>
                        <td>📅 ${ev.datum}</td>
                        <td>📍 ${ev.plats}</td>
                        <td>💰 ${ev.kostnad.toFixed(0)} kr</td>
                      </tr>`).join('')}
                  </tbody>
                </table>
              </details>
            `;

            headerRow.appendChild(expandCell);
            tbody.appendChild(headerRow);
            table.appendChild(tbody);
          });

          container.appendChild(table);

          const totalDiv = document.createElement('div');
          totalDiv.className = 'budget-total';
          totalDiv.style.marginTop = '1.5rem';
          totalDiv.style.fontSize = '1.3rem';
          totalDiv.style.fontWeight = 'bold';
          totalDiv.innerHTML = `Totalt: ${total.toFixed(0)} kr`;
          container.appendChild(totalDiv);

          // Ikonväxling
          document.querySelectorAll('.budget-details summary').forEach(summary => {
            const icon = summary.querySelector('.toggle-icon');
            if (!icon) return;
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
