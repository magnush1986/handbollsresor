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

function getCurrentSeason() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  // 🟡 Undantag: Maj–december 2025 ska visa nästa säsong
  if (year === 2025 && month >= 5) {
    return '2025-2026';
  }

  return month >= 7
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
}

function loadBudget() {
  fetch(SHEET_URL)
    .then(response => response.text())
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          const data = results.data;
          const container = document.getElementById('budget-container');
          container.innerHTML = ''; // rensa tidigare innehåll

          let seasonSelect = document.getElementById('season-filter');
          let typeSelect = document.getElementById('type-filter');
          const currentSeason = getCurrentSeason();

          if (!seasonSelect || !typeSelect) {
            const wrapper = document.createElement('div');
            wrapper.className = 'season-filter-wrapper';

            // Säsong
            seasonSelect = document.createElement('select');
            seasonSelect.id = 'season-filter';
            const seasonLabel = document.createElement('label');
            seasonLabel.textContent = 'Säsong:';
            seasonLabel.setAttribute('for', 'season-filter');

            const seasons = [...new Set(data.map(e => e['Säsong']))].sort().reverse();
            seasons.forEach(season => {
              const option = document.createElement('option');
              option.value = season;
              option.textContent = season;
              if (season === currentSeason) option.selected = true;
              seasonSelect.appendChild(option);
            });

            // Typ av händelse
            typeSelect = document.createElement('select');
            typeSelect.id = 'type-filter';
            const typeLabel = document.createElement('label');
            typeLabel.textContent = 'Typ:';
            typeLabel.setAttribute('for', 'type-filter');

            const types = [...new Set(data.map(e => e['Typ av händelse']))].sort();
            const allOption = document.createElement('option');
            allOption.value = '';
            allOption.textContent = 'Alla typer';
            typeSelect.appendChild(allOption);
            types.forEach(type => {
              const option = document.createElement('option');
              option.value = type;
              option.textContent = type;
              typeSelect.appendChild(option);
            });

            wrapper.appendChild(seasonLabel);
            wrapper.appendChild(seasonSelect);
            wrapper.appendChild(typeLabel);
            wrapper.appendChild(typeSelect);
            container.before(wrapper);

            seasonSelect.addEventListener('change', loadBudget);
            typeSelect.addEventListener('change', loadBudget);
          }

          const selectedSeason = seasonSelect.value;
          const selectedType = typeSelect.value;

          const grouped = {};
          let total = 0;

          data
            .filter(e =>
              e['Säsong'] === selectedSeason &&
              (!selectedType || e['Typ av händelse'] === selectedType)
            )
            .forEach(e => {
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
              <div class="summary-block">
                <div class="row-1">
                  <span class="summary-icon">📅</span>
                  <span class="budget-label">${g.year} – ${g.monthName}</span>
                </div>
                <div class="budget-value">
                  ${g.events.length} händelse${g.events.length > 1 ? 'r' : ''}&nbsp;
                  <strong>${g.total.toLocaleString('sv-SE')} kr</strong>
                </div>
              </div>
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
                <td data-label="Kostnad">💰 ${ev.kostnad.toLocaleString('sv-SE')} kr</td>
              `;
              tbody.appendChild(row);
            });
            innerTable.appendChild(tbody);
            details.appendChild(innerTable);

            table.appendChild(details);
          });

          container.appendChild(table);

          const totalDiv = document.createElement('div');
          totalDiv.className = 'budget-total';
          totalDiv.innerHTML = `Totalt: ${total.toLocaleString('sv-SE')} kr`;
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
