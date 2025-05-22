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
              <details>
                <summary style="display: flex; justify-content: space-between; align-items: center; background-color: #f0f4f8; padding: 0.6rem 1rem; font-weight: bold; border-radius: 6px; margin-bottom: 0.5rem; cursor: pointer;">
                  <span>📅 ${g.year} – ${g.monthName}</span>
                  <span>${g.events.length} händelse${g.events.length > 1 ? 'r' : ''}, <strong>${g.total.toFixed(0)} kr</strong></span>
                </summary>
                <table style="width: 100%; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 6px; overflow: hidden;">
                  <thead style="background-color: #fafafa; font-weight: bold;">
                    <tr>
                      <td style="padding: 0.5rem 1rem;">Händelse</td>
                      <td style="padding: 0.5rem 1rem;">Datum</td>
                      <td style="padding: 0.5rem 1rem;">Plats</td>
                      <td style="padding: 0.5rem 1rem;">Kostnad</td>
                    </tr>
                  </thead>
                  <tbody>
                    ${g.events.map(ev => `
                      <tr style="border-top: 1px solid #eee;">
                        <td style="padding: 0.5rem 1rem;">${ev.namn}</td>
                        <td style="padding: 0.5rem 1rem; color: #555;">📅 ${ev.datum}</td>
                        <td style="padding: 0.5rem 1rem; color: #555;">📍 ${ev.plats}</td>
                        <td style="padding: 0.5rem 1rem; color: #555;">💰 ${ev.kostnad.toFixed(0)} kr</td>
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
        }
      });
    });
}

document.addEventListener('DOMContentLoaded', loadBudget);
