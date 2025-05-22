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

            const detailsId = `details-${key}`;

            expandCell.innerHTML = `
              <details>
              <details id="${detailsId}">
                <summary style="display: flex; justify-content: space-between; align-items: center; background-color: #f0f4f8; padding: 0.6rem 1rem; font-weight: bold; border-radius: 6px; margin-bottom: 0.5rem; cursor: pointer;">
                  <span>📅 ${g.year} – ${g.monthName}</span>
                  <span style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="toggle-icon" style="font-weight: bold; font-size: 1.2rem;">＋</span> 📅 ${g.year} – ${g.monthName}
                  </span>
                  <span>${g.events.length} händelse${g.events.length > 1 ? 'r' : ''}, <strong>${g.total.toFixed(0)} kr</strong></span>
                </summary>
                <table style="width: 100%; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 6px; overflow: hidden;">
@@ -106,9 +111,21 @@
          totalDiv.style.fontWeight = 'bold';
          totalDiv.innerHTML = `Totalt: ${total.toFixed(0)} kr`;
          container.appendChild(totalDiv);

          // Toggle +/− symbol
          document.querySelectorAll('details').forEach(detail => {
            const icon = detail.querySelector('.toggle-icon');
            detail.addEventListener('toggle', () => {
              if (detail.open) {
                icon.textContent = '−';
              } else {
                icon.textContent = '＋';
              }
            });
          });
        }
      });
    });
}

document.addEventListener('DOMContentLoaded', loadBudget);
