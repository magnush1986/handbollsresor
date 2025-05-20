
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwy0b0RMcUXo3xguOtukMryHNlYnebQdskaIWHXr3POx7fg9NfUHsMTGjOlDnkOJZybrWZ7r36NfB1/pub?output=csv';

fetch(SHEET_URL)
  .then(response => response.text())
  .then(csv => {
    const rows = csv.trim().split("\n").map(row => row.split(","));
    const headers = rows.shift();
    const events = rows.map(row => {
      const obj = {};
      headers.forEach((key, i) => obj[key.trim()] = row[i]?.trim());
      return obj;
    });

    // sortera efter Datum från
    events.sort((a, b) => new Date(a['Datum från']) - new Date(b['Datum från']));

    const grouped = {};
    events.forEach(e => {
      const key = `${e['Månad3']} ${e['År']}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });

    const container = document.getElementById('event-container');
    Object.keys(grouped).sort().forEach(month => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'event-group';
      groupDiv.innerHTML = `<h2>📅 ${month}</h2>`;

      grouped[month].forEach(e => {
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
  });
